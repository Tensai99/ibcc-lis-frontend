# IBCC — Laboratory Information System

## Stack
- **Nuxt 4** (compatibility mode) · Vue 3 · TypeScript
- **Tailwind CSS 3.4.19** — custom design tokens from spec
- **Pinia** — auth store with localStorage persistence
- **ApexCharts** (vue3-apexcharts) — all charts
- **FontAwesome 6** (svg-core) — icons
- **Helmet** — server-side security headers (CSP, HSTS, frameguard, noSniff)
- Rails 8 / FHIR R4 backend expected at `NUXT_PUBLIC_BACKEND_URL`

##  Install nvm (Node Version Manager) and Node.js
- **Install nvm**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

- **Then reload your shell config so nvm is available:**
```bash
source ~/.bashrc
```

- **Verify it installed:**
```bash
nvm --version
```

## Install Node.js via nvm
- **Install the latest LTS version:**
```bash
nvm install --lts
```

- **Set it as default:**
```bash
nvm use --lts
nvm alias default lts/*
```

- **Verify:**
```bash
node -v
npm -v
```
## Modules to install

```bash
npm install \
  @fortawesome/fontawesome-svg-core \
  @fortawesome/free-brands-svg-icons \
  @fortawesome/free-regular-svg-icons \
  @fortawesome/free-solid-svg-icons \
  @fortawesome/vue-fontawesome \
  @pinia/nuxt \
  apexcharts \
  helmet \
  pinia \
  vue3-apexcharts

npm install -D \
  @nuxt/devtools \
  @nuxtjs/tailwindcss \
  autoprefixer \
  nuxt \
  postcss \
  tailwindcss

npm i --save-dev @types/node  
```

## Setup

```bash
cp .env.example .env          # set NUXT_PUBLIC_BACKEND_URL
npm install
npm run dev
```

## Project structure (Nuxt 4 layout)

```
ibcc/
├── app/
│   ├── assets/css/main.css         # global styles + Tailwind layers
│   ├── components/
│   │   ├── common/                 # StatCard, DataTable, Modal, AppAlert
│   │   └── layout/                 # Sidebar, TopBar
│   ├── composables/
│   │   ├── useApi.ts               # fetch wrapper
│   │   └── usePermission.ts        # role/permission helpers
│   ├── layouts/
│   │   ├── default.vue             # sidebar + topbar shell
│   │   └── auth.vue                # login layout
│   ├── middleware/
│   │   └── auth.global.ts          # route guard
│   ├── pages/
│   │   ├── index.vue               # → /dashboard redirect
│   │   ├── login.vue
│   │   ├── dashboard.vue
│   │   ├── patients/
│   │   │   ├── index.vue           # list + register
│   │   │   ├── [id].vue            # patient detail + timeline
│   │   │   └── encounters.vue      # encounter management
│   │   ├── billing/
│   │   │   ├── index.vue           # invoices + payments
│   │   │   └── reports.vue         # revenue reports + charts
│   │   ├── inventory/
│   │   │   ├── index.vue           # stock catalogue + transactions
│   │   │   └── disposals.vue       # disposal workflow + sign-off
│   │   └── admin/
│   │       ├── users.vue
│   │       └── system.vue          # SAGE / SMTP / expiry config
│   ├── plugins/
│   │   ├── api.js                  # initialises apiService
│   │   ├── fontawesome.ts
│   │   └── apexcharts.client.ts
│   ├── services/
│   │   └── apiService.js           # fetch wrapper w/ Bearer auth
│   ├── stores/
│   │   └── auth.ts                 # Pinia auth + role permissions
│   └── app.vue
├── server/middleware/
│   └── security.js                 # Helmet CSP + HSTS + frameguard
├── public/images/
│   └── ibcc_logo.png               # place your logo here
├── nuxt.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## Authentication flow

1. POST `/session` → `{ token, expires_at, user }`
2. Token stored in Pinia + localStorage as `ibcc_auth`
3. Every API request: `Authorization: Bearer <token>`
4. `auth.global.ts` middleware enforces auth on every non-login route
5. 401 response → clear session → redirect to `/login`

## Role-based access

Pages and UI elements are gated by `usePermission().can('permission_key')`.
The permission matrix is defined in `stores/auth.ts → ROLE_PERMISSIONS`.

## Logo

Place your logo image at `public/images/ibcc_logo.png`.
The sidebar and login page will display it; a fallback icon is shown if missing.

## Security

- **Helmet** (`server/middleware/security.js`): CSP, HSTS, frameguard (deny), noSniff, XSS filter, referrer policy
- **WebSocket disabled** in Nitro config (`experimental.websocket: false`)
- **Bearer token** only — no cookies, no CSRF surface
- Sessions expire server-side (Rails sets `expires_at`)
