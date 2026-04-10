import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { User, Bell, Lock, Phone, Heart } from 'lucide-react'
import { Input, Select, Button, TextArea, Tabs } from '../../components/common/index.jsx'
import { updateUser } from '../../context/authSlice.js'
import { patientApi } from '../../api/patientApi.js'
import { usePatientNotifications } from '../../hooks/index.js'
import { GENDERS, BLOOD_GROUPS } from '../../utils/index.js'
import toast from 'react-hot-toast'

// ── Patient Profile ─────────────────────────────────────────────
export function PatientProfile() {
  const dispatch = useDispatch()
  const user     = useSelector(s => s.auth.user)
  const [tab,     setTab]     = useState('personal')
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({
    fullName:    user?.fullName    || '',
    phone:       user?.phone       || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender:      user?.gender      || '',
    bloodGroup:  user?.bloodGroup  || '',
    address: {
      street:  user?.address?.street  || '',
      city:    user?.address?.city    || '',
      state:   user?.address?.state   || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || 'India',
    },
    emergencyContact: {
      name:         user?.emergencyContact?.name         || '',
      phone:        user?.emergencyContact?.phone        || '',
      relationship: user?.emergencyContact?.relationship || '',
    },
    allergies:         (user?.allergies         || []).join(', '),
    chronicConditions: (user?.chronicConditions || []).join(', '),
  })

  const set     = (k,v)   => setForm(f => ({...f, [k]:v}))
  const setAddr = (k,v)   => setForm(f => ({...f, address:{...f.address,[k]:v}}))
  const setEmrg = (k,v)   => setForm(f => ({...f, emergencyContact:{...f.emergencyContact,[k]:v}}))

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        allergies:         form.allergies         ? form.allergies.split(',').map(s=>s.trim()).filter(Boolean)         : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s=>s.trim()).filter(Boolean) : [],
      }
      const res = await patientApi.updateProfile(payload)
      dispatch(updateUser(res.data.data))
      toast.success('Profile updated!')
    } catch (e) { toast.error(e?.response?.data?.message || 'Update failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">My Profile</h2>

      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold">
          {form.fullName?.charAt(0) || 'P'}
        </div>
        <div>
          <p className="font-display text-lg font-bold text-text">{form.fullName}</p>
          <p className="text-sm text-text-muted">{user?.email}</p>
          {user?.emailVerified && <span className="badge-success text-xs mt-1">Email Verified</span>}
        </div>
      </div>

      <Tabs tabs={[{id:'personal',label:'Personal'},{id:'address',label:'Address'},{id:'medical',label:'Medical'},{id:'emergency',label:'Emergency'}]} active={tab} onChange={setTab}/>

      {tab === 'personal' && (
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name"    value={form.fullName}    onChange={e=>set('fullName',e.target.value)}/>
            <Input label="Phone"        type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)}/>
            <Input label="Date of Birth"type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)}/>
            <Select label="Gender"      options={[{value:'',label:'Select'},...(GENDERS||[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]).map(g=>({value:g,label:g}))]} value={form.gender} onChange={e=>set('gender',e.target.value)}/>
            <Select label="Blood Group" options={[{value:'',label:'Select'},...(BLOOD_GROUPS||['A+','A-','B+','B-','AB+','AB-','O+','O-']).map(g=>({value:g,label:g}))]} value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)}/>
          </div>
        </div>
      )}

      {tab === 'address' && (
        <div className="card p-5 space-y-4">
          <Input label="Street"    value={form.address.street}  onChange={e=>setAddr('street',e.target.value)}/>
          <div className="grid grid-cols-2 gap-3">
            <Input label="City"    value={form.address.city}    onChange={e=>setAddr('city',e.target.value)}/>
            <Input label="State"   value={form.address.state}   onChange={e=>setAddr('state',e.target.value)}/>
            <Input label="Zip"     value={form.address.zipCode} onChange={e=>setAddr('zipCode',e.target.value)}/>
            <Input label="Country" value={form.address.country} onChange={e=>setAddr('country',e.target.value)}/>
          </div>
        </div>
      )}

      {tab === 'medical' && (
        <div className="card p-5 space-y-4">
          <Input label="Allergies (comma separated)" placeholder="Penicillin, Dust, Pollen" value={form.allergies} onChange={e=>set('allergies',e.target.value)}/>
          <Input label="Chronic Conditions (comma separated)" placeholder="Diabetes, Hypertension" value={form.chronicConditions} onChange={e=>set('chronicConditions',e.target.value)}/>
        </div>
      )}

      {tab === 'emergency' && (
        <div className="card p-5 space-y-4">
          <Input label="Contact Name"         value={form.emergencyContact.name}         onChange={e=>setEmrg('name',e.target.value)}/>
          <Input label="Contact Phone"        type="tel" value={form.emergencyContact.phone} onChange={e=>setEmrg('phone',e.target.value)}/>
          <Input label="Relationship"         value={form.emergencyContact.relationship} onChange={e=>setEmrg('relationship',e.target.value)}/>
        </div>
      )}

      <div className="flex justify-end">
        <Button loading={loading} onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}

// ── Patient Notifications ───────────────────────────────────────
export function PatientNotifications() {
  const { data, loading } = usePatientNotifications()
  const notifications = Array.isArray(data) ? data : []

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeUp">
      <h2 className="font-display text-xl font-bold text-text">Notifications</h2>
      {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}
      {!loading && notifications.length === 0 && (
        <div className="card p-10 text-center text-text-muted">No notifications yet</div>
      )}
      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n._id} className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.status==='sent'?'bg-success-soft text-success':'bg-error-soft text-error'}`}>
              <Bell size={15}/>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-text">{n.title || n.type}</p>
              <p className="text-xs text-text-muted mt-0.5">{n.body}</p>
              <p className="text-xs text-text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${n.status==='sent'?'bg-success-soft text-success':'bg-error-soft text-error'}`}>
              {n.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PatientProfile
