// Cliente da API do NaviGo.
//
// Autenticação: JWT em cookie httpOnly. Como o cookie não é legível pelo JS,
// toda requisição vai com `credentials: 'include'`. Para as requisições de
// escrita o Django exige CSRF, então lemos o cookie `csrftoken` **a cada
// chamada** (ele rotaciona a cada login/cadastro).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  detail: Record<string, unknown>

  constructor(status: number, detail: Record<string, unknown>) {
    super(typeof detail.detail === 'string' ? detail.detail : `Erro ${status}`)
    this.status = status
    this.detail = detail
  }

  /** Primeira mensagem de erro legível, útil para exibir em formulários. */
  get firstMessage(): string {
    const first = Object.values(this.detail)[0]
    if (Array.isArray(first)) return String(first[0])
    if (typeof first === 'string') return first
    return this.message
  }
}

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : ''
}

/** Garante o cookie csrftoken (chame uma vez ao abrir o app). */
export async function ensureCsrf(): Promise<void> {
  if (readCookie('csrftoken')) return
  await fetch(`${API_URL}/auth/csrf/`, { credentials: 'include' }).catch(() => undefined)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (method !== 'GET') {
    if (!readCookie('csrftoken')) await ensureCsrf()
    headers['X-CSRFToken'] = readCookie('csrftoken')
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data as Record<string, unknown>)
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export const getHealth = () => api.get<HealthResponse>('/health/')
