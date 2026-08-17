// Cliente mínimo da API do NaviGo.
// A URL base vem de VITE_API_URL (ver .env.example).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`API respondeu ${res.status}`)
  }
  return (await res.json()) as T
}

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health/')
}
