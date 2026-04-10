import api from './axios'

export const doctorApi = {
  getDoctors:             (params)          => api.get('/doctors', { params }),
  getDoctorById:          (doctorId)        => api.get(`/doctors/${doctorId}`),
  getMyProfile:           ()                => api.get('/doctors/profile/me'),
  updateMyProfile:        (data)            => api.put('/doctors/profile/me', data),
  updateAvailability:     (data)            => api.put('/doctors/availability', data),
  getDoctorAvailability:  (doctorId)        => api.get(`/doctors/availability/${doctorId}`),
  getAvailableSlots:      (params)          => api.get('/doctors/available-slots', { params }),
  getDoctorAppointments:  (params)          => api.get('/doctors/appointments', { params }),
  updateAppointmentStatus:(id, data)        => api.patch(`/doctors/appointments/${id}/status`, data),
  submitVerification:     (formData)        => api.post('/doctors/verify/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getVerificationStatus:  ()                => api.get('/doctors/verify/status'),
  getPatientDetails:      (patientId)       => api.get(`/doctors/patients/${patientId}`),
}
