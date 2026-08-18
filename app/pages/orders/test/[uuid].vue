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
                <button type="button" class="tab-pill bg-white/80 border border-white/50"
                    :class="{ 'tab-pill-active': advancedMenuOpen }" @click="advancedMenuOpen = !advancedMenuOpen">
                    <font-awesome-icon :icon="['fas', 'sliders']" class="text-xs sm:text-sm shrink-0" />
                    <span class="hidden sm:inline">Actions</span>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] shrink-0 transition-transform"
                        :class="{ 'rotate-180': advancedMenuOpen }" />
                </button>

                <Transition name="menu-fade">
                    <div v-if="advancedMenuOpen"
                        class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-30">
                        <button type="button"
                            class="w-full flex items-center gap-2 px-3 py-2 text-sm sm:text-base text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            :disabled="!canGross" :title="canGross ? '' : 'Grossing station is not planned'"
                            @click="canGross && (openGrossModal(), advancedMenuOpen = false)">
                            <font-awesome-icon :icon="['fas', 'flask']" class="text-ribbon-purple shrink-0" />
                            <span>Gross</span>
                        </button>

                        <div class="my-1 border-t border-outline-variant/40"></div>

                        <button type="button"
                            class="w-full flex items-center gap-2 px-3 py-2 text-sm sm:text-base text-on-surface hover:bg-surface-low transition-colors"
                            @click="openResultWizard(); advancedMenuOpen = false">
                            <font-awesome-icon :icon="['fas', 'clipboard-check']" class="text-ribbon-blue shrink-0" />
                            <span>Record result</span>
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

                <!-- Hero: identity + status flag on a gradient rail -->
                <div class="relative overflow-hidden g-card p-0 min-w-0">
                    <div class="h-2 bg-frame-gradient"></div>
                    <div class="p-4 sm:p-6 md:p-8 flex flex-wrap items-start justify-between gap-4">
                        <div class="min-w-0 flex items-start gap-3 sm:gap-4 flex-1">
                            <div
                                class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-gradient flex items-center justify-center text-white shadow-lg shadow-primary/25 shrink-0">
                                <font-awesome-icon :icon="['fas', 'microscope']" class="text-lg sm:text-xl" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-ribbon-purple/15 text-ribbon-purple font-mono">{{
                                            test.test_code }}</span>
                                    <span :class="statusClass(test.status)" class="!py-0.5 !px-2 !text-[10px]">{{
                                        titleCase(test.status) }}</span>
                                </div>
                                <h1
                                    class="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-snug text-on-surface break-words">
                                    {{ test.test_name }}
                                </h1>
                                <p class="text-sm sm:text-base text-on-surface-variant mt-1 break-words">
                                    <span class="font-mono font-semibold text-ribbon-blue">{{ test.accession_number
                                    }}</span>
                                    <span v-if="test.sample_name" class="text-outline"> · {{ test.sample_name }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Patient / clinician / turnaround strip -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">

                    <!-- Requested by -->
                    <div class="g-card p-4 sm:p-5 min-w-0 border-l-4 border-ribbon-teal">
                        <div class="flex items-center gap-2 mb-3">
                            <div
                                class="w-9 h-9 rounded-xl bg-ribbon-teal/15 text-ribbon-teal flex items-center justify-center shrink-0">
                                <font-awesome-icon :icon="['fas', 'user-doctor']" />
                            </div>
                            <p class="text-[10px] font-bold text-ribbon-teal uppercase tracking-wider">Requested by</p>
                        </div>
                        <p class="text-base font-bold text-on-surface break-words leading-tight">{{ order.requested_by
                            || '—' }}</p>
                        <p class="text-[11px] text-on-surface-variant mt-1 break-words">{{ order.referring_facility ||
                            '—' }}</p>
                    </div>

                    <!-- Urgency + disposition -->
                    <div class="g-card p-4 sm:p-5 min-w-0 border-l-4 border-ribbon-amber">
                        <div class="flex items-center gap-2 mb-3">
                            <div
                                class="w-9 h-9 rounded-xl bg-ribbon-amber/15 text-ribbon-amber flex items-center justify-center shrink-0">
                                <font-awesome-icon :icon="['fas', 'bolt']" />
                            </div>
                            <p class="text-[10px] font-bold text-ribbon-amber uppercase tracking-wider">Handling</p>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            <span
                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-ribbon-amber/15 text-ribbon-amber">
                                {{ order.urgency || '—' }}
                            </span>
                            <span v-if="order.disposition"
                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-ribbon-purple/10 text-ribbon-purple">
                                {{ order.disposition }}
                            </span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant mt-2">
                            Scheduled {{ fmtDate(order.scheduled_for) }}
                        </p>
                    </div>
                </div>

                <!-- Coloured KPI ribbon -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div
                        class="g-card p-4 sm:p-5 min-w-0 bg-gradient-to-br from-ribbon-blue/10 to-transparent border-l-4 border-ribbon-blue">
                        <div class="flex items-center gap-2 mb-2">
                            <font-awesome-icon :icon="['fas', 'cube']" class="text-ribbon-blue text-sm" />
                            <p
                                class="text-[10px] sm:text-xs font-bold text-ribbon-blue uppercase tracking-wider truncate">
                                Cassettes</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ test.total_submitted_cassettes
                            ?? 0 }}</p>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">submitted</p>
                    </div>
                    <div
                        class="g-card p-4 sm:p-5 min-w-0 bg-gradient-to-br from-ribbon-teal/10 to-transparent border-l-4 border-ribbon-teal">
                        <div class="flex items-center gap-2 mb-2">
                            <font-awesome-icon :icon="['fas', 'layer-group']" class="text-ribbon-teal text-sm" />
                            <p
                                class="text-[10px] sm:text-xs font-bold text-ribbon-teal uppercase tracking-wider truncate">
                                Slides</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ test.total_submitted_slides ??
                            0 }}</p>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">submitted</p>
                    </div>
                    <div
                        class="g-card p-4 sm:p-5 min-w-0 bg-gradient-to-br from-ribbon-amber/10 to-transparent border-l-4 border-ribbon-amber">
                        <div class="flex items-center gap-2 mb-2">
                            <font-awesome-icon :icon="['fas', 'droplet']" class="text-ribbon-amber text-sm" />
                            <p
                                class="text-[10px] sm:text-xs font-bold text-ribbon-amber uppercase tracking-wider truncate">
                                Smears</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ test.prepared_smears ?? '—' }}
                        </p>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">prepared</p>
                    </div>
                    <div
                        class="g-card p-4 sm:p-5 min-w-0 bg-gradient-to-br from-ribbon-red/10 to-transparent border-l-4 border-ribbon-red">
                        <div class="flex items-center gap-2 mb-2">
                            <font-awesome-icon :icon="['fas', 'vial']" class="text-ribbon-red text-sm" />
                            <p
                                class="text-[10px] sm:text-xs font-bold text-ribbon-red uppercase tracking-wider truncate">
                                Cellblocks</p>
                        </div>
                        <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ test.prepared_cellblocks ??
                            '—' }}</p>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">prepared</p>
                    </div>
                </div>

                <!-- Sample & processing + specimen journey -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                    <div class="g-card p-4 sm:p-6 lg:col-span-2 min-w-0">
                        <div class="flex items-center gap-2.5 mb-4">
                            <div
                                class="w-10 h-10 rounded-xl bg-ribbon-purple/15 text-ribbon-purple flex items-center justify-center shrink-0">
                                <font-awesome-icon :icon="['fas', 'flask']" />
                            </div>
                            <div>
                                <h3 class="text-base sm:text-lg font-bold text-on-surface">Sample &amp; processing</h3>
                                <p class="text-[11px] text-on-surface-variant">How the specimen was received and
                                    prepared</p>
                            </div>
                        </div>
                        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            <Detail label="Sample name" :value="test.sample_name" />
                            <Detail label="Container" :value="test.container" />
                            <Detail label="Sample measurement" :value="test.sample_measurement" />
                            <Detail label="Volume received" :value="test.sample_volume_received" />
                            <Detail label="Verified by" :value="test.verified_by" />
                            <Detail label="Received by" :value="order.received_by" />
                        </dl>
                    </div>

                    <!-- Specimen journey timeline -->
                    <div class="g-card p-4 sm:p-6 min-w-0">
                        <div class="flex items-center gap-2.5 mb-4">
                            <div
                                class="w-10 h-10 rounded-xl bg-ribbon-teal/15 text-ribbon-teal flex items-center justify-center shrink-0">
                                <font-awesome-icon :icon="['fas', 'route']" />
                            </div>
                            <h3 class="text-base sm:text-lg font-bold text-on-surface">Specimen journey</h3>
                        </div>
                        <ol class="relative border-l-2 border-outline-variant/40 ml-3 space-y-4">
                            <li class="pl-4">
                                <span
                                    class="absolute -left-[9px] w-4 h-4 rounded-full bg-ribbon-teal ring-4 ring-white"></span>
                                <p class="text-[10px] font-bold text-ribbon-teal uppercase tracking-wider">Collected</p>
                                <p class="text-sm text-on-surface font-semibold">{{ fmtDate(order.collection_time) }}
                                </p>
                            </li>
                            <li class="pl-4">
                                <span
                                    class="absolute -left-[9px] w-4 h-4 rounded-full bg-ribbon-blue ring-4 ring-white"></span>
                                <p class="text-[10px] font-bold text-ribbon-blue uppercase tracking-wider">Received</p>
                                <p class="text-sm text-on-surface font-semibold">{{ fmtDate(order.reception_time) }}</p>
                                <p v-if="order.received_by" class="text-[11px] text-on-surface-variant">by {{
                                    order.received_by }}</p>
                            </li>
                            <li class="pl-4">
                                <span
                                    class="absolute -left-[9px] w-4 h-4 rounded-full bg-ribbon-purple ring-4 ring-white"></span>
                                <p class="text-[10px] font-bold text-ribbon-purple uppercase tracking-wider">Scheduled
                                </p>
                                <p class="text-sm text-on-surface font-semibold">{{ fmtDate(order.scheduled_for) }}</p>
                            </li>
                        </ol>
                    </div>
                </div>

                <!-- Clinical details (only when present) -->
                <div v-if="hasClinicalDetails" class="g-card p-4 sm:p-6 min-w-0 border-l-4 border-ribbon-amber">
                    <div class="flex items-center gap-2.5 mb-3">
                        <div
                            class="w-9 h-9 rounded-xl bg-ribbon-amber/15 text-ribbon-amber flex items-center justify-center shrink-0">
                            <font-awesome-icon :icon="['fas', 'notes-medical']" />
                        </div>
                        <h3 class="text-base sm:text-lg font-bold text-on-surface">Clinical details</h3>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <span v-for="[k, v] in clinicalDetailsEntries" :key="k"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ribbon-amber/10 text-on-surface text-xs sm:text-sm">
                            <span class="font-bold text-ribbon-amber">{{ titleCase(k) }}:</span>
                            <span class="break-words">{{ v }}</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- ── Blocks / Slides / Results / Notes tabs ──────────────────────── -->
            <div v-else class="g-card p-4 sm:p-6 md:p-8 min-w-0">

                <!-- Blocks tab: selectable grid + bulk section action -->
                <!-- ── Blocks tab: selectable grid + bulk section action ────────────── -->
                <template v-if="tab === 'blocks'">
                    <div v-if="!test.blocks?.length" class="text-center py-12 px-4">
                        <div
                            class="w-14 h-14 rounded-2xl bg-ribbon-purple/10 flex items-center justify-center mx-auto mb-3">
                            <font-awesome-icon :icon="['fas', 'cube']" class="text-xl text-ribbon-purple/60" />
                        </div>
                        <p class="text-sm sm:text-base font-semibold text-on-surface">No blocks recorded yet</p>
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                            Gross the specimen to create the first block.
                        </p>
                    </div>

                    <template v-else>
                        <!-- Sticky selection toolbar -->
                        <div
                            class="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4 sm:mb-5 bg-white/95 backdrop-blur border-b border-outline-variant/40 rounded-t-2xl flex items-center justify-between gap-3 flex-wrap min-w-0">
                            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                                <button type="button" @click="toggleSelectAllBlocks"
                                    class="inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border font-semibold text-xs sm:text-sm transition-all"
                                    :class="allBlocksSelected
                                        ? 'bg-ribbon-blue text-white border-ribbon-blue shadow-sm'
                                        : (someBlocksSelected
                                            ? 'bg-ribbon-blue/10 text-ribbon-blue border-ribbon-blue/40'
                                            : 'bg-white text-on-surface-variant border-outline-variant hover:border-ribbon-blue/40 hover:text-ribbon-blue')">
                                    <span
                                        class="w-5 h-5 rounded-md flex items-center justify-center border transition-colors"
                                        :class="allBlocksSelected
                                            ? 'bg-white border-white text-ribbon-blue'
                                            : (someBlocksSelected
                                                ? 'bg-ribbon-blue border-ribbon-blue text-white'
                                                : 'border-outline-variant text-transparent')">
                                        <font-awesome-icon v-if="allBlocksSelected" :icon="['fas', 'check']"
                                            class="text-[10px]" />
                                        <font-awesome-icon v-else-if="someBlocksSelected" :icon="['fas', 'minus']"
                                            class="text-[10px]" />
                                    </span>
                                    <span>{{ allBlocksSelected ? 'Deselect all' : 'Select all' }}</span>
                                </button>

                                <div class="flex items-baseline gap-2 min-w-0">
                                    <span class="text-sm font-semibold text-on-surface">
                                        {{ selectedBlockUuids.size ? `${selectedBlockUuids.size} selected` : '' }}
                                    </span>
                                    <span class="text-[11px] text-on-surface-variant">
                                        {{ test.blocks.length }} total
                                    </span>
                                </div>
                            </div>

                            <!-- Bulk actions ellipsis — only when ≥1 selected -->
                            <div v-if="selectedBlockUuids.size" ref="bulkMenuRef" class="relative shrink-0">
                                <button type="button"
                                    class="inline-flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl bg-primary-gradient text-white shadow-island-active text-xs sm:text-sm font-semibold transition-all hover:opacity-95 active:scale-[0.98]"
                                    :class="{ 'ring-2 ring-white/40': bulkMenuOpen }"
                                    @click="bulkMenuOpen = !bulkMenuOpen">
                                    <span>Actions</span>
                                    <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" class="text-xs" />
                                </button>
                                <Transition name="menu-fade">
                                    <div v-if="bulkMenuOpen"
                                        class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-30">
                                        <button type="button"
                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors"
                                            @click="openSectionModal">
                                            <span
                                                class="w-7 h-7 rounded-lg bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal shrink-0">
                                                <font-awesome-icon :icon="['fas', 'layer-group']" class="text-xs" />
                                            </span>
                                            <div class="min-w-0 text-left">
                                                <p class="font-semibold leading-tight">Section</p>
                                                <p class="text-[11px] text-on-surface-variant leading-tight">Produce
                                                    slides from selection</p>
                                            </div>
                                        </button>
                                    </div>
                                </Transition>
                            </div>
                        </div>

                        <!-- Blocks grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            <div v-for="block in test.blocks" :key="block.uuid" class="block-card group"
                                :class="{ 'block-card--selected': selectedBlockUuids.has(block.uuid) }"
                                @click="toggleBlockSelection(block.uuid)">

                                <!-- Floating check confirmation — visible only when selected -->
                                <span v-if="selectedBlockUuids.has(block.uuid)" class="block-card__selected-badge"
                                    aria-hidden="true">
                                    <font-awesome-icon :icon="['fas', 'check']" class="text-[9px]" />
                                </span>

                                <!-- ── Header row: checkbox + label chip + menu ─────────── -->
                                <div class="flex items-center justify-between gap-2 mb-3 min-w-0">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <span class="checkbox-btn"
                                            :class="{ 'checkbox-btn--checked': selectedBlockUuids.has(block.uuid) }"
                                            aria-hidden="true">
                                            <font-awesome-icon v-if="selectedBlockUuids.has(block.uuid)"
                                                :icon="['fas', 'check']" class="text-[10px] text-white" />
                                        </span>
                                        <span
                                            class="inline-flex items-center justify-center px-2.5 h-8 rounded-lg bg-gradient-to-br from-ribbon-purple to-ribbon-blue text-white text-xs font-bold shadow-sm shrink-0 tracking-wide">
                                            {{ block.label }}
                                        </span>
                                        <span :class="statusClass(block.status)"
                                            class="!py-0.5 !px-2 !text-[10px] shrink-0">
                                            {{ titleCase(block.status) }}
                                        </span>
                                    </div>

                                    <!-- Ellipsis menu -->
                                    <div class="relative shrink-0" @click.stop>
                                        <button type="button"
                                            class="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface flex items-center justify-center transition-colors"
                                            :class="{ 'bg-surface-low text-on-surface': cardMenuOpen === block.uuid }"
                                            :aria-label="`Actions for ${block.part}`"
                                            @click="cardMenuOpen = cardMenuOpen === block.uuid ? null : block.uuid">
                                            <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" class="text-xs" />
                                        </button>
                                        <Transition name="menu-fade">
                                            <div v-if="cardMenuOpen === block.uuid"
                                                class="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-20">
                                                <button type="button"
                                                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    :disabled="!block.cassette_label?.url"
                                                    @click="downloadCassetteLabel(block); cardMenuOpen = null">
                                                    <span
                                                        class="w-7 h-7 rounded-lg bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue shrink-0">
                                                        <font-awesome-icon :icon="['fas', 'download']"
                                                            class="text-xs" />
                                                    </span>
                                                    <div class="min-w-0 text-left">
                                                        <p class="font-semibold leading-tight">Download</p>
                                                        <p class="text-[11px] text-on-surface-variant leading-tight">
                                                            Cassette label file</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </Transition>
                                    </div>
                                </div>

                                <!-- ── Cassette label preview (compact) ─────────────────── -->
                                <div class="rounded-xl border border-outline-variant/30 bg-white overflow-hidden mb-3">
                                    <div
                                        class="relative bg-gradient-to-br from-primary-fixed/40 to-surface-low aspect-[5/2] flex items-center justify-center">
                                        <img v-if="block.cassette_label?.preview_url"
                                            :src="block.cassette_label.preview_url"
                                            :alt="`Cassette label ${block.part}`"
                                            class="max-h-full max-w-full object-contain p-1.5" loading="lazy" />
                                        <div v-else class="flex items-center gap-1.5 text-outline">
                                            <font-awesome-icon :icon="['fas', 'image']" class="text-sm" />
                                            <span class="text-[11px]">No preview</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- ── Part ─────────────────────────────────────────────── -->
                                <div class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-0.5">
                                        Part</p>
                                    <p class="text-sm font-semibold text-on-surface font-mono truncate">{{ block.part }}
                                    </p>
                                </div>

                                <!-- ── Description ──────────────────────────────────────── -->
                                <div v-if="block.description" class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-0.5">
                                        Description</p>
                                    <p class="text-xs sm:text-sm text-on-surface line-clamp-3 break-words">
                                        {{ block.description }}
                                    </p>
                                </div>

                                <!-- ── Grossed by ───────────────────────────────────────── -->
                                <div class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-0.5">
                                        Grossed by</p>
                                    <p class="text-xs sm:text-sm text-on-surface flex items-center gap-1.5 truncate">
                                        <font-awesome-icon :icon="['fas', 'user-doctor']"
                                            class="text-ribbon-teal text-[10px] shrink-0" />
                                        <span class="truncate">{{ block.grossed_by || '—' }}</span>
                                    </p>
                                </div>

                                <!-- ── Flags footer ─────────────────────────────────────── -->
                                <div v-if="block.decalcified || block.tissue_embedded"
                                    class="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-outline-variant/30">
                                    <span v-if="block.decalcified"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-ribbon-purple/10 text-ribbon-purple">
                                        <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[9px]" />
                                        Decalcified
                                    </span>
                                    <span v-if="block.tissue_embedded"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-ribbon-teal/10 text-ribbon-teal">
                                        <font-awesome-icon :icon="['fas', 'check-circle']" class="text-[9px]" />
                                        Tissue embedded
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>

                <!-- ── Slides tab ────────────────────────────────────────────────── -->
                <template v-else-if="tab === 'slides'">
                    <div v-if="!test.slides?.length" class="text-center py-12 px-4">
                        <div
                            class="w-14 h-14 rounded-2xl bg-ribbon-teal/10 flex items-center justify-center mx-auto mb-3">
                            <font-awesome-icon :icon="['fas', 'layer-group']" class="text-xl text-ribbon-teal/60" />
                        </div>
                        <p class="text-sm sm:text-base font-semibold text-on-surface">No slides recorded yet</p>
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                            Section one or more blocks to produce slides.
                        </p>
                    </div>

                    <template v-else>
                        <!-- Toolbar -->
                        <div
                            class="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4 sm:mb-5 bg-white/95 backdrop-blur border-b border-outline-variant/40 rounded-t-2xl flex items-center justify-between gap-3 flex-wrap min-w-0">
                            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                                <button type="button" @click="toggleSelectAllSlides"
                                    class="inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border font-semibold text-xs sm:text-sm transition-all"
                                    :class="allSlidesSelected
                                        ? 'bg-ribbon-blue text-white border-ribbon-blue shadow-sm'
                                        : (someSlidesSelected
                                            ? 'bg-ribbon-blue/10 text-ribbon-blue border-ribbon-blue/40'
                                            : 'bg-white text-on-surface-variant border-outline-variant hover:border-ribbon-blue/40 hover:text-ribbon-blue')">
                                    <span
                                        class="w-5 h-5 rounded-md flex items-center justify-center border transition-colors"
                                        :class="allSlidesSelected
                                            ? 'bg-white border-white text-ribbon-blue'
                                            : (someSlidesSelected
                                                ? 'bg-ribbon-blue border-ribbon-blue text-white'
                                                : 'border-outline-variant text-transparent')">
                                        <font-awesome-icon v-if="allSlidesSelected" :icon="['fas', 'check']"
                                            class="text-[10px]" />
                                        <font-awesome-icon v-else-if="someSlidesSelected" :icon="['fas', 'minus']"
                                            class="text-[10px]" />
                                    </span>
                                    <span>{{ allSlidesSelected ? 'Deselect all' : 'Select all' }}</span>
                                </button>

                                <div class="flex items-baseline gap-2 min-w-0">
                                    <span class="text-sm font-semibold text-on-surface">
                                        {{ selectedSlideUuids.size ? `${selectedSlideUuids.size} selected` : '' }}
                                    </span>
                                    <span class="text-[11px] text-on-surface-variant">
                                        {{ test.slides.length }} total
                                    </span>
                                </div>
                            </div>

                            <div v-if="selectedSlideUuids.size" ref="slidesBulkMenuRef" class="relative shrink-0">
                                <button type="button"
                                    class="inline-flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl bg-primary-gradient text-white shadow-island-active text-xs sm:text-sm font-semibold transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                                    :class="{ 'ring-2 ring-white/40': slidesBulkMenuOpen }" :disabled="staining"
                                    @click="slidesBulkMenuOpen = !slidesBulkMenuOpen">
                                    <font-awesome-icon v-if="staining" :icon="['fas', 'circle-notch']"
                                        class="animate-spin text-xs" />
                                    <span>{{ staining ? 'Staining…' : 'Actions' }}</span>
                                    <font-awesome-icon v-if="!staining" :icon="['fas', 'ellipsis-vertical']"
                                        class="text-xs" />
                                </button>
                                <Transition name="menu-fade">
                                    <div v-if="slidesBulkMenuOpen"
                                        class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-30">
                                        <button type="button"
                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            :disabled="!canStain || staining"
                                            :title="canStain ? '' : 'Staining station is not planned'"
                                            @click="canStain && runStainSelected()">
                                            <span
                                                class="w-7 h-7 rounded-lg bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple shrink-0">
                                                <font-awesome-icon :icon="['fas', 'droplet']" class="text-xs" />
                                            </span>
                                            <div class="min-w-0 text-left">
                                                <p class="font-semibold leading-tight">Stain</p>
                                                <p class="text-[11px] text-on-surface-variant leading-tight">Mark
                                                    selected slides stained</p>
                                            </div>
                                        </button>

                                        <div class="my-1 border-t border-outline-variant/40"></div>

                                        <button type="button"
                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            :disabled="!canImage || imaging"
                                            :title="canImage ? '' : 'Imaging station is not planned'"
                                            @click="canImage && openImageModal()">
                                            <span
                                                class="w-7 h-7 rounded-lg bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal shrink-0">
                                                <font-awesome-icon v-if="imaging" :icon="['fas', 'circle-notch']"
                                                    class="animate-spin text-xs" />
                                                <font-awesome-icon v-else :icon="['fas', 'camera']" class="text-xs" />
                                            </span>
                                            <div class="min-w-0 text-left">
                                                <p class="font-semibold leading-tight">{{ imaging ? 'Uploading…' : 'Add slide images' }}</p>
                                                <p class="text-[11px] text-on-surface-variant leading-tight">
                                                    Paste an image URL for each selected slide
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </Transition>
                            </div>
                        </div>

                        <!-- Error -->
                        <div v-if="stainError"
                            class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20 mb-4 min-w-0">
                            <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                                class="text-error text-sm mt-0.5 shrink-0" />
                            <p class="text-xs sm:text-sm text-error break-words">{{ stainError }}</p>
                        </div>

                        <div v-if="imageError"
                            class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20 mb-4 min-w-0">
                            <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                                class="text-error text-sm mt-0.5 shrink-0" />
                            <p class="text-xs sm:text-sm text-error break-words">{{ imageError }}</p>
                        </div>

                        <!-- Grid -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            <div v-for="slide in test.slides" :key="slide.uuid"
                                class="block-card block-card--teal group"
                                :class="{ 'block-card--selected block-card--selected-teal': selectedSlideUuids.has(slide.uuid) }"
                                @click="toggleSlideSelection(slide.uuid)">

                                <!-- Floating check confirmation -->
                                <span v-if="selectedSlideUuids.has(slide.uuid)"
                                    class="block-card__selected-badge block-card__selected-badge--teal"
                                    aria-hidden="true">
                                    <font-awesome-icon :icon="['fas', 'check']" class="text-[9px]" />
                                </span>

                                <!-- Header: checkbox + label chip + status -->
                                <div class="flex items-center justify-between gap-2 mb-3 min-w-0">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <span class="checkbox-btn"
                                            :class="{ 'checkbox-btn--checked': selectedSlideUuids.has(slide.uuid) }"
                                            aria-hidden="true">
                                            <font-awesome-icon v-if="selectedSlideUuids.has(slide.uuid)"
                                                :icon="['fas', 'check']" class="text-[10px] text-white" />
                                        </span>
                                        <span
                                            class="inline-flex items-center justify-center px-2.5 h-8 rounded-lg bg-gradient-to-br from-ribbon-teal to-ribbon-blue text-white text-xs font-bold shadow-sm shrink-0 tracking-wide">
                                            {{ slide.label }}
                                        </span>
                                        <span :class="statusClass(slide.status)"
                                            class="!py-0.5 !px-2 !text-[10px] shrink-0">
                                            {{ titleCase(slide.status) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Slide image — click to open in the external viewer -->
                                <div
                                    class="rounded-xl border border-outline-variant/30 bg-white overflow-hidden mb-3 relative">
                                    <div class="relative bg-gradient-to-br from-secondary-fixed/40 to-surface-low aspect-[5/2] flex items-center justify-center group/img"
                                        :class="slideImageSrc(slide) ? 'cursor-zoom-in' : ''"
                                        :role="slideImageSrc(slide) ? 'button' : undefined"
                                        :tabindex="slideImageSrc(slide) ? 0 : undefined"
                                        :aria-label="slideImageSrc(slide) ? `View slide ${slide.label}` : undefined"
                                        @click.stop="slideImageSrc(slide) && openSlideViewer(slide)"
                                        @keydown.enter.stop.prevent="slideImageSrc(slide) && openSlideViewer(slide)"
                                        @keydown.space.stop.prevent="slideImageSrc(slide) && openSlideViewer(slide)">

                                       <!-- Actual image -->
                                        <img v-if="slideImageState(slide) === 'ok'" :src="slideImageSrc(slide)"
                                            :alt="`Slide ${slide.label}`"
                                            class="max-h-full max-w-full object-contain p-1.5" loading="lazy"
                                            @error="markSlideImageFailed(slide.uuid)" />

                                        <!-- Signed link has expired — recoverable by re-fetching -->
                                        <div v-else-if="slideImageState(slide) === 'expired'"
                                            class="flex flex-col items-center gap-1 text-ribbon-amber px-2 text-center">
                                            <font-awesome-icon :icon="['fas', 'clock-rotate-left']" class="text-2xl" />
                                            <span class="text-[11px] font-medium">Image link expired</span>
                                            <button type="button"
                                                class="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ribbon-amber/15 text-ribbon-amber text-[10px] font-semibold hover:bg-ribbon-amber/25 transition-colors"
                                                :disabled="refreshingImages" @click.stop="refreshSlideImages">
                                                <font-awesome-icon
                                                    :icon="['fas', refreshingImages ? 'circle-notch' : 'rotate']"
                                                    :class="refreshingImages ? 'animate-spin' : ''"
                                                    class="text-[9px]" />
                                                {{ refreshingImages ? 'Refreshing…' : 'Refresh' }}
                                            </button>
                                        </div>

                                        <!-- Loaded but unreachable (403 / network) — viewer still works -->
                                        <div v-else-if="slideImageState(slide) === 'error'"
                                            class="flex flex-col items-center gap-1 text-error px-2 text-center">
                                            <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                                                class="text-2xl" />
                                            <span class="text-[11px] font-medium">Preview unavailable</span>
                                            <span class="text-[10px] text-on-surface-variant">Click to open
                                                viewer</span>
                                        </div>

                                        <!-- No image yet -->
                                        <div v-else class="flex flex-col items-center gap-1 text-outline">
                                            <font-awesome-icon :icon="['fas', 'image']" class="text-2xl" />
                                            <span class="text-xs">Not imaged</span>
                                        </div>

                                        <!-- Hover affordance — only over a rendered image -->
                                        <div v-if="slideImageState(slide) === 'ok'"
                                            class="absolute inset-0 flex items-center justify-center bg-on-surface/0 group-hover/img:bg-on-surface/40 opacity-0 group-hover/img:opacity-100 transition-all duration-200">
                                            <span
                                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-on-surface text-[11px] font-semibold shadow-md">
                                                <font-awesome-icon :icon="['fas', 'magnifying-glass-plus']"
                                                    class="text-[10px]" />
                                                View slide
                                            </span>
                                        </div>

                                        <!-- Imaged badge (top-right of preview) -->
                                        <span v-if="slide.imaged"
                                            class="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-ribbon-teal text-white shadow-sm pointer-events-none">
                                            <font-awesome-icon :icon="['fas', 'camera']" class="text-[9px]" />
                                            Imaged
                                        </span>
                                    </div>
                                </div>

                                <!-- Stain -->
                                <div class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-0.5">
                                        Stain</p>
                                    <p class="text-sm font-semibold text-on-surface flex items-center gap-1.5 truncate">
                                        <font-awesome-icon :icon="['fas', 'droplet']"
                                            class="text-ribbon-purple text-[10px] shrink-0" />
                                        <span class="truncate">{{ slide.stain || '—' }}</span>
                                        <span class="text-[10px] font-normal text-on-surface-variant truncate">
                                            · {{ STAIN_CATEGORY_LABELS[slide.stain_category] ||
                                                titleCase(slide.stain_category) }}
                                        </span>
                                    </p>
                                </div>

                                <!-- Parent block -->
                                <div class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-0.5">
                                        From block</p>
                                    <p
                                        class="text-xs sm:text-sm text-on-surface font-mono truncate flex items-center gap-1.5">
                                        <font-awesome-icon :icon="['fas', 'cube']"
                                            class="text-ribbon-blue text-[10px] shrink-0" />
                                        <span class="truncate">
                                            {{ blockByUuid[slide.block_uuid]?.part ||
                                                blockByUuid[slide.block_uuid]?.label || slide.block_uuid.slice(0, 8) }}
                                        </span>
                                    </p>
                                </div>

                                <!-- Progress flags -->
                                <div
                                    class="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-outline-variant/30">
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                        :class="slide.stained
                                            ? 'bg-ribbon-purple/10 text-ribbon-purple'
                                            : 'bg-surface-container text-on-surface-variant'">
                                        <font-awesome-icon :icon="['fas', slide.stained ? 'check-circle' : 'circle']"
                                            class="text-[9px]" />
                                        Stained
                                    </span>
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                        :class="slide.imaged
                                            ? 'bg-ribbon-teal/10 text-ribbon-teal'
                                            : 'bg-surface-container text-on-surface-variant'">
                                        <font-awesome-icon :icon="['fas', slide.imaged ? 'check-circle' : 'circle']"
                                            class="text-[9px]" />
                                        Imaged
                                    </span>
                                    <span
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                        :class="slide.submitted
                                            ? 'bg-ribbon-blue/10 text-ribbon-blue'
                                            : 'bg-surface-container text-on-surface-variant'">
                                        <font-awesome-icon :icon="['fas', slide.submitted ? 'check-circle' : 'circle']"
                                            class="text-[9px]" />
                                        Submitted
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
                <!-- ── Results tab ────────────────────────────────────────────────── -->
                <template v-else-if="tab === 'results'">
                    <div v-if="!test.results?.length" class="text-center py-12 px-4">
                        <div
                            class="w-14 h-14 rounded-2xl bg-ribbon-purple/10 flex items-center justify-center mx-auto mb-3">
                            <font-awesome-icon :icon="['fas', 'clipboard-check']"
                                class="text-xl text-ribbon-purple/60" />
                        </div>
                        <p class="text-sm sm:text-base font-semibold text-on-surface">No results recorded yet</p>
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                            Use <strong>Advanced Options → Record result</strong> to enter results for this test.
                        </p>
                    </div>

                    <template v-else>
                        <!-- Toolbar (unchanged) -->
                        <div
                            class="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4 sm:mb-5 bg-white/95 backdrop-blur border-b border-outline-variant/40 rounded-t-2xl flex items-center justify-between gap-3 flex-wrap min-w-0">
                            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                                <button type="button" @click="toggleSelectAllResults"
                                    class="inline-flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border font-semibold text-xs sm:text-sm transition-all"
                                    :class="allResultsSelected
                                        ? 'bg-ribbon-blue text-white border-ribbon-blue shadow-sm'
                                        : (someResultsSelected
                                            ? 'bg-ribbon-blue/10 text-ribbon-blue border-ribbon-blue/40'
                                            : 'bg-white text-on-surface-variant border-outline-variant hover:border-ribbon-blue/40 hover:text-ribbon-blue')">
                                    <span
                                        class="w-5 h-5 rounded-md flex items-center justify-center border transition-colors"
                                        :class="allResultsSelected
                                            ? 'bg-white border-white text-ribbon-blue'
                                            : (someResultsSelected
                                                ? 'bg-ribbon-blue border-ribbon-blue text-white'
                                                : 'border-outline-variant text-transparent')">
                                        <font-awesome-icon v-if="allResultsSelected" :icon="['fas', 'check']"
                                            class="text-[10px]" />
                                        <font-awesome-icon v-else-if="someResultsSelected" :icon="['fas', 'minus']"
                                            class="text-[10px]" />
                                    </span>
                                    <span>{{ allResultsSelected ? 'Deselect all' : 'Select all' }}</span>
                                </button>

                                <div class="flex items-baseline gap-2 min-w-0">
                                    <span class="text-sm font-semibold text-on-surface">
                                        {{ selectedResultUuids.size ? `${selectedResultUuids.size} selected` : '' }}
                                    </span>
                                    <span class="text-[11px] text-on-surface-variant">
                                        {{ test.results.length }} total
                                    </span>
                                </div>
                            </div>

                            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                                <span v-if="finalResultsCount"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold bg-ribbon-teal/10 text-ribbon-teal border border-ribbon-teal/25">
                                    <font-awesome-icon :icon="['fas', 'circle-check']" class="text-[10px]" />
                                    {{ finalResultsCount }} final
                                </span>
                                <span v-if="preliminaryResultsCount"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold bg-accent-fixed text-accent-on border border-accent/25">
                                    <font-awesome-icon :icon="['fas', 'hourglass-half']" class="text-[10px]" />
                                    {{ preliminaryResultsCount }} preliminary
                                </span>
                                <span v-if="criticalResultsCount"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold bg-error text-white border border-error">
                                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[10px]" />
                                    {{ criticalResultsCount }} critical
                                </span>
                            </div>

                            <!-- Report actions — always visible on Results tab -->
                            <div class="flex items-center gap-1.5 shrink-0">
                                <button type="button"
                                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-outline-variant/50 text-xs sm:text-sm font-semibold text-on-surface hover:border-ribbon-blue/50 hover:text-ribbon-blue transition-colors disabled:opacity-50"
                                    :disabled="!!reportGenerating || !test.results?.length"
                                    @click.stop="printResultsReport">
                                    <font-awesome-icon
                                        :icon="['fas', reportGenerating === 'print' ? 'circle-notch' : 'print']"
                                        :class="{ 'animate-spin': reportGenerating === 'print' }" class="text-xs" />
                                    <span class="hidden sm:inline">Print</span>
                                </button>
                                <button type="button"
                                    class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ribbon-red/10 border border-ribbon-red/30 text-xs sm:text-sm font-semibold text-ribbon-red hover:bg-ribbon-red/15 transition-colors disabled:opacity-50"
                                    :disabled="!!reportGenerating || !test.results?.length"
                                    @click.stop="downloadResultsPdf">
                                    <font-awesome-icon
                                        :icon="['fas', reportGenerating === 'pdf' ? 'circle-notch' : 'file-pdf']"
                                        :class="{ 'animate-spin': reportGenerating === 'pdf' }" class="text-xs" />
                                    <span class="hidden sm:inline">PDF</span>
                                </button>
                            </div>

                            <div v-if="selectedResultUuids.size" ref="resultsBulkMenuRef" class="relative shrink-0">
                                <button type="button"
                                    class="inline-flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-xl bg-primary-gradient text-white shadow-island-active text-xs sm:text-sm font-semibold transition-all hover:opacity-95 active:scale-[0.98]"
                                    :class="{ 'ring-2 ring-white/40': resultsBulkMenuOpen }"
                                    @click="resultsBulkMenuOpen = !resultsBulkMenuOpen">
                                    <span>Actions</span>
                                    <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" class="text-xs" />
                                </button>
                                <Transition name="menu-fade">
                                    <div v-if="resultsBulkMenuOpen"
                                        class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-30">
                                        <button type="button"
                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            :disabled="!canValidate"
                                            :title="canValidate ? '' : 'Reporting station is not planned'"
                                            @click="canValidate && openValidationModal()">
                                            <span
                                                class="w-7 h-7 rounded-lg bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue shrink-0">
                                                <font-awesome-icon :icon="['fas', 'user-check']" class="text-xs" />
                                            </span>
                                            <div class="min-w-0 text-left">
                                                <p class="font-semibold leading-tight">Validate test result</p>
                                                <p class="text-[11px] text-on-surface-variant leading-tight">Sign or
                                                    authorise selected rows</p>
                                            </div>
                                        </button>
                                    </div>
                                </Transition>
                            </div>
                        </div>

                        <!-- ═══════════ Results grid — same layout as blocks/slides ═════════ -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            <div v-for="(r, i) in test.results" :key="r.uuid || i" class="block-card group" :class="{
                                'block-card--selected': selectedResultUuids.has(r.uuid),
                                'ring-1 ring-error/20': r.is_critical,
                            }" @click="toggleResultSelection(r.uuid)">

                                <!-- Header: checkbox + numbered chip + status -->
                                <div class="flex items-center justify-between gap-2 mb-3 min-w-0">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <span class="checkbox-btn"
                                            :class="{ 'checkbox-btn--checked': selectedResultUuids.has(r.uuid) }"
                                            aria-hidden="true">
                                            <font-awesome-icon v-if="selectedResultUuids.has(r.uuid)"
                                                :icon="['fas', 'check']" class="text-[10px] text-white" />
                                        </span>
                                        <span
                                            class="inline-flex items-center justify-center px-2.5 h-8 rounded-lg bg-gradient-to-br from-ribbon-purple to-ribbon-blue text-white text-xs font-bold shadow-sm shrink-0 tracking-wide">
                                            {{ i + 1 }}
                                        </span>
                                        <span :class="resultStatusClass(r.status)"
                                            class="!py-0.5 !px-2 !text-[10px] shrink-0">
                                            {{ titleCase(r.status || 'preliminary') }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-1.5 shrink-0">
                                        <span v-if="r.is_critical"
                                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error text-white">
                                            <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                                                class="text-[9px]" />
                                            Critical
                                        </span>
                                        <button type="button"
                                            class="w-7 h-7 rounded-lg bg-ribbon-blue/10 text-ribbon-blue hover:bg-ribbon-blue/20 inline-flex items-center justify-center transition-colors"
                                            title="View full details" @click.stop="openResultDetail(r)">
                                            <font-awesome-icon :icon="['fas', 'up-right-and-down-left-from-center']"
                                                class="text-[10px]" />
                                        </button>
                                    </div>
                                </div>

                                <!-- Analyte (title) -->
                                <div class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-0.5">
                                        Section</p>
                                    <p
                                        class="text-sm sm:text-base font-semibold text-on-surface break-words line-clamp-2">
                                        {{ r.analyte || '—' }}
                                    </p>
                                    <p v-if="r.code" class="text-[11px] text-on-surface-variant font-mono truncate">{{
                                        r.code }}</p>
                                </div>

                                <!-- Value (kept compact — 3-line clamp) -->
                                <div class="mb-2.5 min-w-0">
                                    <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-0.5">
                                        Value</p>
                                    <div v-if="isHtmlValue(r.value)"
                                        class="result-rich text-xs sm:text-sm text-on-surface break-words line-clamp-3"
                                        v-html="r.value"></div>
                                    <p v-else class="text-xs sm:text-sm text-on-surface break-words line-clamp-3">
                                        <span class="font-semibold">{{ r.value ?? '—' }}</span>
                                        <span v-if="r.unit" class="text-on-surface-variant"> {{ r.unit }}</span>
                                        <span v-if="r.reference" class="text-[11px] text-on-surface-variant">
                                            (ref {{ r.reference }})
                                        </span>
                                    </p>
                                </div>

                                <!-- Validation state chip + flag chip (inline row) -->
                                <div class="flex flex-wrap items-center gap-1.5 mb-2.5">
                                    <span :class="validationChipClass(validationStateOf(r))"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                        <font-awesome-icon
                                            :icon="['fas', validationStateOf(r) === 'authorised' ? 'stamp' : (validationStateOf(r) === 'tech_signed' ? 'user-check' : 'hourglass-half')]"
                                            class="text-[9px]" />
                                        {{ validationChipLabel(validationStateOf(r)) }}
                                    </span>
                                    <span :class="flagChipClass(r.flag)"
                                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                        <font-awesome-icon :icon="['fas', 'flag']" class="text-[9px]" />
                                        {{(FLAG_OPTIONS.find(f => f.value === r.flag)?.label) || titleCase(r.flag ||
                                            'normal')}}
                                    </span>
                                </div>

                                <!-- Validators (compact grid) -->
                                <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-outline-variant/30 min-w-0">
                                    <div class="flex items-start gap-1.5 min-w-0">
                                        <span class="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                            :class="r.technically_validated_by ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-surface-container text-outline'">
                                            <font-awesome-icon :icon="['fas', 'user-check']" class="text-[9px]" />
                                        </span>
                                        <div class="min-w-0">
                                            <p class="text-[9px] font-bold uppercase tracking-wider"
                                                :class="r.technically_validated_by ? 'text-ribbon-teal' : 'text-on-surface-variant'">
                                                Tech
                                            </p>
                                            <p class="text-[11px] text-on-surface truncate">
                                                {{ r.technically_validated_by || 'Pending' }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-start gap-1.5 min-w-0">
                                        <span class="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                            :class="r.clinically_validated_by ? 'bg-ribbon-blue/15 text-ribbon-blue' : 'bg-surface-container text-outline'">
                                            <font-awesome-icon :icon="['fas', 'stamp']" class="text-[9px]" />
                                        </span>
                                        <div class="min-w-0">
                                            <p class="text-[9px] font-bold uppercase tracking-wider"
                                                :class="r.clinically_validated_by ? 'text-ribbon-blue' : 'text-on-surface-variant'">
                                                Clinical
                                            </p>
                                            <p class="text-[11px] text-on-surface truncate">
                                                {{ r.clinically_validated_by || 'Pending' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
                <GenericRecordList v-else :items="test.notes" empty-icon="notes-medical"
                    empty-text="No notes recorded yet." accent="amber" />
            </div>
        </template>

        <Modal v-model="grossModalOpen" title="Gross Specimen" :subtitle="test?.accession_number"
            class="w-[960px] max-w-[75%]">
            <div class="flex flex-col gap-5 sm:gap-6 min-w-0">

                <!-- Sticky specimen-label header with live preview ──────────── -->
                <div
                    class="rounded-2xl border border-ribbon-purple/20 bg-gradient-to-br from-ribbon-purple/10 to-ribbon-blue/5 p-4 sm:p-5 min-w-0">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="min-w-0 flex items-center gap-3">
                            <div
                                class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple shrink-0">
                                <font-awesome-icon :icon="['fas', 'tag']" />
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs sm:text-sm font-semibold uppercase tracking-wide text-ribbon-purple">
                                    Specimen label</p>
                                <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                    Choose a letter — it is applied to every block below.</p>
                            </div>
                        </div>
                        <select v-model="grossLabel"
                            class="input-field max-w-[110px] font-semibold text-center text-base">
                            <option v-for="l in availableLabelLetters" :key="l" :value="l">{{ l }}</option>
                        </select>
                    </div>

                    <!-- Live preview chips — A1, A2, A3 … -->
                    <div class="flex flex-wrap items-center gap-2 mt-4">
                        <span class="text-xs text-on-surface-variant shrink-0">Will create:</span>
                        <span v-for="(_, i) in grossBlocks" :key="i"
                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/70 border border-ribbon-purple/25 text-xs font-bold text-ribbon-purple">
                            <font-awesome-icon :icon="['fas', 'cube']" class="text-[9px]" />
                            {{ grossLabel }}{{ i + 1 }}
                        </span>
                    </div>
                </div>

                <!-- Block rows ─────────────────────────────────────────────── -->
                <div class="flex flex-col gap-3 sm:gap-4">
                    <div v-for="(block, idx) in grossBlocks" :key="block.id"
                        class="relative p-4 sm:p-5 rounded-2xl border border-outline-variant/30 bg-white/60 hover:bg-white/80 transition-colors flex flex-col gap-4 min-w-0">

                        <!-- Card header: numbered badge + remove -->
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span
                                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-ribbon-purple to-ribbon-blue text-white text-xs font-bold shadow-sm shrink-0">
                                    {{ grossLabel }}{{ idx + 1 }}
                                </span>
                                <div class="min-w-0">
                                    <p class="text-sm sm:text-base font-semibold text-on-surface truncate">Block {{ idx
                                        +
                                        1 }}</p>
                                    <p class="text-[11px] text-on-surface-variant truncate">Cassette {{ grossLabel }}{{
                                        idx + 1 }}</p>
                                </div>
                            </div>
                            <button v-if="grossBlocks.length > 1" type="button"
                                class="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error flex items-center justify-center transition-colors shrink-0"
                                :title="`Remove block ${idx + 1}`" @click="removeGrossBlock(idx)">
                                <font-awesome-icon :icon="['fas', 'trash']" class="text-xs" />
                            </button>
                        </div>

                        <!-- Container type ─────────────────────────────────── -->
                        <div class="relative min-w-0">
                            <label class="input-label">Container type <span class="text-error">*</span></label>

                            <!-- Selected state: chip -->
                            <div v-if="block.container_type_uuid"
                                class="flex items-center justify-between gap-3 p-2.5 rounded-xl border-2 border-ribbon-teal/40 bg-ribbon-teal/8 min-w-0">
                                <div class="flex items-center gap-2 min-w-0">
                                    <font-awesome-icon :icon="['fas', 'circle-check']"
                                        class="text-ribbon-teal shrink-0" />
                                    <div class="min-w-0">
                                        <p class="text-sm sm:text-base font-semibold text-on-surface truncate">
                                            {{ block.containerSearch }}</p>
                                    </div>
                                </div>
                                <button type="button"
                                    class="text-xs text-on-surface-variant hover:text-error px-2 py-1 rounded-lg hover:bg-white transition-colors shrink-0"
                                    @click="block.container_type_uuid = ''; block.containerSearch = ''">
                                    Change
                                </button>
                            </div>

                            <!-- Search state -->
                            <div v-else class="relative">
                                <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm leading-none z-10" />
                                <input v-model="block.containerSearch" type="text"
                                    class="input-field !pl-10 !py-2.5 leading-normal"
                                    placeholder="Search container type…" @focus="block.containerOpen = true"
                                    @blur="onContainerBlur(block)" />
                                <div v-if="block.containerOpen"
                                    class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto scroll-area bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5">
                                    <button v-for="ct in filteredContainerTypes(block.containerSearch)" :key="ct.uuid"
                                        type="button"
                                        class="w-full text-left px-3 py-2 hover:bg-surface-low transition-colors"
                                        @mousedown.prevent="selectContainerType(block, ct)">
                                        <p class="text-sm sm:text-base text-on-surface truncate">{{ ct.name }}</p>
                                        <p class="text-xs text-on-surface-variant truncate">{{ ct.code }} · {{
                                            ct.category
                                        }}</p>
                                    </button>
                                    <div v-if="!filteredContainerTypes(block.containerSearch).length"
                                        class="px-3 py-4 text-center text-xs text-on-surface-variant">
                                        No container types match "{{ block.containerSearch }}"
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Description ────────────────────────────────────── -->
                        <div class="min-w-0">
                            <div class="flex items-center justify-between gap-2 mb-1">
                                <label class="input-label !mb-0">Description <span class="text-error">*</span></label>
                                <span class="text-[11px] text-on-surface-variant">
                                    {{ plainTextLength(block.description) }} chars
                                </span>
                            </div>
                            <ConsultNoteEditor v-model="block.description"
                                placeholder="Describe the gross appearance of this specimen…" />
                        </div>

                        <!-- Flags — pill toggles ───────────────────────────── -->
                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" class="flag-pill"
                                :class="{ 'flag-pill-active flag-pill-purple': block.decalcified }"
                                @click="block.decalcified = !block.decalcified">
                                <font-awesome-icon :icon="['fas', block.decalcified ? 'check-circle' : 'circle']"
                                    class="text-xs" />
                                <span>Decalcified</span>
                            </button>
                            <button type="button" class="flag-pill"
                                :class="{ 'flag-pill-active flag-pill-teal': block.tissue_embedded }"
                                @click="block.tissue_embedded = !block.tissue_embedded">
                                <font-awesome-icon :icon="['fas', block.tissue_embedded ? 'check-circle' : 'circle']"
                                    class="text-xs" />
                                <span>Tissue embedded</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Add block button — dashed drop-zone style ──────────────── -->
                <button type="button"
                    class="w-full py-3 rounded-2xl border-2 border-dashed border-ribbon-purple/30 text-ribbon-purple hover:bg-ribbon-purple/5 hover:border-ribbon-purple/60 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                    @click="addGrossBlock">
                    <font-awesome-icon :icon="['fas', 'plus']" />
                    <span>Add another block</span>
                </button>

                <!-- Error banner -->
                <div v-if="grossError"
                    class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20 min-w-0">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-error text-sm mt-0.5 shrink-0" />
                    <p class="text-xs sm:text-sm text-error break-words">{{ grossError }}</p>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center gap-2 text-xs text-on-surface-variant mr-auto">
                    <font-awesome-icon :icon="['fas', 'layer-group']" />
                    <span>{{ grossBlocks.length }} {{ grossBlocks.length === 1 ? 'block' : 'blocks' }}</span>
                </div>
                <button type="button" class="btn-secondary text-sm sm:text-base"
                    @click="grossModalOpen = false">Cancel</button>
                <button type="button" class="btn-primary text-sm sm:text-base" :disabled="grossSubmitting"
                    @click="submitGross">
                    <font-awesome-icon v-if="grossSubmitting" :icon="['fas', 'circle-notch']" class="animate-spin" />
                    <font-awesome-icon v-else :icon="['fas', 'flask']" />
                    <span>{{ grossSubmitting ? 'Submitting…' : 'Submit gross' }}</span>
                </button>
            </template>
        </Modal>

        <!-- ── Section blocks modal ──────────────────────────────────────────── -->
        <Modal v-model="sectionModalOpen" title="Section blocks"
            :subtitle="`${sectionSlides.length} slide${sectionSlides.length === 1 ? '' : 's'} · ${test?.test_name || ''}`"
            class="w-[860px] max-w-[75%]">
            <div class="flex flex-col gap-4 sm:gap-5 min-w-0">

                <!-- Header info -->
                <div
                    class="rounded-2xl border border-ribbon-teal/20 bg-gradient-to-br from-ribbon-teal/10 to-ribbon-blue/5 p-4 sm:p-5 min-w-0">
                    <div class="flex items-start gap-3">
                        <div
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal shrink-0">
                            <font-awesome-icon :icon="['fas', 'layer-group']" />
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs sm:text-sm font-semibold uppercase tracking-wide text-ribbon-teal">
                                Sectioning
                            </p>
                            <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                Configure the slide(s) to be produced from each selected block.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Per-slide rows -->
                <div class="flex flex-col gap-3 sm:gap-4">
                    <div v-for="(slide, idx) in sectionSlides" :key="slide.laboratory_order_test_block_uuid"
                        class="relative p-4 sm:p-5 rounded-2xl border border-outline-variant/30 bg-white/60 hover:bg-white/80 transition-colors flex flex-col gap-3 min-w-0">

                        <!-- Row header: block chip -->
                        <div class="flex items-center justify-between gap-2 min-w-0">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span
                                    class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-ribbon-purple to-ribbon-blue text-white text-xs font-bold shadow-sm shrink-0">
                                    {{ slide._blockLabel }}
                                </span>
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-on-surface truncate">{{ slide._blockPart }}</p>
                                    <p class="text-[11px] text-on-surface-variant">Slide {{ idx + 1 }} of {{
                                        sectionSlides.length }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <!-- Label range — locked, derived from the block -->
                            <div class="min-w-0">
                                <label class="input-label flex items-center gap-1.5">
                                    Label range
                                    <font-awesome-icon :icon="['fas', 'lock']" class="text-[9px] text-outline" />
                                </label>
                                <div
                                    class="flex items-center gap-2 px-3 py-2 rounded-md border border-outline-variant/60 bg-surface-low text-sm sm:text-base text-on-surface font-mono font-semibold min-w-0">
                                    <font-awesome-icon :icon="['fas', 'tag']"
                                        class="text-ribbon-purple text-xs shrink-0" />
                                    <span class="truncate">{{ slide.label_range }}</span>
                                </div>
                                <p class="text-[10px] text-on-surface-variant mt-1">Inherited from block {{
                                    slide._blockLabel }}
                                </p>
                            </div>

                            <!-- Stain category -->
                            <div class="min-w-0">
                                <label class="input-label">Stain category <span class="text-error">*</span></label>
                                <select v-model="slide.stain_category" class="input-field">
                                    <option v-for="c in STAIN_CATEGORIES" :key="c.value" :value="c.value">
                                        {{ c.label }}
                                    </option>
                                </select>
                            </div>

                            <!-- Stain -->
                            <div class="min-w-0">
                                <label class="input-label">Stain <span class="text-error">*</span></label>
                                <select v-model="slide.stain" class="input-field">
                                    <option v-for="s in STAINS" :key="s" :value="s">{{ s }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error banner -->
                <div v-if="sectionError"
                    class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20 min-w-0">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-error text-sm mt-0.5 shrink-0" />
                    <p class="text-xs sm:text-sm text-error break-words">{{ sectionError }}</p>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center gap-2 text-xs text-on-surface-variant mr-auto">
                    <font-awesome-icon :icon="['fas', 'layer-group']" />
                    <span>{{ sectionSlides.length }} {{ sectionSlides.length === 1 ? 'slide' : 'slides' }}</span>
                </div>
                <button type="button" class="btn-secondary text-sm sm:text-base"
                    @click="sectionModalOpen = false">Cancel</button>
                <button type="button" class="btn-primary text-sm sm:text-base" :disabled="sectionSubmitting"
                    @click="submitSection">
                    <font-awesome-icon v-if="sectionSubmitting" :icon="['fas', 'circle-notch']" class="animate-spin" />
                    <font-awesome-icon v-else :icon="['fas', 'layer-group']" />
                    <span>{{ sectionSubmitting ? 'Submitting…' : 'Submit sectioning' }}</span>
                </button>
            </template>
        </Modal>

        <!-- ── Result-entry wizard ───────────────────────────────────────────── -->
        <Modal v-model="resultWizardOpen" title="Record Results"
            :subtitle="`${test?.test_name || ''} - ${test?.sample_name || ''} · ${resultRows.length} row${resultRows.length === 1 ? '' : 's'}`"
            class="w-[960px] max-w-[70%]">
            <div class="flex flex-col gap-4 sm:gap-5 min-w-0">

                <!-- Context header -->
                <div
                    class="rounded-2xl border border-ribbon-blue/20 bg-gradient-to-br from-ribbon-blue/10 to-ribbon-teal/5 p-3 sm:p-4 md:p-5 min-w-0">
                    <div class="flex items-start gap-3 min-w-0">
                        <div
                            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue shrink-0">
                            <font-awesome-icon :icon="['fas', 'clipboard-check']" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-semibold uppercase tracking-wide text-ribbon-blue">Result
                                entry
                            </p>
                            <p
                                class="text-sm sm:text-base md:text-lg font-semibold text-on-surface break-words truncate">
                                {{ test?.test_name || '—' }}
                            </p>
                            <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                {{ order?.patient_name || '—' }} · {{ order?.age ?? '—' }}y ·
                                {{ order?.department?.section || order?.department?.name || '—' }}
                            </p>
                        </div>
                        <div class="flex flex-col items-end gap-1 shrink-0">
                            <span v-if="isAnatomicPath"
                                class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold bg-ribbon-purple/10 text-ribbon-purple border border-ribbon-purple/25">
                                <font-awesome-icon :icon="['fas', 'microscope']" class="text-[10px]" />
                                AP narrative
                            </span>
                            <span v-if="autosaveStamp"
                                class="text-[10px] sm:text-xs text-on-surface-variant inline-flex items-center gap-1">
                                <font-awesome-icon :icon="['fas', 'floppy-disk']" class="text-ribbon-teal" />
                                Draft saved
                            </span>
                        </div>
                    </div>
                </div>

                <!-- How-to strip -->
                <div class="rounded-xl bg-primary-fixed/50 border border-primary/20 p-3 sm:p-4 min-w-0">
                    <div class="flex items-start gap-2 min-w-0">
                        <font-awesome-icon :icon="['fas', 'circle-info']"
                            class="text-primary mt-0.5 shrink-0 text-sm" />
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-semibold text-primary">How to fill this in</p>
                            <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                Fill each row's <strong>value</strong>. Pick a <strong>value type</strong> to change the
                                input
                                (narrative / text / numeric / coded). Open <strong>Advanced</strong> for codes,
                                references,
                                instrument and method. Set the <strong>flag</strong> and <strong>status</strong>, then
                                <strong>Save results</strong>. Your progress saves automatically.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ── Wizard progress spine ─────────────────────────────────────── -->
                <div class="rounded-2xl border border-outline-variant/30 bg-white/70 p-3 sm:p-4 min-w-0">
                    <div class="flex items-start justify-between gap-3 mb-2 min-w-0">
                        <div class="min-w-0">
                            <p class="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">
                                Step {{ wizardStep + 1 }} of {{ totalSteps }}
                            </p>
                            <p class="text-sm sm:text-base md:text-lg font-semibold text-on-surface break-words">
                                <template v-if="isSetupStep">Getting started</template>
                                <template v-else-if="isReviewStep">Review &amp; submit</template>
                                <template v-else>
                                    {{ resultRows[currentRowIdx]?.analyte_name || `Section ${currentRowIdx + 1}` }}
                                    <span class="text-xs sm:text-sm font-normal text-on-surface-variant">
                                        · {{ subStep === SUB_DONE ? 'Section complete' : guideAt(subStep).title }}
                                    </span>
                                </template>
                            </p>
                        </div>
                        <span
                            class="text-[10px] sm:text-xs text-on-surface-variant font-semibold shrink-0 mt-1 tabular-nums">
                            {{ progressPct }}%
                        </span>
                    </div>

                    <!-- Progress bar -->
                    <div class="h-1.5 rounded-full bg-surface-low overflow-hidden">
                        <div class="h-full bg-primary-gradient transition-all duration-300"
                            :style="{ width: progressPct + '%' }" />
                    </div>

                    <!-- Clickable chips -->
                    <div class="flex gap-1.5 overflow-x-auto mt-3 pb-1 -mx-1 px-1">
                        <button type="button"
                            class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border transition-colors whitespace-nowrap"
                            :class="wizardStep === 0
                                ? 'bg-primary text-white border-primary'
                                : (wizardStep > 0
                                    ? 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/20'
                                    : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40')"
                            @click="jumpToStep(0)">
                            <font-awesome-icon :icon="['fas', 'play']" class="text-[9px]" />
                            <span>1. Setup</span>
                        </button>

                        <button v-for="(r, i) in resultRows" :key="r._uid" type="button"
                            class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border transition-colors whitespace-nowrap max-w-[180px]"
                            :class="wizardStep === i + 1
                                ? 'bg-primary text-white border-primary'
                                : (wizardStep > i + 1
                                    ? 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/20'
                                    : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40')"
                            @click="jumpToRow(i)">
                            <span class="tabular-nums shrink-0">{{ i + 2 }}.</span>
                            <span class="truncate">{{ stepShortLabel(r, i) }}</span>
                        </button>

                        <button type="button"
                            class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold border transition-colors whitespace-nowrap"
                            :class="isReviewStep
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'"
                            @click="jumpToStep(resultRows.length + 1)">
                            <font-awesome-icon :icon="['fas', 'clipboard-list']" class="text-[9px]" />
                            <span>{{ resultRows.length + 2 }}. Review</span>
                        </button>
                    </div>
                </div>

                <!-- ── Setup step ─────────────────────────────────────────────────── -->
                <div v-show="isSetupStep"
                    class="rounded-2xl border border-outline-variant/30 bg-white/70 p-4 sm:p-5 flex flex-col gap-3 min-w-0">
                    <div class="flex items-start gap-3 min-w-0">
                        <div
                            class="w-10 h-10 rounded-xl bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal shrink-0">
                            <font-awesome-icon :icon="['fas', 'play']" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                                What you'll
                                do</p>
                            <p v-if="isAnatomicPath" class="text-sm sm:text-base text-on-surface break-words">
                                We've prepared <strong class="text-primary">{{ resultRows.length }} standard
                                    sections</strong>
                                for a {{ order?.department?.section || 'histopathology' }} sign-out.
                                Fill each section, review, then submit.
                            </p>
                            <p v-else class="text-sm sm:text-base text-on-surface break-words">
                                Add one row per analyte or result. Each row can be a number, coded value, short text, or
                                long
                                narrative.
                            </p>
                        </div>
                    </div>

                    <p class="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider mt-1">
                        {{ isAnatomicPath ? 'Sections' : 'Rows' }} to fill
                    </p>
                    <div class="flex flex-col gap-1">
                        <button v-for="(r, i) in resultRows" :key="r._uid" type="button"
                            class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-low transition-colors min-w-0 text-left"
                            @click="jumpToRow(i)">
                            <span
                                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                                {{ i + 1 }}
                            </span>
                            <span class="text-sm sm:text-base text-on-surface truncate flex-1 min-w-0">
                                {{ r.analyte_name || `Row ${i + 1}` }}
                            </span>
                            <span class="text-[10px] sm:text-xs text-on-surface-variant shrink-0 hidden sm:inline">
                                {{ titleCase(r.value_type) }}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Draft restored banner -->
                <div v-if="draftRestored"
                    class="flex items-start gap-2 p-3 rounded-xl bg-secondary-fixed/60 border border-secondary/25 min-w-0">
                    <font-awesome-icon :icon="['fas', 'clock-rotate-left']"
                        class="text-secondary-on-fixed text-sm mt-0.5 shrink-0" />
                    <div class="min-w-0 flex-1">
                        <p class="text-xs sm:text-sm font-semibold text-secondary-on-fixed">Draft restored</p>
                        <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                            Picked up where you left off. Changes save automatically.
                        </p>
                    </div>
                    <button type="button"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-secondary-on-fixed hover:bg-secondary/10 transition-colors shrink-0"
                        @click="discardDraftAndReset" title="Discard draft and start over">
                        <font-awesome-icon :icon="['fas', 'rotate-left']" class="text-[10px]" />
                        <span class="hidden sm:inline">Start over</span>
                    </button>
                </div>

                <!-- Critical banner -->
                <div v-if="hasCriticalRow"
                    class="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-error-container/60 border border-error/30 min-w-0">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-error text-base mt-0.5 shrink-0" />
                    <div class="min-w-0">
                        <p class="text-sm sm:text-base font-semibold text-error break-words">Critical value(s) present
                        </p>
                        <p class="text-xs sm:text-sm text-error/90 break-words">
                            Capture who was notified and when before marking any critical row as "final".
                        </p>
                    </div>
                </div>

                <!-- ── Row body: 4 guided sub-steps + section-done mini-review ─────────── -->
                <div v-show="isRowStep" class="flex flex-col gap-3 sm:gap-4">
                    <div v-for="(r, i) in resultRows" :key="r._uid" v-show="currentRowIdx === i"
                        class="relative rounded-2xl border border-outline-variant/30 bg-white/80 p-3 sm:p-4 md:p-5 flex flex-col gap-4 min-w-0"
                        :class="{ 'ring-2 ring-error/25 bg-error-container/20': r.is_critical || r.flag === 'critical_high' || r.flag === 'critical_low' }">

                        <!-- Row identity strip: section number + reorder/remove -->
                        <div class="flex items-center justify-between gap-2 min-w-0">
                            <div class="flex items-center gap-2 min-w-0">
                                <span
                                    class="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-ribbon-blue to-ribbon-teal text-white text-xs font-bold shadow-sm shrink-0">
                                    {{ i + 1 }}
                                </span>
                                <p class="text-sm sm:text-base font-semibold text-on-surface truncate min-w-0">
                                    {{ r.analyte_name || `Section ${i + 1}` }}
                                </p>
                            </div>
                            <div class="flex items-center gap-1 shrink-0">
                                <button type="button" class="btn-icon" title="Move up" :disabled="i === 0"
                                    @click="moveResultRow(i, -1)">
                                    <font-awesome-icon :icon="['fas', 'arrow-up']" class="text-xs" />
                                </button>
                                <button type="button" class="btn-icon" title="Move down"
                                    :disabled="i === resultRows.length - 1" @click="moveResultRow(i, 1)">
                                    <font-awesome-icon :icon="['fas', 'arrow-down']" class="text-xs" />
                                </button>
                                <button type="button" class="btn-icon btn-icon--danger" title="Remove section"
                                    :disabled="resultRows.length === 1" @click="removeResultRow(i)">
                                    <font-awesome-icon :icon="['fas', 'trash']" class="text-xs" />
                                </button>
                            </div>
                        </div>

                        <!-- Sub-step guide banner (hidden on section-done) -->
                        <div v-if="subStep <= SUB_LAST_INPUT"
                            class="rounded-xl bg-primary-fixed/40 border border-primary/20 p-3 sm:p-4 min-w-0">
                            <div class="flex items-start gap-3 min-w-0">
                                <div
                                    class="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                    <font-awesome-icon :icon="['fas', guideAt(subStep).icon]" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">
                                        Step {{ subStep + 1 }} of 4
                                    </p>
                                    <p class="text-sm sm:text-base font-semibold text-on-surface">
                                        {{ guideAt(subStep).title }}
                                    </p>
                                    <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                        {{ guideAt(subStep).blurb }}
                                    </p>
                                    <ul class="mt-1.5 space-y-0.5">
                                        <li v-for="t in guideAt(subStep).tips" :key="t"
                                            class="text-[11px] sm:text-xs text-on-surface-variant flex items-start gap-1.5">
                                            <font-awesome-icon :icon="['fas', 'lightbulb']"
                                                class="text-accent text-[9px] mt-0.5 shrink-0" />
                                            <span class="break-words">{{ t }}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- ─── SUB 0 · Name the section ─────────────────────────────── -->
                        <div v-show="subStep === 0" class="min-w-0">
                            <label class="input-label">Section name <span class="text-error">*</span></label>
                            <input v-model="r.analyte_name" type="text"
                                class="input-field !text-sm sm:!text-base md:!text-lg !font-semibold"
                                placeholder="e.g. Microscopic Description" />
                            <p v-if="sectionHint(r)"
                                class="text-[11px] sm:text-xs text-on-surface-variant mt-1.5 flex items-start gap-1 break-words">
                                <font-awesome-icon :icon="['fas', 'lightbulb']"
                                    class="text-accent text-[9px] mt-0.5 shrink-0" />
                                <span>{{ sectionHint(r) }}</span>
                            </p>

                            <p
                                class="text-[11px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-4 mb-1.5">
                                Or pick a standard section
                            </p>
                            <div class="flex flex-wrap gap-1.5">
                                <button v-for="name in AP_SECTION_NAMES" :key="name" type="button"
                                    class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold border transition-colors"
                                    :class="r.analyte_name === name
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'"
                                    @click="r.analyte_name = name">
                                    {{ name }}
                                </button>
                            </div>
                        </div>

                        <!-- ─── SUB 1 · Pick a value type ─────────────────────────────── -->
                        <div v-show="subStep === 1" class="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            <button v-for="t in (['narrative', 'text', 'numeric', 'coded'] as ResultValueType[])"
                                :key="t" type="button"
                                class="text-left p-3 sm:p-4 rounded-xl border-2 transition-colors min-w-0" :class="r.value_type === t
                                    ? 'bg-primary/5 border-primary'
                                    : 'bg-white border-outline-variant/40 hover:border-primary/40'"
                                @click="r.value_type = t">
                                <div class="flex items-center gap-2 mb-1 min-w-0">
                                    <font-awesome-icon :icon="['fas', VALUE_TYPE_GUIDANCE[t].icon]"
                                        :class="r.value_type === t ? 'text-primary' : 'text-on-surface-variant'" />
                                    <p class="text-sm sm:text-base font-semibold text-on-surface truncate">{{
                                        titleCase(t) }}
                                    </p>
                                    <font-awesome-icon v-if="r.value_type === t" :icon="['fas', 'circle-check']"
                                        class="text-primary text-xs ml-auto shrink-0" />
                                </div>
                                <p class="text-[11px] sm:text-xs text-on-surface-variant break-words">
                                    {{ VALUE_TYPE_GUIDANCE[t].what }}
                                </p>
                                <p class="text-[11px] sm:text-xs text-on-surface-variant/80 italic mt-1 break-words">
                                    {{ VALUE_TYPE_GUIDANCE[t].tips[0] }}
                                </p>
                            </button>
                        </div>

                        <!-- ─── SUB 2 · Enter the value (respective input) ────────────── -->
                        <div v-show="subStep === 2" class="min-w-0">
                            <!-- (a) NARRATIVE -->
                            <div v-if="r.value_type === 'narrative'" class="min-w-0">
                                <label class="input-label">Narrative <span class="text-error">*</span></label>
                                <div class="rich-editor-wrap">
                                    <ConsultNoteEditor v-model="r.value_text"
                                        :placeholder="`Enter ${r.analyte_name || 'section'} narrative…`" />
                                </div>
                                <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1.5 break-words">
                                    <font-awesome-icon :icon="['fas', 'lightbulb']"
                                        class="text-accent text-[9px] mr-1" />
                                    Use paragraphs, bold and lists — formatting is preserved on the report.
                                </p>
                            </div>

                            <!-- (b) TEXT -->
                            <div v-else-if="r.value_type === 'text'" class="min-w-0">
                                <label class="input-label">Text value <span class="text-error">*</span></label>
                                <textarea v-model="r.value_text" rows="3"
                                    class="input-field !text-sm sm:!text-base resize-y break-words"
                                    placeholder="Short free-text value…"></textarea>
                                <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1.5 break-words">
                                    <font-awesome-icon :icon="['fas', 'lightbulb']"
                                        class="text-accent text-[9px] mr-1" />
                                    Keep it short — for long-form use Narrative instead.
                                </p>
                            </div>

                            <!-- (c) NUMERIC -->
                            <div v-else-if="r.value_type === 'numeric'"
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
                                <div class="min-w-0">
                                    <label class="input-label">Value <span class="text-error">*</span></label>
                                    <input v-model.number="r.value_numeric" type="number" step="any" class="input-field"
                                        placeholder="e.g. 5.2" @input="autoFlagNumeric(r)" />
                                </div>
                                <div class="min-w-0">
                                    <label class="input-label">Unit</label>
                                    <input v-model="r.unit" type="text" class="input-field" placeholder="e.g. mmol/L" />
                                </div>
                                <div class="min-w-0">
                                    <label class="input-label">Ref. low</label>
                                    <input v-model.number="r.reference_low" type="number" step="any" class="input-field"
                                        placeholder="—" @input="autoFlagNumeric(r)" />
                                </div>
                                <div class="min-w-0">
                                    <label class="input-label">Ref. high</label>
                                    <input v-model.number="r.reference_high" type="number" step="any"
                                        class="input-field" placeholder="—" @input="autoFlagNumeric(r)" />
                                </div>
                                <p
                                    class="sm:col-span-2 lg:col-span-4 text-[11px] sm:text-xs text-on-surface-variant break-words">
                                    <font-awesome-icon :icon="['fas', 'lightbulb']"
                                        class="text-accent text-[9px] mr-1" />
                                    Fill low and high — the flag auto-derives to normal / high / low as you type.
                                </p>
                            </div>

                            <!-- (d) CODED -->
                            <div v-else class="min-w-0">
                                <label class="input-label">Coded value <span class="text-error">*</span></label>
                                <div class="flex flex-wrap gap-1.5 mb-2">
                                    <button v-for="opt in CODED_PRESETS" :key="opt" type="button"
                                        class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold border transition-colors"
                                        :class="r.value_coded === opt
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary/40'"
                                        @click="r.value_coded = opt">
                                        {{ opt }}
                                    </button>
                                </div>
                                <input v-model="r.value_coded" type="text" class="input-field"
                                    placeholder="Or type a custom coded value…" />
                                <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1.5 break-words">
                                    <font-awesome-icon :icon="['fas', 'lightbulb']"
                                        class="text-accent text-[9px] mr-1" />
                                    Tap a preset or type a custom term.
                                </p>
                            </div>
                        </div>

                        <!-- ─── SUB 3 · Flag / Status / Critical + Advanced (always visible) ─── -->
                        <div v-show="subStep === 3" class="flex flex-col gap-3 sm:gap-4 min-w-0">
                            <!-- Flag / Status / Critical -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 min-w-0">
                                <div class="min-w-0">
                                    <label class="input-label">Flag</label>
                                    <div class="flex items-center gap-2 min-w-0">
                                        <select v-model="r.flag" class="input-field flex-1 min-w-0">
                                            <option v-for="f in FLAG_OPTIONS" :key="f.value" :value="f.value">{{ f.label
                                                }}
                                            </option>
                                        </select>
                                        <span :class="flagChipClass(r.flag)"
                                            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] sm:text-xs font-semibold shrink-0 truncate">
                                            <font-awesome-icon :icon="['fas', 'flag']" class="text-[9px]" />
                                            {{(FLAG_OPTIONS.find(f => f.value === r.flag)?.label) || r.flag}}
                                        </span>
                                    </div>
                                    <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                                        Numeric flags auto-derive; you can still override.
                                    </p>
                                </div>
                                <div class="min-w-0">
                                    <label class="input-label">Status</label>
                                    <div
                                        class="flex items-center gap-1 p-1 rounded-lg bg-surface-low border border-outline-variant/30">
                                        <button v-for="s in (['preliminary', 'final'] as ResultStatus[])" :key="s"
                                            type="button"
                                            class="flex-1 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors truncate"
                                            :class="r.status === s
                                                ? 'bg-white text-primary shadow-sm'
                                                : 'text-on-surface-variant hover:text-on-surface'"
                                            @click="r.status = s">
                                            {{ titleCase(s) }}
                                        </button>
                                    </div>
                                    <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                                        Preliminary = draft; Final = signed off.
                                    </p>
                                </div>
                                <div class="min-w-0">
                                    <label class="input-label">Critical</label>
                                    <button type="button"
                                        class="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-md border transition-colors"
                                        :class="r.is_critical
                                            ? 'bg-error-container/50 border-error/30 text-error'
                                            : 'bg-white border-outline-variant text-on-surface-variant hover:border-primary/40'"
                                        @click="r.is_critical = !r.is_critical">
                                        <span class="text-xs sm:text-sm font-semibold truncate">
                                            {{ r.is_critical ? 'Marked critical' : 'Mark as critical' }}
                                        </span>
                                        <font-awesome-icon
                                            :icon="['fas', r.is_critical ? 'triangle-exclamation' : 'circle']"
                                            class="text-xs shrink-0" />
                                    </button>
                                    <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1">
                                        Toggle if the result changes management.
                                    </p>
                                </div>
                            </div>

                            <!-- Critical notification capture -->
                            <div v-if="r.is_critical || r.flag === 'critical_high' || r.flag === 'critical_low'"
                                class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-error-container/30 border border-error/25 min-w-0">
                                <div class="min-w-0">
                                    <label class="input-label">Notified to <span class="text-error">*</span></label>
                                    <input v-model="r.critical_notified_to" type="text" class="input-field"
                                        placeholder="e.g. Dr. Chisomo Phiri" />
                                </div>
                                <div class="min-w-0">
                                    <label class="input-label">Notified at <span class="text-error">*</span></label>
                                    <input v-model="r.critical_notified_at" type="datetime-local" class="input-field" />
                                </div>
                            </div>

                            <!-- Comment -->
                            <div class="min-w-0">
                                <label class="input-label">
                                    Comment <span
                                        class="text-[10px] font-normal text-on-surface-variant">(optional)</span>
                                </label>
                                <input v-model="r.comment" type="text" class="input-field"
                                    placeholder="Optional note about this row…" />
                            </div>

                            <!-- Advanced (always visible, guided) -->
                            <div
                                class="rounded-xl border border-outline-variant/30 bg-surface-low/60 p-3 sm:p-4 min-w-0">
                                <div class="flex items-start gap-2 mb-2 min-w-0">
                                    <font-awesome-icon :icon="['fas', 'sliders']"
                                        class="text-primary mt-0.5 shrink-0" />
                                    <div class="min-w-0">
                                        <p class="text-xs sm:text-sm font-semibold text-on-surface">Advanced — codes,
                                            references, instrument, method</p>
                                        <p class="text-[11px] sm:text-xs text-on-surface-variant break-words">
                                            Optional but recommended. LOINC/analyte codes improve interoperability;
                                            instrument &amp; method are captured for quality audit.
                                        </p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 min-w-0">
                                    <div class="min-w-0">
                                        <label class="input-label">Analyte code</label>
                                        <input v-model="r.analyte_code" type="text" class="input-field"
                                            placeholder="e.g. CLIN_HX" />
                                    </div>
                                    <div class="min-w-0">
                                        <label class="input-label">LOINC code</label>
                                        <input v-model="r.loinc_code" type="text" class="input-field"
                                            placeholder="e.g. 22634-0" />
                                    </div>
                                    <div v-if="r.value_type === 'numeric'" class="min-w-0 sm:col-span-2">
                                        <label class="input-label">Reference text (fallback)</label>
                                        <input v-model="r.reference_text" type="text" class="input-field"
                                            placeholder="e.g. Adults 3.5–5.1 mmol/L" />
                                    </div>
                                    <div class="min-w-0">
                                        <label class="input-label">Instrument</label>
                                        <input v-model="r.instrument" type="text" class="input-field"
                                            placeholder="e.g. Leica BOND-III" />
                                    </div>
                                    <div class="min-w-0">
                                        <label class="input-label">Method</label>
                                        <input v-model="r.method" type="text" class="input-field"
                                            placeholder="e.g. Immunohistochemistry" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ─── SUB 4 · Section done — mini review + branch actions ──── -->
                        <div v-show="subStep === SUB_DONE" class="flex flex-col gap-3 sm:gap-4 min-w-0">
                            <div
                                class="rounded-xl border border-ribbon-teal/30 bg-ribbon-teal/10 p-3 sm:p-4 flex items-start gap-3 min-w-0">
                                <div
                                    class="w-9 h-9 rounded-lg bg-ribbon-teal/20 text-ribbon-teal flex items-center justify-center shrink-0">
                                    <font-awesome-icon :icon="['fas', 'circle-check']" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="text-xs sm:text-sm font-semibold uppercase tracking-wide text-ribbon-teal">
                                        Section {{ i + 1 }} of {{ resultRows.length }} captured
                                    </p>
                                    <p class="text-sm sm:text-base font-semibold text-on-surface break-words">
                                        {{ r.analyte_name || `Section ${i + 1}` }}
                                    </p>
                                    <p class="text-xs sm:text-sm text-on-surface-variant break-words line-clamp-3 mt-1">
                                        {{ rowValuePreview(r) || 'No value entered yet' }}
                                    </p>
                                </div>
                                <button type="button"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                                    @click="subStep = 0">
                                    <font-awesome-icon :icon="['fas', 'pen-to-square']" class="text-[10px]" />
                                    <span>Edit</span>
                                </button>
                            </div>

                            <p class="text-xs sm:text-sm font-semibold text-on-surface-variant">What next?</p>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                <button type="button"
                                    class="text-left p-3 rounded-xl border-2 border-outline-variant/40 hover:border-primary/50 transition-colors"
                                    @click="addBlankSection">
                                    <font-awesome-icon :icon="['fas', 'plus']" class="text-primary mb-1" />
                                    <p class="text-sm font-semibold text-on-surface">Add another section</p>
                                    <p class="text-[11px] text-on-surface-variant">Start a fresh blank section.</p>
                                </button>
                                <button type="button" :disabled="!availableSectionTemplates.length"
                                    class="text-left p-3 rounded-xl border-2 border-outline-variant/40 hover:border-primary/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    @click="availableSectionTemplates[0] && addSectionFromTemplate(availableSectionTemplates[0])">
                                    <font-awesome-icon :icon="['fas', 'layer-group']" class="text-primary mb-1" />
                                    <p class="text-sm font-semibold text-on-surface">Use standard section</p>
                                    <p class="text-[11px] text-on-surface-variant">
                                        {{ availableSectionTemplates[0] ?? 'All standard sections added' }}
                                    </p>
                                </button>
                                <button type="button"
                                    class="text-left p-3 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                                    @click="jumpToStep(resultRows.length + 1)">
                                    <font-awesome-icon :icon="['fas', 'clipboard-list']" class="text-primary mb-1" />
                                    <p class="text-sm font-semibold text-primary">Review &amp; submit</p>
                                    <p class="text-[11px] text-on-surface-variant">Go to final review.</p>
                                </button>
                            </div>

                            <!-- Full template picker if more than one available -->
                            <div v-if="availableSectionTemplates.length > 1" class="min-w-0">
                                <p
                                    class="text-[11px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                                    Other standard sections
                                </p>
                                <div class="flex flex-wrap gap-1.5">
                                    <button v-for="name in availableSectionTemplates.slice(1)" :key="name" type="button"
                                        class="px-2.5 py-1 rounded-full text-xs font-semibold border bg-white text-on-surface-variant border-outline-variant hover:border-primary/40 transition-colors"
                                        @click="addSectionFromTemplate(name)">
                                        + {{ name }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add row -->
                <button v-show="isSetupStep" type="button"
                    class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-outline-variant/50 text-sm sm:text-base font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors"
                    @click="addResultRow">
                    <font-awesome-icon :icon="['fas', 'plus']" class="text-xs" />
                    Add another row
                </button>

                <!-- ── Review step ────────────────────────────────────────────────── -->
                <div v-show="isReviewStep" class="flex flex-col gap-3 sm:gap-4 min-w-0">
                    <div
                        class="rounded-2xl border border-ribbon-teal/25 bg-gradient-to-br from-ribbon-teal/10 to-ribbon-blue/5 p-4 sm:p-5">
                        <div class="flex items-start gap-3 min-w-0">
                            <div
                                class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal shrink-0">
                                <font-awesome-icon :icon="['fas', 'clipboard-list']" class="text-lg sm:text-xl" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-xs sm:text-sm font-semibold uppercase tracking-wide text-ribbon-teal">
                                    Review
                                    &amp; submit</p>
                                <p class="text-sm sm:text-base md:text-lg font-semibold text-on-surface break-words">
                                    Ready to send {{ resultRows.length }} {{ resultRows.length === 1 ? 'row' : 'rows' }}
                                </p>
                                <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                    Check each entry below. Tap <strong>Edit</strong> to jump back and change anything
                                    before
                                    submitting.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="hasCriticalRow"
                        class="flex items-start gap-2 p-3 rounded-xl bg-error-container/50 border border-error/30 min-w-0">
                        <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                            class="text-error text-sm mt-0.5 shrink-0" />
                        <div class="min-w-0 flex-1">
                            <p class="text-xs sm:text-sm font-semibold text-error">Critical result(s) present</p>
                            <p class="text-xs sm:text-sm text-error break-words">
                                Notification details are required before submitting any critical row as final.
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2.5">
                        <div v-for="(r, i) in resultRows" :key="r._uid"
                            class="rounded-2xl border border-outline-variant/30 bg-white/80 p-3 sm:p-4 flex items-start gap-3 min-w-0"
                            :class="{ 'ring-2 ring-error/25 bg-error-container/10': r.is_critical || r.flag === 'critical_high' || r.flag === 'critical_low' }">
                            <span
                                class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-ribbon-blue to-ribbon-teal text-white text-xs font-bold shrink-0">
                                {{ i + 1 }}
                            </span>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center flex-wrap gap-1.5 mb-1">
                                    <p class="text-sm sm:text-base font-semibold text-on-surface break-words">
                                        {{ r.analyte_name || `Row ${i + 1}` }}
                                    </p>
                                    <div class="flex flex-wrap gap-1 mt-1.5">
                                        <button v-for="(g, s) in SUB_STEP_GUIDES" :key="s" type="button"
                                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-on-surface-variant bg-surface-low hover:bg-primary/10 hover:text-primary transition-colors"
                                            @click="jumpToRow(i, s)">
                                            <font-awesome-icon :icon="['fas', 'pen']" class="text-[8px]" />
                                            {{ g.title }}
                                        </button>
                                    </div>
                                    <span :class="flagChipClass(r.flag)"
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold shrink-0">
                                        <font-awesome-icon :icon="['fas', 'flag']" class="text-[8px]" />
                                        {{(FLAG_OPTIONS.find(f => f.value === r.flag)?.label) || r.flag}}
                                    </span>
                                    <span
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold shrink-0"
                                        :class="r.status === 'final' ? 'bg-primary/10 text-primary' : 'bg-accent-fixed text-accent-on'">
                                        {{ titleCase(r.status) }}
                                    </span>
                                    <span v-if="r.is_critical"
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-error text-white shrink-0">
                                        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[8px]" />
                                        Critical
                                    </span>
                                </div>
                                <p class="text-xs sm:text-sm text-on-surface-variant break-words line-clamp-3">
                                    {{ rowValuePreview(r) || 'No value entered yet' }}
                                </p>
                            </div>
                            <button type="button"
                                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                                @click="jumpToRow(i, 0)">
                                <font-awesome-icon :icon="['fas', 'pen-to-square']" class="text-[10px]" />
                                <span class="hidden sm:inline">Edit</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Error -->
                <div v-if="resultError"
                    class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20 min-w-0">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-error text-sm mt-0.5 shrink-0" />
                    <p class="text-xs sm:text-sm text-error break-words">{{ resultError }}</p>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mr-auto min-w-0">
                    <font-awesome-icon :icon="['fas', 'list-check']" />
                    <span class="truncate">
                        <template v-if="isSetupStep">Setup</template>
                        <template v-else-if="isReviewStep">Review</template>
                        <template v-else>
                            Section {{ currentRowIdx + 1 }}/{{ resultRows.length }} ·
                            {{ subStep === SUB_DONE ? 'Done' : `Step ${subStep + 1}/4` }}
                        </template>
                    </span>
                </div>

                <button type="button" class="btn-secondary text-sm sm:text-base" v-if="isSetupStep"
                    @click="resultWizardOpen = false">
                    Cancel
                </button>
                <button type="button" class="btn-secondary text-sm sm:text-base" v-else @click="goPrev">
                    <font-awesome-icon :icon="['fas', 'arrow-left']" />
                    <span class="hidden sm:inline">Back</span>
                </button>

                <button v-if="!isReviewStep" type="button" class="btn-primary text-sm sm:text-base" @click="goNext">
                    <span>
                        <template v-if="isSetupStep">Get started</template>
                        <template v-else-if="subStep < SUB_LAST_INPUT">Next: {{ guideAt(subStep + 1).title }}</template>
                        <template v-else-if="subStep === SUB_LAST_INPUT">Finish section</template>
                        <template v-else>
                            {{ currentRowIdx < resultRows.length - 1 ? 'Next section' : 'Go to review' }} </template>
                    </span>
                    <font-awesome-icon :icon="['fas', 'arrow-right']" />
                </button>
                <button v-else type="button" class="btn-primary text-sm sm:text-base" :disabled="resultSubmitting"
                    @click="submitResults">
                    <font-awesome-icon v-if="resultSubmitting" :icon="['fas', 'circle-notch']" class="animate-spin" />
                    <font-awesome-icon v-else :icon="['fas', 'check']" />
                    <span>{{ resultSubmitting ? 'Saving…' : 'Submit results' }}</span>
                </button>
            </template>
        </Modal>

        <!-- ── Validate test results modal ────────────────────────────────── -->
        <Modal v-model="validationModalOpen" title="Validate Test Result"
            :subtitle="`${test?.test_name || ''} - ${test?.sample_name || ''} · ${validationRows.length} row${validationRows.length === 1 ? '' : 's'}`"
            class="max-w-[70%]">
            <div class="flex flex-col gap-4 sm:gap-5 min-w-0">

                <!-- Nothing to do -->
                <div v-if="hasNothingToDo"
                    class="rounded-2xl border border-secondary/30 bg-secondary-fixed/60 p-4 sm:p-5 flex items-start gap-3 min-w-0">
                    <div
                        class="w-10 h-10 rounded-xl bg-secondary/15 text-secondary-on-fixed flex items-center justify-center shrink-0">
                        <font-awesome-icon :icon="['fas', 'circle-check']" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm sm:text-base md:text-lg font-semibold text-secondary-on-fixed break-words">
                            All selected rows are already authorised
                        </p>
                        <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                            Nothing to sign or release. Close this modal and pick different rows if needed.
                        </p>
                    </div>
                </div>

                <!-- What we're about to do — auto-detected level -->
                <template v-else>
                    <div class="rounded-2xl border p-3 sm:p-4 md:p-5 min-w-0 transition-colors" :class="validationLevel === 'technical'
                        ? 'bg-primary-fixed/60 border-primary/25'
                        : 'bg-secondary-fixed/60 border-secondary/25'">
                        <div class="flex items-start gap-3 min-w-0">
                            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                                :class="validationLevel === 'technical'
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-secondary/15 text-secondary-on-fixed'">
                                <font-awesome-icon
                                    :icon="['fas', validationLevel === 'technical' ? 'user-check' : 'stamp']" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                                    :class="validationLevel === 'technical' ? 'text-primary' : 'text-secondary-on-fixed'">
                                    Step {{ validationLevel === 'technical' ? '1 of 2' : '2 of 2' }}
                                </p>
                                <p class="text-sm sm:text-base md:text-lg font-semibold text-on-surface break-words">
                                    <template v-if="validationLevel === 'technical'">Sign (technical)</template>
                                    <template v-else>Authorise &amp; release (clinical)</template>
                                </p>
                                <p class="text-xs sm:text-sm text-on-surface-variant break-words">
                                    <template v-if="validationLevel === 'technical'">
                                        Confirm each row is analytically sound. This step does not change status —
                                        it prepares the row for clinical release.
                                    </template>
                                    <template v-else>
                                        Release each row as final. This locks the value and cannot be undone
                                        without a correction or amendment.
                                    </template>
                                </p>
                            </div>
                            <span v-if="!hasMixedSelection && onlyLevel"
                                class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                                :class="validationLevel === 'technical'
                                    ? 'bg-primary/10 text-primary border border-primary/25'
                                    : 'bg-secondary/10 text-secondary-on-fixed border border-secondary/25'">
                                <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" class="text-[10px]" />
                                Auto-selected
                            </span>
                        </div>
                    </div>

                    <!-- Mixed selection notice -->
                    <div v-if="hasMixedSelection"
                        class="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-accent-fixed border border-accent/30 min-w-0">
                        <font-awesome-icon :icon="['fas', 'circle-info']"
                            class="text-accent-on text-base mt-0.5 shrink-0" />
                        <div class="min-w-0 flex-1">
                            <p class="text-sm sm:text-base font-semibold text-accent-on break-words">
                                Your selection contains rows at different stages
                            </p>
                            <p class="text-xs sm:text-sm text-accent-on/90 break-words mb-2">
                                We'll process <strong>{{ validationLevel === 'technical' ? 'technical sign-off' :
                                    'clinical release'
                                }}</strong> first
                                ({{validationRows.filter(r => nextLevelForRow(r) === validationLevel).length}} row{{
                                    validationRows.filter(r => nextLevelForRow(r) === validationLevel).length === 1 ? '' :
                                        's'}}).
                                The other rows will be ready in the next step.
                            </p>
                            <div
                                class="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-white/60 border border-accent/20 self-start">
                                <button v-for="lvl in (['technical', 'clinical'] as ValidationLevel[])" :key="lvl"
                                    type="button"
                                    class="px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors"
                                    :class="validationLevel === lvl
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-accent-on hover:text-primary'" :disabled="!selectionLevels.has(lvl)"
                                    @click="validationLevel = lvl">
                                    {{ lvl === 'technical' ? 'Sign first' : 'Authorise first' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Clinical release-as picker (only shown when clinical is active) -->
                    <div v-if="validationLevel === 'clinical'"
                        class="rounded-xl border border-outline-variant/40 bg-white p-3 sm:p-4 min-w-0">
                        <p
                            class="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                            Release as
                        </p>
                        <div
                            class="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-surface-low border border-outline-variant/30 self-start">
                            <button v-for="s in (['final', 'corrected', 'amended'] as ValidationStatus[])" :key="s"
                                type="button"
                                class="px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold transition-colors"
                                :class="validationStatus === s
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'" @click="validationStatus = s">
                                {{ titleCase(s) }}
                            </button>
                        </div>
                        <p class="text-[11px] sm:text-xs text-on-surface-variant mt-1.5 break-words">
                            <font-awesome-icon :icon="['fas', 'lightbulb']" class="text-accent text-[9px] mr-1" />
                            Use <strong>Corrected</strong> or <strong>Amended</strong> only when re-releasing an
                            already-final result.
                        </p>
                    </div>

                    <!-- Critical banner -->
                    <div v-if="anyCriticalUnAckd"
                        class="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-error-container/60 border border-error/30 min-w-0">
                        <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                            class="text-error text-base mt-0.5 shrink-0" />
                        <div class="min-w-0">
                            <p class="text-sm sm:text-base font-semibold text-error break-words">
                                Critical results present
                            </p>
                            <p class="text-xs sm:text-sm text-error/90 break-words">
                                Tick <strong>Acknowledged</strong> on each critical row below to confirm you reviewed
                                the value and recorded notification. Authorisation is blocked until then.
                            </p>
                        </div>
                    </div>
                </template>

                <!-- Rows to validate -->
                <div class="flex flex-col gap-2.5 sm:gap-3">
                    <div v-for="row in validationRows" :key="row.uuid"
                        class="rounded-2xl border bg-white p-3 sm:p-4 flex flex-col gap-2 min-w-0 transition-colors"
                        :class="[
                            row.is_critical ? 'border-error/30' : 'border-outline-variant/40',
                            row._state === 'ok' ? 'bg-secondary-fixed/40 border-secondary/30' : '',
                            row._state === 'failed' ? 'bg-error-container/30 border-error/30' : '',
                        ]">

                        <!-- Row header -->
                        <div class="flex items-start justify-between gap-2 min-w-0">
                            <div class="min-w-0 flex-1">
                                <p class="text-sm sm:text-base font-semibold text-on-surface break-words">
                                    {{ row.analyte || '—' }}
                                </p>
                                <div class="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span :class="flagChipClass(row.flag as any)"
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold">
                                        <font-awesome-icon :icon="['fas', 'flag']" class="text-[8px]" />
                                        {{(FLAG_OPTIONS.find(f => f.value === row.flag)?.label) || row.flag}}
                                    </span>
                                    <span :class="resultStatusClass(row.status)"
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold">
                                        {{ titleCase(row.status) }}
                                    </span>
                                    <span v-if="row.is_critical"
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-error text-white">
                                        Critical
                                    </span>
                                    <span :class="validationChipClass(validationStateOf(row))"
                                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold">
                                        {{ validationChipLabel(validationStateOf(row)) }}
                                    </span>
                                </div>
                            </div>

                            <!-- Per-row runtime state -->
                            <div class="shrink-0">
                                <span v-if="row._state === 'running'"
                                    class="inline-flex items-center gap-1 text-xs sm:text-sm text-primary">
                                    <font-awesome-icon :icon="['fas', 'circle-notch']"
                                        class="animate-spin text-[10px]" />
                                    Working…
                                </span>
                                <span v-else-if="row._state === 'ok'"
                                    class="inline-flex items-center gap-1 text-xs sm:text-sm text-secondary-on-fixed font-semibold">
                                    <font-awesome-icon :icon="['fas', 'circle-check']" class="text-[10px]" />
                                    Done
                                </span>
                                <span v-else-if="row._state === 'failed'"
                                    class="inline-flex items-center gap-1 text-xs sm:text-sm text-error font-semibold"
                                    :title="row._error || ''">
                                    <font-awesome-icon :icon="['fas', 'circle-xmark']" class="text-[10px]" />
                                    Failed
                                </span>
                                <span v-else class="text-[10px] sm:text-xs text-on-surface-variant">
                                    {{ rowIsEligible(row).ok ? 'Ready' : rowIsEligible(row).reason }}
                                </span>
                            </div>
                        </div>

                        <!-- Critical acknowledgement (clinical only) -->
                        <label
                            v-if="validationLevel === 'clinical' && (row.is_critical || row.flag === 'critical_high' || row.flag === 'critical_low') && row._state !== 'ok'"
                            class="flex items-center gap-2 mt-1 p-2 rounded-lg bg-error-container/40 border border-error/25 cursor-pointer min-w-0">
                            <span class="checkbox-btn" :class="{ 'checkbox-btn--checked': row._acknowledged }"
                                aria-hidden="true">
                                <font-awesome-icon v-if="row._acknowledged" :icon="['fas', 'check']"
                                    class="text-[10px] text-white" />
                            </span>
                            <input type="checkbox" v-model="row._acknowledged" class="sr-only" />
                            <span class="text-xs sm:text-sm text-error font-semibold break-words">
                                I reviewed this critical value and recorded notification.
                            </span>
                        </label>

                        <!-- Failure reason -->
                        <p v-if="row._state === 'failed' && row._error"
                            class="text-xs sm:text-sm text-error break-words">
                            {{ row._error }}
                        </p>
                    </div>
                </div>

                <!-- Summary + banner -->
                <div v-if="validationDone && !validationRunning" class="rounded-2xl border p-3 sm:p-4 min-w-0" :class="failedCount
                    ? 'bg-accent-fixed border-accent/30'
                    : 'bg-secondary-fixed/60 border-secondary/25'">
                    <div class="flex items-start gap-2 sm:gap-3 min-w-0">
                        <font-awesome-icon :icon="['fas', failedCount ? 'circle-info' : 'circle-check']"
                            class="text-base sm:text-lg mt-0.5 shrink-0"
                            :class="failedCount ? 'text-accent-on' : 'text-secondary-on-fixed'" />
                        <div class="min-w-0">
                            <p class="text-sm sm:text-base font-semibold break-words"
                                :class="failedCount ? 'text-accent-on' : 'text-secondary-on-fixed'">
                                {{ failedCount
                                    ? `${successCount} succeeded, ${failedCount} failed`
                                    : `All ${successCount} row${successCount === 1 ? '' : 's'} processed` }}
                            </p>
                            <p class="text-xs sm:text-sm break-words"
                                :class="failedCount ? 'text-accent-on/90' : 'text-on-surface-variant'">
                                {{ failedCount
                                    ? 'Fix the failed rows or close the modal — the queue will remember which are still pending.'
                                : 'You can close this modal.' }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Global error -->
                <div v-if="validationError"
                    class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20 min-w-0">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-error text-sm mt-0.5 shrink-0" />
                    <p class="text-xs sm:text-sm text-error break-words">{{ validationError }}</p>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mr-auto min-w-0">
                    <font-awesome-icon :icon="['fas', 'list-check']" />
                    <span class="truncate">
                        {{ eligibleRowCount }} eligible · {{ validationRows.length }} total
                    </span>
                </div>
                <button type="button" class="btn-secondary text-sm sm:text-base" @click="validationModalOpen = false">
                    {{ validationDone ? 'Close' : 'Cancel' }}
                </button>
                <button v-if="!hasNothingToDo" type="button" class="btn-primary text-sm sm:text-base"
                    :disabled="validationRunning || !eligibleRowCount" @click="submitValidation">
                    <font-awesome-icon v-if="validationRunning" :icon="['fas', 'circle-notch']" class="animate-spin" />
                    <font-awesome-icon v-else
                        :icon="['fas', validationLevel === 'technical' ? 'user-check' : 'stamp']" />
                    <span>
                        {{ validationRunning
                            ? 'Processing…'
                            : (validationLevel === 'technical' ? `Sign ${eligibleRowCount}` : `Authorise
                        ${eligibleRowCount}`) }}
                    </span>
                </button>
            </template>
        </Modal>

        <!-- ── Add Slide Images modal (paste image URL per slide) ────────────────── -->
        <Modal v-model="imageModalOpen" title="Add Slide Images" :subtitle="test?.accession_number" size="lg"
            class="max-w-[70%]">
            <div class="space-y-4">
                <p class="text-xs sm:text-sm text-on-surface-variant">
                    Paste an image URL (http/https) for each selected slide. The URL should point directly to a
                    renderable image (PNG/JPG).
                </p>

                <div v-if="imageError"
                    class="flex items-start gap-2 p-3 rounded-xl bg-error-container/40 border border-error/20">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-error text-sm mt-0.5 shrink-0" />
                    <p class="text-xs sm:text-sm text-error break-words">{{ imageError }}</p>
                </div>

                <div class="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    <div v-for="s in selectedSlidesList" :key="s.uuid"
                        class="p-3 rounded-xl border border-outline-variant/40 bg-surface-low/40">
                        <div class="flex items-center gap-2 mb-2">
                            <span
                                class="inline-flex items-center justify-center px-2.5 h-7 rounded-lg bg-gradient-to-br from-ribbon-teal to-ribbon-blue text-white text-xs font-bold shadow-sm shrink-0 tracking-wide">
                                {{ s.label }}
                            </span>
                            <span class="text-[11px] text-on-surface-variant truncate">
                                {{ s.stain || '—' }} · block {{ blockByUuid[s.block_uuid]?.label || '—' }}
                            </span>
                        </div>
                        <label class="input-label sr-only">Image URL for slide {{ s.label }}</label>
                        <input type="url" class="u-input w-full" placeholder="https://example.com/slide-image.png"
                            v-model="imageUrlInputs[s.uuid]" />
                        <div v-if="!!imageUrlInputs[s.uuid] && isValidHttpUrl(imageUrlInputs[s.uuid] || '')"
                            class="mt-2 flex items-center gap-2">
                            <img :src="imageUrlInputs[s.uuid]" alt="preview"
                                class="w-16 h-16 rounded-lg object-cover border border-outline-variant/40"
                                @error="($event.target as HTMLImageElement).style.display = 'none'" />
                            <span class="text-[11px] text-on-surface-variant">Preview</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <button type="button" class="btn-secondary" :disabled="imaging" @click="imageModalOpen = false">
                    Cancel
                </button>
                <button type="button" class="btn-primary" :disabled="imaging" @click="submitImageUrls">
                    <font-awesome-icon v-if="imaging" :icon="['fas', 'circle-notch']" class="animate-spin" />
                    <font-awesome-icon v-else :icon="['fas', 'camera']" />
                    <span>{{ imaging ? 'Uploading…' : 'Attach images' }}</span>
                </button>
            </template>
        </Modal>

        <!-- ── Slide viewer — full-screen overlay, no Modal wrapper ──────────────── -->
        <Teleport to="body">
            <div v-if="slideViewerOpen" class="fixed inset-0 z-[9999] flex flex-col bg-surface"
                role="dialog" aria-modal="true" aria-label="Slide viewer">

                <!-- Slim header strip -->
                <div
                    class="flex items-center justify-between gap-3 shrink-0 h-14 px-3 sm:px-4 bg-primary-gradient text-white shadow-md">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <font-awesome-icon :icon="['fas', 'microscope']" class="text-base shrink-0" />
                        <div class="min-w-0">
                            <p class="text-sm sm:text-base font-semibold leading-tight truncate">
                                Slide {{ viewerSlide?.label || '' }}
                            </p>
                            <p class="text-[10px] sm:text-[11px] text-white/80 leading-tight truncate">
                                {{ test?.accession_number || '' }}<span v-if="viewerSlide?.stain"> · {{
                                    viewerSlide.stain }}</span>
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                        <!-- Elapsed timer while recording -->
                        <span v-if="recording"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 text-white text-xs font-semibold tabular-nums">
                            <span class="w-2 h-2 rounded-full bg-ribbon-red animate-pulse" />
                            {{ recordElapsed }}
                        </span>

                        <button v-if="recorderSupported" type="button"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            :class="recording
                                ? 'bg-ribbon-red text-white hover:bg-ribbon-red/85'
                                : 'bg-white/15 text-white hover:bg-white/25'"
                            :disabled="recordStarting"
                            :title="recording ? 'Stop recording and download' : 'Record this session'"
                            @click="toggleRecording">
                            <font-awesome-icon
                                :icon="['fas', recordStarting ? 'circle-notch' : (recording ? 'stop' : 'video')]"
                                :class="recordStarting ? 'animate-spin' : ''" class="text-[11px]" />
                            <span class="hidden sm:inline">
                                {{ recordStarting ? 'Starting…' : (recording ? 'Stop' : 'Record') }}
                            </span>
                        </button>
                        <button type="button"
                            class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                            aria-label="Close viewer" @click="closeSlideViewer">
                            <font-awesome-icon :icon="['fas', 'xmark']" class="text-base" />
                        </button>
                    </div>
                </div>

                <!-- Recording error -->
                <div v-if="recordError"
                    class="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 bg-ribbon-red/10 border-b border-ribbon-red/25 text-ribbon-red text-xs">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[11px]" />
                    <span class="min-w-0 flex-1">{{ recordError }}</span>
                    <button type="button" class="font-semibold hover:underline" @click="recordError = ''">
                        Dismiss
                    </button>
                </div>

                <!-- Viewer surface — full remaining width and height, no radius -->
                <div class="relative flex-1 min-h-0 bg-white">
                    <div v-if="viewerLoading"
                        class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-low">
                        <font-awesome-icon :icon="['fas', 'circle-notch']"
                            class="animate-spin text-3xl text-ribbon-teal" />
                        <p class="text-xs text-on-surface-variant">Loading viewer…</p>
                    </div>

                    <iframe v-if="slideViewerSrc" :src="slideViewerSrc"
                        :title="`Slide ${viewerSlide?.label || ''} viewer`" class="block w-full h-full border-0"
                        allow="fullscreen" referrerpolicy="no-referrer" @load="viewerLoading = false" />
                </div>
            </div>
        </Teleport>

        <!-- ── Result detail modal ──────────────────────────────────────── -->
        <Modal v-model="resultDetailOpen" title="Result details" :subtitle="resultDetailRow?.analyte || ''"
            class="w-[860px] max-w-[92%]">
            <div v-if="resultDetailRow" class="flex flex-col gap-4 min-w-0">

                <!-- Section header strip -->
                <div
                    class="rounded-2xl border border-ribbon-purple/25 bg-gradient-to-br from-ribbon-purple/10 to-ribbon-blue/5 p-4 sm:p-5 min-w-0">
                    <div class="flex flex-wrap items-start justify-between gap-3 min-w-0">
                        <div class="min-w-0 flex items-start gap-3">
                            <div
                                class="w-10 h-10 rounded-xl bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple shrink-0">
                                <font-awesome-icon :icon="['fas', 'clipboard-check']" />
                            </div>
                            <div class="min-w-0">
                                <p class="text-[10px] sm:text-xs font-bold text-ribbon-purple uppercase tracking-wider">
                                    Section
                                </p>
                                <p class="text-base sm:text-lg font-bold text-on-surface break-words">
                                    {{ resultDetailRow.analyte || '—' }}
                                </p>
                                <p v-if="resultDetailRow.code"
                                    class="text-[11px] text-on-surface-variant font-mono break-all">
                                    {{ resultDetailRow.code }}
                                    <span v-if="resultCodeHint(resultDetailRow.code)"
                                        class="font-sans text-on-surface-variant/80"> · {{
                                            resultCodeHint(resultDetailRow.code)
                                        }}</span>
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                            <span :class="resultStatusClass(resultDetailRow.status)" class="!py-1 !px-2.5 !text-[11px]">
                                {{ titleCase(resultDetailRow.status || 'preliminary') }}
                            </span>
                            <span :class="flagChipClass(resultDetailRow.flag)"
                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                                <font-awesome-icon :icon="['fas', 'flag']" class="text-[9px]" />
                                {{(FLAG_OPTIONS.find(f => f.value === resultDetailRow.flag)?.label) ||
                                    titleCase(resultDetailRow.flag || 'normal')}}
                            </span>
                            <span v-if="resultDetailRow.is_critical"
                                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-error text-white">
                                <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[9px]" />
                                Critical
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Full value (no clamp) -->
                <div class="rounded-2xl border border-outline-variant/40 bg-white/80 p-4 sm:p-5 min-w-0">
                    <p class="text-[10px] sm:text-xs font-bold text-ribbon-blue uppercase tracking-wider mb-2">Value</p>
                    <div v-if="isHtmlValue(resultDetailRow.value)"
                        class="result-rich text-sm sm:text-base text-on-surface leading-relaxed break-words"
                        v-html="resultDetailRow.value"></div>
                    <p v-else class="text-sm sm:text-base text-on-surface break-words">
                        <span class="font-semibold">{{ resultDetailRow.value ?? '—' }}</span>
                        <span v-if="resultDetailRow.unit" class="text-on-surface-variant"> {{ resultDetailRow.unit
                        }}</span>
                    </p>

                    <dl v-if="resultDetailRow.unit || resultDetailRow.reference || resultDetailRow.instrument"
                        class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline-variant/40">
                        <div v-if="resultDetailRow.unit" class="min-w-0">
                            <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Unit</p>
                            <p class="text-sm text-on-surface font-mono">{{ resultDetailRow.unit }}</p>
                        </div>
                        <div v-if="resultDetailRow.reference" class="min-w-0">
                            <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Reference
                            </p>
                            <p class="text-sm text-on-surface">{{ resultDetailRow.reference }}</p>
                        </div>
                        <div v-if="resultDetailRow.instrument" class="min-w-0">
                            <p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Instrument
                            </p>
                            <p class="text-sm text-on-surface">{{ resultDetailRow.instrument }}</p>
                        </div>
                    </dl>
                </div>

                <!-- Validation chain -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                    <div class="rounded-2xl p-4 border min-w-0" :class="resultDetailRow.technically_validated_by
                        ? 'bg-ribbon-teal/8 border-ribbon-teal/30'
                        : 'bg-surface-low border-outline-variant/40'">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                                :class="resultDetailRow.technically_validated_by ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-surface-container text-outline'">
                                <font-awesome-icon :icon="['fas', 'user-check']" class="text-xs" />
                            </div>
                            <p class="text-[10px] font-bold uppercase tracking-wider"
                                :class="resultDetailRow.technically_validated_by ? 'text-ribbon-teal' : 'text-on-surface-variant'">
                                Technical validation
                            </p>
                        </div>
                        <p class="text-sm font-semibold text-on-surface break-words">
                            {{ resultDetailRow.technically_validated_by || 'Pending' }}
                        </p>
                    </div>
                    <div class="rounded-2xl p-4 border min-w-0" :class="resultDetailRow.clinically_validated_by
                        ? 'bg-ribbon-blue/8 border-ribbon-blue/30'
                        : 'bg-surface-low border-outline-variant/40'">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                                :class="resultDetailRow.clinically_validated_by ? 'bg-ribbon-blue/15 text-ribbon-blue' : 'bg-surface-container text-outline'">
                                <font-awesome-icon :icon="['fas', 'stamp']" class="text-xs" />
                            </div>
                            <p class="text-[10px] font-bold uppercase tracking-wider"
                                :class="resultDetailRow.clinically_validated_by ? 'text-ribbon-blue' : 'text-on-surface-variant'">
                                Clinical validation
                            </p>
                        </div>
                        <p class="text-sm font-semibold text-on-surface break-words">
                            {{ resultDetailRow.clinically_validated_by || 'Pending' }}
                        </p>
                    </div>
                </div>

                <!-- Meta strip -->
                <div class="text-xs text-on-surface-variant flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
                    <span v-if="resultDetailRow.analysed_at" class="inline-flex items-center gap-1.5">
                        <font-awesome-icon :icon="['fas', 'clock']" class="text-[10px]" />
                        Analysed {{ fmtDate(resultDetailRow.analysed_at) }}
                    </span>
                    <span class="inline-flex items-center gap-1.5">
                        <font-awesome-icon :icon="['fas', 'hashtag']" class="text-[10px]" />
                        <span class="font-mono">{{ resultDetailRow.uuid }}</span>
                    </span>
                </div>
            </div>

            <template #footer>
                <button type="button" class="btn-secondary" @click="resultDetailOpen = false">Close</button>
            </template>
        </Modal>
    </div>

</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted, watch } from 'vue'
import type { LabOrderDetail, LabOrderTest, LabOrderTimeline } from '~/composables/useLaboratory'
import type { ContainerType } from '~/composables/useLaboratorySettings'

const route = useRoute()
const { showTest, grossTest, sectionBlocks, stainSlides, imageSlides,
    createResults, validateResult, getOrderTimeline } = useLaboratory()
const { getContainerTypes } = useLaboratorySettings()

// Route is /orders/test/[uuid].vue — [uuid] is the TEST uuid.
// The parent ORDER uuid travels as a query param: ?order=<order_uuid>
const testUuid = computed(() => (route.params.uuid as string) || '')
const orderUuid = computed(() => (route.query.order as string) || '')

const order = ref<LabOrderDetail | null>(null)
const test = ref<LabOrderTest | null>(null)

// ── Order timeline (station gates for Gross / Stain / Image / Validate) ─────
const timeline = ref<LabOrderTimeline | null>(null)

const stationByCode = computed<Record<string, LabOrderTimeline['timeline'][number]>>(() => {
    const map: Record<string, any> = {}
    for (const s of timeline.value?.timeline || []) map[s.code] = s
    return map
})

const isPlanned = (code: string) => {
    const status = stationByCode.value[code]?.status
    return !!status && ['planned', 'pending', 'completed', 'verified'].includes(status)
}

// Buttons enable ONLY when the corresponding station is 'planned'
const canGross = computed(() => isPlanned('GROSSING'))
const canStain = computed(() => isPlanned('STAINING'))
const canImage = computed(() => isPlanned('IMAGING'))
const canValidate = computed(() => isPlanned('REPORTING'))

const loadTimeline = async () => {
    if (!orderUuid.value) return
    try { timeline.value = await getOrderTimeline(orderUuid.value) }
    catch { /* non-fatal — buttons stay disabled */ }
}

const loading = ref(true)
const error = ref<string | null>(null)

const tab = ref<TabKey>('overview')

type TabKey = 'overview' | 'blocks' | 'slides' | 'results' | 'notes'

const tabs = computed<{ key: TabKey; label: string; icon: string; count: number | null }[]>(() => [
    { key: 'overview', label: 'Overview', icon: 'chart-simple', count: null },
    { key: 'blocks', label: 'Blocks (Cassettes)', icon: 'cube', count: test.value?.blocks?.length || 0 },
    { key: 'slides', label: 'Slides', icon: 'layer-group', count: test.value?.slides?.length || 0 },
    { key: 'results', label: 'Results', icon: 'clipboard-check', count: test.value?.results?.length || 0 },
    { key: 'notes', label: 'Notes', icon: 'notes-medical', count: test.value?.notes?.length || 0 },
])

// ── Blocks tab: per-block ellipsis menu + cassette label download ───────────
const blockMenuOpen = ref<string | null>(null)

// Close any open block menu when clicking outside  
onMounted(() => {
    document.addEventListener('click', (e) => {
        const t = e.target as Node
        if (bulkMenuOpen.value && bulkMenuRef.value && !bulkMenuRef.value.contains(t)) {
            bulkMenuOpen.value = false
        }
        if (slidesBulkMenuOpen.value && slidesBulkMenuRef.value && !slidesBulkMenuRef.value.contains(t)) {
            slidesBulkMenuOpen.value = false
        }
        if (cardMenuOpen.value !== null) cardMenuOpen.value = null
    })
})

// ── Blocks tab: selection + bulk section action ─────────────────────────────
const selectedBlockUuids = ref<Set<string>>(new Set())
const bulkMenuOpen = ref(false)
const bulkMenuRef = ref<HTMLElement | null>(null)
const cardMenuOpen = ref<string | null>(null)

// ── Slides tab: selection + bulk stain ──────────────────────────────────────
const selectedSlideUuids = ref<Set<string>>(new Set())
const slidesBulkMenuOpen = ref(false)
const slidesBulkMenuRef = ref<HTMLElement | null>(null)

const allSlidesSelected = computed(() =>
    !!test.value?.slides?.length &&
    selectedSlideUuids.value.size === test.value.slides.length,
)
const someSlidesSelected = computed(() =>
    selectedSlideUuids.value.size > 0 && !allSlidesSelected.value,
)

const toggleSlideSelection = (uuid: string) => {
    const s = new Set(selectedSlideUuids.value)
    s.has(uuid) ? s.delete(uuid) : s.add(uuid)
    selectedSlideUuids.value = s
    if (!s.size) slidesBulkMenuOpen.value = false
}
const toggleSelectAllSlides = () => {
    if (allSlidesSelected.value) {
        selectedSlideUuids.value = new Set()
        slidesBulkMenuOpen.value = false
    } else {
        selectedSlideUuids.value = new Set((test.value?.slides || []).map((s: any) => s.uuid))
    }
}

// Map block_uuid → block for showing parent-block context on each slide
const blockByUuid = computed<Record<string, any>>(() => {
    const map: Record<string, any> = {}
    for (const b of test.value?.blocks || []) map[b.uuid] = b
    return map
})

// Human labels for stain_category codes
const STAIN_CATEGORY_LABELS: Record<string, string> = {
    routine_he: 'Routine H&E',
    special_stain: 'Special stain',
    ihc: 'IHC',
    cytology: 'Cytology',
    frozen: 'Frozen',
    unstained: 'Unstained',
}

// Bulk stain action
const staining = ref(false)
const stainError = ref<string | null>(null)

const runStainSelected = async () => {
    if (!selectedSlideUuids.value.size) return
    stainError.value = null
    staining.value = true
    slidesBulkMenuOpen.value = false
    try {
        await stainSlides(orderUuid.value, testUuid.value, Array.from(selectedSlideUuids.value))
        selectedSlideUuids.value = new Set()
        await load()
    } catch (e: any) {
        stainError.value = e?.message || 'Failed to stain slides.'
    } finally {
        staining.value = false
    }
}

// Bulk "add slide images" — image each selected slide with its parent block's cassette_label URL
// ── Bulk "add slide images" — user pastes a URL per selected slide ──────────
const imaging = ref(false)
const imageError = ref<string | null>(null)

const imageModalOpen = ref(false)
const imageUrlInputs = ref<Record<string, string>>({})   // slide.uuid → url

const selectedSlidesList = computed(() =>
    (test.value?.slides || []).filter((s: any) => selectedSlideUuids.value.has(s.uuid)),
)

const openImageModal = () => {
    if (!selectedSlideUuids.value.size) return
    imageError.value = null
    // seed empty inputs for each selected slide
    const seed: Record<string, string> = {}
    for (const s of selectedSlidesList.value) seed[s.uuid] = ''
    imageUrlInputs.value = seed
    slidesBulkMenuOpen.value = false
    imageModalOpen.value = true
}

const isValidHttpUrl = (v: string) => /^https?:\/\/\S+/i.test(v.trim())

const submitImageUrls = async () => {
    imageError.value = null
    const payload: { uuid: string; image_url: string }[] = []
    const missing: string[] = []

    for (const s of selectedSlidesList.value) {
        const url = (imageUrlInputs.value[s.uuid] || '').trim()
        if (!url) { missing.push(s.label); continue }
        if (!isValidHttpUrl(url)) { imageError.value = `Slide ${s.label}: URL must start with http(s)://`; return }
        payload.push({ uuid: s.uuid, image_url: url })
    }
    if (missing.length) { imageError.value = `Paste a URL for slide(s): ${missing.join(', ')}.`; return }
    if (!payload.length) { imageError.value = 'Nothing to image.'; return }

    imaging.value = true
    try {
        await imageSlides(orderUuid.value, testUuid.value, payload)
        selectedSlideUuids.value = new Set()
        imageModalOpen.value = false
        await load()
    } catch (e: any) {
        imageError.value = e?.message || 'Failed to add slide images.'
    } finally {
        imaging.value = false
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SLIDE IMAGES — preview src normalisation + external viewer (iframe)
   The iframe never loads image_url directly; it points at the viewer service
   (NUXT_PUBLIC_SLIDE_VIEWER_URL) which resolves the slide from its identifiers.
   ═══════════════════════════════════════════════════════════════════════════ */

const runtime = useRuntimeConfig()

// Payloads carry a literal "\u0026" (and sometimes a percent-encoded or HTML
// entity form) instead of "&" in the signed MinIO URL, which invalidates the
// AWS signature. Normalise every variant before rendering.
const normalizeUrl = (raw?: string | null): string => {
    if (!raw) return ''
    return String(raw)
        .replace(/\\u0026/gi, '&')
        .replace(/%5Cu0026/gi, '&')
        .replace(/&amp;/g, '&')
        .trim()
}

const slideImageSrc = (slide: any): string => normalizeUrl(slide?.image_url)

// ── Presigned-URL expiry ────────────────────────────────────────────────────
// image_url is persisted server-side as an already-signed URL, so it goes stale
// X-Amz-Expires seconds after X-Amz-Date. Detect that up front rather than
// firing a request we know MinIO will answer with 403 Request has expired.
const presignExpiresAt = (url: string): number | null => {
    const d = url.match(/[?&]X-Amz-Date=(\d{8}T\d{6}Z)/i)?.[1]
    const e = url.match(/[?&]X-Amz-Expires=(\d+)/i)?.[1]
    if (!d || !e) return null
    const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}Z`
    const t = Date.parse(iso)
    return Number.isNaN(t) ? null : t + Number(e) * 1000
}

// Ticks so expiry flips reactively while the tab stays open
const nowTick = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => { nowTimer = setInterval(() => { nowTick.value = Date.now() }, 30_000) })
onUnmounted(() => { if (nowTimer) clearInterval(nowTimer) })

// Track images that fail to load so we can swap in a fallback tile
const failedSlideImages = ref<Set<string>>(new Set())
const markSlideImageFailed = (uuid: string) => {
    const s = new Set(failedSlideImages.value)
    s.add(uuid)
    failedSlideImages.value = s
}

type SlideImageState = 'none' | 'ok' | 'expired' | 'error'

const slideImageState = (slide: any): SlideImageState => {
    const url = slideImageSrc(slide)
    if (!url) return 'none'
    const exp = presignExpiresAt(url)
    if (exp !== null && exp <= nowTick.value) return 'expired'
    if (failedSlideImages.value.has(slide.uuid)) return 'error'
    return 'ok'
}

// Re-fetch the test so the server hands back freshly signed URLs.
// Only helps once the backend signs on read rather than persisting the URL.
const refreshingImages = ref(false)
const refreshSlideImages = async () => {
    if (refreshingImages.value) return
    refreshingImages.value = true
    failedSlideImages.value = new Set()
    try { await load() } finally {
        nowTick.value = Date.now()
        refreshingImages.value = false
    }
}

// ── Viewer modal ────────────────────────────────────────────────────────────
const slideViewerOpen = ref(false)
const viewerSlide = ref<any | null>(null)
const viewerLoading = ref(false)

const slideViewerBase = computed(() =>
    String(runtime.public.slideViewerUrl || 'http://localhost:3001').replace(/\/+$/, ''),
)

const buildSlideViewerUrl = (slide: any): string => {
    if (!slide) return ''
    const qs = new URLSearchParams({
        slide: slide.uuid || '',
        label: slide.label || '',
        stain: slide.stain || '',
        accession: test.value?.accession_number || '',
        order: orderUuid.value || '',
    })
    return `${slideViewerBase.value}/?${qs.toString()}`
}

const slideViewerSrc = computed(() => buildSlideViewerUrl(viewerSlide.value))

const openSlideViewer = (slide: any) => {
    if (!slideImageSrc(slide)) return
    viewerSlide.value = slide
    viewerLoading.value = true
    slideViewerOpen.value = true
}

const closeSlideViewer = () => { slideViewerOpen.value = false }

// ── Session recording ───────────────────────────────────────────────────────
// The viewer is a cross-origin iframe, so its contents cannot be captured from
// the DOM. Screen capture via getDisplayMedia is the only option; the browser
// prompts the user to pick a surface (preferCurrentTab pre-selects this tab).
const recording = ref(false)
const recordStarting = ref(false)
const recordError = ref('')
const recordSeconds = ref(0)

let mediaRecorder: MediaRecorder | null = null
let captureStream: MediaStream | null = null
let recordChunks: Blob[] = []
let recordTimer: ReturnType<typeof setInterval> | null = null

const recorderSupported = computed(() =>
    typeof window !== 'undefined'
    && typeof window.MediaRecorder !== 'undefined'
    && typeof navigator?.mediaDevices?.getDisplayMedia === 'function',
)

const recordElapsed = computed(() => {
    const m = Math.floor(recordSeconds.value / 60)
    const s = recordSeconds.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const pickRecordMimeType = (): string => {
    const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm',
        'video/mp4',
    ]
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

const recordFileName = (): string => {
    const acc = String(test.value?.accession_number || 'slide').replace(/[^\w.-]+/g, '_')
    const label = String(viewerSlide.value?.label || '').replace(/[^\w.-]+/g, '_')
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const ext = (mediaRecorder?.mimeType || '').includes('mp4') ? 'mp4' : 'webm'
    return `slide-${acc}${label ? `-${label}` : ''}-${ts}.${ext}`
}

const teardownRecorder = () => {
    if (recordTimer) { clearInterval(recordTimer); recordTimer = null }
    captureStream?.getTracks().forEach((t) => t.stop())
    captureStream = null
    mediaRecorder = null
    recording.value = false
    recordSeconds.value = 0
}

const downloadRecording = () => {
    if (!recordChunks.length) {
        recordError.value = 'Recording produced no data — nothing to download.'
        return
    }
    const blob = new Blob(recordChunks, { type: mediaRecorder?.mimeType || 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = recordFileName()
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Revoke after the download has been handed to the browser
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    recordChunks = []
}

const startRecording = async () => {
    if (!recorderSupported.value || recording.value || recordStarting.value) return
    recordError.value = ''
    recordStarting.value = true
    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia({
            // preferCurrentTab is Chromium-only; harmless elsewhere
            video: { frameRate: 30 },
            audio: false,
            preferCurrentTab: true,
        } as DisplayMediaStreamOptions)

        recordChunks = []
        const mimeType = pickRecordMimeType()
        mediaRecorder = new MediaRecorder(captureStream, mimeType ? { mimeType } : undefined)

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) recordChunks.push(e.data)
        }
        mediaRecorder.onstop = () => { downloadRecording(); teardownRecorder() }
        mediaRecorder.onerror = () => {
            recordError.value = 'Recording failed. The capture was stopped.'
            teardownRecorder()
        }

        // User pressing the browser's own "Stop sharing" ends the track
        captureStream.getVideoTracks().forEach((track) => {
            track.addEventListener('ended', () => {
                if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
            })
        })

        mediaRecorder.start(1000) // 1s timeslices so nothing is lost on abrupt stop
        recording.value = true
        recordSeconds.value = 0
        recordTimer = setInterval(() => { recordSeconds.value += 1 }, 1000)
    } catch (e: any) {
        // NotAllowedError = user dismissed the picker; not worth an error strip
        if (e?.name !== 'NotAllowedError' && e?.name !== 'AbortError') {
            recordError.value = e?.message || 'Could not start screen recording.'
        }
        teardownRecorder()
    } finally {
        recordStarting.value = false
    }
}

const stopRecording = () => {
    if (mediaRecorder?.state === 'recording' || mediaRecorder?.state === 'paused') {
        mediaRecorder.stop() // onstop downloads and tears down
    } else {
        teardownRecorder()
    }
}

const toggleRecording = () => { recording.value ? stopRecording() : startRecording() }

// Escape closes the overlay — Modal used to provide this
const onViewerKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && slideViewerOpen.value) closeSlideViewer()
}
onMounted(() => { document.addEventListener('keydown', onViewerKeydown) })
onUnmounted(() => {
    document.removeEventListener('keydown', onViewerKeydown)
    document.body.style.overflow = ''
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
    else teardownRecorder()
})

// Tear the iframe down on close so the viewer session ends,
// and lock page scroll behind the overlay while it is open
watch(slideViewerOpen, (open) => {
    if (open) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
        // Closing mid-recording finalises and downloads rather than discarding
        if (recording.value) stopRecording()
        recordError.value = ''
        viewerSlide.value = null
        viewerLoading.value = false
    }
})

/* ═══════════════════════════════════════════════════════════════════════════
   RESULT WIZARD — POST /laboratory/order/test/results
   Adapts inputs by row value_type; falls back to AP narrative template
   for histopathology test_codes (11xxx). Single-page for now; steps preserved
   as sections so the layout stays predictable across breakpoints.
   ═══════════════════════════════════════════════════════════════════════════ */

type ResultValueType = 'narrative' | 'text' | 'numeric' | 'coded'
type ResultFlag =
    | 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low' | 'abnormal'
    | 'positive' | 'negative' | 'reactive' | 'non_reactive' | 'indeterminate'
type ResultStatus = 'preliminary' | 'final'

interface ResultRow {
    _uid: number
    value_type: ResultValueType
    analyte_name: string
    analyte_code?: string
    loinc_code?: string
    value_numeric?: number | null
    value_coded?: string
    value_text?: string
    unit?: string
    reference_low?: number | null
    reference_high?: number | null
    reference_text?: string
    flag: ResultFlag
    status: ResultStatus
    is_critical: boolean
    instrument?: string
    method?: string
    comment?: string
    critical_notified_to?: string
    critical_notified_at?: string
    _advancedOpen: boolean
}

const FLAG_OPTIONS: { value: ResultFlag; label: string; tone: 'ok' | 'warn' | 'crit' }[] = [
    { value: 'normal', label: 'Normal', tone: 'ok' },
    { value: 'negative', label: 'Negative', tone: 'ok' },
    { value: 'non_reactive', label: 'Non-reactive', tone: 'ok' },
    { value: 'high', label: 'High', tone: 'warn' },
    { value: 'low', label: 'Low', tone: 'warn' },
    { value: 'abnormal', label: 'Abnormal', tone: 'warn' },
    { value: 'positive', label: 'Positive', tone: 'warn' },
    { value: 'reactive', label: 'Reactive', tone: 'warn' },
    { value: 'indeterminate', label: 'Indeterminate', tone: 'warn' },
    { value: 'critical_high', label: 'Critical high', tone: 'crit' },
    { value: 'critical_low', label: 'Critical low', tone: 'crit' },
]

const CODED_PRESETS: string[] = [
    'Positive', 'Negative', 'Reactive', 'Non-reactive',
    'Detected', 'Not detected', 'Indeterminate',
]

// Inline hints shown next to key controls. Keep them short — they are hints,
// not tutorials. Longer guidance stays in the "Advanced" disclosure.
const VALUE_TYPE_HINT: Record<ResultValueType, string> = {
    narrative: 'Long-form rich text — use for AP report sections.',
    text: 'Short free-text note. Plain text only.',
    numeric: 'Measured value + unit + reference range. Flag auto-derives.',
    coded: 'Controlled term (Positive, Reactive, Detected, …).',
}

const AP_SECTION_HINT: Record<string, string> = {
    'Clinical Interaction': 'The referral context — presenting complaint, duration, prior workup.',
    'Gross Description': 'Macroscopic exam — dimensions, cut surface, how submitted.',
    'Microscopic Description': 'What you see under the scope — architecture, cells, atypia, mitoses.',
    'Immunohistochemistry': 'IHC panel — positive and negative markers, Ki-67 index.',
    'Final Diagnosis': 'Definitive interpretation. Mark critical if it changes management.',
    'Comment / Synopsis': 'Recommendations, follow-up, and staging pointers.',
}

const sectionHint = (r: ResultRow) =>
    AP_SECTION_HINT[r.analyte_name] || VALUE_TYPE_HINT[r.value_type]

/* ═══════════════════════════════════════════════════════════════════════════
   Guidance shown per step in the wizard
   ═══════════════════════════════════════════════════════════════════════════ */

interface StepGuidance {
    icon: string
    what: string
    tips: string[]
}

const AP_SECTION_GUIDANCE: Record<string, StepGuidance> = {
    'Clinical Interaction': {
        icon: 'notes-medical',
        what: 'The referring clinician\'s context — why the biopsy was sent.',
        tips: [
            'Presenting complaint, duration and site.',
            'Prior investigations or working diagnosis.',
            'Relevant medications or comorbidities.',
        ],
    },
    'Gross Description': {
        icon: 'ruler',
        what: 'Macroscopic examination of the specimen as received.',
        tips: [
            'Fixation state and container labelling.',
            'Dimensions (three axes) and weight where relevant.',
            'Cut surface and how the specimen was submitted (e.g. A1–A6).',
        ],
    },
    'Microscopic Description': {
        icon: 'microscope',
        what: 'Findings under the microscope — architecture, cells, features.',
        tips: [
            'Overall tissue architecture and any effacement.',
            'Cell populations, atypia, mitoses.',
            'State what is present AND what is notably absent.',
        ],
    },
    'Immunohistochemistry': {
        icon: 'vial',
        what: 'IHC panel results — positive and negative markers.',
        tips: [
            'Group markers as tumour cells / background / other.',
            'Include Ki-67 proliferation index where applicable.',
            'Note any performed but non-contributory stains.',
        ],
    },
    'Final Diagnosis': {
        icon: 'stamp',
        what: 'The definitive interpretation — the answer to the referral question.',
        tips: [
            'Lead with anatomical site, then the diagnosis.',
            'Include subtype/grade where relevant.',
            'Mark critical if this changes clinical management.',
        ],
    },
    'Comment / Synopsis': {
        icon: 'comment-medical',
        what: 'Recommendations, staging pointers, or follow-up guidance.',
        tips: [
            'Suggest confirmatory tests if needed.',
            'Recommend clinical follow-up or referral.',
            'Flag anything the clinician should be aware of.',
        ],
    },
}

const VALUE_TYPE_GUIDANCE: Record<ResultValueType, StepGuidance> = {
    narrative: {
        icon: 'align-left',
        what: 'A long-form written description — use paragraphs and formatting.',
        tips: ['e.g. "Sections show effacement of the normal architecture…"'],
    },
    text: {
        icon: 'quote-left',
        what: 'A short free-text value — a note or brief statement.',
        tips: ['e.g. "Haemolysed sample."'],
    },
    numeric: {
        icon: 'hashtag',
        what: 'A measured quantity with a unit and reference range.',
        tips: ['e.g. Potassium = 5.2 mmol/L (ref 3.5–5.1) → auto-flagged high.'],
    },
    coded: {
        icon: 'list-check',
        what: 'A controlled vocabulary result — pick or type a standard term.',
        tips: ['e.g. "Reactive", "Non-reactive", "Detected".'],
    },
}

const SUB_STEP_GUIDES: { title: string; icon: string; blurb: string; tips: string[] }[] = [
    {
        title: 'Name this section',
        icon: 'tag',
        blurb: 'Give the section a clear label — the clinician will read this as a heading.',
        tips: [
            'Use standard AP headings where possible (e.g. "Microscopic Description").',
            'You can edit a pre-seeded name — it stays part of the report.',
        ],
    },
    {
        title: 'Pick a value type',
        icon: 'shapes',
        blurb: 'This changes how you enter the result on the next step.',
        tips: [
            'Narrative — long-form rich text for AP report bodies.',
            'Numeric — measured value + unit + reference range.',
            'Coded — controlled term (Positive, Reactive…).',
        ],
    },
    {
        title: 'Enter the value',
        icon: 'pen-nib',
        blurb: 'Fill the value in the format matching the type you picked.',
        tips: ['Rich text formatting is preserved for narrative sections.'],
    },
    {
        title: 'Flag, status & advanced',
        icon: 'sliders',
        blurb: 'Set the flag, mark status, and — if the result changes management — mark it critical. Then fill the advanced fields (codes, references, instrument, method).',
        tips: [
            'Numeric flags auto-derive when a reference range is present.',
            'Advanced fields are optional but help downstream reporting.',
        ],
    },
]

// Safe accessor — subStep is bounded 0..SUB_DONE, but noUncheckedIndexedAccess
// still widens the return to `| undefined`. Fallback keeps TS + runtime happy.
const EMPTY_GUIDE = { title: '', icon: 'circle', blurb: '', tips: [] as string[] }
const guideAt = (i: number) => SUB_STEP_GUIDES[i] ?? EMPTY_GUIDE

// Standard AP (anatomic pathology) report sections, seeded when a test
// is routed down the histo/cyto path. Order mirrors AP_SECTION_GUIDANCE.
const AP_TEMPLATE: Partial<ResultRow>[] = Object.keys(AP_SECTION_GUIDANCE).map(name => ({
    analyte_name: name,
    value_type: 'narrative' as ResultValueType,
}))

let resultRowSeq = 0
const makeRow = (init: Partial<ResultRow> = {}): ResultRow => ({
    _uid: ++resultRowSeq,
    value_type: init.value_type || 'text',
    analyte_name: init.analyte_name || '',
    analyte_code: init.analyte_code,
    loinc_code: init.loinc_code,
    value_numeric: null,
    value_coded: '',
    value_text: '',
    unit: '',
    reference_low: null,
    reference_high: null,
    reference_text: '',
    flag: 'normal',
    status: 'final',
    is_critical: false,
    instrument: '',
    method: '',
    comment: '',
    critical_notified_to: '',
    critical_notified_at: '',
    _advancedOpen: false,
})

const resultWizardOpen = ref(false)
const resultSubmitting = ref(false)
const resultError = ref<string | null>(null)
const resultRows = ref<ResultRow[]>([])

// ── Wizard step spine ───────────────────────────────────────────────────────
// wizardStep: 0 = Setup, 1..N = per-section, N+1 = Review
// subStep (only meaningful for 1..N): 0 name · 1 type · 2 value · 3 flags+advanced · 4 section-done
const wizardStep = ref(0)
const subStep = ref(0)
const SUB_LAST_INPUT = 3   // last data-entry sub-step (0-based)
const SUB_DONE = 4         // section-done mini-review

const totalSteps = computed(() => 2 + resultRows.value.length)
const isSetupStep = computed(() => wizardStep.value === 0)
const isReviewStep = computed(() => wizardStep.value === resultRows.value.length + 1)
const isRowStep = computed(() => !isSetupStep.value && !isReviewStep.value)
const currentRowIdx = computed(() => wizardStep.value - 1)

// Overall progress counts each substep as its own tick so the bar advances smoothly
const progressPct = computed(() => {
    const stepsPerRow = SUB_DONE + 1                                 // 5 ticks per row
    const total = 1 + resultRows.value.length * stepsPerRow + 1      // setup + rows*5 + review
    let done = 0
    if (isSetupStep.value) done = 0
    else if (isReviewStep.value) done = total - 1
    else done = 1 + currentRowIdx.value * stepsPerRow + subStep.value
    return Math.max(1, Math.round(((done + 1) / total) * 100))
})

const goNext = () => {
    if (isSetupStep.value) { wizardStep.value = 1; subStep.value = 0; return }
    if (isReviewStep.value) return
    if (subStep.value < SUB_DONE) { subStep.value++; return }
    // Already on section-done: advance to next row or Review
    if (wizardStep.value < totalSteps.value - 1) { wizardStep.value++; subStep.value = 0 }
}

const goPrev = () => {
    if (isSetupStep.value) return
    if (isReviewStep.value) {
        wizardStep.value = resultRows.value.length
        subStep.value = SUB_DONE
        return
    }
    if (subStep.value > 0) { subStep.value--; return }
    if (wizardStep.value > 1) { wizardStep.value--; subStep.value = SUB_DONE }
    else { wizardStep.value = 0 }
}

const jumpToStep = (i: number) => {
    if (i >= 0 && i < totalSteps.value) { wizardStep.value = i; subStep.value = 0 }
}
const jumpToRow = (i: number, sub = 0) => {
    jumpToStep(i + 1)
    subStep.value = sub
}

// Preset AP section names user can add from Setup or the section-done panel
const AP_SECTION_NAMES = Object.keys(AP_SECTION_GUIDANCE)
const usedSectionNames = computed(() =>
    new Set(resultRows.value.map(r => r.analyte_name).filter(Boolean)),
)
const availableSectionTemplates = computed(() =>
    AP_SECTION_NAMES.filter(n => !usedSectionNames.value.has(n)),
)

const addSectionFromTemplate = (name: string) => {
    resultRows.value.push(makeRow({ analyte_name: name, value_type: 'narrative' }))
    wizardStep.value = resultRows.value.length
    subStep.value = 0
}
const addBlankSection = () => {
    resultRows.value.push(makeRow({ value_type: 'text' }))
    wizardStep.value = resultRows.value.length
    subStep.value = 0
}

// Short label for the step chip (first word of analyte name, or fallback)
const stepShortLabel = (r: ResultRow, i: number) =>
    (r.analyte_name?.split(/\s+/)[0]) || `Row ${i + 1}`

// Compact one-line value preview for the Review step (strips HTML)
const rowValuePreview = (r: ResultRow): string => {
    switch (r.value_type) {
        case 'numeric':
            return r.value_numeric != null
                ? `${r.value_numeric}${r.unit ? ' ' + r.unit : ''}` +
                (r.reference_low != null && r.reference_high != null
                    ? ` (ref ${r.reference_low}–${r.reference_high})`
                    : '')
                : ''
        case 'coded':
            return r.value_coded || ''
        default:
            return (r.value_text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }
}

// Guard against the step going out of range when rows are added/removed
watch(() => resultRows.value.length, (n) => {
    const max = n + 1  // Setup + N rows + Review = last index is n+1
    if (wizardStep.value > max) wizardStep.value = max
})

/* ═══════════════════════════════════════════════════════════════════════════
   Draft persistence — saves to localStorage keyed by test UUID
   ═══════════════════════════════════════════════════════════════════════════ */

const DRAFT_KEY_PREFIX = 'ibcc-result-wizard:'
const draftRestored = ref(false)
const autosaveStamp = ref<string | null>(null)

const draftKey = () => `${DRAFT_KEY_PREFIX}${testUuid.value}`

const saveDraft = () => {
    if (!import.meta.client || !resultRows.value.length) return
    try {
        const payload = {
            version: 3,
            savedAt: new Date().toISOString(),
            step: wizardStep.value,
            subStep: subStep.value,
            rows: resultRows.value,
        }
        localStorage.setItem(draftKey(), JSON.stringify(payload))
        autosaveStamp.value = payload.savedAt
    } catch { /* quota, ignore */ }
}

const loadDraft = (): boolean => {
    if (!import.meta.client) return false
    try {
        const raw = localStorage.getItem(draftKey())
        if (!raw) return false
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed?.rows) || !parsed.rows.length) return false
        resultRows.value = parsed.rows.map((r: any) => ({ ...r, _uid: ++resultRowSeq }))
        wizardStep.value = Math.max(0, Math.min(Number(parsed.step) || 0, resultRows.value.length + 1))
        subStep.value = Math.max(0, Math.min(Number(parsed.subStep) || 0, SUB_DONE))
        autosaveStamp.value = parsed.savedAt || null
        draftRestored.value = true
        return true
    } catch { return false }
}

const clearDraft = () => {
    if (!import.meta.client) return
    try { localStorage.removeItem(draftKey()) } catch { /* noop */ }
    draftRestored.value = false
    autosaveStamp.value = null
}

const discardDraftAndReset = () => {
    clearDraft()
    resultRows.value = isAnatomicPath.value
        ? AP_TEMPLATE.map(t => makeRow(t))
        : [makeRow({ value_type: 'text' })]
    wizardStep.value = 0
}

// Auto-save whenever rows or step change while the wizard is open
watch(
    [resultRows, wizardStep, subStep],
    () => { if (resultWizardOpen.value) saveDraft() },
    { deep: true },
)

const isAnatomicPath = computed(() => {
    const code = String(test.value?.test_code || '')
    const section = String(order.value?.department?.section || '').toLowerCase()
    return code.startsWith('11') || section.includes('histo') || section.includes('cyto')
})

// ═══════════════════════════════════════════════════════════════════════════
// Print / PDF: modern CAP-style synoptic pathology report
// Both paths write the same HTML string into an iframe — html2pdf renders the
// full document body (not a fragment) so the PDF matches print pixel-for-pixel.
// ═══════════════════════════════════════════════════════════════════════════

const reportGenerating = ref<null | 'print' | 'pdf'>(null)

// Fetch the logo once as a data URI — used by both paths for identical output
const loadLogoDataUri = async (): Promise<string> => {
    try {
        const res = await fetch('/images/ibcc_logo.png', { credentials: 'omit' })
        if (!res.ok) return ''
        const blob = await res.blob()
        return await new Promise<string>((resolve, reject) => {
            const fr = new FileReader()
            fr.onload = () => resolve(fr.result as string)
            fr.onerror = reject
            fr.readAsDataURL(blob)
        })
    } catch { return '' }
}

// Escape user-supplied HTML except for known-rich fields we already sanitise upstream
const esc = (s: any): string => String(s ?? '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!))

// One canonical HTML document — used by BOTH print and PDF
const buildReportDocument = (logoUri: string): string => {
    const o = order.value!
    const t = test.value!
    const generatedAt = new Date().toLocaleString(undefined, {
        dateStyle: 'medium', timeStyle: 'short',
    })
    const results = t.results ?? []
    const criticalCount = results.filter((r: any) => r.is_critical).length

    // Flag → colour on the section left rail + chip
    const flagPalette: Record<string, { rail: string; chipBg: string; chipFg: string }> = {
        normal: { rail: '#3dae8c', chipBg: '#d3efe5', chipFg: '#1f6750' },
        abnormal: { rail: '#e8a33d', chipBg: '#fbe8cc', chipFg: '#8a5a10' },
        high: { rail: '#e8a33d', chipBg: '#fbe8cc', chipFg: '#8a5a10' },
        low: { rail: '#e8a33d', chipBg: '#fbe8cc', chipFg: '#8a5a10' },
        positive: { rail: '#e8a33d', chipBg: '#fbe8cc', chipFg: '#8a5a10' },
        reactive: { rail: '#e8a33d', chipBg: '#fbe8cc', chipFg: '#8a5a10' },
        indeterminate: { rail: '#b05fa8', chipBg: '#f3dcef', chipFg: '#7a4073' },
    }
    const railFor = (r: any) => r.is_critical ? '#c0395a'
        : (flagPalette[r.flag]?.rail ?? '#3dae8c')

    const sections = results.map((r: any, i: number) => {
        const flagLabel = (FLAG_OPTIONS.find((f: any) => f.value === r.flag)?.label)
            || titleCase(r.flag || 'normal')
        const pal = flagPalette[r.flag] ?? flagPalette.normal!
        const showFlagChip = r.flag && r.flag !== 'normal'
        const valueHtml = isHtmlValue(r.value)
            ? r.value
            : `<p style="margin:4px 0">${esc(r.value ?? '—')}${r.unit ? ' ' + esc(r.unit) : ''}${r.reference ? ` <span style="color:#727687;font-size:9pt">(ref ${esc(r.reference)})</span>` : ''}</p>`

        return `
        <table class="rpt-section" cellpadding="0" cellspacing="0" style="border-left:4px solid ${railFor(r)}">
            <tr>
                <td class="rpt-section-body-cell">
                    <!-- Header row -->
                    <table class="rpt-section-hd" cellpadding="0" cellspacing="0"><tr>
                        <td class="hd-left">
                            <span class="rpt-num" style="background:${railFor(r)}">${i + 1}</span>
                            <span class="rpt-code">${esc(r.code ?? '')}</span>
                            <span class="rpt-name">${esc(r.analyte ?? '—')}</span>
                        </td>
                        <td class="hd-right">
                            ${r.is_critical ? `<span class="chip chip-crit">CRITICAL</span>` : ''}
                            ${showFlagChip ? `<span class="chip" style="background:${pal.chipBg};color:${pal.chipFg}">${esc(flagLabel)}</span>` : ''}
                            ${r.status === 'final' ? `<span class="chip chip-final">Final</span>` : `<span class="chip chip-prelim">${esc(titleCase(r.status || 'preliminary'))}</span>`}
                        </td>
                    </tr></table>

                    <!-- Body -->
                    <div class="rpt-section-body">${valueHtml}</div>

                    <!-- Footer: attribution row -->
                    <table class="rpt-section-ft" cellpadding="0" cellspacing="0"><tr>
                        <td class="ft-cell">
                            <div class="ft-lbl">Technical</div>
                            <div class="ft-val ${r.technically_validated_by ? '' : 'pending'}">${esc(r.technically_validated_by || 'Pending')}</div>
                        </td>
                        <td class="ft-cell">
                            <div class="ft-lbl">Clinical</div>
                            <div class="ft-val ${r.clinically_validated_by ? '' : 'pending'}">${esc(r.clinically_validated_by || 'Pending')}</div>
                        </td>
                        ${r.instrument ? `<td class="ft-cell">
                            <div class="ft-lbl">Instrument</div>
                            <div class="ft-val">${esc(r.instrument)}</div>
                        </td>` : ''}
                        <td class="ft-cell">
                            <div class="ft-lbl">Analysed</div>
                            <div class="ft-val">${r.analysed_at ? esc(new Date(r.analysed_at).toLocaleString()) : '—'}</div>
                        </td>
                    </tr></table>
                </td>
            </tr>
        </table>`
    }).join('')

    return `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(t.accession_number)} — ${esc(o.patient_name)}</title>
<style>
    /* Force colour print by default */
    * { -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        box-sizing: border-box; }

    @page { size: A4; margin: 12mm 12mm 16mm 12mm; }

    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
           color: #191c1e; font-size: 10.5pt; line-height: 1.45; }
    img { max-width: 100%; }

    .rpt { width: 100%; }

    /* ── Top ribbon rail ─────────────────────────────────────────── */
    .rpt-rail { height: 6px; border-radius: 3px; margin-bottom: 14px;
                background: linear-gradient(90deg,#3d7fbf 0%,#3dae8c 25%,#e8a33d 50%,#b05fa8 75%,#c0395a 100%); }

    /* ── Masthead (table for html2canvas parity) ─────────────────── */
    .rpt-mast { width: 100%; padding: 0 0 12px; border-bottom: 1px solid #e0e3e5; margin-bottom: 14px; }
    .rpt-mast .brand-cell { vertical-align: middle; width: 65%; }
    .rpt-mast .meta-cell  { vertical-align: middle; text-align: right; width: 35%; }
    .rpt-logo { width: 56px; height: 56px; object-fit: contain; display: inline-block; vertical-align: middle; margin-right: 12px; }
    .rpt-lab-block { display: inline-block; vertical-align: middle; }
    .rpt-lab-block h1 { margin: 0; font-size: 15pt; color: #1f578c; letter-spacing: -.2px; line-height: 1.2; }
    .rpt-lab-block .dept { margin: 2px 0 4px; color: #424656; font-size: 9pt; }
    .rpt-status { display: inline-block; padding: 2px 10px; border-radius: 999px;
                  background: #3dae8c; color: #fff; font-size: 8pt; font-weight: 700;
                  text-transform: uppercase; letter-spacing: .6px; }

    .acc-badge { display: inline-block; font-family: 'Consolas', ui-monospace, monospace;
                 font-weight: 700; padding: 3px 10px; border-radius: 6px; font-size: 11pt;
                 background: #d6e8fa; color: #1f578c; }
    .acc-badge-sub { display: inline-block; font-family: 'Consolas', ui-monospace, monospace;
                     font-weight: 700; padding: 2px 10px; border-radius: 6px; font-size: 10pt;
                     background: #f3dcef; color: #7a4073; margin-top: 5px; }
    .gen-time { color: #727687; font-size: 8.5pt; margin-top: 6px; }

    /* ── Critical banner (only when present) ─────────────────────── */
    .crit-banner { background: #c0395a; color: #fff; padding: 8px 14px;
                   border-radius: 6px; font-size: 10pt; margin-bottom: 14px;
                   font-weight: 700; letter-spacing: .3px; }
    .crit-banner .icon { display: inline-block; margin-right: 8px; font-size: 12pt; }

    /* ── Info cards — table layout ────────────────────────────────── */
    .rpt-info { width: 100%; margin-bottom: 16px; border-collapse: separate; border-spacing: 10px 0; }
    .rpt-info > tbody > tr > td { vertical-align: top; width: 50%; padding: 0; }
    .info-card { border: 1px solid #e0e3e5; border-top: 3px solid #3d7fbf;
                 border-radius: 6px; padding: 10px 14px; background: #fff; }
    .info-card.teal { border-top-color: #3dae8c; }
    .info-card h4 { margin: 0 0 8px; font-size: 8pt; font-weight: 800;
                    color: #1f578c; text-transform: uppercase; letter-spacing: .8px; }
    .info-card.teal h4 { color: #1f6750; }
    .info-card table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    .info-card td { padding: 2px 0; vertical-align: top; }
    .info-card td.k { color: #727687; width: 40%; padding-right: 8px; font-weight: 500; }
    .info-card td.v { color: #191c1e; font-weight: 600; }
    .info-card .muted { color: #727687; font-weight: 400; }

    /* ── Results header ──────────────────────────────────────────── */
    .rpt-results-hd { width: 100%; margin: 6px 0 10px; }
    .rpt-results-hd td { vertical-align: middle; }
    .rpt-results-hd .title { font-size: 13pt; font-weight: 700; color: #191c1e; padding-right: 12px; white-space: nowrap; }
    .rpt-results-hd .bar { height: 2px; border-radius: 2px; width: 100%;
                           background: linear-gradient(90deg,#3d7fbf,#3dae8c,#e8a33d,#b05fa8,#c0395a); }
    .rpt-results-hd .count { padding-left: 12px; white-space: nowrap; color: #727687; font-size: 8.5pt; }

    /* ── Result section ──────────────────────────────────────────── */
    .rpt-section { width: 100%; border: 1px solid #e0e3e5; border-radius: 6px;
                   margin-bottom: 10px; page-break-inside: avoid; }
    .rpt-section-body-cell { padding: 10px 14px 8px; }
    .rpt-section-hd { width: 100%; margin-bottom: 6px; }
    .rpt-section-hd .hd-left { vertical-align: middle; }
    .rpt-section-hd .hd-right { vertical-align: middle; text-align: right; white-space: nowrap; }
    .rpt-num { display: inline-block; width: 22px; height: 22px; line-height: 22px;
               border-radius: 6px; color: #fff; font-weight: 800; font-size: 10pt;
               text-align: center; vertical-align: middle; margin-right: 10px; }
    .rpt-code { display: inline-block; font-family: 'Consolas', ui-monospace, monospace;
                font-size: 7.5pt; color: #b05fa8; background: #f3dcef;
                padding: 2px 6px; border-radius: 4px; letter-spacing: .4px;
                font-weight: 700; vertical-align: middle; margin-right: 8px; }
    .rpt-name { display: inline-block; font-size: 11.5pt; font-weight: 700;
                color: #191c1e; vertical-align: middle; }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 999px;
            font-size: 7.5pt; font-weight: 700; letter-spacing: .4px;
            text-transform: uppercase; margin-left: 4px; }
    .chip-crit { background: #c0395a; color: #fff; }
    .chip-final { background: #d3efe5; color: #1f6750; }
    .chip-prelim { background: #eceef0; color: #424656; }

    .rpt-section-body { font-size: 10pt; color: #191c1e; padding: 4px 0 8px; }
    .rpt-section-body p { margin: 4px 0; }

    .rpt-section-ft { width: 100%; border-top: 1px dashed #c2c6d8; padding-top: 6px; }
    .rpt-section-ft td.ft-cell { vertical-align: top; padding-top: 6px; padding-right: 12px; }
    .ft-lbl { color: #727687; font-weight: 800; text-transform: uppercase;
              letter-spacing: .5px; font-size: 7pt; margin-bottom: 1px; }
    .ft-val { font-size: 8.5pt; color: #191c1e; font-weight: 600; }
    .ft-val.pending { color: #c2c6d8; font-weight: 500; }

    /* ── Signatures ──────────────────────────────────────────────── */
    .rpt-sig { width: 100%; margin-top: 24px; border-collapse: separate; border-spacing: 24px 0;
               page-break-inside: avoid; }
    .rpt-sig td { vertical-align: top; padding-top: 8px; width: 50%; }
    .sig-line { border-top: 1px solid #191c1e; height: 1px; margin-bottom: 6px; }
    .sig-role { font-weight: 800; text-transform: uppercase; letter-spacing: .6px;
                color: #424656; font-size: 8pt; }
    .sig-hint { color: #727687; font-size: 8pt; margin-top: 2px; }

    /* ── Footer ──────────────────────────────────────────────────── */
    .rpt-foot { width: 100%; margin-top: 20px; padding-top: 8px;
                border-top: 1px solid #e0e3e5; }
    .rpt-foot td { vertical-align: middle; font-size: 8pt; color: #727687; }
    .rpt-foot td.right { text-align: right; }
    .foot-logo { height: 12px; width: auto; vertical-align: middle; margin-right: 6px; opacity: .7; }
</style>
</head>
<body>
<div class="rpt">

    <div class="rpt-rail"></div>

    <!-- Masthead -->
    <table class="rpt-mast" cellpadding="0" cellspacing="0"><tr>
        <td class="brand-cell">
            ${logoUri ? `<img class="rpt-logo" src="${logoUri}" alt="IBCC" />` : ''}
            <span class="rpt-lab-block">
                <h1>International Blantyre Cancer Centre</h1>
                <div class="dept">${esc(o.department?.name ?? '')}${o.department?.section ? ' · ' + esc(o.department.section) : ''}</div>
                <span class="rpt-status">${esc(titleCase(o.status))}</span>
            </span>
        </td>
        <td class="meta-cell">
            <div><span class="acc-badge">${esc(o.accession_number)}</span></div>
            <div><span class="acc-badge-sub">${esc(t.accession_number)}</span></div>
            <div class="gen-time">Generated ${esc(generatedAt)}</div>
        </td>
    </tr></table>

    ${criticalCount > 0 ? `
    <div class="crit-banner">
        <span class="icon">⚠</span>
        ${criticalCount} critical result${criticalCount === 1 ? '' : 's'} — clinical action required
    </div>` : ''}

    <!-- Patient / Specimen -->
    <table class="rpt-info" cellpadding="0" cellspacing="0"><tr>
        <td>
            <div class="info-card">
                <h4>Patient</h4>
                <table>
                    <tr><td class="k">Name</td><td class="v">${esc(o.patient_name ?? '—')}</td></tr>
                    <tr><td class="k">Age / Sex</td><td class="v">${o.age ?? '—'} <span class="muted">·</span> ${esc(titleCase(o.gender ?? ''))}</td></tr>
                    <tr><td class="k">Requested by</td><td class="v">${esc(o.requested_by ?? '—')}</td></tr>
                    <tr><td class="k">Referring facility</td><td class="v">${esc(o.referring_facility ?? '—')}</td></tr>
                </table>
            </div>
        </td>
        <td>
            <div class="info-card teal">
                <h4>Specimen</h4>
                <table>
                    <tr><td class="k">Test</td><td class="v">${esc(t.test_name)} <span class="muted">(${esc(t.test_code)})</span></td></tr>
                    <tr><td class="k">Sample</td><td class="v">${esc(t.sample_name ?? '—')}</td></tr>
                    <tr><td class="k">Site</td><td class="v">${esc(o.site ?? '—')}</td></tr>
                    <tr><td class="k">Collected</td><td class="v">${o.collection_time ? esc(new Date(o.collection_time).toLocaleString()) : '—'}</td></tr>
                    <tr><td class="k">Received</td><td class="v">${o.reception_time ? esc(new Date(o.reception_time).toLocaleString()) : '—'}</td></tr>
                    <tr><td class="k">Cassettes / Slides</td><td class="v">${t.total_submitted_cassettes ?? 0} / ${t.total_submitted_slides ?? 0}</td></tr>
                </table>
            </div>
        </td>
    </tr></table>

    <!-- Results header -->
    <table class="rpt-results-hd" cellpadding="0" cellspacing="0"><tr>
        <td class="title">Results</td>
        <td><div class="bar"></div></td>
        <td class="count">${results.length} section${results.length === 1 ? '' : 's'}</td>
    </tr></table>

    ${sections || '<p style="color:#727687">No results recorded.</p>'}

    <!-- Signatures -->
    <table class="rpt-sig" cellpadding="0" cellspacing="0"><tr>
        <td>
            <div class="sig-line"></div>
            <div class="sig-role">Reporting Pathologist</div>
            <div class="sig-hint">Signature &amp; date</div>
        </td>
        <td>
            <div class="sig-line"></div>
            <div class="sig-role">Reviewed / Authorised</div>
            <div class="sig-hint">Signature &amp; date</div>
        </td>
    </tr></table>

    <!-- Footer -->
    <table class="rpt-foot" cellpadding="0" cellspacing="0"><tr>
        <td>
            ${logoUri ? `<img class="foot-logo" src="${logoUri}" alt="" />` : ''}
            ${esc(o.accession_number)} · ${esc(o.patient_name)}
        </td>
        <td class="right">IBCC LIS · Generated ${esc(generatedAt)}</td>
    </tr></table>

</div>
</body></html>`
}

// ── PRINT ───────────────────────────────────────────────────────────────────
const printResultsReport = async () => {
    if (!order.value || !test.value) return
    reportGenerating.value = 'print'
    const logoUri = await loadLogoDataUri()
    const html = buildReportDocument(logoUri)

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'; iframe.style.bottom = '0'
    iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument!
    doc.open(); doc.write(html); doc.close()

    iframe.onload = () => {
        // Wait for images to decode before printing
        const imgs = Array.from(iframe.contentDocument?.images ?? [])
        Promise.all(imgs.map(img => img.complete ? Promise.resolve() :
            new Promise(res => { img.onload = img.onerror = () => res(null) })))
            .then(() => setTimeout(() => {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                setTimeout(() => {
                    document.body.removeChild(iframe)
                    reportGenerating.value = null
                }, 500)
            }, 150))
    }
}

// ── PDF ─────────────────────────────────────────────────────────────────────
const downloadResultsPdf = async () => {
    if (!order.value || !test.value) return
    reportGenerating.value = 'pdf'
    const filename = `${test.value.accession_number || 'report'}.pdf`
    const logoUri = await loadLogoDataUri()
    const html = buildReportDocument(logoUri)

    // Same HTML as print; injected html2pdf script triggers the download.
    // Rendering `document.body` (full document, not a fragment) gives the
    // canvas rasteriser the same DOM the print engine would see.
    const wrapper = html.replace(
        '</body>',
        `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
         <script>
           window.addEventListener('load', function () {
               var imgs = Array.prototype.slice.call(document.images);
               Promise.all(imgs.map(function (img) {
                   return img.complete ? Promise.resolve()
                       : new Promise(function (res) { img.onload = img.onerror = res; });
               })).then(function () {
                   setTimeout(function () {
                       window.html2pdf().set({
                           margin: [10, 10, 12, 10],
                           filename: ${JSON.stringify(filename)},
                           image: { type: 'jpeg', quality: 0.98 },
                           html2canvas: { scale: 2, useCORS: true, allowTaint: true,
                                          backgroundColor: '#ffffff', letterRendering: true,
                                          logging: false },
                           jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait',
                                    compress: true },
                           pagebreak: { mode: ['css', 'legacy'], avoid: ['.rpt-section', '.rpt-sig', '.info-card'] }
                       }).from(document.body).save().then(function () {
                           parent.postMessage('ibcc-pdf-done', '*');
                       }).catch(function () { parent.postMessage('ibcc-pdf-done', '*'); });
                   }, 200);
               });
           });
         <\/script>
       </body>`,
    )

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'; iframe.style.top = '0'
    iframe.style.width = '794px'; iframe.style.height = '1123px'; iframe.style.border = '0'
    document.body.appendChild(iframe)

    const cleanup = () => {
        window.removeEventListener('message', onMsg)
        setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe)
            reportGenerating.value = null
        }, 300)
    }
    const onMsg = (e: MessageEvent) => { if (e.data === 'ibcc-pdf-done') cleanup() }
    window.addEventListener('message', onMsg)

    const doc = iframe.contentDocument!
    doc.open(); doc.write(wrapper); doc.close()
    setTimeout(() => { if (reportGenerating.value === 'pdf') cleanup() }, 30000)
}

const openResultWizard = () => {
    resultError.value = null
    const restored = loadDraft()
    if (!restored) {
        resultRows.value = isAnatomicPath.value
            ? AP_TEMPLATE.map(t => makeRow(t))
            : [makeRow({ value_type: 'text' })]
        wizardStep.value = 0
    }
    resultWizardOpen.value = true
}

const addResultRow = () => resultRows.value.push(makeRow({ value_type: 'text' }))
const removeResultRow = (i: number) => resultRows.value.splice(i, 1)
const moveResultRow = (i: number, dir: -1 | 1) => {
    const arr = resultRows.value
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    const a = arr[i]
    const b = arr[j]
    if (!a || !b) return
    arr[i] = b
    arr[j] = a
}

// Auto-derive flag for numeric rows from ref range
const autoFlagNumeric = (r: ResultRow) => {
    if (r.value_type !== 'numeric' || r.value_numeric == null) return
    const lo = r.reference_low, hi = r.reference_high
    if (lo != null && r.value_numeric < lo) r.flag = 'low'
    else if (hi != null && r.value_numeric > hi) r.flag = 'high'
    else r.flag = 'normal'
}

// Convenience: any row critical?
const hasCriticalRow = computed(() =>
    resultRows.value.some(r =>
        r.is_critical || r.flag === 'critical_high' || r.flag === 'critical_low',
    ),
)

const flagChipClass = (flag: ResultFlag) => {
    const meta = FLAG_OPTIONS.find(f => f.value === flag)
    switch (meta?.tone) {
        case 'ok': return 'bg-ribbon-teal/10 text-ribbon-teal border border-ribbon-teal/25'
        case 'warn': return 'bg-ribbon-amber/10 text-ribbon-amber border border-ribbon-amber/30'
        case 'crit': return 'bg-error-container text-error border border-error/30'
        default: return 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
    }
}

const submitResults = async () => {
    resultError.value = null

    // ── validate ──────────────────────────────────────────────────────────
    if (!resultRows.value.length) {
        resultError.value = 'Add at least one result row.'; return
    }
    for (const [i, r] of resultRows.value.entries()) {
        if (!r.analyte_name?.trim()) {
            resultError.value = `Row ${i + 1}: analyte name is required.`; return
        }
        const hasValue =
            (r.value_type === 'numeric' && r.value_numeric != null && !Number.isNaN(r.value_numeric)) ||
            (r.value_type === 'coded' && !!r.value_coded?.trim()) ||
            ((r.value_type === 'text' || r.value_type === 'narrative') && !!r.value_text?.trim())
        if (!hasValue) {
            resultError.value = `Row ${i + 1} (${r.analyte_name}): a value is required.`; return
        }
        const critical = r.is_critical || r.flag === 'critical_high' || r.flag === 'critical_low'
        if (critical && r.status === 'final' && (!r.critical_notified_to?.trim() || !r.critical_notified_at?.trim())) {
            resultError.value = `Row ${i + 1} (${r.analyte_name}): critical results require notification (who + when) before "final".`
            return
        }
    }

    // ── build payload ─────────────────────────────────────────────────────
    const payload = resultRows.value.map(r => {
        const row: Record<string, any> = {
            analyte_name: r.analyte_name.trim(),
            flag: r.flag,
            status: r.status,
        }
        if (r.analyte_code) row.analyte_code = r.analyte_code
        if (r.loinc_code) row.loinc_code = r.loinc_code
        if (r.value_type === 'numeric') {
            row.value_numeric = Number(r.value_numeric)
            if (r.unit) row.unit = r.unit
            if (r.reference_low != null) row.reference_low = Number(r.reference_low)
            if (r.reference_high != null) row.reference_high = Number(r.reference_high)
            if (r.reference_text) row.reference_text = r.reference_text
        } else if (r.value_type === 'coded') {
            row.value_coded = r.value_coded?.trim()
        } else {
            row.value_text = r.value_text?.trim()
        }
        if (r.is_critical) row.is_critical = true
        if (r.instrument) row.instrument = r.instrument
        if (r.method) row.method = r.method
        if (r.comment) row.comment = r.comment
        if (r.critical_notified_to) row.critical_notified_to = r.critical_notified_to
        if (r.critical_notified_at) row.critical_notified_at = r.critical_notified_at
        return row
    })

    resultSubmitting.value = true
    try {
        await createResults(orderUuid.value, testUuid.value, payload)
        clearDraft()
        wizardStep.value = 0
        resultWizardOpen.value = false
        selectedSlideUuids.value = new Set()
        await load()
    } catch (e: any) {
        resultError.value = e?.message || 'Failed to save results.'
    } finally {
        resultSubmitting.value = false
    }
}

// ── Result-detail modal (per-row expand) ────────────────────────────────────
const resultDetailOpen = ref(false)
const resultDetailRow = ref<any | null>(null)

const openResultDetail = (r: any) => {
    resultDetailRow.value = r
    resultDetailOpen.value = true
}

// Section-code copy shown in the detail modal ("what is this code?")
const RESULT_CODE_HINT: Record<string, string> = {
    'CLIN_HX': 'Local code — clinical referral history.',
    'IHC_PANEL': 'Local code — immunohistochemistry panel results.',
    'COMMENT': 'Local code — pathologist recommendations.',
    '22634-0': 'LOINC 22634-0 — gross description.',
    '22635-7': 'LOINC 22635-7 — microscopic description.',
    '22637-3': 'LOINC 22637-3 — final diagnosis.',
}
const resultCodeHint = (code?: string) => (code && RESULT_CODE_HINT[code]) || (code ? 'Custom code' : '')

const allBlocksSelected = computed(() =>
    !!test.value?.blocks?.length &&
    selectedBlockUuids.value.size === test.value.blocks.length,
)
const someBlocksSelected = computed(() =>
    selectedBlockUuids.value.size > 0 && !allBlocksSelected.value,
)

const toggleBlockSelection = (uuid: string) => {
    const s = new Set(selectedBlockUuids.value)
    s.has(uuid) ? s.delete(uuid) : s.add(uuid)
    selectedBlockUuids.value = s
    if (!s.size) bulkMenuOpen.value = false
}
const toggleSelectAllBlocks = () => {
    if (allBlocksSelected.value) {
        selectedBlockUuids.value = new Set()
        bulkMenuOpen.value = false
    } else {
        selectedBlockUuids.value = new Set((test.value?.blocks || []).map((b: any) => b.uuid))
    }
}

// Download cassette label (used by per-block download icon)
const downloadCassetteLabel = (block: any) => {
    const url = block?.cassette_label?.url
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.rel = 'noopener'
    a.download = `cassette_${block.part || block.label || 'label'}.nlbl`
    document.body.appendChild(a)
    a.click()
    a.remove()
}

// ── Section modal ───────────────────────────────────────────────────────────
const STAIN_CATEGORIES = [
    { value: 'routine_he', label: 'Routine H&E' },
    { value: 'special_stain', label: 'Special stain' },
    { value: 'ihc', label: 'IHC' },
    { value: 'cytology', label: 'Cytology' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'unstained', label: 'Unstained' },
] as const
const STAINS = ['H&E', 'PAS', 'ZN', 'CD20'] as const

interface SectionSlide {
    laboratory_order_test_block_uuid: string
    label_range: string
    stain: string
    stain_category: string
    _blockLabel: string  // UI-only
    _blockPart: string   // UI-only
}

const sectionModalOpen = ref(false)
const sectionSubmitting = ref(false)
const sectionError = ref<string | null>(null)
const sectionSlides = ref<SectionSlide[]>([])

const openSectionModal = () => {
    const blocks = (test.value?.blocks || []).filter((b: any) => selectedBlockUuids.value.has(b.uuid))
    sectionSlides.value = blocks.map((b: any) => ({
        laboratory_order_test_block_uuid: b.uuid,
        // label_range = the letter prefix of the block (A1 → A, B3 → B).
        // Locked in the UI; derived once here.
        label_range: (b.label || 'A').match(/^[A-Za-z]+/)?.[0] || (b.label || 'A'),
        stain: 'H&E',
        stain_category: 'routine_he',
        _blockLabel: b.label,
        _blockPart: b.part,
    }))
    sectionError.value = null
    bulkMenuOpen.value = false
    sectionModalOpen.value = true
}

const submitSection = async () => {
    sectionError.value = null

    // Validate
    for (const s of sectionSlides.value) {
        if (!s.label_range?.trim()) { sectionError.value = 'Label range is required for every slide.'; return }
        if (!s.stain) { sectionError.value = 'Stain is required for every slide.'; return }
        if (!s.stain_category) { sectionError.value = 'Stain category is required for every slide.'; return }
    }

    sectionSubmitting.value = true
    try {
        const payload = sectionSlides.value.map(s => ({
            laboratory_order_test_block_uuid: s.laboratory_order_test_block_uuid,
            label_range: s.label_range.trim(),
            stain: s.stain,
            stain_category: s.stain_category,
        }))
        const res = await sectionBlocks(orderUuid.value, testUuid.value, payload)
        // refresh test with server response
        await sectionBlocks(orderUuid.value, testUuid.value, payload)
        sectionModalOpen.value = false
        selectedBlockUuids.value = new Set()
        // Refresh everything from the server so blocks + slides + status update together
        await load()
    } catch (e: any) {
        sectionError.value = e?.message || 'Failed to submit sectioning.'
    } finally {
        sectionSubmitting.value = false
    }
}

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

// ── Strip HTML → plain text for outbound gross description ──────────────────
// ConsultNoteEditor (CKEditor 5) emits '<p>…</p>' even for single-line input.
// The API expects plain text, so strip tags/entities before submitting.
const htmlToPlainText = (html: string | null | undefined): string => {
    if (!html) return ''
    // Prefer the DOM parser on client — safer than regex for nested markup.
    if (typeof window !== 'undefined') {
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        return (tmp.textContent || tmp.innerText || '').trim()
    }
    // SSR fallback — coarse strip.
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}

const plainTextLength = (html: string | null | undefined): number =>
    htmlToPlainText(html).length

const submitGross = async () => {
    grossError.value = null
    if (!grossBlocks.value.every(b => b.container_type_uuid)) {
        grossError.value = 'Select a container type for every block.'
        return
    }
    // Ensure descriptions are non-empty after HTML strip
    if (!grossBlocks.value.every(b => htmlToPlainText(b.description).length > 0)) {
        grossError.value = 'Enter a gross description for every block.'
        return
    }
    grossSubmitting.value = true
    try {
        const payload = grossBlocks.value.map(b => ({
            laboratory_order_test_container_type_uuid: b.container_type_uuid,
            label_range: grossLabel.value,
            description: htmlToPlainText(b.description), // ← strip <p> and other tags
            decalcified: b.decalcified,
            ...(b.tissue_embedded ? { tissue_embedded: true } : {}),
        }))
        const res = await grossTest(orderUuid.value, testUuid.value, payload)
        order.value = res?.order ?? order.value
        test.value = res?.test ?? test.value
        await load()
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
        const [res] = await Promise.all([
            showTest(orderUuid.value, testUuid.value),
            loadTimeline(),                    // ← add
        ])
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

// Results-tab helpers
const finalResultsCount = computed(() =>
    (test.value?.results || []).filter((r: any) => r.status === 'final').length,
)
const preliminaryResultsCount = computed(() =>
    (test.value?.results || []).filter((r: any) => r.status === 'preliminary').length,
)
const criticalResultsCount = computed(() =>
    (test.value?.results || []).filter((r: any) => r.is_critical).length,
)


// ═══════════════════════════════════════════════════════════════════════════
// Results tab: selection + validation modal
// ═══════════════════════════════════════════════════════════════════════════
const selectedResultUuids = ref<Set<string>>(new Set())
const resultsBulkMenuOpen = ref(false)
const resultsBulkMenuRef = ref<HTMLElement | null>(null)

// ── Floating-Actions helper ─────────────────────────────────────────────────
// Watches whether an element is in the viewport; the FAB shows when it isn't.
const useInView = (target: Ref<HTMLElement | null>) => {
    const inView = ref(true)
    let observer: IntersectionObserver | null = null

    onMounted(() => {
        if (!target.value || typeof IntersectionObserver === 'undefined') return
        observer = new IntersectionObserver(
            ([entry]) => { inView.value = !!entry?.isIntersecting },
            { threshold: 0.05, rootMargin: '-4px 0px 0px 0px' },
        )
        observer.observe(target.value)
    })
    onBeforeUnmount(() => observer?.disconnect())

    // Re-observe when the ref target changes (e.g. tab switch remounts the toolbar)
    watch(target, (el, _old) => {
        observer?.disconnect()
        if (!el || typeof IntersectionObserver === 'undefined') return
        observer = new IntersectionObserver(
            ([entry]) => { inView.value = !!entry?.isIntersecting },
            { threshold: 0.05, rootMargin: '-4px 0px 0px 0px' },
        )
        observer.observe(el)
    })

    return inView
}

const scrollToolbarIntoView = (which: 'blocks' | 'slides' | 'results') => {
    const map: Record<typeof which, HTMLElement | null> = {
        blocks: bulkMenuRef.value,
        slides: slidesBulkMenuRef.value,
        results: resultsBulkMenuRef.value,
    }
    const el = map[which]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const blocksToolbarInView = useInView(bulkMenuRef as unknown as Ref<HTMLElement | null>)
const slidesToolbarInView = useInView(slidesBulkMenuRef as unknown as Ref<HTMLElement | null>)
const resultsToolbarInView = useInView(resultsBulkMenuRef as unknown as Ref<HTMLElement | null>)

const allResultsSelected = computed(() =>
    !!test.value?.results?.length &&
    selectedResultUuids.value.size === test.value.results.length,
)
const someResultsSelected = computed(() =>
    selectedResultUuids.value.size > 0 && !allResultsSelected.value,
)

const toggleResultSelection = (uuid: string) => {
    const s = new Set(selectedResultUuids.value)
    s.has(uuid) ? s.delete(uuid) : s.add(uuid)
    selectedResultUuids.value = s
    if (!s.size) resultsBulkMenuOpen.value = false
}
const toggleSelectAllResults = () => {
    if (allResultsSelected.value) {
        selectedResultUuids.value = new Set()
        resultsBulkMenuOpen.value = false
    } else {
        selectedResultUuids.value = new Set((test.value?.results || []).map((r: any) => r.uuid))
    }
}

// Selected result rows, in test.results order (stable UI ordering)
const selectedResultRows = computed(() =>
    (test.value?.results || []).filter((r: any) => selectedResultUuids.value.has(r.uuid)),
)

// Derived validation state per row
type ValidationState = 'unvalidated' | 'tech_signed' | 'authorised'
const validationStateOf = (r: any): ValidationState => {
    if (r?.clinically_validated_by) return 'authorised'
    if (r?.technically_validated_by) return 'tech_signed'
    return 'unvalidated'
}
const validationChipClass = (state: ValidationState) => {
    switch (state) {
        case 'authorised': return 'bg-ribbon-teal/10 text-ribbon-teal border border-ribbon-teal/30'
        case 'tech_signed': return 'bg-primary/10 text-primary border border-primary/25'
        default: return 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
    }
}
const validationChipLabel = (state: ValidationState) =>
    state === 'authorised' ? 'Authorised'
        : state === 'tech_signed' ? 'Tech-signed'
            : 'Unvalidated'

/* ─── Validation modal state ───────────────────────────────────────────── */
type ValidationLevel = 'technical' | 'clinical'
type ValidationStatus = 'final' | 'corrected' | 'amended'

interface ValidationRowState {
    uuid: string
    analyte: string
    status: string
    flag: string
    is_critical: boolean
    technically_validated_by: string | null
    clinically_validated_by: string | null
    _state: 'idle' | 'running' | 'ok' | 'failed'
    _error?: string
    _acknowledged: boolean
}

const validationModalOpen = ref(false)
const validationLevel = ref<ValidationLevel>('technical')
const validationStatus = ref<ValidationStatus>('final')  // clinical only
const validationRows = ref<ValidationRowState[]>([])
const validationRunning = ref(false)
const validationError = ref<string | null>(null)
const validationDone = ref(false)

// What level is each row eligible for RIGHT NOW?
//  - null                     → already authorised, nothing to do
//  - 'technical'              → not yet tech-signed
//  - 'clinical'               → tech-signed, not yet authorised
const nextLevelForRow = (r: {
    technically_validated_by: string | null
    clinically_validated_by: string | null
}): ValidationLevel | null => {
    if (r.clinically_validated_by) return null
    if (!r.technically_validated_by) return 'technical'
    return 'clinical'
}

// Distinct levels present across the selection
const selectionLevels = computed<Set<ValidationLevel>>(() => {
    const set = new Set<ValidationLevel>()
    for (const r of validationRows.value) {
        const lvl = nextLevelForRow(r)
        if (lvl) set.add(lvl)
    }
    return set
})

const hasMixedSelection = computed(() => selectionLevels.value.size > 1)
const hasNothingToDo = computed(() =>
    validationRows.value.length > 0 && selectionLevels.value.size === 0,
)
const onlyLevel = computed<ValidationLevel | null>(() => {
    if (selectionLevels.value.size !== 1) return null
    return [...selectionLevels.value][0] as ValidationLevel
})

const openValidationModal = () => {
    if (!selectedResultRows.value.length) return
    resultsBulkMenuOpen.value = false
    validationError.value = null
    validationDone.value = false
    validationStatus.value = 'final'

    validationRows.value = selectedResultRows.value.map(r => ({
        uuid: r.uuid,
        analyte: r.analyte,
        status: r.status,
        flag: r.flag,
        is_critical: !!r.is_critical,
        technically_validated_by: r.technically_validated_by,
        clinically_validated_by: r.clinically_validated_by,
        _state: 'idle',
        _acknowledged: false,
    }))

    // Auto-detect level: whatever the selection contains.
    // Mixed selection → default to technical (the earlier phase); user sees the mix banner.
    if (selectionLevels.value.has('technical')) validationLevel.value = 'technical'
    else if (selectionLevels.value.has('clinical')) validationLevel.value = 'clinical'
    else validationLevel.value = 'technical'

    validationModalOpen.value = true
}

// A row is eligible in this run iff its next required level matches the modal's level
const rowIsEligible = (row: ValidationRowState): { ok: boolean; reason?: string } => {
    const next = nextLevelForRow(row)
    if (next === null) return { ok: false, reason: 'Already authorised' }
    if (next !== validationLevel.value) {
        return {
            ok: false,
            reason: next === 'technical'
                ? 'Needs technical sign-off first'
                : 'Ready for clinical authorisation',
        }
    }
    if (validationLevel.value === 'clinical') {
        const isCritical = row.is_critical || row.flag === 'critical_high' || row.flag === 'critical_low'
        if (isCritical && !row._acknowledged) {
            return { ok: false, reason: 'Acknowledge critical review first' }
        }
    }
    return { ok: true }
}

const eligibleRowCount = computed(() =>
    validationRows.value.filter(r => rowIsEligible(r).ok).length,
)
const anyCriticalUnAckd = computed(() =>
    validationLevel.value === 'clinical' &&
    validationRows.value.some(r => {
        if (nextLevelForRow(r) !== 'clinical') return false
        const isCritical = r.is_critical || r.flag === 'critical_high' || r.flag === 'critical_low'
        return isCritical && !r._acknowledged
    }),
)

const successCount = computed(() =>
    validationRows.value.filter(r => r._state === 'ok').length,
)
const failedCount = computed(() =>
    validationRows.value.filter(r => r._state === 'failed').length,
)

const submitValidation = async () => {
    validationError.value = null
    const rows = validationRows.value.filter(r => rowIsEligible(r).ok && r._state !== 'ok')
    if (!rows.length) {
        validationError.value = 'No eligible rows to process.'
        return
    }
    validationRunning.value = true
    // Process serially — partial failures stay actionable per row.
    for (const row of rows) {
        row._state = 'running'
        row._error = undefined
        try {
            const res: any = await validateResult(
                orderUuid.value, testUuid.value, row.uuid,
                validationLevel.value,
                validationLevel.value === 'clinical' ? validationStatus.value : undefined,
            )
            // Update local snapshot from response if returned
            const updated = res?.test?.results?.find((x: any) => x.uuid === row.uuid)
            if (updated) {
                row.status = updated.status
                row.technically_validated_by = updated.technically_validated_by
                row.clinically_validated_by = updated.clinically_validated_by
            } else {
                // Optimistic
                const who = 'You'
                const now = new Date().toISOString()
                if (validationLevel.value === 'technical') row.technically_validated_by = `${who} · ${now}`
                else row.clinically_validated_by = `${who} · ${now}`
            }
            row._state = 'ok'
        } catch (e: any) {
            row._state = 'failed'
            row._error = e?.message || 'Failed'
        }
    }
    validationRunning.value = false
    validationDone.value = true
    // Full refresh so the results tab reflects server truth
    await load()
    // Trim page selection to only rows that still need attention
    selectedResultUuids.value = new Set(
        validationRows.value.filter(r => r._state !== 'ok').map(r => r.uuid),
    )
    // If all successes are done and any rows are now ready for the NEXT level, auto-switch
    const stillPending = validationRows.value.filter(r => nextLevelForRow(r) !== null)
    if (stillPending.length && !failedCount.value) {
        const nextLvl = stillPending.every(r => nextLevelForRow(r) === 'clinical') ? 'clinical' : 'technical'
        if (nextLvl !== validationLevel.value) {
            // Reset per-row state so the next pass is clean
            validationRows.value.forEach(r => {
                if (nextLevelForRow(r) !== null) {
                    r._state = 'idle'
                    r._acknowledged = false
                    r._error = undefined
                }
            })
            validationLevel.value = nextLvl
            validationDone.value = false
        }
    }
}

// Outside-click close for the results bulk menu
onMounted(() => {
    document.addEventListener('click', (e) => {
        const t = e.target as Node
        if (resultsBulkMenuOpen.value && resultsBulkMenuRef.value && !resultsBulkMenuRef.value.contains(t)) {
            resultsBulkMenuOpen.value = false
        }
    })
})

const resultStatusClass = (status?: string) => {
    switch (status) {
        case 'final': return 'bg-ribbon-teal/10 text-ribbon-teal border border-ribbon-teal/25'
        case 'preliminary': return 'bg-accent-fixed text-accent-on border border-accent/30'
        case 'corrected':
        case 'amended': return 'bg-ribbon-amber/10 text-ribbon-amber border border-ribbon-amber/30'
        default: return 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
    }
}

// Narrative results come back as HTML (<p>…</p>); everything else is plain
const isHtmlValue = (v: unknown) =>
    typeof v === 'string' && /<[a-z][\s\S]*>/i.test(v)

// Compact date formatter (Aug 6, 22:47)
const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch { return String(iso) }
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
    overflow: visible;
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

/* ── Flag pill toggles used in the Gross modal ─────────────────────────────── */
.flag-pill {
    @apply inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-outline-variant/40 bg-white text-on-surface-variant hover:bg-surface-low transition-colors cursor-pointer select-none;
}

.flag-pill-active {
    @apply border-transparent shadow-sm;
}

.flag-pill-purple {
    @apply bg-ribbon-purple/10 text-ribbon-purple;
}

.flag-pill-teal {
    @apply bg-ribbon-teal/10 text-ribbon-teal;
}

/* ── Block card — clean island, LIS-style selection ────────────────────── */
.block-card {
    position: relative;
    background: #ffffff;
    border: 1.5px solid #e0e3e5;
    border-radius: 0.875rem;
    padding: 0.875rem;
    cursor: pointer;
    transition:
        border-color 0.16s ease,
        box-shadow 0.16s ease,
        transform 0.16s ease;
    min-width: 0;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    overflow: hidden;
}

@media (min-width: 640px) {
    .block-card {
        padding: 1rem;
    }
}

/* Thin top rail — invisible until selected */
.block-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: transparent;
    transition: background 0.16s ease;
}

.block-card:hover {
    border-color: #aed0f0;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(61, 127, 191, 0.10);
}

/* ── SELECTED — blue is the LIS/enterprise "active" convention ─────────── */
.block-card--selected {
    background: #ffffff;
    /* keep white — never tint clinical content */
    border-color: #3d7fbf;
    box-shadow:
        0 0 0 3px rgba(61, 127, 191, 0.16),
        0 10px 24px rgba(61, 127, 191, 0.14);
    transform: translateY(-1px);
}

.block-card--selected::before {
    background: linear-gradient(90deg, #3d7fbf 0%, #5b9bdb 100%);
}

.block-card--selected:hover {
    border-color: #3d7fbf;
    transform: translateY(-2px);
    box-shadow:
        0 0 0 3px rgba(61, 127, 191, 0.22),
        0 14px 30px rgba(61, 127, 191, 0.20);
}

/* Subtle floating check badge — appears when the card is selected */
.block-card__selected-badge {
    position: absolute;
    top: 0.625rem;
    right: 3rem;
    /* sits to the left of the ellipsis button */
    width: 1.375rem;
    height: 1.375rem;
    border-radius: 9999px;
    background: #3d7fbf;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(61, 127, 191, 0.35);
    animation: badge-in 0.18s ease-out both;
    pointer-events: none;
}

@keyframes badge-in {
    from {
        opacity: 0;
        transform: scale(0.6);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* ── Checkbox pill — matches blue selection color ──────────────────────── */
.checkbox-btn {
    @apply inline-flex items-center justify-center w-5 h-5 rounded-md border-2 border-outline-variant bg-white transition-all duration-150 shrink-0 cursor-pointer hover:border-ribbon-blue/70;
}

.checkbox-btn--checked,
.checkbox-btn--indeterminate {
    @apply bg-ribbon-blue border-ribbon-blue hover:border-ribbon-blue;
}

/* ── Teal variant — used on slides tab so blue "selected" stays semantic ── */
.block-card--teal:hover {
    border-color: #a3dac6;
    box-shadow: 0 6px 16px rgba(61, 174, 140, 0.10);
}

.block-card--selected-teal {
    border-color: #3dae8c;
    box-shadow:
        0 0 0 3px rgba(61, 174, 140, 0.18),
        0 10px 24px rgba(61, 174, 140, 0.16);
}

.block-card--selected-teal::before {
    background: linear-gradient(90deg, #3dae8c 0%, #5b9bdb 100%);
}

.block-card--selected-teal:hover {
    border-color: #3dae8c;
    box-shadow:
        0 0 0 3px rgba(61, 174, 140, 0.24),
        0 14px 30px rgba(61, 174, 140, 0.22);
}

.block-card__selected-badge--teal {
    background: #3dae8c;
    box-shadow: 0 2px 6px rgba(61, 174, 140, 0.35);
}

/* ── Wizard row toolbar buttons ────────────────────────────────────────── */
.btn-icon {
    @apply inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-on-surface-variant bg-white border border-outline-variant/40 hover:bg-surface-low hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed;
}

.btn-icon--danger {
    @apply text-error hover:bg-error-container/40 hover:text-error;
}

/* ── Rich-text editor wrappers inside the result wizard ────────────────── */
.rich-editor-wrap :deep(.ck-editor__editable) {
    min-height: 180px;
    max-height: 480px;
    overflow-y: auto;
}

.rich-editor-wrap--compact :deep(.ck-editor__editable) {
    min-height: 90px;
    max-height: 220px;
}

/* Broken slide image → hide the <img> so the placeholder gradient shows through */
.block-card img[data-failed="1"] {
    display: none;
}

/* ── Rendered HTML from the server (narrative results) ─────────────────── */
.result-rich :deep(p) {
    margin: 0 0 0.5rem 0;
    line-height: 1.55;
}

.result-rich :deep(p:last-child) {
    margin-bottom: 0;
}

.result-rich :deep(strong) {
    font-weight: 700;
}

.result-rich :deep(em) {
    font-style: italic;
}

.result-rich :deep(ul),
.result-rich :deep(ol) {
    margin: 0.25rem 0 0.5rem 1.25rem;
    padding: 0;
}

.result-rich :deep(li) {
    margin: 0.15rem 0;
}

.result-rich :deep(blockquote) {
    border-left: 3px solid var(--color-outline-variant, #c2c6d8);
    padding-left: 0.75rem;
    color: var(--color-on-surface-variant, #424656);
    margin: 0.5rem 0;
}

/* ── Floating Actions pill ─────────────────────────────────────────────── */
.fab-actions {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 9999px;
    color: #ffffff;
    background: linear-gradient(135deg, #5b9bdb 0%, #3d7fbf 100%);
    box-shadow:
        0 8px 24px rgba(61, 127, 191, 0.35),
        0 2px 6px rgba(0, 0, 0, 0.10),
        inset 0 1px 0 rgba(255, 255, 255, 0.20);
    font-weight: 700;
    font-size: 0.875rem;
    line-height: 1;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.fab-actions:hover {
    transform: translateY(-2px);
    box-shadow:
        0 12px 28px rgba(61, 127, 191, 0.42),
        0 4px 10px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.20);
}

.fab-actions:active {
    transform: translateY(0);
}

.fab-actions:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.fab-actions__label {
    white-space: nowrap;
}

/* Sit above bottom safe-area on mobile */
@supports (padding: env(safe-area-inset-bottom)) {
    .fab-actions {
        bottom: calc(1rem + env(safe-area-inset-bottom));
        right: calc(1rem + env(safe-area-inset-right));
    }
}

/* Enter / leave animation */
.fab-pop-enter-from,
.fab-pop-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
}

.fab-pop-enter-active,
.fab-pop-leave-active {
    transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.fab-pop-enter-to,
.fab-pop-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* Narrative HTML inside compact result cards — tighter rhythm */
.block-card .result-rich :deep(p) {
    margin: 0 0 0.35rem 0;
    line-height: 1.45;
}

.block-card .result-rich :deep(ul),
.block-card .result-rich :deep(ol) {
    margin: 0.15rem 0 0.35rem 1rem;
}
</style>