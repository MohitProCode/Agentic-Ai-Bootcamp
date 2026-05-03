const AUTH_SESSION_KEY = 'lumina_auth_session_v1'
const REPORT_HISTORY_KEY = 'lumina_report_history_v1'

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readJson = (key, fallback) => {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const writeJson = (key, value) => {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const loadAuthSession = () => {
  return readJson(AUTH_SESSION_KEY, null)
}

export const saveAuthSession = (session) => {
  writeJson(AUTH_SESSION_KEY, session)
}

export const clearAuthSession = () => {
  if (!isBrowser()) return
  window.localStorage.removeItem(AUTH_SESSION_KEY)
}

export const loadReportHistory = () => {
  const history = readJson(REPORT_HISTORY_KEY, [])
  return Array.isArray(history) ? history : []
}

export const saveReportHistory = (history) => {
  writeJson(REPORT_HISTORY_KEY, Array.isArray(history) ? history : [])
}

export const appendReportHistory = (entry, maxItems = 50) => {
  const current = loadReportHistory()
  const deduped = current.filter((item) => item.id !== entry.id)
  const next = [entry, ...deduped].slice(0, maxItems)
  saveReportHistory(next)
  return next
}
