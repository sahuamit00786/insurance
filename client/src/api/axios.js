import axios from 'axios';

const API_URL = 'https://api-murale.insur-vault.com/api';
// const API_URL = 'http://localhost:30003/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('insurance-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginEndpoint = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('insurance-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
