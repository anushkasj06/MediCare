import axios from 'axios'

const LOCAL_API_BASE_URL = 'http://localhost:5000/api'
const PROD_API_BASE_URL = 'https://medicare-7pdq.onrender.com/api'

const defaultApiBaseUrl = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_API_BASE_URL
    }
  }
  return PROD_API_BASE_URL
})()

const apiBaseUrl = import.meta.env.VITE_API_URL || defaultApiBaseUrl

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use(config => {
  const auth = JSON.parse(localStorage.getItem('auth') || 'null')
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Handle 401 - auto refresh token
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const auth = JSON.parse(localStorage.getItem('auth') || 'null')
        if (!auth?.refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(
          `${apiBaseUrl}/auth/refresh-token`,
          { refreshToken: auth.refreshToken }
        )
        const updated = { ...auth, token: data.data.token, refreshToken: data.data.refreshToken }
        localStorage.setItem('auth', JSON.stringify(updated))
        original.headers.Authorization = `Bearer ${data.data.token}`
        return api(original)
      } catch {
        localStorage.removeItem('auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
