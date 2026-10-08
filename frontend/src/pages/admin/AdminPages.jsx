import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import AppTable from '../../components/tables/AppTable'
import AppButton from '../../components/button/AppButton'
import AppModal from '../../components/modal/AppModal'
import ConfirmModal from '../../components/modal/ConfirmModal'
import { portalService, getRequestError } from '../../services/portalService'

function useLoad(loader, refreshKey = '') {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const reload = async () => { setLoading(true); setError(''); try { setData(await loader()) } catch (e) { setError(getRequestError(e)) } finally { setLoading(false) } }
  const stableKey = Array.isArray(refreshKey) ? refreshKey.join('|') : refreshKey
  useEffect(() => { const timer = setTimeout(reload, 0); return () => clearTimeout(timer) // refreshKey intentionally controls query reloads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey])
  return { data, setData, loading, error, reload }
}

function PageTitle({ eyebrow = 'ADMIN WORKSPACE', title, description, action }) {
  return <div className="portal-page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function ErrorBanner({ children }) { return children ? <div className="portal-error" role="alert">{children}</div> : null }
function Status({ value }) { return <span className={`portal-status status-${String(value || '').toLowerCase()}`}>{value || '—'}</span> }


export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      portalService.customers(),
      portalService.policies(),
      portalService.applications(),
      portalService.payments(),
      portalService.renewals(),
      portalService.reminders(),
      portalService.staff(),
    ])
      .then(
        ([
          customers,
          policies,
          applications,
          payments,
          renewals,
          reminders,
          staff,
        ]) => {
          setStats({
            customers: customers.length,

            policies: policies.filter((x) => x.is_active).length,

            applications: applications.filter((x) => x.status === "PENDING")
              .length,

            payments: payments.filter((x) => x.status === "SUCCESS").length,

            renewals: renewals.filter((x) => x.status === "DUE").length,

            reminders: reminders.filter((x) => x.status === "PENDING").length,

            staff: staff.filter((x) => x.is_active).length,
          });
        },
      )
      .catch((e) => {
        setError(getRequestError(e));
      });
  }, []);

  const cards = [
    {
      label: "Customers",
      value: stats?.customers,
      description: "Registered customers",
      icon: "👥",
    },
    {
      label: "Active Plans",
      value: stats?.policies,
      description: "Currently available",
      icon: "▣",
    },
    {
      label: "Pending Applications",
      value: stats?.applications,
      description: "Awaiting review",
      icon: "◷",
      attention: true,
    },
    {
      label: "Successful Payments",
      value: stats?.payments,
      description: "Completed transactions",
      icon: "₹",
    },
    {
      label: "Renewals Due",
      value: stats?.renewals,
      description: "Require attention",
      icon: "↻",
      attention: true,
    },
    {
      label: "Pending Reminders",
      value: stats?.reminders,
      description: "Awaiting processing",
      icon: "!",
      attention: true,
    },
    {
      label: "Active Agents",
      value: stats?.staff,
      description: "Currently active",
      icon: "♙",
    },
  ];

  const flowSteps = [
    {
      n: "01",
      label: "Maintain plans",
      description: "Manage available insurance plans",
      path: "/admin/policies",
    },
    {
      n: "02",
      label: "Review applications",
      description: "Check and process customer applications",
      path: "/admin/applications",
    },
    {
      n: "03",
      label: "Monitor transactions",
      description: "Review completed payment activity",
      path: "/admin/payments",
    },
    {
      n: "04",
      label: "Service renewals",
      description: "Manage upcoming policy renewals",
      path: "/admin/renewals",
    },
    {
      n: "05",
      label: "Generate reminders",
      description: "Handle customer renewal reminders",
      path: "/admin/reminders",
    },
  ];

  return (
    <main className="space-y-8">
      {/* Page Header */}
      <PageTitle
        title="Admin Dashboard"
        description="Manage customers, policies, applications, payments, and servicing."
      />

      {/* Error */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* Overview Header */}
      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-success">
              Overview
            </p>

            <h2 className="mt-1 text-xl font-bold">Portal activity</h2>
          </div>

          <p className="text-sm opacity-60">Current system summary</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <article
              key={card.label}
              className={[
                "group relative overflow-hidden rounded-2xl",
                "border border-base-300",
                "bg-base-100",
                "p-5 shadow-sm",
                "transition-all duration-200",
                "hover:-translate-y-1 hover:shadow-md",
                card.attention ? "border-l-4 border-l-warning" : "",
              ].join(" ")}
            >
              {/* Top */}
              <div className="flex items-start justify-between gap-3">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center",
                    "rounded-xl text-sm font-bold",
                    card.attention
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success",
                  ].join(" ")}
                >
                  {card.icon}
                </div>

                <span className="text-xs font-medium opacity-40">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Value */}
              <div className="mt-5">
                <strong className="block text-3xl font-black tracking-tight">
                  {card.value ?? "—"}
                </strong>

                <h3 className="mt-1 text-sm font-bold">{card.label}</h3>

                <p className="mt-1 text-xs opacity-50">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Operational Flow */}
      <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        {/* Heading */}
        <div className="border-b border-base-300 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />

                <span className="text-xs font-bold uppercase tracking-widest text-success">
                  Administration
                </span>
              </div>

              <h2 className="mt-2 text-xl font-bold">Operational Flow</h2>

              <p className="mt-1 text-sm opacity-60">
                Work through the customer journey in sequence.
              </p>
            </div>

            <span className="badge badge-outline badge-success">
              5 service areas
            </span>
          </div>
        </div>

        {/* Flow */}
        <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-5">
          {flowSteps.map((step, index) => (
            <Link
              key={step.n}
              to={step.path}
              className="group relative rounded-2xl border border-base-300 bg-base-200/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-success/40 hover:bg-success/5 hover:shadow-sm"
            >
              {/* Number */}
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-xs font-black text-success">
                  {step.n}
                </span>

                <span className="text-lg opacity-30 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-success group-hover:opacity-100">
                  →
                </span>
              </div>

              <h3 className="mt-4 font-bold">{step.label}</h3>

              <p className="mt-2 text-xs leading-5 opacity-60">
                {step.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Admin Information */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-success">
            Customer Service
          </p>

          <h3 className="mt-2 text-lg font-bold">
            Keep customer operations organized
          </h3>

          <p className="mt-2 text-sm leading-6 opacity-60">
            Review applications, monitor payments and keep policy servicing
            activities up to date.
          </p>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <p className="text-xs font-bold uppercase tracking-widest opacity-50">
            Attention Required
          </p>

          <h3 className="mt-2 text-lg font-bold">Pending work</h3>

          <p className="mt-2 text-sm leading-6 opacity-60">
            Use the dashboard counters above to identify applications, renewals
            and reminders that need administrative attention.
          </p>
        </div>
      </section>
    </main>
  );
}

export function AdminCustomersPage() {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [selected, setSelected] = useState(null); const [confirm, setConfirm] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useLoad(() => portalService.customers({ search, status }), `${search}|${status}`)
  const columns = [{ key: 'customer_id', label: 'ID' }, { key: 'full_name', label: 'Customer' }, { key: 'username', label: 'User ID' }, { key: 'email', label: 'Email' }, { key: 'mobile_number', label: 'Mobile' }, { key: 'city', label: 'City' }, { key: 'is_active', label: 'Status', render: (v) => <Status value={v ? 'Active' : 'Inactive'} /> }, { key: 'actions', label: 'Actions', render: (_, row) => <div className="portal-row-actions"><button onClick={() => setSelected(row)}>View</button><button onClick={() => setConfirm(row)}>{row.is_active ? 'Deactivate' : 'Activate'}</button></div> }]
  const setActive = async () => { setBusy(true); setError(''); try { await portalService.setCustomerStatus(confirm.id, !confirm.is_active); setConfirm(null); await reload() } catch (e) { setError(getRequestError(e)) } finally { setBusy(false) } }
  return <><PageTitle title="Customer Master" description="Search customer records and manage account access without deleting policy history."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><div className="portal-toolbar"><input className="portal-search" placeholder="Search name, user ID, email, mobile" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="portal-select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All accounts</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><AppTable columns={columns} data={data} loading={loading} rowKey="id" /></section><AppModal open={!!selected} onClose={() => setSelected(null)} title="Customer details"><CustomerDetails customer={selected} /></AppModal><ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={setActive} loading={busy} title={`${confirm?.is_active ? 'Deactivate' : 'Activate'} customer`} message={`This will ${confirm?.is_active ? 'block' : 'restore'} sign-in for ${confirm?.full_name || 'this customer'}. Their existing records remain preserved.`}/></>
}

function CustomerDetails({ customer }) { if (!customer) return null; return <dl className="portal-detail-grid">{[['Customer ID', customer.customer_id], ['User ID', customer.username], ['Name', customer.full_name], ['Email', customer.email], ['Date of birth', customer.date_of_birth], ['Gender', customer.gender], ['Mobile', customer.mobile_number], ['Phone', customer.phone_number], ['Address', customer.address], ['City', customer.city]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl> }

const emptyPolicy = { category: 'LIFE', policy_name: '', plan_no: '', description: '', features: '', terms_and_conditions: '', policy_premium: '', policy_term: '', payment_mode: 'Annual', payment_type: 'Credit Card, Debit Card, Demand Draft, Internet Banking', minimum_age: 18, maximum_age: '' }
export function AdminPoliciesPage() {
  const [form, setForm] = useState(emptyPolicy); const [editing, setEditing] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(null)
  const { data, loading, reload } = useLoad(() => portalService.policies({ include_inactive: 'true' }), [])
  const columns = [{ key: 'plan_no', label: 'Plan no.' }, { key: 'policy_name', label: 'Policy' }, { key: 'category', label: 'Category' }, { key: 'policy_premium', label: 'Premium' }, { key: 'payment_mode', label: 'Frequency' }, { key: 'policy_term', label: 'Term (years)' }, { key: 'is_active', label: 'Status', render: (v) => <Status value={v ? 'Active' : 'Inactive'} /> }, { key: 'actions', label: 'Actions', render: (_, row) => <div className="portal-row-actions"><button onClick={() => { setEditing(row); setForm({ ...row, features: (row.features || []).join('\n'), payment_type: (row.payment_type || []).join(', ') }) }}>Edit</button><button onClick={() => setConfirm(row)}>{row.is_active ? 'Deactivate' : 'Activate'}</button></div> }]
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); const values = { ...form, plan_no: Number(form.plan_no), policy_premium: Number(form.policy_premium), policy_term: Number(form.policy_term), minimum_age: Number(form.minimum_age), maximum_age: form.maximum_age ? Number(form.maximum_age) : null, features: String(form.features).split('\n').map((x) => x.trim()).filter(Boolean), payment_type: String(form.payment_type).split(',').map((x) => x.trim()).filter(Boolean) }; try { if (editing) await portalService.updatePolicy({ ...values, id: editing.id }); else await portalService.createPolicy(values); setEditing(null); setForm(emptyPolicy); await reload() } catch (err) { setError(getRequestError(err)) } finally { setBusy(false) } }
  const deactivate = async () => { setBusy(true); try { await portalService.setPolicyStatus(confirm.id, !confirm.is_active); setConfirm(null); await reload() } catch (err) { setError(getRequestError(err)) } finally { setBusy(false) } }
  return <><PageTitle title="Policy Detail Master" description="Create and maintain the life and health plans available in the catalog."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><h2>{editing ? 'Edit policy plan' : 'Add a policy plan'}</h2><form className="portal-form-grid" onSubmit={submit}><label>Category<select name="category" value={form.category} onChange={update}><option value="LIFE">Life insurance</option><option value="HEALTH">Health insurance</option></select></label><label>Policy name<input name="policy_name" value={form.policy_name} onChange={update} required maxLength={50}/></label><label>Plan number<input type="number" name="plan_no" value={form.plan_no} onChange={update} required min="1"/></label><label>Premium amount<input type="number" name="policy_premium" value={form.policy_premium} onChange={update} required min="1" step="0.01"/></label><label>Term (years)<input type="number" name="policy_term" value={form.policy_term} onChange={update} required min="1"/></label><label>Premium frequency<select name="payment_mode" value={form.payment_mode} onChange={update}><option value="Annual">Annual</option><option value="Monthly">Monthly</option></select></label><label>Minimum age<input type="number" name="minimum_age" value={form.minimum_age} onChange={update} min="0"/></label><label>Maximum age (optional)<input type="number" name="maximum_age" value={form.maximum_age ?? ''} onChange={update} min="0"/></label><label className="portal-form-span">Payment types (comma-separated)<input name="payment_type" value={form.payment_type} onChange={update}/></label><label className="portal-form-span">Description<textarea name="description" value={form.description} onChange={update}/></label><label className="portal-form-span">Features (one per line)<textarea name="features" value={form.features} onChange={update}/></label><label className="portal-form-span">Terms and conditions<textarea name="terms_and_conditions" value={form.terms_and_conditions} onChange={update}/></label><div className="portal-form-actions"><AppButton type="submit" loading={busy}>{editing ? 'Save changes' : 'Create policy'}</AppButton>{editing && <AppButton variant="outline" onClick={() => { setEditing(null); setForm(emptyPolicy) }}>Cancel</AppButton>}</div></form></section><section className="portal-panel"><h2>Policy plans</h2><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section><ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={deactivate} loading={busy} title={`${confirm?.is_active ? 'Deactivate' : 'Activate'} policy`} message={`Plan ${confirm?.plan_no} will ${confirm?.is_active ? 'stop appearing' : 'appear'} in the customer catalog. Existing applications are retained.`}/></>
}

export function AdminApplicationsPage() {
  const [selected, setSelected] = useState(null); const [reason, setReason] = useState(''); const [agentId, setAgentId] = useState(''); const [agents, setAgents] = useState([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const [confirmAction, setConfirmAction] = useState('')
  const { data, loading, reload } = useLoad(() => portalService.applications(), [])
  useEffect(() => { const timer = setTimeout(() => portalService.staff().then(setAgents).catch((e) => setError(getRequestError(e))), 0); return () => clearTimeout(timer) }, [])
  const columns = [{ key: 'application_no', label: 'Application' }, { key: 'customer_name', label: 'Customer' }, { key: 'policy_name', label: 'Policy' }, { key: 'premium_amount', label: 'Premium' }, { key: 'submitted_at', label: 'Submitted', render: (v) => v?.slice(0, 10) }, { key: 'status', label: 'Status', render: (v) => <Status value={v}/> }, { key: 'actions', label: 'Actions', render: (_, row) => <button className="portal-link-button" onClick={() => { setSelected(row); setReason(''); setAgentId(row.assigned_agent_id || '') }}>Review</button> }]
  const review = async () => { const action = confirmAction; setBusy(true); setError(''); try { await portalService.reviewApplication(action, selected.id, reason); setConfirmAction(''); setSelected(null); await reload() } catch (e) { setError(getRequestError(e)) } finally { setBusy(false) } }
  const assign = async () => { setBusy(true); setError(''); try { await portalService.assignApplication(selected.id, Number(agentId)); setSelected(null); await reload() } catch (e) { setError(getRequestError(e)) } finally { setBusy(false) } }
  return <><PageTitle title="Policy applications" description="Review customer proposals, record decisions, and generate proposal numbers on approval."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section><AppModal open={!!selected} onClose={() => setSelected(null)} title="Application review" size="lg" footer={selected?.status === 'PENDING' && <div className="portal-form-actions"><AppButton variant="success" loading={busy} onClick={() => setConfirmAction('approve')}>Approve and generate proposal</AppButton><AppButton variant="error" loading={busy} disabled={!reason.trim()} onClick={() => setConfirmAction('reject')}>Reject</AppButton></div>}><CustomerDetails customer={selected ? { ...selected, full_name: selected.customer_name, username: selected.customer_id } : null}/><label className="portal-field">Decision reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Required for rejection; optional for approval"/></label>{selected?.status === 'PENDING' && <div className="portal-assign-row"><label className="portal-field">Assign to Agent<select value={agentId} onChange={(e) => setAgentId(e.target.value)}><option value="">Select active Agent</option>{agents.filter((agent) => agent.is_active).map((agent) => <option key={agent.id} value={agent.user_id}>{agent.staff_name} ({agent.username})</option>)}</select></label><AppButton variant="outline" loading={busy} disabled={!agentId} onClick={assign}>Assign</AppButton></div>}<div className="portal-application-meta"><b>Status:</b> <Status value={selected?.status}/><b>Proposal:</b> {selected?.proposal_no || 'Generated on approval'}</div></AppModal><ConfirmModal open={!!confirmAction} onClose={() => setConfirmAction('')} onConfirm={review} loading={busy} title={confirmAction === 'approve' ? 'Approve application' : 'Reject application'} message={confirmAction === 'approve' ? `Approve ${selected?.application_no} and generate its proposal number?` : `Reject ${selected?.application_no} with the reason entered in the review form?`}/></>
}

export function AdminPaymentsPage() { const { data, loading, error } = useLoad(() => portalService.payments(), []); const columns = [{ key: 'receipt_no', label: 'Receipt' }, { key: 'customer_name', label: 'Customer' }, { key: 'customer_email', label: 'Email' }, { key: 'policy_name', label: 'Policy' }, { key: 'customer_id', label: 'Customer ID' }, { key: 'policy_no', label: 'Policy no.' }, { key: 'payment_for', label: 'For' }, { key: 'payment_amount', label: 'Amount' }, { key: 'payment_type', label: 'Method' }, { key: 'date_of_payment', label: 'Paid at', render: (v) => v?.slice(0, 10) || '—' }, { key: 'status', label: 'Status', render: (v) => <Status value={v}/> }]; return <><PageTitle title="Payment Master" description="See who paid, which policy the payment covers, and the transaction status."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></> }

export function AdminRenewalsPage() { const { data, loading, error } = useLoad(() => portalService.renewals(), []); const columns = [{ key: 'renewal_no', label: 'Renewal ID' }, { key: 'customer_name', label: 'Customer' }, { key: 'policy_no', label: 'Policy no.' }, { key: 'policy_name', label: 'Plan' }, { key: 'renewal_amount', label: 'Amount' }, { key: 'due_date', label: 'Due date' }, { key: 'date_of_renew', label: 'Paid date' }, { key: 'status', label: 'Status', render: (v) => <Status value={v}/> }]; return <><PageTitle title="Renewal Master" description="Track upcoming, paid, and overdue premium renewals."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></> }

export function AdminRemindersPage() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [policyId, setPolicyId] = useState('')
  const { data, loading, reload } = useLoad(() => portalService.reminders(), [])
  const policies = useLoad(() => portalService.applications({ status: 'ISSUED' }), [])
  const sendNow = async () => {
    if (!policyId) return toast.error('Choose a customer policy first.')
    setBusy(true); setError('')
    try {
      const reminder = await portalService.sendPolicyReminder(Number(policyId))
      toast.success('Reminder sent. The customer can now pay this renewal early.')
      setError('')
      await reload()
      return reminder
    } catch (e) { const message = getRequestError(e); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  const generate = async () => {
    setBusy(true); setError('')
    try { const result = await portalService.generateReminders(); toast.success(`${result.count} due reminder(s) processed.`); await reload() }
    catch (e) { const message = getRequestError(e); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  const columns = [
    { key: 'reminder_no', label: 'Reminder ID' }, { key: 'customer_name', label: 'Customer' },
    { key: 'policy_no', label: 'Policy' }, { key: 'due_date', label: 'Due date' },
    { key: 'date_of_generate', label: 'Generated' }, { key: 'date_of_sending', label: 'Sent' },
    { key: 'status', label: 'Status', render: (value) => <Status value={value}/> },
  ]
  return <><PageTitle title="Reminder Generator" description="Send an early reminder to a customer or process policies due within 30 days." action={<AppButton loading={busy} onClick={generate}>Generate due reminders</AppButton>}/>
    <ErrorBanner>{error}</ErrorBanner>
    <section className="portal-panel"><h2>Send a customer reminder</h2><p className="mb-4 text-sm opacity-70">Sending a reminder enables the customer to start an advance renewal payment.</p><div className="flex flex-wrap gap-3"><select className="portal-select min-w-72" value={policyId} onChange={(e) => setPolicyId(e.target.value)}><option value="">Select an active policy</option>{policies.data.map((policy) => <option key={policy.id} value={policy.id}>{policy.policy_no} · {policy.policy_name} · {policy.customer_name}</option>)}</select><AppButton loading={busy} disabled={!policyId} onClick={sendNow}>Send reminder now</AppButton></div></section>
    <section className="portal-panel"><h2>Reminder history</h2><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section>
  </>
}

const emptyAgent = { username: '', email: '', password: '', staff_name: '', address: '', date_of_joining: '', salary: '', mobile_number: '' }
export function AdminStaffPage() {
  const [form, setForm] = useState(emptyAgent); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useLoad(() => portalService.staff(), [])
  const toggle = async (row) => { setBusy(true); setError(''); try { await portalService.setStaffStatus(row.id, !row.is_active); await reload() } catch (err) { setError(getRequestError(err)) } finally { setBusy(false) } }
  const columns = [
    { key: 'staff_id', label: 'Staff ID' }, { key: 'staff_name', label: 'Agent' }, { key: 'username', label: 'User ID' },
    { key: 'email', label: 'Email' }, { key: 'date_of_joining', label: 'Joined' }, { key: 'years_of_service', label: 'Years of service' },
    { key: 'is_active', label: 'Status', render: (v) => <Status value={v ? 'Active' : 'Inactive'}/> },
    { key: 'actions', label: 'Actions', render: (_, row) => <button className="portal-link-button" disabled={busy} onClick={() => toggle(row)}>{row.is_active ? 'Deactivate' : 'Activate'}</button> },
  ]
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await portalService.createAgent({ ...form, salary: Number(form.salary || 0) }); setForm(emptyAgent); await reload() } catch (err) { setError(getRequestError(err)) } finally { setBusy(false) } }
  return <><PageTitle title="Staff Master" description="Create controlled Agent accounts and preserve employment details."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><h2>Create Agent account</h2><form className="portal-form-grid" onSubmit={submit}>{[['staff_name','Staff name'],['username','User ID'],['email','Email'],['password','Temporary password'],['address','Address'],['mobile_number','Mobile'],['salary','Salary'],['date_of_joining','Date of joining']].map(([name,label]) => <label className={name === 'address' ? 'portal-form-span' : ''} key={name}>{label}<input required name={name} type={name === 'email' ? 'email' : name === 'password' ? 'password' : name === 'salary' ? 'number' : name === 'date_of_joining' ? 'date' : 'text'} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}/></label>)}<div className="portal-form-actions"><AppButton type="submit" loading={busy}>Create Agent</AppButton></div></form></section><section className="portal-panel"><h2>Agents</h2><AppTable columns={columns} data={data} loading={loading} rowKey="id"/></section></>
}

export function AdminReportsPage({ readOnly = false }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [report, setReport] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { setBusy(true); setError(''); try { setReport(await portalService.report(month)) } catch (e) { setError(getRequestError(e)) } finally { setBusy(false) } }, [month])
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [load])
  const save = async () => { setBusy(true); try { setReport(await portalService.saveReport(month)); toast.success('Report snapshot saved.') } catch (e) { const message = getRequestError(e); setError(message); toast.error(message) } finally { setBusy(false) } }
  const download = async () => {
    setBusy(true)
    try {
      const blob = await portalService.downloadReport(month)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `insurance-report-${month}.pdf`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Your PDF report has been downloaded.')
    } catch (e) { const message = getRequestError(e); setError(message); toast.error(message) }
    finally { setBusy(false) }
  }
  const columns = [{ key: 'policy_no', label: 'Policy' }, { key: 'customer_name', label: 'Customer' }, { key: 'customer_email', label: 'Email' }, { key: 'policy_name', label: 'Plan' }, { key: 'due_date', label: 'Due date' }]
  const paymentColumns = [{ key: 'receipt_no', label: 'Receipt' }, { key: 'customer_name', label: 'Customer' }, { key: 'customer_email', label: 'Email' }, { key: 'policy_name', label: 'Plan' }, { key: 'policy_no', label: 'Policy no.' }, { key: 'amount', label: 'Amount', render: (v) => `₹${v}` }, { key: 'payment_type', label: 'Method' }, { key: 'date', label: 'Paid at', render: (v) => v?.slice(0, 10) }]
  return <><PageTitle eyebrow={readOnly ? 'AGENT WORKSPACE' : 'ADMIN WORKSPACE'} title="Monthly reports" description="Review monthly transactions, policy issue totals, renewals, and next-month due policies."/><ErrorBanner>{error}</ErrorBanner><section className="portal-panel"><div className="portal-toolbar"><label className="portal-inline-label">Report month<input className="portal-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)}/></label><AppButton loading={busy} onClick={load}>Refresh report</AppButton><AppButton variant="outline" loading={busy} onClick={download}>Download PDF</AppButton>{!readOnly && <AppButton variant="outline" loading={busy} onClick={save}>Save snapshot</AppButton>}</div>{report && <><div className="portal-stat-grid compact">{[['Premium received', `₹${report.payment_received}`],['Successful payments', report.payments_total],['Policies issued', report.policies_total],['Renewals paid', report.renewals_total],['Next-month renewals', report.next_month_renewals],['Reminders generated', report.total_reminders]].map(([label,value]) => <article className="portal-stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><h2>Upcoming renewals</h2><AppTable columns={columns} data={report.upcoming_renewals || []} rowKey="policy_no"/><h2 className="mt-8">Successful payments</h2><AppTable columns={paymentColumns} data={report.payments || []} rowKey="receipt_no"/></>}</section></>
}

export function AdminNotFound() { return <div className="portal-panel"><h1>Admin module</h1><p>This section is being prepared.</p><Link to="/admin/dashboard">Return to dashboard</Link></div> }
