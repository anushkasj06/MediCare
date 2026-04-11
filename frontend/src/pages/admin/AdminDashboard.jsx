import React, { useState } from 'react'
import { Users, UserCheck, Clock, Calendar, Bell, AlertCircle, CheckCircle, XCircle, Eye, Shield } from 'lucide-react'
import { StatCard, Table, Button, Tabs, ConfirmDialog, Modal, TextArea, Input, EmptyState, StatusChip } from '../../components/common/index.jsx'
import { useAdminStats, useAdminPendingDoctors, useAdminUsers, useAdminLogs, useAdminActions } from '../../hooks/index.js'
import { formatDate } from '../../utils/index.js'
import toast from 'react-hot-toast'

// ── Admin Dashboard ─────────────────────────────────────────────
export function AdminDashboard() {
  const { data: stats, loading: statsLoading } = useAdminStats()

  return (
    <div className="space-y-6 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Admin Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18}/>}     label="Total Patients"       value={stats?.totalUsers        ?? '—'} color="primary"/>
        <StatCard icon={<UserCheck size={18}/>}  label="Verified Doctors"    value={stats?.verifiedDoctors   ?? '—'} color="success"/>
        <StatCard icon={<Clock size={18}/>}      label="Pending Verifications" value={stats?.pendingVerifications ?? '—'} color="warning"/>
        <StatCard icon={<Calendar size={18}/>}   label="Total Appointments"  value={stats?.totalAppointments ?? '—'} color="accent"/>
        <StatCard icon={<Bell size={18}/>}       label="Active Reminders"    value={stats?.activeReminders   ?? '—'} color="primary"/>
        <StatCard icon={<AlertCircle size={18}/>}label="Failed Notifications" value={stats?.failedNotifications ?? '—'} color="error"/>
        <StatCard icon={<Users size={18}/>}      label="Total Doctors"       value={stats?.totalDoctors      ?? '—'} color="accent"/>
      </div>
    </div>
  )
}

// ── Doctor Verification Queue ────────────────────────────────────
export function AdminDoctorVerification() {
  const { data, loading, execute: reload } = useAdminPendingDoctors()
  const { verifyDoctor, rejectDoctor, loading: actLoading } = useAdminActions()
  const [rejectModal, setRejectModal] = useState(null) // { doctorId, name }
  const [reason, setReason]   = useState('')
  const [docModal, setDocModal] = useState(null)

  const doctors = Array.isArray(data) ? data : []

  const handleVerify = async (id) => {
    const ok = await verifyDoctor(id, 'All documents valid')
    if (ok) reload()
  }
  const handleReject = async () => {
    if (!reason.trim()) { toast.error('Reason is required'); return }
    const ok = await rejectDoctor(rejectModal.doctorId, reason)
    if (ok) { setRejectModal(null); setReason(''); reload() }
  }

  return (
    <div className="space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Doctor Verification Queue</h2>

      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}
      {!loading && doctors.length === 0 && <EmptyState icon={<Shield size={28}/>} message="No pending verifications"/>}

      <div className="space-y-4">
        {doctors.map(d => {
          const user = d.userId || {}
          return (
            <div key={d._id} className="card p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center font-bold text-accent-dark text-lg flex-shrink-0">
                  {user.fullName?.charAt(0) || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">Dr. {user.fullName}</p>
                  <p className="text-sm text-accent">{d.specialization}</p>
                  <p className="text-xs text-text-muted">{user.email} · {user.phone}</p>
                  <p className="text-xs text-text-muted mt-1">License: {d.licenseNumber} · {d.experienceYears} yrs exp · {d.hospitalName}</p>
                  <p className="text-xs text-text-muted">Submitted: {formatDate(d.verificationSubmittedAt || d.createdAt)}</p>
                </div>
                <StatusChip status={d.verificationStatus}/>
              </div>
              <div className="flex gap-3">
                <Button size="sm" variant="success" onClick={() => handleVerify(user._id)} loading={actLoading} className="flex items-center gap-1">
                  <CheckCircle size={13}/> Verify
                </Button>
                <Button size="sm" variant="error" onClick={() => setRejectModal({ doctorId: user._id, name: user.fullName })} className="flex items-center gap-1">
                  <XCircle size={13}/> Reject
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reject modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title={`Reject Dr. ${rejectModal?.name}`}>
        <div className="space-y-4">
          <TextArea label="Rejection Reason *" rows={3} placeholder="Explain why the application is rejected…" value={reason} onChange={e=>setReason(e.target.value)}/>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1 justify-center" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="error" className="flex-1 justify-center" loading={actLoading} onClick={handleReject}>Reject Doctor</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── User Management ──────────────────────────────────────────────
export function AdminUsers() {
  const [search, setSearch]   = useState('')
  const [role,   setRole]     = useState('')
  const [params, setParams]   = useState({})
  const { data, loading, execute: reload } = useAdminUsers(params)
  const { blockUser, unblockUser, loading: actLoading } = useAdminActions()
  const users = Array.isArray(data) ? data : (data?.users || [])

  const handleSearch = () => setParams({ search, role: role || undefined })
  const handleBlock  = async (id) => { await blockUser(id);   reload() }
  const handleUnblock= async (id) => { await unblockUser(id); reload() }

  return (
    <div className="space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">User Management</h2>
      <div className="flex gap-3">
        <Input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1"
          onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
        <select value={role} onChange={e=>setRole(e.target.value)} className="input w-36">
          <option value="">All Roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
        <Button onClick={handleSearch}>Filter</Button>
      </div>
      <Table
        loading={loading}
        columns={[
          { key:'name',    label:'Name',    render:r=><div><p className="font-medium text-sm">{r.fullName}</p><p className="text-xs text-text-muted">{r.email}</p></div> },
          { key:'role',    label:'Role',    render:r=><span className="capitalize badge-info text-xs">{r.role}</span> },
          { key:'phone',   label:'Phone',   render:r=><span className="text-sm">{r.phone}</span> },
          { key:'joined',  label:'Joined',  render:r=><span className="text-xs text-text-muted">{formatDate(r.createdAt)}</span> },
          { key:'status',  label:'Status',  render:r=><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isBlocked?'bg-error-soft text-error':'bg-success-soft text-success'}`}>{r.isBlocked?'Blocked':'Active'}</span> },
          { key:'actions', label:'',        render:r=>(
            r.role !== 'admin' && (r.isBlocked
              ? <button onClick={()=>handleUnblock(r._id)} className="text-xs text-success hover:underline">Unblock</button>
              : <button onClick={()=>handleBlock(r._id)}   className="text-xs text-error hover:underline">Block</button>
            )
          )},
        ]}
        data={users}
        emptyState={<EmptyState icon={<Users size={28}/>} message="No users found"/>}
      />
    </div>
  )
}

// ── Admin Logs ──────────────────────────────────────────────────
export function AdminLogs() {
  const { data, loading } = useAdminLogs({ limit:50 })
  const logs = Array.isArray(data) ? data : (data?.logs || [])

  return (
    <div className="space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Audit Logs</h2>
      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log._id} className="card p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
              <Shield size={14} className="text-text-muted"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text"><span className="font-medium">{log.actorId?.fullName||'System'}</span> · {log.action} · <span className="text-text-muted">{log.resourceType}</span></p>
              <p className="text-xs text-text-muted">{log.ipAddress} · {new Date(log.createdAt).toLocaleString()}</p>
            </div>
            <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full capitalize">{log.actorRole||'system'}</span>
          </div>
        ))}
        {!loading && logs.length === 0 && <div className="card p-8 text-center text-text-muted">No logs found</div>}
      </div>
    </div>
  )
}

export default AdminDashboard
