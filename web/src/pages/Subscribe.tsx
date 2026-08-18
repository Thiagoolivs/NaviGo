import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react'
import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { ApiError, api } from '../lib/api/client'
import { type EnrollmentResult, enroll } from '../lib/api/roster'

interface PublicTrip {
  name: string
  destination: string
  start_date: string | null
  duration_days: number | null
  spots_left: number | null
}

const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

const brl = (v: string | number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const data = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR')

export default function Subscribe() {
  const { slug } = useParams<{ slug: string }>()

  const [trip, setTrip] = useState<PublicTrip | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<EnrollmentResult | null>(null)

  // Dados do formulário
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [healthInsurance, setHealthInsurance] = useState('')
  const [dietary, setDietary] = useState('')
  const [medical, setMedical] = useState('')
  const [shirtSize, setShirtSize] = useState('')
  const [boardingPoint, setBoardingPoint] = useState('')
  const [notes, setNotes] = useState('')
  const [installments, setInstallments] = useState(1)
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    api
      .get<PublicTrip>(`/public/trips/${slug}/`)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setCarregando(false))
  }, [slug])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const res = await enroll(slug, {
        name: name.trim(),
        email,
        phone,
        document,
        birth_date: birthDate || null,
        is_minor: isMinor,
        guardian_name: guardianName,
        guardian_phone: guardianPhone,
        emergency_contact: emergencyContact,
        health_insurance: healthInsurance,
        dietary_restrictions: dietary,
        medical_notes: medical,
        shirt_size: shirtSize,
        boarding_point: boardingPoint,
        notes,
        consent_accepted: consent,
        installments,
      })
      setResultado(res)
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.status === 409 ? 'As vagas para esta viagem esgotaram.' : err.firstMessage)
      } else {
        setErro('Não foi possível concluir a inscrição.')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    )
  }

  if (!trip) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonText>
            <h2>Viagem não encontrada</h2>
            <p>O link pode estar incorreto ou a viagem ainda não foi publicada.</p>
          </IonText>
        </IonContent>
      </IonPage>
    )
  }

  // --- Confirmação da inscrição ---------------------------------------------
  if (resultado) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="success">
            <IonTitle>Inscrição confirmada</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardHeader>
              <IonCardSubtitle>{resultado.trip}</IonCardSubtitle>
              <IonCardTitle>Tudo certo, {resultado.name.split(' ')[0]}!</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>
                Valor total: <strong>{brl(resultado.total_amount)}</strong>
              </p>

              {resultado.installments.length > 0 && (
                <IonList>
                  <IonListHeader>
                    <IonLabel>
                      {resultado.installments.length === 1
                        ? 'Pagamento à vista'
                        : `${resultado.installments.length} parcelas`}
                    </IonLabel>
                  </IonListHeader>
                  {resultado.installments.map((p, i) => (
                    <IonItem key={p.due_date + i}>
                      <IonLabel>
                        {resultado.installments.length > 1 ? `${i + 1}ª parcela` : 'Valor'}
                      </IonLabel>
                      <IonNote slot="end">
                        {brl(p.amount)} · vence {data(p.due_date)}
                      </IonNote>
                    </IonItem>
                  ))}
                </IonList>
              )}

              {resultado.requirements.length > 0 && (
                <IonList>
                  <IonListHeader>
                    <IonLabel>O que você precisa entregar</IonLabel>
                  </IonListHeader>
                  {resultado.requirements.map((r) => (
                    <IonItem key={r}>
                      <IonLabel className="ion-text-wrap">{r}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              )}

              <IonNote>
                O organizador entrará em contato com as instruções de pagamento.
              </IonNote>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    )
  }

  // --- Formulário de inscrição ----------------------------------------------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/trip/${slug}`} />
          </IonButtons>
          <IonTitle>Inscrição</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonText>
          <h2>{trip.name}</h2>
          <p>
            {trip.destination}
            {trip.spots_left !== null && ` · ${trip.spots_left} vaga(s) restante(s)`}
          </p>
        </IonText>

        {erro && (
          <IonText color="danger">
            <p>{erro}</p>
          </IonText>
        )}

        <form onSubmit={enviar}>
          <IonList inset>
            <IonListHeader>
              <IonLabel>Seus dados</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonInput
                label="Nome completo"
                labelPlacement="floating"
                value={name}
                onIonInput={(e) => setName(e.detail.value ?? '')}
                required
              />
            </IonItem>
            <IonItem>
              <IonInput
                type="email"
                label="E-mail"
                labelPlacement="floating"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonInput
                type="tel"
                label="Telefone / WhatsApp"
                labelPlacement="floating"
                value={phone}
                onIonInput={(e) => setPhone(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="CPF ou RG"
                labelPlacement="floating"
                value={document}
                onIonInput={(e) => setDocument(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonInput
                type="date"
                label="Data de nascimento"
                labelPlacement="floating"
                value={birthDate}
                onIonInput={(e) => setBirthDate(e.detail.value ?? '')}
              />
            </IonItem>
          </IonList>

          <IonList inset>
            <IonItem>
              <IonToggle checked={isMinor} onIonChange={(e) => setIsMinor(e.detail.checked)}>
                Sou menor de 18 anos
              </IonToggle>
            </IonItem>
            {isMinor && (
              <>
                <IonItem>
                  <IonInput
                    label="Nome do responsável"
                    labelPlacement="floating"
                    value={guardianName}
                    onIonInput={(e) => setGuardianName(e.detail.value ?? '')}
                    required
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    type="tel"
                    label="Telefone do responsável"
                    labelPlacement="floating"
                    value={guardianPhone}
                    onIonInput={(e) => setGuardianPhone(e.detail.value ?? '')}
                  />
                </IonItem>
                <IonItem lines="none">
                  <IonNote className="ion-text-wrap">
                    Menores precisam entregar a autorização assinada pelo responsável.
                  </IonNote>
                </IonItem>
              </>
            )}
          </IonList>

          <IonList inset>
            <IonListHeader>
              <IonLabel>Saúde e logística</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonInput
                label="Contato de emergência"
                labelPlacement="floating"
                value={emergencyContact}
                onIonInput={(e) => setEmergencyContact(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Plano de saúde"
                labelPlacement="floating"
                value={healthInsurance}
                onIonInput={(e) => setHealthInsurance(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Restrição alimentar"
                labelPlacement="floating"
                placeholder="Ex.: intolerância a lactose"
                value={dietary}
                onIonInput={(e) => setDietary(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonTextarea
                label="Medicamentos / observações médicas"
                labelPlacement="floating"
                autoGrow
                value={medical}
                onIonInput={(e) => setMedical(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonSelect
                label="Tamanho de camiseta"
                value={shirtSize}
                onIonChange={(e) => setShirtSize(e.detail.value)}
              >
                {TAMANHOS.map((t) => (
                  <IonSelectOption key={t} value={t}>
                    {t}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonInput
                label="Ponto de embarque"
                labelPlacement="floating"
                value={boardingPoint}
                onIonInput={(e) => setBoardingPoint(e.detail.value ?? '')}
              />
            </IonItem>
          </IonList>

          <IonList inset>
            <IonListHeader>
              <IonLabel>Pagamento</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonSelect
                label="Dividir em"
                value={installments}
                onIonChange={(e) => setInstallments(Number(e.detail.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <IonSelectOption key={n} value={n}>
                    {n === 1 ? 'À vista' : `${n}x`}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonTextarea
                label="Observações para o organizador"
                labelPlacement="floating"
                autoGrow
                value={notes}
                onIonInput={(e) => setNotes(e.detail.value ?? '')}
              />
            </IonItem>
          </IonList>

          <IonList inset>
            <IonItem lines="none">
              <IonCheckbox
                checked={consent}
                onIonChange={(e) => setConsent(e.detail.checked)}
                labelPlacement="end"
                justify="start"
              >
                <span className="ion-text-wrap">
                  Autorizo o uso dos meus dados para a organização desta viagem.
                </span>
              </IonCheckbox>
            </IonItem>
          </IonList>

          <IonButton
            type="submit"
            expand="block"
            disabled={enviando || !consent || name.trim().length < 2}
          >
            {enviando ? 'Enviando…' : 'Confirmar inscrição'}
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  )
}
