import api from './axios';

export const getClients    = params => api.get('/clients', { params });
export const getClient     = id     => api.get(`/clients/${id}`);
export const createClient  = data   => api.post('/clients', data);
export const updateClient  = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient  = id     => api.delete(`/clients/${id}`);

// Documents
export const getDocuments   = clientId        => api.get(`/clients/${clientId}/documents`);
export const uploadDocument = (clientId, form) => api.post(`/clients/${clientId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocument = docId           => api.delete(`/documents/${docId}`);
/** Fetch file bytes with auth (use blob URLs for img/iframe — browser tags cannot send Bearer token). */
export const fetchDocumentFile = docId =>
  api.get(`/documents/${docId}/file`, { responseType: 'blob' });

// Payments
export const getPayments   = clientId        => api.get(`/clients/${clientId}/payments`);
export const createPayment = (clientId, data) => api.post(`/clients/${clientId}/payments`, data);
export const updatePayment = (payId, data)    => api.put(`/payments/${payId}`, data);
export const deletePayment = payId            => api.delete(`/payments/${payId}`);

// Insurances (per client)
export const getInsurances    = clientId         => api.get(`/clients/${clientId}/insurances`);
export const createInsurance  = (clientId, data)  => api.post(`/clients/${clientId}/insurances`, data);
export const updateInsurance  = (insId, data)     => api.put(`/insurances/${insId}`, data);
export const deleteInsurance  = insId             => api.delete(`/insurances/${insId}`);

// Global insurance list with filters
export const getAllInsurances  = params => api.get('/insurances', { params });

// Notes
export const getNotes    = clientId          => api.get(`/clients/${clientId}/notes`);
export const createNote  = (clientId, data)  => api.post(`/clients/${clientId}/notes`, data);
export const updateNote  = (clientId, noteId, data) => api.put(`/clients/${clientId}/notes/${noteId}`, data);
export const deleteNote  = (clientId, noteId)       => api.delete(`/clients/${clientId}/notes/${noteId}`);
