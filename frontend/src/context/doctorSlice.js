import { createSlice } from '@reduxjs/toolkit'

export const doctorSlice = createSlice({
  name: 'doctor',
  initialState: {
    profile:            null,
    verificationStatus: null,
    availability:       [],
    appointments:       [],
    currentPatient:     null,
    loading:            false,
  },
  reducers: {
    setProfile(state, { payload })            { state.profile            = payload },
    setVerificationStatus(state, { payload }) { state.verificationStatus = payload },
    setAvailability(state, { payload })       { state.availability       = payload },
    setAppointments(state, { payload })       { state.appointments       = payload },
    setCurrentPatient(state, { payload })     { state.currentPatient     = payload },
    setLoading(state, { payload })            { state.loading            = payload },
  },
})
export const { setProfile, setVerificationStatus, setAvailability,
               setAppointments, setCurrentPatient, setLoading } = doctorSlice.actions
export default doctorSlice.reducer
