import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/auth/PasswordResetPages'
import { RoleRoute } from './routes/ProtectedRoute'
import { PortalLayout } from './components/layout/PortalLayout'
import { AboutPage, PublicHome, PublicPolicyCatalogPage, PublicPolicyDetailsPage } from './pages/PublicHome'
import {
  AdminApplicationsPage, AdminCustomersPage, AdminDashboardPage, AdminPaymentsPage,
  AdminPoliciesPage, AdminRemindersPage, AdminReportsPage, AdminRenewalsPage, AdminStaffPage,
} from './pages/admin/AdminPages'
import {
  CustomerActivePoliciesPage, CustomerApplicationsPage, CustomerApplyPage, CustomerDashboardPage,
  CustomerPaymentsPage, CustomerPoliciesPage, CustomerReceiptPage,
  CustomerRemindersPage, CustomerRenewalsPage,
} from './pages/customer/CustomerPages'
import { CustomerPaymentPage } from './pages/customer/CustomerPaymentPage'
import { AgentApplicationsPage, AgentDashboardPage } from './pages/AgentPages'


function landingFor(user) {
  const roles = user?.roles || (user?.role ? [user.role] : [])
  if (roles.includes('ADMIN')) return '/admin/dashboard'
  if (roles.includes('AGENT')) return '/agent/dashboard'
  if (roles.includes('CUSTOMER')) return '/customer/dashboard'
  return '/login'
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading"><span className="spinner" />Checking your session…</div>
  return <Routes>
    <Route path="/" element={<PublicHome />} />
    <Route path="/login" element={user ? <Navigate to={landingFor(user)} replace /> : <LoginPage />} />
    <Route path="/register" element={user ? <Navigate to={landingFor(user)} replace /> : <RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
    <Route path="/policies/:policyId" element={<PublicPolicyDetailsPage />} />
    <Route path="/policies" element={<PublicPolicyCatalogPage />} />
    <Route path="/about" element={<AboutPage />} />


    <Route path="/admin" element={<RoleRoute roles={['ADMIN']}><PortalLayout area="ADMIN" /></RoleRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="customers" element={<AdminCustomersPage />} />
      <Route path="policies" element={<AdminPoliciesPage />} />
      <Route path="applications" element={<AdminApplicationsPage />} />
      <Route path="payments" element={<AdminPaymentsPage />} />
      <Route path="renewals" element={<AdminRenewalsPage />} />
      <Route path="reminders" element={<AdminRemindersPage />} />
      <Route path="staff" element={<AdminStaffPage />} />
      <Route path="reports" element={<AdminReportsPage />} />
    </Route>

    <Route path="/customer" element={<RoleRoute roles={['CUSTOMER']}><PortalLayout area="CUSTOMER" /></RoleRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<CustomerDashboardPage />} />
      <Route path="policies" element={<CustomerPoliciesPage />} />
      <Route path="apply/:policyId" element={<CustomerApplyPage />} />
      <Route path="applications" element={<CustomerApplicationsPage />} />
      <Route path="active-policies" element={<CustomerActivePoliciesPage />} />
      <Route path="payment/renewal/:renewalId" element={<CustomerPaymentPage />} />
      <Route path="payment/:applicationId" element={<CustomerPaymentPage />} />
      <Route path="payments" element={<CustomerPaymentsPage />} />
      <Route path="receipt/:receiptNo" element={<CustomerReceiptPage />} />
      <Route path="renewals" element={<CustomerRenewalsPage />} />
      <Route path="reminders" element={<CustomerRemindersPage />} />
    </Route>

    <Route path="/agent" element={<RoleRoute roles={['AGENT']}><PortalLayout area="AGENT" /></RoleRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AgentDashboardPage />} />
      <Route path="applications" element={<AgentApplicationsPage />} />
      <Route path="reports" element={<AdminReportsPage readOnly />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>
}
