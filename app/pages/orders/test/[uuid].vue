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
                        <div class="flex items-center justify-between gap-3 mb-4 sm:mb-5 min-w-0">
                            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                                <!-- Master checkbox -->
                                <button type="button" class="checkbox-btn" :class="{
                                    'checkbox-btn--checked': allBlocksSelected,
                                    'checkbox-btn--indeterminate': someBlocksSelected,
                                }" :aria-label="allBlocksSelected ? 'Deselect all' : 'Select all'"
                                    @click="toggleSelectAllBlocks">
                                    <font-awesome-icon v-if="allBlocksSelected" :icon="['fas', 'check']"
                                        class="text-[10px] text-white" />
                                    <font-awesome-icon v-else-if="someBlocksSelected" :icon="['fas', 'minus']"
                                        class="text-[10px] text-white" />
                                </button>

                                <div class="flex items-baseline gap-2 min-w-0">
                                    <span class="text-sm font-semibold text-on-surface">
                                        {{ selectedBlockUuids.size ? `${selectedBlockUuids.size} selected` : 'Select blocks' }}
                                    </span>
                                    <span class="text-[11px] text-on-surface-variant hidden sm:inline">
                                        of {{ test.blocks.length }} total
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
                        <div class="flex items-center justify-between gap-3 mb-4 sm:mb-5 min-w-0">
                            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                                <button type="button" class="checkbox-btn" :class="{
                                    'checkbox-btn--checked': allSlidesSelected,
                                    'checkbox-btn--indeterminate': someSlidesSelected,
                                }" :aria-label="allSlidesSelected ? 'Deselect all slides' : 'Select all slides'"
                                    @click="toggleSelectAllSlides">
                                    <font-awesome-icon v-if="allSlidesSelected" :icon="['fas', 'check']"
                                        class="text-[10px] text-white" />
                                    <font-awesome-icon v-else-if="someSlidesSelected" :icon="['fas', 'minus']"
                                        class="text-[10px] text-white" />
                                </button>

                                <div class="flex items-baseline gap-2 min-w-0">
                                    <span class="text-sm font-semibold text-on-surface">
                                        {{ selectedSlideUuids.size ? `${selectedSlideUuids.size} selected` : 'Select slides' }}
                                    </span>
                                    <span class="text-[11px] text-on-surface-variant hidden sm:inline">
                                        of {{ test.slides.length }} total
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
                                            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors"
                                            @click="runStainSelected">
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

                                <!-- Slide image preview (if any) -->
                                <div v-if="slide.image_url"
                                    class="rounded-xl border border-outline-variant/30 bg-white overflow-hidden mb-3">
                                    <div
                                        class="relative bg-gradient-to-br from-secondary-fixed/40 to-surface-low aspect-[5/2] flex items-center justify-center">
                                        <img :src="slide.image_url" :alt="`Slide ${slide.label}`"
                                            class="max-h-full max-w-full object-contain p-1.5" loading="lazy" />
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
                <GenericRecordList v-else-if="tab === 'results'" :items="test.results" empty-icon="clipboard-check"
                    empty-text="No results recorded yet." accent="purple" />
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
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs sm:text-sm" />
                                <input v-model="block.containerSearch" type="text" class="input-field pl-9"
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
            :subtitle="`${sectionSlides.length} slide${sectionSlides.length === 1 ? '' : 's'} · ${test?.accession_number || ''}`"
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import type { LabOrderDetail, LabOrderTest } from '~/composables/useLaboratory'
import type { ContainerType } from '~/composables/useLaboratorySettings'

const route = useRoute()
const { showTest, grossTest, sectionBlocks, stainSlides } = useLaboratory()
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
</style>