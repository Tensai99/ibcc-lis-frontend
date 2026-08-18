// nuxt.config.ts
export default defineNuxtConfig({
  // Nuxt 4 compatibility
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-11-01',

  ssr: true,

  devtools: { enabled: true },

  srcDir: 'app/',

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  css: ['~/assets/css/main.css', '@fortawesome/fontawesome-svg-core/styles.css'],

  runtimeConfig: {
    printMiddlewareLabelUrl: process.env.PRINT_MIDDLEWARE_LABEL_URL,
    public: {
      backEndUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
      objectStorageUrl: process.env.MINIO_URL || 'http://localhost:9000',
      slideViewerUrl: process.env.NUXT_PUBLIC_SLIDE_VIEWER_URL || 'http://localhost:3001',
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
      {
        path: '~/components/common',
        pathPrefix: false,
        global: true,
      },
      {
        path: '~/components/layout',
        pathPrefix: false,
        global: true,
      },
      {
        path: '~/components/dashboard',
        pathPrefix: false,
        global: true,
      },
      {
        path: '~/components',
        pathPrefix: false,
        global: true,
      },
    ],
  },

  imports: {
    dirs: ['stores', 'composables', 'services'],
  },

  tailwindcss: {
    configPath: './tailwind.config.ts',
    exposeConfig: false,
  },

  build: {
    transpile: ['vue3-apexcharts'],
  },

  vite: {
    optimizeDeps: {
      include: ['barcode-detector/pure', 'barcode-detector/ponyfill'],
    },
  },

  nitro: {
    experimental: { websocket: false },
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: false,
    },
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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
})