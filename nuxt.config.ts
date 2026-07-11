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
    public: {
      backEndUrl: process.env.NUXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
      objectStorageUrl: process.env.MINIO_URL || 'http://localhost:9000',
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
      title: 'IBCC — Hospital Information System',
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