import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

/**
 * The single place that talks HTTP, built on axios. Interceptors add the bearer token to every request, turn RFC 7807
 * problem responses into `ApiError`, and sign the user out when the server says the token is no longer valid.
 * Everything else in the app calls `http()` and never sees axios.
 */

let readToken: () => string | null = () => null
let handleUnauthorized: () => void = () => {}

/** Wired once at startup; keeps this module free of React. */
export function configureHttp(options: { getToken: () => string | null; onUnauthorized: () => void }): void {
  readToken = options.getToken
  handleUnauthorized = options.onUnauthorized
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

client.interceptors.request.use((config) => {
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
