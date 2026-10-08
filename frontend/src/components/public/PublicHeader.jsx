import { useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react'
import { Link } from 'react-router-dom'
import { FiShield } from 'react-icons/fi'
import { useAuth } from '../../context/useAuth'

export default function PublicHeader() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const roles = user?.roles || (user?.role ? [user.role] : [])
  const dashboard = roles.includes('ADMIN') ? '/admin/dashboard' : roles.includes('AGENT') ? '/agent/dashboard' : '/customer/dashboard'
  const nav = [['Home', '/'], ['Policies', '/policies'], ['About', '/about']]
  return <LazyMotion features={domAnimation}><header className="sticky top-0 z-40 border-b border-base-300/70 bg-base-100/90 backdrop-blur-xl">
    <div className="navbar mx-auto max-w-7xl px-4 sm:px-6">
      <Link to="/" className="btn btn-ghost gap-2 px-2 text-lg font-extrabold"><span className="grid size-9 place-items-center rounded-xl bg-success text-success-content"><FiShield size={21}/></span><span>Online Insurance</span></Link>
      <nav className="ml-auto hidden items-center gap-2 md:flex">{nav.map(([label, to]) => <Link key={label} to={to} className="btn btn-ghost btn-sm">{label}</Link>)}{user ? <Link className="btn btn-success btn-sm" to={dashboard}>Dashboard</Link> : <><Link className="btn btn-ghost btn-sm" to="/login">Sign in</Link><Link className="btn btn-success btn-sm" to="/register">Create account</Link></>}</nav>
      <button className="btn btn-ghost btn-square ml-auto md:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button>
    </div>
    <AnimatePresence>{open && <m.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-base-300 px-5 pb-4 md:hidden">{nav.map(([label, to]) => <Link key={label} to={to} onClick={() => setOpen(false)} className="btn btn-ghost btn-block justify-start">{label}</Link>)}{user ? <Link className="btn btn-success btn-block mt-2" to={dashboard}>Dashboard</Link> : <div className="mt-2 grid grid-cols-2 gap-2"><Link className="btn btn-outline btn-success" to="/login">Sign in</Link><Link className="btn btn-success" to="/register">Register</Link></div>}</m.nav>}</AnimatePresence>
  </header></LazyMotion>
}
