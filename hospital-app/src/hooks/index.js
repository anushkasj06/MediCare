import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { logout } from '../context/authSlice.js'
import { openModal, closeModal } from '../context/uiSlice.js'

// useAuth — access auth state + helpers
export const useAuth = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const auth      = useSelector(s => s.auth)
  const doLogout  = () => { dispatch(logout()); navigate('/login') }
  return { ...auth, doLogout }
}

// useRole — role check helpers
export const useRole = () => {
  const { role } = useSelector(s => s.auth)
  return {
    role,
    isPatient: role === 'patient',
    isDoctor:  role === 'doctor',
    isAdmin:   role === 'admin',
  }
}

// useModal
export const useModal = () => {
  const dispatch  = useDispatch()
  const { activeModal, modalData } = useSelector(s => s.ui)
  return {
    activeModal,
    modalData,
    open:  (modal, data) => dispatch(openModal({ modal, data })),
    close: ()            => dispatch(closeModal()),
  }
}

import { patientApi }      from '../api/patientApi.js'
import { doctorApi }       from '../api/doctorApi.js'
import { appointmentApi }  from '../api/appointmentApi.js'
import { prescriptionApi } from '../api/prescriptionApi.js'
import { adminApi, medicalHistoryApi } from '../api/reminderApi.js'

import { setDashboard, setAppointments, setPrescriptions, setMedicalHistory, setReminders, setNotifications } from '../context/patientSlice.js'
import { setProfile, setVerificationStatus, setAppointments as setDocAppts, setCurrentPatient } from '../context/doctorSlice.js'
import { setStats, setUsers, setPendingDoctors, setLogs } from '../context/adminSlice.js'

// ─── Generic async hook ──────────────────────────────────────────────────────
export function useAsync(asyncFn, deps = [], opts = {}) {
  const { immediate = true, onSuccess, onError } = opts
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true); setError(null)
    try {
      const res = await asyncFn(...args)
      const d   = res?.data?.data ?? res?.data ?? res
      setData(d)
      onSuccess?.(d)
      return d
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Something went wrong'
      setError(msg)
      onError?.(msg)
      return null
    } finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { if (immediate) execute() }, [execute]) // eslint-disable-line

  return { data, loading, error, execute, setData }
}

// ─── Patient hooks ───────────────────────────────────────────────────────────
export function usePatientDashboard() {
  const dispatch = useDispatch()
  return useAsync(() => patientApi.getDashboard().then(r => { dispatch(setDashboard(r.data.data)); return r.data.data }))
}
export function usePatientAppointments(params) {
  const dispatch = useDispatch()
  const key = JSON.stringify(params)
  return useAsync(() => patientApi.getAppointments(params).then(r => { dispatch(setAppointments(r.data.data)); return r.data.data }), [key])
}
export function usePatientPrescriptions(params) {
  const dispatch = useDispatch()
  return useAsync(() => patientApi.getPrescriptions(params).then(r => { dispatch(setPrescriptions(r.data.data)); return r.data.data }))
}
export function usePatientMedicalHistory(params) {
  const dispatch = useDispatch()
  return useAsync(() => patientApi.getMedicalHistory(params).then(r => { dispatch(setMedicalHistory(r.data.data)); return r.data.data }))
}
export function usePatientReminders(params) {
  const dispatch = useDispatch()
  return useAsync(() => patientApi.getReminders(params).then(r => { dispatch(setReminders(r.data.data)); return r.data.data }))
}
export function usePatientNotifications() {
  const dispatch = useDispatch()
  return useAsync(() => patientApi.getNotifications().then(r => { dispatch(setNotifications(r.data.data)); return r.data.data }))
}

// ─── Doctor hooks ────────────────────────────────────────────────────────────
export function useDoctorProfile() {
  const dispatch = useDispatch()
  return useAsync(() => doctorApi.getMyProfile().then(r => { dispatch(setProfile(r.data.data)); return r.data.data }))
}
export function useDoctorVerification() {
  const dispatch = useDispatch()
  return useAsync(() => doctorApi.getVerificationStatus().then(r => { dispatch(setVerificationStatus(r.data.data)); return r.data.data }))
}
export function useDoctorAppointments(params) {
  const dispatch = useDispatch()
  const key = JSON.stringify(params)
  return useAsync(() => doctorApi.getDoctorAppointments(params).then(r => { dispatch(setDocAppts(r.data.data)); return r.data.data }), [key])
}
export function usePatientDetails(patientId) {
  const dispatch = useDispatch()
  return useAsync(
    () => patientId ? doctorApi.getPatientDetails(patientId).then(r => { dispatch(setCurrentPatient(r.data.data)); return r.data.data }) : Promise.resolve(null),
    [patientId]
  )
}
export function useDoctors(params) {
  return useAsync(() => doctorApi.getDoctors(params).then(r => r.data.data), [JSON.stringify(params)])
}
export function useDoctorById(doctorId) {
  return useAsync(
    () => doctorId ? doctorApi.getDoctorById(doctorId).then(r => r.data.data) : Promise.resolve(null),
    [doctorId]
  )
}
export function useAvailableSlots(params) {
  const key = `${params?.doctorId}-${params?.date}`
  return useAsync(
    () => (params?.doctorId && params?.date)
      ? doctorApi.getAvailableSlots(params).then(r => r.data.data)
      : Promise.resolve([]),
    [key],
    { immediate: !!(params?.doctorId && params?.date) }
  )
}

// ─── Admin hooks ─────────────────────────────────────────────────────────────
export function useAdminStats() {
  const dispatch = useDispatch()
  return useAsync(() => adminApi.getStats().then(r => { dispatch(setStats(r.data.data)); return r.data.data }))
}
export function useAdminUsers(params) {
  const dispatch = useDispatch()
  return useAsync(() => adminApi.getUsers(params).then(r => { dispatch(setUsers(r.data.data)); return r.data.data }), [JSON.stringify(params)])
}
export function useAdminPendingDoctors() {
  const dispatch = useDispatch()
  return useAsync(() => adminApi.getPendingDoctors().then(r => { dispatch(setPendingDoctors(r.data.data)); return r.data.data }))
}
export function useAdminLogs(params) {
  const dispatch = useDispatch()
  return useAsync(() => adminApi.getLogs(params).then(r => { dispatch(setLogs(r.data.data)); return r.data.data }), [JSON.stringify(params)])
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────
export function useBookAppointment() {
  const [loading, setLoading] = useState(false)
  const book = async (data) => {
    setLoading(true)
    try { const r = await appointmentApi.create(data); toast.success('Appointment booked!'); return r.data.data }
    catch (e) { toast.error(e?.response?.data?.message || 'Booking failed'); return null }
    finally { setLoading(false) }
  }
  return { book, loading }
}
export function useCancelAppointment() {
  const [loading, setLoading] = useState(false)
  const cancel = async (id, reason) => {
    setLoading(true)
    try { await appointmentApi.cancel(id, { cancellationReason: reason }); toast.success('Cancelled'); return true }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed'); return false }
    finally { setLoading(false) }
  }
  return { cancel, loading }
}
export function useUpdateAppointmentStatus() {
  const [loading, setLoading] = useState(false)
  const update = async (id, data) => {
    setLoading(true)
    try { const r = await doctorApi.updateAppointmentStatus(id, data); toast.success('Updated'); return r.data.data }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed'); return null }
    finally { setLoading(false) }
  }
  return { update, loading }
}
export function useUploadPrescription() {
  const [loading, setLoading] = useState(false)
  const upload = async (formData) => {
    setLoading(true)
    try { const r = await prescriptionApi.upload(formData); toast.success('Prescription uploaded!'); return r.data.data }
    catch (e) { toast.error(e?.response?.data?.message || 'Upload failed'); return null }
    finally { setLoading(false) }
  }
  return { upload, loading }
}
export function useAdminActions() {
  const [loading, setLoading] = useState(false)
  const act = async (fn, successMsg) => {
    setLoading(true)
    try { await fn(); toast.success(successMsg); return true }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed'); return false }
    finally { setLoading(false) }
  }
  return {
    verifyDoctor: (id, notes)  => act(() => adminApi.verifyDoctor(id, { notes }),  'Doctor verified!'),
    rejectDoctor: (id, reason) => act(() => adminApi.rejectDoctor(id, { reason }), 'Doctor rejected'),
    blockUser:    (id)         => act(() => adminApi.blockUser(id),                'User blocked'),
    unblockUser:  (id)         => act(() => adminApi.unblockUser(id),              'User unblocked'),
    loading,
  }
}
