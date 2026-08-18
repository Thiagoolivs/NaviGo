import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonViewWillEnter,
} from '@ionic/react'
import { add, logOutOutline } from 'ionicons/icons'
import { useCallback, useState } from 'react'

import { getCurrentUser, logout } from '../lib/api/auth'
import { TRIP_TYPES, type Trip, listTrips } from '../lib/api/trips'

export default function Dashboard() {
  const router = useIonRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    const user = await getCurrentUser()
    if (!user) {
      router.push('/login', 'root', 'replace')
      return
    }
    try {
      setTrips(await listTrips())
    } finally {
      setLoading(false)
    }
  }, [router])

  useIonViewWillEnter(() => {
    void carregar()
  })

  async function sair() {
    await logout().catch(() => undefined)
    router.push('/login', 'root', 'replace')
  }

  const rotulo = (t: Trip) => TRIP_TYPES.find((o) => o.value === t.type)?.label ?? t.type

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Minhas viagens</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={sair} aria-label="Sair">
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => carregar().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : trips.length === 0 ? (
          <div className="ion-padding ion-text-center">
            <IonText>
              <h2>Nenhuma viagem ainda</h2>
              <p>Crie a primeira e deixe o assistente montar a estrutura para você.</p>
            </IonText>
            <IonButton onClick={() => router.push('/trips/new')}>Criar viagem</IonButton>
          </div>
        ) : (
          <IonList inset>
            {trips.map((trip) => (
              <IonItem
                key={trip.id}
                button
                detail
                onClick={() => router.push(`/trips/${trip.id}`)}
              >
                <IonLabel>
                  <h2>{trip.name}</h2>
                  <p>
                    {trip.destination} · {rotulo(trip)}
                  </p>
                  <IonNote>
                    {trip.participants_count} inscrito(s)
                    {trip.capacity ? ` de ${trip.capacity}` : ''} ·{' '}
                    {trip.tasks_pending} tarefa(s) pendente(s)
                  </IonNote>
                </IonLabel>
                <IonBadge slot="end" color={trip.status === 'published' ? 'success' : 'medium'}>
                  {trip.status === 'published' ? 'publicada' : 'rascunho'}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => router.push('/trips/new')} aria-label="Nova viagem">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  )
}
