import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { AuthResponse } from './types'

/**
 * The single place that talks HTTP, built on axios. Interceptors add the bearer token to every request, turn RFC 7807
 * problem responses into `ApiError`, and sign the user out when the server says the token is no longer valid.
 * Everything else in the app calls `http()` and never sees axios.
 */

let readToken: () => string | null = () => null
let readExpiry: () => string | null = () => null
let storeRefreshed: (response: AuthResponse) => void = () => {}
let handleUnauthorized: () => void = () => {}

/** A token lasts two hours; it is renewed once less than this is left, so a session that is in use never reaches its end. */
const RENEW_WHEN_LESS_THAN_MS = 60 * 60_000
let renewing: Promise<void> | null = null

/**
 * Asks the server for a new token when the current one is past half its life. One request at a time, shared by everyone
 * waiting for it. A failure is ignored here: if the token really is dead, the next request gets a 401 and signs out.
 * Uses plain axios, not the configured client, so it cannot trigger itself.
 */
export function renewSessionIfNeeded(): Promise<void> {
  const token = readToken()
  const expiresAt = readExpiry()
  if (!token || !expiresAt) return Promise.resolve()
  const left = Date.parse(expiresAt) - Date.now()
  if (left > RENEW_WHEN_LESS_THAN_MS || left <= 0) return Promise.resolve()
  renewing ??= axios
    .post<AuthResponse>('/api/auth/refresh', null, { headers: { Authorization: `Bearer ${token}` } })
    .then((response) => storeRefreshed(response.data))
    .catch(() => undefined)
    .finally(() => {
      renewing = null
    })
  return renewing
}

/** Wired once at startup; keeps this module free of React. */
export function configureHttp(options: { getToken: () => string | null; getExpiresAt: () => string | null; onRenewed: (response: AuthResponse) => void; onUnauthorized: () => void }): void {
  readToken = options.getToken
  readExpiry = options.getExpiresAt
  storeRefreshed = options.onRenewed
  handleUnauthorized = options.onUnauthorized

  // An idle tab makes no requests, so check on a timer, and again when the tab comes back (a laptop waking up).
  window.setInterval(() => void renewSessionIfNeeded(), 5 * 60_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void renewSessionIfNeeded()
  })
}

interface ProblemBody {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const client = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

client.interceptors.request.use(async (config) => {
  await renewSessionIfNeeded()
  const token = readToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Cancelled requests (a component unmounted) are not failures; let them through untouched.
    if (axios.isCancel(error)) return Promise.reject(error)

    if (error instanceof AxiosError && error.response) {
      const { status, data } = error.response as { status: number; data: ProblemBody | undefined }
      // A 401 on a request that carried a token means the session expired. A 401 on login itself is just "wrong password".
      if (status === 401 && error.config?.headers?.has('Authorization')) handleUnauthorized()

      const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined
      const message = firstFieldError ?? data?.title ?? data?.detail ?? `Request failed (${status})`
      return Promise.reject(new ApiError(status, message, data?.errors))
    }

    // No response at all: the server is down or unreachable.
    return Promise.reject(new ApiError(0, 'Cannot reach the server. Check your connection and try again.'))
  },
)

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const config: AxiosRequestConfig = {
    url: path,
    method: options.method ?? 'GET',
    data: options.body,
    signal: options.signal,
  }
  const response = await client.request<T>(config)
  // 204 No Content has no body; axios gives an empty string there.
  return (response.status === 204 ? undefined : response.data) as T
}
