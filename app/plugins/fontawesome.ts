// app/plugins/fontawesome.ts
import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

// Disable auto-adding CSS — we import it globally in main.css
config.autoAddCss = false

library.add(fas, far, fab)

export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.component('font-awesome-icon', FontAwesomeIcon)
})
