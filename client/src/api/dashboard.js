import api from './axios';

export const getStats         = ()     => api.get('/dashboard/stats');
export const getUpcomingBirthdays = (limit = 10) =>
  api.get('/dashboard/upcoming-birthdays', { params: { limit } });
export const getExpiry = ({ type = 'expiring', page = 1, limit = 10, plan_code_id } = {}) =>
  api.get('/dashboard/expiry', { params: { type, page, limit, plan_code_id } });
export const getMaturity = ({ page = 1, limit = 10 } = {}) =>
  api.get('/dashboard/maturity', { params: { page, limit } });
