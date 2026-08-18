import { api } from './client'

export type TripType = 'church' | 'school' | 'family' | 'friends' | 'corporate' | 'event'
export type CostType = 'fixed' | 'per_person'
export type BudgetCategory = 'transport' | 'lodging' | 'meals' | 'tickets' | 'extra'

export const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: 'church', label: 'Igreja' },
  { value: 'school', label: 'Escola' },
  { value: 'family', label: 'Família' },
  { value: 'friends', label: 'Amigos' },
  { value: 'corporate', label: 'Corporativa' },
  { value: 'event', label: 'Evento' },
]

export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string }[] = [
  { value: 'transport', label: 'Transporte' },
  { value: 'lodging', label: 'Hospedagem' },
  { value: 'meals', label: 'Alimentação' },
  { value: 'tickets', label: 'Ingressos' },
  { value: 'extra', label: 'Extras' },
]

export interface TripConfig {
  has_lodging: boolean
  has_meals: boolean
  has_chartered_transport: boolean
  has_rooms: boolean
  has_groups: boolean
  has_capacity_limit: boolean
  safety_margin_percent: string
}

export interface Trip {
  id: number
  name: string
  destination: string
  type: TripType
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  capacity: number | null
  slug: string
  status: 'draft' | 'published' | 'closed' | 'archived'
  cover_image_url: string
  config: TripConfig | null
  participants_count: number
  tasks_pending: number
  created_at: string
}

export interface Task {
  id: number
  trip: number
  title: string
  description: string
  done: boolean
  due_date: string | null
  source: 'ai' | 'manual'
}

export interface BudgetItem {
  id: number
  trip: number
  category: BudgetCategory
  description: string
  amount: string
  cost_type: CostType
}

export interface Pricing {
  participants: number
  safety_margin_percent: string
  total_fixed: string
  total_per_person: string
  price_per_participant: string
  estimated_total: string
}

export interface AssistantResult {
  checklist: string[]
  budget_categories: string[]
  notes: string
  tasks_created: number
}

interface Paginated<T> {
  count: number
  results: T[]
}

export interface NewTripInput {
  name: string
  destination: string
  type: TripType
  start_date?: string | null
  duration_days?: number | null
  capacity?: number | null
  config?: Partial<TripConfig>
}

export const listTrips = () =>
  api.get<Paginated<Trip>>('/trips/').then((page) => page.results)

export const getTrip = (id: number) => api.get<Trip>(`/trips/${id}/`)

export const createTrip = (input: NewTripInput) => api.post<Trip>('/trips/', input)

export const publishTrip = (id: number) => api.post<Trip>(`/trips/${id}/publish/`)

/** Consulta o assistente de IA e cria o checklist automático da viagem. */
export const runAssistant = (id: number) => api.post<AssistantResult>(`/trips/${id}/assistant/`)

export const getPricing = (id: number, participants?: number) =>
  api.get<Pricing>(
    `/trips/${id}/pricing/${participants ? `?participants=${participants}` : ''}`,
  )

export const listTasks = (tripId: number) =>
  api.get<Paginated<Task>>(`/tasks/?trip=${tripId}`).then((page) => page.results)

export const toggleTask = (task: Task) =>
  api.patch<Task>(`/tasks/${task.id}/`, { done: !task.done })

export const listBudgetItems = (tripId: number) =>
  api.get<Paginated<BudgetItem>>(`/budget-items/?trip=${tripId}`).then((page) => page.results)

export const createBudgetItem = (item: Omit<BudgetItem, 'id'>) =>
  api.post<BudgetItem>('/budget-items/', item)

export const deleteBudgetItem = (id: number) => api.delete<void>(`/budget-items/${id}/`)
