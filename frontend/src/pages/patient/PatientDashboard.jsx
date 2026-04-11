import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Calendar, Pill, FileText, Clock, Bell, Plus, ChevronRight, Activity } from 'lucide-react'
import { StatCard, SummaryCard, EmptyState, StatusChip, Loader } from '../../components/common/index.jsx'
import { usePatientDashboard } from '../../hooks/index.js'
import { formatDate } from '../../utils/index.js'

export default function PatientDashboard() {
  const user     = useSelector(s => s.auth.user)
  const navigate = useNavigate()
  const { data, loading } = usePatientDashboard()

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>

  const upcoming    = data?.upcomingAppointments || []
  const nextReminder= data?.nextReminder
  const latestRecord= data?.latestRecord

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-text">Welcome, {user?.fullName?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-text-muted">Here's your health overview</p>
        </div>
        <button onClick={() => navigate('/patient/appointments/book')} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus size={14}/> Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={18}/>} label="Total Appointments" value={data?.totalAppointments ?? 0} color="primary"/>
        <StatCard icon={<Clock size={18}/>}    label="Upcoming"           value={upcoming.length}              color="accent"/>
        <StatCard icon={<Pill size={18}/>}     label="Active Medications" value={data?.activeMedications?.length ?? 0} color="success"/>
        <StatCard icon={<Bell size={18}/>}     label="Reminders"          value={data?.unreadNotifications ?? 0}       color="warning"/>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Calendar size={18}/>, label: 'Book Appointment', path: '/patient/appointments/book', color: 'bg-primary-soft text-primary' },
          { icon: <FileText size={18}/>, label: 'Prescriptions',    path: '/patient/prescriptions',    color: 'bg-accent-soft text-accent-dark' },
          { icon: <Activity size={18}/>, label: 'Medical History',  path: '/patient/medical-history',  color: 'bg-success-soft text-success' },
          { icon: <Clock size={18}/>,    label: 'Set Reminder',     path: '/patient/reminders',        color: 'bg-warning-soft text-warning' },
        ].map(a => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color}`}>{a.icon}</div>
            <span className="text-xs font-medium text-text">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <SummaryCard title="Upcoming Appointments" action={{ label:'View all', onClick:() => navigate('/patient/appointments') }}>
          {upcoming.length === 0 ? (
            <EmptyState icon={<Calendar size={28}/>} message="No upcoming appointments" action={{ label:'Book Now', onClick:() => navigate('/patient/appointments/book') }}/>
          ) : upcoming.map(a => (
            <div key={a._id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-primary"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-text truncate">Dr. {a.doctorId?.fullName || 'Unknown'}</p>
                <p className="text-xs text-text-muted">{formatDate(a.appointmentDate)} · {a.appointmentTime}</p>
              </div>
              <StatusChip status={a.status}/>
            </div>
          ))}
        </SummaryCard>

        {/* Next Reminder & Latest Record */}
        <div className="space-y-4">
          {nextReminder && (
            <SummaryCard title="Next Reminder">
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center flex-shrink-0">
                  <Bell size={16} className="text-warning"/>
                </div>
                <div>
                  <p className="font-medium text-sm text-text">{nextReminder.title}</p>
                  <p className="text-xs text-text-muted">{new Date(nextReminder.scheduledTime).toLocaleString()}</p>
                </div>
              </div>
            </SummaryCard>
          )}

          {latestRecord && (
            <SummaryCard title="Latest Medical Record" action={{ label:'View history', onClick:() => navigate('/patient/medical-history') }}>
              <div className="py-2">
                <p className="font-medium text-sm text-text">{latestRecord.diagnosis}</p>
                <p className="text-xs text-text-muted mt-1">By Dr. {latestRecord.doctorId?.fullName} · {formatDate(latestRecord.createdAt)}</p>
                {latestRecord.doctorNotes && <p className="text-xs text-text-muted mt-2 line-clamp-2">{latestRecord.doctorNotes}</p>}
              </div>
            </SummaryCard>
          )}

          <button onClick={() => navigate('/patient/reminders')} className="card p-4 w-full flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center"><Clock size={16} className="text-primary"/></div>
              <span className="text-sm font-medium text-text">Manage Reminders</span>
            </div>
            <ChevronRight size={16} className="text-text-muted"/>
          </button>
        </div>
      </div>
    </div>
  )
}
