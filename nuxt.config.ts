// nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'   // ← see note (1) — was previously
                                              //   registered FOR you by @nuxt/ui

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-11-01',

  // Nearly every route already disabled SSR — this app is SPA-rendered.
  // If you later add a public/marketing/login page, override ssr:true
  // for that specific route in routeRules instead.
  ssr: true,

  // Accounts for ~741 KB across 39 requests in the dev HAR. Dev-only, never
  // shipped — leave enabled, just don't read dev HARs as production numbers.
  devtools: { enabled: true },

  srcDir: 'app/',

  modules: [
    '@pinia/nuxt',

    // REMOVED: '@nuxt/ui'
    //   HAR evidence: 2 652 KB of real (sourcemap-stripped) code across 615 of
    //   the page's 954 requests, every byte of it rooted at ONE component —
    //   @nuxt/ui/dist/runtime/components/App.vue (<UApp>). It transitively
    //   pulls reka-ui (541 modules), @vueuse/core, @internationalized/date,
    //   @iconify/vue, @floating-ui, tailwind-merge/variants, tiptap,
    //   @tanstack/vue-table, embla-carousel, motion-v and vaul-vue.
    //   Nothing in app/ imports a U* component — Modal.vue, AppAlert.vue and
    //   notifications/ServerNotificationToaster.vue already cover those roles.
    //
    //   BEFORE REMOVING, run all four of these and expect zero hits:
    //     grep -rn "<UApp" app/
    //     grep -rnE "<U[A-Z][A-Za-z]*" app/ --include=*.vue
    //     grep -rn "useToast\|useOverlay\|useColorMode" app/
    //     grep -rn "<Icon\b\|<NuxtIcon" app/
    //   The last two matter because @nuxt/ui also silently supplied
    //   @nuxtjs/color-mode and @nuxt/icon.

    // ADDED: @nuxt/fonts — see note (2). `npm i -D @nuxt/fonts`
    '@nuxt/fonts',
  ],

  css: ['~/assets/css/main.css'],

  // (1) Tailwind v4 has no PostCSS-only path in this project — there is no
  // postcss.config with @tailwindcss/postcss, so main.css was being compiled by
  // the @tailwindcss/vite plugin that @nuxt/ui registers internally. Dropping
  // @nuxt/ui without registering it here yourself means Tailwind silently stops
  // emitting and the whole app renders unstyled. @tailwindcss/vite is already
  // in your devDependencies (^4.3.2), so this is a config change only.
  vite: {
    plugins: [tailwindcss()],

    optimizeDeps: {
      // Keep these pre-bundled. plugins/barcode-detector.client.ts now imports
      // 'barcode-detector/pure' dynamically instead of statically, and
      // pre-bundling is what keeps that dynamic import from becoming a cold
      // on-demand transform the first time the ID scanner opens.
      include: [
        'barcode-detector/pure',
        'barcode-detector/ponyfill',
      ],
    },
  },

  // (2) @nuxt/fonts self-hosts Manrope and was ALSO coming in via @nuxt/ui
  // (it is a direct dependency of that package) — which is why the dev HAR
  // showed .nuxt/nuxt-fonts-global.css even though nothing here asked for it.
  // Remove @nuxt/ui without adding '@nuxt/fonts' to `modules` and the only
  // remaining font source is the third-party Google link, which we deleted.
  //
  // NO `fonts:` BLOCK IS NEEDED. The module scans main.css, finds
  // `font-family: Manrope`, resolves it at BUILD time, downloads the woff2 and
  // serves it from /_fonts/. Runtime is fully self-hosted and offline-safe;
  // only the build machine needs outbound HTTPS.
  //
  // My earlier `fonts: { provider: 'none', ... }` was wrong and is what threw
  // "At least one font provider must be configured" — see fonts.fix.txt.
  // If the BUILD machine is also air-gapped, use the manual-override form:
  //
  //   fonts: {
  //     families: [
  //       // `src` present => resolved manually, no provider is ever queried.
  //       // Note `weight` (singular), not `weights` — a manual override is a
  //       // raw @font-face descriptor, not a provider query.
  //       { name: 'Manrope', src: '/fonts/manrope-variable.woff2', weight: '400 800' },
  //     ],
  //   },

  runtimeConfig: {
    public: {
      backEndUrl: process.env.NUXT_PUBLIC_BACKEND_URL,
      objectStorageUrl: process.env.MINIO_URL,
      printMiddlewareLabelUrl: process.env.PRINT_MIDDLEWARE_LABEL_URL,
      frameAncestors: process.env.NUXT_PUBLIC_FRAME_ANCESTORS || '',
      notifPollMs:        Number(process.env.NUXT_PUBLIC_NOTIF_POLL_MS        ?? 60_000),
      notifPollJitterMs:  Number(process.env.NUXT_PUBLIC_NOTIF_POLL_JITTER_MS ?? 20_000),
      notifToastTtlMs:    Number(process.env.NUXT_PUBLIC_NOTIF_TOAST_TTL_MS   ?? 8_000),
      notifMaxToasts:     Number(process.env.NUXT_PUBLIC_NOTIF_MAX_TOASTS     ?? 4),
      notifBannerTtlMs:   Number(process.env.NUXT_PUBLIC_NOTIF_BANNER_TTL_MS  ?? 12_000),
      idleTimeoutMs:      Number(process.env.NUXT_PUBLIC_IDLE_TIMEOUT_MS      ?? 60_000),
      idleGraceMs:        Number(process.env.NUXT_PUBLIC_IDLE_GRACE_MS        ?? 30_000),
    },
  },

  components: {
    dirs: [
      // The last entry already scans subdirectories with pathPrefix:false, so
      // the three above it are redundant — harmless, but they make the scan
      // order non-obvious when two files share a basename. Left as-is to avoid
      // changing resolution behaviour mid-refactor.
      { path: '~/components/common', pathPrefix: false },
      { path: '~/components/layout', pathPrefix: false },
      { path: '~/components', pathPrefix: false },
    ],
  },

  imports: {
    dirs: ['stores', 'composables', 'services'],
  },

  build: {
    transpile: ['vue3-apexcharts'],
  },

  nitro: {
    experimental: { websocket: false },
    preset: 'static',
  },

  // NOTE: with `preset: 'static'` there is no Nitro server at runtime, so these
  // headers are only emitted into .output/public/_headers (Netlify/Cloudflare
  // format). nginx ignores that file — if you serve this behind nginx (or from
  // Proxmox directly), the same rules must be duplicated in the nginx config:
  //
  //   location /images/  { expires 1y; add_header Cache-Control "public, immutable"; }
  //   location /_nuxt/   { expires 1y; add_header Cache-Control "public, immutable"; }
  //
  // Same caveat applies to `helmet` in package.json: a Nitro server plugin
  // cannot run under a static preset, so the MinIO frame-src / CSP headers must
  // come from nginx too. Worth verifying they are actually being applied.
  routeRules: {
    '/images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/_nuxt/**':  { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/admin/**': { ssr: false },
    '/assets/**': { ssr: false },
    '/customers/**': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/inventory/**': { ssr: false },
    '/orders/**': { ssr: false },
    '/notifications/**': { ssr: false },
    '/patients/**': { ssr: false },
  },

  app: {
    head: {
      title: 'IBCC — Laboratory Information System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'IBCC Cancer Centre HIS Platform' },
        { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      ],
      link: [
        // REMOVED: the preconnect + stylesheet pair for fonts.googleapis.com.
        //   It was the first request after the document (t+22 ms), render-
        //   blocking for 380 ms, and pointed at a third-party origin — so the
        //   app could not render correctly on an air-gapped network. @nuxt/fonts
        //   now resolves Manrope at build time and serves it from /_fonts/.
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/images/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/images/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/images/favicon-48x48.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/images/android-chrome-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/images/android-chrome-512x512.png' },
      ],
    },
  },
})