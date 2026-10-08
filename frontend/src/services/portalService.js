import { api } from './api'

const unwrap = (response) => {
  const payload = response.data
  if (!payload?.status) throw new Error(payload?.message || 'Request failed.')
  return payload.data
}

const get = async (path, fun_call, params = {}) => unwrap(await api.get(path, { params: { fun_call, ...params } }))
const post = async (path, fun_call, body = {}) => unwrap(await api.post(path, body, { params: { fun_call } }))

export const portalService = {
  customers: (params) => get('/accounts/', 'customers_list', params),
  customer: (id) => get('/accounts/', 'customer_detail', { id }),
  setCustomerStatus: (id, is_active) => post('/accounts/', 'customer_status', { id, is_active }),
  policies: (params) => get('/policies/', 'get_all', params),
  policy: (id) => get('/policies/', 'get_by_id', { id }),
  createPolicy: (values) => post('/policies/', 'create', values),
  updatePolicy: (values) => post('/policies/', 'update', values),
  deactivatePolicy: (id) => post('/policies/', 'deactivate', { id }),
  setPolicyStatus: (id, is_active) => post('/policies/', 'set_status', { id, is_active }),
  applications: (params = {}) => get('/applications/', 'get_all', params),
  application: (id) => get('/applications/', 'get_by_id', { id }),
  myApplications: () => get('/applications/', 'get_all'),
  createApplication: (values) => post('/applications/', 'create', values),
  reviewApplication: (action, id, reason = '') => post('/applications/', action, { id, reason }),
  assignApplication: (id, agent_id) => post('/applications/', 'assign_agent', { id, agent_id }),
  payments: () => get('/payments/', 'get_all'),
  pay: (values) => post('/payments/', 'pay', values),
  receipt: (receipt_no) => get('/payments/', 'get_receipt', { receipt_no }),
  renewals: () => get('/renewals/', 'get_all'),
  renewal: (id) => get('/renewals/', 'get_by_id', { id }),
  createRenewal: (policy_id) => post('/renewals/', 'create', { policy_id }),
  reminders: () => get('/reminders/', 'get_all'),
  generateReminders: () => post('/reminders/', 'generate'),
  sendPolicyReminder: (policy_id) => post('/reminders/', 'send_policy_reminder', { policy_id }),
  staff: (params) => get('/staff/', 'get_all', params),
  createAgent: (values) => post('/staff/', 'create_agent', values),
  setStaffStatus: (id, is_active) => post('/staff/', 'set_status', { id, is_active }),
  report: (month) => get('/reports/', 'get', { month }),
  downloadReport: (month) => api.get('/reports/', { params: { fun_call: 'download_pdf', month }, responseType: 'blob' }).then((response) => response.data),
  saveReport: (month) => post('/reports/', 'save', { month }),
}

export function getRequestError(error) {
  const payload = error?.response?.data
  if (payload?.message) return payload.message
  const details = payload?.data
  if (details && typeof details === 'object') {
    const first = Object.values(details).flat(Infinity).find((item) => typeof item === 'string')
    if (first) return first
  }
  if (error?.message && !error?.response) return error.message
  return 'Request could not be completed. Please try again.'
}
