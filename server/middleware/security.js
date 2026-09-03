// server/middleware/security.js
import helmet from 'helmet'
export default defineEventHandler(async (event) => {
  const config     = useRuntimeConfig(event)
  const backEndUrl = (() => { try { return new URL(config.public.backEndUrl || 'http://localhost:5000').origin } catch { return '' } })()
  const objectStorageUrl = config.public.objectStorageUrl || ''
  const isDev      = process.env.NODE_ENV !== 'production'
  const printLabelUrl = new URL(config.public.printMiddlewareLabelUrl) || ''

  // Origins permitted to embed this viewer in an iframe (the HIS/LIS shell).
  // Empty by default — framing stays denied unless an origin is configured.
  const frameAncestors = String(config.public.frameAncestors || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
  const framingAllowed = frameAncestors.length > 0
  console.log('[csp] frameAncestors =', JSON.stringify(config.public.frameAncestors), '→', frameAncestors)

  // Extra origins to whitelist (object storage / MinIO), filtered so empty values never leak in
  const extra = [objectStorageUrl].filter(Boolean)

  // Same trap as the shell app: any http:// origin here means
  // upgrade-insecure-requests would rewrite it to https:// and break it.
  const hasInsecureOrigin = [backEndUrl, objectStorageUrl, ...frameAncestors, printLabelUrl]
    .filter(Boolean)
    .some((o) => o.startsWith('http://'))

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
const hstsOptions = (isDev || hasInsecureOrigin)
    ? false
    : { maxAge: 63072000, includeSubDomains: true, preload: true }
  const upgradeInsecureRequests = (isDev || hasInsecureOrigin) ? null : []
  await new Promise((resolve, reject) => {
    helmet({
      // X-Frame-Options has no origin-scoped form — it is all or nothing.
      // When framing is configured, drop it and let frame-ancestors enforce.
      frameguard:     framingAllowed ? false : { action: 'deny' },
      hsts:           hstsOptions,
      noSniff:        true,
      xssFilter:      true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", backEndUrl, printLabelUrl],
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
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', backEndUrl, ...extra, printLabelUrl],
          // Allow framing the object-storage / MinIO origin so uploaded forms render
          workerSrc: ["'self'", 'blob:'],
          frameSrc: ["'self'", ...extra],
          connectSrc: [
            "'self'",
            backEndUrl,
            printLabelUrl,
            ...extra,
            ...devConnectSrc,
          ],
          objectSrc: ["'none'"],
          baseUri:   ["'self'"],
          frameAncestors: ["'self'", ...frameAncestors],
          // Must be passed explicitly as null to suppress it — omitting the key
          // falls through to helmet's default, which re-adds the directive.
          upgradeInsecureRequests,
        },
      },
    })(
      event.node.req,
      event.node.res,
      (err) => { if (err) reject(err); else resolve(null) }
    )
  })
})