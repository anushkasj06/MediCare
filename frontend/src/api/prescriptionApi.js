import api from './axios'

export const prescriptionApi = {
  upload:                (formData)     => api.post('/prescriptions/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getById:               (id)           => api.get(`/prescriptions/${id}`),
  delete:                (id)           => api.delete(`/prescriptions/${id}`),
  getByPatient:          (patientId)    => api.get(`/prescriptions/patient/${patientId}`),
  getByDoctor:           (doctorId)     => api.get(`/prescriptions/doctor/${doctorId}`),
  share:                 (id)           => api.post(`/prescriptions/${id}/share`),
  download:              (id)           => api.get(`/prescriptions/${id}/download`),
}
