import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppTable from '../../components/tables/AppTable'
import AppButton from '../../components/button/AppButton'
import { useAuth } from '../../context/useAuth'
import { portalService, getRequestError } from '../../services/portalService'

function useRemote(load, refreshKey = '') { const [data,setData]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const reload=async()=>{setLoading(true);setError('');try{setData(await load())}catch(e){setError(getRequestError(e))}finally{setLoading(false)}}; const stableKey=Array.isArray(refreshKey)?refreshKey.join('|'):refreshKey; useEffect(()=>{const timer=setTimeout(reload,0);return()=>clearTimeout(timer) // refreshKey intentionally controls query reloads
// eslint-disable-next-line react-hooks/exhaustive-deps
},[stableKey]);return {data,loading,error,reload} }
function Title({title,description}) { return <div className="portal-page-title"><div><span className="eyebrow">CUSTOMER WORKSPACE</span><h1>{title}</h1><p>{description}</p></div></div> }
function Error({children}) { return children ? <div className="portal-error" role="alert">{children}</div> : null }
function Status({value}) { return <span className={`portal-status status-${String(value||'').toLowerCase()}`}>{value||'—'}</span> }
function renewalAvailable(row) { const due = new Date(`${row.next_due_date}T00:00:00`); const end = new Date(`${row.coverage_end}T00:00:00`); return due <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && due <= end || (row.can_renew_early && due <= end) }

export function CustomerDashboardPage() {
  const { user } = useAuth()
  const apps = useRemote(() => portalService.myApplications(), [])
  const payments = useRemote(() => portalService.payments(), [])
  const renewals = useRemote(() => portalService.renewals(), [])
  const reminders = useRemote(() => portalService.reminders(), [])
  const active = apps.data.filter((row) => row.status === 'ISSUED')
  const pending = apps.data.filter((row) => ['PENDING', 'APPROVED'].includes(row.status))
  const dueSoon = reminders.data.filter((row) => row.status === 'SENT' || row.status === 'PENDING')
  const stats = [
    ['Applications', apps.data.length, '/customer/applications'],
    ['Active policies', active.length, '/customer/active-policies'],
    ['Successful payments', payments.data.filter((row) => row.status === 'SUCCESS').length, '/customer/payments'],
    ['Renewals due', renewals.data.filter((row) => ['DUE', 'OVERDUE'].includes(row.status)).length, '/customer/renewals'],
  ]
  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-success to-emerald-700 p-6 text-success-content shadow-lg sm:p-8">
      <span className="badge border-white/30 bg-white/10 text-white">CUSTOMER DASHBOARD</span>
      <h1 className="mt-4 text-3xl font-bold">Welcome back, {user?.customer_profile?.first_name || user?.username}</h1>
      <p className="mt-2 max-w-2xl opacity-85">See your cover, follow an application, or continue a renewal from one place.</p>
      <Link className="btn btn-sm mt-5 border-white/30 bg-white text-success hover:bg-white/90" to="/customer/policies">Browse policies</Link>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, to]) => <Link key={label} to={to} className="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="card-body p-5"><span className="text-sm opacity-60">{label}</span><strong className="text-3xl">{value}</strong></div></Link>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body"><div className="flex items-center justify-between gap-3"><h2 className="card-title">My active policies</h2><Link className="link link-success text-sm" to="/customer/active-policies">View all</Link></div><AppTable columns={[{ key: 'policy_no', label: 'Policy no.' }, { key: 'policy_name', label: 'Plan' }, { key: 'coverage_end', label: 'Coverage through' }, { key: 'next_due_date', label: 'Next premium' }]} data={active} loading={apps.loading} rowKey="id" /></div></section>
      <section className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body"><div className="flex items-center justify-between gap-3"><h2 className="card-title">Reminders</h2><Link className="link link-success text-sm" to="/customer/reminders">View all</Link></div>{reminders.loading ? <span className="loading loading-spinner text-success" /> : dueSoon.length ? dueSoon.slice(0, 3).map((row) => <div className="rounded-xl bg-base-200 p-3" key={row.id}><b>{row.policy_name}</b><p className="text-sm opacity-70">{row.policy_no} · premium due {row.due_date}</p>{row.status === 'SENT' && <Link className="link link-success text-sm" to="/customer/active-policies">Start advance renewal</Link>}</div>) : <p className="text-sm opacity-60">No reminders yet. An Admin can send one for an active policy.</p>}</div></section>
    </div>
    <section className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body"><div className="flex items-center justify-between gap-3"><h2 className="card-title">Applications in progress</h2><Link className="link link-success text-sm" to="/customer/applications">View applications</Link></div>{pending.length ? <div className="grid gap-3 sm:grid-cols-2">{pending.slice(0, 4).map((row) => <div className="rounded-xl border border-base-300 p-4" key={row.id}><div className="flex justify-between gap-3"><b>{row.policy_name}</b><Status value={row.status}/></div><p className="mt-1 text-sm opacity-60">{row.application_no} · premium ₹{row.premium_amount} {row.payment_mode === 'Monthly' ? '/ month' : '/ year'}</p>{row.status === 'APPROVED' && <Link className="btn btn-success btn-sm mt-3" to={`/customer/payment/${row.id}`}>Continue to payment</Link>}</div>)}</div> : <p className="text-sm opacity-60">No applications yet. Browse a policy to get started.</p>}</div></section>
    {(apps.error || payments.error || renewals.error || reminders.error) && <Error>{apps.error || payments.error || renewals.error || reminders.error}</Error>}
  </div>
}
export function CustomerPoliciesPage() {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const { data, loading, error } = useRemote(() => portalService.policies({ category, search }), `${category}|${search}`)
  return <><Title title="Policy catalog" description="Compare active life and health plans before applying."/><Error>{error}</Error>
    <section className="portal-panel"><div className="portal-toolbar"><input className="portal-search" placeholder="Search policies" value={search} onChange={(event) => setSearch(event.target.value)} /><select className="portal-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option><option value="LIFE">Life insurance</option><option value="HEALTH">Health insurance</option></select></div>
      {loading ? <p>Loading plans…</p> : <div className="portal-policy-grid">{data.map((policy) => <article className="portal-policy-card" key={policy.id}><span className="portal-category">{policy.category} INSURANCE · PLAN {policy.plan_no}</span><h2>{policy.policy_name}</h2><p>{policy.description || 'Explore policy benefits and terms.'}</p><dl><div><dt>Premium</dt><dd>₹{policy.policy_premium} {policy.payment_mode === 'Monthly' ? '/ month' : '/ year'}</dd></div><div><dt>Term</dt><dd>{policy.policy_term} years</dd></div><div><dt>Age</dt><dd>{policy.minimum_age}+{policy.maximum_age ? ` to ${policy.maximum_age}` : ''}</dd></div></dl><Link className="portal-action-link" to={`/policies/${policy.id}`}>View full policy details →</Link></article>)}</div>}
      {!loading && data.length === 0 && <p className="portal-empty">No policies match those filters.</p>}
    </section>
  </>
}
export function CustomerApplyPage() {
  const { policyId } = useParams()
  const navigate = useNavigate()
  const [policy, setPolicy] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [paymentType, setPaymentType] = useState('Credit Card')
  useEffect(() => {
    portalService.policy(policyId)
      .then((item) => { setPolicy(item); if (item.payment_type?.length) setPaymentType(item.payment_type[0]) })
      .catch((e) => setError(getRequestError(e)))
  }, [policyId])
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const application = await portalService.createApplication({ policy_id: Number(policyId), payment_type: paymentType })
      toast.success('Application submitted. You can track it in My applications.')
      navigate('/customer/applications', { state: { message: `Application ${application.application_no} submitted.` } })
    } catch (e) { const message = getRequestError(e); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  const frequency = policy?.payment_mode === 'Monthly' ? 'per month' : 'per year'
  return <><Title title="Apply for insurance" description="Review your selected plan and submit it for Admin review."/><Error>{error}</Error>
    {policy && <div className="portal-panel"><div className="portal-policy-summary"><span>{policy.category} · PLAN {policy.plan_no}</span><h2>{policy.policy_name}</h2><p>{policy.description}</p><p><b>Premium:</b> ₹{policy.policy_premium} {frequency} · <b>Term:</b> {policy.policy_term} years · <b>Eligibility:</b> {policy.minimum_age}+{policy.maximum_age ? ` to ${policy.maximum_age}` : ''}</p>{policy.features?.length > 0 && <ul>{policy.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}<p>{policy.terms_and_conditions}</p></div>
      <form className="portal-form-grid narrow" onSubmit={submit}><label>Preferred payment method<select value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>{(policy.payment_type?.length ? policy.payment_type : ['Credit Card', 'Debit Card', 'Demand Draft', 'Internet Banking']).map((method) => <option key={method}>{method}</option>)}</select></label><div className="portal-form-span portal-info">Your age is checked when you apply. Payment is available after Admin approval.</div><div className="portal-form-actions"><AppButton type="submit" loading={busy}>Submit application</AppButton><Link className="portal-link-button" to="/customer/policies">Back to catalog</Link></div></form>
    </div>}
  </>
}
export function CustomerApplicationsPage() { const navigate=useNavigate(); const {data,loading,error}=useRemote(()=>portalService.myApplications(),[]); const columns=[{key:'application_no',label:'Application'},{key:'policy_name',label:'Policy'},{key:'premium_amount',label:'Premium'},{key:'submitted_at',label:'Submitted',render:(v)=>v?.slice(0,10)},{key:'proposal_no',label:'Proposal'},{key:'status',label:'Status',render:(v)=><Status value={v}/>},{key:'actions',label:'Next step',render:(_,row)=>row.status==='APPROVED'?<button className="portal-link-button" onClick={()=>navigate(`/customer/payment/${row.id}`)}>Pay premium</button>:row.status==='ISSUED'?<span>Policy active</span>:row.status==='REJECTED'?row.decision_reason:'Under review'}];return <><Title title="My applications" description="Track proposal review and continue to payment after approval."/><Error>{error}</Error><section className="portal-panel"><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></> }

export function CustomerActivePoliciesPage() {
  const { data, loading, error } = useRemote(() => portalService.myApplications())
  const reminders = useRemote(() => portalService.reminders(), [])
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const active = data.filter((row) => row.status === 'ISSUED')
  const startRenewal = async (row) => {
    try {
      const renewal = await portalService.createRenewal(row.id)
      toast.success('Renewal ready. Complete the payment to extend your policy.')
      navigate(`/customer/payment/renewal/${renewal.id}`)
    } catch (e) { const text = getRequestError(e); setMessage(text); toast.error(text) }
  }
  const columns = [
    { key: 'policy_no', label: 'Policy no.' }, { key: 'policy_name', label: 'Plan' },
    { key: 'proposal_no', label: 'Proposal' }, { key: 'coverage_start', label: 'Coverage start' },
    { key: 'coverage_end', label: 'Coverage end' }, { key: 'next_due_date', label: 'Next due' },
    { key: 'actions', label: 'Renew', render: (_, row) => renewalAvailable(row)
      ? <button className="portal-link-button" onClick={() => startRenewal(row)}>Pay / renew</button>
      : <span>Available after an Admin reminder</span> },
  ]
  return <><Title title="My active policies" description="Pay within 30 days of the due date, or advance pay after an Admin sends a reminder."/><Error>{error || reminders.error || message}</Error><section className="portal-panel"><AppTable columns={columns} data={active} loading={loading || reminders.loading} rowKey="id"/></section></>
}
export function CustomerPaymentsPage() { const {data,loading,error}=useRemote(()=>portalService.payments(),[]); const navigate=useNavigate(); const columns=[{key:'receipt_no',label:'Receipt'},{key:'payment_for',label:'Payment for'},{key:'policy_no',label:'Policy no.'},{key:'payment_amount',label:'Amount'},{key:'payment_type',label:'Method'},{key:'date_of_payment',label:'Date',render:(v)=>v?.slice(0,10)||'—'},{key:'status',label:'Status',render:(v)=><Status value={v}/>},{key:'actions',label:'Receipt',render:(_,row)=>row.receipt_no?<button className="portal-link-button" onClick={()=>navigate(`/customer/receipt/${row.receipt_no}`)}>View receipt</button>:'—'}];return <><Title title="Payments and receipts" description="See your demo payment results and open successful receipts."/><Error>{error}</Error><section className="portal-panel"><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></> }

export function CustomerRenewalsPage() {
  const { data, loading, error } = useRemote(() => portalService.renewals())
  const reminders = useRemote(() => portalService.reminders())
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const advance = reminders.data.filter((reminder) => reminder.status === 'SENT' && !data.some((renewal) => renewal.policy_no === reminder.policy_no && renewal.due_date === reminder.due_date))
  const startRenewal = async (reminder) => {
    try {
      const renewal = await portalService.createRenewal(reminder.policy_id)
      toast.success('Renewal ready. Complete payment to extend your policy.')
      navigate(`/customer/payment/renewal/${renewal.id}`)
    } catch (e) { const text = getRequestError(e); setMessage(text); toast.error(text) }
  }
  const columns = [
    { key: 'renewal_no', label: 'Renewal ID' }, { key: 'policy_no', label: 'Policy no.' },
    { key: 'policy_name', label: 'Plan' }, { key: 'renewal_amount', label: 'Amount', render: (value, row) => `₹${value} ${row.payment_mode === 'Monthly' ? '/ month' : '/ year'}` },
    { key: 'due_date', label: 'Due date' }, { key: 'status', label: 'Status', render: (value) => <Status value={value}/> },
    { key: 'actions', label: 'Action', render: (_, row) => ['DUE', 'OVERDUE'].includes(row.status)
      ? <button className="portal-link-button" onClick={() => navigate(`/customer/payment/renewal/${row.id}`)}>Pay renewal</button> : '—' },
  ]
  const reminderColumns = [{ key: 'policy_no', label: 'Policy no.' }, { key: 'policy_name', label: 'Plan' }, { key: 'due_date', label: 'Next due date' }, { key: 'date_of_sending', label: 'Reminder sent', render: (v) => v?.slice(0, 10) || '—' }, { key: 'actions', label: 'Action', render: (_, row) => <button className="portal-link-button" onClick={() => startRenewal(row)}>Renew early</button> }]
  return <><Title title="My renewals" description="Review due renewals and advance-pay after an Admin reminder."/><Error>{error || reminders.error || message}</Error><section className="portal-panel"><h2>Advance renewal available</h2><p className="mb-4 text-sm opacity-70">These active policies were included in a reminder. You can renew before the due date.</p><AppTable columns={reminderColumns} data={advance} loading={reminders.loading} rowKey="id"/></section><section className="portal-panel"><h2>Renewal history</h2><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></>
}
export function CustomerRemindersPage() { const {data,loading,error}=useRemote(()=>portalService.reminders(),[]);const columns=[{key:'reminder_no',label:'Reminder'},{key:'policy_no',label:'Policy no.'},{key:'policy_name',label:'Plan'},{key:'due_date',label:'Due date'},{key:'status',label:'Status',render:(v)=><Status value={v}/>},{key:'date_of_sending',label:'Sent'}];return <><Title title="Premium reminders" description="Your generated reminders and upcoming due dates."/><Error>{error}</Error><section className="portal-panel"><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></> }

export function CustomerReceiptPage() {
  const { receiptNo } = useParams()
  const { data, loading, error } = useRemote(() => portalService.receipt(receiptNo), [receiptNo])
  if (loading) return <p>Loading receipt…</p>
  const details = data?.payment_detail || {}
  const safeDetails = Object.entries(details).map(([key, value]) => [key.replaceAll('_', ' '), value])
  return <><Title title="Payment receipt" description="Your completed demo payment and its safe transaction details."/><Error>{error}</Error>
    {data && <section className="portal-panel portal-receipt"><span className="eyebrow">SUREWAY · DEMO TRANSACTION</span><h2>{data.status === 'SUCCESS' ? 'Payment successful' : 'Payment status'}</h2><dl className="portal-detail-grid">
      {[['Receipt number', data.receipt_no], ['Transaction reference', data.transaction_reference], ['Policy number', data.policy_no], ['Amount', `₹${data.payment_amount}`], ['Payment method', data.payment_type], ...safeDetails, ['Paid on', data.date_of_payment?.slice(0, 10)], ['Status', data.status]].map(([label, value]) => <div key={label}><dt className="capitalize">{label}</dt><dd>{value || '—'}</dd></div>)}
    </dl><Link className="portal-action-link" to="/customer/payments">Back to payments</Link></section>}
  </>
}
