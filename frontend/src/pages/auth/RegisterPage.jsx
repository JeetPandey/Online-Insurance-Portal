import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { useAuth } from '../../context/useAuth'
import toast from 'react-hot-toast'

const initialForm = {
  first_name: '', middle_name: '', last_name: '', username: '', password: '', password_confirm: '',
  mobile_number: '', address: '', email: '', date_of_birth: '', gender: '', city: '', phone_number: '',
}

function getError(error) {
  const payload = error?.response?.data ?? error?.data
  const detail = payload?.data
  if (detail && typeof detail === 'object') {
    const firstFieldError = Object.values(detail).flat(Infinity).find((value) => typeof value === 'string')
    if (firstFieldError) return firstFieldError
  }
  if (payload?.message || payload?.detail) return payload.message || payload.detail
  if (error?.response) return `Registration failed (HTTP ${error.response.status}). Please review your details and try again.`
  return 'Cannot reach the server. Check that the backend is running, then try again.'
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const newUser = await register(form)
      const next = new URLSearchParams(location.search).get('next')
      toast.success('Your customer account is ready.')
      navigate(newUser?.roles?.includes('CUSTOMER') && next?.startsWith('/customer/apply/') ? next : '/customer/dashboard', { replace: true })
    } catch (e) { const message = getError(e); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }

  return <AuthShell mode="register" hideHeading>
    <div className="auth-heading register-heading"><span className="eyebrow">CUSTOMER REGISTRATION</span><h2>Create your account</h2><p>Enter the details from your customer profile to get started.</p></div>
    <form className="auth-form register-form" onSubmit={submit}>
      {error && <div className="form-error" role="alert"><span>!</span>{error}</div>}
      <fieldset className="form-section"><legend>Customer name</legend><div className="field-grid name-grid">
        <div><label className="field-label" htmlFor="first_name">First name <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="first_name" name="first_name" autoComplete="given-name" maxLength={50} value={form.first_name} onChange={update} required /></div></div>
        <div><label className="field-label" htmlFor="middle_name">Middle name {/*<span className="optional">Optional</span>*/}</label><div className="input-wrap"><input id="middle_name" name="middle_name" autoComplete="additional-name" maxLength={50} value={form.middle_name} onChange={update} /></div></div>
        <div><label className="field-label" htmlFor="last_name">Last name <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="last_name" name="last_name" autoComplete="family-name" maxLength={50} value={form.last_name} onChange={update} required /></div></div>
      </div></fieldset>

      <div className="field-grid">
        <div><label className="field-label" htmlFor="username">User ID <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="username" name="username" autoComplete="username" maxLength={150} value={form.username} onChange={update} required /></div></div>
        <div><label className="field-label" htmlFor="date_of_birth">Date of birth <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="date_of_birth" name="date_of_birth" type="date" autoComplete="bday" value={form.date_of_birth} onChange={update} required /></div></div>
      </div>
      <div className="field-grid">
        <div><label className="field-label" htmlFor="gender">Gender <span className=" text-red-400">*</span></label><div className="input-wrap"><select id="gender" name="gender" value={form.gender} onChange={update} required><option value="" disabled>Select gender</option><option value="Female">Female</option><option value="Male">Male</option><option value="Other">Other</option></select></div></div>
        <div><label className="field-label" htmlFor="city">City <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="city" name="city" autoComplete="address-level2" maxLength={50} value={form.city} onChange={update} required /></div></div>
      </div>
      <label className="field-label" htmlFor="address">Address <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="address" name="address" autoComplete="street-address" maxLength={250} value={form.address} onChange={update} required /></div>
      <div className="field-grid">
        <div><label className="field-label" htmlFor="mobile_number">Mobile number <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="mobile_number" name="mobile_number" type="tel" autoComplete="tel" maxLength={20} value={form.mobile_number} onChange={update} required /></div></div>
        <div><label className="field-label" htmlFor="phone_number">Phone number <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="phone_number" name="phone_number" type="tel" autoComplete="tel-national" maxLength={20} value={form.phone_number} onChange={update} required /></div></div>
      </div>
      <label className="field-label" htmlFor="email">Email ID <span className=" text-red-400">*</span></label><div className="input-wrap"><span className="input-icon">@</span><input id="email" type="email" name="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={form.email} onChange={update} required /></div>
      <div className="field-grid">
        <div><label className="field-label" htmlFor="password">Password <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={form.password} onChange={update} required /></div><small className="password-hint">Use at least 8 characters; avoid your user ID or common passwords.</small></div>
        <div><label className="field-label" htmlFor="password_confirm">Confirm password <span className=" text-red-400">*</span></label><div className="input-wrap"><input id="password_confirm" name="password_confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={form.password_confirm} onChange={update} required /></div></div>
      </div>
      <label className="show-password-toggle"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show passwords</label>
      <button className="submit-button" disabled={busy}>{busy ? <><span className="button-spinner" /> Creating account…</> : <>Create account <span>→</span></>}</button>
      <p className="switch-auth">Already have an account? <Link to={`/login${location.search}`}>Sign in</Link></p>
    </form>
  </AuthShell>
}
