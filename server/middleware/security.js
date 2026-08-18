// server/middleware/security.js
import helmet from 'helmet'
export default defineEventHandler(async (event) => {
  const config     = useRuntimeConfig(event)
  const backEndUrl = (() => { try { return new URL(config.public.backEndUrl || 'http://localhost:5000').origin } catch { return '' } })()
  const objectStorageUrl = config.public.objectStorageUrl || ''
  // Slide viewer service (framed in the LIS slide viewer modal)
  const slideViewerUrl = (() => {
    try { return new URL(config.public.slideViewerUrl || '').origin } catch { return '' }
  })()
const isDev      = process.env.NODE_ENV !== 'production'

  // Extra origins to whitelist (object storage / MinIO), filtered so empty values never leak in
  const extra = [objectStorageUrl].filter(Boolean)

  // Origins we allow to be framed — object storage + the slide viewer
  const frameOrigins = [objectStorageUrl, slideViewerUrl].filter(Boolean)

  // If any whitelisted origin is plain http (localhost stacks, on-prem MinIO),
  // upgrade-insecure-requests would rewrite it to https:// and the frame/fetch
  // is then blocked against an http-only directive. HSTS has the same effect
  // host-wide, and it is port-blind — an entry for `localhost` upgrades :3001 too.
  const hasInsecureOrigin = [backEndUrl, objectStorageUrl, slideViewerUrl]
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
          // Allow framing the object-storage / MinIO origin so uploaded forms render,
          // plus the slide viewer service embedded in the LIS slide viewer modal
          workerSrc: ["'self'", 'blob:'],
          frameSrc: ["'self'", ...frameOrigins],
          connectSrc: [
            "'self'",
            backEndUrl,
            ...extra,
            ...(slideViewerUrl ? [slideViewerUrl] : []),
            ...devConnectSrc,
          ],
          objectSrc: ["'none'"],
          baseUri:   ["'self'"],
          // Must be passed explicitly as null to suppress it — omitting the key
          // falls through to helmet's default, which re-adds the directive and
          // rewrites every http:// frame/subresource to https://.
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