// ============================================================
// VedaAI Frontend - Axios Instance with Auth Interceptors
// ============================================================
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper — read token from all possible storage locations
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  // 1. Direct key (set explicitly on login/register)
  const direct = localStorage.getItem('vedaai_token');
  if (direct) return direct;

  // 2. Zustand persisted store (key: "vedaai-auth")
  try {
    const raw = localStorage.getItem('vedaai-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token;
      if (token) return token as string;
    }
  } catch {
    // ignore parse errors
  }

  return null;
};

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Only redirect if it's not a login/register request
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('vedaai_token');
        localStorage.removeItem('vedaai-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
