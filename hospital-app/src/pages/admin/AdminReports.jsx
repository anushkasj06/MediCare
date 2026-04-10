import React, { useState } from 'react'
import { BarChart2, Users, Calendar, TrendingUp, Settings, Save } from 'lucide-react'
import { Button, Input, StatCard } from '../../components/common/index.jsx'
import { adminApi } from '../../api/reminderApi.js'
import { useAsync } from '../../hooks/index.js'
import toast from 'react-hot-toast'

// ── Admin Reports ───────────────────────────────────────────────
export function AdminReports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const { data: apptData, loading: apptLoading, execute: fetchAppt } = useAsync(
    () => adminApi.getAppointmentsReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    [], { immediate: true }
  )
  const { data: userRep, loading: userLoading } = useAsync(() => adminApi.getUsersReport())

  const apptReport   = apptData?.data?.data || apptData?.data || {}
  const userReport   = userRep?.data?.data  || userRep?.data  || {}
  const byStatus     = apptReport.byStatus  || []
  const byRole       = userReport.byRole    || []

  const STATUS_COLORS = {
    confirmed:  'bg-success',
    pending:    'bg-warning',
    completed:  'bg-primary',
    cancelled:  'bg-error',
    rejected:   'bg-error',
    'no-show':  'bg-border',
  }

  const totalAppts = byStatus.reduce((s, r) => s + (r.count || 0), 0)
  const maxCount   = Math.max(...byStatus.map(r => r.count || 0), 1)

  return (
    <div className="space-y-6 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Reports</h2>

      {/* Date filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-text-muted block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            className="input text-sm h-9 w-40"/>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted block mb-1">To</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            className="input text-sm h-9 w-40"/>
        </div>
        <Button size="sm" onClick={() => fetchAppt()} loading={apptLoading}>Apply Filter</Button>
        <Button size="sm" variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); fetchAppt() }}>Reset</Button>
      </div>

      {/* Appointment Stats */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary"/>
          <h3 className="font-semibold text-text">Appointments Report</h3>
          <span className="ml-auto text-sm text-text-muted font-medium">{totalAppts} total</span>
        </div>

        {apptLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
        ) : byStatus.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No data for selected range</p>
        ) : (
          <div className="space-y-3">
            {byStatus.map(row => (
              <div key={row._id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize font-medium text-text">{row._id}</span>
                  <span className="text-text-muted">{row.count} ({totalAppts ? Math.round(row.count/totalAppts*100) : 0}%)</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${STATUS_COLORS[row._id] || 'bg-primary'}`}
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Stats */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent-dark"/>
          <h3 className="font-semibold text-text">User Report</h3>
        </div>

        {userLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {byRole.map(row => (
              <div key={row._id} className="card p-4 text-center border border-border">
                <p className="text-3xl font-bold text-primary">{row.count}</p>
                <p className="text-sm text-text-muted capitalize mt-1">{row._id}s</p>
              </div>
            ))}
            {userReport.newToday !== undefined && (
              <div className="card p-4 text-center border border-border">
                <p className="text-3xl font-bold text-success">{userReport.newToday}</p>
                <p className="text-sm text-text-muted mt-1">New Today</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-soft flex items-center justify-center">
            <TrendingUp size={18} className="text-success"/>
          </div>
          <div>
            <p className="text-xs text-text-muted">Completion Rate</p>
            <p className="font-bold text-text">
              {totalAppts > 0
                ? `${Math.round((byStatus.find(r=>r._id==='completed')?.count||0)/totalAppts*100)}%`
                : '—'}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-soft flex items-center justify-center">
            <Calendar size={18} className="text-error"/>
          </div>
          <div>
            <p className="text-xs text-text-muted">Cancellation Rate</p>
            <p className="font-bold text-text">
              {totalAppts > 0
                ? `${Math.round(((byStatus.find(r=>r._id==='cancelled')?.count||0)+(byStatus.find(r=>r._id==='rejected')?.count||0))/totalAppts*100)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin Settings ──────────────────────────────────────────────
export function AdminSettings() {
  const { data: raw, loading } = useAsync(() => adminApi.getSettings ? adminApi.getSettings() : Promise.resolve(null))
  const settings = raw?.data?.data || raw?.data || {}
  const [form,    setForm]    = useState(null)
  const [saving,  setSaving]  = useState(false)

  // Populate form once data loads
  React.useEffect(() => {
    if (settings && Object.keys(settings).length && !form) setForm(settings)
  }, [settings])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.updateSettings(form)
      toast.success('Settings saved!')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  if (loading || !form) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeUp">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-primary"/>
        <h2 className="font-display text-xl font-bold text-text">Platform Settings</h2>
      </div>

      {/* General */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-text border-b border-border pb-2">General</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-text-muted block mb-1">Platform Name</label>
            <input className="input w-full" value={form.platformName || ''} onChange={e => set('platformName', e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Support Email</label>
            <input className="input w-full" type="email" value={form.supportEmail || ''} onChange={e => set('supportEmail', e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Support Phone</label>
            <input className="input w-full" value={form.supportPhone || ''} onChange={e => set('supportPhone', e.target.value)}/>
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-text border-b border-border pb-2">Appointments</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Slot Duration (minutes)</label>
            <input className="input w-full" type="number" min="10" max="120" value={form.appointmentSlotMinutes || 30}
              onChange={e => set('appointmentSlotMinutes', parseInt(e.target.value))}/>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Max Booking Days Ahead</label>
            <input className="input w-full" type="number" min="1" max="365" value={form.maxBookingDaysAhead || 30}
              onChange={e => set('maxBookingDaysAhead', parseInt(e.target.value))}/>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1">Doctor Verification SLA (days)</label>
            <input className="input w-full" type="number" min="1" value={form.doctorVerificationDays || 2}
              onChange={e => set('doctorVerificationDays', parseInt(e.target.value))}/>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-text border-b border-border pb-2">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: 'enableSmsReminders',   label: 'Enable SMS Reminders',   desc: 'Send appointment & medication reminders via SMS' },
            { key: 'enableEmailReminders', label: 'Enable Email Reminders', desc: 'Send appointment confirmations and reminders via email' },
            { key: 'enableVoiceCalls',     label: 'Enable Voice Calls',     desc: 'Automated voice call reminders via Twilio' },
            { key: 'maintenanceMode',      label: 'Maintenance Mode',       desc: 'Disable public access while performing maintenance' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-text">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form[key] ? 'bg-primary' : 'bg-border'}`}
                onClick={() => set(key, !form[key])}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave} className="flex items-center gap-2">
          <Save size={15}/> Save Settings
        </Button>
      </div>
    </div>
  )
}

export default AdminReports
