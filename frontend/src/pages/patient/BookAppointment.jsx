import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Search, Filter, Clock } from 'lucide-react'
import { Button, Input, Select, TextArea, Loader } from '../../components/common/index.jsx'
import { useDoctors, useAvailableSlots, useBookAppointment, usePatientAppointments } from '../../hooks/index.js'
import { SPECIALIZATIONS } from '../../utils/index.js'
import toast from 'react-hot-toast'

const APPOINTMENT_TYPES = [
  { value:'in-person', label:'In Person' },
  { value:'video',     label:'Video Call' },
  { value:'phone',     label:'Phone Call' },
]

export default function BookAppointment() {
  const navigate = useNavigate()
  const [step,        setStep]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [specialization, setSpec]     = useState('')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [selectedDate,setSelectedDate]= useState('')
  const [selectedSlot,setSelectedSlot]= useState('')
  const [form,        setForm]        = useState({ appointmentType:'in-person', reasonForVisit:'', symptoms:'' })

  const { data: doctorsData, loading: loadingDocs, execute: searchDocs } = useDoctors({ specialization, search, verified:'true', limit:20 })
  const { data: appointmentsData } = usePatientAppointments()
  const doctors = Array.isArray(doctorsData) ? doctorsData : (doctorsData?.doctors || doctorsData || [])
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.appointments || [])

  const recentDoctors = appointments
    .filter(appt => appt?.doctorId?._id)
    .map(appt => ({
      _id: appt.doctorId._id,
      userId: appt.doctorId,
      ...appt.doctorProfile,
    }))

  const mergedDoctors = [...recentDoctors, ...doctors].filter((doc, index, arr) => {
    const id = doc?.userId?._id || doc?._id
    return id && arr.findIndex(item => (item?.userId?._id || item?._id) === id) === index
  })

  const { data: slots, loading: loadingSlots } = useAvailableSlots(
    selectedDoc && selectedDate ? { doctorId: selectedDoc.userId?._id || selectedDoc._id, date: selectedDate } : null
  )
  const availableSlots = Array.isArray(slots) ? slots : []

  const { book, loading: booking } = useBookAppointment()

  const handleSearch = () => searchDocs()

  const handleBook = async () => {
    if (!selectedSlot)         { toast.error('Please select a time slot'); return }
    if (!form.reasonForVisit)  { toast.error('Please enter reason for visit'); return }

    const docId = selectedDoc.userId?._id || selectedDoc._id
    const result = await book({
      doctorId:        docId,
      appointmentDate: selectedDate,
      appointmentTime: selectedSlot,
      appointmentType: form.appointmentType,
      reasonForVisit:  form.reasonForVisit,
      symptoms:        form.symptoms ? form.symptoms.split(',').map(s=>s.trim()).filter(Boolean) : [],
    })
    if (result) navigate('/patient/appointments')
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeUp">
      <div>
        <h2 className="font-display text-xl font-bold text-text">Book an Appointment</h2>
        <div className="flex gap-1 mt-3">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s<=step?'bg-primary':'bg-border'}`}/>
          ))}
        </div>
      </div>

      {/* Step 1: Select Doctor */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-text">Find a Doctor</h3>
            <div className="flex gap-3">
              <Input placeholder="Search by name…" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1"
                icon={<Search size={15} className="text-text-muted"/>} onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
              <Select options={[{value:'',label:'All Specializations'},...SPECIALIZATIONS.map(s=>({value:s,label:s}))]}
                value={specialization} onChange={e=>setSpec(e.target.value)} className="w-52"/>
              <Button onClick={handleSearch} loading={loadingDocs}><Filter size={14}/></Button>
            </div>
          </div>

          {loadingDocs && <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}

          <div className="space-y-3">
            {mergedDoctors.map(doc => {
              const profile = doc.profile || doc
              const user    = doc.userId  || doc
              return (
                <div key={doc._id} onClick={() => { setSelectedDoc(doc); setStep(2) }}
                  className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all border-2 border-transparent">
                  <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center flex-shrink-0 font-bold text-primary text-lg">
                    {user?.fullName?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text">Dr. {user?.fullName}</p>
                    <p className="text-xs text-accent">{profile?.specialization}</p>
                    <p className="text-xs text-text-muted mt-0.5">{profile?.hospitalName} · {profile?.experienceYears} yrs exp</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text">₹{profile?.consultationFee}</p>
                    <p className="text-xs text-success mt-1">⭐ {profile?.ratingAverage?.toFixed(1) || '—'}</p>
                  </div>
                </div>
              )
            })}
            {!loadingDocs && mergedDoctors.length === 0 && (
              <div className="card p-8 text-center text-text-muted">No doctors found. Try different filters.</div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Date & Slot */}
      {step === 2 && selectedDoc && (
        <div className="space-y-4">
          <button onClick={()=>setStep(1)} className="text-sm text-text-muted hover:text-text flex items-center gap-1">← Back</button>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center font-bold text-primary">
              {(selectedDoc.userId?.fullName || selectedDoc.fullName || 'D').charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">Dr. {selectedDoc.userId?.fullName || selectedDoc.fullName}</p>
              <p className="text-xs text-text-muted">{selectedDoc.profile?.specialization || selectedDoc.specialization}</p>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-text">Select Date</h3>
            <Input type="date" min={minDate} value={selectedDate} onChange={e=>{setSelectedDate(e.target.value);setSelectedSlot('')}}/>
          </div>

          {selectedDate && (
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-text">Available Slots</h3>
              {loadingSlots && <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>}
              {!loadingSlots && availableSlots.length === 0 && <p className="text-sm text-text-muted">No slots available for this date</p>}
              <div className="flex flex-wrap gap-2">
                {availableSlots.map(slot => (
                  <button key={slot} onClick={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedSlot===slot?'border-primary bg-primary text-white':'border-border hover:border-primary/50'}`}>
                    <Clock size={12} className="inline mr-1"/>{slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button disabled={!selectedSlot} onClick={()=>setStep(3)} className="w-full justify-center">Continue</Button>
        </div>
      )}

      {/* Step 3: Reason & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <button onClick={()=>setStep(2)} className="text-sm text-text-muted hover:text-text flex items-center gap-1">← Back</button>
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-text">Appointment Details</h3>
            <Select label="Appointment Type" options={APPOINTMENT_TYPES}
              value={form.appointmentType} onChange={e=>setForm({...form,appointmentType:e.target.value})}/>
            <TextArea label="Reason for Visit *" placeholder="Describe your symptoms or reason…" rows={3}
              value={form.reasonForVisit} onChange={e=>setForm({...form,reasonForVisit:e.target.value})}/>
            <Input label="Symptoms (comma separated)" placeholder="Fever, headache, fatigue"
              value={form.symptoms} onChange={e=>setForm({...form,symptoms:e.target.value})}/>
          </div>

          <div className="card p-4 bg-primary-soft border-primary/20 space-y-2">
            <p className="text-sm font-semibold text-text">Booking Summary</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-text-muted">Doctor</span>
              <span>Dr. {selectedDoc.userId?.fullName || selectedDoc.fullName}</span>
              <span className="text-text-muted">Date</span>
              <span>{new Date(selectedDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</span>
              <span className="text-text-muted">Time</span>
              <span>{selectedSlot}</span>
              <span className="text-text-muted">Type</span>
              <span className="capitalize">{form.appointmentType}</span>
            </div>
          </div>

          <Button loading={booking} onClick={handleBook} className="w-full justify-center">
            Confirm Booking
          </Button>
        </div>
      )}
    </div>
  )
}
