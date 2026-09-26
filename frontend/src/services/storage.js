const ACCESS_KEY = 'insurance.access'
const REFRESH_KEY = 'insurance.refresh'
export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: ({ access, refresh }) => { if (access) localStorage.setItem(ACCESS_KEY, access); if (refresh) localStorage.setItem(REFRESH_KEY, refresh) },
  clear: () => { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY) },
}
