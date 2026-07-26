import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Helper to fix malformed WS URLs from env vars
const getWsUrl = () => {
  let url = import.meta.env.VITE_WS_URL;
  if (!url) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      const apiUrl = new URL(apiBaseUrl);
      apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      apiUrl.pathname = "/ws/chat";
      apiUrl.search = "";
      return apiUrl.toString();
    }

    return "ws://localhost:5000/ws/chat";
  }
  
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

    let isIntentionalClose = false;
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | undefined;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

      ws.onmessage = (event) => {
        if (isIntentionalClose) return;

        try {
          const payload = JSON.parse(event.data);

          if (['message', 'chat_updated', 'offer_updated', 'payment_updated', 'unread_changed'].includes(payload.type)) {
            window.dispatchEvent(new CustomEvent('student-cube-realtime', { detail: payload }));
          }

          if (['chat_updated', 'offer_updated', 'payment_updated', 'unread_changed'].includes(payload.type)) {
            window.dispatchEvent(new Event('student-cube-chat-read-change'));
          }
        } catch (error) {
          console.error('Invalid realtime event:', error);
        }
      };

      ws.onclose = () => {
        if (!isIntentionalClose) {
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isIntentionalClose = true;
      window.clearTimeout(reconnectTimeout);

      const activeSocket = ws;
      if (!activeSocket) return;
      activeSocket.onmessage = null;
      activeSocket.onclose = null;

      if (activeSocket.readyState === 1) { // OPEN
        activeSocket.close();
      } else if (activeSocket.readyState === 0) { // CONNECTING
        activeSocket.onopen = () => activeSocket.close();
      }
    };
  }, [token]);

  return null;
};

export default RealtimeBridge;
