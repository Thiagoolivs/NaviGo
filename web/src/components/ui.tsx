/** Kit de componentes do NaviGo — a base visual de todas as telas. */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../lib/format'
import { Alert as AlertIcon } from './icons'

/* ---------------------------------------------------------------- Botão */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600/40',
  secondary:
    'bg-white text-ink border border-line hover:bg-canvas hover:border-line-strong disabled:text-ink-muted',
  ghost: 'text-ink-soft hover:bg-black/5 hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/40',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const buttonBase =
  'inline-flex items-center justify-center rounded-lg font-medium transition ' +
  'disabled:cursor-not-allowed select-none'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(buttonBase, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  className,
  children,
}: {
  to: string
  variant?: Variant
  size?: Size
  block?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(buttonBase, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
    >
      {children}
    </Link>
  )
}

/* ---------------------------------------------------------------- Cartão */

export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('rounded-card border border-line bg-white shadow-card', className)}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export const CardBody = ({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) => <div className={cn('p-5', className)}>{children}</div>

/* ------------------------------------------------------------ Formulário */

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      )}
    </label>
  )
}

export const Input = ({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => (
  <input className={cn('ng-field', invalid && 'ng-field-error', className)} {...rest} />
)

export const Textarea = ({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn('ng-field min-h-[88px] resize-y', className)} {...rest} />
)

export const Select = ({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn('ng-field appearance-none pr-9', className)} {...rest}>
    {children}
  </select>
)

export function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong
                   text-brand-600 accent-brand-600 focus:ring-brand-500"
      />
      <span className="min-w-0">
        <span className="block text-[15px] leading-snug">{label}</span>
        {description && (
          <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
        )}
      </span>
    </label>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span className="text-[15px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-brand-600' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </label>
  )
}

/* ----------------------------------------------------------- Indicadores */

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent'

const TONES: Record<Tone, string> = {
  neutral: 'bg-canvas text-ink-soft border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-red-50 text-red-700 border-red-100',
  accent: 'bg-orange-50 text-orange-700 border-orange-100',
}

export const Badge = ({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
)

export const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn('animate-spin', className ?? 'h-6 w-6')} viewBox="0 0 24 24" aria-hidden>
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6z" />
  </svg>
)

export const Loading = ({ label = 'Carregando…' }: { label?: string }) => (
  <div className="flex flex-col items-center gap-3 py-16 text-ink-muted">
    <Spinner className="h-7 w-7 text-brand-600" />
    <p className="text-sm">{label}</p>
  </div>
)

export function Alert({
  tone = 'danger',
  title,
  children,
}: {
  tone?: 'danger' | 'warning' | 'success' | 'brand'
  title?: string
  children?: ReactNode
}) {
  const tones = {
    danger: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    brand: 'bg-brand-50 text-brand-800 border-brand-200',
  }
  return (
    <div className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', tones[tone])}>
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export const Stat = ({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand'
}) => {
  const colors = {
    neutral: 'text-ink',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    brand: 'text-brand-600',
  }
  return (
    <div className="rounded-card border border-line bg-white px-4 py-3">
      <div className={cn('text-xl font-semibold tabular-nums', colors[tone])}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </div>
  )
}
