import api from './axios';

export const getStats         = ()     => api.get('/dashboard/stats');
export const getUpcomingBirthdays = (limit = 10) =>
  api.get('/dashboard/upcoming-birthdays', { params: { limit } });
export const getExpiry = ({ type = 'expiring', page = 1 } = {}) =>
  api.get('/dashboard/expiry', { params: { type, page } });
export const getMaturity = (page = 1) =>
  api.get('/dashboard/maturity', { params: { page } });
