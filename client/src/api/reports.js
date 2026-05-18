import api from './axios';

export const generateReport = params => api.get('/reports/generate', { params });
