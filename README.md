# Online Insurance Portal

React/Vite frontend and Django/MySQL backend for the synopsis-based Online Insurance Portal. Customer registration and JWT authentication are already wired to the Customer Master. Business APIs use Django class-based `View`s, GET/POST `fun_call` actions, shared auth/response helpers, and no serializers.

## Run locally

1. Configure the MySQL connection in `backend/.env`.
2. Run `cd backend`, then `venv\Scripts\python.exe manage.py migrate`.
3. Add eight sample plans, including monthly premium plans, with `venv\Scripts\python.exe manage.py seed_demo_policies`. This command can be run more than once.
4. Create an Admin account with Django's `venv\Scripts\python.exe manage.py createsuperuser`, or set `PORTAL_ADMIN_USERNAME`, `PORTAL_ADMIN_EMAIL`, and `PORTAL_ADMIN_PASSWORD` in `backend/.env` and run `venv\Scripts\python.exe manage.py bootstrap_admin`. A Django superuser is assigned the Admin portal role on first successful login.
5. Start Django with `venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000`.
6. In another terminal run `cd frontend` then `npm run dev`; open `http://localhost:5173`.
7. Anyone can browse Home, Policies, and About without logging in. To apply, create a customer account or sign in; after registration/sign-in, the selected policy application opens. Admin and Agent accounts go to their own dashboards after login.

The Vite development server proxies `/api` to Django, so browser requests use the same origin. Set `VITE_API_URL` only when deploying the frontend and backend on separate hosts.

## Module flow

```text
Customer Master -> Policy Detail Master -> Policy Registration / Admin review
  -> simulated payment -> receipt and issued policy -> renewal -> reminder -> report
```

Payments are demo-only. The checkout validates card details but only stores cardholder, network, and last four digits; it never stores a full card number or CVV. Internet banking asks only for bank, account holder, and account last four digits, never passwords or OTPs. Do not enter real financial details. Demand draft, card, and internet banking details use separate transaction tables. Password reset and reminder emails use Django's console email backend by default.

Admins can send an early reminder from the Reminder Generator. The customer can then open **My policies** and pay the renewal in advance. Monthly plans calculate their next due date one month after payment; annual plans calculate it one year after payment. Monthly report pages include a **Download PDF** action.

## Reminder schedule

Run `venv\Scripts\python.exe manage.py generate_reminders` daily. Configure this command in Windows Task Scheduler for a local Windows installation. The Admin dashboard also provides a manual generation action for development.

## API actions

| Resource | GET actions | POST actions |
|---|---|---|
| `/api/accounts/` | `current_user`, `customers_list`, `customer_detail` | `register`, `login`, `refresh_token`, `logout`, `password_reset`, `password_reset_confirm`, `customer_status` |
| `/api/policies/` | `get_all`, `get_by_id` | `create`, `update`, `deactivate` |
| `/api/applications/` | `get_all`, `get_by_id` | `create`, `approve`, `reject`, `assign_agent` |
| `/api/payments/` | `get_all`, `get_my_payments`, `get_by_id`, `get_receipt` | `pay` |
| `/api/renewals/` | `get_all`, `get_my_renewals`, `get_due`, `get_by_id` | `create` |
| `/api/reminders/` | `get_all`, `get_my_reminders` | `generate`, `send_policy_reminder` (Admin only) |
| `/api/staff/` | `get_all` | `create_agent`, `set_status` |
| `/api/reports/` | `get`, `download_pdf` | `save` (snapshot) |

Responses keep the established `{ "status", "message", "data" }` envelope. Only GET and POST application methods are accepted; OPTIONS is handled for browser preflight.
