import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const navigation = {
  ADMIN: [
    ['Dashboard', '/admin/dashboard'], ['Customers', '/admin/customers'], ['Policies', '/admin/policies'],
    ['Applications', '/admin/applications'], ['Payments', '/admin/payments'], ['Renewals', '/admin/renewals'],
    ['Reminders', '/admin/reminders'], ['Staff & agents', '/admin/staff'], ['Reports', '/admin/reports'],
  ],
  CUSTOMER: [
    ['Dashboard', '/customer/dashboard'], ['Browse policies', '/customer/policies'],
    ['My applications', '/customer/applications'], ['My policies', '/customer/active-policies'],
    ['Payments & receipts', '/customer/payments'], ['Renewals', '/customer/renewals'], ['Reminders', '/customer/reminders'],
  ],
  AGENT: [
    ['Dashboard', '/agent/dashboard'], ['Assigned applications', '/agent/applications'], ['Reports', '/agent/reports'],
  ],
}

export function PortalLayout({ area }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = navigation[area] || []
  const signOut = async () => { await logout(); navigate('/login', { replace: true }) }
  return <div className="portal-shell">
    <aside className={`portal-sidebar ${menuOpen ? 'portal-sidebar-open' : ''}`}>
      <div className="portal-brand"><span className="portal-brand-mark">S</span><span>Sureway<span className="brand-dot">.</span><small>Insurance Portal</small></span></div>
      <div className="portal-area-label">{area} WORKSPACE</div>
      <nav className="portal-nav">{links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'portal-nav-link active' : 'portal-nav-link'}>{label}</NavLink>)}</nav>
      <div className="portal-sidebar-foot">Synopsis-based policy servicing</div>
    </aside>
    {menuOpen && <button aria-label="Close navigation" className="portal-overlay" onClick={() => setMenuOpen(false)} />}
    <div className="portal-main-column">
      <header className="portal-topbar"><button className="portal-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button><div className="portal-breadcrumb">Online Insurance Portal <span>/</span> {area}</div><div className="portal-user"><div className="portal-user-avatar">{(user?.first_name || user?.username || 'U').slice(0, 1).toUpperCase()}</div><div><b>{user?.first_name || user?.username}</b><small>{area}</small></div><button className="portal-signout" onClick={signOut}>Sign out</button></div></header>
      <main className="portal-content"><Outlet /></main>
    </div>
  </div>
}
