import api from './axios';

export const getStaff          = ()       => api.get('/staff');
export const getStaffMember    = id       => api.get(`/staff/${id}`);
export const createStaff       = data     => api.post('/staff', data);
export const updateStaff       = (id, data) => api.put(`/staff/${id}`, data);
export const deleteStaff       = id       => api.delete(`/staff/${id}`);
export const getPermissions    = id       => api.get(`/staff/${id}/permissions`);
export const updatePermissions = (id, permissions) => api.put(`/staff/${id}/permissions`, { permissions });
