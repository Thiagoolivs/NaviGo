import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import PublicTrip from './pages/PublicTrip'

setupIonicReact()

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Painel do organizador (autenticado, no futuro) */}
          <Route exact path="/" component={Dashboard} />
          {/* Página pública da viagem, acessada por link/QR */}
          <Route exact path="/trip/:slug" component={PublicTrip} />
          <Route render={() => <Redirect to="/" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  )
}
