<!-- app/pages/assets/maintenance.vue -->
<!-- Single maintenance job card — read-only detail view reached via
     ?uuid=<maintenance_uuid> (from the All Assets Maintenances tab, or an
     asset's own Maintenances tab). Mirrors inspect.vue's page conventions and
     re-uses the exact "complete maintenance" payload shape from [uuid].vue. -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- Breadcrumb -->
      <div class="mb-5">
        <nav
          class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs sm:text-sm shadow-sm flex-wrap">
          <NuxtLink :to="{ path: `/assets/overview`, query: { tab: originTab } }"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
            <font-awesome-icon :icon="['fas', originCrumb.icon]" class="text-[11px]" />{{ originCrumb.label }}
          </NuxtLink>

          <template v-if="resolvedAssetUuid">
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
            <NuxtLink :to="{ path: `/assets/${resolvedAssetUuid}` }"
              class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
              <font-awesome-icon :icon="['fas', 'hard-drive']" class="text-[11px] text-primary" /><span
                class="truncate max-w-[10rem] sm:max-w-none">{{ record?.asset }} Page</span>
            </NuxtLink>
          </template>

          <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
          <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
            <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" class="text-[11px] text-ribbon-blue" /><span
              class="truncate max-w-[10rem] sm:max-w-none">{{ record?.job_card_no || 'Maintenance' }}</span>
          </span>
        </nav>
      </div>

      <!-- feedback -->
      <div v-if="feedback.msg" :class="feedback.kind === 'error' ? 'alert-error' : 'alert-success'">
        <font-awesome-icon :icon="['fas', feedback.kind === 'error' ? 'circle-exclamation' : 'circle-check']"
          class="mt-0.5" />
        <span class="text-sm sm:text-base break-words">{{ feedback.msg }}</span>
      </div>

      <!-- loading -->
      <template v-if="showSkeleton">
        <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonPanel :bars="3" />
          <div class="lg:col-span-2">
            <SkeletonPanel :bars="4" />
          </div>
        </div>
      </template>
      <div v-else-if="loading" />

      <!-- not found -->
      <div v-else-if="!record" class="g-card p-10 text-center">
        <div class="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
          <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-2xl" />
        </div>
        <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold text-on-surface mb-1">Maintenance not
          found</h3>
        <p class="text-sm sm:text-base text-on-surface-variant mb-6 break-words">We couldn't load this job card. It may
          have been removed, or the link is invalid.</p>
        <button class="btn-secondary text-sm sm:text-base" @click="navigateTo('/assets/overview?tab=maintenances')">
          <font-awesome-icon :icon="['fas', 'arrow-left']" /><span>Back to maintenances</span>
        </button>
      </div>

      <template v-else>
        <!-- ── Header island ─────────────────────────────────────────────── -->
        <header class="g-card relative p-5 sm:p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div class="min-w-0 space-y-3">
              <div class="flex items-center gap-4 min-w-0">
                <div
                  class="w-12 h-12 shrink-0 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" class="text-xl" />
                </div>
                <div class="min-w-0">
                  <h1
                    class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold text-on-surface break-words">
                    {{ record.asset }}</h1>
                  <p class="text-xs sm:text-sm text-outline mt-0.5 font-mono truncate">{{ record.job_card_no }} · {{
                    record.asset_tag }}</p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span class="px-3 py-1 rounded-lg font-bold whitespace-nowrap" :class="statusClass(record.status)">
                  {{ titleCase(record.status) }}
                </span>
                <span class="px-3 py-1 rounded-lg font-bold bg-ribbon-blue/12 text-ribbon-blue whitespace-nowrap">
                  {{ titleCase(record.type) }}
                </span>
                <span class="px-3 py-1 rounded-lg font-bold bg-surface-high text-on-surface-variant whitespace-nowrap">
                  {{ titleCase(record.frequency) }}<span v-if="record.quarter"> · {{ record.quarter }}</span>
                </span>
                <span v-if="record.department"
                  class="px-3 py-1 rounded-lg font-bold bg-ribbon-purple/12 text-ribbon-purple break-words">
                  <span class="ribbon-dot-purple inline-block mr-1.5" />{{ record.department }}
                </span>
                <span v-if="record.by_external_contractor"
                  class="px-3 py-1 rounded-lg font-bold bg-ribbon-amber/12 text-ribbon-amber whitespace-nowrap">
                  <font-awesome-icon :icon="['fas', 'building']" class="mr-1" />External contractor
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button v-if="canComplete && canWrite" class="btn-primary text-sm sm:text-base whitespace-nowrap"
                @click="openComplete">
                <font-awesome-icon :icon="['fas', 'circle-check']" /><span>Complete maintenance</span>
              </button>
            </div>
          </div>
        </header>

        <!-- ── Cost summary strip ────────────────────────────────────────── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="g-card p-4 sm:p-5">
            <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1">Labour cost
            </p>
            <p class="text-sm sm:text-base md:text-lg font-extrabold text-ribbon-blue truncate">{{
              fmtAssetMoney(record.labour_cost, record.labour_currency) }}</p>
          </div>
          <div class="g-card p-4 sm:p-5">
            <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1">Parts cost
            </p>
            <p class="text-sm sm:text-base md:text-lg font-extrabold text-ribbon-purple truncate">{{
              fmtAssetMoney(record.parts_cost, record.labour_currency) }}</p>
          </div>
          <div class="g-card p-4 sm:p-5">
            <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1">Total cost
            </p>
            <p class="text-sm sm:text-base md:text-lg font-extrabold text-ribbon-teal truncate">{{
              fmtAssetMoney(record.total_cost, record.labour_currency) }}</p>
          </div>
          <div class="g-card p-4 sm:p-5">
            <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1">Next due on
            </p>
            <p class="text-sm sm:text-base md:text-lg font-extrabold text-ribbon-amber truncate">{{ record.next_due_on
              || '—' }}</p>
          </div>
        </div>

        <!-- ── Detail grid ────────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="g-card p-5 sm:p-6 lg:col-span-2">
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4"><span
                class="ribbon-dot-blue inline-block mr-2" />Job details</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-5">
              <div v-for="row in attributeRows" :key="row.label"
                class="flex justify-between gap-3 border-b border-outline-variant/10 pb-2 min-w-0">
                <span class="text-xs sm:text-sm text-on-surface-variant whitespace-nowrap">{{ row.label }}</span>
                <span class="text-xs sm:text-sm font-semibold text-on-surface text-right break-words">{{ row.value
                }}</span>
              </div>
            </div>

            <div v-if="record.fault_reported" class="mb-4">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-ribbon-amber mb-1">Fault reported
              </p>
              <p class="text-sm sm:text-base text-on-surface break-words">{{ record.fault_reported }}</p>
            </div>
            <div v-if="record.work_description" class="mb-4">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-ribbon-teal mb-1">Work description
              </p>
              <p class="text-sm sm:text-base text-on-surface break-words">{{ record.work_description }}</p>
            </div>

            <div v-if="record.by_external_contractor && record.external_contractor"
              class="rounded-2xl bg-ribbon-amber/8 border border-ribbon-amber/20 p-4">
              <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-ribbon-amber mb-2">
                <font-awesome-icon :icon="['fas', 'building']" class="mr-1" />External contractor
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <p class="break-words"><span class="text-on-surface-variant">Entity: </span><span
                    class="font-semibold text-on-surface">{{ record.external_contractor.entity_name || '—' }}</span></p>
                <p class="break-words"><span class="text-on-surface-variant">Contact: </span><span
                    class="font-semibold text-on-surface">{{ record.external_contractor.full_name || '—' }}</span></p>
                <p class="break-words"><span class="text-on-surface-variant">Phone: </span><span
                    class="font-semibold text-on-surface">{{ record.external_contractor.phone || '—' }}</span></p>
                <p class="break-words"><span class="text-on-surface-variant">Email: </span><span
                    class="font-semibold text-on-surface">{{ record.external_contractor.email || '—' }}</span></p>
              </div>
            </div>
          </div>

          <div class="g-card p-5 sm:p-6">
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4"><span
                class="ribbon-dot-purple inline-block mr-2" />Linked issue</h3>
            <div v-if="record.issue" class="space-y-2">
              <p class="text-xs sm:text-sm text-on-surface-variant">Reference</p>
              <p class="text-sm sm:text-base font-mono font-semibold text-primary break-words">{{
                record.issue.reference_no }}</p>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-3">Status</p>
              <span class="inline-block px-3 py-1 rounded-lg font-bold text-xs sm:text-sm"
                :class="record.issue.status === 'RESOLVED' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">
                {{ titleCase(record.issue.status) }}
              </span>
            </div>
            <p v-else class="text-sm sm:text-base text-on-surface-variant text-center py-6">No linked issue — this job
              was scheduled directly.</p>
          </div>
        </div>

        <!-- ── Parts used ─────────────────────────────────────────────────── -->
        <div v-if="record.parts?.length" class="g-card p-5 sm:p-6">
          <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4"><span
              class="ribbon-dot-teal inline-block mr-2" />Parts used</h3>
          <div class="overflow-x-auto rounded-t-2xl">
            <table class="w-full text-left border-collapse text-xs sm:text-sm">
              <thead class="bg-ribbon-teal/8">
                <tr class="text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-widest">
                  <th class="py-2.5 px-3">Inventory</th>
                  <th class="py-2.5 px-3 text-right">Qty</th>
                  <th class="py-2.5 px-3 text-right">Unit cost</th>
                  <th class="py-2.5 px-3 text-right">Total cost</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="(p, i) in record.parts" :key="i">
                  <td class="py-2.5 px-3 font-semibold break-words">{{ p.inventory }}</td>
                  <td class="py-2.5 px-3 text-right">{{ p.quantity }}</td>
                  <td class="py-2.5 px-3 text-right whitespace-nowrap">{{ fmtAssetMoney(p.unit_cost,
                    record.labour_currency) }}</td>
                  <td class="py-2.5 px-3 text-right font-bold whitespace-nowrap">{{ fmtAssetMoney(p.total_cost,
                    record.labour_currency) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- ═══════════ COMPLETE MAINTENANCE — mirrors [uuid].vue's flow exactly ═══════════ -->
    <Modal v-model="completeModal" title="Complete maintenance" :subtitle="record?.job_card_no" :show-logo="false"
      class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2"><label class="input-label">Work description *</label><textarea
            v-model="completeForm.work_description" rows="3" class="input-field" /></div>
        <div><label class="input-label">Labour currency</label>
          <SearchSelect v-model="completeForm.labour_currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Currency…"
            search-placeholder="Search…" />
        </div>
        <div><label class="input-label">Labour cost</label><input v-model.number="completeForm.labour_cost"
            type="number" min="0" class="input-field" /></div>
        <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3 flex items-center justify-between">
          <span class="text-xs sm:text-sm font-semibold text-on-surface-variant">Parts used (department stock id +
            qty)</span>
          <button type="button" class="text-xs sm:text-sm text-primary font-semibold"
            @click="completeForm.parts.push({ department_inventory_stock_id: '', quantity: 1 })">+ Add part</button>
        </div>
        <div v-for="(p, pi) in completeForm.parts" :key="pi" class="sm:col-span-2 grid grid-cols-5 gap-2 items-center">
          <input v-model.number="p.department_inventory_stock_id" type="number" class="input-field col-span-2"
            placeholder="Stock id" />
          <input v-model.number="p.quantity" type="number" min="1" class="input-field col-span-2" placeholder="Qty" />
          <button type="button" class="text-error text-sm justify-self-center"
            @click="completeForm.parts.splice(pi, 1)"><font-awesome-icon :icon="['fas', 'trash-can']" /></button>
        </div>
        <div><label class="input-label">Equipment status after</label><input
            v-model="completeForm.equipment_status_after" class="input-field" /></div>
        <div class="flex items-center gap-2 pt-6"><input id="rts" v-model="completeForm.return_to_service"
            type="checkbox" class="rounded border-outline-variant text-primary focus:ring-primary/30" /><label for="rts"
            class="text-sm sm:text-base cursor-pointer">Return to service</label></div>
        <div class="sm:col-span-2 flex items-center gap-2"><input id="comp-ext"
            v-model="completeForm.by_external_contractor" type="checkbox"
            class="rounded border-outline-variant text-primary focus:ring-primary/30" /><label for="comp-ext"
            class="text-sm sm:text-base cursor-pointer">By external contractor</label></div>
        <template v-if="completeForm.by_external_contractor">
          <div><label class="input-label">Contractor name</label><input
              v-model="completeForm.external_contractor.full_name" class="input-field" /></div>
          <div><label class="input-label">Entity</label><input v-model="completeForm.external_contractor.entity_name"
              class="input-field" /></div>
          <div><label class="input-label">Phone</label><input v-model="completeForm.external_contractor.phone"
              class="input-field" /></div>
          <div><label class="input-label">Email</label><input v-model="completeForm.external_contractor.email"
              class="input-field" /></div>
        </template>
      </div>
      <template #footer><button class="btn-secondary" @click="completeModal = false">Cancel</button><button
          class="btn-primary" :disabled="busy" @click="submitComplete"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Saving…' : 'Complete' }}</span></button></template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useAssets, fmtAssetMoney, titleCase } from '~/composables/useAssets'

const route = useRoute()
const queryUuid = (route.query.uuid as string) || ''
const assetsApi = useAssets()
const auth = useAuthStore()
const can = (p: string) => auth.can(p)
const PRIVILEGED_ROLES = ['system_administrator', 'bme_lead']
const canWrite = computed(() => can('asset_management') || PRIVILEGED_ROLES.includes(auth.currentRole))

// statuses that still allow completion
const OPEN_STATUSES = ['PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD']

// ── Tabs ────────────────────────────────────────────────────────────
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

// ── feedback ─────────────────────────────────────────────────────────────────
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── state ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const { showSkeleton } = useDelayedLoading(loading)
const busy = ref(false)
const record = ref<any>(null)
const assets = ref<any[]>([])
const countries = ref<any[]>([])
const resolvedAssetUuid = ref('')   // resolved by matching asset_tag — needed for the "uuid" field on complete

const canComplete = computed(() => OPEN_STATUSES.includes(record.value?.status))

const statusClass = (s: string) => {
  if (s === 'COMPLETED') return 'bg-ribbon-teal/15 text-ribbon-teal'
  if (s === 'CANCELLED') return 'bg-error/10 text-error'
  if (s === 'IN_PROGRESS') return 'bg-ribbon-amber/15 text-ribbon-amber'
  if (s === 'ON_HOLD') return 'bg-ribbon-purple/15 text-ribbon-purple'
  return 'bg-ribbon-blue/15 text-ribbon-blue' // PLANNED / SCHEDULED
}

const fmtDateTime = (s: any) => {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString()
}

const attributeRows = computed(() => {
  const r = record.value
  if (!r) return []
  return [
    { label: 'Scheduled date', value: r.scheduled_date || '—' },
    { label: 'Completed at', value: fmtDateTime(r.completed_at) },
    { label: 'Assigned to', value: r.assigned_to_id ? `User #${r.assigned_to_id}` : '—' },
    { label: 'Department', value: r.department || '—' },
    { label: 'Frequency', value: titleCase(r.frequency) },
    { label: 'Quarter', value: r.quarter || '—' },
  ]
})

// ── load ─────────────────────────────────────────────────────────────────────
const loadRecord = async () => {
  loading.value = true
  try {
    record.value = await assetsApi.showMaintenance(queryUuid)
    resolvedAssetUuid.value = assets.value.find((a: any) => a.asset_tag === record.value?.asset_tag)?.uuid || ''
  } catch (e: any) {
    flash(e.message || 'Failed to load maintenance', 'error')
    record.value = null
  } finally { loading.value = false }
}
const loadAssets = async () => {
  try { const r = await assetsApi.listAssets(); assets.value = r?.data ?? [] } catch { /* ignore */ }
}
const loadCountries = async () => {
  try { const r = await assetsApi.getCountries(); countries.value = r?.data ?? r ?? [] } catch { /* ignore */ }
}

// ── complete maintenance — identical payload shape to [uuid].vue ─────────────
const completeModal = ref(false)
const completeForm = reactive<Record<string, any>>({
  work_description: '', parts: [] as any[], labour_currency_id: '', labour_cost: '',
  by_external_contractor: false, external_contractor: { full_name: '', entity_name: '', phone: '', email: '' },
  equipment_status_after: '', return_to_service: true,
})
const openComplete = () => {
  Object.assign(completeForm, {
    work_description: '', parts: [], labour_currency_id: '', labour_cost: '',
    by_external_contractor: !!record.value?.by_external_contractor,
    external_contractor: record.value?.external_contractor ? { ...record.value.external_contractor } : { full_name: '', entity_name: '', phone: '', email: '' },
    equipment_status_after: '', return_to_service: true,
  })
  completeModal.value = true
}
const submitComplete = async () => {
  if (!completeForm.work_description) { flash('Work description is required', 'error'); return }
  if (!resolvedAssetUuid.value) { flash('Could not resolve the asset for this job card', 'error'); return }
  busy.value = true
  try {
    const payload: Record<string, any> = {
      uuid: resolvedAssetUuid.value,
      maintenance_uuid: queryUuid,
      work_description: completeForm.work_description,
      parts: completeForm.parts.filter((p: any) => p.department_inventory_stock_id).map((p: any) => ({ department_inventory_stock_id: Number(p.department_inventory_stock_id), quantity: Number(p.quantity) })),
      labour_currency_id: completeForm.labour_currency_id || undefined,
      labour_cost: completeForm.labour_cost || undefined,
      by_external_contractor: completeForm.by_external_contractor,
      equipment_status_after: completeForm.equipment_status_after || undefined,
      return_to_service: completeForm.return_to_service,
    }
    if (completeForm.by_external_contractor) payload.external_contractor = completeForm.external_contractor
    await assetsApi.completeMaintenance(payload)
    flash('Maintenance completed')
    completeModal.value = false
    await loadRecord()
  } catch (e: any) { flash(e.message || 'Failed to complete maintenance', 'error') } finally { busy.value = false }
}

// ── mount ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadAssets(), loadCountries()])
  if (queryUuid) await loadRecord()
  else { loading.value = false }
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.45s ease-out backwards;
}

.ribbon-dot-blue,
.ribbon-dot-teal,
.ribbon-dot-amber,
.ribbon-dot-purple,
.ribbon-dot-red {
  display: inline-block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 9999px;
}

.ribbon-dot-blue {
  background: #3d7fbf;
}

.ribbon-dot-teal {
  background: #3dae8c;
}

.ribbon-dot-amber {
  background: #e8a33d;
}

.ribbon-dot-purple {
  background: #b05fa8;
}

.ribbon-dot-red {
  background: #c0395a;
}

.filter-wrap {
  position: relative;
}

.filter-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: 1.5px solid #3d7fbf;
  border-radius: 0.75rem;
  padding: 0.7rem 2.25rem 0.7rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}

.filter-select:focus {
  outline: none;
  box-shadow: inset 0 0 0 1.5px #3d7fbf;
  background: #f7f9fb;
}

.filter-caret {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline, #727687);
  font-size: 0.7rem;
  pointer-events: none;
}

@keyframes island-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>