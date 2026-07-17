import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws/chat';

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
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        window.setTimeout(() => ws.close(), 0);
      }
    };
  }, [token]);

  return null;
};

export default RealtimeBridge;
