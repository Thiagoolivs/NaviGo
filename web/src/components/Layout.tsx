import type { ReactNode } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'

import { ArrowLeft, Compass, Logout, QrCode } from './icons'
import {
  Button,
} from './ui'
import { cn } from '../lib/format'

/** Marca do NaviGo — usada no cabeçalho e na landing. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Compass className="h-5 w-5" />
      </span>
      <span className="text-[17px]">NaviGo</span>
    </span>
  )
}

/** Casca das telas do organizador: cabeçalho fixo + conteúdo centralizado. */
export function AppLayout({
  children,
  onLogout,
  wide,
}: {
  children: ReactNode
  onLogout?: () => void
  wide?: boolean
}) {
  const { pathname } = useLocation()
  const links = [
    { to: '/app', label: 'Minhas viagens' },
    { to: '/pix-account', label: 'Recebimento' },
  ]

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link to="/app" aria-label="NaviGo — início">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  pathname.startsWith(l.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-soft hover:bg-black/5 hover:text-ink',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/pix-account"
              className="rounded-lg p-2 text-ink-soft transition hover:bg-black/5 hover:text-ink sm:hidden"
              aria-label="Recebimento"
            >
              <QrCode />
            </Link>
            {onLogout && (
              <button
                onClick={onLogout}
                className="rounded-lg p-2 text-ink-soft transition hover:bg-black/5 hover:text-ink"
                aria-label="Sair"
              >
                <Logout />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={cn('mx-auto px-4 py-7', wide ? 'max-w-6xl' : 'max-w-3xl')}>
        {children}
      </main>
    </div>
  )
}

/** Casca das telas públicas (participante) — sem navegação do organizador. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-7">{children}</main>
      <footer className="mx-auto max-w-2xl px-4 pb-10 text-center text-xs text-ink-muted">
        Organizado com NaviGo
      </footer>
    </div>
  )
}

/** Título de página com voltar opcional e ações à direita. */
export function PageHeader({
  title,
  subtitle,
  backTo,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  backTo?: string
  actions?: ReactNode
}) {
  const history = useHistory()
  return (
    <div className="mb-6">
      {backTo && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2"
          onClick={() => history.push(backTo)}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** Passos numerados — deixa o fluxo explícito para quem nunca usou. */
export function Steps({
  steps,
  current,
}: {
  steps: string[]
  current: number
}) {
  return (
    <ol className="mb-7 flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  done && 'bg-brand-600 text-white',
                  active && 'bg-brand-600 text-white ring-4 ring-brand-500/15',
                  !done && !active && 'bg-line text-ink-muted',
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'hidden truncate text-sm sm:block',
                  active ? 'font-medium text-ink' : 'text-ink-muted',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn('h-px flex-1', done ? 'bg-brand-500' : 'bg-line')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
