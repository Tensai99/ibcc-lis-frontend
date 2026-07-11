<!-- app/pages/assets/index.vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- ── Header ────────────────────────────────────────────────────────── -->
      <header
        class="g-card relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'server']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-1xl md:text-2xl font-bold text-outline mt-0.5 break-words uppercase">
              Administrative assets overview
            </h1>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button v-if="canWrite" ref="headerMenuBtn" type="button" class="adv-btn"
            :class="{ 'adv-btn-on': headerMenu }" @click.stop="toggleHeaderMenu">
            <font-awesome-icon :icon="['fas', 'sliders']" />
            <span>Advanced options</span>
            <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
              :class="{ 'rotate-180': headerMenu }" />
          </button>
        </div>
      </header>

      <!-- feedback -->
      <div v-if="feedback.msg" :class="feedback.kind === 'error' ? 'alert-error' : 'alert-success'">
        <font-awesome-icon :icon="['fas', feedback.kind === 'error' ? 'circle-exclamation' : 'circle-check']"
          class="mt-0.5" />
        <span class="break-words">{{ feedback.msg }}</span>
      </div>

      <!-- ═══════════ ADMIN REGISTER DASHBOARD (privileged) ═══════════ -->
      <!-- ── Tab bar: width locked to the primary-tab group's measured size; expanding
             reveals the rest by scrolling within that same fixed width, never growing it ── -->
      <div ref="tabBarEl" class="g-card p-1.5 sm:p-2 inline-flex max-w-full overflow-hidden"
        :style="lockedWidth ? { width: lockedWidth + 'px' } : {}">
        <div class="flex items-center gap-1 w-full">
          <div ref="tabScroller"
            class="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap flex-1 min-w-0">
            <button v-for="t in primaryTabs" :key="t.key"
              class="tab-btn shrink-0 whitespace-nowrap text-sm sm:text-base"
              :class="{ 'tab-active': activeTab === t.key }" @click="activeTab = t.key">
              <font-awesome-icon :icon="['fas', t.icon]" class="text-xs sm:text-sm shrink-0" />
              <span class="truncate">{{ t.label }}</span>
            </button>
            <template v-if="tabsExpanded">
              <button v-for="t in secondaryTabs" :key="t.key"
                class="tab-btn shrink-0 whitespace-nowrap text-sm sm:text-base"
                :class="{ 'tab-active': activeTab === t.key }" @click="activeTab = t.key">
                <font-awesome-icon :icon="['fas', t.icon]" class="text-xs sm:text-sm shrink-0" />
                <span class="truncate">{{ t.label }}</span>
              </button>
            </template>
          </div>
          <button type="button" class="tab-more-btn shrink-0" @click="toggleMoreTabs">
            <font-awesome-icon :icon="['fas', tabsExpanded ? 'chevron-left' : 'chevron-right']" class="text-xs" />
            <span class="text-xs sm:text-sm font-semibold whitespace-nowrap">{{ tabsExpanded ? 'Show less' : 'Show more'
              }}</span>
          </button>
        </div>
      </div>

      <!-- ───────────── OVERVIEW TAB ───────────── -->
      <template v-if="activeTab === 'overview'">
        <template v-if="dashSkeleton">
          <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SkeletonPanel :bars="4" />
            <div class="grid grid-cols-1 lg:grid-cols-1 gap-5">
              <SkeletonPanel :bars="3" />
              <SkeletonPanel :bars="3" />
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <SkeletonPanel :bars="2" />
            <SkeletonPanel :bars="2" />
            <SkeletonPanel :bars="2" />
            <SkeletonPanel :bars="2" />
          </div>
        </template>
        <template v-else>
          <!-- KPI score cards (ribbon left border + meaning icon) -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider">Total assets</p>
                <span
                  class="w-8 h-8 rounded-xl bg-ribbon-blue/12 text-ribbon-blue flex items-center justify-center"><font-awesome-icon
                    :icon="['fas', 'server']" class="text-sm" /></span>
              </div>
              <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.total_assets ?? '—' }}</p>
              <p class="text-[11px] text-on-surface-variant opacity-70 mt-1">{{ summary.tangible ?? 0 }} tangible · {{
                summary.intangible ?? 0 }} intangible</p>
            </div>
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider">In service</p>
                <span
                  class="w-8 h-8 rounded-xl bg-ribbon-teal/12 text-ribbon-teal flex items-center justify-center"><font-awesome-icon
                    :icon="['fas', 'circle-check']" class="text-sm" /></span>
              </div>
              <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.in_service ?? '—' }}</p>
              <p class="text-[11px] text-on-surface-variant opacity-70 mt-1">of {{ summary.total_assets ?? 0 }} total
              </p>
            </div>
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-purple">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider">Departments holding</p>
                <span
                  class="w-8 h-8 rounded-xl bg-ribbon-purple/12 text-ribbon-purple flex items-center justify-center"><font-awesome-icon
                    :icon="['fas', 'building']" class="text-sm" /></span>
              </div>
              <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.departments_holding ?? '—' }}
              </p>
            </div>
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-amber bg-ribbon-amber/5">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider">Net book value</p>
                <span
                  class="w-8 h-8 rounded-xl bg-ribbon-amber/15 text-ribbon-amber flex items-center justify-center"><font-awesome-icon
                    :icon="['fas', 'coins']" class="text-sm" /></span>
              </div>
              <p class="text-lg sm:text-xl lg:text-2xl font-extrabold text-on-surface break-words">{{
                fmtAssetMoney(registerValue.net_book_value, registerValue.currency || 'MWK') }}</p>
              <p class="text-[11px] text-ribbon-amber font-medium mt-1">Gross {{
                fmtAssetMoney(registerValue.gross_book_value, registerValue.currency || 'MWK') }}</p>
            </div>
          </div>

          <!-- Row of 3: By class | Operational status | Condition -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="g-card p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold">Assets by class</h3>
                <span class="text-[11px] font-bold text-ribbon-blue bg-ribbon-blue/12 px-2.5 py-1 rounded-full">{{
                  byClass.length }}</span>
              </div>
              <client-only>
                <apexchart v-if="byClass.length" type="bar" :height="classChartHeight" :options="classChartOptions"
                  :series="classChartSeries" />
                <p v-else class="text-sm text-on-surface-variant py-8 text-center">No data.</p>
              </client-only>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-1 gap-5">
              <div class="g-card p-6">
                <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold mb-4">Operational status</h3>
                <div class="space-y-3">
                  <div v-for="s in byStatus" :key="s.status">
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-xs sm:text-sm font-medium break-words">{{ titleCase(s.status) }}</span>
                      <span class="text-xs sm:text-sm font-bold">{{ s.count }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                      <div class="h-full rounded-full bg-ribbon-blue"
                        :style="{ width: pct(s.count, summary.total_assets) + '%' }" />
                    </div>
                  </div>
                  <p v-if="!byStatus.length" class="text-sm text-on-surface-variant py-4 text-center">No data.</p>
                </div>
              </div>

              <div class="g-card p-6">
                <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold mb-4">Condition</h3>
                <div class="space-y-3">
                  <div v-for="c in byCondition" :key="c.condition">
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-xs sm:text-sm font-medium break-words">{{ titleCase(c.condition) }}</span>
                      <span class="text-xs sm:text-sm font-bold">{{ c.count }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-surface-low overflow-hidden">
                      <div class="h-full rounded-full bg-ribbon-teal"
                        :style="{ width: pct(c.count, summary.total_assets) + '%' }" />
                    </div>
                  </div>
                  <p v-if="!byCondition.length" class="text-sm text-on-surface-variant py-4 text-center">No data.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tools + Departments -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <!-- Maintenance | Pending approvals | Commissioning | Tools -->
            <div class="g-card p-6 border-l-4 border-ribbon-blue">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-full bg-ribbon-blue/12 flex items-center justify-center text-ribbon-blue">
                  <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" />
                </div>
                <h3 class="text-[12px] font-bold uppercase tracking-widest">Maintenance</h3>
              </div>
              <div class="space-y-2.5">
                <div v-for="m in maintenanceRows" :key="m.label"
                  class="flex justify-between items-center p-3 rounded-2xl border"
                  :class="m.alert && m.value ? 'bg-error/8 border-error/20' : 'bg-ribbon-blue/10 border-ribbon-blue/15'">
                  <span class="text-xs sm:text-sm font-medium"
                    :class="m.alert && m.value ? 'text-error font-bold' : 'text-on-surface'">{{ m.label }}</span>
                  <span class="font-extrabold px-2.5 py-0.5 rounded-lg"
                    :class="m.alert && m.value ? 'text-error bg-error/10' : 'text-ribbon-blue bg-ribbon-blue/12'">{{
                      m.value }}</span>
                </div>
              </div>
            </div>

            <div class="g-card p-6 border-l-4 border-ribbon-amber">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber">
                  <font-awesome-icon :icon="['fas', 'clipboard-check']" />
                </div>
                <h3 class="text-[12px] font-bold uppercase tracking-widest">Pending approvals</h3>
              </div>
              <div class="space-y-3">
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-ribbon-teal/20 rounded-2xl border border-ribbon-amber/15 hover:bg-ribbon-amber/12 transition-colors"
                  @click="goToAssetsFiltered('damages')">
                  <span class="text-sm sm:text-base font-medium">Damages</span>
                  <span class="font-extrabold px-3 py-1 rounded-lg"
                    :class="approvals.damages ? 'text-ribbon-amber bg-ribbon-amber/18' : 'text-outline bg-surface-container'">{{
                      pad(approvals.damages) }}</span>
                </button>
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-ribbon-amber/20 rounded-2xl border border-ribbon-amber/15 hover:bg-ribbon-amber/12 transition-colors"
                  @click="goToAssetsFiltered('disposals')">
                  <span class="text-sm sm:text-base font-medium">Disposals</span>
                  <span class="font-extrabold px-3 py-1 rounded-lg"
                    :class="approvals.disposals ? 'text-ribbon-amber bg-ribbon-amber/18' : 'text-outline bg-surface-container'">{{
                      pad(approvals.disposals) }}</span>
                </button>
                <div
                  class="flex justify-between items-center p-3.5 bg-ribbon-red/20 rounded-2xl border border-ribbon-red/15">
                  <span class="text-sm sm:text-base font-medium">Open issues</span>
                  <span class="font-extrabold px-3 py-1 rounded-lg"
                    :class="openIssues.total ? 'text-ribbon-red bg-ribbon-red/12' : 'text-outline bg-surface-container'">{{
                      pad(openIssues.total) }}</span>
                </div>
              </div>
            </div>

            <div class="g-card p-6 border-l-4 border-ribbon-red">
              <div class="flex items-center justify-between mb-5">
                <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold">Commissioning backlog</h3>
                <span class="text-[11px] font-bold text-ribbon-red bg-ribbon-red/12 px-2.5 py-1 rounded-full">{{
                  commissioningBacklog.length }}</span>
              </div>
              <div class="space-y-2 max-h-[260px] overflow-y-auto pr-1 scroll-area">
                <div v-for="b in commissioningBacklog" :key="b.asset_tag"
                  class="p-3 bg-ribbon-red/10 rounded-xl border border-ribbon-red/15">
                  <div class="flex justify-between items-center gap-2">
                    <span class="text-xs font-bold text-ribbon-red font-mono">{{ b.asset_tag }}</span>
                    <span class="text-[10px] text-ribbon-red/70 whitespace-nowrap truncate max-w-[45%]">{{ b.type
                      }}</span>
                  </div>
                  <p class="text-xs text-on-surface-variant break-words mt-0.5">{{ b.name }}</p>
                </div>
                <p v-if="!commissioningBacklog.length" class="text-sm text-on-surface-variant py-4 text-center">Nothing
                  awaiting commissioning.</p>
              </div>
            </div>

            <div class="g-card p-6 border-l-4 border-ribbon-teal">
              <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold mb-4">Tool register</h3>
              <div class="grid grid-cols-2 gap-5">
                <div v-for="(t, i) in toolRows" :key="t.label" class="py-12 px-3 rounded-2xl border border-l-4"
                  :class="[TOOL_BOX_BG[i % 4], TOOL_BOX_BORDER[i % 4]]">
                  <p class="text-[10px] uppercase font-bold mb-1 truncate" :class="TOOL_BOX_TEXT[i % 4]">{{ t.label }}
                  </p>
                  <p class="text-lg sm:text-xl font-extrabold text-on-surface">{{ t.value }}</p>
                </div>
              </div>
            </div>

            <div class="g-card p-6 lg:col-span-4 border-l-4 border-ribbon-purple">
              <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold mb-4">Departments — open a holdings
                dashboard</h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto scroll-area pr-1">
                <button v-for="(d, i) in departmentsList" :key="d.uuid" type="button"
                  class="text-left p-4 rounded-2xl border border-l-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  :class="[DEPT_BG[i % 5], DEPT_BORDER[i % 5]]" @click="openDeptModal(d)">
                  <p class="text-sm sm:text-base font-bold break-words">{{ d.name }}</p>
                  <p class="text-[11px] font-mono mt-0.5" :class="DEPT_TEXT[i % 5]">{{ d.code }}</p>
                </button>
                <p v-if="!departmentsList.length" class="text-sm text-on-surface-variant col-span-full">No departments.
                </p>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ───────────── ASSETS TAB ───────────── -->
      <template v-else-if="activeTab === 'assets'">
        <div class="g-card relative z-10 p-6 sm:p-8">
          <div class="flex flex-col gap-5 mb-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Asset register</h3>
                <p class="text-xs sm:text-sm text-outline">Full real-time asset listing</p>
              </div>

              <div class="flex flex-col md:flex-row gap-3">
                <!-- Advanced options: toggle the filter panel; collapses automatically once a filter is active -->
                <div class="flex items-center gap-3 flex-wrap">
                  <button type="button" class="adv-btn" :class="{ 'adv-btn-on': showFilters }"
                    @click="showFilters = !showFilters">
                    <font-awesome-icon :icon="['fas', 'sliders']" />
                    <span>Advanced Filters</span>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                      :class="{ 'rotate-180': showFilters }" />
                  </button>
                  <button v-if="anyAssetFilter" type="button" class="clear-chip" @click="clearAssetFilters">
                    <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
                    <span
                      class="ml-1 bg-ribbon-red/15 text-ribbon-red rounded-full px-1.5 text-[10px] font-extrabold">{{
                        activeFilterCount }}</span>
                  </button>
                </div>

                <!-- search bar (matches Register-Customer wizard) -->
                <div class="relative w-full md:w-96">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                  <input v-model="assetFilters.q" type="text" autocomplete="off"
                    placeholder="Search by tag, name or serial…" class="cust-input has-icon" />
                </div>
              </div>
            </div>

            <!-- filter dropdowns -->
            <div v-show="showFilters"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-4 rounded-2xl bg-surface-low/60 border border-ribbon-blue/10">
              <div>
                <label class="filter-label">Type</label>
                <SearchSelect v-model="assetFilters.type" :options="types" option-value="code" option-label="name"
                  icon="tag" placeholder="All types" search-placeholder="Search types…" clearable />
              </div>
              <div>
                <label class="filter-label">Class</label>
                <div class="filter-wrap">
                  <select v-model="assetFilters.asset_class" class="filter-select">
                    <option value="">All classes</option>
                    <option v-for="c in classOptions" :key="c" :value="c">{{ titleCase(c) }}</option>
                  </select>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                </div>
              </div>
              <div>
                <label class="filter-label">Condition</label>
                <div class="filter-wrap">
                  <select v-model="assetFilters.condition" class="filter-select">
                    <option value="">Any condition</option>
                    <option v-for="c in CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
                  </select>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                </div>
              </div>
              <div>
                <label class="filter-label">Status</label>
                <div class="filter-wrap">
                  <select v-model="assetFilters.operational_status" class="filter-select">
                    <option value="">Any status</option>
                    <option v-for="s in OP_STATUSES" :key="s" :value="s">{{ titleCase(s) }}</option>
                  </select>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                </div>
              </div>
              <div>
                <label class="filter-label">Damage approval</label>
                <div class="filter-wrap">
                  <select v-model="assetFilters.pending_damages" class="filter-select">
                    <option value="">Any damage state</option>
                    <option value="true">Awaiting approval</option>
                    <option value="false">No damage pending</option>
                  </select>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                </div>
              </div>
              <div>
                <label class="filter-label">Disposal approval</label>
                <div class="filter-wrap">
                  <select v-model="assetFilters.pending_disposals" class="filter-select">
                    <option value="">Any disposal state</option>
                    <option value="true">Awaiting approval</option>
                    <option value="false">No disposal pending</option>
                  </select>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                </div>
              </div>
            </div>

            <!-- Flag legend -->
            <div
              class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-on-surface-variant px-1">
              <span class="font-bold uppercase tracking-wider text-outline">Legend:</span>
              <span class="flex items-center gap-1.5"><font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                  class="text-ribbon-amber" /> Pending damage approval</span>
              <span class="flex items-center gap-1.5"><font-awesome-icon :icon="['fas', 'trash-can']"
                  class="text-ribbon-red" /> Pending disposal approval</span>
              <span class="flex items-center gap-1.5"><span
                  class="inline-flex items-center justify-center min-w-[1.4rem] h-4 px-1 rounded bg-ribbon-blue/12 text-ribbon-blue font-bold">n<span
                    class="lowercase">u</span></span> Unallocated units</span>
            </div>
          </div>

          <!-- rows visible at once; scroll within the box to see the rest of this page -->
          <div class="flex items-center justify-end gap-2 mb-3">
            <label class="text-xs text-on-surface-variant">Rows per view</label>
            <div class="filter-wrap w-24">
              <select v-model.number="rowsPerView" class="filter-select">
                <option v-for="n in ROWS_PER_VIEW_OPTIONS" :key="n" :value="n">{{ n }}</option>
              </select>
              <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
            </div>
          </div>

          <div class="overflow-x-auto overflow-y-auto rounded-2xl border border-outline-variant/10"
            :style="{ maxHeight: scrollMaxH }">
            <table class="w-full text-left border-collapse text-sm sm:text-base">
              <thead class="sticky top-0 z-10 bg-[#f4f7fb]">
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                  <th class="py-4 px-5">Tag</th>
                  <th class="py-4 px-5">Name</th>
                  <th class="py-4 px-5">Type</th>
                  <th class="py-4 px-5">Custody</th>
                  <!-- <th class="py-4 px-5 text-right">Qty</th> -->
                  <th class="py-4 px-5 text-center">Status</th>
                  <th class="py-4 px-5 text-center">Flags</th>
                  <th class="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-if="loadingAssets">
                  <td colspan="8" class="py-8 text-center text-on-surface-variant">Loading…</td>
                </tr>
                <tr v-for="a in filteredAssets" :key="a.uuid" class="hover:bg-surface-low transition-all cursor-pointer"
                  @click="navigateTo(`/assets/${a.uuid}`)">
                  <td class="py-5 px-5 font-mono text-[11px] text-primary whitespace-nowrap">{{ a.asset_tag }}</td>
                  <td class="py-5 px-5">
                    <p class="font-bold text-on-surface break-words">{{ a.name }}</p>
                    <p v-if="a.serial_number" class="text-[10px] text-outline break-words">SN {{ a.serial_number }}</p>
                  </td>
                  <td class="py-5 px-5"><span
                      class="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold whitespace-nowrap">{{
                        a.type?.name }}</span></td>
                  <td class="py-5 px-5 text-xs text-on-surface-variant break-words">{{ custodyLabel(a) }}</td>
                  <!-- <td class="py-5 px-5 text-right font-medium">{{ a.allocated_quantity ?? 0 }}</td> -->
                  <td class="py-5 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                      :class="statusClass(a.operational_status)">{{ titleCase(a.operational_status) }}</span>
                  </td>
                  <td class="py-5 px-5">
                    <div class="flex justify-center items-center gap-1.5">
                      <font-awesome-icon v-if="a.has_pending_damages_approval" :icon="['fas', 'triangle-exclamation']"
                        class="text-ribbon-amber text-xs" title="Pending damage approval" />
                      <font-awesome-icon v-if="a.has_pending_disposal_approval" :icon="['fas', 'trash-can']"
                        class="text-ribbon-red text-xs" title="Pending disposal approval" />
                      <span v-if="a.unallocated_quantity" class="text-[10px] font-bold text-ribbon-blue"
                        :title="`${a.unallocated_quantity} unallocated`">{{ a.unallocated_quantity }}u</span>
                      <span
                        v-if="!a.has_pending_damages_approval && !a.has_pending_disposal_approval && !a.unallocated_quantity"
                        class="text-[10px] text-outline">—</span>
                    </div>
                  </td>
                  <!-- row actions -->
                  <td class="py-5 px-5 text-right" @click.stop>
                    <button class="row-act-btn" title="Actions" @click.stop="openRowMenu($event, a)">
                      <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!loadingAssets && !filteredAssets.length">
                  <td colspan="8" class="py-8 text-center text-on-surface-variant">No assets match the current filters.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="assetsMeta.total_pages > 1" class="flex items-center justify-between gap-3 mt-4">
            <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ assetsMeta.page }} of {{
              assetsMeta.total_pages }} — {{ assetsMeta.total }} total</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="assetsMeta.page === 1"
                @click="goAssetPage(assetsMeta.page - 1)"><font-awesome-icon :icon="['fas', 'chevron-left']" /></button>
              <span class="text-sm font-semibold text-on-surface">{{ assetsMeta.page }} / {{ assetsMeta.total_pages
              }}</span>
              <button class="pager-btn" :disabled="assetsMeta.page === assetsMeta.total_pages"
                @click="goAssetPage(assetsMeta.page + 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-right']" /></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ───────────── ALL ASSETS ISSUES TAB ───────────── -->
      <template v-else-if="activeTab === 'issues'">
        <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All assets —
                Issues</h3>
              <p class="text-xs sm:text-sm text-outline break-words">Reported faults across every asset</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <button type="button" class="adv-btn" :class="{ 'adv-btn-on': issuesTab.filtersOpen }"
                @click="issuesTab.filtersOpen = !issuesTab.filtersOpen">
                <font-awesome-icon :icon="['fas', 'sliders']" />
                <span>Advanced Filters</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                  :class="{ 'rotate-180': issuesTab.filtersOpen }" />
              </button>
              <button v-if="issuesTab.anyFilter()" type="button" class="clear-chip" @click="issuesTab.clear()">
                <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
              </button>
            </div>
          </div>

          <HistoryFilterBar v-model="issuesTab.filters" :open="issuesTab.filtersOpen" :assets="assets"
            :departments="departmentsList" @apply="issuesTab.load()" />

          <div class="overflow-x-auto rounded-t-2xl">
            <table class="his-table tbl-red">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Fault</th>
                  <th class="text-center">Severity</th>
                  <th class="text-center">Status</th>
                  <th>Reported</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="issuesTab.loading">
                  <td colspan="8" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                </tr>
                <tr v-for="iss in issuesTab.data" :key="iss.reference_no">
                  <td><span
                      class="font-mono text-xs sm:text-sm text-primary bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap">{{
                      iss.reference_no }}</span></td>
                  <td class="min-w-0">
                    <p class="font-semibold sm:font-bold break-words">{{ iss.asset }}</p>
                    <p class="text-xs sm:text-sm text-outline truncate">{{ iss.asset_tag }}</p>
                  </td>
                  <td class="text-on-surface-variant break-words">
                    <span class="ribbon-dot-purple inline-block mr-1.5"></span>{{ iss.department }}
                  </td>
                  <td class="break-words">{{ iss.fault_description }}</td>
                  <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                      :class="severityClass(iss.severity)">{{ titleCase(iss.severity) }}</span></td>
                  <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                      :class="iss.status === 'RESOLVED' || iss.status === 'CLOSED' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                        titleCase(iss.status) }}</span></td>
                  <td class="text-on-surface-variant whitespace-nowrap">{{ fmtDateTime(iss.reported_at) }}</td>
                  <td class="text-right" @click.stop>
                    <button v-if="canWrite" class="row-act-btn" title="Actions"
                      @click.stop="openIssueMenu($event, iss)">
                      <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                    </button>
                    <span v-else class="text-xs sm:text-sm text-outline">—</span>
                  </td>
                </tr>
                <tr v-if="!issuesTab.loading && !issuesTab.data.length">
                  <td colspan="8" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No issues match
                    the
                    current filters.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="issuesTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ issuesTab.meta.page }} of {{
              issuesTab.meta.total_pages }} — {{ issuesTab.meta.total }} total</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="issuesTab.meta.page === 1"
                @click="issuesTab.goPage(issuesTab.meta.page - 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-left']" /></button>
              <button class="pager-btn" :disabled="issuesTab.meta.page === issuesTab.meta.total_pages"
                @click="issuesTab.goPage(issuesTab.meta.page + 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-right']" /></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ───────────── ALL ASSETS MAINTENANCES TAB ───────────── -->
      <template v-else-if="activeTab === 'maintenances'">
        <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All assets —
                Maintenances</h3>
              <p class="text-xs sm:text-sm text-outline break-words">Every maintenance job card — click a row to open it
              </p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <button type="button" class="adv-btn" :class="{ 'adv-btn-on': maintenancesTab.filtersOpen }"
                @click="maintenancesTab.filtersOpen = !maintenancesTab.filtersOpen">
                <font-awesome-icon :icon="['fas', 'sliders']" />
                <span>Advanced Filters</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                  :class="{ 'rotate-180': maintenancesTab.filtersOpen }" />
              </button>
              <button v-if="maintenancesTab.anyFilter()" type="button" class="clear-chip"
                @click="maintenancesTab.clear()">
                <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
              </button>
            </div>
          </div>

          <HistoryFilterBar v-model="maintenancesTab.filters" :open="maintenancesTab.filtersOpen" :assets="assets"
            :departments="departmentsList" @apply="maintenancesTab.load()" />

          <div class="overflow-x-auto rounded-t-2xl">
            <table class="his-table tbl-blue">
              <thead>
                <tr>
                  <th>Job card</th>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th class="text-center">Status</th>
                  <th>Scheduled</th>
                  <th class="text-right">Total cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="maintenancesTab.loading">
                  <td colspan="7" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                </tr>
                <tr v-for="m in maintenancesTab.data" :key="m.uuid" class="cursor-pointer"
                  @click="navigateTo(`/assets/maintenance?uuid=${m.uuid}`)">
                  <td><span
                      class="font-mono text-xs sm:text-sm text-primary bg-primary/8 px-2 py-1 rounded-lg whitespace-nowrap">{{
                      m.job_card_no }}</span></td>
                  <td class="min-w-0">
                    <p class="font-semibold sm:font-bold break-words">{{ m.asset }}</p>
                    <p class="text-xs sm:text-sm text-outline truncate">{{ m.asset_tag }}</p>
                  </td>
                  <td class="text-on-surface-variant break-words">
                    <span class="ribbon-dot-purple inline-block mr-1.5"></span>{{ m.department }}
                  </td>
                  <td><span
                      class="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap">{{
                      titleCase(m.type) }}</span></td>
                  <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                      :class="m.status === 'COMPLETED' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                        titleCase(m.status) }}</span></td>
                  <td class="text-on-surface-variant whitespace-nowrap">{{ m.scheduled_date }}</td>
                  <td class="text-right font-medium truncate">{{ fmtAssetMoney(m.total_cost) }}</td>
                </tr>
                <tr v-if="!maintenancesTab.loading && !maintenancesTab.data.length">
                  <td colspan="7" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No maintenances
                    match the current filters.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="maintenancesTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ maintenancesTab.meta.page }} of {{
              maintenancesTab.meta.total_pages }} — {{ maintenancesTab.meta.total }} total</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="maintenancesTab.meta.page === 1"
                @click="maintenancesTab.goPage(maintenancesTab.meta.page - 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-left']" /></button>
              <button class="pager-btn" :disabled="maintenancesTab.meta.page === maintenancesTab.meta.total_pages"
                @click="maintenancesTab.goPage(maintenancesTab.meta.page + 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-right']" /></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ───────────── ALL ASSETS INSPECTIONS TAB ───────────── -->
      <template v-else-if="activeTab === 'inspections'">
        <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All assets —
                Inspections</h3>
              <p class="text-xs sm:text-sm text-outline break-words">Every PPM / routine inspection — click a row to
                open
                it</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <button type="button" class="adv-btn" :class="{ 'adv-btn-on': inspectionsTab.filtersOpen }"
                @click="inspectionsTab.filtersOpen = !inspectionsTab.filtersOpen">
                <font-awesome-icon :icon="['fas', 'sliders']" />
                <span>Advanced Filters</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                  :class="{ 'rotate-180': inspectionsTab.filtersOpen }" />
              </button>
              <button v-if="inspectionsTab.anyFilter()" type="button" class="clear-chip"
                @click="inspectionsTab.clear()">
                <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
              </button>
            </div>
          </div>

          <HistoryFilterBar v-model="inspectionsTab.filters" :open="inspectionsTab.filtersOpen" :assets="assets"
            :departments="departmentsList" @apply="inspectionsTab.load()" />

          <div class="overflow-x-auto rounded-t-2xl">
            <table class="his-table tbl-teal">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th class="text-center">Outcome</th>
                  <th>Date</th>
                  <th>Next due</th>
                  <th>Inspected by</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="inspectionsTab.loading">
                  <td colspan="7" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                </tr>
                <tr v-for="insp in inspectionsTab.data" :key="insp.uuid" class="cursor-pointer"
                  @click="navigateTo(`/assets/inspect?uuid=${insp.uuid}`)">
                  <td class="min-w-0">
                    <p class="font-semibold sm:font-bold break-words">{{ insp.asset }}</p>
                    <p class="text-xs sm:text-sm text-outline truncate">{{ insp.asset_tag }}</p>
                  </td>
                  <td class="text-on-surface-variant break-words">
                    <span class="ribbon-dot-purple inline-block mr-1.5"></span>{{ insp.department }}
                  </td>
                  <td><span
                      class="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap">{{
                        titleCase(insp.type) }}{{ insp.quarter ? ` · ${insp.quarter}` : '' }}</span></td>
                  <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                      :class="insp.outcome === 'PASS' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-error/10 text-error'">{{
                        titleCase(insp.outcome) }}</span></td>
                  <td class="text-on-surface-variant whitespace-nowrap">{{ insp.inspection_date }}</td>
                  <td class="text-on-surface-variant whitespace-nowrap">{{ insp.next_due_on || '—' }}</td>
                  <td class="text-on-surface-variant break-words">{{ insp.inspected_by }}</td>
                </tr>
                <tr v-if="!inspectionsTab.loading && !inspectionsTab.data.length">
                  <td colspan="7" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No inspections
                    match the current filters.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="inspectionsTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ inspectionsTab.meta.page }} of {{
              inspectionsTab.meta.total_pages }} — {{ inspectionsTab.meta.total }} total</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="inspectionsTab.meta.page === 1"
                @click="inspectionsTab.goPage(inspectionsTab.meta.page - 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-left']" /></button>
              <button class="pager-btn" :disabled="inspectionsTab.meta.page === inspectionsTab.meta.total_pages"
                @click="inspectionsTab.goPage(inspectionsTab.meta.page + 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-right']" /></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ───────────── ALL ASSETS DAMAGES TAB ───────────── -->
      <template v-else-if="activeTab === 'damages'">
        <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All assets —
                Damages</h3>
              <p class="text-xs sm:text-sm text-outline break-words">Every reported damage record</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <button type="button" class="adv-btn" :class="{ 'adv-btn-on': damagesTab.filtersOpen }"
                @click="damagesTab.filtersOpen = !damagesTab.filtersOpen">
                <font-awesome-icon :icon="['fas', 'sliders']" />
                <span>Advanced Filters</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                  :class="{ 'rotate-180': damagesTab.filtersOpen }" />
              </button>
              <button v-if="damagesTab.anyFilter()" type="button" class="clear-chip" @click="damagesTab.clear()">
                <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
              </button>
            </div>
          </div>

          <HistoryFilterBar v-model="damagesTab.filters" :open="damagesTab.filtersOpen" :assets="assets"
            :departments="departmentsList" @apply="damagesTab.load()" />

          <div class="overflow-x-auto rounded-t-2xl">
            <table class="his-table tbl-amber">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Cause</th>
                  <th>Extent</th>
                  <th class="text-right">Est. repair cost</th>
                  <th class="text-center">Status</th>
                  <th>Reported</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="damagesTab.loading">
                  <td colspan="8" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                </tr>
                <tr v-for="d in damagesTab.data" :key="d.uuid">
                  <td class="min-w-0">
                    <p class="font-semibold sm:font-bold break-words">{{ d.asset }}</p>
                    <p class="text-xs sm:text-sm text-outline truncate">{{ d.asset_tag }}</p>
                  </td>
                  <td class="text-on-surface-variant break-words">
                    <span class="ribbon-dot-amber inline-block mr-1.5"></span>{{ d.department }}
                  </td>
                  <td class="break-words">{{ titleCase(d.damage_cause) }}</td>
                  <td class="break-words">{{ titleCase(d.damage_extent) }}<span v-if="!d.is_repairable"
                      class="ml-1 text-error font-bold">· not repairable</span></td>
                  <td class="text-right font-medium truncate">{{ fmtAssetMoney(d.estimated_repair_cost) }}</td>
                  <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                      :class="d.is_approved ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                        d.is_approved ? 'Approved' : 'Pending' }}</span></td>
                  <td class="text-on-surface-variant whitespace-nowrap">{{ d.reported_on }}</td>
                  <td class="text-right" @click.stop>
                    <button v-if="canWrite" class="row-act-btn" title="Actions"
                      @click.stop="openApproveMenu($event, d, 'damage')">
                      <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                    </button>
                    <span v-else class="text-xs sm:text-sm text-outline">—</span>
                  </td>
                </tr>
                <tr v-if="!damagesTab.loading && !damagesTab.data.length">
                  <td colspan="8" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No damage records
                    match the current filters.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="damagesTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ damagesTab.meta.page }} of {{
              damagesTab.meta.total_pages }} — {{ damagesTab.meta.total }} total</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="damagesTab.meta.page === 1"
                @click="damagesTab.goPage(damagesTab.meta.page - 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-left']" /></button>
              <button class="pager-btn" :disabled="damagesTab.meta.page === damagesTab.meta.total_pages"
                @click="damagesTab.goPage(damagesTab.meta.page + 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-right']" /></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ───────────── ALL ASSETS DISPOSALS TAB ───────────── -->
      <template v-else-if="activeTab === 'disposals'">
        <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All assets —
                Disposals</h3>
              <p class="text-xs sm:text-sm text-outline break-words">Every disposal / write-off record</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <button type="button" class="adv-btn" :class="{ 'adv-btn-on': disposalsTab.filtersOpen }"
                @click="disposalsTab.filtersOpen = !disposalsTab.filtersOpen">
                <font-awesome-icon :icon="['fas', 'sliders']" />
                <span>Advanced Filters</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                  :class="{ 'rotate-180': disposalsTab.filtersOpen }" />
              </button>
              <button v-if="disposalsTab.anyFilter()" type="button" class="clear-chip" @click="disposalsTab.clear()">
                <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
              </button>
            </div>
          </div>

          <HistoryFilterBar v-model="disposalsTab.filters" :open="disposalsTab.filtersOpen" :assets="assets"
            :departments="departmentsList" @apply="disposalsTab.load()" />

          <div class="overflow-x-auto rounded-t-2xl">
            <table class="his-table tbl-purple">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Department</th>
                  <th>Reason</th>
                  <th>Method</th>
                  <th class="text-right">Net book value</th>
                  <th class="text-right">Proceeds</th>
                  <th class="text-center">Status</th>
                  <th>Disposed</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="disposalsTab.loading">
                  <td colspan="9" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                </tr>
                <tr v-for="d in disposalsTab.data" :key="d.uuid">
                  <td class="min-w-0">
                    <p class="font-semibold sm:font-bold break-words">{{ d.asset }}</p>
                    <p class="text-xs sm:text-sm text-outline truncate">{{ d.asset_tag }}</p>
                  </td>
                  <td class="text-on-surface-variant break-words">
                    <span class="ribbon-dot-red inline-block mr-1.5"></span>{{ d.department }}
                  </td>
                  <td class="break-words">{{ titleCase(d.disposal_reason) }}</td>
                  <td class="break-words">{{ titleCase(d.disposal_method) }}</td>
                  <td class="text-right font-medium truncate">{{ fmtAssetMoney(d.net_book_value) }}</td>
                  <td class="text-right font-medium truncate">{{ d.proceeds ? fmtAssetMoney(d.proceeds) : '—' }}</td>
                  <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                      :class="d.is_approved ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                        d.is_approved ? 'Approved' : 'Pending' }}</span></td>
                  <td class="text-on-surface-variant whitespace-nowrap">{{ d.disposed_on }}</td>
                  <td class="text-right" @click.stop>
                    <button v-if="canWrite" class="row-act-btn" title="Actions"
                      @click.stop="openApproveMenu($event, d, 'disposal')">
                      <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                    </button>
                    <span v-else class="text-xs sm:text-sm text-outline">—</span>
                  </td>
                </tr>
                <tr v-if="!disposalsTab.loading && !disposalsTab.data.length">
                  <td colspan="9" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No disposal
                    records
                    match the current filters.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="disposalsTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ disposalsTab.meta.page }} of {{
              disposalsTab.meta.total_pages }} — {{ disposalsTab.meta.total }} total</p>
            <div class="flex items-center gap-2">
              <button class="pager-btn" :disabled="disposalsTab.meta.page === 1"
                @click="disposalsTab.goPage(disposalsTab.meta.page - 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-left']" /></button>
              <button class="pager-btn" :disabled="disposalsTab.meta.page === disposalsTab.meta.total_pages"
                @click="disposalsTab.goPage(disposalsTab.meta.page + 1)"><font-awesome-icon
                  :icon="['fas', 'chevron-right']" /></button>
            </div>
          </div>
        </div>
      </template>

      <!-- ───────────── TEMPLATES TAB ───────────── -->
      <template v-else-if="activeTab === 'templates'">
        <div class="g-card relative z-10 p-6 sm:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Inspection checklist templates</h3>
              <p class="text-xs sm:text-sm text-outline">Click a template to view or edit it</p>
            </div>
            <div class="relative w-full md:w-80">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
              <input v-model="templateQuery" type="text" autocomplete="off" placeholder="Search templates…"
                class="cust-input has-icon" />
            </div>
          </div>

          <div v-if="loadingTemplates" class="py-10 text-center text-on-surface-variant">Loading templates…</div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div v-for="(t, i) in filteredTemplates" :key="t.uuid"
              class="flex flex-col p-5 rounded-2xl border-l-4 hover:shadow-lg hover:-translate-y-0.5 transition-all bg-surface-bright"
              :class="TEMPLATE_ACCENT[i % 5]">
              <!-- content region → view / edit the template -->
              <button type="button" class="text-left flex-1 min-w-0"
                @click="navigateTo(`/assets/checklist?uuid=${t.uuid}`)">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="text-xs font-mono break-words" :class="TEMPLATE_CODE[i % 5]">{{ t.code }}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    :class="TEMPLATE_PILL[i % 5]">{{ titleCase(t.frequency) }}</span>
                </div>
                <p class="font-bold text-sm sm:text-base text-on-surface break-words mb-3">{{ t.name }}</p>
                <div class="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                  <span class="bg-surface-low px-2 py-0.5 rounded-md break-words">{{ t.asset_type?.name }}</span>
                  <span class="bg-surface-low px-2 py-0.5 rounded-md">{{ t.section_count }} sections</span>
                  <span class="bg-surface-low px-2 py-0.5 rounded-md">{{ t.task_count }} tasks</span>
                </div>
              </button>
              <!-- action → start an inspection from this template -->
              <div class="mt-4 pt-4 border-t border-outline-variant/15">
                <button type="button"
                  class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-primary bg-primary/8 hover:bg-primary/14 transition-colors"
                  @click.stop="navigateTo(`/assets/inspect?template=${t.uuid}`)">
                  <font-awesome-icon :icon="['fas', 'clipboard-check']" />
                  <span>Make inspection with this template</span>
                </button>
              </div>
            </div>
            <p v-if="!filteredTemplates.length" class="text-sm text-on-surface-variant col-span-full text-center py-8">
              No templates found.</p>
          </div>
        </div>
      </template>

      <!-- ───────────── TOOLS TAB ───────────── -->
      <template v-else-if="activeTab === 'tools'">
        <div class="g-card relative z-10 p-6 sm:p-8">
          <!-- sub-tabs -->
          <div class="flex items-center gap-2 mb-6 flex-wrap">
            <button class="subtab" :class="toolsSub === 'manage' ? 'subtab-active-teal' : ''"
              @click="toolsSub = 'manage'">
              <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" /><span>Tools Management</span>
            </button>
            <button class="subtab" :class="toolsSub === 'register' ? 'subtab-active-purple' : ''"
              @click="toolsSub = 'register'">
              <font-awesome-icon :icon="['fas', 'right-left']" /><span>Tools Register</span>
            </button>
          </div>

          <!-- ── TOOLS MANAGEMENT ── -->
          <div v-show="toolsSub === 'manage'">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="stat-card border-ribbon-blue">
                <p class="stat-k text-ribbon-blue">Total tools</p>
                <p class="stat-v">{{ tools.length }}</p>
              </div>
              <div class="stat-card border-ribbon-teal">
                <p class="stat-k text-ribbon-teal">Available</p>
                <p class="stat-v">{{ toolsAvailable }}</p>
              </div>
              <div class="stat-card border-ribbon-amber">
                <p class="stat-k text-ribbon-amber">On loan</p>
                <p class="stat-v">{{ toolsOnLoan }}</p>
              </div>
              <div class="stat-card border-ribbon-purple">
                <p class="stat-k text-ribbon-purple">Total units</p>
                <p class="stat-v">{{ toolsUnits }}</p>
              </div>
            </div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div class="relative w-full md:w-80">
                <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="toolQuery" type="text" autocomplete="off" placeholder="Search tools…"
                  class="cust-input has-icon" />
              </div>
              <button v-if="canWrite"
                class="bg-primary-gradient text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all w-fit"
                @click="openCreateTool">
                <font-awesome-icon :icon="['fas', 'plus']" /><span>New Tool</span>
              </button>
            </div>

            <div v-if="loadingTools" class="py-10 text-center text-on-surface-variant">Loading tools…</div>
            <div v-else class="overflow-x-auto rounded-t-2xl">
              <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-teal">
                <thead>
                  <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                    <th class="py-4 px-5">Code</th>
                    <th class="py-4 px-5">Name</th>
                    <th class="py-4 px-5">Category</th>
                    <th class="py-4 px-5 text-center">Qty</th>
                    <th class="py-4 px-5 text-center">Condition</th>
                    <th class="py-4 px-5 text-center">Status</th>
                    <th class="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  <tr v-for="t in filteredTools" :key="t.uuid" class="transition-colors">
                    <td class="py-3.5 px-5 font-mono text-[11px] text-ribbon-teal whitespace-nowrap">{{ t.code }}</td>
                    <td class="py-3.5 px-5 font-bold break-words">{{ t.name }}</td>
                    <td class="py-3.5 px-5"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        :class="toolCatClass(t.category)">{{ titleCase(t.category) }}</span></td>
                    <td class="py-3.5 px-5 text-center font-bold">{{ t.quantity }}</td>
                    <td class="py-3.5 px-5 text-center"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        :class="conditionClass(t.condition)">{{ titleCase(t.condition) }}</span></td>
                    <td class="py-3.5 px-5 text-center"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        :class="toolStatusClass(t.status)">{{ titleCase(t.status) }}</span></td>
                    <td class="py-3.5 px-5 text-right" @click.stop>
                      <button class="row-act-btn" title="Actions" @click.stop="openRowMenu($event, t, 'tool')">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!filteredTools.length">
                    <td colspan="7" class="py-8 text-center text-on-surface-variant">No tools found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ── TOOLS REGISTER ── -->
          <div v-show="toolsSub === 'register'">
            <div class="relative w-full md:w-80 mb-4">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
              <input v-model="registerQuery" type="text" autocomplete="off" placeholder="Search register…"
                class="cust-input has-icon" />
            </div>

            <div v-if="loadingRegisters" class="py-10 text-center text-on-surface-variant">Loading register…</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-purple">
                <thead>
                  <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                    <th class="py-4 px-5">Reference</th>
                    <th class="py-4 px-5">Tool</th>
                    <th class="py-4 px-5">Taken by</th>
                    <th class="py-4 px-5">Taken</th>
                    <th class="py-4 px-5">Due</th>
                    <th class="py-4 px-5 text-center">Status</th>
                    <th class="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  <tr v-for="r in filteredRegisters" :key="r.uuid" class="transition-colors">
                    <td class="py-3.5 px-5 font-mono text-[11px] text-ribbon-purple whitespace-nowrap">{{ r.reference_no
                      }}</td>
                    <td class="py-3.5 px-5 font-bold break-words">{{ r.tool }}</td>
                    <td class="py-3.5 px-5 break-words">{{ r.taken_by_name }}</td>
                    <td class="py-3.5 px-5 whitespace-nowrap text-xs">{{ r.date_taken }}</td>
                    <td class="py-3.5 px-5 whitespace-nowrap text-xs">{{ r.expected_return_date }}</td>
                    <td class="py-3.5 px-5 text-center"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        :class="registerStatusClass(r.status)">{{ titleCase(r.status) }}</span></td>
                    <td class="py-3.5 px-5 text-right" @click.stop>
                      <div class="flex items-center justify-end gap-2">
                        <span v-if="r.date_returned" class="text-[11px] text-outline">{{ r.date_returned }}</span>
                        <button class="row-act-btn" title="Actions" @click.stop="openRowMenu($event, r, 'register')">
                          <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!filteredRegisters.length">
                    <td colspan="7" class="py-8 text-center text-on-surface-variant">No register entries.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── New tool modal ──────────────────────────────────────────────────── -->
    <Modal v-model="showCreateTool" title="New tool" subtitle="Register a Biomedical Engineering tool"
      :show-logo="false" class="max-w-xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2"><label class="input-label">Name *</label><input v-model="toolForm.name"
            class="input-field" placeholder="e.g. Torque wrench" /></div>
        <div class="sm:col-span-2"><label class="input-label">Description</label><textarea
            v-model="toolForm.description" rows="2" class="input-field" /></div>
        <div>
          <label class="input-label">Category *</label>
          <div class="filter-wrap"><select v-model="toolForm.category" class="filter-select">
              <option v-for="c in TOOL_CATEGORIES" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <!-- <div><label class="input-label">Quantity *</label><input v-model.number="toolForm.quantity" type="number"
            min="1" class="input-field" /></div> -->
        <div>
          <label class="input-label">Condition *</label>
          <div class="filter-wrap"><select v-model="toolForm.condition" class="filter-select">
              <option v-for="c in TOOL_CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div>
          <label class="input-label">Custodian (BME)</label>
          <SearchSelect v-model="toolForm.custodian_uuid" :options="bmeUsers" option-value="uuid"
            option-label="full_name" :option-subtitle="(u) => u.role?.name" icon="user" placeholder="Select custodian…"
            search-placeholder="Search BME staff…" clearable />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCreateTool = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitCreateTool"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Saving…' : 'Create tool' }}</span></button>
      </template>
    </Modal>

    <!-- ── Checkout tool modal ─────────────────────────────────────────────── -->
    <Modal v-model="showCheckout" :title="`Checkout · ${checkoutTool_?.name || ''}`"
      subtitle="Issue this tool to a BME staff member" :show-logo="false" class="max-w-xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label class="input-label">Taken by (BME) *</label>
          <SearchSelect v-model="checkoutForm.taken_by_uuid" :options="bmeUsers" option-value="uuid"
            option-label="full_name" :option-subtitle="(u) => u.role?.name" icon="user" placeholder="Select staff…"
            search-placeholder="Search BME staff…" />
        </div>
        <div><label class="input-label">Date taken *</label><input v-model="checkoutForm.date_taken" type="date"
            class="input-field" /></div>
        <div><label class="input-label">Expected return *</label><input v-model="checkoutForm.expected_return_date"
            type="date" class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Purpose</label><textarea v-model="checkoutForm.purpose"
            rows="2" class="input-field" placeholder="Reason for checkout…" /></div>
        <div class="sm:col-span-2">
          <label class="input-label">Linked maintenance asset (optional)</label>
          <SearchSelect v-model="checkoutForm.asset_maintenance_uuid" :options="maintenanceAssets" option-value="uuid"
            option-label="name" :option-subtitle="(a) => `${a.asset_tag} · under maintenance`" icon="screwdriver-wrench"
            placeholder="Select asset under maintenance…" search-placeholder="Search assets…" clearable />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCheckout = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitCheckout"><font-awesome-icon
            :icon="['fas', 'right-from-bracket']" /><span>{{ busy ? 'Saving…' : 'Checkout' }}</span></button>
      </template>
    </Modal>

    <!-- ── Check-in tool modal ─────────────────────────────────────────────── -->
    <Modal v-model="showCheckin" :title="`Check in · ${checkinReg_?.tool || ''}`" subtitle="Return a checked-out tool"
      :show-logo="false" class="max-w-lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="input-label">Returned on *</label><input v-model="checkinForm.returned_on" type="date"
            class="input-field" /></div>
        <div>
          <label class="input-label">Condition *</label>
          <div class="filter-wrap"><select v-model="checkinForm.condition" class="filter-select">
              <option v-for="c in TOOL_CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div class="sm:col-span-2"><label class="input-label">Comment</label><textarea v-model="checkinForm.comment"
            rows="2" class="input-field" placeholder="Condition notes…" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCheckin = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitCheckin"><font-awesome-icon
            :icon="['fas', 'right-to-bracket']" /><span>{{ busy ? 'Saving…' : 'Check in' }}</span></button>
      </template>
    </Modal>

    <!-- ── Department dashboard modal (privileged) ─────────────────────────── -->
    <Modal v-model="deptModal" :title="deptModalName || 'Department dashboard'"
      subtitle="Real-time asset holdings & anomalies" :show-logo="false" class="max-w-[80%]">
      <DeptOverviewBody />
    </Modal>

    <!-- ── Teleported header "Advanced options" menu ────────────────────────── -->
    <Teleport to="body">
      <div v-if="headerMenu" class="row-menu"
        :style="{ top: headerMenuPos.top + 'px', left: headerMenuPos.left + 'px' }" @click.stop>
        <button class="row-menu-item" @click="openCreate(); closeHeaderMenu()">
          <font-awesome-icon :icon="['fas', 'plus']" class="text-ribbon-blue" /> New Asset
        </button>
        <button class="row-menu-item" :disabled="exportingTemplate" @click="exportTemplate(); closeHeaderMenu()">
          <font-awesome-icon :icon="['fas', exportingTemplate ? 'circle-notch' : 'file-arrow-down']"
            :class="{ 'fa-spin': exportingTemplate }" class="text-ribbon-teal" />
          {{ exportingTemplate ? 'Preparing…' : 'Export Template' }}
        </button>
        <button class="row-menu-item" @click="openImport(); closeHeaderMenu()">
          <font-awesome-icon :icon="['fas', 'file-arrow-up']" class="text-ribbon-purple" /> Import Template
        </button>
      </div>
    </Teleport>

    <!-- ── Bulk-import modal: drag & drop → process → per-row report ─────────── -->
    <Modal v-model="importModal" title="Import assets" subtitle="Upload a filled import template (.xls / .xlsx)"
      :show-logo="false" class="max-w-2xl">
      <div class="flex flex-col gap-4">

        <!-- pick / drop zone (pre-upload) -->
        <template v-if="!importResult">
          <div class="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
            :class="importDragOver ? 'border-primary bg-primary/5' : 'border-outline-variant/60 hover:border-primary/50 hover:bg-primary/[0.03]'"
            @click="importFileInput?.click()" @dragover.prevent="importDragOver = true"
            @dragleave.prevent="importDragOver = false" @drop.prevent="onImportDrop">
            <input ref="importFileInput" type="file" class="hidden"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              @change="onImportPick" />
            <div
              class="w-12 h-12 mx-auto rounded-2xl bg-ribbon-blue/12 text-ribbon-blue flex items-center justify-center mb-3">
              <font-awesome-icon :icon="['fas', 'file-arrow-up']" class="text-lg" />
            </div>
            <p class="text-sm sm:text-base font-semibold text-on-surface">
              {{ importFile ? importFile.name : 'Drag & drop your workbook here' }}
            </p>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-1">
              {{ importFile ? fmtBytes(importFile.size) + ' · click to choose a different file'
                : 'or click to browse — .xls or .xlsx only' }}
            </p>
          </div>
          <p v-if="importError" class="alert-error !p-2.5 text-xs sm:text-sm">{{ importError }}</p>
        </template>

        <!-- result report (post-upload) -->
        <template v-else>
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-ribbon-blue/8 border border-ribbon-blue/15 px-3 py-2.5 text-center">
              <p class="text-lg sm:text-xl font-bold text-ribbon-blue tabular-nums">{{
                importResult.report?.summary?.total ?? 0 }}</p>
              <p class="text-xs sm:text-sm font-bold text-on-surface-variant">Rows</p>
            </div>
            <div class="rounded-xl bg-ribbon-teal/8 border border-ribbon-teal/15 px-3 py-2.5 text-center">
              <p class="text-lg sm:text-xl font-bold text-ribbon-teal tabular-nums">{{
                importResult.report?.summary?.success ?? 0 }}</p>
              <p class="text-xs sm:text-sm font-bold text-on-surface-variant">Imported</p>
            </div>
            <div class="rounded-xl px-3 py-2.5 text-center border"
              :class="(importResult.report?.summary?.failed ?? 0) > 0 ? 'bg-error/8 border-error/20' : 'bg-surface-low border-outline-variant/30'">
              <p class="text-lg sm:text-xl font-bold tabular-nums"
                :class="(importResult.report?.summary?.failed ?? 0) > 0 ? 'text-error' : 'text-on-surface-variant'">{{
                  importResult.report?.summary?.failed ?? 0 }}</p>
              <p class="text-xs sm:text-sm font-bold text-on-surface-variant">Failed</p>
            </div>
          </div>

          <!-- per-row outcomes -->
          <div
            class="max-h-64 overflow-y-auto rounded-xl border border-outline-variant/30 divide-y divide-outline-variant/20">
            <div v-for="r in importResult.report?.rows ?? []" :key="r.row"
              class="flex items-start gap-2.5 px-3 py-2.5 text-xs sm:text-sm min-w-0">
              <font-awesome-icon :icon="['fas', r.status === 'success' ? 'circle-check' : 'circle-exclamation']"
                class="mt-0.5 shrink-0" :class="r.status === 'success' ? 'text-ribbon-teal' : 'text-error'" />
              <span class="font-mono text-on-surface-variant shrink-0">Row {{ r.row }}</span>
              <span class="font-semibold text-on-surface truncate">{{ r.identifier || '—' }}</span>
              <span v-if="r.errors?.length" class="text-error break-words min-w-0 ml-auto text-right">{{
                r.errors.join('; ') }}</span>
            </div>
          </div>

          <!-- report files -->
          <div class="flex flex-wrap gap-2">
            <a v-if="importResult.files?.report_pdf_url" :href="importResult.files.report_pdf_url" target="_blank"
              rel="noopener" class="btn-secondary text-sm sm:text-base">
              <font-awesome-icon :icon="['fas', 'file-arrow-down']" /> Report PDF
            </a>
            <a v-if="importResult.files?.failed_records_xlsx_url" :href="importResult.files.failed_records_xlsx_url"
              target="_blank" rel="noopener" class="btn-secondary text-sm sm:text-base !text-error !border-error/30">
              <font-awesome-icon :icon="['fas', 'file-arrow-down']" /> Failed rows (.xlsx)
            </a>
          </div>
        </template>
      </div>

      <template #footer>
        <button class="btn-secondary" @click="closeImport">{{ importResult ? 'Close' : 'Cancel' }}</button>
        <button v-if="importResult" class="btn-secondary" @click="resetImport">
          <font-awesome-icon :icon="['fas', 'file-arrow-up']" /> Import another
        </button>
        <button v-else class="btn-primary" :disabled="!importFile || importing" @click="runImport">
          <font-awesome-icon :icon="['fas', importing ? 'circle-notch' : 'check']" :class="{ 'fa-spin': importing }" />
          {{ importing ? 'Processing…' : 'Process import' }}
        </button>
      </template>
    </Modal>

    <!-- ── Teleported row actions menu ─────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="rowMenu" class="row-menu" :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }" @click.stop>
        <template v-if="rowMenuKind === 'asset'">
          <NuxtLink :to="`/assets/${rowMenuItem?.uuid}`" class="row-menu-item">
            <font-awesome-icon :icon="['fas', 'eye']" class="text-ribbon-blue" /> View Asset
          </NuxtLink>
          <button class="row-menu-item" @click="printAssetCode(rowMenuTag, 'qr'); closeRowMenu()">
            <font-awesome-icon :icon="['fas', 'qrcode']" class="text-ribbon-blue" /> Print QR code
          </button>
          <button class="row-menu-item" @click="printAssetCode(rowMenuTag, 'barcode'); closeRowMenu()">
            <font-awesome-icon :icon="['fas', 'barcode']" class="text-ribbon-purple" /> Print Barcode
          </button>
        </template>
        <template v-else-if="rowMenuKind === 'tool'">
          <button v-if="rowMenuItem?.status === 'AVAILABLE'" class="row-menu-item"
            @click="openCheckout(rowMenuItem); closeRowMenu()">
            <font-awesome-icon :icon="['fas', 'right-from-bracket']" class="text-ribbon-amber" /> Checkout
          </button>
          <p v-else class="row-menu-empty">No actions available</p>
        </template>
        <template v-else>
          <button v-if="rowMenuItem?.status === 'TAKEN'" class="row-menu-item"
            @click="openCheckin(rowMenuItem); closeRowMenu()">
            <font-awesome-icon :icon="['fas', 'right-to-bracket']" class="text-ribbon-teal" /> Check in
          </button>
          <p v-else class="row-menu-empty">No actions available</p>
        </template>
      </div>
    </Teleport>

    <!-- Issues-tab row menu (Schedule Maintenance) -->
    <Teleport to="body">
      <div v-if="issueMenu" class="row-menu" :style="{ top: issueMenuPos.top + 'px', left: issueMenuPos.left + 'px' }"
        @click.stop>
        <NuxtLink :to="`/assets/${issueMenuRow.asset_uuid}`" class="row-menu-item">
          <font-awesome-icon :icon="['fas', 'eye']" class="text-ribbon-blue" /> View Asset
        </NuxtLink>
        <button v-if="!issueMenuRow.has_maintenance" class="row-menu-item"
          @click="openScheduleForIssue(issueMenuRow); closeIssueMenu()">
          <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" class="text-ribbon-blue" /> Schedule Maintenance
        </button>
        <NuxtLink v-else :to="`/assets/maintenance?uuid=${issueMenuRow.maintenance_uuid}`" class="row-menu-item">
          <font-awesome-icon :icon="['fas', 'screwdriver-wrench']" class="text-ribbon-blue" /> View Maintenance
        </NuxtLink>
      </div>
    </Teleport>

    <!-- Damages / Disposals row menu (Approve write-off) -->
    <Teleport to="body">
      <div v-if="approveMenu" class="row-menu"
        :style="{ top: approveMenuPos.top + 'px', left: approveMenuPos.left + 'px' }" @click.stop>
        <NuxtLink :to="`/assets/${approveMenuRow?.asset_uuid}`" class="row-menu-item">
          <font-awesome-icon :icon="['fas', 'eye']" class="text-ribbon-blue" /> View Asset
        </NuxtLink>
        <button v-if="!approveMenuRow?.is_approved" class="row-menu-item" :disabled="busy"
          @click="approveWriteoff(approveMenuRow?.uuid, approveMenuKind); closeApproveMenu()">
          <font-awesome-icon :icon="['fas', 'circle-check']" class="text-ribbon-teal" /> Approve write-off
        </button>
      </div>
    </Teleport>

    <!-- ── Create-asset modal ──────────────────────────────────────────────── -->
    <Modal v-model="showCreate" title="New asset" subtitle="Register a new asset" :show-logo="false" class="max-w-3xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="sm:col-span-2">
          <label class="input-label">Asset type *</label>
          <SearchSelect v-model="form.asset_type_id" :options="types" option-value="id"
            :option-label="(t) => `${t.name} (${t.code})`" icon="tag" placeholder="Select type…"
            search-placeholder="Search types…" />
        </div>
        <div><label class="input-label">Asset tag</label><input v-model="form.asset_tag" class="input-field"
            placeholder="auto if blank" /></div>
        <div><label class="input-label">Name *</label><input v-model="form.name" class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Description</label><input v-model="form.description"
            class="input-field" /></div>
        <div><label class="input-label">Make</label><input v-model="form.make" class="input-field" /></div>
        <div><label class="input-label">Model</label><input v-model="form.model" class="input-field" /></div>
        <div><label class="input-label">Serial number</label><input v-model="form.serial_number" class="input-field" />
        </div>
        <div><label class="input-label">Supplier</label><input v-model="form.supplier" class="input-field" /></div>
        <!-- <div><label class="input-label">Quantity</label><input v-model.number="form.quantity" type="number" min="1"
            class="input-field" /></div> -->

        <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3"><span
            class="text-xs sm:text-sm font-semibold text-on-surface-variant">Location</span></div>
        <div><label class="input-label">Main location</label><input v-model="form.main_location" class="input-field" />
        </div>>
        <div><label class="input-label">Sub location</label><input v-model="form.sub_location" class="input-field" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Room description</label><input
            v-model="form.room_description" class="input-field" /></div>

        <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3"><span
            class="text-xs sm:text-sm font-semibold text-on-surface-variant">Status &amp; condition</span></div>
        <div>
          <label class="input-label">Condition</label>
          <div class="filter-wrap"><select v-model="form.condition" class="filter-select">
              <option v-for="c in CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div>
          <label class="input-label">Operational status</label>
          <div class="filter-wrap"><select v-model="form.operational_status" class="filter-select">
              <option v-for="s in OP_STATUSES" :key="s" :value="s">{{ titleCase(s) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Acquisition date</label><input v-model="form.acquisition_date" type="date"
            class="input-field" /></div>
        <div><label class="input-label">Commissioned on</label><input v-model="form.commissioned_on" type="date"
            class="input-field" /></div>

        <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3"><span
            class="text-xs sm:text-sm font-semibold text-on-surface-variant">Financials</span></div>
        <div>
          <label class="input-label">Currency</label>
          <SearchSelect v-model="form.currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Select currency…"
            search-placeholder="Search currency or country…" />
        </div>
        <div><label class="input-label">Purchase cost</label><input v-model.number="form.purchase_cost" type="number"
            min="0" class="input-field" /></div>
        <div><label class="input-label">Life span (years)</label><input v-model.number="form.life_span_years"
            type="number" min="0" class="input-field" /></div>
        <div><label class="input-label">Depreciation rate (%)</label><input v-model.number="form.depreciation_rate"
            type="number" min="0" step="0.1" class="input-field" /></div>
        <div>
          <label class="input-label">Depreciation method</label>
          <div class="filter-wrap"><select v-model="form.depreciation_method" class="filter-select">
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="REDUCING_BALANCE">Reducing Balance</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Salvage value</label><input v-model.number="form.salvage_value" type="number"
            min="0" class="input-field" /></div>

        <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3"><span
            class="text-xs sm:text-sm font-semibold text-on-surface-variant">Warranty</span></div>
        <div><label class="input-label">Warranty provider</label><input v-model="form.warranty_provider"
            class="input-field" /></div>
        <div><label class="input-label">Warranty expiry</label><input v-model="form.warranty_expiry" type="date"
            class="input-field" /></div>

        <div class="sm:col-span-2">
          <label class="input-label">Pictures</label>
          <input type="file" multiple accept="image/*"
            class="block w-full text-xs sm:text-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-bold file:cursor-pointer"
            @change="onPics($event)" />
          <p v-if="picCount" class="text-[11px] text-on-surface-variant mt-1">{{ picCount }} file(s) selected</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCreate = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="submitCreate"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ saving ? 'Saving…' : 'Create asset' }}</span></button>
      </template>
    </Modal>

    <!-- Schedule maintenance (invoked from the All Assets Issues tab) -->
    <Modal v-model="scheduleModal" title="Schedule maintenance" :show-logo="false" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="input-label">Type</label>
          <div class="filter-wrap"><select v-model="scheduleForm.maintenance_type" class="filter-select">
              <option value="CORRECTIVE">Corrective</option>
              <option value="PREVENTIVE">Preventive</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Frequency</label>
          <div class="filter-wrap"><select v-model="scheduleForm.frequency" class="filter-select">
              <option value="AD_HOC">Ad hoc</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="BIANNUAL">Biannual</option>
              <option value="ANNUAL">Annual</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div v-if="['QUARTERLY', 'BIANNUAL', 'ANNUAL'].includes(scheduleForm.frequency)">
          <label class="input-label">Quarter</label>
          <div class="filter-wrap"><select v-model="scheduleForm.quarter" class="filter-select">
              <option value="">—</option>
              <option v-for="q in ['Q1', 'Q2', 'Q3', 'Q4']" :key="q" :value="q">{{ q }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Scheduled date *</label>
          <input v-model="scheduleForm.scheduled_date" type="date" class="input-field" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Assigned to</label>
          <SearchSelect v-model="scheduleForm.assigned_to_id" :options="users" option-value="id"
            option-label="full_name" icon="user" placeholder="Unassigned" search-placeholder="Search users…"
            clearable />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Fault reported</label>
          <textarea v-model="scheduleForm.fault_reported" rows="2" class="input-field" />
        </div>
        <div class="sm:col-span-2 flex items-center gap-2">
          <input v-model="scheduleForm.by_external_contractor" type="checkbox" id="sched-ext" />
          <label for="sched-ext" class="text-sm">By external contractor</label>
        </div>
        <template v-if="scheduleForm.by_external_contractor">
          <div><label class="input-label">Contractor name</label>
            <input v-model="scheduleForm.external_contractor.full_name" class="input-field" />
          </div>
          <div><label class="input-label">Entity</label>
            <input v-model="scheduleForm.external_contractor.entity_name" class="input-field" />
          </div>
          <div><label class="input-label">Phone</label>
            <input v-model="scheduleForm.external_contractor.phone" class="input-field" />
          </div>
          <div><label class="input-label">Email</label>
            <input v-model="scheduleForm.external_contractor.email" class="input-field" />
          </div>
        </template>
      </div>
      <template #footer><button class="btn-secondary" @click="scheduleModal = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitSchedule">Schedule</button></template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onActivated, onBeforeUnmount, nextTick, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
// explicit import so these resolve regardless of Nuxt auto-import state
import { useAssets, fmtAssetMoney, titleCase } from '~/composables/useAssets'

// NOTE: add route middleware (definePageMeta({ middleware: 'auth' })) once the auth
// middleware name is confirmed. apiService already redirects to /login on 401.
const route = useRoute()
const assetsApi = useAssets()
const auth = useAuthStore()
const can = (p: string) => auth.can(p)

// privileged roles get the full dashboard + other departments' dashboards (modal)
const PRIVILEGED_ROLES = ['system_administrator', 'bme_lead']
const isPrivileged = computed(() => PRIVILEGED_ROLES.includes(auth.currentRole))
// NOTE: confirm the exact write-permission slug; falls back to privileged roles.
const canWrite = computed(() => can('asset_management') || isPrivileged.value)

// enum option sets (per the create/update payload spec)
const CONDITIONS = ['VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'FAULTY']
const OP_STATUSES = ['IN_USE', 'NOT_COMMISSIONED', 'JUST_INSTALLED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DISPOSED']

// ── tabs ────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'assets' | 'issues' | 'maintenances' | 'inspections' | 'damages' | 'disposals' | 'templates' | 'tools'
const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'gauge-high' },
  { key: 'assets', label: 'Assets', icon: 'server' },
  { key: 'issues', label: 'All Assets Issues', icon: 'triangle-exclamation' },
  { key: 'maintenances', label: 'All Assets Maintenances', icon: 'screwdriver-wrench' },
  { key: 'inspections', label: 'All Assets Inspections', icon: 'clipboard-check' },
  { key: 'damages', label: 'All Assets Damages', icon: 'house-crack' },
  { key: 'disposals', label: 'All Assets Disposals', icon: 'trash-can' },
  { key: 'templates', label: 'Inspection Templates', icon: 'clipboard-list' },
  { key: 'tools', label: 'Tools', icon: 'screwdriver-wrench' },
]
const activeTab = ref<TabKey>('overview')

// ── tab bar: lock the bar's width to exactly what the 5 primary tabs need,
//    measured live — no more guessing a rem value that clips a tab ──
const PRIMARY_TAB_COUNT = 5
const primaryTabs = computed(() => tabs.slice(0, PRIMARY_TAB_COUNT))
const secondaryTabs = computed(() => tabs.slice(PRIMARY_TAB_COUNT))

const tabsExpanded = ref(false)
const tabScroller = ref<HTMLElement | null>(null)
const tabBarEl = ref<HTMLElement | null>(null)
const lockedWidth = ref<number | null>(null)

const remeasureTabBar = () => {
  if (tabsExpanded.value) return   // don't resize the bar once expanded — that's what "shows the hidden tabs" without growing it
  nextTick(() => { if (tabBarEl.value) lockedWidth.value = tabBarEl.value.offsetWidth })
}
const toggleMoreTabs = async () => {
  tabsExpanded.value = !tabsExpanded.value
  await nextTick()
  tabScroller.value?.scrollTo({ left: tabsExpanded.value ? tabScroller.value.scrollWidth : 0, behavior: 'smooth' })
}

onMounted(() => {
  remeasureTabBar()
  window.addEventListener('resize', remeasureTabBar)
})
onBeforeUnmount(() => window.removeEventListener('resize', remeasureTabBar))

// ── feedback ────────────────────────────────────────────────────────────────
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── data ────────────────────────────────────────────────────────────────────
const dashboard = ref<any>(null)
const loadingDash = ref(false)
const { showSkeleton: dashSkeleton } = useDelayedLoading(loadingDash)
const types = ref<any[]>([])
const countries = ref<any[]>([])
const assets = ref<any[]>([])
const loadingAssets = ref(false)

// ── derived dashboard view-model ──────────────────────────────────────────────
const summary = computed(() => dashboard.value?.summary ?? {})
const byClass = computed(() => dashboard.value?.by_class ?? [])
const byStatus = computed(() => dashboard.value?.by_operational_status ?? [])
const byCondition = computed(() => dashboard.value?.by_condition ?? [])
const registerValue = computed(() => dashboard.value?.register_value ?? {})
const approvals = computed(() => dashboard.value?.pending_approvals ?? {})
const openIssues = computed(() => dashboard.value?.open_issues ?? {})
const commissioningBacklog = computed(() => dashboard.value?.commissioning_backlog ?? [])
const maintenanceRows = computed(() => {
  const m = dashboard.value?.maintenance ?? {}
  return [
    { label: 'Planned', value: m.planned ?? 0, alert: false },
    { label: 'In progress', value: m.in_progress ?? 0, alert: false },
    { label: 'Overdue', value: m.overdue ?? 0, alert: true },
    { label: 'Due in 30 days', value: m.due_30d ?? 0, alert: false },
    { label: 'Completed (30d)', value: m.completed_30d ?? 0, alert: false },
  ]
})
const toolRows = computed(() => {
  const t = dashboard.value?.tools ?? {}
  return [
    { label: 'Total', value: t.total ?? 0 },
    { label: 'Available', value: t.available ?? 0 },
    { label: 'On loan', value: t.on_loan ?? 0 },
    { label: 'In maintenance', value: t.in_maintenance ?? 0 },
  ]
})

const fmtDateTime = (s: any) => { if (!s) return '—'; const d = new Date(s); return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString() }
const pad = (n: any) => String(n ?? 0).padStart(2, '0')
const pct = (n: any, total: any) => { const t = Number(total); return t > 0 ? Math.round((Number(n) / t) * 100) : 0 }

// ── by-class ApexCharts horizontal bar ────────────────────────────────────────
const classChartHeight = computed(() => Math.max(100, byClass.value.length * 34))
const classChartSeries = computed(() => [{ name: 'Assets', data: byClass.value.map((c: any) => ({ x: titleCase(c.asset_class), y: Number(c.count) || 0 })) }])
const classChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%', distributed: true } },
  colors: ['#3d7fbf', '#3dae8c', '#e8a33d', '#b05fa8', '#c0395a'],
  dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700, colors: ['#ffffff'] } },
  grid: { borderColor: 'rgba(0,0,0,0.06)', yaxis: { lines: { show: false } } },
  xaxis: { labels: { style: { colors: '#727687', fontSize: '11px' } } },
  yaxis: { labels: { style: { colors: '#424656', fontSize: '12px', fontWeight: 600 } } },
  tooltip: { y: { formatter: (v: number) => `${v} assets` } },
  legend: { show: false },
}))

const severityClass = (s: string) => s === 'CRITICAL' || s === 'HIGH' ? 'bg-error/10 text-error'
  : s === 'MEDIUM' ? 'bg-ribbon-amber/15 text-ribbon-amber' : 'bg-surface-container text-on-surface-variant'

// ── generic paginated/filterable history-tab state (Issues/Maintenances/Inspections/Damages/Disposals) ──
function useHistoryTab(loadFn: (params: Record<string, any>) => Promise<any>) {
  const buildParams = () => {
    const p: Record<string, any> = { page: state.filters.page }
    if (state.filters.from) p.from = state.filters.from
    if (state.filters.to) p.to = state.filters.to
    if (state.filters.asset_id) p.asset_id = state.filters.asset_id
    if (state.filters.department_id) p.department_id = state.filters.department_id
    if (state.filters.status) p.status = state.filters.status
    if (state.filters.severity) p.severity = state.filters.severity
    if (state.filters.open) p.open = state.filters.open
    return p
  }

  const state = reactive({
    data: [] as any[],
    meta: { page: 1, per_page: 100, total: 0, total_pages: 1 } as { page: number; per_page: number; total: number; total_pages: number },
    loading: false,
    filtersOpen: false,
    filters: {
      from: '', to: '', asset_id: '', asset_name: '', department_id: '', department_name: '',
      status: '', severity: '', open: '', page: 1,
    } as Record<string, any>,
    anyFilter: () => !!(state.filters.from || state.filters.to || state.filters.asset_id ||
      state.filters.department_id || state.filters.status || state.filters.severity || state.filters.open),
    load: async () => {
      state.loading = true
      try { const r = await loadFn(buildParams()); state.data = r?.data ?? []; state.meta = r?.meta ?? state.meta }
      catch { state.data = [] }
      finally { state.loading = false }
    },
    clear: () => {
      Object.assign(state.filters, {
        from: '', to: '', asset_id: '', asset_name: '', department_id: '', department_name: '',
        status: '', severity: '', open: '', page: 1,
      })
      state.load()
    },
    goPage: (p: number) => {
      if (p < 1 || p > (state.meta.total_pages || 1)) return
      state.filters.page = p
      state.load()
    },
  })

  return state
}

const issuesTab = useHistoryTab((p) => assetsApi.getAllIssues(p))
const maintenancesTab = useHistoryTab((p) => assetsApi.getAllMaintenances(p))
const inspectionsTab = useHistoryTab((p) => assetsApi.getAllInspections(p))
const damagesTab = useHistoryTab((p) => assetsApi.getDamaged(p))
const disposalsTab = useHistoryTab((p) => assetsApi.getDisposed(p))
const issueMenu = ref<string | null>(null)
const issueMenuRow = ref<any>(null)
const issueMenuPos = reactive({ top: 0, left: 0 })
const openIssueMenu = (e: MouseEvent, iss: any) => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  issueMenuPos.top = r.bottom + 6; issueMenuPos.left = Math.max(8, r.right - 200)
  issueMenuRow.value = iss; issueMenu.value = iss.reference_no
}
const closeIssueMenu = () => { issueMenu.value = null }

// ── write-off approve menu (damages / disposals tabs) ──────────────────────
const approveMenu = ref<string | null>(null)
const approveMenuRow = ref<any>(null)
const approveMenuKind = ref<'damage' | 'disposal'>('damage')
const approveMenuPos = reactive({ top: 0, left: 0 })
const openApproveMenu = (e: MouseEvent, row: any, kind: 'damage' | 'disposal') => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  approveMenuPos.top = r.bottom + 6; approveMenuPos.left = Math.max(8, r.right - 200)
  approveMenuRow.value = row; approveMenuKind.value = kind
  approveMenu.value = row.uuid

}
const closeApproveMenu = () => { approveMenu.value = null }
// mirrors the [uuid] page: PATCH /asset/writeoff/approve { record_uuid, kind }.
// Each damage/disposal row has its own uuid — that record uuid is sent as record_uuid.
const approveWriteoff = async (recordUuid: string, kind: 'damage' | 'disposal') => {
  if (!recordUuid) { flash('Missing record reference', 'error'); return }
  busy.value = true
  try {
    await assetsApi.approveWriteoff(recordUuid, kind)
    flash('Write-off approved')
    if (kind === 'damage') damagesTab.load(); else disposalsTab.load()
  } catch (e: any) { flash(e.message || 'Approval failed', 'error') }
  finally { busy.value = false }
}

// ── schedule maintenance (invoked from the All Assets Issues tab, cross-asset) ───────────────
const scheduleModal = ref(false)
const scheduleForm = reactive<Record<string, any>>({
  uuid: '', department_asset_issue_uuid: '', maintenance_type: 'CORRECTIVE', frequency: 'AD_HOC', quarter: '',
  scheduled_date: '', assigned_to_id: '', fault_reported: '', by_external_contractor: false,
  external_contractor: { full_name: '', entity_name: '', phone: '', email: '' },
})
const openScheduleForIssue = (iss: any) => {
  Object.assign(scheduleForm, {
    uuid: iss.asset_uuid, department_asset_issue_uuid: iss.uuid, maintenance_type: 'CORRECTIVE', frequency: 'AD_HOC',
    quarter: '', scheduled_date: '', assigned_to_id: '', fault_reported: iss.fault_description ?? '',
    by_external_contractor: false, external_contractor: { full_name: '', entity_name: '', phone: '', email: '' },
  })
  if (!users.value.length) loadUsers()
  scheduleModal.value = true
}
const submitSchedule = async () => {
  if (!scheduleForm.scheduled_date) { flash('Scheduled date is required', 'error'); return }
  busy.value = true
  try {
    const payload: Record<string, any> = {
      uuid: scheduleForm.uuid, maintenance_type: scheduleForm.maintenance_type, frequency: scheduleForm.frequency,
      scheduled_date: scheduleForm.scheduled_date,
      assigned_to_id: scheduleForm.assigned_to_id || undefined,
      department_asset_issue_uuid: scheduleForm.department_asset_issue_uuid || undefined,
      fault_reported: scheduleForm.fault_reported || undefined,
      quarter: scheduleForm.quarter || undefined,
      by_external_contractor: scheduleForm.by_external_contractor,
    }
    if (scheduleForm.by_external_contractor) payload.external_contractor = scheduleForm.external_contractor
    await assetsApi.scheduleMaintenance(payload)
    flash('Maintenance scheduled'); scheduleModal.value = false; issuesTab.load()
  } catch (e: any) { flash(e.message || 'Failed to schedule maintenance', 'error') } finally { busy.value = false }
}

// ── asset filters (client-side, like the inventory fix) ───────────────────────
const assetFilters = reactive({
  q: '', type: '', asset_class: '', condition: '', operational_status: '',
  pending_damages: '', pending_disposals: '',
})
const classOptions = computed(() => {
  const set = new Set<string>()
  types.value.forEach((t: any) => t.asset_class && set.add(t.asset_class))
  byClass.value.forEach((c: any) => c.asset_class && set.add(c.asset_class))
  return [...set].sort()
})
const anyAssetFilter = computed(() => Object.values(assetFilters).some((v) => v !== ''))
const clearAssetFilters = () => Object.assign(assetFilters, { q: '', type: '', asset_class: '', condition: '', operational_status: '', pending_damages: '', pending_disposals: '' })

// Advanced-options panel: open to reveal filters; auto-collapse once an advanced filter is applied.
const showFilters = ref(false)
const ADVANCED_KEYS = ['type', 'asset_class', 'condition', 'operational_status', 'pending_damages', 'pending_disposals'] as const
const anyAdvancedFilter = computed(() => ADVANCED_KEYS.some((k) => (assetFilters as any)[k] !== ''))
const activeFilterCount = computed(() => Object.values(assetFilters).filter((v) => v !== '').length)
watch(anyAdvancedFilter, (on) => { if (on) showFilters.value = false })   // collapse when filters are entered

// ── row actions menu (assets: print QR / barcode · tools: checkout · register: check-in) ──
const rowMenu = ref('')
const rowMenuTag = ref('')
const rowMenuKind = ref<'asset' | 'tool' | 'register'>('asset')
const rowMenuItem = ref<any>(null)
const menuPos = reactive({ top: 0, left: 0 })
// ── header "Advanced options" dropdown (teleported, positioned off the trigger button) ──
const headerMenu = ref(false)
const headerMenuBtn = ref<HTMLButtonElement | null>(null)
const headerMenuPos = reactive({ top: 0, left: 0 })
const toggleHeaderMenu = () => {
  if (headerMenu.value) { headerMenu.value = false; return }
  const r = headerMenuBtn.value?.getBoundingClientRect()
  if (r) { headerMenuPos.top = r.bottom + 6; headerMenuPos.left = r.left }
  headerMenu.value = true
}
const closeHeaderMenu = () => { headerMenu.value = false }

// ── export bulk-import template ──────────────────────────────────────────
const exportingTemplate = ref(false)
const exportTemplate = async () => {
  exportingTemplate.value = true
  try {
    const res = await assetsApi.downloadImportTemplate()
    const a = document.createElement('a')
    a.href = res.url
    a.download = res.filename || 'asset_import_template.xlsx'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    flash('Template download started')
  } catch (e: any) {
    flash(e?.message || 'Failed to download template', 'error')
  } finally {
    exportingTemplate.value = false
  }
}

// ── bulk-import: drag & drop workbook → /assets/bulk_import/template/process ──
const importModal = ref(false)
const importFile = ref<File | null>(null)
const importFileInput = ref<HTMLInputElement | null>(null)
const importDragOver = ref(false)
const importing = ref(false)
const importError = ref('')
const importResult = ref<any>(null)

const fmtBytes = (n: number) =>
  n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`

const isWorkbook = (f: File) => /\.(xls|xlsx)$/i.test(f.name)

const setImportFile = (f: File | null) => {
  importError.value = ''
  if (f && !isWorkbook(f)) { importError.value = 'Only .xls or .xlsx files are accepted.'; return }
  importFile.value = f
}
const onImportPick = (e: Event) => {
  setImportFile((e.target as HTMLInputElement).files?.[0] ?? null)
    ; (e.target as HTMLInputElement).value = ''   // allow re-picking the same file
}
const onImportDrop = (e: DragEvent) => {
  importDragOver.value = false
  setImportFile(e.dataTransfer?.files?.[0] ?? null)
}

const openImport = () => { resetImport(); importModal.value = true }
const resetImport = () => {
  importFile.value = null; importResult.value = null; importError.value = ''; importDragOver.value = false
}
const closeImport = () => {
  importModal.value = false
  if (importResult.value) loadAssets()   // refresh the register after a completed import
  resetImport()
}

const runImport = async () => {
  if (!importFile.value || importing.value) return
  importing.value = true; importError.value = ''
  try {
    importResult.value = await assetsApi.processImport(importFile.value)
    const s = importResult.value?.report?.summary
    flash(`Import complete — ${s?.success ?? 0} of ${s?.total ?? 0} row(s) imported${s?.failed ? `, ${s.failed} failed` : ''}`,
      s?.failed ? 'error' : 'success')
  } catch (e: any) {
    importError.value = e?.message || 'Import failed'
  } finally {
    importing.value = false
  }
}

const openRowMenu = (e: MouseEvent, item: any, kind: 'asset' | 'tool' | 'register' = 'asset') => {
  if (rowMenu.value === item.uuid) { rowMenu.value = ''; return }
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  // teleported to body → fixed viewport coords; align right edge, drop below
  menuPos.top = r.bottom + 6
  menuPos.left = Math.max(8, r.right - 176)   // 176 ≈ menu width
  rowMenuItem.value = item
  rowMenuTag.value = item.asset_tag || ''
  rowMenuKind.value = kind
  rowMenu.value = item.uuid
}
const closeRowMenu = () => { rowMenu.value = '' }
onMounted(() => {
  document.addEventListener('click', closeHeaderMenu)
  document.addEventListener('click', closeRowMenu)
  document.addEventListener('click', closeIssueMenu)
  document.addEventListener('click', closeApproveMenu)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeHeaderMenu)
  document.removeEventListener('click', closeRowMenu)
  document.removeEventListener('click', closeIssueMenu)
  document.removeEventListener('click', closeApproveMenu)
})

// Print a QR code or Code-128 barcode of the asset_tag.
// Same hidden-iframe + window.print() approach as the inspection document, with the
// code-generation library pulled from a CDN inside the iframe (no npm dependency).
const printAssetCode = (tag: string, kind: 'qr' | 'barcode') => {
  if (!tag) return
  const isQR = kind === 'qr'
  const safeTag = String(tag)
  const lib = isQR
    ? 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    : 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js'
  const codeEl = isQR ? '<div id="code"></div>' : '<svg id="code"></svg>'
  const gen = isQR
    ? `new QRCode(document.getElementById('code'), { text: ${JSON.stringify(safeTag)}, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });`
    : `JsBarcode('#code', ${JSON.stringify(safeTag)}, { format: 'CODE128', height: 90, fontSize: 18, margin: 10, displayValue: true });`

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTag}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Tahoma, Arial, sans-serif; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .label { text-align: center; border: 1.5px solid #d0d4dc; border-radius: 12px; padding: 22px 32px; }
  .brand { font-weight: 800; letter-spacing: 1px; color: #3d7fbf; font-size: 12px; margin-bottom: 12px; }
  #code { display: flex; justify-content: center; }
  #code img, #code canvas, #code svg { display: block; margin: 0 auto; }
  .tag { margin-top: 12px; font-weight: 800; font-size: 18px; letter-spacing: 1px; color: #111; }
  @media print { .label { border: none; } }
</style></head><body>
  <div class="label">
    <div class="brand">IBCC · ASSET TAG</div>
    ${codeEl}
    <div class="tag">${safeTag}</div>
  </div>
  <script src="${lib}"><\/script>
  <script>
    (function () {
      function run () { try { ${gen} } catch (e) {} setTimeout(function () { window.focus(); window.print(); }, 400); }
      if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
    })();
  <\/script>
</body></html>`

  // off-screen but sized so the generated graphic actually renders for print
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:420px;height:620px;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }
  doc.open(); doc.write(html); doc.close()
  const cleanup = () => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }
  iframe.contentWindow?.addEventListener('afterprint', () => setTimeout(cleanup, 300))
  setTimeout(cleanup, 60000)   // safety net
}

const filteredAssets = computed(() => {
  const q = assetFilters.q.trim().toLowerCase()
  return assets.value.filter((a: any) => {
    if (q && !(`${a.name} ${a.asset_tag} ${a.serial_number ?? ''}`.toLowerCase().includes(q))) return false
    if (assetFilters.type && a.type?.code !== assetFilters.type) return false
    if (assetFilters.asset_class && a.type?.asset_class !== assetFilters.asset_class) return false
    if (assetFilters.condition && a.condition !== assetFilters.condition) return false
    if (assetFilters.operational_status && a.operational_status !== assetFilters.operational_status) return false
    if (assetFilters.pending_damages !== '' && !!a.has_pending_damages_approval !== (assetFilters.pending_damages === 'true')) return false
    if (assetFilters.pending_disposals !== '' && !!a.has_pending_disposal_approval !== (assetFilters.pending_disposals === 'true')) return false
    return true
  })
})

// server params carry pagination + search; advanced dropdowns stay client-side
const serverParams = computed(() => {
  const p: Record<string, any> = { page: assetsMeta.page }
  if (assetFilters.q) p.q = assetFilters.q
  return p
})
let qTimer: ReturnType<typeof setTimeout> | null = null
watch(() => assetFilters.q, () => {
  if (qTimer) clearTimeout(qTimer)
  qTimer = setTimeout(() => { assetsMeta.page = 1; loadAssets() }, 350)  // new term → page 1
})

const custodyLabel = (a: any) => {
  const c = a.custodies?.[0]
  if (!c) return '—'
  return [c.department, c.sub_department, c.room].filter(Boolean).join(' · ')
}
const statusClass = (s: string) => {
  if (s === 'IN_USE') return 'bg-ribbon-teal/15 text-ribbon-teal'
  if (s === 'OUT_OF_SERVICE' || s === 'DISPOSED') return 'bg-error/10 text-error'
  if (s === 'UNDER_MAINTENANCE') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-surface-container text-on-surface-variant'
}

// ── server-side pagination: /assets?page=N (API returns per_page 100) ───────
const assetsMeta = reactive({ page: 1, per_page: 100, total: 0, total_pages: 1 })

// rows visible at once in the scroll box; the rest of the current page scroll into view
const ROWS_PER_VIEW_OPTIONS = [25, 50, 100] as const
const rowsPerView = ref<number>(25)
const ROW_PX = 68     // approx height of one table row
const HEADER_PX = 52  // sticky header height
const scrollMaxH = computed(() => `${rowsPerView.value * ROW_PX + HEADER_PX}px`)

const goAssetPage = (p: number) => {
  if (p < 1 || p > (assetsMeta.total_pages || 1)) return
  assetsMeta.page = p
  loadAssets()
}

const PAGE_SIZE = 8   // retained: the Departments panel below still slices client-side

const goToAssetsFiltered = (kind: 'damages' | 'disposals') => {
  clearAssetFilters()
  if (kind === 'damages') assetFilters.pending_damages = 'true'
  else assetFilters.pending_disposals = 'true'
  activeTab.value = 'assets'
}

// ── loaders ───────────────────────────────────────────────────────────────────
const loadDashboard = async () => {
  loadingDash.value = true
  try { dashboard.value = await assetsApi.getDashboard() }
  catch (e: any) { flash(e.message || 'Failed to load dashboard', 'error') }
  finally { loadingDash.value = false }
}
const loadTypes = async () => { try { const r = await assetsApi.getTypes(); types.value = r?.data ?? [] } catch { /* ignore */ } }
const loadCountries = async () => { try { const r = await assetsApi.getCountries(); countries.value = r?.data ?? r ?? [] } catch { /* ignore */ } }
const loadAssets = async () => {
  loadingAssets.value = true
  try {
    const r = await assetsApi.listAssets(serverParams.value)
    assets.value = r?.data ?? []
    if (r?.meta) Object.assign(assetsMeta, r.meta)   // page / total / total_pages
  }
  catch (e: any) { flash(e.message || 'Failed to load assets', 'error') }
  finally { loadingAssets.value = false }
}

// ── create-asset modal ─────────────────────────────────────────────────────────
const showCreate = ref(false)
const saving = ref(false)
const busy = ref(false)   // shared loading flag for tool create / checkout / checkin
const pictures = ref<File[]>([])
const picCount = computed(() => pictures.value.length)
const onPics = (e: Event) => { pictures.value = Array.from((e.target as HTMLInputElement).files ?? []) }
const blankForm = () => ({
  asset_type_id: '', asset_tag: '', name: '', description: '', make: '', model: '', serial_number: '',
  supplier: '', quantity: 1, main_location: '', sub_location: '', room_description: '',
  condition: 'VERY_GOOD', operational_status: 'NOT_COMMISSIONED', acquisition_date: '', commissioned_on: '',
  currency_id: '', purchase_cost: '', life_span_years: '', depreciation_rate: '', depreciation_method: 'STRAIGHT_LINE',
  salvage_value: '', warranty_provider: '', warranty_expiry: '',
})
const form = reactive<Record<string, any>>(blankForm())
// pre-fill depreciation defaults from the chosen type
const selectedType = computed(() => types.value.find((t: any) => String(t.id) === String(form.asset_type_id)))
watch(() => form.asset_type_id, () => {
  const t = selectedType.value
  if (!t) return
  if (!form.life_span_years) form.life_span_years = t.default_life_span_years
  if (!form.depreciation_rate) form.depreciation_rate = t.default_depreciation_rate
})
const openCreate = () => { Object.assign(form, blankForm()); pictures.value = []; showCreate.value = true }
const submitCreate = async () => {
  if (!form.asset_type_id || !form.name) { flash('Asset type and name are required', 'error'); return }
  saving.value = true
  try {
    await assetsApi.createAsset({ ...form }, pictures.value)
    flash('Asset created'); showCreate.value = false
    loadAssets(); loadDashboard()
  } catch (e: any) { flash(e.message || 'Failed to create asset', 'error') }
  finally { saving.value = false }
}

// ── department dashboard (modal for privileged, inline view for others) ─────────
const deptDash = ref<any>(null)
const loadingDept = ref(false)
const deptModal = ref(false)
const deptModalName = ref('')
const departmentsList = ref<any[]>([])
const deptAssets = computed(() => deptDash.value?.assets ?? [])
const deptPage = ref(1)
const deptPages = computed(() => Math.max(1, Math.ceil(deptAssets.value.length / PAGE_SIZE)))
const pagedDeptAssets = computed(() => deptAssets.value.slice((deptPage.value - 1) * PAGE_SIZE, deptPage.value * PAGE_SIZE))
watch(deptAssets, () => { deptPage.value = 1 })

const loadDepartments = async () => { try { departmentsList.value = (await assetsApi.getDepartments()) ?? [] } catch { /* ignore */ } }
const loadDeptDashboard = async (departmentUuid = '') => {
  loadingDept.value = true
  try { deptDash.value = await assetsApi.getDepartmentDashboard(departmentUuid ? { department_uuid: departmentUuid } : {}) }
  catch (e: any) { flash(e.message || 'Failed to load department dashboard', 'error') }
  finally { loadingDept.value = false }
}
const openDeptModal = async (d: any) => {
  deptModalName.value = d?.name || 'Department dashboard'
  await loadDeptDashboard(d?.uuid ?? '')
  deptModal.value = true
}

// shared Department dashboard body (inline for restricted users, modal for privileged)
const DeptOverviewBody = () => {
  if (loadingDept.value && !deptDash.value) return h('p', { class: 'text-sm text-on-surface-variant py-6 text-center' }, 'Loading…')
  if (!deptDash.value) return h('p', { class: 'text-sm text-on-surface-variant' }, 'No department data loaded.')
  const s = deptDash.value.summary ?? {}
  const dept = deptDash.value.department ?? {}
  const anomalies = deptDash.value.anomalies ?? []
  const kpi = (label: string, value: string, accent = false) =>
    h('div', { class: `p-4 rounded-2xl border ${accent ? 'bg-primary/10 border-primary/20' : 'bg-white/60 border-white/60'}` }, [
      h('p', { class: `text-[10px] uppercase font-bold tracking-wider mb-1 ${accent ? 'text-primary' : 'text-outline'}` }, label),
      h('p', { class: `text-lg sm:text-xl font-extrabold ${accent ? 'text-primary' : 'text-on-surface'} break-words` }, value),
    ])
  const th = (t: string, extra = '') => h('th', { class: `py-3 px-4 ${extra}` }, t)
  const rows = pagedDeptAssets.value.length
    ? pagedDeptAssets.value.map((a: any) => h('tr', { key: a.asset_uuid, class: 'hover:bg-surface-low transition-colors cursor-pointer', onClick: () => navigateTo(`/assets/${a.asset_uuid}`) }, [
      h('td', { class: 'py-3 px-4 font-mono text-[11px] text-primary' }, a.asset_tag),
      h('td', { class: 'py-3 px-4 font-bold text-xs break-words' }, a.name),
      h('td', { class: 'py-3 px-4 text-xs text-on-surface-variant break-words' }, a.type),
      h('td', { class: 'py-3 px-4 text-xs' }, titleCase(a.condition)),
      h('td', { class: 'py-3 px-4 text-xs' }, titleCase(a.operational_status)),
    ]))
    : [h('tr', [h('td', { colspan: 5, class: 'py-6 text-center text-on-surface-variant' }, 'No assets in this department.')])]
  const pager = deptPages.value > 1
    ? h('div', { class: 'flex items-center justify-between gap-3 mt-4' }, [
      h('p', { class: 'text-xs sm:text-sm text-on-surface-variant' }, `Showing ${(deptPage.value - 1) * PAGE_SIZE + 1}–${Math.min(deptPage.value * PAGE_SIZE, deptAssets.value.length)} of ${deptAssets.value.length}`),
      h('div', { class: 'flex items-center gap-2' }, [
        h('button', { class: 'pager-btn', disabled: deptPage.value === 1, onClick: () => deptPage.value-- }, '‹'),
        h('span', { class: 'text-sm font-semibold text-on-surface' }, `${deptPage.value} / ${deptPages.value}`),
        h('button', { class: 'pager-btn', disabled: deptPage.value === deptPages.value, onClick: () => deptPage.value++ }, '›'),
      ]),
    ])
    : null
  return h('div', [
    dept.name ? h('p', { class: 'text-sm sm:text-base font-bold text-on-surface mb-3 break-words' }, `${dept.name} (${dept.code})`) : null,
    h('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5' }, [
      kpi('Total assets', String(s.total_assets ?? 0)),
      kpi('In service', String(s.in_service ?? 0)),
      kpi('Out of service', String(s.out_of_service ?? 0)),
      kpi('On-hand value', fmtAssetMoney(s.on_hand_value), true),
    ]),
    anomalies.length
      ? h('div', { class: 'mb-5' }, [
        h('p', { class: 'text-[12px] font-bold uppercase tracking-widest text-error mb-2' }, `Anomalies (${anomalies.length})`),
        h('div', { class: 'space-y-2 max-h-[200px] overflow-y-auto scroll-area pr-1' }, anomalies.map((an: any, i: number) =>
          h('div', { key: i, class: 'p-3 rounded-xl bg-error/5 border border-error/10' }, [
            h('div', { class: 'flex justify-between items-center gap-2' }, [
              h('span', { class: 'text-xs font-mono text-primary' }, an.asset_tag),
              h('span', { class: 'text-[10px] font-bold uppercase text-error' }, an.severity),
            ]),
            h('p', { class: 'text-xs font-bold text-on-surface break-words mt-0.5' }, an.name),
            h('p', { class: 'text-[11px] text-on-surface-variant break-words' }, an.detail),
          ]))),
      ])
      : null,
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-left border-collapse text-sm sm:text-base' }, [
        h('thead', { class: 'bg-primary/5' }, [h('tr', { class: 'text-[10px] text-on-surface-variant uppercase tracking-widest' }, [
          th('Tag'), th('Name'), th('Type'), th('Condition'), th('Status'),
        ])]),
        h('tbody', { class: 'divide-y divide-outline-variant/10' }, rows),
      ]),
    ]),
    pager,
  ])
}

// ════════════════════════════ TEMPLATES TAB ════════════════════════════════
// literal class strings (Tailwind JIT — never build dynamically)
const TEMPLATE_ACCENT = ['border-ribbon-blue', 'border-ribbon-teal', 'border-ribbon-amber', 'border-ribbon-purple', 'border-ribbon-red']
const TEMPLATE_CODE = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']
const TEMPLATE_PILL = ['bg-ribbon-blue/12 text-ribbon-blue', 'bg-ribbon-teal/12 text-ribbon-teal', 'bg-ribbon-amber/15 text-ribbon-amber', 'bg-ribbon-purple/12 text-ribbon-purple', 'bg-ribbon-red/12 text-ribbon-red']

// tool-register stat boxes (4-cycle) + departments cards (5-cycle) — literal classes for JIT
const TOOL_BOX_BG = ['bg-ribbon-blue/6', 'bg-ribbon-teal/6', 'bg-ribbon-amber/8', 'bg-ribbon-purple/6']
const TOOL_BOX_BORDER = ['border-ribbon-blue/20 border-l-ribbon-blue', 'border-ribbon-teal/20 border-l-ribbon-teal', 'border-ribbon-amber/25 border-l-ribbon-amber', 'border-ribbon-purple/20 border-l-ribbon-purple']
const TOOL_BOX_TEXT = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple']
const DEPT_BG = ['bg-ribbon-blue/6', 'bg-ribbon-teal/6', 'bg-ribbon-amber/8', 'bg-ribbon-purple/6', 'bg-ribbon-red/6']
const DEPT_BORDER = ['border-ribbon-blue/20 border-l-ribbon-blue hover:bg-ribbon-blue/12', 'border-ribbon-teal/20 border-l-ribbon-teal hover:bg-ribbon-teal/12', 'border-ribbon-amber/25 border-l-ribbon-amber hover:bg-ribbon-amber/12', 'border-ribbon-purple/20 border-l-ribbon-purple hover:bg-ribbon-purple/12', 'border-ribbon-red/20 border-l-ribbon-red hover:bg-ribbon-red/12']
const DEPT_TEXT = ['text-ribbon-blue', 'text-ribbon-teal', 'text-ribbon-amber', 'text-ribbon-purple', 'text-ribbon-red']

const templates = ref<any[]>([])
const loadingTemplates = ref(false)
const templateQuery = ref('')
const filteredTemplates = computed(() => {
  const q = templateQuery.value.trim().toLowerCase()
  if (!q) return templates.value
  return templates.value.filter((t: any) => `${t.name} ${t.code} ${t.asset_type?.name ?? ''}`.toLowerCase().includes(q))
})
const loadTemplates = async () => {
  loadingTemplates.value = true
  try { const r = await assetsApi.getChecklistTemplates(); templates.value = r?.data ?? [] }
  catch (e: any) { flash(e.message || 'Failed to load templates', 'error') }
  finally { loadingTemplates.value = false }
}

// ════════════════════════════════ TOOLS TAB ═════════════════════════════════
const TOOL_CATEGORIES = ['HAND_TOOL', 'POWER_TOOL', 'MEASURING', 'ELECTRICAL', 'OTHER']
const TOOL_CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'DAMAGED']
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const toolsSub = ref<'manage' | 'register'>('manage')

// pill class helpers (ribbon)
const conditionClass = (c: string) => (c === 'VERY_GOOD' || c === 'GOOD') ? 'bg-ribbon-teal/15 text-ribbon-teal'
  : (c === 'FAULTY' || c === 'POOR' || c === 'DAMAGED') ? 'bg-error/10 text-error'
    : 'bg-ribbon-amber/15 text-ribbon-amber'
const toolCatClass = (c: string) => ({
  HAND_TOOL: 'bg-ribbon-blue/12 text-ribbon-blue', POWER_TOOL: 'bg-ribbon-red/12 text-ribbon-red',
  MEASURING: 'bg-ribbon-teal/12 text-ribbon-teal', ELECTRICAL: 'bg-ribbon-amber/15 text-ribbon-amber',
  OTHER: 'bg-ribbon-purple/12 text-ribbon-purple',
} as Record<string, string>)[c] || 'bg-surface-container text-on-surface-variant'
const toolStatusClass = (s: string) => s === 'AVAILABLE' ? 'bg-ribbon-teal/15 text-ribbon-teal'
  : s === 'ON_LOAN' ? 'bg-ribbon-amber/15 text-ribbon-amber'
    : s === 'IN_MAINTENANCE' ? 'bg-ribbon-blue/12 text-ribbon-blue'
      : s === 'LOST' ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface-variant'
const registerStatusClass = (s: string) => s === 'TAKEN' ? 'bg-ribbon-amber/15 text-ribbon-amber'
  : s === 'RETURNED' ? 'bg-ribbon-teal/15 text-ribbon-teal'
    : s === 'OVERDUE' ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface-variant'

// users (for custodian / taken-by pickers) — filtered to Biomedical Engineering
const users = ref<any[]>([])
const loadUsers = async () => { try { const r = await assetsApi.getUsers(); users.value = r?.users ?? r?.data ?? [] } catch { /* ignore */ } }
const bmeUsers = computed(() => users.value.filter((u: any) => u.department?.name === 'Biomedical Engineering'))
// assets currently UNDER_MAINTENANCE (optional checkout link)
const maintenanceAssets = computed(() => assets.value.filter((a: any) => a.operational_status === 'UNDER_MAINTENANCE'))

// ── tools list ──
const tools = ref<any[]>([])
const loadingTools = ref(false)
const toolQuery = ref('')
const filteredTools = computed(() => {
  const q = toolQuery.value.trim().toLowerCase()
  if (!q) return tools.value
  return tools.value.filter((t: any) => `${t.name} ${t.code} ${t.category}`.toLowerCase().includes(q))
})
const toolsAvailable = computed(() => tools.value.filter((t: any) => t.status === 'AVAILABLE').length)
const toolsOnLoan = computed(() => tools.value.filter((t: any) => t.status === 'ON_LOAN').length)
const toolsUnits = computed(() => tools.value.reduce((s: number, t: any) => s + (Number(t.quantity) || 0), 0))
const loadTools = async () => {
  loadingTools.value = true
  try { const r = await assetsApi.getTools(); tools.value = r?.data ?? [] }
  catch (e: any) { flash(e.message || 'Failed to load tools', 'error') }
  finally { loadingTools.value = false }
}

// ── tool registers ──
const toolRegisters = ref<any[]>([])
const loadingRegisters = ref(false)
const registerQuery = ref('')
const filteredRegisters = computed(() => {
  const q = registerQuery.value.trim().toLowerCase()
  if (!q) return toolRegisters.value
  return toolRegisters.value.filter((r: any) => `${r.reference_no} ${r.tool} ${r.taken_by_name}`.toLowerCase().includes(q))
})
const loadRegisters = async () => {
  loadingRegisters.value = true
  try { const r = await assetsApi.getToolRegisters(); toolRegisters.value = r?.data ?? [] }
  catch (e: any) { flash(e.message || 'Failed to load register', 'error') }
  finally { loadingRegisters.value = false }
}

// ── create tool ──
const showCreateTool = ref(false)
const blankTool = () => ({ name: '', description: '', category: 'HAND_TOOL', quantity: 1, condition: 'GOOD', custodian_uuid: '' })
const toolForm = reactive<Record<string, any>>(blankTool())
const openCreateTool = () => { Object.assign(toolForm, blankTool()); if (!users.value.length) loadUsers(); showCreateTool.value = true }
const submitCreateTool = async () => {
  if (!toolForm.name?.trim()) { flash('Tool name is required', 'error'); return }
  busy.value = true
  try {
    await assetsApi.createTool({ ...toolForm })
    flash('Tool created'); showCreateTool.value = false; loadTools()
  } catch (e: any) { flash(e.message || 'Failed to create tool', 'error') } finally { busy.value = false }
}

// ── checkout tool ──
const showCheckout = ref(false)
const checkoutTool_ = ref<any>(null)
const blankCheckout = () => ({ taken_by_uuid: '', date_taken: todayStr(), expected_return_date: '', purpose: '', asset_maintenance_uuid: '' })
const checkoutForm = reactive<Record<string, any>>(blankCheckout())
const openCheckout = (t: any) => {
  checkoutTool_.value = t; Object.assign(checkoutForm, blankCheckout())
  if (!users.value.length) loadUsers()
  showCheckout.value = true
}
const submitCheckout = async () => {
  if (!checkoutForm.taken_by_uuid) { flash('Select who is taking the tool', 'error'); return }
  busy.value = true
  try {
    await assetsApi.checkoutTool({ tool_uuid: checkoutTool_.value?.uuid, ...checkoutForm })
    flash('Tool checked out'); showCheckout.value = false; loadTools(); loadRegisters()
  } catch (e: any) { flash(e.message || 'Failed to checkout tool', 'error') } finally { busy.value = false }
}

// ── check-in tool ──
const showCheckin = ref(false)
const checkinReg_ = ref<any>(null)
const blankCheckin = () => ({ returned_on: todayStr(), condition: 'GOOD', comment: '' })
const checkinForm = reactive<Record<string, any>>(blankCheckin())
const openCheckin = (r: any) => { checkinReg_.value = r; Object.assign(checkinForm, blankCheckin()); showCheckin.value = true }
const submitCheckin = async () => {
  busy.value = true
  try {
    await assetsApi.checkinTool({ tool_register_uuid: checkinReg_.value?.uuid, ...checkinForm })
    flash('Tool checked in'); showCheckin.value = false; loadRegisters(); loadTools()
  } catch (e: any) { flash(e.message || 'Failed to check in tool', 'error') } finally { busy.value = false }
}

// lazy-load each tab's data the first time it's opened
watch(activeTab, (t) => {
  if (t === 'templates' && !templates.value.length) loadTemplates()
  if (t === 'tools') {
    if (!tools.value.length) loadTools()
    if (!toolRegisters.value.length) loadRegisters()
    if (!users.value.length) loadUsers()
  }
  if (t === 'issues' && !issuesTab.data.length) issuesTab.load()
  if (t === 'maintenances' && !maintenancesTab.data.length) maintenancesTab.load()
  if (t === 'inspections' && !inspectionsTab.data.length) inspectionsTab.load()
  if (t === 'damages' && !damagesTab.data.length) damagesTab.load()
  if (t === 'disposals' && !disposalsTab.data.length) disposalsTab.load()
})

// ── mount ───────────────────────────────────────────────────────────────────
const syncTabFromQuery = () => {
  const t = route.query.tab as TabKey | undefined
  if (t && tabs.some((x) => x.key === t)) activeTab.value = t   // deep-link any tab (templates, assets, …)
}
onMounted(() => {
  syncTabFromQuery()
  loadDashboard(); loadTypes(); loadCountries(); loadAssets(); loadDepartments()
})
// re-check when returning to a kept-alive instance of this page (onMounted won't refire)
onActivated(syncTabFromQuery)
</script>

<style scoped>
.inv-page {
  min-height: 100%;
  background: linear-gradient(135deg, #f7f9fb 0%, #d6e8fa 100%);
  padding: 1rem;
}

@media (min-width: 768px) {
  .inv-page {
    padding: 2rem;
  }
}

.inv-frame {
  border: 12px solid transparent;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(214, 232, 250, 0.45)) border-box;
  border-radius: 2.5rem;
}

.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
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

/* search bar — matches the Register-Customer wizard inputs */
.cust-input {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
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

.cust-input.has-icon {
  padding-left: 2.5rem;
}

/* filter dropdowns */
.filter-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-outline, #727687);
  margin-left: 0.25rem;
  display: block;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
  border: none;
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

.filter-select:hover:not(:focus) {
  background: #e6e8ea;
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

.scroll-area::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: rgba(61, 127, 191, 0.2);
  border-radius: 10px;
}

.scroll-area {
  scrollbar-width: thin;
  scrollbar-color: rgba(61, 127, 191, 0.2) transparent;
}

.pager-btn {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--color-outline-variant, #c2c6d8);
  color: var(--color-primary, #3d7fbf);
  transition: background 0.15s ease;
}

.pager-btn:hover:not(:disabled) {
  background: #fff;
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

/* tools sub-tabs */
.subtab {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-on-surface-variant, #424656);
  background: var(--color-surface-low, #f2f4f6);
  transition: all 0.18s ease;
}

.subtab:hover {
  background: #e6e8ea;
}

.subtab-active-teal {
  background: rgba(61, 174, 140, 0.15);
  color: #2c7d65;
  box-shadow: inset 0 0 0 1.5px rgba(61, 174, 140, 0.4);
}

.subtab-active-purple {
  background: rgba(176, 95, 168, 0.13);
  color: #8a3f83;
  box-shadow: inset 0 0 0 1.5px rgba(176, 95, 168, 0.4);
}

/* tool stat cards (ribbon left border) */
.stat-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 1rem;
  border-left-width: 4px;
  padding: 1rem 1.1rem;
  box-shadow: 0 6px 18px rgba(61, 127, 191, 0.05);
}

.stat-k {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
}

.stat-v {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-on-surface, #191c1e);
}

/* alive tables (ribbon-tinted headers + hover) */
.alive-tbl tbody tr {
  transition: background 0.15s ease;
}

.alive-tbl tbody tr:nth-child(even) {
  background: rgba(25, 28, 30, 0.018);
}

.tbl-teal thead tr {
  background: linear-gradient(90deg, rgba(61, 174, 140, 0.14), rgba(61, 174, 140, 0.04));
}

.tbl-teal thead th {
  border-bottom: 2px solid rgba(61, 174, 140, 0.4);
}

.tbl-teal tbody tr:hover {
  background: rgba(61, 174, 140, 0.08);
}

.tbl-purple thead tr {
  background: linear-gradient(90deg, rgba(176, 95, 168, 0.14), rgba(176, 95, 168, 0.04));
}

.tbl-purple thead th {
  border-bottom: 2px solid rgba(176, 95, 168, 0.4);
}

.tbl-purple tbody tr:hover {
  background: rgba(176, 95, 168, 0.08);
}

/* ribbon-blue table (ribbon.blue #3d7fbf) */
.tbl-blue thead tr {
  background: linear-gradient(90deg, rgba(61, 127, 191, 0.14), rgba(61, 127, 191, 0.04));
}

.tbl-blue thead th {
  border-bottom: 2px solid rgba(61, 127, 191, 0.4);
}

.tbl-blue tbody tr:hover {
  background: rgba(61, 127, 191, 0.08);
}

/* ribbon-red table (ribbon.red #c0395a) */
.tbl-red thead tr {
  background: linear-gradient(90deg, rgba(192, 57, 90, 0.14), rgba(192, 57, 90, 0.04));
}

.tbl-red thead th {
  border-bottom: 2px solid rgba(192, 57, 90, 0.4);
}

.tbl-red tbody tr:hover {
  background: rgba(192, 57, 90, 0.08);
}

/* ribbon-amber table (ribbon.amber #e8a33d) */
.tbl-amber thead tr {
  background: linear-gradient(90deg, rgba(232, 163, 61, 0.16), rgba(232, 163, 61, 0.05));
}

.tbl-amber thead th {
  border-bottom: 2px solid rgba(232, 163, 61, 0.45);
}

.tbl-amber tbody tr:hover {
  background: rgba(232, 163, 61, 0.10);
}

/* assets tab — advanced options toggle + clear chip */
.adv-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #3d7fbf;
  background: rgba(61, 127, 191, 0.08);
  transition: all 0.18s ease;
}

.adv-btn:hover {
  background: rgba(61, 127, 191, 0.14);
}

.adv-btn-on {
  background: #3d7fbf;
  color: #fff;
  box-shadow: 0 6px 16px rgba(61, 127, 191, 0.25);
}

.clear-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #c0395a;
  background: rgba(192, 57, 90, 0.1);
  transition: all 0.18s ease;
}

.clear-chip:hover {
  background: rgba(192, 57, 90, 0.18);
}

/* assets tab — per-row actions menu */
.row-act-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
  color: var(--color-primary, #3d7fbf);
  background: rgba(61, 127, 191, 0.08);
  transition: background 0.15s ease;
}

.row-act-btn:hover {
  background: rgba(61, 127, 191, 0.16);
}

.row-menu {
  position: fixed;
  z-index: 80;
  min-width: 11rem;
  background: #fff;
  border: 1px solid var(--color-outline-variant, #c2c6d8);
  border-radius: 0.85rem;
  box-shadow: 0 14px 34px rgba(25, 28, 30, 0.16);
  padding: 0.35rem;
}

.row-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  text-align: left;
  transition: background 0.12s ease;
}

.row-menu-item:hover {
  background: var(--color-surface-low, #f2f4f6);
}

.row-menu-empty {
  padding: 0.55rem 0.7rem;
  font-size: 0.75rem;
  color: var(--color-outline, #74777f);
  text-align: center;
}

.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.tab-more-btn {
  @apply flex items-center gap-1 px-3 py-2 rounded-xl text-primary bg-primary/10 hover:bg-primary/15 transition-colors;
}
</style>