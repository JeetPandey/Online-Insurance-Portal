import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from './AuthShell'
import { useAuth } from '../../context/useAuth'
import toast from 'react-hot-toast'

function getLoginError(error) {
  const payload = error?.response?.data
  if (payload?.message || payload?.detail) return payload.message || payload.detail
  if (error?.response) return `Sign in failed (HTTP ${error.response.status}). Check your user ID and password.`
  return 'Cannot reach the server. Check that the backend is running, then try again.'
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const signedInUser = await login(form)
      const next = new URLSearchParams(location.search).get('next')
      const roles = signedInUser?.roles || (signedInUser?.role ? [signedInUser.role] : [])
      const home = roles.includes('ADMIN') ? '/admin/dashboard' : roles.includes('AGENT') ? '/agent/dashboard' : '/customer/dashboard'
      toast.success('You are signed in.')
      navigate(roles.includes('CUSTOMER') && next?.startsWith('/customer/apply/') ? next : home, { replace: true })
    } catch (e) { const message = getLoginError(e); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  return <AuthShell mode="login"><form className="auth-form" onSubmit={submit}>
    {error && <div className="form-error" role="alert"><span>!</span>{error}</div>}
    <label className="field-label" htmlFor="username">User ID</label>
    <div className="input-wrap"><input id="username" name="username" autoComplete="username" placeholder="Enter your user ID" value={form.username} onChange={update} required /></div>
    <div className="label-row"><label className="field-label" htmlFor="password">Password</label><Link to="/forgot-password">Forgot password?</Link></div>
    <div className="input-wrap"><span className="input-icon lock-icon">⌑</span><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={update} required /><button className="show-password" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
    <button className="submit-button" disabled={busy}>{busy ? <><span className="button-spinner" /> Signing in…</> : <>Sign in <span>→</span></>}</button>
    <p className="switch-auth">New to Online Insurance? <Link to={`/register${location.search}`}>Create an account</Link></p>
  </form></AuthShell>
}
