import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Helper to fix malformed WS URLs from env vars
const getWsUrl = () => {
  let url = import.meta.env.VITE_WS_URL;
  if (!url) return "ws://localhost:5000/ws/chat";
  
  // Fix common copy-paste mistakes in env vars
  url = url.replace("wss://https://", "wss://");
  url = url.replace("ws://http://", "ws://");
  url = url.replace(".onrender.com.onrender.com", ".onrender.com");
  
  return url;
};

const WS_URL = getWsUrl();

const RealtimeBridge = () => {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    let isIntentionalClose = false;

    ws.onmessage = (event) => {
      if (isIntentionalClose) return;

      try {
        const payload = JSON.parse(event.data);

        if (['chat_updated', 'offer_updated', 'payment_updated', 'unread_changed'].includes(payload.type)) {
          window.dispatchEvent(new CustomEvent('student-cube-realtime', { detail: payload }));
        }

        if (['chat_updated', 'offer_updated', 'payment_updated', 'unread_changed'].includes(payload.type)) {
          window.dispatchEvent(new Event('student-cube-chat-read-change'));
        }
      } catch (error) {
        console.error('Invalid realtime event:', error);
      }
    };

    return () => {
      isIntentionalClose = true;
      ws.onmessage = null;

      if (ws.readyState === 1) { // OPEN
        ws.close();
      } else if (ws.readyState === 0) { // CONNECTING
        ws.onopen = () => ws.close();
      }
    };
  }, [token]);

  return null;
};

export default RealtimeBridge;
