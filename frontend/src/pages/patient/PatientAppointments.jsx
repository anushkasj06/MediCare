import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, X, RefreshCw } from 'lucide-react'
import { Tabs, Table, StatusChip, Button, EmptyState, ConfirmDialog } from '../../components/common/index.jsx'
import { usePatientAppointments, useCancelAppointment } from '../../hooks/index.js'
import { formatDate } from '../../utils/index.js'

export default function PatientAppointments() {
  const navigate = useNavigate()
  const [tab,       setTab]       = useState('all')
  const [cancelId,  setCancelId]  = useState(null)
  const { data, loading, execute: reload } = usePatientAppointments()
  const { cancel, loading: cancelling }    = useCancelAppointment()

  const appointments = Array.isArray(data) ? data : (data?.appointments || [])
  const tabs = ['all','pending','confirmed','completed','cancelled']
  const filtered = tab === 'all' ? appointments : appointments.filter(a => a.status === tab)

  const handleCancel = async () => {
    const ok = await cancel(cancelId, 'Cancelled by patient')
    if (ok) { setCancelId(null); reload() }
  }

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">My Appointments</h2>
        <button onClick={() => navigate('/patient/appointments/book')} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={14}/> Book New
        </button>
      </div>

      <Tabs tabs={tabs.map(t=>({ id:t, label: t.charAt(0).toUpperCase()+t.slice(1) }))} active={tab} onChange={setTab}/>

      <Table
        loading={loading}
        columns={[
          { key:'doctor',  label:'Doctor',    render: r => <div><p className="font-medium text-sm">{r.doctorId?.fullName || '—'}</p><p className="text-xs text-text-muted">{r.doctorProfile?.specialization || ''}</p></div> },
          { key:'date',    label:'Date & Time',render: r => <div><p className="text-sm">{formatDate(r.appointmentDate)}</p><p className="text-xs text-text-muted">{r.appointmentTime}</p></div> },
          { key:'type',    label:'Type',       render: r => <span className="text-xs capitalize badge-info">{r.appointmentType}</span> },
          { key:'reason',  label:'Reason',     render: r => <p className="text-sm text-text-muted truncate max-w-xs">{r.reasonForVisit}</p> },
          { key:'status',  label:'Status',     render: r => <StatusChip status={r.status}/> },
          { key:'actions', label:'',           render: r => (
            <div className="flex gap-2">
              {['pending','confirmed'].includes(r.status) && (
                <button onClick={() => setCancelId(r._id)} className="text-xs text-error hover:underline flex items-center gap-1">
                  <X size={12}/> Cancel
                </button>
              )}
              {r.status === 'pending' && (
                <button onClick={() => navigate(`/patient/appointments/reschedule/${r._id}`)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <RefreshCw size={12}/> Reschedule
                </button>
              )}
            </div>
          )},
        ]}
        data={filtered}
        emptyState={<EmptyState icon={<Calendar size={28}/>} message={`No ${tab} appointments`} action={{ label:'Book Appointment', onClick:() => navigate('/patient/appointments/book') }}/>}
      />

      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmLabel="Yes, Cancel"
        variant="error"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelId(null)}
      />
    </div>
  )
}
