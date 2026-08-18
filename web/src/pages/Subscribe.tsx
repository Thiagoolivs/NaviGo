import { type FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PublicLayout } from '../components/Layout'
import { Check, Doc } from '../components/icons'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Field,
  Input,
  Loading,
  Select,
  Textarea,
  Toggle,
} from '../components/ui'
import { brl, formatDate } from '../lib/format'
import { ApiError, api } from '../lib/api/client'
import { type EnrollmentResult, enroll } from '../lib/api/roster'

interface PublicTripData {
  name: string
  destination: string
  spots_left: number | null
}

const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

export default function Subscribe() {
  const { slug } = useParams<{ slug: string }>()

  const [trip, setTrip] = useState<PublicTripData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<EnrollmentResult | null>(null)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [documento, setDocumento] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [menor, setMenor] = useState(false)
  const [responsavel, setResponsavel] = useState('')
  const [telResponsavel, setTelResponsavel] = useState('')
  const [emergencia, setEmergencia] = useState('')
  const [plano, setPlano] = useState('')
  const [restricao, setRestricao] = useState('')
  const [medico, setMedico] = useState('')
  const [camiseta, setCamiseta] = useState('')
  const [embarque, setEmbarque] = useState('')
  const [obs, setObs] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [aceite, setAceite] = useState(false)

  useEffect(() => {
    api
      .get<PublicTripData>(`/public/trips/${slug}/`)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setCarregando(false))
  }, [slug])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      setResultado(
        await enroll(slug, {
          name: nome.trim(),
          email,
          phone: telefone,
          document: documento,
          birth_date: nascimento || null,
          is_minor: menor,
          guardian_name: responsavel,
          guardian_phone: telResponsavel,
          emergency_contact: emergencia,
          health_insurance: plano,
          dietary_restrictions: restricao,
          medical_notes: medico,
          shirt_size: camiseta,
          boarding_point: embarque,
          notes: obs,
          consent_accepted: aceite,
          installments: parcelas,
        }),
      )
      window.scrollTo({ top: 0 })
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.status === 409
            ? 'As vagas para esta viagem acabaram.'
            : err.firstMessage
          : 'Não foi possível concluir a inscrição.',
      )
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <PublicLayout>
        <Loading />
      </PublicLayout>
    )
  }

  if (!trip) {
    return (
      <PublicLayout>
        <Card>
          <CardBody className="py-12 text-center">
            <h1 className="text-xl font-semibold">Viagem não encontrada</h1>
          </CardBody>
        </Card>
      </PublicLayout>
    )
  }

  /* ------------------------------------------------ Confirmação */
  if (resultado) {
    return (
      <PublicLayout>
        <Card>
          <CardBody className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold">
                Inscrição confirmada, {resultado.name.split(' ')[0]}!
              </h1>
              <p className="mt-2 text-ink-muted">{resultado.trip}</p>
            </div>

            <div className="rounded-card border border-line bg-canvas p-5 text-center">
              <div className="text-sm text-ink-muted">Valor total</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums text-brand-600">
                {brl(resultado.total_amount)}
              </div>
            </div>

            {resultado.installments.length > 0 && (
              <div>
                <h2 className="mb-2 font-semibold">
                  {resultado.installments.length === 1
                    ? 'Pagamento à vista'
                    : `Em ${resultado.installments.length} parcelas`}
                </h2>
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {resultado.installments.map((p, i) => (
                    <li
                      key={`${p.due_date}-${i}`}
                      className="flex items-center justify-between px-4 py-3 text-[15px]"
                    >
                      <span className="text-ink-soft">
                        {resultado.installments.length > 1 ? `${i + 1}ª parcela` : 'Valor'}
                      </span>
                      <span className="text-right">
                        <span className="font-medium tabular-nums">{brl(p.amount)}</span>
                        <span className="ml-2 text-sm text-ink-muted">
                          vence {formatDate(p.due_date)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultado.requirements.length > 0 && (
              <div>
                <h2 className="mb-2 flex items-center gap-2 font-semibold">
                  <Doc className="h-4 w-4 text-brand-600" />
                  O que você precisa entregar
                </h2>
                <ul className="space-y-2 rounded-lg border border-line bg-canvas p-4">
                  {resultado.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-[15px]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link to={`/trip/${slug}/pagamento`}>
              <Button block size="lg">
                Ver como pagar
              </Button>
            </Link>
          </CardBody>
        </Card>
      </PublicLayout>
    )
  }

  /* ------------------------------------------------ Formulário */
  return (
    <PublicLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Inscrição</h1>
        <p className="mt-1 text-ink-muted">
          {trip.name} · {trip.destination}
          {trip.spots_left !== null && ` · ${trip.spots_left} vaga(s)`}
        </p>
      </div>

      {erro && (
        <div className="mb-5">
          <Alert>{erro}</Alert>
        </div>
      )}

      <form onSubmit={enviar} className="space-y-5">
        <Card>
          <CardHeader title="Seus dados" />
          <CardBody className="space-y-4">
            <Field label="Nome completo" required>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail">
                <Input
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Telefone / WhatsApp">
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </Field>
              <Field label="CPF ou RG">
                <Input value={documento} onChange={(e) => setDocumento(e.target.value)} />
              </Field>
              <Field label="Data de nascimento">
                <Input
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <Toggle checked={menor} onChange={setMenor} label="Sou menor de 18 anos" />
            {menor && (
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm text-amber-900">
                  Menores precisam entregar a autorização assinada pelo responsável.
                </p>
                <Field label="Nome do responsável" required>
                  <Input
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    required={menor}
                  />
                </Field>
                <Field label="Telefone do responsável">
                  <Input
                    type="tel"
                    value={telResponsavel}
                    onChange={(e) => setTelResponsavel(e.target.value)}
                  />
                </Field>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Saúde e logística"
            subtitle="Ajuda quem organiza a cuidar melhor de você na viagem."
          />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contato de emergência">
                <Input
                  placeholder="Nome e telefone"
                  value={emergencia}
                  onChange={(e) => setEmergencia(e.target.value)}
                />
              </Field>
              <Field label="Plano de saúde">
                <Input value={plano} onChange={(e) => setPlano(e.target.value)} />
              </Field>
              <Field label="Restrição alimentar">
                <Input
                  placeholder="Ex.: intolerância a lactose"
                  value={restricao}
                  onChange={(e) => setRestricao(e.target.value)}
                />
              </Field>
              <Field label="Tamanho de camiseta">
                <Select value={camiseta} onChange={(e) => setCamiseta(e.target.value)}>
                  <option value="">Selecione</option>
                  {TAMANHOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Medicamentos ou observações médicas">
              <Textarea value={medico} onChange={(e) => setMedico(e.target.value)} />
            </Field>
            <Field label="Ponto de embarque">
              <Input value={embarque} onChange={(e) => setEmbarque(e.target.value)} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pagamento" />
          <CardBody className="space-y-4">
            <Field
              label="Como você quer pagar?"
              hint="As parcelas vencem a cada 30 dias, a partir de hoje."
            >
              <Select
                value={parcelas}
                onChange={(e) => setParcelas(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? 'À vista' : `Em ${n}x`}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Observações para quem organiza">
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Checkbox
              checked={aceite}
              onChange={setAceite}
              label="Autorizo o uso dos meus dados para a organização desta viagem."
              description="Seus dados são usados apenas por quem organiza, para esta viagem."
            />
          </CardBody>
        </Card>

        <Button
          type="submit"
          block
          size="lg"
          loading={enviando}
          disabled={!aceite || nome.trim().length < 2}
        >
          {enviando ? 'Enviando…' : 'Confirmar inscrição'}
        </Button>
      </form>
    </PublicLayout>
  )
}
