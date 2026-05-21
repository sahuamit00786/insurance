import api from './axios';

export const getCategories   = ()         => api.get('/lookup/categories');
export const getAllLookups   = ()         => api.get('/lookup/items');
export const createCategory  = data       => api.post('/lookup/categories', data);
export const getValues       = slug       => api.get(`/lookup/${slug}/values`);
export const createValue        = data        => api.post('/lookup/values', data);
export const createValueBySlug  = (slug, value) => api.post(`/lookup/${slug}/values`, { value });
export const updateValue     = (id, data) => api.put(`/lookup/values/${id}`, data);
export const deleteValue     = id         => api.delete(`/lookup/values/${id}`);
