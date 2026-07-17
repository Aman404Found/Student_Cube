import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// 🟢 MAGIC VARIABLE: Toast ko spam hone se rokne ke liye
let lastToastTime = 0;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      const now = Date.now();
      
      if (now - lastToastTime > 4000) {
        toast.error("Woah, speedster! 🏎️ Our servers need a quick breather. Try again in a bit.", {
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
        
        lastToastTime = now; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;