import { api } from './client'

export type PaymentSituation = 'pago' | 'parcial' | 'a_pagar' | 'atrasado' | 'sem_cobranca'

export const SITUATION_LABEL: Record<PaymentSituation, string> = {
  pago: 'Pago',
  parcial: 'Parcial',
  a_pagar: 'A pagar',
  atrasado: 'Atrasado',
  sem_cobranca: 'Sem cobrança',
}

export const SITUATION_COLOR: Record<PaymentSituation, string> = {
  pago: 'success',
  parcial: 'warning',
  a_pagar: 'medium',
  atrasado: 'danger',
  sem_cobranca: 'light',
}

export interface RequirementItem {
  id: number
  requirement_id: number
  name: string
  required: boolean
  delivered: boolean
}

export interface RosterRow {
  id: number
  name: string
  email: string
  phone: string
  status: string
  is_minor: boolean
  guardian_name: string
  guardian_phone: string
  shirt_size: string
  boarding_point: string
  room_group: string
  dietary_restrictions: string
  medical_notes: string
  payment: {
    total: string
    paid: string
    remaining: string
    installments_count: number
    installments_paid: number
    overdue_count: number
    next_due_date: string | null
    situation: PaymentSituation
  }
  requirements: {
    total: number
    delivered: number
    required_total: number
    required_pending: string[]
    all_required_delivered: boolean
    items: RequirementItem[]
  }
}

export interface RosterSummary {
  participants: number
  capacity: number | null
  spots_left: number | null
  paid: number
  partial: number
  to_pay: number
  overdue: number
  minors: number
  pending_requirements: number
  total_expected: string
  total_received: string
  total_remaining: string
}

export interface Roster {
  summary: RosterSummary
  participants: RosterRow[]
}

export const getRoster = (tripId: number) => api.get<Roster>(`/trips/${tripId}/roster/`)

export interface Installment {
  id: number
  payment: number
  participant_name: string
  amount: string
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'failed'
  pix_qr_code: string
  paid_at: string | null
}

export interface Payment {
  id: number
  participant: number
  participant_name: string
  trip: number
  total_amount: string
  status: string
  installments: Installment[]
}

interface Paginated<T> {
  count: number
  results: T[]
}

export const listPayments = (tripId: number) =>
  api.get<Paginated<Payment>>(`/payments/?trip=${tripId}`).then((p) => p.results)

export const payInstallment = (id: number) => api.post<Installment>(`/installments/${id}/pay/`)
export const unpayInstallment = (id: number) => api.post<Installment>(`/installments/${id}/unpay/`)
export const generatePix = (id: number) => api.post<Installment>(`/installments/${id}/pix/`)

/** Re-parcela o saldo em aberto (mais ou menos parcelas). */
export const replanPayment = (paymentId: number, installments: number) =>
  api.post<Payment>(`/payments/${paymentId}/replan/`, { installments })

export const setRequirementDelivered = (statusId: number, delivered: boolean) =>
  api.patch<RequirementItem>(`/participant-requirements/${statusId}/`, { delivered })

// --- inscrição pública -------------------------------------------------------

export interface EnrollmentInput {
  name: string
  email?: string
  phone?: string
  document?: string
  birth_date?: string | null
  is_minor: boolean
  guardian_name?: string
  guardian_phone?: string
  emergency_contact?: string
  health_insurance?: string
  dietary_restrictions?: string
  medical_notes?: string
  shirt_size?: string
  boarding_point?: string
  notes?: string
  consent_accepted: boolean
  installments: number
}

export interface EnrollmentResult {
  id: number
  name: string
  trip: string
  total_amount: string
  installments: { amount: string; due_date: string }[]
  requirements: string[]
  spots_left: number | null
}

export const enroll = (slug: string, input: EnrollmentInput) =>
  api.post<EnrollmentResult>(`/public/trips/${slug}/enroll/`, input)
