import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'motion/react'
import PublicHeader from '../components/public/PublicHeader'
import AppButton from '../components/button/AppButton'
import EmptyState from '../components/feedback/EmptyState'
import { useAuth } from '../context/useAuth'
import { getRequestError, portalService } from '../services/portalService'

function PolicyCard({ policy, index = 0 }) {
  return <m.article initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07 }} className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
    <div className="card-body">
      <div className="flex items-center justify-between gap-3"><span className="badge badge-outline badge-success">{policy.category}</span><span className="text-xs opacity-60">Plan {policy.plan_no}</span></div>
      <h3 className="card-title mt-2">{policy.policy_name}</h3>
      <p className="min-h-12 text-sm opacity-70">{policy.description || 'Read the plan details, eligibility and terms.'}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="badge badge-ghost">₹{policy.policy_premium} premium</span><span className="badge badge-ghost">{policy.policy_term} years</span></div>
      <div className="card-actions mt-4 justify-end"><Link className="btn btn-sm btn-outline btn-success" to={`/policies/${policy.id}`}>View details</Link></div>
    </div>
  </m.article>
}

export function PublicHome() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { portalService.policies().then(setPolicies).catch((e) => setError(getRequestError(e))).finally(() => setLoading(false)) }, [])
  return <LazyMotion features={domAnimation}><main className="min-h-screen bg-base-200/50 text-base-content">
    <PublicHeader />
    <section className="relative overflow-hidden bg-gradient-to-br from-success/10 via-base-100 to-primary/10 px-5 py-24 sm:py-32">
      <m.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-4xl text-center">
        <span className="badge badge-success badge-outline">ONLINE INSURANCE PORTAL</span>
        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Cover for the moments that matter.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base opacity-70 sm:text-lg">Explore life and health plans, compare benefits, and apply online. You can review the available plans before creating an account.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><a className="btn btn-success" href="#policies">Explore policies</a><Link className="btn btn-outline btn-success" to="/register">Create customer account</Link></div>
      </m.div>
    </section>
    <section id="policies" className="scroll-mt-24 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl"><div className="mb-8"><span className="text-sm font-bold uppercase tracking-widest text-success">Policy catalog</span><h2 className="mt-2 text-3xl font-bold">Plans available on the portal</h2><p className="mt-2 opacity-70">Anyone can view plan details. Sign up or sign in as a customer to apply.</p></div>
        {error && <div role="alert" className="alert alert-error mb-5"><span>{error}</span></div>}
        {loading ? <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-success" /></div> : policies.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{policies.map((policy, index) => <PolicyCard key={policy.id} policy={policy} index={index} />)}</div> : <div className="rounded-2xl bg-base-100"><EmptyState title="No policies have been added yet" message="An Admin can create plans from the Admin dashboard. For local testing, run the seed_demo_policies command shown in the project README." action={<Link className="btn btn-sm btn-outline" to="/login">Admin sign in</Link>} />{!error && <p className="pb-5 text-center text-xs opacity-50">The catalog is connected; the database currently contains no active policies.</p>}</div>}
      </div>
    </section>
    <section id="about" className="scroll-mt-24 bg-base-100 px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:items-center"><div><span className="text-sm font-bold uppercase tracking-widest text-success">About the portal</span><h2 className="mt-2 text-3xl font-bold">A clear path from browsing to coverage</h2><p className="mt-4 leading-7 opacity-70">Customers can browse plan details without an account. To purchase, create an account, submit an application, wait for Admin review, then complete the demo payment to receive a policy and receipt.</p></div><ol className="steps steps-vertical"><li className="step step-success">Browse plans</li><li className="step step-success">Register and apply</li><li className="step step-success">Admin reviews application</li><li className="step step-success">Pay and receive policy</li></ol></div></section>
    <footer className="footer footer-center bg-neutral p-6 text-neutral-content"><p>Sureway Online Insurance Portal · Life and health plan servicing</p></footer>
  </main></LazyMotion>
}

export function PublicPolicyDetailsPage() {
  const { policyId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { portalService.policy(policyId).then(setPolicy).catch((e) => setError(getRequestError(e))).finally(() => setLoading(false)) }, [policyId])
  const roles = user?.roles || (user?.role ? [user.role] : [])
  const apply = () => {
    if (roles.includes('CUSTOMER')) navigate(`/customer/apply/${policyId}`)
    else if (!user) navigate(`/register?next=${encodeURIComponent(`/customer/apply/${policyId}`)}`)
  }
  const dashboard = roles.includes('ADMIN') ? '/admin/dashboard' : roles.includes('AGENT') ? '/agent/dashboard' : '/customer/dashboard'
  return <LazyMotion features={domAnimation}><main className="min-h-screen bg-base-200/50"><PublicHeader />
    {loading && <div className="flex justify-center py-24"><span className="loading loading-spinner loading-lg text-success" /></div>}
    {error && <div role="alert" className="alert alert-error mx-auto mt-8 max-w-3xl">{error}</div>}
    {policy && <m.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto my-10 max-w-4xl px-5 sm:my-16">
      <div className="card border border-base-300 bg-base-100 shadow-xl"><div className="card-body p-6 sm:p-10">
        <div className="flex flex-wrap gap-2"><span className="badge badge-success badge-outline">{policy.category} insurance</span><span className="badge badge-ghost">Plan {policy.plan_no}</span></div>
        <h1 className="card-title mt-3 text-3xl sm:text-4xl">{policy.policy_name}</h1><p className="mt-2 leading-7 opacity-70">{policy.description}</p>
        <div className="stats stats-vertical mt-5 w-full border border-base-300 sm:stats-horizontal"><div className="stat"><div className="stat-title">Premium</div><div className="stat-value text-2xl text-success">₹{policy.policy_premium}</div><div className="stat-desc">{policy.payment_mode}</div></div><div className="stat"><div className="stat-title">Policy term</div><div className="stat-value text-2xl">{policy.policy_term} years</div></div><div className="stat"><div className="stat-title">Eligibility</div><div className="stat-value text-2xl">{policy.minimum_age}+{policy.maximum_age ? ` – ${policy.maximum_age}` : ''}</div><div className="stat-desc">Age in years</div></div></div>
        {policy.features?.length > 0 && <div className="mt-6"><h2 className="text-lg font-bold">Plan features</h2><ul className="mt-2 list-inside list-disc space-y-1 opacity-75">{policy.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>}
        <div className="mt-6"><h2 className="text-lg font-bold">Terms and conditions</h2><p className="mt-2 whitespace-pre-line leading-7 opacity-70">{policy.terms_and_conditions || 'Contact the Admin for policy terms.'}</p></div>
        <div className="card-actions mt-7 flex-wrap items-center"><AppButton onClick={apply} disabled={Boolean(user && !roles.includes('CUSTOMER'))}>{roles.includes('CUSTOMER') ? 'Apply for this policy' : user ? 'Customer account required' : 'Create account to apply'}</AppButton>{!user && <Link className="btn btn-ghost" to={`/login?next=${encodeURIComponent(`/customer/apply/${policyId}`)}`}>Already registered? Sign in</Link>}{user && roles.includes('ADMIN') && <Link className="btn btn-ghost" to={dashboard}>Admin dashboard</Link>}</div>
      </div></div>
    </m.section>}
    {!loading && !policy && !error && <div className="mx-auto max-w-3xl px-5 py-16"><EmptyState title="Policy not found" message="This plan may have been removed or deactivated." action={<Link className="btn btn-success btn-sm" to="/">Back to plans</Link>} /></div>}
  </main></LazyMotion>
}
