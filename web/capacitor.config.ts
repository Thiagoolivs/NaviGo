// Configuração do Capacitor para empacotar o PWA como app nativo (iOS/Android)
// no futuro — a MESMA base de código, sem reescrever.
//
// Quando for usar, instale as dependências:
//   npm i -D @capacitor/cli && npm i @capacitor/core
//   npx cap add ios && npx cap add android
//
// (Tipagem via `CapacitorConfig` fica disponível após instalar @capacitor/cli.)

const config = {
  appId: 'app.navigo',
  appName: 'NaviGo',
  webDir: 'dist',
}

export default config
