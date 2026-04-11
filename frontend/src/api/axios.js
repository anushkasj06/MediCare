import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
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
