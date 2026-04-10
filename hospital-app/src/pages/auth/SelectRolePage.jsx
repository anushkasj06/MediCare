import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Eye, EyeOff, User, Stethoscope, ShieldCheck, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { setCredentials } from '../../context/authSlice.js'
import { Input, Select, Button, PasswordStrengthMeter, FileUploader } from '../../components/common/index.jsx'
import { SPECIALIZATIONS, GENDERS, BLOOD_GROUPS } from '../../utils/index.js'
import { authApi } from '../../api/authApi.js'
import toast from 'react-hot-toast'

// ── SelectRolePage ─────────────────────────────────────────────
export function SelectRolePage() {
  const navigate = useNavigate()
  return (
    <div className="animate-fadeUp">
      <h2 className="font-display text-2xl font-bold text-text mb-1">Join CareConnect</h2>
      <p className="text-sm text-text-muted mb-8">Choose how you want to continue</p>
      <div className="space-y-3">
        {[
          { role:'patient', icon:<User size={22}/>,        title:'I am a Patient',    desc:'Book appointments, manage prescriptions, track health',  path:'/register/patient', color:'bg-primary-soft text-primary' },
          { role:'doctor',  icon:<Stethoscope size={22}/>, title:'I am a Doctor',     desc:'Manage appointments, upload prescriptions, grow your practice', path:'/register/doctor', color:'bg-accent-soft text-accent-dark' },
        ].map(r => (
          <button key={r.role} onClick={() => navigate(r.path)}
            className="w-full card p-5 flex items-center gap-4 hover:shadow-md transition-all text-left group border-2 border-transparent hover:border-primary">
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', r.color)}>{r.icon}</div>
            <div className="flex-1">
              <p className="font-semibold text-text text-sm">{r.title}</p>
              <p className="text-xs text-text-muted">{r.desc}</p>
            </div>
            <ShieldCheck size={16} className="text-border group-hover:text-primary transition-colors" />
          </button>
        ))}
        <div className="text-center pt-2">
          <p className="text-sm text-text-muted">Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}

// ── LoginPage ─────────────────────────────────────────────────
export function LoginPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [form,    setForm]    = useState({ emailOrPhone:'', password:'', rememberMe:false })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const validate = () => {
    const e = {}
    if (!form.emailOrPhone) e.emailOrPhone = 'Email or phone is required'
    if (!form.password)     e.password     = 'Password is required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { user, token, refreshToken } = res.data.data
      dispatch(setCredentials({ user, token, refreshToken }))
      toast.success('Welcome back!')
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fadeUp">
      <h2 className="font-display text-2xl font-bold text-text mb-1">Welcome back</h2>
      <p className="text-sm text-text-muted mb-6">Sign in to your CareConnect account</p>
      <div className="space-y-4">
        <Input label="Email or Phone" type="text" placeholder="you@example.com or 9999999999"
          value={form.emailOrPhone} onChange={e => setForm({...form,emailOrPhone:e.target.value})} error={errors.emailOrPhone} />
        <div>
          <Input label="Password" type={showPwd?'text':'password'} placeholder="Enter password"
            value={form.password} onChange={e => setForm({...form,password:e.target.value})} error={errors.password}
            icon={<button type="button" onClick={() => setShowPwd(!showPwd)} className="text-text-light hover:text-text">{showPwd?<EyeOff size={15}/>:<Eye size={15}/>}</button>}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-text-muted">
            <input type="checkbox" checked={form.rememberMe} onChange={e => setForm({...form,rememberMe:e.target.checked})} className="rounded" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline text-xs">Forgot password?</Link>
        </div>
        <Button variant="primary" className="w-full justify-center" loading={loading} onClick={handleSubmit}>Sign In</Button>
        <p className="text-center text-sm text-text-muted">
          New here? <Link to="/select-role" className="text-primary font-medium hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  )
}

// ── PatientRegister ───────────────────────────────────────────
export function PatientRegister() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName:'', email:'', phone:'', password:'', confirmPassword:'',
    dateOfBirth:'', gender:'', bloodGroup:'',
    address:{ street:'', city:'', state:'', zipCode:'', country:'India' },
    emergencyContact:{ name:'', phone:'', relationship:'' },
    allergies:'', chronicConditions:'', consentAccepted:false,
  })
  const [errors, setErrors] = useState({})
  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  const setAddr = (k,v) => setForm(f => ({...f,address:{...f.address,[k]:v}}))
  const setEmrg = (k,v) => setForm(f => ({...f,emergencyContact:{...f.emergencyContact,[k]:v}}))

  const validateStep1 = () => {
    const e = {}
    if (!form.fullName) e.fullName = 'Required'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.phone  || form.phone.length < 10) e.phone = 'Valid phone required'
    if (!form.password || form.password.length < 8) {
      e.password = 'Min 8 characters'
    } else if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(form.password)) {
      e.password = 'Needs uppercase, number, and special character'
    }
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleRegister = async () => {
    if (!form.consentAccepted) { toast.error('Please accept the terms'); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        allergies:         form.allergies         ? form.allergies.split(',').map(s=>s.trim()) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s=>s.trim()) : [],
        consentAccepted:   true,
      }
      const res = await authApi.registerPatient(payload)
      const { user, token, refreshToken } = res.data.data
      dispatch(setCredentials({ user, token, refreshToken }))
      toast.success('Account created successfully!')
      navigate('/patient/dashboard')
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fadeUp">
      <button onClick={() => step > 1 ? setStep(s=>s-1) : navigate('/select-role')} className="flex items-center gap-1.5 text-text-muted text-sm mb-5 hover:text-text">
        <ArrowLeft size={14}/> Back
      </button>
      <h2 className="font-display text-2xl font-bold text-text mb-1">Create Patient Account</h2>
      <div className="flex gap-1 mb-6 mt-3">
        {[1,2,3].map(s=>(
          <div key={s} className={clsx('h-1 flex-1 rounded-full transition-all',s<=step?'bg-primary':'bg-border')} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Input label="Full Name*" placeholder="Vedant Ingle" value={form.fullName} onChange={e=>set('fullName',e.target.value)} error={errors.fullName} />
          <Input label="Email*" type="email" placeholder="vedant@example.com" value={form.email} onChange={e=>set('email',e.target.value)} error={errors.email} />
          <Input label="Phone*" type="tel" placeholder="9999999999" value={form.phone} onChange={e=>set('phone',e.target.value)} error={errors.phone} />
          <Input label="Password*" type="password" placeholder="Min 8 characters" value={form.password} onChange={e=>set('password',e.target.value)} error={errors.password} />
          <PasswordStrengthMeter password={form.password} />
          <Input label="Confirm Password*" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} error={errors.confirmPassword} />
          <Button className="w-full justify-center" onClick={() => validateStep1() && setStep(2)}>Next →</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} />
            <Select label="Gender" options={GENDERS.map(g=>({value:g,label:g.charAt(0).toUpperCase()+g.slice(1)}))} value={form.gender} onChange={e=>set('gender',e.target.value)} />
          </div>
          <Select label="Blood Group" options={BLOOD_GROUPS.map(b=>({value:b,label:b}))} value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)} />
          <Input label="Street Address" value={form.address.street} onChange={e=>setAddr('street',e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.address.city} onChange={e=>setAddr('city',e.target.value)} />
            <Input label="State" value={form.address.state} onChange={e=>setAddr('state',e.target.value)} />
          </div>
          <Button className="w-full justify-center" onClick={()=>setStep(3)}>Next →</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Emergency Contact</p>
          <Input label="Name" value={form.emergencyContact.name} onChange={e=>setEmrg('name',e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={form.emergencyContact.phone} onChange={e=>setEmrg('phone',e.target.value)} />
            <Input label="Relation" value={form.emergencyContact.relationship} onChange={e=>setEmrg('relationship',e.target.value)} />
          </div>
          <Input label="Allergies (comma separated)" placeholder="Penicillin, Dust" value={form.allergies} onChange={e=>set('allergies',e.target.value)} />
          <Input label="Chronic Conditions" placeholder="Diabetes, Hypertension" value={form.chronicConditions} onChange={e=>set('chronicConditions',e.target.value)} />
          <label className="flex items-start gap-2 cursor-pointer text-xs text-text-muted">
            <input type="checkbox" className="mt-0.5 rounded" checked={form.consentAccepted} onChange={e=>set('consentAccepted',e.target.checked)} />
            I agree to the <a href="#" className="text-primary hover:underline ml-0.5">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </label>
          <Button className="w-full justify-center" loading={loading} onClick={handleRegister}>Create Account</Button>
        </div>
      )}

      <p className="text-center text-sm text-text-muted mt-4">
        Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

// ── DoctorRegister ────────────────────────────────────────────
export function DoctorRegister() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName:'', email:'', phone:'', password:'', confirmPassword:'',
    specialization:'', experienceYears:'', licenseNumber:'', licenseExpiry:'',
    hospitalName:'', consultationFee:'', about:'', languages:'',
    medicalLicenseFile:null, degreeCertificateFiles:[], governmentIdFile:null, profilePhoto:null,
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleRegister = async () => {
    setLoading(true)
    try {
      const res = await authApi.registerDoctor({
        fullName:       form.fullName,
        email:          form.email,
        phone:          form.phone,
        password:       form.password,
        specialization: form.specialization,
        experienceYears:form.experienceYears,
        licenseNumber:  form.licenseNumber,
        licenseExpiry:  form.licenseExpiry,
        hospitalName:   form.hospitalName,
        consultationFee:form.consultationFee,
        about:          form.about,
        languages:      form.languages ? form.languages.split(',').map(s=>s.trim()) : [],
      })
      const { user, token, refreshToken } = res.data.data
      dispatch(setCredentials({ user, token, refreshToken }))
      toast.success('Application submitted! Pending admin verification.')
      navigate('/doctor/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fadeUp">
      <button onClick={() => step > 1 ? setStep(s=>s-1) : navigate('/select-role')} className="flex items-center gap-1.5 text-text-muted text-sm mb-5 hover:text-text">
        <ArrowLeft size={14}/> Back
      </button>
      <h2 className="font-display text-2xl font-bold text-text mb-1">Doctor Registration</h2>
      <div className="flex gap-1 mb-6 mt-3">
        {[1,2,3].map(s=>(<div key={s} className={clsx('h-1 flex-1 rounded-full transition-all',s<=step?'bg-accent':'bg-border')} />))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Input label="Full Name*" placeholder="Dr. Meera Patil" value={form.fullName} onChange={e=>set('fullName',e.target.value)} />
          <Input label="Email*" type="email" value={form.email} onChange={e=>set('email',e.target.value)} />
          <Input label="Phone*" type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} />
          <Input label="Password*" type="password" value={form.password} onChange={e=>set('password',e.target.value)} />
          <PasswordStrengthMeter password={form.password} />
          <Input label="Confirm Password*" type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} />
          <Button className="w-full justify-center" onClick={()=>setStep(2)}>Next →</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Select label="Specialization*" options={SPECIALIZATIONS.map(s=>({value:s,label:s}))} value={form.specialization} onChange={e=>set('specialization',e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Experience (years)*" type="number" value={form.experienceYears} onChange={e=>set('experienceYears',e.target.value)} />
            <Input label="Consultation Fee (₹)*" type="number" value={form.consultationFee} onChange={e=>set('consultationFee',e.target.value)} />
          </div>
          <Input label="License Number*" value={form.licenseNumber} onChange={e=>set('licenseNumber',e.target.value)} />
          <Input label="License Expiry" type="date" value={form.licenseExpiry} onChange={e=>set('licenseExpiry',e.target.value)} />
          <Input label="Hospital/Clinic Name" value={form.hospitalName} onChange={e=>set('hospitalName',e.target.value)} />
          <Input label="Languages (comma separated)" placeholder="English, Hindi, Marathi" value={form.languages} onChange={e=>set('languages',e.target.value)} />
          <Button className="w-full justify-center" onClick={()=>setStep(3)}>Next →</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <FileUploader label="Medical License*" accept=".pdf,.jpg,.png" onChange={f=>set('medicalLicenseFile',f)} value={form.medicalLicenseFile} hint="PDF or image, max 5MB" />
          <FileUploader label="Degree Certificates" accept=".pdf,.jpg,.png" multiple onChange={f=>set('degreeCertificateFiles',f)} value={form.degreeCertificateFiles} hint="Upload all degree docs" />
          <FileUploader label="Government ID*" accept=".pdf,.jpg,.png" onChange={f=>set('governmentIdFile',f)} value={form.governmentIdFile} hint="Aadhaar, PAN, or Passport" />
          <FileUploader label="Profile Photo" accept=".jpg,.jpeg,.png" onChange={f=>set('profilePhoto',f)} value={form.profilePhoto} />
          <div className="bg-warning-soft rounded-xl p-3 text-xs text-text-muted">
            ⚠️ Your account will be reviewed by admin before activation. Usually takes 24–48 hours.
          </div>
          <Button variant="accent" className="w-full justify-center" loading={loading} onClick={handleRegister}>Submit Application</Button>
        </div>
      )}
    </div>
  )
}

// ── ForgotPassword ────────────────────────────────────────────
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent,  setSent]  = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!email) { toast.error('Please enter your email'); return }
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      toast.success('Reset link sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fadeUp">
      <Link to="/login" className="flex items-center gap-1.5 text-text-muted text-sm mb-5 hover:text-text"><ArrowLeft size={14}/> Back to Login</Link>
      <h2 className="font-display text-2xl font-bold text-text mb-1">Forgot Password</h2>
      {sent ? (
        <div className="bg-success-soft rounded-xl p-5 text-center mt-6">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-semibold text-success mb-1">Check your email</p>
          <p className="text-xs text-text-muted">We sent a password reset link to <strong>{email}</strong></p>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <p className="text-sm text-text-muted">Enter your email and we'll send you a reset link.</p>
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <Button className="w-full justify-center" loading={loading} onClick={handleSend}>Send Reset Link</Button>
        </div>
      )}
    </div>
  )
}

// ── ResetPassword ─────────────────────────────────────────────
export function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ newPassword:'', confirmPassword:'' })
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const token = new URLSearchParams(window.location.search).get('token') || window.location.pathname.split('/').pop()
      await authApi.resetPassword(token, { newPassword: form.newPassword, confirmPassword: form.confirmPassword })
      toast.success('Password reset! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may be expired.')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fadeUp">
      <h2 className="font-display text-2xl font-bold text-text mb-6">Set New Password</h2>
      <div className="space-y-4">
        <Input label="New Password" type="password" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})} />
        <PasswordStrengthMeter password={form.newPassword} />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} />
        <Button className="w-full justify-center" loading={loading} onClick={handle}>Reset Password</Button>
      </div>
    </div>
  )
}

export default SelectRolePage
