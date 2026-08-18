import { useCallback, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { AppLayout, PageHeader } from '../components/Layout'
import { Check, Copy, Plus, Share, Sparkles, Trash, Users } from '../components/icons'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  LinkButton,
  Loading,
  Select,
} from '../components/ui'
import { brl, cn } from '../lib/format'
import { ApiError } from '../lib/api/client'
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
  type BudgetItem,
  type CostType,
  type Pricing,
  type Task,
  type Trip,
  createBudgetItem,
  deleteBudgetItem,
  getPricing,
  getTrip,
  listBudgetItems,
  listTasks,
  publishTrip,
  runAssistant,
  toggleTask,
} from '../lib/api/trips'

type Aba = 'checklist' | 'orcamento'

export default function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const tripId = Number(id)
  const history = useHistory()

  const [aba, setAba] = useState<Aba>('orcamento')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [itens, setItens] = useState<BudgetItem[]>([])
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aviso, setAviso] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const [categoria, setCategoria] = useState<BudgetCategory>('transport')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipoCusto, setTipoCusto] = useState<CostType>('fixed')

  const carregar = useCallback(async () => {
    try {
      const [t, tk, bi, pr] = await Promise.all([
        getTrip(tripId),
        listTasks(tripId),
        listBudgetItems(tripId),
        getPricing(tripId),
      ])
      setTrip(t)
      setTasks(tk)
      setItens(bi)
      setPricing(pr)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        history.replace('/login')
        return
      }
      setAviso('Não foi possível carregar a viagem.')
    } finally {
      setCarregando(false)
    }
  }, [tripId, history])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const publicada = trip?.status === 'published'
  const linkPublico = trip ? `${window.location.origin}/trip/${trip.slug}` : ''

  async function adicionarItem() {
    if (!valor) return
    const criado = await createBudgetItem({
      trip: tripId,
      category: categoria,
      description: descricao,
      amount: valor,
      cost_type: tipoCusto,
    })
    setItens((l) => [...l, criado])
    setValor('')
    setDescricao('')
    setPricing(await getPricing(tripId))
  }

  async function removerItem(itemId: number) {
    await deleteBudgetItem(itemId)
    setItens((l) => l.filter((i) => i.id !== itemId))
    setPricing(await getPricing(tripId))
  }

  async function gerarChecklist() {
    setAviso(null)
    try {
      await runAssistant(tripId)
      setTasks(await listTasks(tripId))
    } catch (e) {
      setAviso(
        e instanceof ApiError && e.status === 503
          ? 'O assistente está indisponível. Você pode adicionar tarefas manualmente depois.'
          : 'Não consegui gerar o checklist agora.',
      )
    }
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(linkPublico)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (carregando) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    )
  }

  const semCustos = itens.length === 0
  const feitas = tasks.filter((t) => t.done).length

  return (
    <AppLayout>
      <PageHeader
        title={trip?.name ?? 'Viagem'}
        subtitle={trip?.destination}
        backTo="/app"
        actions={
          publicada ? (
            <LinkButton to={`/app/viagens/${tripId}/participantes`} variant="secondary">
              <Users className="h-4 w-4" /> Participantes
            </LinkButton>
          ) : undefined
        }
      />

      {aviso && (
        <div className="mb-5">
          <Alert tone="warning">{aviso}</Alert>
        </div>
      )}

      {/* Valor por pessoa + próximo passo */}
      <Card className="mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-600 px-5 py-5 text-white">
          <div>
            <div className="text-sm text-brand-50">Valor por participante</div>
            <div className="mt-0.5 text-3xl font-semibold tabular-nums">
              {brl(pricing?.price_per_participant ?? 0)}
            </div>
          </div>
          <div className="text-right text-sm text-brand-50">
            <div>
              Base de {pricing?.participants ?? 0} pessoa(s)
              {pricing && Number(pricing.safety_margin_percent) > 0 &&
                ` · margem ${Number(pricing.safety_margin_percent)}%`}
            </div>
            <div className="mt-0.5">Total estimado {brl(pricing?.estimated_total ?? 0)}</div>
          </div>
        </div>

        <CardBody className="bg-canvas">
          {semCustos ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px]">
                <strong>Próximo passo:</strong> lance os custos da viagem para calcular
                quanto cada pessoa paga.
              </p>
              <Button size="sm" onClick={() => setAba('orcamento')}>
                Lançar custos
              </Button>
            </div>
          ) : !publicada ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px]">
                <strong>Próximo passo:</strong> publique a viagem para gerar o link de
                inscrição.
              </p>
              <Button
                size="sm"
                onClick={async () => setTrip(await publishTrip(tripId))}
              >
                <Share className="h-4 w-4" /> Publicar viagem
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[15px]">
                <strong>Compartilhe este link</strong> com o grupo — cada pessoa se
                inscreve sozinha.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft">
                  {linkPublico}
                </code>
                <Button size="sm" variant="secondary" onClick={copiarLink}>
                  <Copy className="h-4 w-4" />
                  {copiado ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Abas */}
      <div className="mb-5 inline-flex rounded-lg border border-line bg-white p-1">
        {(
          [
            ['orcamento', 'Orçamento'],
            ['checklist', `Checklist${tasks.length ? ` (${feitas}/${tasks.length})` : ''}`],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setAba(v)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition',
              aba === v ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-black/5',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === 'orcamento' && (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Custos da viagem"
              subtitle="Custos fixos são divididos entre todos; custos por pessoa são multiplicados."
            />
            {itens.length === 0 ? (
              <CardBody>
                <p className="text-[15px] text-ink-muted">
                  Nenhum custo lançado ainda. Comece pelo transporte ou pela hospedagem.
                </p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-line">
                {itens.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {BUDGET_CATEGORIES.find((c) => c.value === item.category)?.label}
                      </div>
                      <div className="mt-0.5 text-sm text-ink-muted">
                        {item.description || 'Sem descrição'} ·{' '}
                        {item.cost_type === 'fixed' ? 'fixo (rateado)' : 'por pessoa'}
                      </div>
                    </div>
                    <span className="font-medium tabular-nums">{brl(item.amount)}</span>
                    <button
                      onClick={() => removerItem(item.id)}
                      className="rounded-lg p-2 text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remover ${item.description || 'custo'}`}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Adicionar custo" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoria">
                  <Select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as BudgetCategory)}
                  >
                    {BUDGET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tipo de custo">
                  <Select
                    value={tipoCusto}
                    onChange={(e) => setTipoCusto(e.target.value as CostType)}
                  >
                    <option value="fixed">Fixo — dividido entre todos</option>
                    <option value="per_person">Por pessoa</option>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Descrição">
                  <Input
                    placeholder="Ex.: Ônibus ida e volta"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </Field>
                <Field label="Valor (R$)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </Field>
              </div>
              <Button onClick={adicionarItem} disabled={!valor}>
                <Plus className="h-4 w-4" /> Adicionar custo
              </Button>
            </CardBody>
          </Card>

          {pricing && itens.length > 0 && (
            <Card>
              <CardBody className="space-y-2.5 text-[15px]">
                {[
                  ['Custos fixos (rateados)', pricing.total_fixed],
                  ['Custos por pessoa', pricing.total_per_person],
                ].map(([label, v]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-ink-soft">{label}</span>
                    <span className="tabular-nums">{brl(v as string)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-2.5 text-lg font-semibold">
                  <span>Valor por participante</span>
                  <span className="tabular-nums text-brand-600">
                    {brl(pricing.price_per_participant)}
                  </span>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {aba === 'checklist' && (
        <Card>
          <CardHeader
            title="Checklist da viagem"
            subtitle={tasks.length ? `${feitas} de ${tasks.length} concluídas` : undefined}
            action={
              <Button size="sm" variant="secondary" onClick={gerarChecklist}>
                <Sparkles className="h-4 w-4" /> Gerar com IA
              </Button>
            }
          />
          {tasks.length === 0 ? (
            <CardBody>
              <p className="text-[15px] text-ink-muted">
                Nenhuma tarefa ainda. Use o assistente para montar o checklist da viagem.
              </p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 px-5 py-3.5">
                  <button
                    onClick={async () => {
                      const nova = await toggleTask(task)
                      setTasks((l) => l.map((t) => (t.id === task.id ? nova : t)))
                    }}
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition',
                      task.done
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-line-strong hover:border-brand-500',
                    )}
                    aria-label={task.done ? 'Desmarcar tarefa' : 'Concluir tarefa'}
                  >
                    {task.done && <Check className="h-4 w-4" />}
                  </button>
                  <span
                    className={cn(
                      'min-w-0 flex-1 text-[15px]',
                      task.done && 'text-ink-muted line-through',
                    )}
                  >
                    {task.title}
                  </span>
                  {task.source === 'ai' && <Badge tone="brand">IA</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </AppLayout>
  )
}
