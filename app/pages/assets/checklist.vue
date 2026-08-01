<!-- app/pages/assets/checklist.vue -->
<!-- Inspection checklist template — restructured as a two-pane workspace:
     sticky identity panel (left) + tabbed one-section-at-a-time viewer/editor
     (right) with prev/next paging. Overview glass/ribbon vocabulary.
     Loads /assets/checklist_template/show?uuid=, PATCH /assets/checklist_template/update. -->
<template>
  <div class="w-full max-w-[98%] mx-auto flex flex-col gap-4 sm:gap-5 py-4 sm:py-5 pb-24 overflow-x-hidden">

    <!-- ── breadcrumb ─────────────────────────────────────────────────────── -->
    <nav
      class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs sm:text-sm shadow-sm self-start max-w-full flex-wrap">
      <NuxtLink :to="{ path: '/assets/overview', query: { tab: originTab } }"
        class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
        <font-awesome-icon :icon="['fas', originCrumb.icon]" class="text-[11px]" />{{ originCrumb.label }}
      </NuxtLink>
      <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40 shrink-0" />
      <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold min-w-0">
        <font-awesome-icon :icon="['fas', 'clipboard-check']" class="text-[11px] text-primary shrink-0" />
        <span class="truncate max-w-[40vw]">{{ template?.name || 'Template' }}</span>
      </span>
    </nav>

    <!-- feedback -->
    <div v-if="feedback.msg" :class="feedback.kind === 'error' ? 'alert-error' : 'alert-success'">
      <font-awesome-icon :icon="['fas', feedback.kind === 'error' ? 'circle-exclamation' : 'circle-check']"
        class="mt-0.5 shrink-0" />
      <span class="break-words min-w-0">{{ feedback.msg }}</span>
    </div>

    <!-- loading -->
    <div v-if="loading"
      class="g-card p-10 sm:p-14 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
      <font-awesome-icon :icon="['fas', 'circle-notch']" class="fa-spin text-2xl text-primary/50" />
      <p class="text-sm sm:text-base md:text-lg">Loading template…</p>
    </div>

    <!-- missing uuid / not found -->
    <div v-else-if="!uuid || !template" class="g-card p-10 sm:p-14 text-center">
      <div
        class="w-14 h-14 mx-auto rounded-2xl bg-ribbon-blue/12 flex items-center justify-center text-ribbon-blue mb-4">
        <font-awesome-icon :icon="['fas', 'clipboard-list']" class="text-xl" />
      </div>
      <p class="text-sm sm:text-base md:text-lg font-semibold text-on-surface break-words">
        {{ uuid ? 'Template not found.' : 'No template selected.' }}</p>
      <p class="text-xs sm:text-sm text-on-surface-variant mt-1 break-words">Open a template from Assets → Inspection
        templates.</p>
      <NuxtLink :to="{ path: '/assets/overview', query: { tab: 'templates' } }"
        class="btn-secondary mt-5 inline-flex text-sm sm:text-base">
        <font-awesome-icon :icon="['fas', 'arrow-left']" /><span>Back to templates</span>
      </NuxtLink>
    </div>

    <!-- ── workspace: identity panel + tabbed section pane ───────────────── -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] gap-4 sm:gap-5 items-start">

      <!-- ═══ LEFT: identity panel ═══ -->
      <aside class="g-card p-5 sm:p-6 lg:sticky lg:top-5 min-w-0 overflow-hidden flex flex-col gap-5">
        <div class="flex items-start gap-3 min-w-0">
          <div
            class="w-11 h-11 sm:w-12 sm:h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'clipboard-list']" class="text-base sm:text-xl" />
          </div>
          <div class="min-w-0 overflow-hidden">
            <h1
              class="text-xl sm:text-2xl md:text-3xl font-semibold sm:font-bold leading-snug text-on-surface break-words">
              {{ template.name }}
            </h1>
            <p class="font-mono text-xs sm:text-sm text-on-surface-variant truncate mt-0.5">{{ template.code }}</p>
          </div>
        </div>

        <!-- attribute list — key/value rows, ribbon-accented -->
        <dl class="flex flex-col gap-2 text-xs sm:text-sm min-w-0">
          <div
            class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-ribbon-blue/8 border border-ribbon-blue/15 min-w-0">
            <dt class="font-bold text-ribbon-blue uppercase tracking-wider shrink-0">Type</dt>
            <dd class="font-semibold text-on-surface truncate">{{ titleCase(template.inspection_type) }}</dd>
          </div>
          <div
            class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-ribbon-teal/8 border border-ribbon-teal/15 min-w-0">
            <dt class="font-bold text-ribbon-teal uppercase tracking-wider shrink-0">Frequency</dt>
            <dd class="font-semibold text-on-surface truncate">{{ titleCase(template.frequency) }}</dd>
          </div>
          <div
            class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-ribbon-purple/8 border border-ribbon-purple/15 min-w-0">
            <dt class="font-bold text-ribbon-purple uppercase tracking-wider shrink-0">Asset type</dt>
            <dd class="font-semibold text-on-surface truncate">{{ template.asset_type?.name }}</dd>
          </div>
        </dl>

        <!-- counters -->
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-xl border border-ribbon-blue/15 bg-ribbon-blue/8 px-3 py-2.5 min-w-0">
            <p
              class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-ribbon-blue tabular-nums leading-none">
              {{ liveSectionCount }}</p>
            <p class="text-xs sm:text-sm font-bold text-on-surface-variant mt-1 truncate">Sections</p>
          </div>
          <div class="rounded-xl border border-ribbon-teal/15 bg-ribbon-teal/8 px-3 py-2.5 min-w-0">
            <p
              class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-ribbon-teal tabular-nums leading-none">
              {{ liveTaskCount }}</p>
            <p class="text-xs sm:text-sm font-bold text-on-surface-variant mt-1 truncate">Tasks</p>
          </div>
        </div>

        <!-- actions -->
        <div class="flex flex-col gap-2 mt-auto">
          <template v-if="!editing">
            <NuxtLink :to="`/assets/inspect?template=${uuid}`" class="btn-primary w-full text-sm sm:text-base">
              <font-awesome-icon :icon="['fas', 'clipboard-check']" /><span>Make inspection</span>
            </NuxtLink>
            <button v-if="canEdit" class="btn-secondary w-full text-sm sm:text-base" @click="startEdit">
              <font-awesome-icon :icon="['fas', 'pen']" /><span>Edit template</span>
            </button>
          </template>
          <template v-else>
            <button class="btn-primary w-full text-sm sm:text-base" :disabled="saving" @click="save">
              <font-awesome-icon :icon="['fas', saving ? 'circle-notch' : 'check']" :class="{ 'fa-spin': saving }" />
              <span>{{ saving ? 'Saving…' : 'Save changes' }}</span>
            </button>
            <button class="btn-secondary w-full text-sm sm:text-base" :disabled="saving"
              @click="cancelEdit">Cancel</button>
          </template>
        </div>
      </aside>

      <!-- ═══ RIGHT: tabbed section workspace ═══ -->
      <main class="min-w-0 flex flex-col gap-4 sm:gap-5 overflow-hidden">

        <!-- section tab bar — overview tab-btn style, one pill per section -->
        <div class="g-card p-1.5 sm:p-2 max-w-full overflow-hidden">
          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button v-for="(s, i) in workSections" :key="i"
              class="tab-btn shrink-0 whitespace-nowrap text-sm sm:text-base" :class="{ 'tab-active': activeIdx === i }"
              @click="activeIdx = i">
              <span class="w-2 h-2 rounded-full shrink-0" :class="activeIdx === i ? 'bg-white' : tint(i).dot" />
              <span class="truncate max-w-[38vw] sm:max-w-[240px]">{{ s.section || 'Untitled' }}</span>
              <span class="text-xs sm:text-sm font-bold tabular-nums px-1.5 rounded-full"
                :class="activeIdx === i ? 'bg-white/20 text-white' : tint(i).pill">{{ taskCountOf(s) }}</span>
            </button>
            <button v-if="editing" type="button"
              class="tab-btn shrink-0 whitespace-nowrap text-sm sm:text-base !text-ribbon-blue" @click="addSection">
              <font-awesome-icon :icon="['fas', 'plus']" class="text-xs" /><span>Add section</span>
            </button>
          </div>
        </div>

        <!-- active section panel -->
        <section v-if="activeSectionData" :key="activeIdx"
          class="g-card p-4 sm:p-6 border-l-4 overflow-hidden animate-panel-in" :class="tint(activeIdx).border">

          <!-- panel header -->
          <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 min-w-0">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <span
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold tabular-nums text-sm sm:text-base shrink-0"
                :class="tint(activeIdx).iconBox">{{ pad(activeIdx + 1) }}</span>
              <div class="min-w-0 overflow-hidden flex-1">
                <p class="text-xs sm:text-sm font-bold uppercase tracking-wider truncate" :class="tint(activeIdx).text">
                  Section {{ pad(activeIdx + 1) }} of {{ pad(workSections.length) }}</p>
                <h2 v-if="!editing"
                  class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold text-on-surface break-words">
                  {{ activeSectionData.section }}</h2>
                <input v-else v-model="activeSectionData.section" placeholder="Section name…"
                  class="cust-input !py-2.5 font-bold w-full text-sm sm:text-base md:text-lg mt-1" />
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                :class="tint(activeIdx).pill">{{ taskCountOf(activeSectionData) }} tasks</span>
              <button v-if="editing"
                class="w-9 h-9 rounded-xl bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition-all"
                title="Remove section" @click="removeSection(activeIdx)">
                <font-awesome-icon :icon="['fas', 'trash-can']" class="text-xs" />
              </button>
            </div>
          </div>

          <!-- VIEW: task list -->
          <ol v-if="!editing" class="space-y-2">
            <li v-for="(task, ti) in activeSectionData.tasks" :key="ti"
              class="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border min-w-0"
              :class="tint(activeIdx).row">
              <span class="mt-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0"
                :class="tint(activeIdx).tick">
                <font-awesome-icon :icon="['fas', 'check']" class="text-[9px]" />
              </span>
              <span
                class="text-sm sm:text-base md:text-lg text-on-surface leading-relaxed break-words flex-1 min-w-0">{{
                  task }}</span>
              <span class="text-xs sm:text-sm font-mono shrink-0 pt-0.5 tabular-nums" :class="tint(activeIdx).num">{{
                pad(ti + 1) }}</span>
            </li>
          </ol>

          <!-- EDIT: task editor -->
          <div v-else class="space-y-2">
            <div v-for="(t, ti) in activeSectionData.tasks" :key="ti"
              class="group/task flex items-center gap-2 sm:gap-2.5 p-2 rounded-2xl border min-w-0"
              :class="tint(activeIdx).row">
              <span class="text-xs sm:text-sm font-mono w-6 text-right tabular-nums shrink-0"
                :class="tint(activeIdx).num">{{
                ti + 1 }}</span>
              <input v-model="activeSectionData.tasks[ti]" placeholder="Task description…"
                class="cust-input !py-2 flex-1 min-w-0 text-sm sm:text-base"
                @keydown.enter.prevent="addTaskAfter(activeSectionData, ti)" />
              <button
                class="opacity-100 lg:opacity-0 lg:group-hover/task:opacity-100 focus:opacity-100 w-8 h-8 shrink-0 rounded-lg text-outline hover:bg-error/10 hover:text-error flex items-center justify-center transition-all"
                title="Remove task" @click="activeSectionData.tasks.splice(ti, 1)">
                <font-awesome-icon :icon="['fas', 'xmark']" class="text-xs" />
              </button>
            </div>
            <button class="text-xs sm:text-sm font-bold mt-1 inline-flex items-center gap-1.5 hover:underline"
              :class="tint(activeIdx).text" @click="activeSectionData.tasks.push('')">
              <font-awesome-icon :icon="['fas', 'plus']" class="text-[10px]" /> Add task
            </button>
          </div>

          <!-- prev / next pager -->
          <div class="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-outline-variant/30">
            <button class="btn-secondary text-sm sm:text-base" :disabled="activeIdx === 0" @click="activeIdx--">
              <font-awesome-icon :icon="['fas', 'chevron-left']" class="text-xs" />
              <span class="hidden sm:inline">Previous</span>
            </button>
            <span class="text-xs sm:text-sm text-on-surface-variant tabular-nums whitespace-nowrap">
              {{ activeIdx + 1 }} / {{ workSections.length }}</span>
            <button class="btn-secondary text-sm sm:text-base" :disabled="activeIdx >= workSections.length - 1"
              @click="activeIdx++">
              <span class="hidden sm:inline">Next</span>
              <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-xs" />
            </button>
          </div>
        </section>

        <!-- empty workspace -->
        <div v-else class="g-card p-8 sm:p-10 text-center">
          <p class="text-sm sm:text-base text-on-surface-variant break-words">
            {{ editing ? 'No sections yet.' : 'This template has no sections.' }}</p>
          <button v-if="editing" type="button" class="btn-primary mt-4 text-sm sm:text-base" @click="addSection">
            <font-awesome-icon :icon="['fas', 'plus']" /> Add your first section
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAssets, titleCase } from '~/composables/useAssets'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const assetsApi = useAssets()
const auth = useAuthStore()
const can = (p: string) => auth.can(p)
const canEdit = computed(() => can('asset_management'))

const uuid = (route.query.uuid as string) || ''
const pad = (n: number) => String(n).padStart(2, '0')

type TemplateSection = { section: string; tasks: string[] }

// ── per-section ribbon accents — full literal class strings (JIT-safe) ──────
const SECTION_TINT = [
  { border: 'border-ribbon-blue', text: 'text-ribbon-blue', iconBox: 'bg-ribbon-blue/12 text-ribbon-blue', pill: 'bg-ribbon-blue/12 text-ribbon-blue', row: 'bg-ribbon-blue/8 border-ribbon-blue/15', tick: 'bg-ribbon-blue', dot: 'bg-ribbon-blue', num: 'text-ribbon-blue/50' },
  { border: 'border-ribbon-teal', text: 'text-ribbon-teal', iconBox: 'bg-ribbon-teal/12 text-ribbon-teal', pill: 'bg-ribbon-teal/12 text-ribbon-teal', row: 'bg-ribbon-teal/8 border-ribbon-teal/15', tick: 'bg-ribbon-teal', dot: 'bg-ribbon-teal', num: 'text-ribbon-teal/50' },
  { border: 'border-ribbon-purple', text: 'text-ribbon-purple', iconBox: 'bg-ribbon-purple/12 text-ribbon-purple', pill: 'bg-ribbon-purple/12 text-ribbon-purple', row: 'bg-ribbon-purple/8 border-ribbon-purple/15', tick: 'bg-ribbon-purple', dot: 'bg-ribbon-purple', num: 'text-ribbon-purple/50' },
  { border: 'border-ribbon-amber', text: 'text-ribbon-amber', iconBox: 'bg-ribbon-amber/15 text-ribbon-amber', pill: 'bg-ribbon-amber/15 text-ribbon-amber', row: 'bg-ribbon-amber/10 border-ribbon-amber/15', tick: 'bg-ribbon-amber', dot: 'bg-ribbon-amber', num: 'text-ribbon-amber/60' },
  { border: 'border-ribbon-red', text: 'text-ribbon-red', iconBox: 'bg-ribbon-red/12 text-ribbon-red', pill: 'bg-ribbon-red/12 text-ribbon-red', row: 'bg-ribbon-red/8 border-ribbon-red/15', tick: 'bg-ribbon-red', dot: 'bg-ribbon-red', num: 'text-ribbon-red/50' },
]
const tint = (i: number) => SECTION_TINT[i % 5]!

type Crumb = { label: string; icon: string }
const ORIGIN_TABS = {
  overview: { label: 'Overview', icon: 'gauge-high' },
  assets: { label: 'Assets', icon: 'server' },
  issues: { label: 'All Assets Issues', icon: 'triangle-exclamation' },
  maintenances: { label: 'All Assets Maintenances', icon: 'screwdriver-wrench' },
  inspections: { label: 'All Assets Inspections', icon: 'clipboard-check' },
  damages: { label: 'All Assets Damages', icon: 'house-crack' },
  disposals: { label: 'All Assets Disposals', icon: 'trash-can' },
  templates: { label: 'Inspection Templates', icon: 'clipboard-list' },
  tools: { label: 'Tools', icon: 'wrench' },
} satisfies Record<string, Crumb>
// DEFAULT differs per page:  _uuid_ → assets | inspect → inspections
//                            maintenance → maintenances | checklist → templates
const originTab = computed(() => {
  const f = route.query.from as string | undefined
  return f && f in ORIGIN_TABS ? f : 'assets' /* ← per-page default */
})
// literal-key access → concrete Crumb (never undefined), so the ?? fallback collapses the union
const originCrumb = computed<Crumb>(() => ORIGIN_TABS[originTab.value as keyof typeof ORIGIN_TABS] ?? ORIGIN_TABS.assets)

// feedback
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── load ────────────────────────────────────────────────────────────────────
const loading = ref(false)
const template = ref<any>(null)

const viewSections = computed<TemplateSection[]>(() =>
  (template.value?.checklist?.sections ?? []) as TemplateSection[])

const loadTemplate = async () => {
  if (!uuid) return
  loading.value = true
  try { template.value = await assetsApi.showChecklistTemplate(uuid) }
  catch (e: any) { flash(e.message || 'Failed to load template', 'error'); template.value = null }
  finally { loading.value = false }
}

// ── edit state ──────────────────────────────────────────────────────────────
const editing = ref(false)
const saving = ref(false)
const draftSections = ref<TemplateSection[]>([])

// the workspace renders either the saved sections (view) or the draft (edit)
const workSections = computed<TemplateSection[]>(() =>
  editing.value ? draftSections.value : viewSections.value)

// active tab — clamped whenever the section list shrinks
const activeIdx = ref(0)
watch(() => workSections.value.length, (len) => {
  if (activeIdx.value > len - 1) activeIdx.value = Math.max(0, len - 1)
})
const activeSectionData = computed(() => workSections.value[activeIdx.value] ?? null)

const taskCountOf = (s: TemplateSection) =>
  editing.value ? s.tasks.filter((t) => (t || '').trim()).length : (s.tasks?.length || 0)

const liveSectionCount = computed(() =>
  editing.value ? draftSections.value.length
    : (template.value?.section_count ?? viewSections.value.length))
const liveTaskCount = computed(() =>
  editing.value
    ? draftSections.value.reduce((n, s) => n + s.tasks.filter((t) => (t || '').trim()).length, 0)
    : (template.value?.task_count
      ?? viewSections.value.reduce((n, s) => n + (s.tasks?.length || 0), 0)))

const startEdit = () => {
  draftSections.value = (template.value?.checklist?.sections ?? []).map((s: any) => ({
    section: s.section ?? '', tasks: [...(s.tasks ?? [])],
  }))
  editing.value = true
}
const cancelEdit = () => { editing.value = false }
const addSection = () => {
  draftSections.value.push({ section: '', tasks: [''] })
  activeIdx.value = draftSections.value.length - 1   // jump to the new tab
}
const removeSection = (i: number) => draftSections.value.splice(i, 1)
const addTaskAfter = (sec: TemplateSection, ti: number) => sec.tasks.splice(ti + 1, 0, '')

// trimmed payload — drop empty tasks and empty sections
const sectionsPayload = computed(() =>
  draftSections.value
    .map((s) => ({ section: (s.section || '').trim(), tasks: s.tasks.map((t) => (t || '').trim()).filter(Boolean) }))
    .filter((s) => s.section && s.tasks.length))

const save = async () => {
  if (!sectionsPayload.value.length) { flash('Add at least one section with a task.', 'error'); return }
  saving.value = true
  try {
    const updated = await assetsApi.updateChecklistTemplate({
      uuid,
      checklist: { sections: sectionsPayload.value },
    })
    template.value = updated || template.value
    editing.value = false
    activeIdx.value = 0
    flash('Template updated')
  } catch (e: any) { flash(e.message || 'Failed to update template', 'error') }
  finally { saving.value = false }
}

onMounted(loadTemplate)
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* glass island — duplicated from assets overview (scoped styles don't cross components) */
.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: g-island-in 0.5s ease-out backwards;
  max-width: 100%;
}

@keyframes g-island-in {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* active section panel entrance when switching tabs */
.animate-panel-in {
  animation: g-island-in 0.25s ease-out backwards;
}

/* section tab pills — same recipe as the overview tab bar */
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border-radius: 1rem;
  font-weight: 700;
  color: var(--color-on-surface-variant, #424656);
  transition: all 0.18s ease;
}

.tab-btn:hover:not(.tab-active) {
  background: rgba(61, 127, 191, 0.06);
}

.tab-active {
  background: var(--color-primary, #3d7fbf);
  color: #fff;
  box-shadow: 0 6px 16px rgba(61, 127, 191, 0.25);
}

/* hide scrollbar on the tab strip */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* soft filled inputs — same recipe as the overview/register-customer inputs */
.cust-input {
  width: 100%;
  min-width: 0;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}

.cust-input::placeholder {
  color: rgba(114, 118, 135, 0.6);
}

.cust-input:focus {
  outline: none;
  box-shadow: inset 0 0 0 1.5px #3d7fbf;
  background: #f7f9fb;
}

.cust-input:hover:not(:focus) {
  background: #e6e8ea;
}
</style>