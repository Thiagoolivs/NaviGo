// Autenticação (dj-rest-auth). O token vai em cookie httpOnly.
import { ApiError, api, ensureCsrf } from './client'

export { ApiError }

export interface AuthUser {
  pk: number
  email: string
  username: string
}

export async function login(email: string, password: string): Promise<void> {
  await ensureCsrf()
  await api.post('/auth/login/', { email, password })
}

/**
 * Cadastra e já autentica.
 *
 * O endpoint de cadastro devolve os tokens no corpo, mas quem define o cookie
 * JWT é o login — por isso entramos logo em seguida.
 */
export async function register(email: string, password: string): Promise<void> {
  await ensureCsrf()
  await api.post('/auth/registration/', {
    email,
    password1: password,
    password2: password,
  })
  await login(email, password)
}

export const logout = () => api.post('/auth/logout/')

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>('/auth/user/')
  } catch {
    return null
  }
}
