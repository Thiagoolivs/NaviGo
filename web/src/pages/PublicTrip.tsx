import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useParams } from 'react-router'

export default function PublicTrip() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Viagem</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Página pública da viagem</h2>
          <p>
            Identificador: <code>{slug}</code>
          </p>
          <p>
            Aqui o participante verá as informações e fará a inscrição
            (placeholder da Fase 0).
          </p>
        </IonText>
        <IonButton expand="block" disabled>
          Inscrever-se (em breve)
        </IonButton>
      </IonContent>
    </IonPage>
  )
}
