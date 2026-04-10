import api from './axios'

export const patientApi = {
  getDashboard:     ()       => api.get('/patients/dashboard'),
  getProfile:       ()       => api.get('/patients/profile/me'),
  updateProfile:    (data)   => api.put('/patients/profile/me', data),
  getAppointments:  (params) => api.get('/patients/appointments', { params }),
  getPrescriptions: (params) => api.get('/patients/prescriptions', { params }),
  getMedicalHistory:(params) => api.get('/patients/medical-history', { params }),
  getNotifications: ()       => api.get('/patients/notifications'),
  getReminders:     (params) => api.get('/patients/reminders', { params }),
  createReminder:   (data)   => api.post('/patients/reminders', data),
  updateReminder:   (id, data)=> api.put(`/patients/reminders/${id}`, data),
  deleteReminder:   (id)     => api.delete(`/patients/reminders/${id}`),
}
