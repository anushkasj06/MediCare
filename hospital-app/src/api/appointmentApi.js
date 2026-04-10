import api from './axios'

export const appointmentApi = {
  create:             (data)          => api.post('/appointments', data),
  getById:            (id)            => api.get(`/appointments/${id}`),
  update:             (id, data)      => api.put(`/appointments/${id}`, data),
  cancel:             (id, data)      => api.delete(`/appointments/${id}`, { data }),
  confirm:            (id, data)      => api.post(`/appointments/${id}/confirm`, data),
  reschedule:         (id, data)      => api.post(`/appointments/${id}/reschedule`, data),
  checkAvailability:  (params)        => api.get('/appointments/check-availability', { params }),
  getAvailableSlots:  (params)        => api.get('/appointments/available-slots', { params }),
}
