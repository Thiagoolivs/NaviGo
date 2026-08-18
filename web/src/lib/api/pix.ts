import { api } from './client'

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | ''

export const PIX_KEY_TYPES: { value: Exclude<PixKeyType, ''>; label: string }[] = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
]

export interface PixAccount {
  pix_key: string
  pix_key_type: PixKeyType
  pix_owner_name: string
  pix_bank: string
  pix_payload: string
  pix_qr_image: string
  /** Imagem pronta para exibir (gerada do copia e cola ou a enviada). */
  qr_code: string
  has_pix_account: boolean
}

export const getPixAccount = () => api.get<PixAccount>('/auth/pix-account/')

export const savePixAccount = (dados: Partial<PixAccount>) =>
  api.patch<PixAccount>('/auth/pix-account/', dados)

export interface TripPaymentInfo {
  trip: string
  has_pix_account: boolean
  pix_owner_name: string
  pix_key: string
  pix_key_type: PixKeyType
  pix_bank: string
  pix_payload: string
  qr_code: string
}

export const getTripPayment = (slug: string) =>
  api.get<TripPaymentInfo>(`/public/trips/${slug}/payment/`)
