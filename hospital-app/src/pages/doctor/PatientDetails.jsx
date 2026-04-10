import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, FileText, Activity, Upload, Plus, ClipboardList } from 'lucide-react'
import { Tabs, StatusChip, EmptyState, Button } from '../../components/common/index.jsx'
import { usePatientDetails } from '../../hooks/index.js'
import { formatDate } from '../../utils/index.js'

export default function PatientDetails() {
  const { patientId } = useParams()
  const navigate      = useNavigate()
  const [tab, setTab] = useState('overview')
  const { data, loading } = usePatientDetails(patientId)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!data) return (
    <div className="card p-10 text-center text-text-muted">
      <p>Patient not found or access denied.</p>
      <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
    </div>
  )

  const { patient, appointments = [], prescriptions = [], medicalHistory = [] } = data

  return (
    <div className="space-y-5 animate-fadeUp max-w-4xl mx-auto">
      {/* Back + Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
        <ArrowLeft size={14}/> Back to Appointments
      </button>

      {/* Patient Card */}
      <div className="card p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {patient?.fullName?.charAt(0) || 'P'}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-text">{patient?.fullName}</h2>
          <p className="text-sm text-text-muted">{patient?.email} · {patient?.phone}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-text-muted">
            {patient?.dateOfBirth && <span>🎂 {new Date(patient.dateOfBirth).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>}
            {patient?.gender      && <span>👤 {patient.gender}</span>}
            {patient?.bloodGroup  && <span>🩸 {patient.bloodGroup}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" onClick={() => navigate('/doctor/prescriptions/new', { state: { patientId } })} className="flex items-center gap-1.5">
            <Upload size={13}/> Upload Rx
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/doctor/medical-records/new', { state: { patientId } })} className="flex items-center gap-1.5">
            <Plus size={13}/> Add Record
          </Button>
        </div>
      </div>

      {/* Alerts: allergies + chronic conditions */}
      {(patient?.allergies?.length > 0 || patient?.chronicConditions?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {patient.allergies?.length > 0 && (
            <div className="card p-4 bg-error-soft border-error/20">
              <p className="text-xs font-semibold text-error mb-2">⚠️ Allergies</p>
              <div className="flex flex-wrap gap-1">
                {patient.allergies.map((a,i) => <span key={i} className="text-xs bg-white px-2 py-0.5 rounded-full border border-error/30 text-error">{a}</span>)}
              </div>
            </div>
          )}
          {patient.chronicConditions?.length > 0 && (
            <div className="card p-4 bg-warning-soft border-warning/20">
              <p className="text-xs font-semibold text-warning mb-2">🏥 Chronic Conditions</p>
              <div className="flex flex-wrap gap-1">
                {patient.chronicConditions.map((c,i) => <span key={i} className="text-xs bg-white px-2 py-0.5 rounded-full border border-warning/30 text-warning">{c}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { id:'overview',     label:`Overview` },
          { id:'appointments', label:`Appointments (${appointments.length})` },
          { id:'prescriptions',label:`Prescriptions (${prescriptions.length})` },
          { id:'history',      label:`Medical History (${medicalHistory.length})` },
        ]}
        active={tab} onChange={setTab}
      />

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{appointments.length}</p>
            <p className="text-xs text-text-muted mt-1">Total Appointments</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-accent">{prescriptions.length}</p>
            <p className="text-xs text-text-muted mt-1">Prescriptions</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-success">{medicalHistory.length}</p>
            <p className="text-xs text-text-muted mt-1">Medical Records</p>
          </div>

          {/* Emergency Contact */}
          {patient?.emergencyContact?.name && (
            <div className="card p-4 col-span-full">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Emergency Contact</p>
              <div className="flex gap-4 text-sm">
                <span className="font-medium text-text">{patient.emergencyContact.name}</span>
                <span className="text-text-muted">{patient.emergencyContact.phone}</span>
                <span className="text-text-muted capitalize">{patient.emergencyContact.relationship}</span>
              </div>
            </div>
          )}

          {/* Latest Medical Record */}
          {medicalHistory[0] && (
            <div className="card p-4 col-span-full">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Latest Visit</p>
              <div className="space-y-1">
                <p className="font-semibold text-text">{medicalHistory[0].diagnosis}</p>
                <p className="text-xs text-text-muted">{formatDate(medicalHistory[0].createdAt)}</p>
                {medicalHistory[0].doctorNotes && <p className="text-sm text-text-muted mt-2">{medicalHistory[0].doctorNotes}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {tab === 'appointments' && (
        <div className="space-y-3">
          {appointments.length === 0 && <EmptyState icon={<Calendar size={28}/>} message="No appointments with this patient"/>}
          {appointments.map(a => (
            <div key={a._id} className="card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${a.status==='confirmed'?'bg-success-soft text-success':a.status==='completed'?'bg-primary-soft text-primary':'bg-border text-text-muted'}`}>
                <Calendar size={16}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text">{formatDate(a.appointmentDate)} · {a.appointmentTime}</p>
                <p className="text-xs text-text-muted">{a.reasonForVisit}</p>
                {a.symptoms?.length > 0 && <p className="text-xs text-text-muted">{a.symptoms.join(', ')}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusChip status={a.status}/>
                <span className="text-xs text-text-muted capitalize">{a.appointmentType}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescriptions Tab */}
      {tab === 'prescriptions' && (
        <div className="space-y-3">
          {prescriptions.length === 0 && <EmptyState icon={<FileText size={28}/>} message="No prescriptions uploaded yet"/>}
          {prescriptions.map(p => (
            <div key={p._id} className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-text">Prescription – {formatDate(p.uploadedAt || p.createdAt)}</p>
                  {p.expiryDate && <p className="text-xs text-text-muted">Expires: {formatDate(p.expiryDate)}</p>}
                </div>
                {p.fileUrl && (
                  <a href={p.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex items-center gap-1">
                    <FileText size={12}/> View File
                  </a>
                )}
              </div>
              {p.medications?.length > 0 && (
                <div className="bg-surface rounded-xl p-3 space-y-1">
                  {p.medications.map((m,i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"/>
                      <span className="font-medium text-text">{m.medicineName}</span>
                      <span className="text-text-muted text-xs">{m.dosage}{m.dosageUnit} · {m.frequencyPerDay}×/day · {m.durationDays}d</span>
                    </div>
                  ))}
                </div>
              )}
              {p.notes && <p className="text-xs text-text-muted">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Medical History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {medicalHistory.length === 0 && <EmptyState icon={<Activity size={28}/>} message="No medical records yet"/>}
          {medicalHistory.map(rec => (
            <div key={rec._id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-text">{rec.diagnosis}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary capitalize">{rec.recordType}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(rec.createdAt)}</p>
                </div>
                {rec.followUpDate && (
                  <span className="text-xs text-warning bg-warning-soft px-2 py-1 rounded-lg whitespace-nowrap">
                    Follow-up: {formatDate(rec.followUpDate)}
                  </span>
                )}
              </div>
              {rec.symptoms?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rec.symptoms.map((s,i) => <span key={i} className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full text-text-muted">{s}</span>)}
                </div>
              )}
              {rec.vitals && Object.values(rec.vitals).some(Boolean) && (
                <div className="grid grid-cols-4 gap-2">
                  {rec.vitals.bloodPressure && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">BP</p><p className="font-semibold text-xs">{rec.vitals.bloodPressure}</p></div>}
                  {rec.vitals.heartRate     && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">HR</p><p className="font-semibold text-xs">{rec.vitals.heartRate} bpm</p></div>}
                  {rec.vitals.temperature   && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">Temp</p><p className="font-semibold text-xs">{rec.vitals.temperature}°F</p></div>}
                  {rec.vitals.weight        && <div className="bg-surface rounded-lg p-2 text-center"><p className="text-xs text-text-muted">Wt</p><p className="font-semibold text-xs">{rec.vitals.weight} kg</p></div>}
                </div>
              )}
              {rec.doctorNotes && <p className="text-xs text-text-muted border-t border-border pt-2">{rec.doctorNotes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
