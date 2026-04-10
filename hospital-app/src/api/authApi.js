import api from './axios'

export const authApi = {
  registerPatient: (data)        => api.post('/auth/register/patient', data),
  registerDoctor:  (data)        => api.post('/auth/register/doctor',  data),
  login:           (data)        => api.post('/auth/login', data),
  logout:          (data)        => api.post('/auth/logout', data),
  refreshToken:    (data)        => api.post('/auth/refresh-token', data),
  forgotPassword:  (data)        => api.post('/auth/forgot-password', data),
  resetPassword:   (token, data) => api.post(`/auth/reset-password/${token}`, data),
  changePassword:  (data)        => api.post('/auth/change-password', data),
  verifyEmail:     (token)       => api.get(`/auth/verify-email/${token}`),
  sendPhoneOtp:    (data)        => api.post('/auth/verify-phone/send-otp', data),
  confirmPhoneOtp: (data)        => api.post('/auth/verify-phone/confirm-otp', data),
  getMe:           ()            => api.get('/auth/me'),
}
