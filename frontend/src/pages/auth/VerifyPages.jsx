import React, { useState } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { MailCheck, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button, Input } from '../../components/common/index.jsx'
import { authApi } from '../../api/authApi.js'
import toast from 'react-hot-toast'

export function VerifyEmailPage() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const [status, setStatus] = useState(token ? 'verifying' : 'pending')

  React.useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then(() => setStatus('done'))
      .catch(() => { toast.error('Verification failed or link expired'); setStatus('failed') })
  }, [token])

  return (
    <div className="animate-fadeUp text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center mx-auto mb-5">
        <MailCheck size={28} className="text-primary" />
      </div>
      {status === 'verifying' && (<><h2 className="font-display text-2xl font-bold text-text mb-2">Verifying…</h2><div className="mt-6 flex justify-center"><RefreshCw size={20} className="text-primary animate-spin" /></div></>)}
      {status === 'done'      && (<><h2 className="font-display text-2xl font-bold text-text mb-2">Email Verified ✅</h2><p className="text-sm text-text-muted mb-6">Your email has been verified.</p><button onClick={() => navigate('/login')} className="btn-primary mx-auto">Go to Login</button></>)}
      {status === 'failed'    && (<><h2 className="font-display text-2xl font-bold text-text mb-2">Verification Failed</h2><p className="text-sm text-text-muted mb-6">Link expired or invalid.</p><button onClick={() => navigate('/login')} className="btn-primary mx-auto">Back to Login</button></>)}
      {status === 'pending'   && (<><h2 className="font-display text-2xl font-bold text-text mb-2">Check your inbox</h2><p className="text-sm text-text-muted mb-6">We sent a verification link to your email. Click it to verify.</p><Link to="/login" className="text-sm text-text-muted hover:text-primary flex items-center justify-center gap-1 mt-6"><ArrowLeft size={13}/> Back to Login</Link></>)}
    </div>
  )
}

export function VerifyPhonePage() {
  const navigate = useNavigate()
  const [phone, setPhone]       = useState('')
  const [otp,   setOtp]         = useState(['','','','','',''])
  const [step,  setStep]        = useState('phone')
  const [loading,  setLoading]  = useState(false)
  const [resending,setResending]= useState(false)

  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) document.getElementById(`otp-${idx+1}`)?.focus()
  }
  const handleKeyDown = (e, idx) => { if (e.key==='Backspace' && !otp[idx] && idx>0) document.getElementById(`otp-${idx-1}`)?.focus() }

  const handleSendOtp = async () => {
    if (!phone) { toast.error('Enter your phone'); return }
    setLoading(true)
    try { await authApi.sendPhoneOtp({ phone }); toast.success('OTP sent'); setStep('otp') }
    catch (e) { toast.error(e?.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }
  const handleVerify = async () => {
    const code = otp.join(''); if (code.length<6) { toast.error('Enter 6 digits'); return }
    setLoading(true)
    try { await authApi.confirmPhoneOtp({ phone, otp: code }); toast.success('Phone verified!'); navigate('/login') }
    catch (e) { toast.error(e?.response?.data?.message || 'Invalid OTP') }
    finally { setLoading(false) }
  }
  const handleResend = async () => {
    setResending(true)
    try { await authApi.sendPhoneOtp({ phone }); toast.success('OTP resent'); setOtp(['','','','','','']); document.getElementById('otp-0')?.focus() }
    catch { toast.error('Resend failed') }
    finally { setResending(false) }
  }

  return (
    <div className="animate-fadeUp text-center">
      <div className="w-16 h-16 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-5"><ShieldCheck size={28} className="text-success" /></div>
      <h2 className="font-display text-2xl font-bold text-text mb-1">Verify your phone</h2>
      {step === 'phone' ? (
        <div className="space-y-4 mt-6 text-left">
          <Input label="Phone Number" type="tel" placeholder="9999999999" value={phone} onChange={e=>setPhone(e.target.value)} />
          <Button loading={loading} onClick={handleSendOtp} className="w-full justify-center">Send OTP</Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-muted mb-7">OTP sent to <strong>{phone}</strong></p>
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit,idx) => (
              <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength={1}
                value={digit} onChange={e=>handleChange(e.target.value,idx)} onKeyDown={e=>handleKeyDown(e,idx)}
                className="w-11 h-12 text-center text-lg font-bold border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus={idx===0} />
            ))}
          </div>
          <Button loading={loading} onClick={handleVerify} className="w-full justify-center mb-4">Verify OTP</Button>
          <p className="text-xs text-text-muted">Didn't receive? <button onClick={handleResend} disabled={resending} className="text-primary hover:underline font-medium disabled:opacity-50">{resending?'Resending…':'Resend OTP'}</button></p>
        </>
      )}
      <div className="mt-4"><Link to="/login" className="text-sm text-text-muted hover:text-primary flex items-center justify-center gap-1"><ArrowLeft size={13}/> Back to Login</Link></div>
    </div>
  )
}

export default function VerifyPageRouter() {
  const location = useLocation()
  return location.pathname.startsWith('/verify-phone') ? <VerifyPhonePage /> : <VerifyEmailPage />
}
