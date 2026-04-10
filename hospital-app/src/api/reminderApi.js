import api from './axios'

export const reminderApi = {
  getAll:    (params)    => api.get('/reminders', { params }),
  create:    (data)      => api.post('/reminders', data),
  update:    (id, data)  => api.put(`/reminders/${id}`, data),
  delete:    (id)        => api.delete(`/reminders/${id}`),
  snooze:    (id, data)  => api.post(`/reminders/${id}/snooze`, data),
}

export const adminApi = {
  getStats:               ()          => api.get('/admin/stats'),
  getUsers:               (params)    => api.get('/admin/users', { params }),
  getUserById:            (id)        => api.get(`/admin/users/${id}`),
  blockUser:              (id)        => api.post(`/admin/users/${id}/block`),
  unblockUser:            (id)        => api.post(`/admin/users/${id}/unblock`),
  getPendingDoctors:      ()          => api.get('/admin/doctors/pending'),
  verifyDoctor:           (id, data)  => api.post(`/admin/doctors/${id}/verify`, data),
  rejectDoctor:           (id, data)  => api.post(`/admin/doctors/${id}/reject`, data),
  getAppointmentsReport:  (params)    => api.get('/admin/reports/appointments', { params }),
  getUsersReport:         ()          => api.get('/admin/reports/users'),
  getLogs:                (params)    => api.get('/admin/logs', { params }),
  getSettings:            ()          => api.get('/admin/settings'),
  updateSettings:         (data)      => api.put('/admin/settings', data),
}

export const medicalHistoryApi = {
  add:             (formData)   => api.post('/medical-history', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:          (id, data)   => api.put(`/medical-history/${id}`, data),
  getByPatient:    (patientId, params) => api.get(`/medical-history/${patientId}`, { params }),
  getRecord:       (id)         => api.get(`/medical-history/record/${id}`),
  getTimeline:     (patientId)  => api.get(`/medical-history/${patientId}/timeline`),
  getConditions:   (patientId)  => api.get(`/medical-history/${patientId}/conditions`),
  exportRecord:    (id)         => api.get(`/medical-history/${id}/export`),
}

export const chatbotApi = {
  createSession: ()            => api.post('/chatbot/session'),
  query:         (data)        => api.post('/chatbot/query', data),
  getSession:    (id)          => api.get(`/chatbot/session/${id}`),
  feedback:      (data)        => api.post('/chatbot/feedback', data),
  getFaq:        ()            => api.get('/chatbot/faq'),
}
