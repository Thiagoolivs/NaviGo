// Cliente de autenticação (dj-rest-auth). O token vai em cookie httpOnly,
// então todas as chamadas usam credentials: 'include'.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export class AuthError extends Error {
  detail: Record<string, unknown>
  constructor(detail: Record<string, unknown>) {
    super('Falha na autenticação')
    this.detail = detail
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new AuthError(data)
  return data as T
}

export interface AuthUser {
  pk: number
  email: string
  username: string
}

export function register(email: string, password: string) {
  return post('/auth/registration/', {
    email,
    password1: password,
    password2: password,
  })
}

export function login(email: string, password: string) {
  return post('/auth/login/', { email, password })
}

export function logout() {
  return post('/auth/logout/', {})
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch(`${API_URL}/auth/user/`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  return (await res.json()) as AuthUser
}
