import api from './axios';

export const getTemplates   = ()         => api.get('/templates');
export const getTemplate    = id         => api.get(`/templates/${id}`);
export const createTemplate = data       => api.post('/templates', data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);
export const deleteTemplate = id         => api.delete(`/templates/${id}`);
export const previewTemplate = (id, client_id) => api.post(`/templates/${id}/preview`, { client_id });
