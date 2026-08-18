import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { AppLayout, PageHeader } from '../components/Layout'
import { Check, ChevronDown, Doc, Search, Users } from '../components/icons'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Loading,
  Select,
  Stat,
} from '../components/ui'
import { brl, cn, formatDate } from '../lib/format'
import { ApiError } from '../lib/api/client'
import {
  type Payment,
  type PaymentSituation,
  type RosterRow,
  type RosterSummary,
  SITUATION_LABEL,
  getRoster,
  listPayments,
  payInstallment,
  replanPayment,
  setRequirementDelivered,
  unpayInstallment,
} from '../lib/api/roster'

const TONE: Record<PaymentSituation, 'success' | 'warning' | 'neutral' | 'danger'> = {
  pago: 'success',
  parcial: 'warning',
  a_pagar: 'neutral',
  atrasado: 'danger',
  sem_cobranca: 'neutral',
}

type Filtro = 'todos' | PaymentSituation | 'pendencias' | 'menores'

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'pago', rotulo: 'Pagos' },
  { valor: 'parcial', rotulo: 'Parciais' },
  { valor: 'a_pagar', rotulo: 'A pagar' },
  { valor: 'atrasado', rotulo: 'Atrasados' },
  { valor: 'pendencias', rotulo: 'Falta documento' },
  { valor: 'menores', rotulo: 'Menores' },
]

export default function Roster() {
  const { id } = useParams<{ id: string }>()
  const tripId = Number(id)
  const history = useHistory()

  const [summary, setSummary] = useState<RosterSummary | null>(null)
  const [linhas, setLinhas] = useState<RosterRow[]>([])
  const [pagamentos, setPagamentos] = useState<Payment[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [aberto, setAberto] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    try {
      const [roster, pgtos] = await Promise.all([getRoster(tripId), listPayments(tripId)])
      setSummary(roster.summary)
      setLinhas(roster.participants)
      setPagamentos(pgtos)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        history.replace('/login')
        return
      }
      setErro('Não foi possível carregar os participantes.')
    } finally {
      setCarregando(false)
    }
  }, [tripId, history])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const pagamentoDe = (pid: number) => pagamentos.find((p) => p.participant === pid)

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return linhas.filter((l) => {
      if (termo && !l.name.toLowerCase().includes(termo) && !l.email.toLowerCase().includes(termo))
        return false
      if (filtro === 'todos') return true
      if (filtro === 'pendencias') return !l.requirements.all_required_delivered
      if (filtro === 'menores') return l.is_minor
      return l.payment.situation === filtro
    })
  }, [linhas, busca, filtro])

  if (carregando) {
    return (
      <AppLayout wide>
        <Loading />
      </AppLayout>
    )
  }

  return (
    <AppLayout wide>
      <PageHeader
        title="Participantes e pagamentos"
        subtitle="Quem pagou, quem está devendo e o que falta entregar."
        backTo={`/app/viagens/${tripId}`}
      />

      {erro && (
        <div className="mb-5">
          <Alert>{erro}</Alert>
        </div>
      )}

      {summary && linhas.length > 0 && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Inscritos" value={summary.participants} />
            <Stat label="Pagos" value={summary.paid} tone="success" />
            <Stat label="A pagar" value={summary.to_pay + summary.partial} tone="warning" />
            <Stat label="Atrasados" value={summary.overdue} tone="danger" />
            <Stat label="Falta documento" value={summary.pending_requirements} tone="danger" />
            <Stat label="Menores" value={summary.minors} />
          </div>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Já recebido" value={brl(summary.total_received)} tone="success" />
            <Stat label="A receber" value={brl(summary.total_remaining)} tone="warning" />
            <Stat label="Total esperado" value={brl(summary.total_expected)} tone="brand" />
          </div>
        </>
      )}

      {linhas.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Ninguém se inscreveu ainda"
          description="Compartilhe o link da viagem com o grupo. Cada pessoa se inscreve sozinha e aparece aqui."
          action={
            <Button variant="secondary" onClick={() => history.push(`/app/viagens/${tripId}`)}>
              Ver o link de inscrição
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome ou e-mail"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  onClick={() => setFiltro(f.valor)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    filtro === f.valor
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-white text-ink-soft hover:border-line-strong',
                  )}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>
          </div>

          {visiveis.length === 0 ? (
            <Card>
              <div className="px-5 py-12 text-center text-ink-muted">
                Nenhum participante neste filtro.
              </div>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {visiveis.map((l) => {
                const pgto = pagamentoDe(l.id)
                const expandido = aberto === l.id
                return (
                  <Card key={l.id}>
                    <button
                      onClick={() => setAberto(expandido ? null : l.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{l.name}</span>
                          {l.is_minor && <Badge tone="accent">menor</Badge>}
                        </div>
                        <div className="mt-1 text-sm text-ink-muted">
                          {brl(l.payment.paid)} de {brl(l.payment.total)}
                          {l.payment.installments_count > 0 &&
                            ` · ${l.payment.installments_paid}/${l.payment.installments_count} parcelas`}
                        </div>
                        {!l.requirements.all_required_delivered && (
                          <div className="mt-1 text-sm text-red-600">
                            Falta: {l.requirements.required_pending.join(', ')}
                          </div>
                        )}
                      </div>
                      <Badge tone={TONE[l.payment.situation]}>
                        {SITUATION_LABEL[l.payment.situation]}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-ink-muted transition',
                          expandido && 'rotate-180',
                        )}
                      />
                    </button>

                    {expandido && (
                      <div className="space-y-5 border-t border-line bg-canvas px-5 py-5">
                        {/* Contato e logística */}
                        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          {[
                            ['Telefone', l.phone],
                            ['E-mail', l.email],
                            [
                              'Responsável',
                              l.is_minor && l.guardian_name
                                ? `${l.guardian_name}${l.guardian_phone ? ` · ${l.guardian_phone}` : ''}`
                                : '',
                            ],
                            ['Embarque', l.boarding_point],
                            ['Camiseta', l.shirt_size],
                            ['Restrição alimentar', l.dietary_restrictions],
                            ['Observações médicas', l.medical_notes],
                          ]
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <div key={k as string} className="flex gap-2">
                                <dt className="shrink-0 text-ink-muted">{k}:</dt>
                                <dd className="min-w-0 break-words">{v}</dd>
                              </div>
                            ))}
                        </dl>

                        {/* Documentos */}
                        {l.requirements.items.length > 0 && (
                          <div>
                            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                              <Doc className="h-4 w-4 text-brand-600" />
                              Documentos ({l.requirements.delivered}/{l.requirements.total})
                            </h3>
                            <div className="space-y-1.5">
                              {l.requirements.items.map((r) => (
                                <label
                                  key={r.id}
                                  className="flex cursor-pointer items-center gap-2.5 text-[15px]"
                                >
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await setRequirementDelivered(r.id, !r.delivered)
                                      await carregar()
                                    }}
                                    className={cn(
                                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition',
                                      r.delivered
                                        ? 'border-brand-600 bg-brand-600 text-white'
                                        : 'border-line-strong bg-white hover:border-brand-500',
                                    )}
                                    aria-label={r.name}
                                  >
                                    {r.delivered && <Check className="h-3 w-3" />}
                                  </button>
                                  <span className={cn(r.delivered && 'text-ink-muted')}>
                                    {r.name}
                                    {r.required && <span className="text-red-500"> *</span>}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Parcelas */}
                        {pgto && (
                          <div>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold">Parcelas</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-ink-muted">Reparcelar:</span>
                                <Select
                                  className="h-9 w-28 py-1 text-sm"
                                  value=""
                                  onChange={async (e) => {
                                    if (!e.target.value) return
                                    await replanPayment(pgto.id, Number(e.target.value))
                                    await carregar()
                                  }}
                                >
                                  <option value="">Escolher</option>
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>
                                      {n === 1 ? 'À vista' : `${n}x`}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                            </div>
                            <div className="divide-y divide-line rounded-lg border border-line bg-white">
                              {pgto.installments.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                                  <button
                                    onClick={async () => {
                                      await (p.status === 'paid'
                                        ? unpayInstallment(p.id)
                                        : payInstallment(p.id))
                                      await carregar()
                                    }}
                                    className={cn(
                                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition',
                                      p.status === 'paid'
                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                        : 'border-line-strong hover:border-emerald-500',
                                    )}
                                    aria-label={
                                      p.status === 'paid' ? 'Desfazer baixa' : 'Marcar como paga'
                                    }
                                  >
                                    {p.status === 'paid' && <Check className="h-3 w-3" />}
                                  </button>
                                  <span className="text-[15px]">
                                    {i + 1}ª · <span className="tabular-nums">{brl(p.amount)}</span>
                                  </span>
                                  <span className="ml-auto text-sm text-ink-muted">
                                    vence {formatDate(p.due_date)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
