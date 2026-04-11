import { createSlice } from '@reduxjs/toolkit'

const patientSlice = createSlice({
  name: 'patient',
  initialState: {
    dashboardSummary:  null,
    appointments:      [],
    prescriptions:     [],
    medicalHistory:    [],
    reminders:         [],
    notifications:     [],
    loading:           false,
  },
  reducers: {
    setDashboard(state, { payload })     { state.dashboardSummary = payload },
    setAppointments(state, { payload })  { state.appointments     = payload },
    setPrescriptions(state, { payload }) { state.prescriptions    = payload },
    setMedicalHistory(state, { payload }){ state.medicalHistory   = payload },
    setReminders(state, { payload })     { state.reminders        = payload },
    setNotifications(state, { payload }) { state.notifications    = payload },
    setLoading(state, { payload })       { state.loading          = payload },
    addReminder(state, { payload })      { state.reminders.unshift(payload) },
    removeReminder(state, { payload })   { state.reminders = state.reminders.filter(r => r._id !== payload) },
  },
})
export const { setDashboard, setAppointments, setPrescriptions, setMedicalHistory,
               setReminders, setNotifications, setLoading, addReminder, removeReminder } = patientSlice.actions
export default patientSlice.reducer
