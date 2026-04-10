import { createSlice } from '@reduxjs/toolkit'

const savedTheme = localStorage.getItem('theme') || 'light'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    activeModal: null,
    modalData: null,
    theme: savedTheme,
  },
  reducers: {
    toggleSidebar(state)              { state.sidebarOpen = !state.sidebarOpen },
    setSidebar(state, { payload })    { state.sidebarOpen = payload },
    openModal(state, { payload })     { state.activeModal = payload.modal; state.modalData = payload.data || null },
    closeModal(state)                 { state.activeModal = null; state.modalData = null },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
    setTheme(state, { payload }) {
      state.theme = payload
      localStorage.setItem('theme', payload)
    },
  },
})
export const { toggleSidebar, setSidebar, openModal, closeModal, toggleTheme, setTheme } = uiSlice.actions
export default uiSlice.reducer
