<!-- app/components/IdleTimeoutModal.vue -->
<!--
  "Are you still there?" modal — warm & human first, security-aware second.

  Design ideas at play:
    • Big waving 👋 as the hero visual (universally recognised, feels friendly
      rather than clinical). CSS keyframe wave animation — subtle, not annoying.
    • Countdown ring wraps the emoji — same information, no extra chrome.
    • Personal greeting when we know the user's name — softens the interruption.
    • Ambient warm gradient wash on the card so it doesn't feel alarm-y.
    • Bottom draining progress bar — redundant with the ring on purpose;
      peripheral-vision users notice the bar even if they miss the number.
    • Primary CTA is "I'm here" — biggest, brightest, right-most (thumb-side
      on tablets), auto-focused so Enter dismisses instantly.
-->
<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="promptOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4
               bg-black/50 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-modal-title"
        aria-describedby="idle-modal-body"
        @click.self="onStayIn"
      >
        <Transition name="modal-pop" appear>
          <div
            v-if="promptOpen"
            class="idle-card w-full max-w-md overflow-hidden"
          >
            <!-- ── Ambient header ──────────────────────────────────────── -->
            <div class="idle-header px-6 pt-8 pb-4 text-center relative">
              <!-- Soft decorative blobs -->
              <span class="blob blob-1" aria-hidden="true" />
              <span class="blob blob-2" aria-hidden="true" />

              <!-- Countdown ring + waving hand -->
              <div class="relative mx-auto w-28 h-28">
                <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90 absolute inset-0">
                  <!-- track -->
                  <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    stroke="rgba(232, 163, 61, 0.15)"
                    stroke-width="4"
                  />
                  <!-- progress -->
                  <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    :stroke="ringColor"
                    stroke-width="4"
                    stroke-linecap="round"
                    :stroke-dasharray="CIRC"
                    :stroke-dashoffset="dashOffset"
                    class="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
                  />
                </svg>

                <!-- The wave itself -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="waving-hand" aria-hidden="true">👋</span>
                </div>

                <!-- Little timer pill floating at bottom-right of the ring -->
                <div class="timer-pill" :class="{ 'timer-pill-urgent': secondsLeft <= 10 }">
                  {{ secondsLeft }}s
                </div>
              </div>

              <h2
                id="idle-modal-title"
                class="mt-5 text-xl sm:text-2xl font-extrabold text-on-surface"
              >
                {{ greeting }}
              </h2>
              <p class="mt-1 text-sm text-on-surface-variant">
                We noticed you stepped away.
              </p>
            </div>

            <!-- ── Body ────────────────────────────────────────────────── -->
            <div class="px-6 pb-6">
              <p
                id="idle-modal-body"
                class="text-sm text-on-surface text-center leading-relaxed"
              >
                To protect patient information, we'll sign you out in
                <span class="font-extrabold" :class="secondsLeft <= 10 ? 'text-ribbon-red' : 'text-ribbon-amber'">
                  {{ secondsLeft }} second{{ secondsLeft === 1 ? '' : 's' }}
                </span>
                if there's no response.
              </p>

              <!-- Redundant progress bar -->
              <div class="mt-4 h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  class="h-full rounded-full transition-[width,background-color] duration-1000 ease-linear"
                  :style="{ width: progressPct + '%' }"
                  :class="secondsLeft <= 10 ? 'bg-ribbon-red' : 'bg-ribbon-amber'"
                />
              </div>

              <!-- Actions -->
              <div class="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  class="idle-btn-secondary flex-1"
                  @click="onSignOut"
                >
                  <font-awesome-icon :icon="['fas','right-from-bracket']" class="text-xs" />
                  Sign out now
                </button>
                <button
                  ref="primaryBtn"
                  type="button"
                  class="idle-btn-primary flex-1"
                  @click="onStayIn"
                >
                  <font-awesome-icon :icon="['fas','check']" class="text-xs" />
                  I'm still here
                </button>
              </div>

              <!-- Tiny footnote — nice for HIPAA context -->
              <p class="mt-4 text-[11px] text-outline text-center flex items-center justify-center gap-1.5">
                <font-awesome-icon :icon="['fas','shield-halved']" class="text-[10px]" />
                Auto sign-out keeps patient records secure.
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { promptOpen, secondsLeft, confirmPresence } = useIdleTimeout()
const { logout } = useLogout()
const auth = useAuthStore()

// Full circumference of an r=46 circle
const CIRC = 2 * Math.PI * 46

const totalGraceSecs = computed(() => {
  const ms = Number((useRuntimeConfig().public as { idleGraceMs: number }).idleGraceMs) || 30_000
  return Math.max(1, Math.ceil(ms / 1000))
})

const progressPct = computed(() =>
  Math.max(0, Math.min(100, (secondsLeft.value / totalGraceSecs.value) * 100))
)

const dashOffset = computed(() =>
  CIRC * (1 - secondsLeft.value / totalGraceSecs.value)
)

// Ring color transitions from amber → red as time runs out
const ringColor = computed(() => (secondsLeft.value <= 10 ? '#c0395a' : '#e8a33d'))

// Personal greeting — falls back gracefully if auth shape differs
const greeting = computed(() => {
  const u: any = (auth as any).user ?? (auth as any).currentUser
  const first = String(u?.first_name ?? u?.name ?? '').trim().split(/\s+/)[0]
  return first ? `Still with us, ${first}?` : 'Still with us?'
})

function onStayIn()  { confirmPresence() }
async function onSignOut() { await logout({ keepRedirect: true }) }

// Escape / Enter → treat as "I'm here"
function onKeydown(e: KeyboardEvent) {
  if (!promptOpen.value) return
  if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); onStayIn() }
}

// Auto-focus the primary button when the modal opens so Enter works instantly
const primaryBtn = ref<HTMLButtonElement | null>(null)
watch(promptOpen, (v) => {
  if (v) nextTick(() => primaryBtn.value?.focus())
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ── Card shell ───────────────────────────────────────────────────────── */
.idle-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 1.75rem;
  box-shadow:
    0 25px 70px rgba(0, 0, 0, 0.28),
    0 4px 20px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Ambient header — warm peach wash with decorative blobs */
.idle-header {
  background: linear-gradient(
    160deg,
    rgba(253, 246, 235, 0.9) 0%,
    rgba(251, 232, 208, 0.6) 60%,
    rgba(255, 255, 255, 0) 100%
  );
  overflow: hidden;
}
.blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(30px);
  opacity: 0.4;
  pointer-events: none;
}
.blob-1 {
  width: 140px; height: 140px;
  top: -40px; right: -30px;
  background: radial-gradient(circle, #e8a33d 0%, transparent 70%);
}
.blob-2 {
  width: 120px; height: 120px;
  bottom: -30px; left: -20px;
  background: radial-gradient(circle, #5b9bdb 0%, transparent 70%);
  opacity: 0.25;
}

/* ── The wave ─────────────────────────────────────────────────────────── */
.waving-hand {
  font-size: 3.25rem;
  line-height: 1;
  display: inline-block;
  transform-origin: 70% 70%;
  animation: wave 2.2s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(232, 163, 61, 0.35));
}
@keyframes wave {
  0%   { transform: rotate(0deg); }
  10%  { transform: rotate(-10deg); }
  20%  { transform: rotate(12deg); }
  30%  { transform: rotate(-8deg); }
  40%  { transform: rotate(10deg); }
  50%  { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .waving-hand { animation: none; }
}

/* ── Timer pill floating on the ring ──────────────────────────────────── */
.timer-pill {
  position: absolute;
  bottom: -4px; right: -4px;
  min-width: 2.5rem; padding: 0.2rem 0.55rem;
  background: #fff;
  border-radius: 9999px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-weight: 800; font-size: 0.75rem;
  color: #e8a33d;
  border: 2px solid #e8a33d;
  box-shadow: 0 4px 12px rgba(232, 163, 61, 0.35);
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
.timer-pill-urgent {
  color: #c0395a;
  border-color: #c0395a;
  box-shadow: 0 4px 12px rgba(192, 57, 90, 0.35);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
@media (prefers-reduced-motion: reduce) {
  .timer-pill-urgent { animation: none; }
}

/* ── Buttons ──────────────────────────────────────────────────────────── */
.idle-btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.8rem 1.25rem; border-radius: 0.85rem;
  background: linear-gradient(135deg, #5b9bdb 0%, #3d7fbf 100%);
  color: #fff; font-weight: 700; font-size: 0.9rem;
  box-shadow: 0 6px 16px rgba(61, 127, 191, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.idle-btn-primary:hover  { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(61, 127, 191, 0.45); }
.idle-btn-primary:active { transform: translateY(0); }
.idle-btn-primary:focus-visible { outline: 2px solid #aed0f0; outline-offset: 2px; }

.idle-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.8rem 1.25rem; border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(194, 198, 216, 0.7);
  color: #424656; font-weight: 600; font-size: 0.9rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.idle-btn-secondary:hover { background: #fff; border-color: rgba(61, 127, 191, 0.35); color: #191c1e; }
.idle-btn-secondary:focus-visible { outline: 2px solid #aed0f0; outline-offset: 2px; }

/* ── Transitions ──────────────────────────────────────────────────────── */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,  .modal-fade-leave-to     { opacity: 0; }

.modal-pop-enter-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease; }
.modal-pop-leave-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.modal-pop-enter-from   { transform: scale(0.9) translateY(8px); opacity: 0; }
.modal-pop-leave-to     { transform: scale(0.96); opacity: 0; }
</style>