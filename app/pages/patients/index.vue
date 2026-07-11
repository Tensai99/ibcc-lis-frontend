<!-- app/pages/patients/index.vue -->
<template>
  <AccessDenied v-if="denied" />
  <div class="animate-fade-in min-h-full flex flex-col space-y-5">

    <!-- ── Page header ──────────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="page-title">Patient Search</h1>
        <p class="page-subtitle">
          FHIR R4 · Search the patient registry by name, MRN, ID or phone
        </p>
      </div>
    </div>

    <!-- ── Search bar (submit on icon click or Enter) ──────────────────────── -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-[260px] max-w-xl">
        <input v-model="searchQuery" type="text" placeholder="Search patients by name, MRN, national ID, phone…" class="w-full pl-4 pr-12 py-2.5 bg-white/80 border border-outline-variant/50 rounded-full
                 text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-2
                 focus:ring-primary transition-all" @keyup.enter="runSearch" />
        <!-- Search trigger -->
        <button type="button" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-white
                 flex items-center justify-center hover:bg-primary-container transition-colors disabled:opacity-50"
          title="Search" :disabled="loading" @click="runSearch">
          <font-awesome-icon v-if="loading" :icon="['fas', 'spinner']" spin class="text-sm" />
          <font-awesome-icon v-else :icon="['fas', 'magnifying-glass']" class="text-sm" />
        </button>
      </div>
    </div>

    <!-- ── Filters (narrow down large result sets) ─────────────────────────── -->
    <div v-if="searched && results.length" class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-bold text-on-surface-variant uppercase tracking-wide mr-1">
        <font-awesome-icon :icon="['fas', 'filter']" class="mr-1" /> Filters
      </span>

      <select v-model="filterGender" class="filter-select">
        <option value="">All genders</option>
        <option v-for="g in genderOptions" :key="g" :value="g" class="capitalize">{{ g }}</option>
      </select>

      <select v-model="filterCategory" class="filter-select">
        <option value="">All categories</option>
        <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
      </select>

      <select v-model="filterBlood" class="filter-select">
        <option value="">All blood groups</option>
        <option v-for="b in bloodOptions" :key="b" :value="b">{{ b }}</option>
      </select>

      <button v-if="filterGender || filterCategory || filterBlood"
        class="text-xs font-bold text-primary hover:underline ml-1" @click="clearFilters">
        Clear filters
      </button>

      <div class="ml-auto flex items-center gap-3">
        <span class="text-xs text-on-surface-variant">
          {{ filteredResults.length }} of {{ total }} result{{ total !== 1 ? 's' : '' }}
        </span>
        <!-- View toggle -->
        <div class="inline-flex items-center rounded-lg bg-surface-low p-0.5 border border-outline-variant/30">
          <button type="button" title="Grid view"
            class="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            :class="viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
            @click="viewMode = 'grid'"><font-awesome-icon :icon="['fas', 'table-cells-large']"
              class="text-xs" /></button>
          <button type="button" title="List view"
            class="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            :class="viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
            @click="viewMode = 'list'"><font-awesome-icon :icon="['fas', 'list']" class="text-xs" /></button>
        </div>
      </div>
    </div>

    <!-- ── Error state ──────────────────────────────────────────────────────── -->
    <AppAlert v-if="errorMsg" type="error" :title="errorMsg" />

    <!-- ── Loading skeleton ─────────────────────────────────────────────────── -->
    <SkeletonCardGrid v-if="showSkeleton && viewMode === 'grid'" :count="6" grid-class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" />
    <div v-else-if="showSkeleton" class="rounded-xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
      <table class="w-full text-sm min-w-[860px]">
        <thead>
          <tr class="bg-gradient-to-r from-primary-fixed/40 to-transparent border-b border-outline-variant/30
                     text-xs font-bold text-on-surface-variant uppercase tracking-wide">
            <th class="text-left font-bold px-5 py-3">Patient</th>
            <th class="text-left font-bold px-4 py-3">MRN</th>
            <th class="text-left font-bold px-4 py-3">National ID</th>
            <th class="text-left font-bold px-4 py-3">Gender / Age</th>
            <th class="text-left font-bold px-4 py-3">Phone</th>
            <th class="text-left font-bold px-4 py-3">Category</th>
            <th class="text-left font-bold px-4 py-3">Blood</th>
          </tr>
        </thead>
        <tbody><SkeletonTableRows :columns="7" :rows="5" /></tbody>
      </table>
    </div>
    <div v-else-if="loading" />

    <!-- ── Pre-search prompt ────────────────────────────────────────────────── -->
    <div v-else-if="!searched" class="rounded-xl bg-white/80 text-center py-16 border border-white/50 shadow-island">
      <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="text-4xl text-outline/30 mb-3" />
      <p class="text-sm text-on-surface-variant">
        Type a search term and press <kbd
          class="px-1.5 py-0.5 rounded bg-surface-low border border-outline-variant/40 text-xs">Enter</kbd>
        or tap the search icon.
      </p>
    </div>

    <!-- ── Empty result ─────────────────────────────────────────────────────── -->
    <div v-else-if="!filteredResults.length"
      class="rounded-xl bg-white/80 text-center py-16 border border-white/50 shadow-island">
      <font-awesome-icon :icon="['fas', 'hospital-user']" class="text-4xl text-outline/30 mb-3" />
      <p class="text-sm text-on-surface-variant">
        No patients match <span class="font-bold">“{{ activeQuery }}”</span>{{ hasActiveFilters ? ' with the current filters.' : '.' }}
      </p>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
     RESULTS (grid / list)
═══════════════════════════════════════════════════════════════════ -->
    <div v-else class="flex flex-col flex-1 gap-4 min-h-0">

      <!-- ── GRID VIEW (default) ───────────────────────────────────────── -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-2">
        <article v-for="p in pagedResults" :key="p.uuid"
          class="relative pb-9 bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-island hover:-translate-y-0.5 hover:shadow-lg transition-all group"
          :class="can('patient_view') ? 'cursor-pointer' : ''"
          @click="can('patient_view') && router.push(`/patients/${p.uuid}`)">
          <!-- Header -->
          <div class="flex items-start gap-4 border-b border-outline-variant/30 pb-4 mb-4">
            <div
              class="w-12 h-12 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center flex-shrink-0">
              <img v-if="p.photo && !p.photoFailed" :src="p.photo" :alt="p.fullName" class="w-full h-full object-cover"
                @error="p.photoFailed = true" />
              <font-awesome-icon v-else :icon="['fas', 'user']" class="text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{{ p.fullName }}
              </h4>
              <p class="text-xs text-outline truncate mb-2">{{ p.email || '—' }}</p>
            </div>
          </div>
          <!-- Detail rows -->
          <dl class="grid grid-cols-2 gap-y-3 text-sm">
            <dt class="text-outline">MRN</dt>
            <dd class="text-right"><span
                class="font-mono text-xs font-bold text-primary bg-primary-fixed px-1.5 py-0.5 rounded">{{ p.mrn || '—'
                }}</span></dd>
            <dt class="text-outline">National ID</dt>
            <dd class="text-right font-mono text-xs text-on-surface break-all">{{ p.nationalId || '—' }}</dd>
            <dt class="text-outline">Gender / Age</dt>
            <dd class="text-right font-bold text-on-surface capitalize">{{ p.gender || '—' }}<span v-if="p.birthDate">,
                {{ calcAge(p.birthDate) }}y</span></dd>
            <dt class="text-outline">Phone</dt>
            <dd class="text-right font-bold text-on-surface truncate">{{ p.phone || '—' }}</dd>
            <dt class="text-outline">Category</dt>
            <dd class="text-right font-bold text-on-surface truncate">{{ p.category || '—' }}</dd>
            <dt class="text-outline self-center">Blood</dt>
            <dd class="text-right">
              <span v-if="p.bloodGroup"
                class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-error-container text-error">{{
                  p.bloodGroup }}</span>
              <span v-else class="text-on-surface">—</span>
            </dd>
          </dl>
          <!-- Floating action — same destination as the card, permission-gated -->
          <NuxtLink v-if="can('patient_view')" :to="`/patients/${p.uuid}`" title="View patient"
            class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-container hover:scale-110 transition-all"
            @click.stop>
            <font-awesome-icon :icon="['fas', 'ellipsis']" class="text-sm" />
          </NuxtLink>
        </article>
      </div>

      <!-- ── LIST / TABLE VIEW ─────────────────────────────────────────── -->
      <div v-else class="rounded-xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[860px]">
            <thead>
              <tr class="bg-gradient-to-r from-primary-fixed/40 to-transparent border-b border-outline-variant/30
                     text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                <th class="text-left font-bold px-5 py-3">Patient</th>
                <th class="text-left font-bold px-4 py-3">MRN</th>
                <th class="text-left font-bold px-4 py-3">National ID</th>
                <th class="text-left font-bold px-4 py-3">Gender / Age</th>
                <th class="text-left font-bold px-4 py-3">Phone</th>
                <th class="text-left font-bold px-4 py-3">Category</th>
                <th class="text-left font-bold px-4 py-3">Blood</th>
                <th class="text-right font-bold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/20">
              <tr v-for="p in pagedResults" :key="p.uuid" class="hover:bg-surface-low transition-colors group"
                :class="can('patient_view') ? 'cursor-pointer' : ''"
                @click="can('patient_view') && router.push(`/patients/${p.uuid}`)">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img v-if="p.photo && !p.photoFailed" :src="p.photo" :alt="p.fullName"
                        class="w-full h-full object-cover" @error="p.photoFailed = true" />
                      <font-awesome-icon v-else :icon="['fas', 'user']" class="text-primary text-xs" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{{
                        p.fullName }}</p>
                      <p class="text-xs text-outline truncate">{{ p.email || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="font-mono text-xs font-bold text-primary bg-primary-fixed px-1.5 py-0.5 rounded w-fit inline-block">{{
                      p.mrn || '—' }}</span>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-on-surface">{{ p.nationalId || '—' }}</td>
                <td class="px-4 py-3 capitalize text-on-surface">
                  {{ p.gender || '—' }}<span v-if="p.birthDate">, {{ calcAge(p.birthDate) }}y</span>
                </td>
                <td class="px-4 py-3 text-on-surface" @click.stop>
                  <a v-if="p.phone" :href="`tel:${p.phone}`" class="hover:text-primary transition-colors">{{ p.phone
                  }}</a>
                  <span v-else>—</span>
                </td>
                <td class="px-4 py-3 text-on-surface">{{ p.category || '—' }}</td>
                <td class="px-4 py-3">
                  <span v-if="p.bloodGroup" class="font-bold text-error">{{ p.bloodGroup }}</span>
                  <span v-else>—</span>
                </td>
                <td class="px-5 py-3" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <NuxtLink v-if="can('patient_view')" :to="`/patients/${p.uuid}`"
                      class="p-1.5 rounded-lg text-primary hover:bg-primary-fixed transition-colors"
                      title="View patient">
                      <font-awesome-icon :icon="['fas', 'eye']" class="text-sm" />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── SHARED PAGINATION (both views) ────────────────────────────── -->
      <div
        class="mt-auto rounded-xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <p class="text-xs text-on-surface-variant">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ filteredResults.length }}
          <span v-if="filteredResults.length !== total">(filtered from {{ total }})</span>
        </p>
        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1" title="First">
            <font-awesome-icon :icon="['fas', 'angles-left']" class="text-xs" />
          </button>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--" title="Previous">
            <font-awesome-icon :icon="['fas', 'angle-left']" class="text-xs" />
          </button>
          <button v-for="n in pageNumbers" :key="n" class="page-btn"
            :class="n === currentPage ? 'bg-primary text-white border-primary' : ''" @click="currentPage = n">
            {{ n }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++" title="Next">
            <font-awesome-icon :icon="['fas', 'angle-right']" class="text-xs" />
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages"
            title="Last">
            <font-awesome-icon :icon="['fas', 'angles-right']" class="text-xs" />
          </button>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
// ── Composables ──────────────────────────────────────────────────────────────
const { denied } = usePageGuard(['patient_search', 'patient_view'])
const { can } = usePermission()
const { request, loading } = useApi()
const router = useRouter()
const { showSkeleton } = useDelayedLoading(loading)

// ── Types ──────────────────────────────────────────────────────────────────
interface PatientRow {
  uuid: string
  mrn: string
  nationalId: string
  fullName: string
  gender: string
  birthDate: string
  phone: string
  email: string
  photo: string
  bloodGroup: string
  category: string
  active: boolean
  photoFailed?: boolean
}

// ── Search state ─────────────────────────────────────────────────────────────
const searchQuery = ref('')           // live input value
const activeQuery = ref('')           // last submitted query
const searched = ref(false)        // whether a search has been run
const errorMsg = ref('')
const results = ref<PatientRow[]>([])
const total = ref(0)

// ── Filters ──────────────────────────────────────────────────────────────────
const filterGender = ref('')
const filterCategory = ref('')
const filterBlood = ref('')

const hasActiveFilters = computed(() => !!(filterGender.value || filterCategory.value || filterBlood.value))

// Build filter option lists from the returned results
const genderOptions = computed(() => uniq(results.value.map(r => r.gender)))
const categoryOptions = computed(() => uniq(results.value.map(r => r.category)))
const bloodOptions = computed(() => uniq(results.value.map(r => r.bloodGroup)))

const clearFilters = () => {
  filterGender.value = ''
  filterCategory.value = ''
  filterBlood.value = ''
}

// ── Pagination ───────────────────────────────────────────────────────────────
const pageSize = 10
const currentPage = ref(1)
const viewMode = ref<'grid' | 'list'>('grid')

const filteredResults = computed(() =>
  results.value.filter(r =>
    (!filterGender.value || r.gender === filterGender.value) &&
    (!filterCategory.value || r.category === filterCategory.value) &&
    (!filterBlood.value || r.bloodGroup === filterBlood.value),
  ),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredResults.value.length / pageSize)))
const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredResults.value.slice(start, start + pageSize)
})
const rangeStart = computed(() => (filteredResults.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize, filteredResults.value.length))

// Windowed page numbers (max 5 buttons around current page)
const pageNumbers = computed(() => {
  const max = totalPages.value
  const window = 5
  let start = Math.max(1, currentPage.value - Math.floor(window / 2))
  const end = Math.min(max, start + window - 1)
  start = Math.max(1, end - window + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// Reset to page 1 whenever filters change; clamp page if out of range
watch([filterGender, filterCategory, filterBlood], () => { currentPage.value = 1 })
watch(totalPages, (max) => { if (currentPage.value > max) currentPage.value = max })

// ── Run search (icon click / Enter) ──────────────────────────────────────────
const runSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) return
  errorMsg.value = ''
  activeQuery.value = q
  currentPage.value = 1
  clearFilters()
  try {
    const data = await request<Record<string, any>>(`/patients/search?q=${encodeURIComponent(q)}`)
    searched.value = true
    if (data && data.resourceType === 'Bundle') {
      results.value = (data.entry ?? []).map((e: any) => parseEntry(e.resource))
      total.value = data.total ?? results.value.length
    } else {
      results.value = []
      total.value = 0
    }
  } catch (e: any) {
    errorMsg.value = e?.message || 'Search failed. Please try again.'
    results.value = []
    total.value = 0
    searched.value = true
  }
}

// ── FHIR parsing helpers ──────────────────────────────────────────────────────
const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort()

const identifierBy = (ids: any[] = [], code: string) =>
  ids.find(i => i?.type?.coding?.some((c: any) => c.code === code))?.value ?? ''

const telecomBy = (tel: any[] = [], system: string) =>
  tel.find(t => t?.system === system)?.value ?? ''

const extensionBy = (ext: any[] = [], suffix: string) => {
  const e = ext.find(x => typeof x?.url === 'string' && x.url.endsWith(suffix))
  if (!e) return ''
  return e.valueString ?? e.valueBoolean ?? e.valueDate ?? ''
}

const parseEntry = (r: any = {}): PatientRow => {
  const official = (r.name ?? []).find((n: any) => n.use === 'official') ?? r.name?.[0] ?? {}
  const fullName = official.text
    || [official.given?.join(' '), official.family].filter(Boolean).join(' ')
    || '—'
  return {
    uuid: r.uuid ?? r.id ?? '',
    mrn: identifierBy(r.identifier, 'MR'),
    nationalId: identifierBy(r.identifier, 'NATIONAL_IDENTITY_CARD'),
    fullName,
    gender: r.gender ?? '',
    birthDate: r.birthDate ?? '',
    phone: telecomBy(r.telecom, 'phone'),
    email: telecomBy(r.telecom, 'email'),
    photo: r.profile_photo ?? '',
    bloodGroup: String(extensionBy(r.extension, 'blood-group') || ''),
    category: String(extensionBy(r.extension, 'customer-category') || ''),
    active: r.active ?? false,
  }
}

// ── Age calculation ────────────────────────────────────────────────────────────
const calcAge = (dob: string) => {
  if (!dob) return '—'
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}
</script>

<style scoped>
.filter-select {
  @apply text-sm bg-white/80 border border-outline-variant/50 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all;
}

.page-btn {
  @apply min-w-8 h-8 px-2 rounded-lg border border-outline-variant/50 bg-white/80 text-xs font-bold text-on-surface-variant flex items-center justify-center transition-colors hover:bg-surface-high disabled:opacity-40 disabled:cursor-not-allowed;
}
</style>