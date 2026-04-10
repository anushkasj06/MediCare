import { createSlice } from '@reduxjs/toolkit'

const saved = JSON.parse(localStorage.getItem('auth') || 'null')
const savedRole = saved?.role || saved?.user?.role || null
const hasValidSession = Boolean(saved?.token && savedRole)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            saved?.user || null,
    token:           saved?.token || null,
    refreshToken:    saved?.refreshToken || null,
    role:            savedRole,   // patient | doctor | admin
    isAuthenticated: hasValidSession,
    loading:         false,
  },
  reducers: {
    setCredentials(state, { payload }) {
      const normalized = {
        user: payload.user || null,
        token: payload.token || null,
        refreshToken: payload.refreshToken || null,
        role: payload.user?.role || payload.role || null,
      }

      state.user            = normalized.user
      state.token           = normalized.token
      state.refreshToken    = normalized.refreshToken
      state.role            = normalized.role
      state.isAuthenticated = Boolean(normalized.token && normalized.role)
      localStorage.setItem('auth', JSON.stringify(normalized))
    },
    setLoading(state, { payload }) { state.loading = payload },
    logout(state) {
      state.user = null; state.token = null; state.refreshToken = null
      state.role = null; state.isAuthenticated = false
      localStorage.removeItem('auth')
    },
    updateUser(state, { payload }) {
      state.user = { ...state.user, ...payload }
      const saved = JSON.parse(localStorage.getItem('auth') || '{}')
      const nextRole = state.user?.role || saved.role || saved.user?.role || null
      state.role = nextRole
      state.isAuthenticated = Boolean(state.token && nextRole)
      localStorage.setItem('auth', JSON.stringify({ ...saved, user: state.user, role: nextRole }))
    },
  },
})

export const { setCredentials, setLoading, logout, updateUser } = authSlice.actions
export default authSlice.reducer
