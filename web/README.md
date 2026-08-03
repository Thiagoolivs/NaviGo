# NaviGo — Web (PWA)

Frontend do NaviGo: **PWA em Ionic + React + TypeScript (Vite)**. Roda no
navegador (desktop/notebook) e instala no celular como app.

## Rodar em desenvolvimento

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se necessário
npm run dev            # http://localhost:5173
```

A API precisa estar rodando (ver `../api/README.md`).

## Scripts

| Comando | O quê |
|---------|-------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Type-check (`tsc`) + build de produção |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Lint (oxlint) |

## PWA

- Manifest e service worker são gerados pelo `vite-plugin-pwa` (config em
  `vite.config.ts`). O app é **instalável** e atualiza sozinho.
- **TODO:** adicionar os ícones reais em `public/icons/` (`icon-192.png` e
  `icon-512.png`) — hoje o manifest os referencia, mas os arquivos ainda não
  existem.

## Estrutura

```
web/
├── public/            # favicon, ícones (a adicionar), assets estáticos
├── src/
│   ├── pages/         # Dashboard, PublicTrip (placeholders da Fase 0)
│   ├── lib/api/       # cliente da API (client.ts)
│   ├── theme/         # variables.css (tema Ionic)
│   ├── App.tsx        # rotas (Ionic Router)
│   └── main.tsx       # bootstrap + registro do service worker
├── capacitor.config.ts  # pronto p/ empacotar nativo no futuro
└── vite.config.ts     # Vite + vite-plugin-pwa
```

## Próximos passos (Fase 1)

Autenticação, criação de viagem, assistente de IA, orçamento, inscrição por
link/QR, pagamentos PIX e Web Push. Ver `../CHECKLIST.md`.
