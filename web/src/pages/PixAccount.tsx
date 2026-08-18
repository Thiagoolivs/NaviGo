import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react'
import { type ChangeEvent, useState } from 'react'

import { ApiError } from '../lib/api/client'
import {
  PIX_KEY_TYPES,
  type PixAccount as PixAccountData,
  type PixKeyType,
  getPixAccount,
  savePixAccount,
} from '../lib/api/pix'

const MAX_BYTES = 512 * 1024

export default function PixAccount() {
  const [conta, setConta] = useState<PixAccountData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const [modo, setModo] = useState<'codigo' | 'imagem'>('codigo')
  const [ownerName, setOwnerName] = useState('')
  const [bank, setBank] = useState('')
  const [key, setKey] = useState('')
  const [keyType, setKeyType] = useState<PixKeyType>('')
  const [payload, setPayload] = useState('')
  const [imagem, setImagem] = useState('')

  useIonViewWillEnter(() => {
    getPixAccount()
      .then((c) => {
        setConta(c)
        setOwnerName(c.pix_owner_name)
        setBank(c.pix_bank)
        setKey(c.pix_key)
        setKeyType(c.pix_key_type)
        setPayload(c.pix_payload)
        setImagem(c.pix_qr_image)
        if (!c.pix_payload && c.pix_qr_image) setModo('imagem')
      })
      .catch(() => setErro('Não foi possível carregar a conta PIX.'))
      .finally(() => setCarregando(false))
  })

  function selecionarArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    if (arquivo.size > MAX_BYTES) {
      setErro('A imagem deve ter no máximo 512 KB.')
      return
    }
    const leitor = new FileReader()
    leitor.onload = () => {
      setImagem(String(leitor.result))
      setErro(null)
    }
    leitor.readAsDataURL(arquivo)
  }

  async function salvar() {
    setErro(null)
    setOk(false)
    setSalvando(true)
    try {
      const atualizada = await savePixAccount({
        pix_owner_name: ownerName,
        pix_bank: bank,
        pix_key: key,
        pix_key_type: keyType,
        // Guarda só o modo escolhido, para não exibir um QR antigo por engano.
        pix_payload: modo === 'codigo' ? payload : '',
        pix_qr_image: modo === 'imagem' ? imagem : '',
      })
      setConta(atualizada)
      setOk(true)
    } catch (e) {
      setErro(e instanceof ApiError ? e.firstMessage : 'Não foi possível salvar.')
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
          <IonTitle>Minha conta PIX</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {carregando ? (
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        ) : (
          <>
            <IonText>
              <p>
                Cadastre o QR Code da sua conta para que os participantes paguem
                direto para você.
              </p>
            </IonText>

            {erro && (
              <IonText color="danger">
                <p>{erro}</p>
              </IonText>
            )}
            {ok && (
              <IonText color="success">
                <p>Conta PIX salva.</p>
              </IonText>
            )}

            {conta?.qr_code && (
              <div className="ion-text-center ion-margin-bottom">
                <img
                  src={conta.qr_code}
                  alt="QR Code PIX cadastrado"
                  style={{ maxWidth: 220, width: '100%', imageRendering: 'pixelated' }}
                />
                <IonNote>
                  <p>QR Code atual</p>
                </IonNote>
              </div>
            )}

            <IonList inset>
              <IonListHeader>
                <IonLabel>Dados do favorecido</IonLabel>
              </IonListHeader>
              <IonItem>
                <IonInput
                  label="Nome do favorecido"
                  labelPlacement="floating"
                  placeholder="Como aparece na sua conta"
                  value={ownerName}
                  onIonInput={(e) => setOwnerName(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Instituição"
                  labelPlacement="floating"
                  placeholder="Banco / carteira digital"
                  value={bank}
                  onIonInput={(e) => setBank(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Tipo da chave"
                  value={keyType}
                  onIonChange={(e) => setKeyType(e.detail.value)}
                >
                  {PIX_KEY_TYPES.map((t) => (
                    <IonSelectOption key={t.value} value={t.value}>
                      {t.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label="Chave PIX"
                  labelPlacement="floating"
                  value={key}
                  onIonInput={(e) => setKey(e.detail.value ?? '')}
                />
              </IonItem>
            </IonList>

            <IonSegment value={modo} onIonChange={(e) => setModo(e.detail.value as typeof modo)}>
              <IonSegmentButton value="codigo">
                <IonLabel>Copia e cola</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="imagem">
                <IonLabel>Enviar imagem</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {modo === 'codigo' ? (
              <IonList inset>
                <IonItem>
                  <IonTextarea
                    label="Código PIX copia e cola"
                    labelPlacement="floating"
                    autoGrow
                    rows={4}
                    placeholder="Cole aqui o código gerado no app do seu banco"
                    value={payload}
                    onIonInput={(e) => setPayload(e.detail.value ?? '')}
                  />
                </IonItem>
                <IonItem lines="none">
                  <IonNote className="ion-text-wrap">
                    Geramos o QR Code a partir do código — é a opção mais confiável.
                  </IonNote>
                </IonItem>
              </IonList>
            ) : (
              <IonList inset>
                <IonItem>
                  <IonLabel position="stacked">Imagem do QR Code (PNG ou JPEG)</IonLabel>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={selecionarArquivo}
                    style={{ marginTop: 8 }}
                  />
                </IonItem>
                {imagem && (
                  <IonItem lines="none">
                    <img
                      src={imagem}
                      alt="Pré-visualização do QR Code"
                      style={{ maxWidth: 180, margin: '8px auto' }}
                    />
                  </IonItem>
                )}
                <IonItem lines="none">
                  <IonNote className="ion-text-wrap">Tamanho máximo: 512 KB.</IonNote>
                </IonItem>
              </IonList>
            )}

            <IonButton expand="block" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar conta PIX'}
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  )
}
