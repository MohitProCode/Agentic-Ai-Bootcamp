import { loadAuthSession } from '../lib/persistence'

const DEFAULT_API_BASE_URL = '/api/v1'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const withBase = (path) => {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export const buildQuery = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
  })
  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, requiresAuth = true, signal } = options
  const authSession = loadAuthSession()
  const token = authSession?.accessToken || null

  const requestHeaders = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  }

  if (requiresAuth && token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(withBase(path), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const raw = await response.text()
  let parsed = null
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
  }

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === 'object' && (parsed.detail || parsed.message)) ||
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, parsed)
  }

  return parsed
}
