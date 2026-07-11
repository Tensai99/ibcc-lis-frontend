// server/middleware/security.js
import helmet from 'helmet'
export default defineEventHandler(async (event) => {
  const config     = useRuntimeConfig(event)
  const backEndUrl = (() => { try { return new URL(config.public.backEndUrl || 'http://localhost:5000').origin } catch { return '' } })()
  const objectStorageUrl = config.public.objectStorageUrl || ''
  const isDev      = process.env.NODE_ENV !== 'production'

  // Extra origins to whitelist (object storage / MinIO), filtered so empty values never leak in
  const extra = [objectStorageUrl].filter(Boolean)

  // In development, Vite HMR and Nuxt DevTools open WebSocket connections on
  // random high ports. CSP connect-src must allow these or the browser blocks them.
  const devConnectSrc = isDev
    ? [
        'ws://localhost:*',
        'wss://localhost:*',
        'http://localhost:*',
        'https://api.iconify.design',
      ]
    : []
  const hstsOptions = isDev ? false : { maxAge: 63072000, includeSubDomains: true, preload: true }
  const upgradeInsecureRequests = isDev ? null : []
  await new Promise((resolve, reject) => {
    helmet({
      frameguard:     { action: 'deny' },
      hsts:           hstsOptions,
      noSniff:        true,
      xssFilter:      true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", backEndUrl],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com',
            'https://use.fontawesome.com',
            
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            "'wasm-unsafe-eval'",                 // Tesseract.js WASM core (dev AND prod)
            ...(isDev ? ["'unsafe-eval'"] : []),  // Vite HMR / eval in dev only
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com',
            'https://use.fontawesome.com',
            'data:',
          ],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', backEndUrl, ...extra],
          // Allow framing the object-storage / MinIO origin so uploaded forms render
          workerSrc: ["'self'", 'blob:'],
          frameSrc: ["'self'", ...extra],
          connectSrc: [
            "'self'",
            backEndUrl,
            ...extra,
            ...devConnectSrc,
          ],
          objectSrc: ["'none'"],
          baseUri:   ["'self'"],
          ...(upgradeInsecureRequests !== null
            ? { upgradeInsecureRequests }
            : {}),
        },
      },
    })(
      event.node.req,
      event.node.res,
      (err) => { if (err) reject(err); else resolve(null) }
    )
  })
})