import React, { useState } from 'react'
import { Bell, Plus, Trash2, Edit2, AlarmClock } from 'lucide-react'
import { Button, Input, Select, Modal, EmptyState, ConfirmDialog, StatusChip } from '../../components/common/index.jsx'
import { usePatientReminders } from '../../hooks/index.js'
import { patientApi } from '../../api/patientApi.js'
import { formatDate } from '../../utils/index.js'
import toast from 'react-hot-toast'

const REMINDER_TYPES    = [{value:'medication',label:'Medication'},{value:'appointment',label:'Appointment'},{value:'follow-up',label:'Follow-up'},{value:'refill',label:'Refill'},{value:'custom',label:'Custom'}]
const CHANNEL_OPTIONS   = [{value:'sms',label:'SMS'},{value:'email',label:'Email'},{value:'call',label:'Phone Call'},{value:'push',label:'Push Notification'}]
const REPEAT_OPTIONS    = [{value:'once',label:'Once'},{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}]

const blankForm = { title:'', description:'', type:'medication', scheduledTime:'', repeat:'once', channel:'sms' }

export default function PatientReminders() {
  const [showModal, setShowModal] = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [deleteId,  setDeleteId]  = useState(null)
  const [form,      setForm]      = useState(blankForm)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const { data, loading, execute: reload } = usePatientReminders()
  const reminders = Array.isArray(data) ? data : (data?.reminders || [])

  const openAdd  = ()     => { setForm(blankForm); setEditId(null); setShowModal(true) }
  const openEdit = (r)    => { setForm({ title:r.title, description:r.description||'', type:r.type, scheduledTime: new Date(r.scheduledTime).toISOString().slice(0,16), repeat:r.repeat, channel:r.channel }); setEditId(r._id); setShowModal(true) }

  const handleSave = async () => {
    if (!form.title || !form.scheduledTime) { toast.error('Title and time required'); return }
    setSaving(true)
    try {
      if (editId) await patientApi.updateReminder(editId, form)
      else        await patientApi.createReminder(form)
      toast.success(editId ? 'Reminder updated!' : 'Reminder created!')
      setShowModal(false); reload()
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await patientApi.deleteReminder(deleteId); toast.success('Reminder deleted'); setDeleteId(null); reload() }
    catch { toast.error('Delete failed') }
    finally { setDeleting(false) }
  }

  const handleSnooze = async (id) => {
    try { await patientApi.updateReminder(id, { status:'snoozed' }); toast.success('Snoozed 15 min'); reload() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-5 animate-fadeUp">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">My Reminders</h2>
        <Button onClick={openAdd} className="flex items-center gap-1.5 text-sm"><Plus size={14}/>New Reminder</Button>
      </div>

      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}
      {!loading && reminders.length === 0 && <EmptyState icon={<Bell size={28}/>} message="No reminders yet" action={{label:'Create Reminder', onClick:openAdd}}/>}

      <div className="space-y-3">
        {reminders.map(r => (
          <div key={r._id} className={`card p-4 flex items-center gap-4 ${r.status==='completed'?'opacity-60':''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${r.type==='medication'?'bg-primary-soft text-primary':r.type==='appointment'?'bg-accent-soft text-accent-dark':'bg-warning-soft text-warning'}`}>
              <Bell size={16}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-text">{r.title}</p>
                <StatusChip status={r.status}/>
                <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full capitalize">{r.channel}</span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {new Date(r.scheduledTime).toLocaleString()} · {r.repeat}
              </p>
              {r.description && <p className="text-xs text-text-muted mt-0.5">{r.description}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {r.status==='pending' && (
                <button onClick={() => handleSnooze(r._id)} title="Snooze 15min"
                  className="p-2 rounded-lg hover:bg-border/50 text-text-muted hover:text-warning">
                  <AlarmClock size={14}/>
                </button>
              )}
              <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-border/50 text-text-muted hover:text-text"><Edit2 size={14}/></button>
              <button onClick={() => setDeleteId(r._id)} className="p-2 rounded-lg hover:bg-error-soft text-text-muted hover:text-error"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Reminder' : 'New Reminder'}>
        <div className="space-y-4">
          <Input label="Title *" placeholder="e.g. Take Paracetamol" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          <Input label="Description" placeholder="Additional notes" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type"    options={REMINDER_TYPES}  value={form.type}    onChange={e=>setForm({...form,type:e.target.value})}/>
            <Select label="Channel" options={CHANNEL_OPTIONS} value={form.channel} onChange={e=>setForm({...form,channel:e.target.value})}/>
          </div>
          <Input label="Date & Time *" type="datetime-local" value={form.scheduledTime} onChange={e=>setForm({...form,scheduledTime:e.target.value})}/>
          <Select label="Repeat" options={REPEAT_OPTIONS} value={form.repeat} onChange={e=>setForm({...form,repeat:e.target.value})}/>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1 justify-center" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1 justify-center" loading={saving} onClick={handleSave}>Save Reminder</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} title="Delete Reminder" message="Are you sure you want to delete this reminder?"
        confirmLabel="Delete" variant="error" loading={deleting}
        onConfirm={handleDelete} onClose={() => setDeleteId(null)}
      />
    </div>
  )
}
