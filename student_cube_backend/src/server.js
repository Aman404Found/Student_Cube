import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import connectDB from './config/db.js';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js'; 
import productRoutes from './routes/productRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import ambassadorRoutes from './routes/ambassadorRoutes.js';
import { getChatWithMessages, sendChatMessage } from './utils/chatService.js';
import { setRealtimeSender } from './utils/realtime.js';
import { createWebSocketMessageLimiter, pingLimiter } from './middlewares/rateLimitMiddleware.js';
import { startOfferExpiryJob } from './utils/cronService.js';

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// ES Modules __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 1. Compression Setup (Gzip)
app.use(compression());

// 2. CORS Setup
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://studentcube-1.vercel.app',
    process.env.CLIENT_URL // Dynamically allow the frontend URL set in Render
  ].filter(Boolean), 
  credentials: true,
}));


app.use(express.json());

app.use(helmet({
}));

if (process.env.ENABLE_HTTP_LOGS === 'true') {
  app.use(morgan('dev'));
}

app.get('/ping', pingLimiter, (req, res) => {
  res.send('ok');
});

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ambassador', ambassadorRoutes);

const server = http.createServer(app); 

// Plain WebSocket chat server. Clients connect with ws://host/ws/chat?token=JWT.
const chatRooms = new Map();
const userSockets = new Map();
const wss = new WebSocketServer({ server, path: '/ws/chat' });
const checkChatMessageLimit = createWebSocketMessageLimiter();

const sendJson = (ws, payload) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcastToOffer = (offerId, payload) => {
  const clients = chatRooms.get(offerId);
  if (!clients) return;

  clients.forEach((client) => sendJson(client, payload));
};

const sendToUser = (userId, payload) => {
  const clients = userSockets.get(String(userId));
  if (!clients) return;

  clients.forEach((client) => sendJson(client, payload));
};

setRealtimeSender(sendToUser);

wss.on('connection', async (ws, req) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const token = requestUrl.searchParams.get('token');

    if (!token) {
      sendJson(ws, { type: 'error', message: 'Missing auth token.' });
      return ws.close();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name email role');

    if (!user) {
      sendJson(ws, { type: 'error', message: 'User no longer exists.' });
      return ws.close();
    }

    ws.user = user;
    ws.offerIds = new Set();
    ws.userId = user._id.toString();

    if (!userSockets.has(ws.userId)) userSockets.set(ws.userId, new Set());
    userSockets.get(ws.userId).add(ws);
    sendJson(ws, { type: 'connected', scope: 'user' });

    ws.on('message', async (rawMessage) => {
      try {
        const payload = JSON.parse(rawMessage.toString());

        if (payload.type === 'join') {
          const offerId = String(payload.offerId || '');
          await getChatWithMessages(offerId, user._id);

          if (!chatRooms.has(offerId)) chatRooms.set(offerId, new Set());
          chatRooms.get(offerId).add(ws);
          ws.offerIds.add(offerId);

          sendJson(ws, { type: 'joined', offerId });
          return;
        }

        if (payload.type === 'message') {
          const rateCheck = checkChatMessageLimit(user._id);
          if (!rateCheck.allowed) {
            sendJson(ws, {
              type: 'error',
              message: 'Too many chat messages. Please slow down and try again shortly.',
              retryAfterMs: rateCheck.retryAfterMs,
            });
            return;
          }

          const offerId = String(payload.offerId || '');
          if (!ws.offerIds.has(offerId)) {
            await getChatWithMessages(offerId, user._id);
            if (!chatRooms.has(offerId)) chatRooms.set(offerId, new Set());
            chatRooms.get(offerId).add(ws);
            ws.offerIds.add(offerId);
          }

          const message = await sendChatMessage({
            offerId,
            senderId: user._id,
            text: payload.text,
            kind: payload.kind || 'CUSTOM',
            metadata: payload.metadata || {},
          });

          const messageEvent = {
            type: 'message',
            offerId,
            message: {
              ...message,
              clientMessageId: payload.clientMessageId,
              deliveryStatus: 'sent',
            },
          };

          // Room delivery is fast for an already-open chat. Participant-level
          // delivery also covers the brief period after a browser refresh when
          // its socket is connected but has not rejoined the room yet.
          broadcastToOffer(offerId, messageEvent);
          
          const senderId = message.sender._id || message.sender;
          const receiverId = message.receiver._id || message.receiver;

          sendToUser(senderId, messageEvent);
          sendToUser(receiverId, messageEvent);
          sendToUser(senderId, { type: 'chat_updated', offerId });
          sendToUser(receiverId, { type: 'chat_updated', offerId });
          sendToUser(receiverId, { type: 'unread_changed', offerId });
          return;
        }

        sendJson(ws, { type: 'error', message: 'Unknown WebSocket event.' });
      } catch (error) {
        sendJson(ws, {
          type: 'error',
          message: error.message || 'Unable to process chat message.',
        });
      }
    });

    ws.on('close', () => {
      const userClients = userSockets.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) userSockets.delete(ws.userId);
      }

      ws.offerIds.forEach((offerId) => {
        const clients = chatRooms.get(offerId);
        if (!clients) return;
        clients.delete(ws);
        if (clients.size === 0) chatRooms.delete(offerId);
      });
    });
  } catch (error) {
    sendJson(ws, { type: 'error', message: 'Invalid or expired token.' });
    ws.close();
  }
});

// Start Background Jobs
startOfferExpiryJob();

// Server Start
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
