<!-- app/pages/orders/test/[uuid].vue -->
<template>
    <div class="max-w-[98%] mx-auto flex flex-col gap-4 sm:gap-5 animate-fade-in min-w-0">

        <!-- Breadcrumb row (breadcrumb left, Advanced Options right) -->
        <div class="flex items-center gap-3 min-w-0">
            <!-- Breadcrumb (pill) -->
            <nav
                class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs sm:text-sm shadow-sm min-w-0 overflow-hidden">
                <NuxtLink to="/orders"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors shrink-0">
                    <font-awesome-icon :icon="['fas', 'vials']" class="text-[11px]" /><span
                        class="hidden sm:inline">Laboratory Orders</span>
                </NuxtLink>
                <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40 shrink-0" />
                <NuxtLink v-if="order" :to="`/orders/${orderUuid}`"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors shrink-0 min-w-0">
                    <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-[11px] text-primary shrink-0" /><span
                        class="truncate">{{ order.accession_number }}</span>
                </NuxtLink>
                <font-awesome-icon v-if="test" :icon="['fas', 'chevron-right']"
                    class="text-[9px] text-outline/40 shrink-0" />
                <span v-if="test"
                    class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold truncate min-w-0">
                    <font-awesome-icon :icon="['fas', 'microscope']" class="text-[11px] text-ribbon-purple shrink-0" />
                    <span class="truncate">{{ test.accession_number }}</span>
                </span>
            </nav>

            <!-- Advanced Options — pinned right of breadcrumb row -->
            <div v-if="test && order" ref="advancedMenuRef" class="relative shrink-0 ml-auto">
                <button type="button" class="tab-pill" :class="{ 'tab-pill-active': advancedMenuOpen }"
                    @click="advancedMenuOpen = !advancedMenuOpen">
                    <font-awesome-icon :icon="['fas', 'sliders']" class="text-xs sm:text-sm shrink-0" />
                    <span class="hidden sm:inline">Advanced Options</span>
                    <font-awesome-icon :icon="['fas', 'chevron-down']"
                        class="text-[10px] shrink-0 transition-transform"
                        :class="{ 'rotate-180': advancedMenuOpen }" />
                </button>

                <Transition name="menu-fade">
                    <div v-if="advancedMenuOpen"
                        class="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-30">
                        <button type="button"
                            class="w-full flex items-center gap-2 px-3 py-2 text-sm sm:text-base text-on-surface hover:bg-surface-low transition-colors"
                            @click="openGrossModal">
                            <font-awesome-icon :icon="['fas', 'flask']" class="text-ribbon-purple shrink-0" />
                            <span>Gross</span>
                        </button>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="g-card flex flex-col items-center justify-center gap-3 py-16 sm:py-20 px-4">
            <font-awesome-icon :icon="['fas', 'circle-notch']" class="text-2xl sm:text-3xl text-primary animate-spin" />
            <p class="text-xs sm:text-sm text-on-surface-variant">Loading test…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error"
            class="g-card flex flex-col items-center justify-center gap-3 py-16 sm:py-20 text-center px-4">
            <div
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-error-container flex items-center justify-center shrink-0">
                <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-xl sm:text-2xl text-error" />
            </div>
            <p class="text-xs sm:text-sm text-on-surface-variant max-w-md break-words">{{ error }}</p>
            <div class="flex flex-wrap justify-center gap-2">
                <NuxtLink :to="`/orders/${orderUuid}`" class="btn-secondary text-sm sm:text-base">
                    <font-awesome-icon :icon="['fas', 'arrow-left']" /><span>Back to order</span>
                </NuxtLink>
                <button type="button" class="btn-secondary text-sm sm:text-base" @click="load">
                    <font-awesome-icon :icon="['fas', 'rotate-right']" /><span>Retry</span>
                </button>
            </div>
        </div>

        <template v-else-if="test && order">

            <!-- ── Patient / order context strip (always visible, above tabs) ─── -->
            <div
                class="g-card px-3 sm:px-6 md:px-8 py-3 sm:py-5 border-l-4 border-ribbon-blue flex flex-wrap items-center justify-between gap-3 min-w-0">
                <div class="min-w-0 flex items-center gap-3 flex-1">
                    <div
                        class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue shrink-0">
                        <font-awesome-icon :icon="['fas', 'user']" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm sm:text-base md:text-lg font-semibold text-on-surface truncate">{{
                            order.patient_name }}</p>
                        <p class="text-xs sm:text-sm text-on-surface-variant truncate">
                            {{ [order.age != null ? `${order.age}y` : null, order.gender,
                            order.department?.name].filter(Boolean).join(' · ') }}
                        </p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <span :class="statusClass(order.status)" class="truncate max-w-[140px] sm:max-w-none">{{
                        titleCase(order.status) }}</span>
                    <span :class="urgencyClass(order.urgency)" class="truncate max-w-[100px] sm:max-w-none">{{
                        order.urgency }}</span>
                </div>
            </div>

            <!-- ── Primary tabs ────────────────────────────────────────────── -->
            <div class="g-card p-1.5 sm:p-2 min-w-0">
                <div class="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scroll-area min-w-0">
                    <button v-for="t in tabs" :key="t.key" type="button" class="tab-pill"
                        :class="{ 'tab-pill-active': tab === t.key }" @click="tab = t.key">
                        <font-awesome-icon :icon="['fas', t.icon]" class="text-xs sm:text-sm shrink-0" />
                        <span>{{ t.label }}</span>
                        <span v-if="t.count !== null" class="tab-pill-count"
                            :class="{ 'tab-pill-count-active': tab === t.key }">{{ t.count }}</span>
                    </button>
                </div>
            </div>

            <!-- ── Overview tab ─────────────────────────────────────────────── -->
            <div v-if="tab === 'overview'" class="flex flex-col gap-4 sm:gap-5 min-w-0">

                <!-- Hero: test identity (now part of Overview) -->
                <div class="g-card p-4 sm:p-6 md:p-8 border-l-4 border-ribbon-purple min-w-0">
                    <div class="flex flex-wrap items-start justify-between gap-4">
                        <div class="min-w-0 flex items-start gap-3 sm:gap-4 flex-1">
                            <div
                                class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple shrink-0">
                                <font-awesome-icon :icon="['fas', 'microscope']" class="text-base sm:text-xl" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <p
                                    class="text-xs sm:text-sm text-ribbon-purple font-bold uppercase tracking-wide truncate">
                                    {{ test.test_code }}</p>
                                <h1
                                    class="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold sm:font-bold leading-snug text-on-surface break-words">
                                    {{ test.test_name }}
                                </h1>
                                <p class="text-sm sm:text-base md:text-lg text-on-surface-variant mt-1 break-words">
                                    {{ test.accession_number }}<span v-if="test.sample_name"> · {{ test.sample_name
                                    }}</span>
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <span :class="statusClass(test.status)" class="truncate max-w-[140px] sm:max-w-none">{{
                                titleCase(test.status) }}</span>
                        </div>
                    </div>
                </div>

                <!-- KPI grid (ribbon accents) -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                    <div class="g-card p-3 sm:p-5 md:p-6 border-l-4 border-ribbon-blue min-w-0">
                        <p
                            class="text-xs sm:text-sm text-ribbon-blue font-bold uppercase tracking-wider mb-1.5 sm:mb-2 truncate">
                            Cassettes submitted</p>
                        <p class="text-lg sm:text-2xl md:text-3xl font-bold sm:font-extrabold text-on-surface truncate">
                            {{ test.total_submitted_cassettes ?? 0 }}</p>
                    </div>
                    <div class="g-card p-3 sm:p-5 md:p-6 border-l-4 border-ribbon-teal min-w-0">
                        <p
                            class="text-xs sm:text-sm text-ribbon-teal font-bold uppercase tracking-wider mb-1.5 sm:mb-2 truncate">
                            Slides submitted</p>
                        <p class="text-lg sm:text-2xl md:text-3xl font-bold sm:font-extrabold text-on-surface truncate">
                            {{ test.total_submitted_slides ?? 0 }}</p>
                    </div>
                    <div class="g-card p-3 sm:p-5 md:p-6 border-l-4 border-ribbon-amber min-w-0">
                        <p
                            class="text-xs sm:text-sm text-ribbon-amber font-bold uppercase tracking-wider mb-1.5 sm:mb-2 truncate">
                            Smears prepared</p>
                        <p class="text-lg sm:text-2xl md:text-3xl font-bold sm:font-extrabold text-on-surface truncate">
                            {{ test.prepared_smears ?? '—' }}</p>
                    </div>
                    <div class="g-card p-3 sm:p-5 md:p-6 border-l-4 border-ribbon-red min-w-0">
                        <p
                            class="text-xs sm:text-sm text-ribbon-red font-bold uppercase tracking-wider mb-1.5 sm:mb-2 truncate">
                            Cellblocks prepared</p>
                        <p class="text-lg sm:text-2xl md:text-3xl font-bold sm:font-extrabold text-on-surface truncate">
                            {{ test.prepared_cellblocks ?? '—' }}</p>
                    </div>
                </div>

                <!-- Sample & processing details / Order snapshot -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                    <div class="g-card p-4 sm:p-6 md:p-8 lg:col-span-2 min-w-0">
                        <h3
                            class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-on-surface mb-3 sm:mb-4 break-words">
                            Sample &amp; processing</h3>
                        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            <Detail label="Sample name" :value="test.sample_name" />
                            <Detail label="Container" :value="test.container" />
                            <Detail label="Sample measurement" :value="test.sample_measurement" />
                            <Detail label="Volume received" :value="test.sample_volume_received" />
                            <Detail label="Verified by" :value="test.verified_by" />
                            <Detail label="Referring facility" :value="order.referring_facility" />
                        </dl>
                    </div>

                    <!-- Order snapshot -->
                    <div class="g-card p-4 sm:p-6 md:p-8 min-w-0">
                        <h3
                            class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-on-surface mb-3 sm:mb-4 break-words">
                            Order snapshot</h3>
                        <dl class="grid grid-cols-1 gap-y-3">
                            <Detail label="Specimen" :value="order.specimen" />
                            <Detail label="Site" :value="order.site" />
                            <Detail label="Scheduled for" :value="fmtDate(order.scheduled_for)" />
                            <Detail label="Requested by" :value="order.requested_by" />
                        </dl>
                    </div>
                </div>

                <!-- Clinical details (only when present) -->
                <div v-if="hasClinicalDetails" class="g-card p-4 sm:p-6 md:p-8 min-w-0">
                    <h3
                        class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-on-surface mb-3 sm:mb-4 break-words">
                        Clinical details</h3>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        <Detail v-for="[k, v] in clinicalDetailsEntries" :key="k" :label="titleCase(k)"
                            :value="v as any" />
                    </dl>
                </div>
            </div>

            <!-- ── Blocks / Slides / Results / Notes tabs ──────────────────────── -->
            <div v-else class="g-card p-4 sm:p-6 md:p-8 min-w-0">
                <GenericRecordList v-if="tab === 'blocks'" :items="test.blocks" empty-icon="cube"
                    empty-text="No blocks recorded yet." accent="blue" />
                <GenericRecordList v-else-if="tab === 'slides'" :items="test.slides" empty-icon="layer-group"
                    empty-text="No slides recorded yet." accent="teal" />
                <GenericRecordList v-else-if="tab === 'results'" :items="test.results" empty-icon="clipboard-check"
                    empty-text="No results recorded yet." accent="purple" />
                <GenericRecordList v-else :items="test.notes" empty-icon="notes-medical"
                    empty-text="No notes recorded yet." accent="amber" />
            </div>
        </template>

        <Modal v-model="grossModalOpen" title="Gross Specimen" :subtitle="test?.accession_number"
            class="w-[900px] max-w-[96vw]">
            <div class="flex flex-col gap-5 sm:gap-6 min-w-0">

                <!-- Specimen label letter -->
                <div class="min-w-0">
                    <label class="input-label">Specimen label</label>
                    <select v-model="grossLabel" class="input-field max-w-[160px]">
                        <option v-for="l in availableLabelLetters" :key="l" :value="l">{{ l }}</option>
                    </select>
                    <p class="text-xs sm:text-sm text-on-surface-variant mt-1 break-words">
                        Applied to every block below (e.g. {{ grossLabel }}1, {{ grossLabel }}2 …).
                    </p>
                </div>

                <!-- Block rows -->
                <div class="flex flex-col gap-4 sm:gap-5">
                    <div v-for="(block, idx) in grossBlocks" :key="block.id"
                        class="p-4 sm:p-5 rounded-xl border border-outline-variant/30 bg-surface-low/40 flex flex-col gap-3 sm:gap-4 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                            <p class="text-sm sm:text-base font-semibold text-on-surface">Block {{ idx + 1 }}</p>
                            <button v-if="grossBlocks.length > 1" type="button"
                                class="w-7 h-7 rounded-full hover:bg-error-container flex items-center justify-center transition-colors shrink-0"
                                @click="removeGrossBlock(idx)">
                                <font-awesome-icon :icon="['fas', 'xmark']" class="text-error text-xs" />
                            </button>
                        </div>

                        <!-- Container type search bar -->
                        <div class="relative min-w-0">
                            <label class="input-label">Container type</label>
                            <div class="relative">
                                <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs sm:text-sm" />
                                <input v-model="block.containerSearch" type="text" class="input-field pl-9"
                                    placeholder="Search container type…" @focus="block.containerOpen = true"
                                    @blur="onContainerBlur(block)" />
                            </div>
                            <div v-if="block.containerOpen && filteredContainerTypes(block.containerSearch).length"
                                class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto scroll-area bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5">
                                <button v-for="ct in filteredContainerTypes(block.containerSearch)" :key="ct.uuid"
                                    type="button"
                                    class="w-full text-left px-3 py-2 hover:bg-surface-low transition-colors"
                                    @mousedown.prevent="selectContainerType(block, ct)">
                                    <p class="text-sm sm:text-base text-on-surface truncate">{{ ct.name }}</p>
                                    <p class="text-xs text-on-surface-variant truncate">{{ ct.code }} · {{ ct.category
                                        }}</p>
                                </button>
                            </div>
                        </div>

                        <!-- Description (rich text) -->
                        <div class="min-w-0">
                            <label class="input-label">Description</label>
                            <ConsultNoteEditor v-model="block.description" placeholder="Gross description…" />
                        </div>

                        <!-- Flags -->
                        <div class="flex flex-wrap items-center gap-4 sm:gap-6">
                            <label class="flex items-center gap-2 text-sm sm:text-base text-on-surface cursor-pointer">
                                <input v-model="block.decalcified" type="checkbox"
                                    class="w-4 h-4 rounded accent-primary" />
                                Decalcified
                            </label>
                            <label class="flex items-center gap-2 text-sm sm:text-base text-on-surface cursor-pointer">
                                <input v-model="block.tissue_embedded" type="checkbox"
                                    class="w-4 h-4 rounded accent-primary" />
                                Tissue embedded
                            </label>
                        </div>
                    </div>
                </div>

                <button type="button" class="btn-secondary self-start text-sm sm:text-base" @click="addGrossBlock">
                    <font-awesome-icon :icon="['fas', 'plus']" /><span>Add another block</span>
                </button>

                <p v-if="grossError" class="text-xs sm:text-sm text-error break-words">{{ grossError }}</p>
            </div>

            <template #footer>
                <button type="button" class="btn-secondary text-sm sm:text-base"
                    @click="grossModalOpen = false">Cancel</button>
                <button type="button" class="btn-primary text-sm sm:text-base" :disabled="grossSubmitting"
                    @click="submitGross">
                    <font-awesome-icon v-if="grossSubmitting" :icon="['fas', 'circle-notch']" class="animate-spin" />
                    <span>{{ grossSubmitting ? 'Submitting…' : 'Submit gross' }}</span>
                </button>
            </template>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import type { LabOrderDetail, LabOrderTest } from '~/composables/useLaboratory'
import type { ContainerType } from '~/composables/useLaboratorySettings'

const route = useRoute()
const { showTest, grossTest } = useLaboratory()
const { getContainerTypes } = useLaboratorySettings()

// Route is /orders/test/[uuid].vue — [uuid] is the TEST uuid.
// The parent ORDER uuid travels as a query param: ?order=<order_uuid>
const testUuid = computed(() => (route.params.uuid as string) || '')
const orderUuid = computed(() => (route.query.order as string) || '')

const order = ref<LabOrderDetail | null>(null)
const test = ref<LabOrderTest | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const tab = ref<TabKey>('overview')

type TabKey = 'overview' | 'blocks' | 'slides' | 'results' | 'notes'

const tabs = computed<{ key: TabKey; label: string; icon: string; count: number | null }[]>(() => [
    { key: 'overview', label: 'Overview', icon: 'chart-simple', count: null },
    { key: 'blocks', label: 'Blocks', icon: 'cube', count: test.value?.blocks?.length || 0 },
    { key: 'slides', label: 'Slides', icon: 'layer-group', count: test.value?.slides?.length || 0 },
    { key: 'results', label: 'Results', icon: 'clipboard-check', count: test.value?.results?.length || 0 },
    { key: 'notes', label: 'Notes', icon: 'notes-medical', count: test.value?.notes?.length || 0 },
])

// ── Gross modal state ───────────────────────────────────────────────────────
interface GrossBlock {
    id: number
    container_type_uuid: string
    containerSearch: string
    containerOpen: boolean
    description: string
    decalcified: boolean
    tissue_embedded: boolean
}

const containerTypes = ref<ContainerType[]>([])
const grossModalOpen = ref(false)
const grossSubmitting = ref(false)
const grossError = ref<string | null>(null)

let grossBlockSeq = 0
const makeGrossBlock = (): GrossBlock => ({
    id: ++grossBlockSeq,
    container_type_uuid: '',
    containerSearch: '',
    containerOpen: false,
    description: '',
    decalcified: false,
    tissue_embedded: false,
})
const grossBlocks = ref<GrossBlock[]>([makeGrossBlock()])

// ── label-letter logic — only the leading letter of existing labels matters
// (A1 / A2 both read as "A"), so a fresh test defaults to "A" and an in-use
// test offers the next free letter(s) up to Z.
const usedLabelLetters = computed(() => {
    const set = new Set<string>()
        ; (test.value?.blocks || []).forEach((b: any) => {
            const m = String(b?.label_range ?? b?.label ?? '').match(/[A-Za-z]/)
            if (m) set.add(m[0].toUpperCase())
        })
    return set
})
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const availableLabelLetters = computed(() => {
    if (usedLabelLetters.value.size === 0) return ['A']
    const free = ALPHABET.filter(l => !usedLabelLetters.value.has(l))
    return free.length ? free : ALPHABET
})
const grossLabel = ref('A')
watch(availableLabelLetters, (letters) => {
    if (!letters.includes(grossLabel.value)) grossLabel.value = letters[0] ?? 'A'
}, { immediate: true })

const openGrossModal = () => {
    advancedMenuOpen.value = false
    grossError.value = null
    grossBlocks.value = [makeGrossBlock()]
    grossModalOpen.value = true
    if (!containerTypes.value.length) loadContainerTypes()
}
const loadContainerTypes = async () => {
    try {
        const res = await getContainerTypes()
        containerTypes.value = Array.isArray(res) ? res : (res?.data ?? [])
    } catch {
        containerTypes.value = []
    }
}
const filteredContainerTypes = (search: string) => {
    const q = search.trim().toLowerCase()
    const active = containerTypes.value.filter(c => c.active)
    if (!q) return active
    return active.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
}
const selectContainerType = (block: GrossBlock, ct: ContainerType) => {
    block.container_type_uuid = ct.uuid
    block.containerSearch = ct.name
    block.containerOpen = false
}
// small delay so a click on a dropdown option registers before blur closes it
const onContainerBlur = (block: GrossBlock) => {
    setTimeout(() => { block.containerOpen = false }, 150)
}

const addGrossBlock = () => { grossBlocks.value.push(makeGrossBlock()) }
const removeGrossBlock = (idx: number) => { grossBlocks.value.splice(idx, 1) }

const submitGross = async () => {
    grossError.value = null
    if (!grossBlocks.value.every(b => b.container_type_uuid)) {
        grossError.value = 'Select a container type for every block.'
        return
    }
    grossSubmitting.value = true
    try {
        const payload = grossBlocks.value.map(b => ({
            laboratory_order_test_container_type_uuid: b.container_type_uuid,
            label_range: grossLabel.value,
            description: b.description,
            decalcified: b.decalcified,
            ...(b.tissue_embedded ? { tissue_embedded: true } : {}),
        }))
        const res = await grossTest(orderUuid.value, testUuid.value, payload)
        order.value = res?.order ?? order.value
        test.value = res?.test ?? test.value
        grossModalOpen.value = false
        tab.value = 'blocks'
    } catch (e: any) {
        grossError.value = e?.message ?? 'Failed to submit gross. Please try again.'
    } finally {
        grossSubmitting.value = false
    }
}

// ── Advanced options menu — close on outside click ──────────────────────────
const advancedMenuOpen = ref(false)
const advancedMenuRef = ref<HTMLElement | null>(null)
const onDocClick = (e: MouseEvent) => {
    if (advancedMenuOpen.value && advancedMenuRef.value && !advancedMenuRef.value.contains(e.target as Node)) {
        advancedMenuOpen.value = false
    }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const load = async () => {
    if (!orderUuid.value || !testUuid.value) { error.value = 'No test selected.'; loading.value = false; return }
    loading.value = true
    error.value = null
    try {
        const res = await showTest(orderUuid.value, testUuid.value)
        order.value = res?.order ?? null
        test.value = res?.test ?? null
        if (!test.value) error.value = 'Test not found.'
    } catch (e: any) {
        error.value = e?.message ?? 'Failed to load the test. Please try again.'
    } finally {
        loading.value = false
    }
}
onMounted(load)

// ── clinical details (order.clinical_details is a free-form object) ──────────
const clinicalDetailsEntries = computed(() =>
    Object.entries(order.value?.clinical_details || {}).filter(([, v]) => v !== null && v !== undefined && v !== ''),
)
const hasClinicalDetails = computed(() => clinicalDetailsEntries.value.length > 0)

// ── formatting (mirrors app/pages/orders/[uuid].vue) ──────────────────────────
const fmtDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const titleCase = (s: string | null | undefined) =>
    (s || '—').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const statusClass = (s: string) => {
    const k = (s || '').toLowerCase()
    if (k.includes('cancel') || k.includes('no show') || k.includes('no_show')) return 'ribbon-chip-red'
    if (k.includes('complete') || k.includes('received') || k.includes('verified')) return 'ribbon-chip-teal'
    if (k.includes('progress') || k.includes('collected')) return 'ribbon-chip-amber'
    return 'ribbon-chip-blue'
}
const urgencyClass = (u: string) => {
    const k = (u || '').toLowerCase()
    if (k === 'stat' || k === 'high') return 'ribbon-chip-red'
    if (k === 'medium') return 'ribbon-chip-amber'
    return 'ribbon-chip-teal'
}

// ── tiny inline detail renderer (label + value) ──────────────────────────────
const Detail = (props: { label: string; value: string | number | null | undefined }) =>
    h('div', { class: 'min-w-0' }, [
        h('dt', { class: 'text-xs sm:text-sm font-semibold uppercase tracking-wide text-on-surface-variant truncate' }, props.label),
        h('dd', { class: 'text-sm sm:text-base md:text-lg text-on-surface mt-0.5 break-words' },
            props.value === null || props.value === undefined || props.value === '' ? '—' : String(props.value)),
    ])

// ── generic record list renderer for blocks/slides/results/notes ─────────────
// Each of these arrays has an unknown/variable shape server-side, so render a
// simple key/value card per item rather than assuming fixed columns.
const ACCENTS: Record<string, string> = {
    blue: 'border-ribbon-blue bg-ribbon-blue/5',
    teal: 'border-ribbon-teal bg-ribbon-teal/5',
    purple: 'border-ribbon-purple bg-ribbon-purple/5',
    amber: 'border-ribbon-amber bg-ribbon-amber/5',
    red: 'border-ribbon-red bg-ribbon-red/5',
}
const GenericRecordList = (props: { items: any[] | null | undefined; emptyIcon: string; emptyText: string; accent: string }) => {
    const items = props.items || []
    if (!items.length) {
        return h('div', { class: 'text-center py-8 sm:py-10 px-4' }, [
            h('font-awesome-icon' as any, { icon: ['fas', props.emptyIcon], class: 'text-xl sm:text-2xl text-outline/40 mb-2 block mx-auto' }),
            h('p', { class: 'text-sm sm:text-base text-on-surface-variant break-words' }, props.emptyText),
        ])
    }
    return h('div', { class: 'space-y-2 max-h-[420px] overflow-y-auto scroll-area pr-1' },
        items.map((it, i) => {
            if (typeof it === 'string') {
                return h('div', {
                    key: i,
                    class: `p-3 rounded-xl border-l-4 ${ACCENTS[props.accent] || ACCENTS.blue} text-sm sm:text-base text-on-surface break-words min-w-0`,
                }, it)
            }
            const entries = Object.entries(it || {}).filter(([, v]) => v !== null && v !== undefined && v !== '')
            return h('div', { key: i, class: `p-3 rounded-xl border-l-4 ${ACCENTS[props.accent] || ACCENTS.blue} min-w-0` },
                h('dl', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5' },
                    entries.map(([k, v]) => h('div', { key: k, class: 'min-w-0' }, [
                        h('dt', { class: 'text-xs font-semibold uppercase tracking-wide text-on-surface-variant truncate' }, titleCase(k)),
                        h('dd', { class: 'text-xs sm:text-sm text-on-surface break-words' }, typeof v === 'object' ? JSON.stringify(v) : String(v)),
                    ])),
                ),
            )
        }),
    )
}
</script>

<style scoped>
/* ── Glass card — identical to inventory/department.vue ───────────────────── */
.g-card {
    position: relative;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 1.5rem;
    box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.4);
    animation: island-in 0.5s ease-out backwards;
    overflow: hidden;
}

/* ── Custom scrollbar for record lists ─────────────────────────────────────── */
.scroll-area::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.scroll-area::-webkit-scrollbar-thumb {
    background: rgba(61, 127, 191, 0.2);
    border-radius: 10px;
}

.scroll-area {
    scrollbar-width: thin;
    scrollbar-color: rgba(61, 127, 191, 0.2) transparent;
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

.tab-pill {
    @apply inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-medium text-on-surface-variant whitespace-nowrap shrink-0 cursor-pointer select-none transition-all duration-200 hover:bg-surface-low hover:text-on-surface;
}

.tab-pill-active {
    @apply bg-primary-gradient text-white shadow-island-active hover:bg-primary-gradient hover:text-white;
}

.tab-pill-count {
    @apply inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant;
}

.tab-pill-count-active {
    @apply bg-white/25 text-white;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>