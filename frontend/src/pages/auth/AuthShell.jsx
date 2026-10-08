import { Link } from 'react-router-dom'

export function AuthShell({ children, mode, hideHeading = false }) {
  return <main className="auth-page">
    <aside className="auth-aside">
      <Link className="brand brand-light" to="/">Online Insurance Policy<span>.</span></Link>
      <div className="aside-copy"><span className="eyebrow">CONFIDENCE FOR WHAT'S NEXT</span><h1>Protection that moves with you.</h1><p>Simple, thoughtful insurance for the moments that matter.</p><div className="aside-foot"><span className="status-dot" /> A clearer way to feel covered</div></div>
      <div className="aside-orb orb-one" /><div className="aside-orb orb-two" />
    </aside>
    <section className="auth-main">
      <div className="mobile-brand"><Link className="brand" to="/">Online Insurance<span>.</span></Link></div>
      <div className="auth-card">{!hideHeading && <div className="auth-heading"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span><h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p>{mode === 'login' ? 'Enter your details to continue to your portal.' : 'A few details and your insurance portal is ready.'}</p></div>}{children}</div>
      <p className="legal-note">By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>
    </section>
  </main>
}
