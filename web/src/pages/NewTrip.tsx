import { useState } from 'react'
import { useHistory } from 'react-router-dom'

import { AppLayout, PageHeader, Steps } from '../components/Layout'
import { ArrowRight, Check, Sparkles } from '../components/icons'
import {
  Alert,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Spinner,
  Toggle,
} from '../components/ui'
import { ApiError } from '../lib/api/client'
import {
  type AssistantResult,
  TRIP_TYPES,
  type TripType,
  createTrip,
  runAssistant,
} from '../lib/api/trips'

const PERGUNTAS = [
  { chave: 'has_lodging', texto: 'Haverá hospedagem?' },
  { chave: 'has_meals', texto: 'Haverá alimentação inclusa?' },
  { chave: 'has_chartered_transport', texto: 'O transporte será fretado?' },
  { chave: 'has_rooms', texto: 'Vai dividir quartos?' },
  { chave: 'has_groups', texto: 'Vai dividir o grupo em equipes?' },
  { chave: 'has_capacity_limit', texto: 'Existe limite de vagas?' },
] as const

type Respostas = Record<(typeof PERGUNTAS)[number]['chave'], boolean>

const ETAPAS = ['Sobre a viagem', 'Assistente', 'Pronto']

export default function NewTrip() {
  const history = useHistory()
  const [etapa, setEtapa] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [type, setType] = useState<TripType>('church')
  const [startDate, setStartDate] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [capacity, setCapacity] = useState('')

  const [respostas, setRespostas] = useState<Respostas>({
    has_lodging: false,
    has_meals: false,
    has_chartered_transport: false,
    has_rooms: false,
    has_groups: false,
    has_capacity_limit: false,
  })
  const [margem, setMargem] = useState('10')

  const [resultado, setResultado] = useState<AssistantResult | null>(null)
  const [tripId, setTripId] = useState<number | null>(null)

  const podeAvancar = name.trim().length > 1 && destination.trim().length > 1

  async function concluir() {
    setErro(null)
    setAviso(null)
    setSalvando(true)
    setEtapa(2)
    try {
      const trip = await createTrip({
        name: name.trim(),
        destination: destination.trim(),
        type,
        start_date: startDate || null,
        duration_days: durationDays ? Number(durationDays) : null,
        capacity: capacity ? Number(capacity) : null,
        config: { ...respostas, safety_margin_percent: margem || '0' },
      })
      setTripId(trip.id)

      // O assistente é um bônus: se a IA falhar, a viagem já está criada.
      try {
        setResultado(await runAssistant(trip.id))
      } catch (e) {
        setAviso(
          e instanceof ApiError
            ? `A viagem foi criada, mas o assistente falhou: ${e.firstMessage}`
            : 'A viagem foi criada, mas não consegui gerar o checklist agora.',
        )
      }
    } catch (e) {
      setErro(e instanceof ApiError ? e.firstMessage : 'Não foi possível criar a viagem.')
      setEtapa(1)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Nova viagem" backTo="/app" />
      <Steps steps={ETAPAS} current={etapa} />

      {erro && (
        <div className="mb-5">
          <Alert>{erro}</Alert>
        </div>
      )}

      {/* Etapa 1 — dados básicos */}
      {etapa === 0 && (
        <Card>
          <CardBody className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Sobre a viagem</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Só o básico por enquanto — dá para ajustar depois.
              </p>
            </div>

            <Field label="Nome da viagem" required>
              <Input
                placeholder="Ex.: Retiro de Carnaval 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Destino" required>
              <Input
                placeholder="Ex.: Campos do Jordão, SP"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </Field>

            <Field label="Tipo de viagem" hint="Define os documentos que serão exigidos.">
              <Select value={type} onChange={(e) => setType(e.target.value as TripType)}>
                {TRIP_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Data de início">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label="Duração (dias)">
                <Input
                  type="number"
                  min={1}
                  placeholder="3"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </Field>
              <Field label="Vagas">
                <Input
                  type="number"
                  min={1}
                  placeholder="40"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex justify-end pt-1">
              <Button disabled={!podeAvancar} onClick={() => setEtapa(1)}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Etapa 2 — perguntas do assistente */}
      {etapa === 1 && (
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Assistente</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Responda e eu monto a estrutura e o checklist da viagem.
                </p>
              </div>
            </div>

            <div className="divide-y divide-line rounded-lg border border-line px-4">
              {PERGUNTAS.map((p) => (
                <div key={p.chave} className="py-3">
                  <Toggle
                    label={p.texto}
                    checked={respostas[p.chave]}
                    onChange={(v) => setRespostas((r) => ({ ...r, [p.chave]: v }))}
                  />
                </div>
              ))}
            </div>

            <Field
              label="Margem de segurança (%)"
              hint="Uma folga somada ao valor por participante, para imprevistos."
            >
              <Input
                type="number"
                min={0}
                max={100}
                value={margem}
                onChange={(e) => setMargem(e.target.value)}
              />
            </Field>

            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setEtapa(0)}>
                Voltar
              </Button>
              <Button onClick={concluir} loading={salvando}>
                Criar viagem
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Etapa 3 — resultado */}
      {etapa === 2 && (
        <Card>
          <CardBody>
            {salvando ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <Spinner className="h-8 w-8 text-brand-600" />
                <p className="font-medium">Montando a estrutura da viagem…</p>
                <p className="text-sm text-ink-muted">Isso leva alguns segundos.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold">Viagem criada!</h2>
                  <p className="mt-1.5 text-ink-muted">
                    {resultado
                      ? `O assistente preparou ${resultado.tasks_created} tarefa(s) para você.`
                      : 'Agora é só lançar os custos e publicar.'}
                  </p>
                </div>

                {aviso && (
                  <div className="mb-5">
                    <Alert tone="warning">{aviso}</Alert>
                  </div>
                )}

                {resultado && resultado.checklist.length > 0 && (
                  <div className="rounded-lg border border-line bg-canvas p-4">
                    {resultado.notes && (
                      <p className="mb-3 text-sm text-ink-soft">{resultado.notes}</p>
                    )}
                    <ul className="space-y-2">
                      {resultado.checklist.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-[15px]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                            <Check className="h-3 w-3" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tripId && (
                  <Button
                    block
                    size="lg"
                    className="mt-6"
                    onClick={() => history.replace(`/app/viagens/${tripId}`)}
                  >
                    Continuar: lançar os custos <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}
    </AppLayout>
  )
}
