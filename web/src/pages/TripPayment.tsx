import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { type TripPaymentInfo, getTripPayment } from '../lib/api/pix'

export default function TripPayment() {
  const { slug } = useParams<{ slug: string }>()
  const [info, setInfo] = useState<TripPaymentInfo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    getTripPayment(slug)
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setCarregando(false))
  }, [slug])

  async function copiar() {
    if (!info?.pix_payload) return
    await navigator.clipboard.writeText(info.pix_payload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/trip/${slug}`} />
          </IonButtons>
          <IonTitle>Pagamento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {carregando ? (
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        ) : !info ? (
          <IonText>
            <h2>Viagem não encontrada</h2>
          </IonText>
        ) : !info.has_pix_account ? (
          <IonText>
            <h2>Pagamento ainda não disponível</h2>
            <p>
              O organizador ainda não cadastrou a conta para recebimento. Entre em
              contato com ele para combinar o pagamento.
            </p>
          </IonText>
        ) : (
          <>
            <IonText>
              <h2>{info.trip}</h2>
              <p>Pague pelo PIX usando o QR Code abaixo.</p>
            </IonText>

            {info.qr_code && (
              <div className="ion-text-center ion-margin-vertical">
                <img
                  src={info.qr_code}
                  alt="QR Code para pagamento PIX"
                  style={{ maxWidth: 260, width: '100%' }}
                />
              </div>
            )}

            <IonList inset>
              {info.pix_owner_name && (
                <IonItem>
                  <IonLabel>Favorecido</IonLabel>
                  <IonNote slot="end">{info.pix_owner_name}</IonNote>
                </IonItem>
              )}
              {info.pix_bank && (
                <IonItem>
                  <IonLabel>Instituição</IonLabel>
                  <IonNote slot="end">{info.pix_bank}</IonNote>
                </IonItem>
              )}
              {info.pix_key && (
                <IonItem lines="none">
                  <IonLabel className="ion-text-wrap">
                    Chave PIX
                    <p>{info.pix_key}</p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>

            {info.pix_payload && (
              <IonButton expand="block" fill="outline" onClick={copiar}>
                {copiado ? 'Código copiado!' : 'Copiar código PIX'}
              </IonButton>
            )}

            <IonNote className="ion-padding-start">
              Após pagar, envie o comprovante ao organizador para que ele dê baixa.
            </IonNote>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
