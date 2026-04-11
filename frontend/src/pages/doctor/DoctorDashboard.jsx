import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  Activity,
  Calendar,
  Clock,
  FileText,
  Plus,
  Shield,
  Upload,
  User,
  Users,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  FileUploader,
  Input,
  Select,
  StatCard,
  StatusChip,
  Table,
  TextArea,
} from '../../components/common/index.jsx'
import { doctorApi } from '../../api/doctorApi.js'
import { prescriptionApi } from '../../api/prescriptionApi.js'
import { medicalHistoryApi } from '../../api/reminderApi.js'
import {
  useDoctorAppointments,
  useDoctorProfile,
  useDoctorVerification,
  useUpdateAppointmentStatus,
} from '../../hooks/index.js'
import { SPECIALIZATIONS, formatDate } from '../../utils/index.js'

export function DoctorDashboard() {
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const { data, loading } = useDoctorAppointments({ limit: 10 })
  const { data: verificationData } = useDoctorVerification()

  const appointments = Array.isArray(data) ? data : data?.appointments || []
  const today = new Date().toISOString().slice(0, 10)
  const todayAppointments = appointments.filter(item => {
    const appointmentDate = item.appointmentDate ? new Date(item.appointmentDate).toISOString().slice(0, 10) : ''
    return appointmentDate === today
  })
  const pending = appointments.filter(item => item.status === 'pending')
  const verificationStatus = verificationData?.profile?.verificationStatus || 'pending'

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-text">Welcome, {user?.fullName || 'Doctor'}</h2>
          <p className="text-sm text-text-muted">Manage appointments, records, and follow-ups from one place.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/doctor/prescriptions/new')} className="btn-secondary text-sm flex items-center gap-1.5">
            <Upload size={14} /> Upload Rx
          </button>
          <button onClick={() => navigate('/doctor/medical-records/new')} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus size={14} /> Add Record
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-3 bg-warning-soft border-warning/20">
        <Shield size={18} className="text-warning flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-text capitalize">Verification status: {verificationStatus}</p>
          <p className="text-xs text-text-muted">Verified doctors can confirm appointments and access all patient care actions.</p>
        </div>
        <button onClick={() => navigate('/doctor/verification')} className="btn-secondary text-xs">Open</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={18} />} label="Today's Appointments" value={todayAppointments.length} color="primary" />
        <StatCard icon={<Clock size={18} />} label="Pending Requests" value={pending.length} color="warning" />
        <StatCard icon={<Users size={18} />} label="Total Listed" value={appointments.length} color="accent" />
        <StatCard icon={<FileText size={18} />} label="Ready for Follow-Up" value={appointments.filter(item => item.status === 'completed').length} color="success" />
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-text">Latest Appointments</h3>
          <button className="text-sm text-primary hover:underline" onClick={() => navigate('/doctor/appointments')}>View all</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState icon={<Calendar size={24} />} message="No appointments yet" />
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 5).map(item => (
              <div key={item._id} className="flex flex-wrap items-center gap-3 border border-border rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center font-semibold text-primary">
                  {item.patientId?.fullName?.[0] || 'P'}
                </div>
                <div className="flex-1 min-w-[220px]">
                  <p className="font-medium text-text">{item.patientId?.fullName || 'Unknown patient'}</p>
                  <p className="text-xs text-text-muted">{formatDate(item.appointmentDate)} at {item.appointmentTime}</p>
                </div>
                <StatusChip status={item.status} />
                <button className="btn-secondary text-xs" onClick={() => navigate(`/doctor/patients/${item.patientId?._id}`)}>Patient File</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function DoctorProfile() {
  const authUser = useSelector(state => state.auth.user)
  const { data } = useDoctorProfile()
  const profile = data?.profile || {}
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    specialization: '',
    experienceYears: '',
    hospitalName: '',
    clinicAddress: '',
    consultationFee: '',
    about: '',
    languages: '',
    qualifications: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      fullName: authUser?.fullName || '',
      phone: authUser?.phone || '',
      specialization: profile.specialization || '',
      experienceYears: profile.experienceYears || '',
      hospitalName: profile.hospitalName || '',
      clinicAddress: profile.clinicAddress || '',
      consultationFee: profile.consultationFee || '',
      about: profile.about || '',
      languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : '',
      qualifications: Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') : '',
    })
  }, [authUser, profile])

  async function handleSave() {
    setSaving(true)
    try {
      await doctorApi.updateMyProfile({
        ...form,
        qualifications: form.qualifications.split(',').map(item => item.trim()).filter(Boolean),
        languages: form.languages.split(',').map(item => item.trim()).filter(Boolean),
      })
      toast.success('Doctor profile updated')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Doctor Profile</h2>
      <div className="card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Full Name" value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} />
          <Select label="Specialization" options={SPECIALIZATIONS.map(item => ({ value: item, label: item }))} value={form.specialization} onChange={event => setForm(current => ({ ...current, specialization: event.target.value }))} />
          <Input label="Experience (years)" type="number" value={form.experienceYears} onChange={event => setForm(current => ({ ...current, experienceYears: event.target.value }))} />
          <Input label="Hospital / Clinic" value={form.hospitalName} onChange={event => setForm(current => ({ ...current, hospitalName: event.target.value }))} />
          <Input label="Consultation Fee" type="number" value={form.consultationFee} onChange={event => setForm(current => ({ ...current, consultationFee: event.target.value }))} />
        </div>
        <Input label="Clinic Address" value={form.clinicAddress} onChange={event => setForm(current => ({ ...current, clinicAddress: event.target.value }))} />
        <Input label="Languages" value={form.languages} onChange={event => setForm(current => ({ ...current, languages: event.target.value }))} />
        <Input label="Qualifications" value={form.qualifications} onChange={event => setForm(current => ({ ...current, qualifications: event.target.value }))} />
        <TextArea label="About" rows={4} value={form.about} onChange={event => setForm(current => ({ ...current, about: event.target.value }))} />
        <div className="flex justify-end">
          <Button loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

export function DoctorVerification() {
  const { data } = useDoctorVerification()
  const documents = data?.documents || []
  const status = data?.profile?.verificationStatus || 'pending'
  const rejectionReason = data?.profile?.rejectionReason
  const [files, setFiles] = useState({
    medicalLicenseFile: null,
    degreeCertificateFiles: [],
    governmentIdFile: null,
    profilePhoto: null,
  })
  const [uploading, setUploading] = useState(false)

  async function handleSubmit() {
    if (!files.medicalLicenseFile) {
      toast.error('Medical license file is required')
      return
    }

    const formData = new FormData()
    if (files.medicalLicenseFile) formData.append('medicalLicenseFile', files.medicalLicenseFile)
    if (files.governmentIdFile) formData.append('governmentIdFile', files.governmentIdFile)
    if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto)
    files.degreeCertificateFiles.forEach(file => formData.append('degreeCertificateFiles', file))

    setUploading(true)
    try {
      await doctorApi.submitVerification(formData)
      toast.success('Verification documents submitted')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to submit verification')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Verification Status</h2>
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-warning" />
          <div>
            <p className="font-medium text-text capitalize">{status}</p>
            <p className="text-xs text-text-muted">Admin approval is required before full doctor workflows are enabled.</p>
          </div>
        </div>
        {rejectionReason && <p className="text-sm text-danger">Reason: {rejectionReason}</p>}
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-text">Submitted Documents</h3>
        {documents.length === 0 ? (
          <EmptyState icon={<FileText size={24} />} message="No documents submitted yet" />
        ) : (
          <div className="space-y-3">
            {documents.map(item => (
              <div key={item._id} className="border border-border rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-text capitalize">{item.documentType}</p>
                  <p className="text-xs text-text-muted">{item.fileName}</p>
                </div>
                <StatusChip status={item.status || 'pending'} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-text">Upload / Re-submit Documents</h3>
        <FileUploader label="Medical License" accept=".pdf,.jpg,.jpeg,.png" value={files.medicalLicenseFile} onChange={file => setFiles(current => ({ ...current, medicalLicenseFile: file }))} />
        <FileUploader label="Degree Certificates" accept=".pdf,.jpg,.jpeg,.png" multiple value={files.degreeCertificateFiles} onChange={filesList => setFiles(current => ({ ...current, degreeCertificateFiles: filesList || [] }))} />
        <FileUploader label="Government ID" accept=".pdf,.jpg,.jpeg,.png" value={files.governmentIdFile} onChange={file => setFiles(current => ({ ...current, governmentIdFile: file }))} />
        <FileUploader label="Profile Photo" accept=".jpg,.jpeg,.png" value={files.profilePhoto} onChange={file => setFiles(current => ({ ...current, profilePhoto: file }))} />
        <div className="flex justify-end">
          <Button loading={uploading} onClick={handleSubmit}>Submit Documents</Button>
        </div>
      </div>
    </div>
  )
}

export function DoctorAvailability() {
  const { data } = useDoctorProfile()
  const profile = data?.profile || {}
  const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const [slots, setSlots] = useState(
    defaultDays.map(day => ({
      dayOfWeek: day,
      isAvailable: !['Saturday', 'Sunday'].includes(day),
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      maxPatients: 10,
      breakStart: '13:00',
      breakEnd: '14:00',
    }))
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (Array.isArray(profile.availableSlots) && profile.availableSlots.length > 0) {
      setSlots(profile.availableSlots)
    }
  }, [profile.availableSlots])

  function updateSlot(index, key, value) {
    setSlots(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await doctorApi.updateAvailability({ availableSlots: slots })
      toast.success('Availability updated')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save availability')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Availability</h2>
      <div className="space-y-4">
        {slots.map((slot, index) => (
          <div key={slot.dayOfWeek} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text">{slot.dayOfWeek}</h3>
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input type="checkbox" checked={slot.isAvailable} onChange={event => updateSlot(index, 'isAvailable', event.target.checked)} />
                Available
              </label>
            </div>
            {slot.isAvailable && (
              <div className="grid md:grid-cols-3 gap-3">
                <Input label="Start Time" type="time" value={slot.startTime} onChange={event => updateSlot(index, 'startTime', event.target.value)} />
                <Input label="End Time" type="time" value={slot.endTime} onChange={event => updateSlot(index, 'endTime', event.target.value)} />
                <Input label="Slot Duration" type="number" value={slot.slotDuration} onChange={event => updateSlot(index, 'slotDuration', Number(event.target.value))} />
                <Input label="Max Patients" type="number" value={slot.maxPatients} onChange={event => updateSlot(index, 'maxPatients', Number(event.target.value))} />
                <Input label="Break Start" type="time" value={slot.breakStart || ''} onChange={event => updateSlot(index, 'breakStart', event.target.value)} />
                <Input label="Break End" type="time" value={slot.breakEnd || ''} onChange={event => updateSlot(index, 'breakEnd', event.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>Save Availability</Button>
      </div>
    </div>
  )
}

export function DoctorAppointments() {
  const navigate = useNavigate()
  const { data, loading, execute } = useDoctorAppointments({ limit: 50 })
  const { update, loading: updating } = useUpdateAppointmentStatus()
  const [statusFilter, setStatusFilter] = useState('all')

  const appointments = Array.isArray(data) ? data : data?.appointments || []
  const filtered = statusFilter === 'all' ? appointments : appointments.filter(item => item.status === statusFilter)

  async function handleStatusChange(id, status) {
    const result = await update(id, { status })
    if (result) {
      execute()
    }
  }

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-text">Appointments</h2>
        <Select
          className="w-48"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </div>

      <Table
        loading={loading}
        data={filtered}
        emptyText="No appointments found"
        columns={[
          {
            key: 'patient',
            label: 'Patient',
            render: (_, row) => (
              <div>
                <p className="font-medium text-sm">{row.patientId?.fullName || 'Unknown patient'}</p>
                <p className="text-xs text-text-muted">{row.patientId?.phone || row.patientId?.email || '-'}</p>
              </div>
            ),
          },
          {
            key: 'schedule',
            label: 'Schedule',
            render: (_, row) => (
              <div>
                <p className="text-sm">{formatDate(row.appointmentDate)}</p>
                <p className="text-xs text-text-muted">{row.appointmentTime}</p>
              </div>
            ),
          },
          {
            key: 'reasonForVisit',
            label: 'Reason',
            render: value => <span className="text-sm text-text-muted">{value || '-'}</span>,
          },
          {
            key: 'status',
            label: 'Status',
            render: value => <StatusChip status={value} />,
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary text-xs" onClick={() => navigate(`/doctor/patients/${row.patientId?._id}`)}>Patient File</button>
                {row.status === 'pending' && (
                  <>
                    <button className="btn-primary text-xs" disabled={updating} onClick={() => handleStatusChange(row._id, 'confirmed')}>Confirm</button>
                    <button className="btn-danger text-xs" disabled={updating} onClick={() => handleStatusChange(row._id, 'rejected')}>Reject</button>
                  </>
                )}
                {row.status === 'confirmed' && (
                  <button className="btn-primary text-xs" disabled={updating} onClick={() => handleStatusChange(row._id, 'completed')}>Complete</button>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export function UploadPrescription() {
  const navigate = useNavigate()
  const location = useLocation()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    patientId: location.state?.patientId || '',
    appointmentId: location.state?.appointmentId || '',
    notes: '',
    followUpDate: '',
    medications: [
      {
        medicineName: '',
        dosage: '',
        dosageUnit: 'mg',
        frequencyPerDay: 1,
        medicineTimes: ['morning'],
        beforeAfterFood: 'after_food',
        durationDays: '',
        startDate: '',
        endDate: '',
        instructions: '',
        reminderEnabled: true,
      },
    ],
  })

  function updateMedication(index, key, value) {
    setForm(current => ({
      ...current,
      medications: current.medications.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }))
  }

  function addMedication() {
    setForm(current => ({
      ...current,
      medications: current.medications.concat({
        medicineName: '',
        dosage: '',
        dosageUnit: 'mg',
        frequencyPerDay: 1,
        medicineTimes: ['morning'],
        beforeAfterFood: 'after_food',
        durationDays: '',
        startDate: '',
        endDate: '',
        instructions: '',
        reminderEnabled: true,
      }),
    }))
  }

  async function handleSubmit() {
    if (!form.patientId) {
      toast.error('Patient ID is required')
      return
    }

    const validMedications = form.medications.filter(item =>
      item.medicineName?.trim() ||
      item.dosage?.toString().trim() ||
      item.durationDays?.toString().trim() ||
      item.instructions?.trim()
    )

    if (validMedications.length === 0) {
      toast.error('Add at least one medicine before uploading')
      return
    }

    const incompleteMedication = validMedications.find(item => !item.medicineName?.trim())
    if (incompleteMedication) {
      toast.error('Each medicine entry must include a medicine name')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('patientId', form.patientId)
      formData.append('appointmentId', form.appointmentId)
      formData.append('notes', form.notes)
      formData.append('followUpDate', form.followUpDate)
      formData.append('createReminder', 'true')
      formData.append('reminderChannel', JSON.stringify(['sms']))
      formData.append('medications', JSON.stringify(validMedications))
      if (file) {
        formData.append('prescriptionFile', file)
      }

      await prescriptionApi.upload(formData)
      toast.success('Prescription uploaded')
      navigate('/doctor/appointments')
    } catch (error) {
      const details = error?.response?.data?.errors?.map(item => item.message).filter(Boolean)
      toast.error(details?.length ? details.join(', ') : (error?.response?.data?.message || 'Unable to upload prescription'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Upload Prescription</h2>
      <div className="card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Patient ID" value={form.patientId} onChange={event => setForm(current => ({ ...current, patientId: event.target.value }))} />
          <Input label="Appointment ID" value={form.appointmentId} onChange={event => setForm(current => ({ ...current, appointmentId: event.target.value }))} />
        </div>
        <FileUploader label="Prescription File" accept=".pdf,.jpg,.jpeg,.png" value={file} onChange={setFile} />
        {form.medications.map((item, index) => (
          <div key={`${item.medicineName}-${index}`} className="border border-border rounded-xl p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <Input label="Medicine Name" value={item.medicineName} onChange={event => updateMedication(index, 'medicineName', event.target.value)} />
              <Input label="Dosage" value={item.dosage} onChange={event => updateMedication(index, 'dosage', event.target.value)} />
              <Input label="Duration (days)" type="number" value={item.durationDays} onChange={event => updateMedication(index, 'durationDays', event.target.value)} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={item.startDate} onChange={event => updateMedication(index, 'startDate', event.target.value)} />
              <Input label="End Date" type="date" value={item.endDate} onChange={event => updateMedication(index, 'endDate', event.target.value)} />
            </div>
            <Input label="Instructions" value={item.instructions} onChange={event => updateMedication(index, 'instructions', event.target.value)} />
          </div>
        ))}
        <div className="flex justify-between gap-3">
          <Button variant="secondary" onClick={addMedication}>Add Medicine</Button>
          <Button loading={loading} onClick={handleSubmit}>Submit Prescription</Button>
        </div>
      </div>
    </div>
  )
}

export function AddMedicalRecord() {
  const navigate = useNavigate()
  const location = useLocation()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    patientId: location.state?.patientId || '',
    appointmentId: location.state?.appointmentId || '',
    diagnosis: '',
    symptoms: '',
    treatment: '',
    followUpDate: '',
    doctorNotes: '',
    visitSummary: '',
    vitals: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      oxygenLevel: '',
    },
  })

  async function handleSubmit() {
    if (!form.patientId || !form.diagnosis) {
      toast.error('Patient ID and diagnosis are required')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'vitals') {
          formData.append('vitals', JSON.stringify(value))
        } else if (key === 'symptoms') {
          formData.append('symptoms', JSON.stringify(value.split(',').map(item => item.trim()).filter(Boolean)))
        } else {
          formData.append(key, value)
        }
      })
      files.forEach(file => formData.append('labReports', file))

      await medicalHistoryApi.add(formData)
      toast.success('Medical record saved')
      navigate('/doctor/appointments')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save medical record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Add Medical Record</h2>
      <div className="card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Patient ID" value={form.patientId} onChange={event => setForm(current => ({ ...current, patientId: event.target.value }))} />
          <Input label="Appointment ID" value={form.appointmentId} onChange={event => setForm(current => ({ ...current, appointmentId: event.target.value }))} />
        </div>
        <Input label="Diagnosis" value={form.diagnosis} onChange={event => setForm(current => ({ ...current, diagnosis: event.target.value }))} />
        <Input label="Symptoms" value={form.symptoms} onChange={event => setForm(current => ({ ...current, symptoms: event.target.value }))} />
        <TextArea label="Treatment" rows={4} value={form.treatment} onChange={event => setForm(current => ({ ...current, treatment: event.target.value }))} />
        <TextArea label="Doctor Notes" rows={3} value={form.doctorNotes} onChange={event => setForm(current => ({ ...current, doctorNotes: event.target.value }))} />
        <TextArea label="Visit Summary" rows={3} value={form.visitSummary} onChange={event => setForm(current => ({ ...current, visitSummary: event.target.value }))} />
        <div className="grid md:grid-cols-3 gap-3">
          <Input label="Blood Pressure" value={form.vitals.bloodPressure} onChange={event => setForm(current => ({ ...current, vitals: { ...current.vitals, bloodPressure: event.target.value } }))} />
          <Input label="Heart Rate" value={form.vitals.heartRate} onChange={event => setForm(current => ({ ...current, vitals: { ...current.vitals, heartRate: event.target.value } }))} />
          <Input label="Temperature" value={form.vitals.temperature} onChange={event => setForm(current => ({ ...current, vitals: { ...current.vitals, temperature: event.target.value } }))} />
          <Input label="Weight" value={form.vitals.weight} onChange={event => setForm(current => ({ ...current, vitals: { ...current.vitals, weight: event.target.value } }))} />
          <Input label="Oxygen Level" value={form.vitals.oxygenLevel} onChange={event => setForm(current => ({ ...current, vitals: { ...current.vitals, oxygenLevel: event.target.value } }))} />
          <Input label="Follow-Up Date" type="date" value={form.followUpDate} onChange={event => setForm(current => ({ ...current, followUpDate: event.target.value }))} />
        </div>
        <FileUploader label="Lab Reports" accept=".pdf,.jpg,.jpeg,.png" multiple value={files} onChange={items => setFiles(items || [])} />
        <div className="flex justify-end">
          <Button loading={loading} onClick={handleSubmit}>Save Medical Record</Button>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
