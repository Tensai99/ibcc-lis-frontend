<!-- app/pages/login.vue -->
<template>
  <!--
    Layout: auth.vue wraps this in a full-screen div.
    We override it to use the background image + blur overlay.
  -->
  <div
    class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative font-manrope"
    style="background-image: url('/images/login_background.png'); background-size: cover; background-position: center; background-attachment: fixed;"
  >
    <!-- Blur overlay -->
    <div class="absolute inset-0 z-0" style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); background-color: rgba(15, 22, 35, 0.30);" />

    <!-- ── Login card ──────────────────────────────────────────────────── -->
    <main
      class="relative z-10 w-full flex flex-col md:flex-row overflow-hidden rounded-[2rem] shadow-2xl"
      style="max-width: 960px; min-height: 520px; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >

      <!-- ── LEFT — branding ─────────────────────────────────────────── -->
      <section
        class="md:w-[45%] p-8 sm:p-10 md:p-12 flex flex-col justify-between text-white relative border-b md:border-b-0 md:border-r border-white/20"
        style="background-color: rgba(98, 151, 255, 0.72); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);"
      >
        <!-- Top content -->
        <div class="pt-2 sm:pt-6">
          <p class="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-white/80">
            Welcome Back
          </p>
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold sm:font-extrabold mb-5 tracking-tight leading-snug break-words text-white drop-shadow-lg">
            IBCC Laboratory<br/>Information System
          </h1>
          <div class="h-1.5 w-16 rounded-full mb-6 bg-white/40" />
          <p class="text-sm sm:text-base leading-relaxed font-medium text-white/90 max-w-sm break-words drop-shadow-sm">
            Securely manage diagnostics, patient records, and clinical data
            within a unified, state-of-the-art environment designed for
            Laboratorycare professionals.
          </p>
        </div>

        <!-- Footer -->
        <div class="mt-8 md:mt-0">
          <!-- System status pill -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/20 mb-4">
            <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <p class="text-xs font-bold uppercase tracking-widest text-white">
              System Status: Secure
            </p>
          </div>
          <p class="text-xs sm:text-sm font-semibold text-white/80 break-words">
            © IBCC Laboratory Information System<br/>All rights reserved
          </p>
        </div>
      </section>

      <!-- ── RIGHT — login form ──────────────────────────────────────── -->
      <section
        class="md:w-[55%] p-8 sm:p-10 md:p-12 flex flex-col justify-center"
        style="background-color: rgba(255,255,255,0.82); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
      >
        <!-- Logo -->
        <div class="mb-7">
          <img
            src="/images/ibcc_logo.png"
            alt="IBCC"
            class="m-auto h-[150px] w-auto object-contain mix-blend-multiply"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
        </div>

        <!-- Heading -->
        <div class="mb-7">
          <h2 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold tracking-tight text-[#191c1d] break-words">
            Personnel Sign-in
          </h2>
          <p class="text-xs font-bold uppercase tracking-[0.1em] text-[#424753] mt-1">
            Authorized Laboratory Information System Access Only
          </p>
        </div>

        <!-- Error alert -->
        <AppAlert
          v-if="errorMsg"
          type="error"
          :title="errorMsg"
          class="mb-5"
        />

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5" novalidate>

          <!-- Login -->
          <div class="space-y-1.5">
            <label
              for="login"
              class="block text-xs font-bold uppercase tracking-wider text-[#424753]"
            >
              Login
            </label>
            <input
              id="login"
              v-model="form.login"
              type="text"
              autocomplete="username"
              placeholder="chimwemwe.kaunda@hospital.org"
              :disabled="loading"
              class="w-full border border-[#c2c6d5] rounded-xl px-4 py-3
                     text-sm sm:text-base text-[#191c1d] bg-white/60
                     placeholder-[#424753]/50 shadow-sm transition-all
                     focus:outline-none focus:border-[#145abf] focus:ring-1 focus:ring-[#145abf]
                     disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label
              for="password"
              class="block text-xs font-bold uppercase tracking-wider text-[#424753]"
            >
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPw ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••••••"
                :disabled="loading"
                class="w-full border border-[#c2c6d5] rounded-xl px-4 py-3 pr-11
                       text-sm sm:text-base text-[#191c1d] bg-white/60
                       placeholder-[#424753]/50 shadow-sm transition-all
                       focus:outline-none focus:border-[#145abf] focus:ring-1 focus:ring-[#145abf]
                       disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#737784] hover:text-[#191c1d] transition-colors"
                @click="showPw = !showPw"
              >
                <font-awesome-icon
                  :icon="showPw ? ['fas','eye-slash'] : ['fas','eye']"
                  class="text-sm"
                />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <div class="pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex items-center justify-center gap-2
                     bg-[#145abf] hover:bg-[#6297ff] text-white
                     text-sm sm:text-base font-bold
                     py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg
                     transition-all duration-200 transform hover:-translate-y-0.5
                     active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                     disabled:hover:translate-y-0"
            >
              <font-awesome-icon v-if="loading" :icon="['fas','spinner']" spin />
              <template v-else>
                Sign In
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </template>
            </button>
          </div>

        </form>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const form     = reactive({ login: '', password: '' })
const loading  = ref(false)
const errorMsg = ref('')
const showPw   = ref(false)
const remember = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  if (!form.login.trim() || !form.password) {
    errorMsg.value = 'Please enter your login and password.'
    return
  }
  loading.value = true
  try {
    const { request } = useApi()
    const data = await request<{
      token: string | number
      expires_at: string
      user: import('~/stores/auth').AuthUser
    }>('/session', {
      method: 'POST',
      body: { login: form.login.trim(), password: form.password },
    })
    if (!data?.token) throw new Error('Invalid response from server.')
    auth.setAuth({ ...data, token: String(data.token) })
    // Kick off notification polling immediately (plugin will also react to
    // the auth.token change, but this fires the first fetch without waiting)
    useServerNotifications().start()
    const LAB_ADMIN_ROLES = ['system_administrator', 'lab_technician']
    const role = auth.user?.role ?? ''
    const dashboard = '/dashboard/laboratory'

    // Only honour ?redirect= when it's a real internal path. Bare "/dashboard" has
    // no index route (pages/dashboard/ holds only laboratory[-admin].vue), so a
    // guard that stashed redirect=/dashboard must fall through to the role landing.
    const raw = (route.query.redirect as string) || ''
    const redirect =
      raw.startsWith('/') && raw !== '/dashboard' && !raw.startsWith('/login')
        ? raw
        : dashboard
    router.push(redirect)
  } catch (e: unknown) {
    const err = e as Error & { status?: number }
    if (err.status === 401 || err.message?.toLowerCase().includes('unauthorized')) {
      errorMsg.value = 'Invalid login or password.'
    } else {
      errorMsg.value = err.message || 'Login failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>