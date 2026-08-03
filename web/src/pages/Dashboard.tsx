import {
  IonBadge,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useEffect, useState } from 'react'

import { getHealth } from '../lib/api/client'

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<'...' | 'online' | 'offline'>('...')

  useEffect(() => {
    getHealth()
      .then((h) => setApiStatus(h.status === 'ok' ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>NaviGo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Painel do organizador</h2>
          <p>
            Esqueleto da Fase 0. As telas de viagens, participantes e pagamentos
            entram aqui conforme o <code>CHECKLIST.md</code>.
          </p>
        </IonText>

        <IonList inset>
          <IonItem>
            <IonLabel>Status da API</IonLabel>
            <IonBadge color={apiStatus === 'online' ? 'success' : 'medium'} slot="end">
              {apiStatus}
            </IonBadge>
          </IonItem>
          <IonItem>
            <IonLabel>Próximas viagens</IonLabel>
            <IonNote slot="end">—</IonNote>
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Pagamentos pendentes</IonLabel>
            <IonNote slot="end">—</IonNote>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  )
}
