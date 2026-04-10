import { configureStore } from '@reduxjs/toolkit'
import authReducer    from '../context/authSlice'
import patientReducer from '../context/patientSlice'
import doctorReducer  from '../context/doctorSlice'
import adminReducer   from '../context/adminSlice'
import uiReducer      from '../context/uiSlice'

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    patient: patientReducer,
    doctor:  doctorReducer,
    admin:   adminReducer,
    ui:      uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export default store
