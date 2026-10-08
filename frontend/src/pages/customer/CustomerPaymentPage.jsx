import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppButton from '../../components/button/AppButton'
import AppSelect from '../../components/form/AppSelect'
import PaymentMethodFields from '../../components/payments/PaymentMethodFields'
import { getRequestError, portalService } from '../../services/portalService'

const emptyDetails = {
  card: { holder: '', number: '', expiry: '', cvv: '' },
  demand_draft: { number: '', bank_name: '', issue_date: '' },
  internet_banking: { bank_name: '', account_holder: '', account_last_four: '' },
}

export function CustomerPaymentPage() {
  const { applicationId, renewalId } = useParams()
  const navigate = useNavigate()
  const isRenewal = Boolean(renewalId)
  const [record, setRecord] = useState(null)
  const [method, setMethod] = useState('Credit Card')
  const [details, setDetails] = useState(emptyDetails)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const load = isRenewal ? portalService.renewal(renewalId) : portalService.application(applicationId)
    load.then(setRecord).catch((e) => setError(getRequestError(e)))
  }, [applicationId, isRenewal, renewalId])

  const updateDetails = (group, name, value) => {
    setDetails((current) => ({ ...current, [group]: { ...current[group], [name]: value } }))
  }

  const pay = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const toastId = toast.loading('Processing your payment…')
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 2000 + Math.random() * 3000))
      const payment = await portalService.pay({
        payment_for: isRenewal ? 'RENEWAL' : 'INITIAL',
        ...(isRenewal ? { renewal_id: Number(renewalId) } : { application_id: Number(applicationId) }),
        payment_type: method,
        card: details.card,
        demand_draft: details.demand_draft,
        internet_banking: details.internet_banking,
      })
      toast.success('Payment successful. Your receipt is ready.', { id: toastId })
      navigate(`/customer/receipt/${payment.receipt_no}`, { replace: true })
    } catch (e) {
      const message = getRequestError(e)
      setError(message)
      toast.error(message, { id: toastId })
    } finally {
      setDetails((current) => ({ ...current, card: { ...current.card, number: '', cvv: '' } }))
      setBusy(false)
    }
  }

  const canPay = isRenewal
    ? ['DUE', 'OVERDUE'].includes(record?.status)
    : record?.status === 'APPROVED'
  const amount = isRenewal ? record?.renewal_amount : record?.premium_amount
  const frequency = record?.payment_mode === 'Monthly' ? 'per month' : 'per year'

  return <div className="mx-auto max-w-4xl">
    <div className="mb-6"><span className="eyebrow">SECURE CHECKOUT · DEMO</span><h1 className="mt-1 text-3xl font-bold">{isRenewal ? 'Renew your policy' : 'Pay your premium'}</h1><p className="mt-2 opacity-70">This is a simulated checkout. No real money is charged.</p></div>
    {error && <div role="alert" className="alert alert-error mb-5">{error}</div>}
    {!record && !error && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-success" /></div>}
    {record && <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <section className="card border border-base-300 bg-base-100 shadow-sm"><div className="card-body">
        <h2 className="card-title">Choose payment method</h2>
        <form className="mt-2 space-y-5" onSubmit={pay}>
          <AppSelect label="Payment method" name="payment-method" value={method} onChange={(e) => setMethod(e.target.value)} options={[
            { value: 'Credit Card', label: 'Credit card' }, { value: 'Debit Card', label: 'Debit card' },
            { value: 'Demand Draft', label: 'Demand draft' }, { value: 'Internet Banking', label: 'Internet banking' },
          ]} required />
          <PaymentMethodFields method={method} details={details} onChange={updateDetails} />
          <AppButton type="submit" loading={busy} disabled={!canPay} fullWidth>Pay ₹{amount || '—'} securely</AppButton>
          {!canPay && <p className="text-sm text-warning">{isRenewal ? 'This renewal is not ready for payment.' : 'Payment becomes available after Admin approval.'}</p>}
        </form>
      </div></section>
      <aside className="card h-fit border border-base-300 bg-base-100 shadow-sm"><div className="card-body">
        <h2 className="card-title">Payment summary</h2><div className="divider my-1" />
        <p className="text-sm opacity-70">{isRenewal ? 'Renewal' : 'Approved proposal'}</p>
        <p className="font-semibold">{isRenewal ? record.renewal_no : record.proposal_no}</p>
        <p className="mt-3 text-sm opacity-70">{record.policy_name}</p>
        <p className="text-sm">{isRenewal ? `Due ${record.due_date}` : `Application ${record.application_no}`}</p>
        <div className="divider my-1" /><div className="flex items-end justify-between"><span>Total ({frequency})</span><strong className="text-2xl text-success">₹{amount}</strong></div>
        <p className="mt-3 text-xs opacity-60">Payment details are stored only as safe transaction references. Card number, security code, account passwords and OTPs are never saved.</p>
      </div></aside>
    </div>}
  </div>
}
