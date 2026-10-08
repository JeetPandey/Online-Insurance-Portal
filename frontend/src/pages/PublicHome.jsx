import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'motion/react'
import PublicHeader from '../components/public/PublicHeader'
import AppButton from '../components/button/AppButton'
import EmptyState from '../components/feedback/EmptyState'
import { useAuth } from '../context/useAuth'
import { getRequestError, portalService } from '../services/portalService'

export function PolicyCard({ policy, index = 0 }) {
  const interval = policy.payment_mode === 'Monthly' ? 'per month' : 'per year'
  return <m.article initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
    <div className="card-body">
      <div className="flex items-center justify-between gap-3"><span className="badge badge-outline badge-success">{policy.category}</span><span className="text-xs opacity-60">Plan {policy.plan_no}</span></div>
      <h2 className="card-title mt-2">{policy.policy_name}</h2>
      <p className="min-h-12 text-sm opacity-70">{policy.description || 'Read the plan details, eligibility and terms.'}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="badge badge-ghost">₹{policy.policy_premium} {interval}</span><span className="badge badge-ghost">{policy.policy_term} year term</span></div>
      <div className="card-actions mt-4 justify-end"><Link className="btn btn-sm btn-outline btn-success" to={`/policies/${policy.id}`}>View details</Link></div>
    </div>
  </m.article>
}

export function PublicHome() {
  return <LazyMotion features={domAnimation}><main className="min-h-screen bg-base-200/50 text-base-content"><PublicHeader />
    <section className="relative overflow-hidden bg-gradient-to-br from-success/10 via-base-100 to-primary/10 px-5 py-24 sm:py-32">
      <m.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-4xl text-center">
        <span className="badge badge-success badge-outline">ONLINE INSURANCE PORTAL</span>
        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Cover for the moments that matter.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base opacity-70 sm:text-lg">Compare life and health plans, understand the terms, and manage an application online.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="btn btn-success" to="/policies">Browse policies</Link><Link className="btn btn-outline btn-success" to="/about">How the portal works</Link></div>
      </m.div>
    </section>
    <section className="px-5 py-16 sm:px-8"><div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">{[['01', 'Browse plans', 'Compare premium, term, eligibility and benefits before registering.'], ['02', 'Apply online', 'Create a customer account and send an application for Admin review.'], ['03', 'Pay and manage', 'Use the simulated checkout, view your receipt, and manage reminders and renewals.']].map(([number, title, text], index) => <m.article whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 16 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="card border border-base-300 bg-base-100" key={number}><div className="card-body"><span className="text-sm font-bold text-success">{number}</span><h2 className="card-title">{title}</h2><p className="text-sm opacity-70">{text}</p></div></m.article>)}</div></section>
    <section className="bg-base-100 px-5 py-16 sm:px-8"><m.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 18 }} viewport={{ once: true }} className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center"><div><span className="badge badge-success badge-outline">BUILT FOR CLEARER DECISIONS</span><h2 className="mt-4 text-3xl font-bold">Understand your cover before you apply.</h2><p className="mt-4 leading-7 opacity-70">Every plan page explains its premium frequency, eligibility, term and features. Browse the catalog without signing in, then register only when you are ready to apply.</p><Link className="btn btn-success mt-6" to="/policies">Compare available plans</Link></div><div className="grid gap-3 sm:grid-cols-2">{[['Life cover', 'Explore plans designed to support family protection.'], ['Health cover', 'Review health plans and their eligibility details.'], ['Clear review', 'Track your application while an Admin reviews it.'], ['Easy servicing', 'Find receipts, reminders and renewal options in one place.']].map(([title, text], index) => <m.article key={title} whileInView={{ opacity: 1, scale: 1 }} initial={{ opacity: 0, scale: .96 }} viewport={{ once: true }} transition={{ delay: index * .06 }} className="rounded-2xl border border-base-300 p-5"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm opacity-70">{text}</p></m.article>)}</div></m.div></section>
    <section className="px-5 py-16 text-center sm:px-8"><m.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 14 }} viewport={{ once: true }} className="mx-auto max-w-3xl"><h2 className="text-3xl font-bold">A simple path from plan to policy</h2><p className="mt-3 leading-7 opacity-70">Apply for a plan, follow its review status, complete a simulated payment after approval, and manage the active policy from your customer dashboard.</p><Link className="btn btn-outline btn-success mt-6" to="/about">Learn about the portal</Link></m.div></section>
    <footer className="border-t border-base-300 bg-neutral text-neutral-content">
  <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      {/* Brand */}
      <div className="max-w-md">
        <h2 className="text-lg font-bold">Online Insurance Portal</h2>
        <p className="mt-2 text-sm leading-6 opacity-60">Simple access to life and health insurance plans,applications, payments, renewals and policy services.</p>
      </div>
      {/* Quick Links */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Link to="/" className="opacity-70 transition hover:text-success hover:opacity-100" >Home</Link>
        <Link to="/policies" className="opacity-70 transition hover:text-success hover:opacity-100" >Policies</Link>
        <Link to="/about" className="opacity-70 transition hover:text-success hover:opacity-100" >About</Link>
        <Link to="/login" className="opacity-70 transition hover:text-success hover:opacity-100">Login</Link>
        <Link to="/register" className="opacity-70 transition hover:text-success hover:opacity-100" >Register</Link>
      </div>
    </div>
    {/* Bottom */}
    <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs opacity-50 sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} Online Insurance Portal</p>
      <p>Life & Health Insurance Services</p>
    </div>
  </div>
</footer>
  </main></LazyMotion>
}

export function PublicPolicyCatalogPage() {
  const [policies, setPolicies] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { portalService.policies({ search, category }).then(setPolicies).catch((e) => setError(getRequestError(e))).finally(() => setLoading(false)) }, [search, category])
  return <LazyMotion features={domAnimation}><main className="min-h-screen bg-base-200/50"><PublicHeader /><section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
    <span className="text-sm font-bold uppercase tracking-widest text-success">Policy catalog</span><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Find a plan that fits</h1><p className="mt-2 opacity-70">Anyone can browse. Create an account or sign in as a customer to apply.</p>
    <div className="my-7 grid gap-3 sm:grid-cols-[1fr_220px]"><input className="input input-bordered w-full bg-base-100" aria-label="Search policies" placeholder="Search plans" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="select select-bordered bg-base-100" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option><option value="LIFE">Life insurance</option><option value="HEALTH">Health insurance</option></select></div>
    {error && <div role="alert" className="alert alert-error mb-5">{error}</div>}
    {loading ? <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg text-success" /></div> : policies.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{policies.map((policy, index) => <PolicyCard key={policy.id} policy={policy} index={index} />)}</div> : <div className="rounded-2xl bg-base-100"><EmptyState title="No matching policies" message="Try another search, or ask an Admin to add an active plan." action={<Link className="btn btn-sm btn-outline" to="/login">Admin sign in</Link>} /></div>}
  </section></main></LazyMotion>
}

export function AboutPage() {
  return <LazyMotion features={domAnimation}>
      <main className="min-h-screen bg-base-200/50">
        <PublicHeader />

        {/* Hero */}
        <m.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
            {/* Left */}
            <div>
              <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-4 py-2 text-sm font-bold uppercase tracking-widest text-success">
                About Online Insurance
              </span>

              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Insurance services,
                <span className="block text-success">explained simply.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 opacity-70 sm:text-lg">
                Online Insurance Portal provides a simple and organized way to
                explore insurance plans, register as a customer, apply for
                policies, manage payments, and keep track of policy renewals and
                important reminders.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/policies" className="btn btn-success px-6 shadow-sm">
                  Explore Policies
                </Link>

                <Link to="/register" className="btn btn-outline px-6">
                  Create Account
                </Link>
              </div>
            </div>

            {/* Right Information Card */}
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-60">
                    Insurance Portal
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    One place for your policy journey
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-xl text-success">
                  ✓
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Life & Health Insurance",
                  "Policy Applications",
                  "Secure Payments",
                  "Policy Renewals",
                  "Payment Receipts",
                  "Important Reminders",
                ].map((item, index) => (
                  <m.div
                    key={item}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.2 + index * 0.07,
                    }}
                    className="flex items-center gap-3 rounded-xl bg-base-200/60 px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
                      ✓
                    </span>

                    <span className="text-sm font-medium">{item}</span>
                  </m.div>
                ))}
              </div>
            </m.div>
          </div>
        </m.section>

        {/* Journey */}
        <m.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl px-5 pb-16 sm:px-8"
        >
          <div className="mb-8">
            <span className="text-sm font-bold uppercase tracking-widest text-success">
              How it works
            </span>

            <h2 className="mt-2 text-3xl font-bold">
              A simple insurance journey
            </h2>

            <p className="mt-3 max-w-2xl leading-7 opacity-70">
              The portal organizes the major stages of an insurance service
              journey into one connected experience.
            </p>
          </div>

          <ol className="steps steps-vertical w-full lg:steps-horizontal">
            <li className="step step-success">Browse policies</li>

            <li className="step step-success">Register</li>

            <li className="step step-success">Apply for policy</li>

            <li className="step step-success">Application review</li>

            <li className="step step-success">Make payment</li>

            <li className="step step-success">Manage policy</li>

            <li className="step step-success">Renew policy</li>
          </ol>
        </m.section>

        {/* Three Main Sections */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "For Visitors",
                text: "Explore available life and health insurance plans, understand policy features, terms, premium information and eligibility before registering.",
              },
              {
                number: "02",
                title: "For Customers",
                text: "Manage your insurance journey from one place. Apply for policies, follow application status, make payments, access receipts and manage renewals.",
              },
              {
                number: "03",
                title: "For Administrators",
                text: "Review policy applications, manage insurance information, oversee payments and renewals, generate reminders and access reports.",
              },
            ].map((item, index) => (
              <m.article
                key={item.title}
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                }}
                whileHover={{
                  y: -5,
                }}
                className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-success">
                    {item.number}
                  </span>

                  <span className="h-px w-12 bg-success/30" />
                </div>

                <h3 className="mt-5 text-xl font-bold">{item.title}</h3>

                <p className="mt-3 text-sm leading-7 opacity-70">{item.text}</p>
              </m.article>
            ))}
          </div>
        </section>

        {/* Payment + Renewal Section */}
        <m.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl px-5 pb-16 sm:px-8"
        >
          <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
            <div className="grid lg:grid-cols-2">
              {/* Payment */}
              <div className="p-7 sm:p-9">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-xl text-success">
                  ₹
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  Payments made simple
                </h2>

                <p className="mt-3 leading-7 opacity-70">
                  Customers can manage premium payments through the payment
                  section of the portal and keep their payment information
                  organized with corresponding policy records and receipts.
                </p>

                <ul className="mt-5 space-y-3 text-sm">
                  {[
                    "Premium payment management",
                    "Multiple payment methods",
                    "Payment transaction records",
                    "Payment receipts",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="text-success">✓</span>

                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Renewal */}
              <div className="border-t border-base-300 bg-base-200/40 p-7 sm:p-9 lg:border-l lg:border-t-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-xl text-success">
                  ↻
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  Stay on top of renewals
                </h2>

                <p className="mt-3 leading-7 opacity-70">
                  Renewal information and reminders help customers keep track of
                  upcoming policy payments and continue managing their insurance
                  policies.
                </p>

                <ul className="mt-5 space-y-3 text-sm">
                  {[
                    "Renewal information",
                    "Upcoming due dates",
                    "Policy reminders",
                    "Renewal payment management",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="text-success">✓</span>

                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </m.section>

        {/* Information Banner */}
        <m.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl px-5 pb-16 sm:px-8"
        >
          <div className="alert border border-success/20 bg-success/10">
            <div>
              <h3 className="font-bold">A connected insurance experience</h3>

              <p className="mt-1 text-sm leading-6 opacity-70">
                From discovering a policy to registration, application, payment,
                renewal and reminders, the portal brings the key insurance
                services together in one place.
              </p>
            </div>
          </div>
        </m.section>

        {/* CTA */}
        <m.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-6xl px-5 pb-20 sm:px-8"
        >
          <div className="rounded-3xl bg-success px-7 py-10 text-success-content shadow-sm sm:px-10">
            <div className="flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest opacity-80">
                  Get started
                </p>

                <h2 className="mt-2 text-3xl font-extrabold">
                  Find the right policy for your needs.
                </h2>

                <p className="mt-3 max-w-2xl leading-7 opacity-85">
                  Explore available insurance plans and learn about their
                  features, terms and premium information.
                </p>
              </div>

              <Link
                to="/policies"
                className="btn border-0 bg-base-100 px-6 text-success hover:bg-base-200"
              >
                Explore Policies
              </Link>
            </div>
          </div>
        </m.section>
      </main>
    </LazyMotion>
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
  return <LazyMotion features={domAnimation}><main className="min-h-screen bg-base-200/50"><PublicHeader />
    {loading && <div className="flex justify-center py-24"><span className="loading loading-spinner loading-lg text-success" /></div>}
    {error && <div role="alert" className="alert alert-error mx-auto mt-8 max-w-3xl">{error}</div>}
    {policy && <m.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto my-10 max-w-4xl px-5 sm:my-16">
      <div className="card border border-base-300 bg-base-100 shadow-xl"><div className="card-body p-6 sm:p-10">
        <div className="flex flex-wrap gap-2"><span className="badge badge-success badge-outline">{policy.category} insurance</span><span className="badge badge-ghost">Plan {policy.plan_no}</span></div>
        <h1 className="card-title mt-3 text-3xl sm:text-4xl">{policy.policy_name}</h1><p className="mt-2 leading-7 opacity-70">{policy.description}</p>
        <div className="stats stats-vertical mt-5 w-full border border-base-300 sm:stats-horizontal"><div className="stat"><div className="stat-title">Premium</div><div className="stat-value text-2xl text-success">₹{policy.policy_premium}</div><div className="stat-desc">{policy.payment_mode === 'Monthly' ? 'per month' : 'per year'}</div></div><div className="stat"><div className="stat-title">Policy term</div><div className="stat-value text-2xl">{policy.policy_term} years</div></div><div className="stat"><div className="stat-title">Eligibility</div><div className="stat-value text-2xl">{policy.minimum_age}+{policy.maximum_age ? ` – ${policy.maximum_age}` : ''}</div></div></div>
        {policy.features?.length > 0 && <div className="mt-6"><h2 className="text-lg font-bold">Plan features</h2><ul className="mt-2 list-inside list-disc space-y-1 opacity-75">{policy.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>}
        <div className="mt-6"><h2 className="text-lg font-bold">Terms and conditions</h2><p className="mt-2 whitespace-pre-line leading-7 opacity-70">{policy.terms_and_conditions || 'Contact the Admin for policy terms.'}</p></div>
        <div className="card-actions mt-7 flex-wrap items-center"><AppButton onClick={apply} disabled={Boolean(user && !roles.includes('CUSTOMER'))}>{roles.includes('CUSTOMER') ? 'Apply for this policy' : user ? 'Customer account required' : 'Create account to apply'}</AppButton>{!user && <Link className="btn btn-ghost" to={`/login?next=${encodeURIComponent(`/customer/apply/${policyId}`)}`}>Already registered? Sign in</Link>}</div>
      </div></div>
    </m.section>}
    {!loading && !policy && !error && <div className="mx-auto max-w-3xl px-5 py-16"><EmptyState title="Policy not found" message="This plan may have been removed or deactivated." action={<Link className="btn btn-success btn-sm" to="/policies">Back to policies</Link>} /></div>}
  </main></LazyMotion>
}
