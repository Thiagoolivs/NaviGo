import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { api } from '../lib/api/client'
import { TRIP_TYPES, type TripType } from '../lib/api/trips'

interface PublicTrip {
  name: string
  destination: string
  type: TripType
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  capacity: number | null
  slug: string
  cover_image_url: string
  spots_left: number | null
}

export default function PublicTripPage() {
  const { slug } = useParams<{ slug: string }>()
  const [trip, setTrip] = useState<PublicTrip | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api
      .get<PublicTrip>(`/public/trips/${slug}/`)
      .then(setTrip)
      .catch(() => setTrip(null))
      .finally(() => setCarregando(false))
  }, [slug])

  const tipo = TRIP_TYPES.find((t) => t.value === trip?.type)?.label

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{trip?.name ?? 'Viagem'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {carregando ? (
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        ) : !trip ? (
          <IonText>
            <h2>Viagem não encontrada</h2>
            <p>O link pode estar incorreto ou a viagem ainda não foi publicada.</p>
          </IonText>
        ) : (
          <>
            <IonText>
              <h2>{trip.name}</h2>
              <p>{trip.destination}</p>
            </IonText>
            <div>
              {tipo && <IonChip>{tipo}</IonChip>}
              {trip.start_date && <IonChip>{trip.start_date}</IonChip>}
              {trip.duration_days && <IonChip>{trip.duration_days} dia(s)</IonChip>}
              {trip.spots_left !== null && (
                <IonChip color={trip.spots_left > 0 ? 'success' : 'danger'}>
                  {trip.spots_left > 0 ? `${trip.spots_left} vaga(s)` : 'esgotado'}
                </IonChip>
              )}
            </div>
            <IonButton expand="block" className="ion-margin-top" disabled>
              Inscrever-se (em breve)
            </IonButton>
            <IonNote className="ion-padding-start">
              A inscrição e o pagamento por PIX entram na próxima etapa.
            </IonNote>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
