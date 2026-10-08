import AppInput from '../form/AppInput'
import AppSelect from '../form/AppSelect'

const banks = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank', 'Other']

export default function PaymentMethodFields({ method, details, onChange }) {
  const field = (group, name) => (event) => onChange(group, name, event.target.value)
  const bankOptions = banks.map((bank) => ({ value: bank, label: bank }))

  if (method === 'Credit Card' || method === 'Debit Card') return <div className="grid gap-4 sm:grid-cols-2">
    <AppInput label="Name on card" name="card-holder" autoComplete="cc-name" value={details.card.holder} onChange={field('card', 'holder')} required placeholder="Cardholder name" />
    <AppInput label="Card number" name="card-number" inputMode="numeric" autoComplete="off" maxLength={23} value={details.card.number} onChange={field('card', 'number')} required placeholder="4111 1111 1111 1111" />
    <AppInput label="Expiry date" name="card-expiry" autoComplete="off" maxLength={5} value={details.card.expiry} onChange={field('card', 'expiry')} required placeholder="MM/YY" />
    <AppInput label="Security code" name="card-cvv" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={details.card.cvv} onChange={field('card', 'cvv')} required placeholder="3 or 4 digits" />
    <p className="text-sm opacity-70 sm:col-span-2">Enter the card details to simulate payment. The card number and security code are not retained.</p>
  </div>

  if (method === 'Demand Draft') return <div className="grid gap-4 sm:grid-cols-2">
    <AppInput label="Draft number" name="draft-number" value={details.demand_draft.number} onChange={field('demand_draft', 'number')} required placeholder="Enter the draft number" />
    <AppSelect label="Issuing bank" name="draft-bank" value={details.demand_draft.bank_name} onChange={field('demand_draft', 'bank_name')} options={bankOptions} required />
    <AppInput label="Issue date" name="draft-date" type="date" value={details.demand_draft.issue_date} onChange={field('demand_draft', 'issue_date')} required />
    <p className="text-sm opacity-70 sm:col-span-2">Enter the draft reference and issuing bank to simulate payment.</p>
  </div>

  return <div className="grid gap-4 sm:grid-cols-2">
    <AppSelect label="Bank" name="internet-bank" value={details.internet_banking.bank_name} onChange={field('internet_banking', 'bank_name')} options={bankOptions} required />
    <AppInput label="Account holder" name="bank-holder" value={details.internet_banking.account_holder} onChange={field('internet_banking', 'account_holder')} required placeholder="Name on account" />
    <AppInput label="Account last four digits" name="bank-last-four" inputMode="numeric" maxLength={4} autoComplete="off" value={details.internet_banking.account_last_four} onChange={field('internet_banking', 'account_last_four')} required placeholder="1234" />
    <p className="text-sm opacity-70 sm:col-span-2">Use the account holder and last four digits for this simulated bank payment. Do not enter a banking password, PIN, or one-time code.</p>
  </div>
}
