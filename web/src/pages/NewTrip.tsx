import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react'
import { useState } from 'react'

import { ApiError } from '../lib/api/client'
import {
  type AssistantResult,
  type NewTripInput,
  TRIP_TYPES,
  type TripType,
  createTrip,
  runAssistant,
} from '../lib/api/trips'

/** Perguntas do assistente — moldam a estrutura da viagem. */
const PERGUNTAS = [
  { chave: 'has_lodging', texto: 'Haverá hospedagem?' },
  { chave: 'has_meals', texto: 'Haverá alimentação?' },
  { chave: 'has_chartered_transport', texto: 'O transporte será fretado?' },
  { chave: 'has_rooms', texto: 'Haverá divisão de quartos?' },
  { chave: 'has_groups', texto: 'Haverá divisão em grupos?' },
  { chave: 'has_capacity_limit', texto: 'Existe limite de vagas?' },
] as const

type Respostas = Record<(typeof PERGUNTAS)[number]['chave'], boolean>

export default function NewTrip() {
  const router = useIonRouter()
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // etapa 1
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [type, setType] = useState<TripType>('church')
  const [startDate, setStartDate] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [capacity, setCapacity] = useState('')

  // etapa 2
  const [respostas, setRespostas] = useState<Respostas>({
    has_lodging: false,
    has_meals: false,
    has_chartered_transport: false,
    has_rooms: false,
    has_groups: false,
    has_capacity_limit: false,
  })
  const [margem, setMargem] = useState('10')

  // etapa 3
  const [resultado, setResultado] = useState<AssistantResult | null>(null)
  const [tripId, setTripId] = useState<number | null>(null)

  const etapa1Valida = name.trim().length > 1 && destination.trim().length > 1

  async function concluir() {
    setErro(null)
    setSalvando(true)
    setEtapa(3)
    try {
      const input: NewTripInput = {
        name: name.trim(),
        destination: destination.trim(),
        type,
        start_date: startDate || null,
        duration_days: durationDays ? Number(durationDays) : null,
        capacity: capacity ? Number(capacity) : null,
        config: { ...respostas, safety_margin_percent: margem || '0' },
      }
      const trip = await createTrip(input)
      setTripId(trip.id)

      // O assistente é um bônus: se a IA falhar, a viagem já está criada.
      try {
        setResultado(await runAssistant(trip.id))
      } catch (e) {
        setErro(
          e instanceof ApiError && e.status === 503
            ? 'A viagem foi criada, mas o assistente está indisponível (configure GEMINI_API_KEY).'
            : 'A viagem foi criada, mas não consegui gerar o checklist agora.',
        )
      }
    } catch (e) {
      setErro(e instanceof ApiError ? e.firstMessage : 'Não foi possível criar a viagem.')
      setEtapa(2)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Nova viagem</IonTitle>
        </IonToolbar>
        <IonProgressBar value={etapa / 3} />
      </IonHeader>

      <IonContent className="ion-padding">
        {erro && (
          <IonText color={tripId ? 'warning' : 'danger'}>
            <p>{erro}</p>
          </IonText>
        )}

        {etapa === 1 && (
          <>
            <IonText>
              <h2>Sobre a viagem</h2>
              <p>Comece com o básico — o assistente cuida do resto.</p>
            </IonText>
            <IonList inset>
              <IonItem>
                <IonInput
                  label="Nome da viagem"
                  labelPlacement="floating"
                  placeholder="Retiro de Carnaval"
                  value={name}
                  onIonInput={(e) => setName(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Destino"
                  labelPlacement="floating"
                  placeholder="Campos do Jordão"
                  value={destination}
                  onIonInput={(e) => setDestination(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Tipo"
                  labelPlacement="floating"
                  value={type}
                  onIonChange={(e) => setType(e.detail.value)}
                >
                  {TRIP_TYPES.map((o) => (
                    <IonSelectOption key={o.value} value={o.value}>
                      {o.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  type="date"
                  label="Data de início"
                  labelPlacement="floating"
                  value={startDate}
                  onIonInput={(e) => setStartDate(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  type="number"
                  label="Duração (dias)"
                  labelPlacement="floating"
                  value={durationDays}
                  onIonInput={(e) => setDurationDays(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  type="number"
                  label="Quantidade de participantes"
                  labelPlacement="floating"
                  value={capacity}
                  onIonInput={(e) => setCapacity(e.detail.value ?? '')}
                />
              </IonItem>
            </IonList>
            <IonButton expand="block" disabled={!etapa1Valida} onClick={() => setEtapa(2)}>
              Continuar
            </IonButton>
          </>
        )}

        {etapa === 2 && (
          <>
            <IonText>
              <h2>Assistente</h2>
              <p>Responda e eu monto a estrutura e o checklist da viagem.</p>
            </IonText>
            <IonList inset>
              {PERGUNTAS.map((p) => (
                <IonItem key={p.chave}>
                  <IonToggle
                    checked={respostas[p.chave]}
                    onIonChange={(e) =>
                      setRespostas((r) => ({ ...r, [p.chave]: e.detail.checked }))
                    }
                  >
                    {p.texto}
                  </IonToggle>
                </IonItem>
              ))}
              <IonItem>
                <IonInput
                  type="number"
                  label="Margem de segurança (%)"
                  labelPlacement="floating"
                  value={margem}
                  onIonInput={(e) => setMargem(e.detail.value ?? '0')}
                />
              </IonItem>
            </IonList>
            <IonNote className="ion-padding-start">
              A margem é somada ao valor por participante.
            </IonNote>
            <IonButton expand="block" disabled={salvando} onClick={concluir}>
              Criar viagem com o assistente
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={() => setEtapa(1)}>
              Voltar
            </IonButton>
          </>
        )}

        {etapa === 3 && (
          <>
            {salvando && (
              <div className="ion-text-center ion-padding">
                <IonSpinner />
                <IonText>
                  <p>Montando a estrutura da viagem…</p>
                </IonText>
              </div>
            )}

            {!salvando && resultado && (
              <IonCard>
                <IonCardHeader>
                  <IonCardSubtitle>Assistente</IonCardSubtitle>
                  <IonCardTitle>Checklist criado</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {resultado.notes && <p>{resultado.notes}</p>}
                  <IonList>
                    <IonListHeader>
                      <IonLabel>{resultado.tasks_created} tarefa(s)</IonLabel>
                    </IonListHeader>
                    {resultado.checklist.map((item) => (
                      <IonItem key={item}>
                        <IonLabel className="ion-text-wrap">{item}</IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}

            {!salvando && tripId && (
              <IonButton
                expand="block"
                onClick={() => router.push(`/trips/${tripId}`, 'root', 'replace')}
              >
                Abrir a viagem
              </IonButton>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
