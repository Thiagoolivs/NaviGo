import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonBadge,
  IonButtons,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router'

import {
  type Payment,
  type PaymentSituation,
  type RosterRow,
  type RosterSummary,
  SITUATION_COLOR,
  SITUATION_LABEL,
  getRoster,
  listPayments,
  payInstallment,
  replanPayment,
  setRequirementDelivered,
  unpayInstallment,
} from '../lib/api/roster'
import './Roster.css'

const brl = (v: string | number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const data = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR')

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

function Resumo({ s }: { s: RosterSummary }) {
  const cartoes = [
    { rotulo: 'Inscritos', valor: String(s.participants), cor: '' },
    { rotulo: 'Pagos', valor: String(s.paid), cor: 'success' },
    { rotulo: 'A pagar', valor: String(s.to_pay + s.partial), cor: 'warning' },
    { rotulo: 'Atrasados', valor: String(s.overdue), cor: 'danger' },
    { rotulo: 'Falta documento', valor: String(s.pending_requirements), cor: 'danger' },
    { rotulo: 'Menores', valor: String(s.minors), cor: '' },
  ]
  return (
    <>
      <div className="resumo-grid">
        {cartoes.map((c) => (
          <div className="resumo-card" key={c.rotulo}>
            <div className={`resumo-valor ${c.cor ? `ion-color-${c.cor}` : ''}`}>{c.valor}</div>
            <div className="resumo-rotulo">{c.rotulo}</div>
          </div>
        ))}
      </div>
      <div className="resumo-grid">
        <div className="resumo-card">
          <div className="resumo-valor">{brl(s.total_received)}</div>
          <div className="resumo-rotulo">Recebido</div>
        </div>
        <div className="resumo-card">
          <div className="resumo-valor">{brl(s.total_remaining)}</div>
          <div className="resumo-rotulo">A receber</div>
        </div>
        <div className="resumo-card">
          <div className="resumo-valor">{brl(s.total_expected)}</div>
          <div className="resumo-rotulo">Total esperado</div>
        </div>
      </div>
    </>
  )
}

export default function Roster() {
  const { id } = useParams<{ id: string }>()
  const tripId = Number(id)

  const [summary, setSummary] = useState<RosterSummary | null>(null)
  const [linhas, setLinhas] = useState<RosterRow[]>([])
  const [pagamentos, setPagamentos] = useState<Payment[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const carregar = useCallback(async () => {
    const [roster, pgtos] = await Promise.all([getRoster(tripId), listPayments(tripId)])
    setSummary(roster.summary)
    setLinhas(roster.participants)
    setPagamentos(pgtos)
    setCarregando(false)
  }, [tripId])

  useIonViewWillEnter(() => {
    void carregar()
  })

  const pagamentoDe = (participanteId: number) =>
    pagamentos.find((p) => p.participant === participanteId)

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

  async function alternarParcela(parcelaId: number, paga: boolean) {
    await (paga ? unpayInstallment(parcelaId) : payInstallment(parcelaId))
    await carregar()
  }

  async function alternarRequisito(statusId: number, entregue: boolean) {
    await setRequirementDelivered(statusId, !entregue)
    await carregar()
  }

  async function reparcelar(pagamentoId: number, parcelas: number) {
    await replanPayment(pagamentoId, parcelas)
    await carregar()
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/trips/${tripId}`} />
          </IonButtons>
          <IonTitle>Gestão da viagem</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {carregando ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : (
          <>
            {summary && <Resumo s={summary} />}

            <IonSearchbar
              placeholder="Buscar por nome ou e-mail"
              value={busca}
              onIonInput={(e) => setBusca(e.detail.value ?? '')}
            />

            <div className="filtros">
              {FILTROS.map((f) => (
                <IonChip
                  key={f.valor}
                  color={filtro === f.valor ? 'primary' : undefined}
                  outline={filtro !== f.valor}
                  onClick={() => setFiltro(f.valor)}
                >
                  {f.rotulo}
                </IonChip>
              ))}
            </div>

            {visiveis.length === 0 ? (
              <div className="ion-padding ion-text-center">
                <IonText color="medium">
                  <p>Nenhum participante neste filtro.</p>
                </IonText>
              </div>
            ) : (
              <IonAccordionGroup>
                {visiveis.map((l) => {
                  const pgto = pagamentoDe(l.id)
                  return (
                    <IonAccordion key={l.id} value={String(l.id)}>
                      <IonItem slot="header">
                        <IonLabel>
                          <h2>
                            {l.name}
                            {l.is_minor && (
                              <IonBadge color="tertiary" className="badge-inline">
                                menor
                              </IonBadge>
                            )}
                          </h2>
                          <p>
                            {brl(l.payment.paid)} de {brl(l.payment.total)}
                            {l.payment.installments_count > 0 &&
                              ` · ${l.payment.installments_paid}/${l.payment.installments_count} parcelas`}
                          </p>
                          {!l.requirements.all_required_delivered && (
                            <IonNote color="danger">
                              falta: {l.requirements.required_pending.join(', ')}
                            </IonNote>
                          )}
                        </IonLabel>
                        <IonBadge slot="end" color={SITUATION_COLOR[l.payment.situation]}>
                          {SITUATION_LABEL[l.payment.situation]}
                        </IonBadge>
                      </IonItem>

                      <div slot="content" className="detalhe">
                        {/* Contato e logística */}
                        <IonList lines="none">
                          {l.phone && (
                            <IonItem>
                              <IonLabel>Telefone</IonLabel>
                              <IonNote slot="end">{l.phone}</IonNote>
                            </IonItem>
                          )}
                          {l.is_minor && l.guardian_name && (
                            <IonItem>
                              <IonLabel>Responsável</IonLabel>
                              <IonNote slot="end">
                                {l.guardian_name} {l.guardian_phone && `· ${l.guardian_phone}`}
                              </IonNote>
                            </IonItem>
                          )}
                          {l.boarding_point && (
                            <IonItem>
                              <IonLabel>Embarque</IonLabel>
                              <IonNote slot="end">{l.boarding_point}</IonNote>
                            </IonItem>
                          )}
                          {l.shirt_size && (
                            <IonItem>
                              <IonLabel>Camiseta</IonLabel>
                              <IonNote slot="end">{l.shirt_size}</IonNote>
                            </IonItem>
                          )}
                          {l.dietary_restrictions && (
                            <IonItem>
                              <IonLabel className="ion-text-wrap">Restrição alimentar</IonLabel>
                              <IonNote slot="end">{l.dietary_restrictions}</IonNote>
                            </IonItem>
                          )}
                          {l.medical_notes && (
                            <IonItem>
                              <IonLabel className="ion-text-wrap">
                                Observações médicas
                                <p>{l.medical_notes}</p>
                              </IonLabel>
                            </IonItem>
                          )}
                        </IonList>

                        {/* Documentos / autorizações */}
                        {l.requirements.items.length > 0 && (
                          <IonList>
                            <IonItem lines="none">
                              <IonLabel>
                                <strong>Documentos</strong>
                              </IonLabel>
                              <IonNote slot="end">
                                {l.requirements.delivered}/{l.requirements.total}
                              </IonNote>
                            </IonItem>
                            {l.requirements.items.map((r) => (
                              <IonItem key={r.id}>
                                <IonCheckbox
                                  checked={r.delivered}
                                  onIonChange={() => alternarRequisito(r.id, r.delivered)}
                                  labelPlacement="end"
                                  justify="start"
                                >
                                  <span className="ion-text-wrap">
                                    {r.name}
                                    {r.required && <span className="obrigatorio"> *</span>}
                                  </span>
                                </IonCheckbox>
                              </IonItem>
                            ))}
                          </IonList>
                        )}

                        {/* Parcelas */}
                        {pgto && (
                          <IonList>
                            <IonItem lines="none">
                              <IonLabel>
                                <strong>Parcelas</strong>
                              </IonLabel>
                              <IonSelect
                                slot="end"
                                interface="popover"
                                placeholder="Reparcelar"
                                onIonChange={(e) => reparcelar(pgto.id, Number(e.detail.value))}
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                                  <IonSelectOption key={n} value={n}>
                                    {n === 1 ? 'À vista' : `${n}x`}
                                  </IonSelectOption>
                                ))}
                              </IonSelect>
                            </IonItem>
                            {pgto.installments.map((p, i) => (
                              <IonItem key={p.id}>
                                <IonCheckbox
                                  checked={p.status === 'paid'}
                                  onIonChange={() =>
                                    alternarParcela(p.id, p.status === 'paid')
                                  }
                                  labelPlacement="end"
                                  justify="start"
                                >
                                  <span>
                                    {i + 1}ª · {brl(p.amount)}
                                  </span>
                                </IonCheckbox>
                                <IonNote slot="end">vence {data(p.due_date)}</IonNote>
                              </IonItem>
                            ))}
                          </IonList>
                        )}
                      </div>
                    </IonAccordion>
                  )
                })}
              </IonAccordionGroup>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
