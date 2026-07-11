<!-- app/pages/inventory/index.vue -->
<!-- Stock Command Center — tabbed administrative dashboard (Overview + Inventory Items). -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- ── 1. Header ────────────────────────────────────────────────────── -->
      <header
        class="g-card relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'boxes-stacked']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-lg sm:text-md text-outline font-bold mt-0.5 uppercase">
              {{ isPrivileged ? 'Administrative inventory overview' : `${auth.currentUser?.department || 'Department'}
              inventory overview` }}
            </h1>
          </div>
        </div>
        <button v-if="can('inventory_management')" ref="headerMenuBtn" type="button" class="adv-btn"
          :class="{ 'adv-btn-on': headerMenu }" @click.stop="toggleHeaderMenu">
          <font-awesome-icon :icon="['fas', 'sliders']" />
          <span>Advanced options</span>
          <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
            :class="{ 'rotate-180': headerMenu }" />
        </button>
      </header>

      <!-- feedback -->
      <div v-if="feedback.msg" :class="feedback.kind === 'error' ? 'alert-error' : 'alert-success'">
        <font-awesome-icon :icon="['fas', feedback.kind === 'error' ? 'circle-exclamation' : 'circle-check']"
          class="mt-0.5" />
        <span class="break-words">{{ feedback.msg }}</span>
      </div>

      <!-- ═══════════ PRIVILEGED VIEW (system_administrator / inventory_officer) ═══════════ -->
      <template v-if="isPrivileged">
        <!-- ── Tab bar: width locked to the primary group, Show more/less scrolls the rest in ── -->
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
              <span class="text-xs sm:text-sm font-semibold whitespace-nowrap">{{ tabsExpanded ? 'Show less' : 'Show more' }}</span>
            </button>
          </div>
        </div>

        <!-- ───────────── OVERVIEW TAB ───────────── -->
        <template v-if="activeTab === 'overview'">
        <template v-if="showSkeleton">
          <SkeletonStatGrid :count="4" grid-class="grid-cols-2 lg:grid-cols-4" />
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SkeletonPanel :bars="4" />
            <SkeletonPanel :bars="4" />
            <SkeletonPanel :bars="4" />
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SkeletonPanel :bars="3" />
            <SkeletonPanel :bars="3" />
            <SkeletonPanel :bars="3" />
          </div>
        </template>
        <template v-else>
          <!-- 2. KPI cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
              <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Total items</p>
              <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.total_items ?? '—' }}</p>
            </div>
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-purple">
              <p class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-2">Billable items</p>
              <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.billable_items ?? '—' }}</p>
              <p class="text-[11px] text-on-surface-variant opacity-70 mt-1">{{ billablePct }}% of inventory</p>
            </div>
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-amber">
              <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider mb-2">Controlled items</p>
              <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ summary.controlled_items ?? '—' }}</p>
              <p class="text-[11px] text-ribbon-amber font-bold flex items-center gap-1 mt-1">
                <font-awesome-icon :icon="['fas', 'shield-halved']" class="text-[12px]" /> High security
              </p>
            </div>
            <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal bg-ribbon-teal/5">
              <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-2">Central store value</p>
              <p class="text-lg sm:text-xl lg:text-2xl font-extrabold text-secondary-on-container break-words">
                {{ fmtMoney(valuation.central_store_value, valuation.currency || 'MWK') }}
              </p>
              <p class="text-[11px] text-ribbon-teal font-medium mt-1">Total asset value</p>
            </div>
          </div>

          <!-- 3. Row of 3: Low stock alerts | Items by type | Departments stocked -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <!-- low stock alerts -->
            <div class="g-card p-6 flex flex-col">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
                </div>
                <h3 class="text-base sm:text-lg font-semibold sm:font-bold uppercase">Low stock alerts</h3>
              </div>
              <div class="overflow-auto max-h-[320px] scroll-area -mx-2 px-2">
                <table class="w-full text-left border-collapse text-sm alive-tbl tbl-red">
                  <thead class="bg-surface-lowest rounded-lg sticky top-0 z-10">
                    <tr class="text-[10px] text-on-surface-variant uppercase tracking-widest">
                      <th class="py-2.5 px-3">Item</th>
                      <th class="py-2.5 px-3 text-right">On hand</th>
                      <th class="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/10">
                    <tr v-for="l in lowStock" :key="l.id" class="hover:bg-surface-low transition-colors">
                      <td class="py-3 px-3">
                        <p class="font-bold break-words">{{ l.name }}</p>
                        <p class="text-[10px] font-mono text-primary">{{ l.code }}</p>
                      </td>
                      <td class="py-3 px-3 text-right font-bold"
                        :class="Number(l.on_hand) === 0 ? 'text-error' : 'text-ribbon-amber'">{{ fmtQty(l.on_hand) }}
                      </td>
                      <td class="py-3 px-3 text-right">
                        <span v-if="Number(l.on_hand) === 0"
                          class="bg-error text-white text-[9px] font-bold px-2 py-0.5 rounded-full">CRITICAL</span>
                        <span v-else
                          class="bg-ribbon-amber text-white text-[9px] font-bold px-2 py-0.5 rounded-full">LOW</span>
                      </td>
                    </tr>
                    <tr v-if="!lowStock.length">
                      <td colspan="3" class="py-6 text-center text-on-surface-variant">Nothing below reorder level.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- items by type (bar chart) -->
            <div class="g-card p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base sm:text-lg font-semibold sm:font-bold uppercase">Items by type</h3>
                <span class="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{{
                  itemsByType.length }} cats</span>
              </div>
              <client-only>
                <apexchart v-if="itemsByType.length" type="bar" :height="typeChartHeight" :options="typeChartOptions"
                  :series="typeChartSeries" />
                <p v-else class="text-sm text-on-surface-variant py-8 text-center">No data.</p>
              </client-only>
            </div>

            <!-- departments stocked -->
            <div class="g-card p-6">
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold mb-4 uppercase">Departments stocked</h3>
              <div class="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto scroll-area pr-1">
                <button v-for="d in deptStocked" :key="d.type" type="button"
                  class="text-left bg-ribbon-purple/5 p-4 rounded-2xl border border-ribbon-purple/15 hover:bg-ribbon-purple/10 hover:shadow-md transition-all cursor-pointer"
                  @click="openDeptModal(d)">
                  <p class="text-[10px] text-on-surface-variant uppercase font-bold mb-1 truncate">{{ d.type }}</p>
                  <p class="text-lg sm:text-xl font-extrabold text-ribbon-purple">
                    {{ d.unique_items }} <span class="text-xs font-normal text-outline">items</span>
                  </p>
                </button>
                <p v-if="!deptStocked.length" class="text-sm text-on-surface-variant col-span-full">No departments
                  stocked.</p>
              </div>
            </div>
          </div>

          <!-- 4. Row of 3: Pending approvals | Expiry tracking | Recent receipts -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <!-- pending approvals (clickable → Inventory Items tab filtered) -->
            <div class="g-card p-6">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-full bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber">
                  <font-awesome-icon :icon="['fas', 'clipboard-list']" />
                </div>
                <h3 class="text-[12px] font-bold uppercase tracking-widest">Pending approvals</h3>
              </div>
              <div class="space-y-3">
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-surface-low rounded-2xl border border-white/50 hover:bg-white transition-colors"
                  @click="goToItemsFiltered('price')">
                  <span class="text-sm sm:text-base font-medium">Price changes</span>
                  <span class="font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg">{{ pad(approvals.prices)
                    }}</span>
                </button>
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-surface-low rounded-2xl border border-white/50 hover:bg-white transition-colors"
                  @click="goToItemsFiltered('damages')">
                  <span class="text-sm sm:text-base font-medium">Damages</span>
                  <span class="font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg">{{ pad(approvals.damages)
                    }}</span>
                </button>
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-surface-low rounded-2xl border border-white/50 hover:bg-white transition-colors"
                  @click="goToItemsFiltered('disposals')">
                  <span class="text-sm sm:text-base font-medium">Disposals</span>
                  <span class="font-extrabold px-3 py-1 rounded-lg"
                    :class="approvals.disposals ? 'text-primary bg-primary/10' : 'text-outline bg-surface-container'">{{
                      pad(approvals.disposals) }}</span>
                </button>
              </div>
            </div>

            <!-- expiry -->
            <div class="g-card p-6">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <font-awesome-icon :icon="['fas', 'calendar-xmark']" />
                </div>
                <h3 class="text-[12px] font-bold uppercase tracking-widest">Expiry tracking</h3>
              </div>
              <div class="space-y-3">
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-error/5 rounded-2xl border border-error/10 hover:bg-error/10 transition-colors"
                  @click="goToExpiry('expired')">
                  <span class="text-sm sm:text-base text-error font-bold">Expired batches</span>
                  <span class="font-extrabold text-error">{{ expired.batches }}</span>
                </button>
                <button type="button"
                  class="w-full flex justify-between items-center p-3.5 bg-ribbon-amber/10 rounded-2xl border border-ribbon-amber/25 hover:bg-ribbon-amber/15 transition-colors"
                  @click="goToExpiry('expiring')">
                  <span class="text-sm sm:text-base text-ribbon-amber font-bold">Expiring soon</span>
                  <span class="font-extrabold text-ribbon-amber">{{ expiringSoon.length }}</span>
                </button>
                <div class="flex justify-between items-center p-3.5 bg-surface-low rounded-2xl">
                  <span class="text-sm sm:text-base font-medium">Expired qty</span>
                  <span class="font-extrabold text-on-surface">{{ fmtQty(expired.quantity) }}</span>
                </div>
              </div>
            </div>

            <!-- recent receipts -->
            <div class="g-card p-6">
              <div class="flex items-center justify-between mb-5">
                <h3 class="text-base sm:text-lg font-semibold sm:font-bold uppercase">Recent receipts</h3>
                <font-awesome-icon :icon="['fas', 'receipt']" class="text-ribbon-teal" />
              </div>
              <div class="space-y-3 max-h-[260px] overflow-y-auto pr-1 scroll-area">
                <div v-for="(r, i) in receipts" :key="`${r.batch_no}-${i}`"
                  class="p-3 bg-surface-low rounded-lg border border-white/50">
                  <div class="flex justify-between items-center gap-2 mb-1">
                    <span class="text-xs font-bold text-on-surface break-words">{{ r.batch_no }}</span>
                    <span class="text-[10px] text-outline whitespace-nowrap">{{ relTime(r.received_date) }}</span>
                  </div>
                  <p class="text-xs text-on-surface-variant break-words">{{ r.item }} ({{ fmtQty(r.quantity) }} units)
                  </p>
                </div>
                <p v-if="!receipts.length" class="text-sm text-on-surface-variant py-4 text-center">No recent receipts.
                </p>
              </div>
            </div>
          </div>

          <!-- 5. Usage insights (last N days) -->
          <div class="g-card grid grid-cols-1 lg:grid-cols-3 gap-5 p-6">
            <!-- usage summary -->
            <div class="p-6">
              <div class="flex items-center gap-3 mb-5">
                <div
                  class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
                  <font-awesome-icon :icon="['fas', 'chart-line']" />
                </div>
                <h3 class="text-[12px] font-bold uppercase tracking-widest">Usage insights</h3>
                <span
                  class="ml-auto text-[10px] font-bold text-ribbon-purple bg-ribbon-purple/10 px-2.5 py-1 rounded-full whitespace-nowrap">last
                  {{ usageWindow }}d</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3.5 rounded-2xl bg-ribbon-blue/8 border border-ribbon-blue/20">
                  <div class="flex items-center gap-1.5 mb-1">
                    <font-awesome-icon :icon="['fas', 'bolt']" class="text-ribbon-blue text-xs" />
                    <p class="text-[10px] text-ribbon-blue uppercase font-bold">Events</p>
                  </div>
                  <p class="text-xl sm:text-2xl font-extrabold text-on-surface">{{ usage.events ?? 0 }}</p>
                </div>
                <div class="p-3.5 rounded-2xl bg-ribbon-amber/10 border border-ribbon-amber/25">
                  <div class="flex items-center gap-1.5 mb-1">
                    <font-awesome-icon :icon="['fas', 'boxes-stacked']" class="text-ribbon-amber text-xs" />
                    <p class="text-[10px] text-ribbon-amber uppercase font-bold">Qty used</p>
                  </div>
                  <p class="text-xl sm:text-2xl font-extrabold text-on-surface">{{ fmtQty(usage.quantity_used) }}</p>
                </div>
                <div
                  class="col-span-2 p-4 rounded-2xl bg-ribbon-teal/10 border border-ribbon-teal/25 flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-ribbon-teal/20 flex items-center justify-center text-ribbon-teal shrink-0">
                    <font-awesome-icon :icon="['fas', 'coins']" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] text-ribbon-teal uppercase font-bold mb-0.5">Billable value</p>
                    <p class="text-base sm:text-lg font-extrabold text-secondary-on-container break-words">
                      {{ fmtMoney(usage.billable_value?.amount, usage.billable_value?.currency || 'MWK') }}</p>
                  </div>
                </div>
              </div>
              <div v-if="byConsumerType.length" class="mt-4">
                <p class="text-[10px] text-outline uppercase font-bold tracking-widest mb-2">By consumer type</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="(c, ci) in byConsumerType" :key="c.consumer_type"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    :class="DEPT_CHIP[ci % DEPT_CHIP.length]">
                    {{ titleCase(c.consumer_type) }} <span class="font-extrabold">· {{ fmtQty(c.quantity_used) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- top consumed items -->
            <div class="p-6">
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold uppercase mb-4">Top consumed items</h3>
              <div class="space-y-3 max-h-[300px] overflow-y-auto scroll-area pr-1">
                <div v-for="(t, ti) in topConsumed" :key="t.inventory_id"
                  class="p-3 bg-surface-low rounded-xl border border-white/50">
                  <div class="flex items-center gap-3 mb-2">
                    <span
                      class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
                      :class="RANK_BADGE[ti % RANK_BADGE.length]">{{ ti + 1 }}</span>
                    <span class="text-sm font-semibold text-on-surface break-words flex-1 min-w-0">{{ t.name }}</span>
                    <span class="text-sm font-extrabold text-on-surface whitespace-nowrap">{{ fmtQty(t.quantity_used)
                    }}</span>
                  </div>
                  <div class="h-2 rounded-full bg-surface-container overflow-hidden">
                    <div class="h-full rounded-full transition-all" :class="BAR_COLORS[ti % BAR_COLORS.length]"
                      :style="{ width: usagePct(t.quantity_used) + '%' }" />
                  </div>
                </div>
                <p v-if="!topConsumed.length" class="text-sm text-on-surface-variant py-4 text-center">No usage
                  recorded.
                </p>
              </div>
            </div>

            <!-- usage by department -->
            <div class="p-6">
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold uppercase mb-4">Usage by department</h3>
              <div class="space-y-2 max-h-[300px] overflow-y-auto scroll-area pr-1">
                <div v-for="(d, i) in usageByDept" :key="`${d.department}-${d.item}-${i}`"
                  class="flex items-center gap-3 p-3 bg-surface-low rounded-xl border border-white/50">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap shrink-0"
                    :class="DEPT_CHIP[i % DEPT_CHIP.length]">{{ d.department }}</span>
                  <span class="text-xs text-on-surface-variant break-words flex-1 min-w-0">{{ d.item }}</span>
                  <span class="text-sm font-extrabold text-on-surface whitespace-nowrap">{{ fmtQty(d.quantity_used)
                  }}</span>
                </div>
                <p v-if="!usageByDept.length" class="text-sm text-on-surface-variant py-4 text-center">No departmental
                  usage.</p>
              </div>
            </div>
          </div>
        </template>
        </template>

        <!-- ───────────── INVENTORY ITEMS TAB ───────────── -->
        <template v-else-if="activeTab === 'items'">
          <div class="g-card relative z-10 p-6 sm:p-8">
            <div class="flex flex-col gap-5 mb-6">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 class="text-2xl font-bold text-outline uppercase">Comprehensive real-time items list</h1>
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
                    <button v-if="anyItemFilter" type="button" class="clear-chip" @click="clearItemFilters">
                      <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
                      <span
                        class="ml-1 bg-ribbon-red/15 text-ribbon-red rounded-full px-1.5 text-[10px] font-extrabold">{{
                          activeItemFilterCount }}</span>
                    </button>
                  </div>

                  <!-- search bar (matches Register-Customer wizard) -->
                  <div class="relative w-full md:w-96">
                    <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                      class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                    <input v-model="itemFilters.q" type="text" autocomplete="off"
                      placeholder="Search by name, code or barcode…" class="cust-input has-icon" />
                  </div>
                </div>
              </div>

              <!-- filter dropdowns -->
              <div v-show="showFilters"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-low/60 border border-ribbon-blue/10">
                <div>
                  <label class="filter-label">Type</label>
                  <SearchSelect v-model="itemFilters.type" :options="types" option-value="code" option-label="name"
                    icon="tag" placeholder="All types" search-placeholder="Search types…" clearable />
                </div>
                <div>
                  <label class="filter-label">Billing</label>
                  <div class="filter-wrap">
                    <select v-model="itemFilters.billable" class="filter-select">
                      <option value="">All items</option>
                      <option value="true">Billable only</option>
                      <option value="false">Non-billable only</option>
                    </select>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                  </div>
                </div>
                <div>
                  <label class="filter-label">Prescription</label>
                  <div class="filter-wrap">
                    <select v-model="itemFilters.prescribable" class="filter-select">
                      <option value="">Any</option>
                      <option value="true">Prescribable</option>
                      <option value="false">Non-prescribable</option>
                    </select>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                  </div>
                </div>
                <div>
                  <label class="filter-label">Expiry</label>
                  <div class="filter-wrap">
                    <select v-model="itemFilters.expiry" class="filter-select">
                      <option value="">Any expiry</option>
                      <option value="expiring">Expiring soon</option>
                      <option value="expired">Expired</option>
                    </select>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                  </div>
                </div>
                <div>
                  <label class="filter-label">Status</label>
                  <div class="filter-wrap">
                    <select v-model="itemFilters.status" class="filter-select">
                      <option value="active">Active only</option>
                      <option value="all">Active &amp; inactive</option>
                    </select>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                  </div>
                </div>
                <div>
                  <label class="filter-label">Price approval</label>
                  <div class="filter-wrap">
                    <select v-model="itemFilters.pending_price" class="filter-select">
                      <option value="">Any price state</option>
                      <option value="true">Awaiting approval</option>
                      <option value="false">No price pending</option>
                    </select>
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" />
                  </div>
                </div>
                <div>
                  <label class="filter-label">Damage approval</label>
                  <div class="filter-wrap">
                    <select v-model="itemFilters.pending_damages" class="filter-select">
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
                    <select v-model="itemFilters.pending_disposals" class="filter-select">
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
                <span class="flex items-center gap-1.5"><span
                    class="w-5 h-5 bg-ribbon-teal/15 text-ribbon-teal rounded flex items-center justify-center text-[10px] font-extrabold">B</span>
                  Billable</span>
                <span class="flex items-center gap-1.5"><span
                    class="w-5 h-5 bg-ribbon-blue/12 text-ribbon-blue rounded flex items-center justify-center text-[10px] font-extrabold">Rx</span>
                  Prescription required</span>
                <span class="flex items-center gap-1.5"><span
                    class="w-5 h-5 bg-error/10 text-error rounded flex items-center justify-center text-[10px] font-extrabold">C</span>
                  Controlled substance</span>
                <span class="flex items-center gap-1.5"><font-awesome-icon :icon="['fas', 'tag']"
                    class="text-ribbon-amber" /> Pending price approval</span>
                <span class="flex items-center gap-1.5"><font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                    class="text-ribbon-amber" /> Pending damage approval</span>
                <span class="flex items-center gap-1.5"><font-awesome-icon :icon="['fas', 'trash-can']"
                    class="text-ribbon-red" /> Pending disposal approval</span>
              </div>
            </div>

            <div class="overflow-x-auto rounded-t-2xl">
              <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-blue">
                <thead class="bg-primary/5">
                  <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                    <th class="py-4 px-5">Name</th>
                    <th class="py-4 px-5">Code</th>
                    <th class="py-4 px-5">Type</th>
                    <th class="py-4 px-5">UoM</th>
                    <th class="py-4 px-5 text-right">Pack size</th>
                    <th class="py-4 px-5 text-center">Flags</th>
                    <th class="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  <tr v-if="loadingItems">
                    <td colspan="7" class="py-8 text-center text-on-surface-variant">Loading…</td>
                  </tr>
                  <tr v-for="it in pagedItems" :key="it.uuid" class="hover:bg-surface-low transition-all cursor-pointer"
                    @click="navigateTo(`/inventory/${it.uuid}`)">
                    <td class="py-5 px-5">
                      <p class="font-bold text-on-surface break-words">{{ it.name }}</p>
                      <p v-if="!it.active" class="text-[10px] text-outline">inactive</p>
                    </td>
                    <td class="py-5 px-5 font-mono text-[11px] text-primary">{{ it.code }}</td>
                    <td class="py-5 px-5"><span class="px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap"
                        :class="typeChip(it)">{{
                          it.type?.name }}</span></td>
                    <td class="py-5 px-5 text-on-surface-variant">{{ it.unit_of_measure }}</td>
                    <td class="py-5 px-5 text-right font-medium">{{ it.pack_size }}</td>
                    <td class="py-5 px-5">
                      <div class="flex justify-center items-center gap-1.5">
                        <span v-if="it.is_billable"
                          class="w-6 h-6 bg-ribbon-teal/15 text-ribbon-teal rounded-md flex items-center justify-center text-[10px] font-extrabold"
                          title="Billable">B</span>
                        <span v-if="it.requires_prescription"
                          class="w-6 h-6 bg-primary/10 text-primary rounded-md flex items-center justify-center text-[10px] font-extrabold"
                          title="Prescription required">Rx</span>
                        <span v-if="it.is_controlled_substance"
                          class="w-6 h-6 bg-error/10 text-error rounded-md flex items-center justify-center text-[10px] font-extrabold"
                          title="Controlled">C</span>
                        <font-awesome-icon v-if="it.has_pending_price_approval" :icon="['fas', 'tag']"
                          class="text-ribbon-amber text-xs" title="Pending price approval" />
                        <font-awesome-icon v-if="it.has_pending_damages_approval"
                          :icon="['fas', 'triangle-exclamation']" class="text-ribbon-amber text-xs"
                          title="Pending damage approval" />
                        <font-awesome-icon v-if="it.has_pending_disposal_approval" :icon="['fas', 'trash-can']"
                          class="text-ribbon-red text-xs" title="Pending disposal approval" />
                      </div>
                    </td>
                    <!-- row actions -->
                    <td class="py-5 px-5 text-right" @click.stop>
                      <button class="row-act-btn" title="Actions" @click.stop="openRowMenu($event, it)">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!loadingItems && !filteredItems.length">
                    <td colspan="7" class="py-8 text-center text-on-surface-variant">No items match the current filters.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- pager: 8 per page -->
            <div v-if="itemPages > 1" class="flex items-center justify-between gap-3 mt-4">
              <p class="text-xs sm:text-sm text-on-surface-variant">
                Showing {{ (itemPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(itemPage * PAGE_SIZE, filteredItems.length) }}
                of {{ filteredItems.length }}
              </p>
              <div class="flex items-center gap-2">
                <button class="pager-btn" :disabled="itemPage === 1" @click="itemPage--"><font-awesome-icon
                    :icon="['fas', 'chevron-left']" /></button>
                <span class="text-sm font-semibold text-on-surface">{{ itemPage }} / {{ itemPages }}</span>
                <button class="pager-btn" :disabled="itemPage === itemPages" @click="itemPage++"><font-awesome-icon
                    :icon="['fas', 'chevron-right']" /></button>
              </div>
            </div>
          </div>
        </template>


        <!-- ═══════════ All Inventory Stock Tab ═══════════ -->
        <template v-else-if="activeTab === 'stock'">
          <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All
                  Inventory
                  Stock</h3>
                <p class="text-xs sm:text-sm text-outline break-words">Central + department stock position for every
                  item</p>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <button type="button" class="adv-btn" :class="{ 'adv-btn-on': stockTab.filtersOpen }"
                  @click="stockTab.filtersOpen = !stockTab.filtersOpen">
                  <font-awesome-icon :icon="['fas', 'sliders']" />
                  <span>Advanced Filters</span>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                    :class="{ 'rotate-180': stockTab.filtersOpen }" />
                </button>
                <button v-if="stockTab.anyFilter()" type="button" class="clear-chip" @click="stockTab.clear()">
                  <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
                </button>
                <div class="relative w-full sm:w-72">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                  <input v-model="stockTab.filters.q" type="text" autocomplete="off" placeholder="Search…"
                    class="cust-input has-icon" @keyup.enter="stockTab.load()" />
                </div>
              </div>
            </div>

            <InventoryHistoryFilterBar :key="activeTab" v-model="stockTab.filters" :open="stockTab.filtersOpen"
              :show-inventory="false" :inventory-items="items" :departments="departmentsList"
              @apply="stockTab.load()" />

            <div class="overflow-x-auto rounded-t-2xl">
              <table class="his-table tbl-teal">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th class="text-right">Central available</th>
                    <th class="text-right">Allocated</th>
                    <th class="text-right">On hand</th>
                    <th class="text-right">Used</th>
                    <th class="text-right">Damaged</th>
                    <th class="text-right">Disposed</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="stockTab.loading">
                    <td colspan="10" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                  </tr>
                  <tr v-for="s in stockTab.data" :key="s.id">
                    <td><span
                        class="font-mono text-xs sm:text-sm text-primary bg-primary/10 px-2 py-1 rounded-lg whitespace-nowrap">{{
                          s.code }}</span></td>
                    <td class="font-semibold sm:font-bold break-words">{{ s.name }}</td>
                    <td class="text-on-surface-variant break-words">
                      <span class="ribbon-dot-teal inline-block mr-1.5"></span>{{ s.type }}
                    </td>
                    <td class="text-right">{{ fmtQty(s.central_available) }}</td>
                    <td class="text-right">{{ fmtQty(s.allocated) }}</td>
                    <td class="text-right font-medium">{{ fmtQty(s.on_hand) }}</td>
                    <td class="text-right">{{ fmtQty(s.used) }}</td>
                    <td class="text-right" :class="Number(s.damaged) > 0 ? 'text-ribbon-amber font-bold' : ''">{{
                      fmtQty(s.damaged) }}</td>
                    <td class="text-right" :class="Number(s.disposed) > 0 ? 'text-error font-bold' : ''">{{
                      fmtQty(s.disposed) }}</td>
                    <td class="text-center" @click.stop>
                      <button class="row-act-btn" title="Actions"
                        @click.stop="openHistMenu($event, `stock-${s.id}`, codeToUuid(s.code))">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!stockTab.loading && !stockTab.data.length">
                    <td colspan="10" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No stock records
                      match the current filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="stockTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ stockTab.meta.page }} of {{
                stockTab.meta.total_pages }} — {{ stockTab.meta.total }} total</p>
              <div class="flex items-center gap-2">
                <button class="pager-btn" :disabled="stockTab.meta.page === 1"
                  @click="stockTab.goPage(stockTab.meta.page - 1)"><font-awesome-icon
                    :icon="['fas', 'chevron-left']" /></button>
                <button class="pager-btn" :disabled="stockTab.meta.page === stockTab.meta.total_pages"
                  @click="stockTab.goPage(stockTab.meta.page + 1)"><font-awesome-icon
                    :icon="['fas', 'chevron-right']" /></button>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════ All Inventory Stock Usage Tab ═══════════ -->
        <template v-else-if="activeTab === 'usage'">
          <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All
                  Inventory
                  Stock Usage</h3>
                <p class="text-xs sm:text-sm text-outline break-words">Every stock consumption record across departments
                </p>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <button type="button" class="adv-btn" :class="{ 'adv-btn-on': usageTab.filtersOpen }"
                  @click="usageTab.filtersOpen = !usageTab.filtersOpen">
                  <font-awesome-icon :icon="['fas', 'sliders']" />
                  <span>Advanced Filters</span>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                    :class="{ 'rotate-180': usageTab.filtersOpen }" />
                </button>
                <button v-if="usageTab.anyFilter()" type="button" class="clear-chip" @click="usageTab.clear()">
                  <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
                </button>
                <div class="relative w-full sm:w-72">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                  <input v-model="usageTab.filters.q" type="text" autocomplete="off" placeholder="Search…"
                    class="cust-input has-icon" @keyup.enter="usageTab.load()" />
                </div>
              </div>
            </div>

            <InventoryHistoryFilterBar :key="activeTab" v-model="usageTab.filters" :open="usageTab.filtersOpen"
              :show-inventory="true" :inventory-items="items" :departments="departmentsList" @apply="usageTab.load()" />

            <div class="overflow-x-auto rounded-t-2xl">
              <table class="his-table tbl-blue">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Department</th>
                    <th>Batch</th>
                    <th class="text-right">Qty used</th>
                    <th>Type</th>
                    <th>Consumer</th>
                    <th class="text-right">Amount</th>
                    <th>Used on</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="usageTab.loading">
                    <td colspan="9" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                  </tr>
                  <tr v-for="u in usageTab.data" :key="`${u.inventory_uuid}-${u.used_on}`">
                    <td class="min-w-0">
                      <p class="font-semibold sm:font-bold break-words">{{ u.inventory }}</p>
                      <p class="text-xs sm:text-sm text-outline truncate">{{ u.code }}</p>
                    </td>
                    <td class="text-on-surface-variant break-words">
                      <span class="ribbon-dot-purple inline-block mr-1.5"></span>{{ u.department }}
                    </td>
                    <td><span
                        class="font-mono text-xs sm:text-sm bg-surface-variant px-2 py-1 rounded-lg whitespace-nowrap">{{
                          u.batch_no }}</span></td>
                    <td class="text-right font-medium">{{ fmtQty(u.quantity_used) }} {{ u.unit_of_measure }}</td>
                    <td><span
                        class="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap">{{
                          titleCase(u.usage_type) }}</span></td>
                    <td class="text-on-surface-variant break-words">{{ titleCase(u.consumer_type) }}<span
                        v-if="u.consumer_id"> #{{ u.consumer_id }}</span></td>
                    <td class="text-right font-medium truncate">{{ u.is_billable ? fmtMoney(u.total_amount) : '—' }}
                    </td>
                    <td class="text-on-surface-variant whitespace-nowrap">{{ fmtDateTime(u.used_on) }}</td>
                    <td class="text-center" @click.stop>
                      <button class="row-act-btn" title="Actions"
                        @click.stop="openHistMenu($event, `usage-${u.inventory_uuid}-${u.used_on}`, u.inventory_uuid)">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!usageTab.loading && !usageTab.data.length">
                    <td colspan="9" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No usage records
                      match the current filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="usageTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ usageTab.meta.page }} of {{
                usageTab.meta.total_pages }} — {{ usageTab.meta.total }} total</p>
              <div class="flex items-center gap-2">
                <button class="pager-btn" :disabled="usageTab.meta.page === 1"
                  @click="usageTab.goPage(usageTab.meta.page - 1)"><font-awesome-icon
                    :icon="['fas', 'chevron-left']" /></button>
                <button class="pager-btn" :disabled="usageTab.meta.page === usageTab.meta.total_pages"
                  @click="usageTab.goPage(usageTab.meta.page + 1)"><font-awesome-icon
                    :icon="['fas', 'chevron-right']" /></button>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════ All Inventory Stock Damages Tab ═══════════ -->
        <template v-else-if="activeTab === 'damages'">
          <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All
                  Inventory
                  Stock Damages</h3>
                <p class="text-xs sm:text-sm text-outline break-words">Every reported stock damage record</p>
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
                <div class="relative w-full sm:w-72">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                  <input v-model="damagesTab.filters.q" type="text" autocomplete="off" placeholder="Search…"
                    class="cust-input has-icon" @keyup.enter="damagesTab.load()" />
                </div>
              </div>
            </div>

            <InventoryHistoryFilterBar :key="activeTab" v-model="damagesTab.filters" :open="damagesTab.filtersOpen"
              :show-inventory="true" :inventory-items="items" :departments="departmentsList" @apply="damagesTab.load()" />

            <div class="overflow-x-auto rounded-t-2xl">
              <table class="his-table tbl-amber">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Department</th>
                    <th>Batch</th>
                    <th class="text-right">Qty damaged</th>
                    <th>Reason</th>
                    <th class="text-center">Status</th>
                    <th>Reported</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="damagesTab.loading">
                    <td colspan="8" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                  </tr>
                  <tr v-for="d in damagesTab.data" :key="`${d.inventory_uuid}-${d.reported_on}`">
                    <td class="min-w-0">
                      <p class="font-semibold sm:font-bold break-words">{{ d.inventory }}</p>
                      <p class="text-xs sm:text-sm text-outline truncate">{{ d.code }}</p>
                    </td>
                    <td class="text-on-surface-variant break-words">
                      <span class="ribbon-dot-amber inline-block mr-1.5"></span>{{ d.department }}
                    </td>
                    <td><span
                        class="font-mono text-xs sm:text-sm bg-surface-variant px-2 py-1 rounded-lg whitespace-nowrap">{{
                          d.batch_no }}</span></td>
                    <td class="text-right font-medium">{{ fmtQty(d.quantity_damaged) }}</td>
                    <td class="break-words">{{ titleCase(d.damage_reason) }}</td>
                    <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                        :class="d.is_approved ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                          d.is_approved ? 'Approved' : 'Pending' }}</span></td>
                    <td class="text-on-surface-variant whitespace-nowrap">{{ d.reported_on }}</td>
                    <td class="text-center" @click.stop>
                      <button class="row-act-btn" title="Actions"
                        @click.stop="openHistMenu($event, `dmg-${d.inventory_uuid}-${d.reported_on}`, d.inventory_uuid)">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!damagesTab.loading && !damagesTab.data.length">
                    <td colspan="8" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No damage
                      records
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

        <!-- ═══════════ All Inventory Stock Disposals Tab ═══════════ -->
        <template v-else-if="activeTab === 'disposals'">
          <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All
                  Inventory
                  Stock Disposals</h3>
                <p class="text-xs sm:text-sm text-outline break-words">Every stock disposal / write-off record</p>
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
                <div class="relative w-full sm:w-72">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                  <input v-model="disposalsTab.filters.q" type="text" autocomplete="off" placeholder="Search…"
                    class="cust-input has-icon" @keyup.enter="disposalsTab.load()" />
                </div>
              </div>
            </div>

            <InventoryHistoryFilterBar :key="activeTab" v-model="disposalsTab.filters" :open="disposalsTab.filtersOpen"
              :show-inventory="true" :inventory-items="items" :departments="departmentsList" @apply="disposalsTab.load()" />

            <div class="overflow-x-auto rounded-t-2xl">
              <table class="his-table tbl-purple">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Department</th>
                    <th>Batch</th>
                    <th class="text-right">Qty disposed</th>
                    <th>Reason</th>
                    <th>Method</th>
                    <th class="text-center">Status</th>
                    <th>Disposed</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="disposalsTab.loading">
                    <td colspan="9" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                  </tr>
                  <tr v-for="d in disposalsTab.data" :key="`${d.inventory_uuid}-${d.disposed_on}`">
                    <td class="min-w-0">
                      <p class="font-semibold sm:font-bold break-words">{{ d.inventory }}</p>
                      <p class="text-xs sm:text-sm text-outline truncate">{{ d.code }}</p>
                    </td>
                    <td class="text-on-surface-variant break-words">
                      <span class="ribbon-dot-red inline-block mr-1.5"></span>{{ d.department }}
                    </td>
                    <td><span
                        class="font-mono text-xs sm:text-sm bg-surface-variant px-2 py-1 rounded-lg whitespace-nowrap">{{
                          d.batch_no }}</span></td>
                    <td class="text-right font-medium">{{ fmtQty(d.quantity_disposed) }}</td>
                    <td class="break-words">{{ titleCase(d.disposal_reason) }}</td>
                    <td class="break-words">{{ titleCase(d.disposal_method) }}</td>
                    <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                        :class="d.is_approved ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                          d.is_approved ? 'Approved' : 'Pending' }}</span></td>
                    <td class="text-on-surface-variant whitespace-nowrap">{{ d.disposed_on }}</td>
                    <td class="text-center" @click.stop>
                      <button class="row-act-btn" title="Actions"
                        @click.stop="openHistMenu($event, `disp-${d.inventory_uuid}-${d.disposed_on}`, d.inventory_uuid)">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
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

        <!-- ═══════════ All Inventory Stock Expiration Tab ═══════════ -->
        <template v-else-if="activeTab === 'expiration'">
          <div class="g-card p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold sm:font-bold break-words">All
                  Inventory
                  Stock Expiration</h3>
                <p class="text-xs sm:text-sm text-outline break-words">Batches nearing or past their expiry date</p>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <button type="button" class="adv-btn" :class="{ 'adv-btn-on': expirationTab.filtersOpen }"
                  @click="expirationTab.filtersOpen = !expirationTab.filtersOpen">
                  <font-awesome-icon :icon="['fas', 'sliders']" />
                  <span>Advanced Filters</span>
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[10px] transition-transform"
                    :class="{ 'rotate-180': expirationTab.filtersOpen }" />
                </button>
                <button v-if="expirationTab.anyFilter()" type="button" class="clear-chip"
                  @click="expirationTab.clear()">
                  <font-awesome-icon :icon="['fas', 'xmark']" /><span>Clear filters</span>
                </button>
                <div class="relative w-full sm:w-72">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                  <input v-model="expirationTab.filters.q" type="text" autocomplete="off" placeholder="Search…"
                    class="cust-input has-icon" @keyup.enter="expirationTab.load()" />
                </div>
              </div>
            </div>

            <InventoryHistoryFilterBar :key="activeTab" v-model="expirationTab.filters"
              :open="expirationTab.filtersOpen" :show-inventory="true" :inventory-items="items" :departments="departmentsList"
              @apply="expirationTab.load()" />

            <div class="overflow-x-auto rounded-t-2xl">
              <table class="his-table tbl-red">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Batch</th>
                    <th class="text-right">Qty available</th>
                    <th>Expiry date</th>
                    <th class="text-right">Days to expiry</th>
                    <th class="text-center">Status</th>
                    <th class="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="expirationTab.loading">
                    <td colspan="7" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">Loading…</td>
                  </tr>
                  <tr v-for="e in expirationTab.data" :key="`${e.inventory_uuid}-${e.batch_no}`">
                    <td class="min-w-0">
                      <p class="font-semibold sm:font-bold break-words">{{ e.inventory }}</p>
                      <p class="text-xs sm:text-sm text-outline truncate">{{ e.code }}</p>
                    </td>
                    <td><span
                        class="font-mono text-xs sm:text-sm bg-surface-variant px-2 py-1 rounded-lg whitespace-nowrap">{{
                          e.batch_no }}</span></td>
                    <td class="text-right font-medium">{{ fmtQty(e.quantity_available) }}</td>
                    <td class="text-on-surface-variant whitespace-nowrap">{{ e.expiry_date || '—' }}</td>
                    <td class="text-right font-bold"
                      :class="e.expired ? 'text-error' : (e.days_to_expiry ?? 999) <= 30 ? 'text-ribbon-amber' : 'text-on-surface-variant'">
                      {{ e.expired ? `Expired ${Math.abs(e.days_to_expiry)}d ago` : `${e.days_to_expiry}d` }}
                    </td>
                    <td class="text-center"><span class="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold"
                        :class="e.expired ? 'bg-error/10 text-error' : 'bg-ribbon-teal/15 text-ribbon-teal'">{{
                          titleCase(e.status) }}</span></td>
                    <td class="text-center" @click.stop>
                      <button class="row-act-btn" title="Actions"
                        @click.stop="openHistMenu($event, `exp-${e.inventory_uuid}-${e.batch_no}`, e.inventory_uuid)">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!expirationTab.loading && !expirationTab.data.length">
                    <td colspan="7" class="py-8 text-center text-xs sm:text-sm text-on-surface-variant">No batches match
                      the
                      current filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="expirationTab.meta.total_pages > 1" class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-xs sm:text-sm text-on-surface-variant">Page {{ expirationTab.meta.page }} of {{
                expirationTab.meta.total_pages }} — {{ expirationTab.meta.total }} total</p>
              <div class="flex items-center gap-2">
                <button class="pager-btn" :disabled="expirationTab.meta.page === 1"
                  @click="expirationTab.goPage(expirationTab.meta.page - 1)"><font-awesome-icon
                    :icon="['fas', 'chevron-left']" /></button>
                <button class="pager-btn" :disabled="expirationTab.meta.page === expirationTab.meta.total_pages"
                  @click="expirationTab.goPage(expirationTab.meta.page + 1)"><font-awesome-icon
                    :icon="['fas', 'chevron-right']" /></button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ═══════════ NON-PRIVILEGED VIEW — Department Overview only ═══════════ -->
      <template v-else>
        <div class="g-card p-6 sm:p-8">
          <DeptOverviewBody />
        </div>
      </template>
    </div>

    <!-- ── Department Overview modal (privileged, opened from a department card) ── -->
    <Modal v-model="deptModal" :title="deptModalName || 'Department overview'"
      subtitle="Real-time utilisation monitoring" :show-logo="true" class="max-w-4xl">
      <DeptOverviewBody />
    </Modal>

    <!-- ── Create-item modal ──────────────────────────────────────────────── -->
    <Modal v-model="showCreate" title="New inventory item" subtitle="Central store item definition" :show-logo="true"
      class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="sm:col-span-2">
          <label class="input-label">Type *</label>
          <SearchSelect v-model="form.inventory_type_id" :options="types" option-value="id"
            :option-label="(t) => `${t.name} (${t.code})`" icon="tag" placeholder="Select type…"
            search-placeholder="Search types…" />
        </div>
        <div><label class="input-label">Code *</label><input v-model="form.code" class="input-field"
            placeholder="e.g. MED-PCM500" /></div>
        <div><label class="input-label">Name *</label><input v-model="form.name" class="input-field" /></div>
        <div><label class="input-label">Barcode</label><input v-model="form.barcode" class="input-field" /></div>
        <div><label class="input-label">Manufacturer</label><input v-model="form.manufacturer" class="input-field" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Description</label><input v-model="form.description"
            class="input-field" /></div>
        <div><label class="input-label">Unit of measure</label><input v-model="form.unit_of_measure" class="input-field"
            placeholder="EACH / VIAL / BOX…" /></div>
        <div><label class="input-label">Pack size</label><input v-model.number="form.pack_size" type="number" min="1"
            class="input-field" /></div>

        <template v-if="selectedType?.requires_clinical_attributes">
          <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3">
            <span class="text-xs sm:text-sm font-semibold text-on-surface-variant">Clinical attributes</span>
          </div>
          <div><label class="input-label">Generic name</label><input v-model="form.generic_name" class="input-field" />
          </div>
          <div><label class="input-label">Brand name</label><input v-model="form.brand_name" class="input-field" />
          </div>
          <div><label class="input-label">Strength</label><input v-model="form.strength" class="input-field"
              placeholder="e.g. 500mg" /></div>
          <div><label class="input-label">Dosage form</label><input v-model="form.dosage_form" class="input-field"
              placeholder="TABLET / INJECTION…" /></div>
          <div><label class="input-label">Dosage</label><input v-model="form.dosage" class="input-field" /></div>
          <div><label class="input-label">Route</label><input v-model="form.route" class="input-field"
              placeholder="ORAL / IV…" /></div>
          <div><label class="input-label">Frequency</label><input v-model="form.frequency" class="input-field" /></div>
          <div><label class="input-label">ATC code</label><input v-model="form.atc_code" class="input-field" /></div>
        </template>

        <div class="sm:col-span-2 border-t border-outline-variant/50 pt-3">
          <span class="text-xs sm:text-sm font-semibold text-on-surface-variant">Stock levels</span>
        </div>
        <div><label class="input-label">Reorder level</label><input v-model.number="form.reorder_level" type="number"
            class="input-field" /></div>
        <div><label class="input-label">Reorder quantity</label><input v-model.number="form.reorder_quantity"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Minimum stock</label><input v-model.number="form.minimum_stock_level"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Maximum stock</label><input v-model.number="form.maximum_stock_level"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Shelf life (days)</label><input v-model.number="form.shelf_life_days"
            type="number" class="input-field" /></div>

        <div class="sm:col-span-2 flex flex-wrap gap-4 pt-2">
          <label class="inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"><input
              v-model="form.is_billable" type="checkbox"
              class="rounded border-outline-variant text-primary focus:ring-primary/30" /> Billable</label>
          <label class="inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"><input
              v-model="form.requires_prescription" type="checkbox"
              class="rounded border-outline-variant text-primary focus:ring-primary/30" /> Requires prescription</label>
          <label class="inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"><input
              v-model="form.is_controlled_substance" type="checkbox"
              class="rounded border-outline-variant text-primary focus:ring-primary/30" /> Controlled substance</label>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCreate = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="submitCreate">
          <font-awesome-icon :icon="['fas', 'check']" /><span>{{ saving ? 'Saving…' : 'Create item' }}</span>
        </button>
      </template>
    </Modal>

    <!-- ── Teleported row actions menu (print barcode / QR) ────────────────── -->
    <Teleport to="body">
      <div v-if="rowMenu" class="row-menu" :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }" @click.stop>
        <NuxtLink :to="`/inventory/${rowMenu}`" class="row-menu-item">
          <font-awesome-icon :icon="['fas', 'eye']" class="text-ribbon-blue" /> View Inventory
        </NuxtLink>
        <button v-if="rowMenuBarcode" class="row-menu-item"
          @click="printItemCode(rowMenuBarcode, 'barcode'); closeRowMenu()">
          <font-awesome-icon :icon="['fas', 'barcode']" class="text-ribbon-purple" /> Print Barcode
        </button>
        <button v-if="rowMenuBarcode" class="row-menu-item"
          @click="printItemCode(rowMenuBarcode, 'qr'); closeRowMenu()">
          <font-awesome-icon :icon="['fas', 'qrcode']" class="text-ribbon-blue" /> Print QR code
        </button>
        <p v-if="!rowMenuBarcode" class="row-menu-empty">No barcode on file</p>
      </div>
    </Teleport>

    <!-- ── Teleported history-tables row actions menu (View Inventory) ──────── -->
    <Teleport to="body">
      <div v-if="histMenuKey" class="row-menu"
        :style="{ top: histMenuPos.top + 'px', left: histMenuPos.left + 'px' }" @click.stop>
        <NuxtLink :to="`/inventory/${histMenuUuid}`" class="row-menu-item">
          <font-awesome-icon :icon="['fas', 'eye']" class="text-ribbon-blue" /> View Inventory
        </NuxtLink>
      </div>
    </Teleport>

    <!-- ── Teleported header "Advanced options" menu ────────────────────────── -->
    <Teleport to="body">
      <div v-if="headerMenu" class="row-menu"
        :style="{ top: headerMenuPos.top + 'px', left: headerMenuPos.left + 'px' }" @click.stop>
        <button class="row-menu-item" @click="openCreate(); closeHeaderMenu()">
          <font-awesome-icon :icon="['fas', 'plus']" class="text-ribbon-blue" /> New Item
        </button>
        <button class="row-menu-item" :disabled="exportingTemplate" @click="exportTemplate(); closeHeaderMenu()">
          <font-awesome-icon :icon="['fas', exportingTemplate ? 'circle-notch' : 'file-arrow-down']"
            :class="{ 'fa-spin': exportingTemplate }" class="text-ribbon-teal" />
          {{ exportingTemplate ? 'Preparing…' : 'Export Template' }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, h } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

// NOTE: add route middleware (e.g. definePageMeta({ middleware: 'auth' })) once the
// auth middleware name is confirmed. apiService already redirects to /login on 401.
const route = useRoute()
const inv = useInventory()
const auth = useAuthStore()
const can = (p: string) => auth.can(p)

// only these roles see the whole dashboard + other departments
const PRIVILEGED_ROLES = ['system_administrator', 'inventory_officer', 'biomedical_engineer', 'bme_lead', 'asset_officer']
const isPrivileged = computed(() => PRIVILEGED_ROLES.includes(auth.currentRole))

// ── tabs ────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'items' | 'stock' | 'usage' | 'damages' | 'disposals' | 'expiration'
const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'gauge-high' },
  { key: 'items', label: 'Inventory Items', icon: 'boxes-stacked' },
  { key: 'stock', label: 'All Inventory Stock', icon: 'warehouse' },
  { key: 'usage', label: 'All Inventory Stock Usage', icon: 'droplet' },
  { key: 'damages', label: 'All Inventory Stock Damages', icon: 'house-crack' },
  { key: 'disposals', label: 'All Inventory Stock Disposals', icon: 'trash-can' },
  { key: 'expiration', label: 'All Inventory Stock Expiration', icon: 'hourglass-end' },
]
const activeTab = ref<TabKey>('overview')

// ── tab bar: lock width to the primary group, Show more/less scrolls the rest into view ──
const PRIMARY_TAB_COUNT = 5   // Overview / Inventory Items / All Inventory Stock / All Inventory Stock Usage
const primaryTabs = computed(() => tabs.slice(0, PRIMARY_TAB_COUNT))
const secondaryTabs = computed(() => tabs.slice(PRIMARY_TAB_COUNT))

const tabsExpanded = ref(false)
const tabScroller = ref<HTMLElement | null>(null)
const tabBarEl = ref<HTMLElement | null>(null)
const lockedWidth = ref<number | null>(null)
const remeasureTabBar = () => {
  if (tabsExpanded.value) return
  nextTick(() => { if (tabBarEl.value) lockedWidth.value = tabBarEl.value.offsetWidth })
}
const toggleMoreTabs = async () => {
  tabsExpanded.value = !tabsExpanded.value
  await nextTick()
  tabScroller.value?.scrollTo({ left: tabsExpanded.value ? tabScroller.value.scrollWidth : 0, behavior: 'smooth' })
}

// lazy-load each new tab's data the first time it's opened
watch(activeTab, (t) => {
  if (t === 'stock' && !stockTab.data.length) stockTab.load()
  if (t === 'usage' && !usageTab.data.length) usageTab.load()
  if (t === 'damages' && !damagesTab.data.length) damagesTab.load()
  if (t === 'disposals' && !disposalsTab.data.length) disposalsTab.load()
  if (t === 'expiration' && !expirationTab.data.length) expirationTab.load()
})

const fmtDateTime = (s: any) => { if (!s) return '—'; const d = new Date(s); return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString() }

// ── generic paginated/filterable history-tab state (All Stock/Usage/Damages/Disposals/Expiration) ──
function useInvHistoryTab(loadFn: (params: Record<string, any>) => Promise<any>) {
  const buildParams = () => {
    const p: Record<string, any> = { page: state.filters.page }
    if (state.filters.from) p.from = state.filters.from
    if (state.filters.to) p.to = state.filters.to
    if (state.filters.inventory_id) p.inventory_id = state.filters.inventory_id
    if (state.filters.department_id) p.department_id = state.filters.department_id
    if (state.filters.q) p.q = state.filters.q
    return p
  }
  const state = reactive({
    data: [] as any[],
    meta: { page: 1, per_page: 100, total: 0, total_pages: 1 } as { page: number; per_page: number; total: number; total_pages: number },
    loading: false,
    filtersOpen: false,
    filters: {
      from: '', to: '', inventory_id: '', inventory_name: '', department_id: '', department_name: '', q: '', page: 1,
    } as Record<string, any>,
    anyFilter: () => !!(state.filters.from || state.filters.to || state.filters.inventory_id || state.filters.department_id),
    load: async () => {
      state.loading = true
      try { const r = await loadFn(buildParams()); state.data = r?.data ?? []; state.meta = r?.meta ?? state.meta }
      catch { state.data = [] }
      finally { state.loading = false }
    },
    clear: () => {
      Object.assign(state.filters, { from: '', to: '', inventory_id: '', inventory_name: '', department_id: '', department_name: '', page: 1 })
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

const stockTab = useInvHistoryTab((p) => inv.getAllStock(p))
const usageTab = useInvHistoryTab((p) => inv.getUsage(p))
const damagesTab = useInvHistoryTab((p) => inv.getDamaged(p))
const disposalsTab = useInvHistoryTab((p) => inv.getDisposed(p))
const expirationTab = useInvHistoryTab((p) => inv.getExpiredItems(p))

// ── feedback banner ─────────────────────────────────────────────────────────
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── data ──────────────────────────────────────────────────────────────────
const dashboard = ref<any>(null)
const types = ref<any[]>([])
const items = ref<any[]>([])
const loadingDash = ref(false)
const loadingItems = ref(false)
const { showSkeleton } = useDelayedLoading(loadingDash)

// ── item filters — ONLY affect loadItems (not dashboard / dept dashboard) ────
// pending_* dropdowns: '' = any, 'true' = has pending, 'false' = no pending
const itemFilters = reactive({
  q: '', type: '', billable: '', status: 'active',
  pending_price: '', pending_damages: '', pending_disposals: '',
  prescribable: '', expiry: '',   // prescribable: ''|'true'|'false' · expiry: ''|'expiring'|'expired'
})
const anyItemFilter = computed(() =>
  !!(itemFilters.type || itemFilters.billable || itemFilters.status !== 'active' ||
    itemFilters.pending_price || itemFilters.pending_damages || itemFilters.pending_disposals ||
    itemFilters.prescribable || itemFilters.expiry || itemFilters.q))
const serverParams = computed(() => {
  const f: Record<string, any> = {}
  if (itemFilters.q) f.q = itemFilters.q
  if (itemFilters.status === 'all') f.include_inactive = true
  return f
})

// ribbon cycles for the usage-insights panels (literal classes so Tailwind emits them)
const RANK_BADGE = ['bg-ribbon-blue text-white', 'bg-ribbon-teal text-white', 'bg-ribbon-amber text-white', 'bg-ribbon-purple text-white', 'bg-ribbon-red text-white']
const BAR_COLORS = ['bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red']
const DEPT_CHIP = ['bg-ribbon-blue/12 text-ribbon-blue', 'bg-ribbon-teal/12 text-ribbon-teal', 'bg-ribbon-amber/15 text-ribbon-amber', 'bg-ribbon-purple/12 text-ribbon-purple', 'bg-ribbon-red/12 text-ribbon-red']

// relative bar width for top-consumed items
const topConsumedMax = computed(() => Math.max(1, ...topConsumed.value.map((t: any) => Number(t.quantity_used) || 0)))
const usagePct = (q: any) => Math.round(((Number(q) || 0) / topConsumedMax.value) * 100)

// client-side filtering so each dropdown shows ONLY the matching items
const filteredItems = computed(() => items.value.filter((it: any) => {
  if (itemFilters.status === 'active' && !it.active) return false
  if (itemFilters.type && it.type?.code !== itemFilters.type) return false
  if (itemFilters.billable !== '' && it.is_billable !== (itemFilters.billable === 'true')) return false
  if (itemFilters.prescribable !== '' && !!it.requires_prescription !== (itemFilters.prescribable === 'true')) return false
  if (itemFilters.expiry === 'expiring' && !expirySets.value.soon.has(itemKey(it))) return false
  if (itemFilters.expiry === 'expired' && !expirySets.value.expired.has(itemKey(it))) return false
  if (itemFilters.pending_price !== '' && !!it.has_pending_price_approval !== (itemFilters.pending_price === 'true')) return false
  if (itemFilters.pending_damages !== '' && !!it.has_pending_damages_approval !== (itemFilters.pending_damages === 'true')) return false
  if (itemFilters.pending_disposals !== '' && !!it.has_pending_disposal_approval !== (itemFilters.pending_disposals === 'true')) return false
  return true
}))
const clearItemFilters = () => Object.assign(itemFilters, {
  type: '', billable: '', status: 'active', pending_price: '', pending_damages: '', pending_disposals: '',
  prescribable: '', expiry: '',
})

// Advanced-options panel: open to reveal filters; auto-collapse once an advanced filter is applied.
const showFilters = ref(false)
const anyAdvancedItemFilter = computed(() =>
  !!(itemFilters.type || itemFilters.billable || itemFilters.status !== 'active' ||
    itemFilters.pending_price || itemFilters.pending_damages || itemFilters.pending_disposals ||
    itemFilters.prescribable || itemFilters.expiry))
const activeItemFilterCount = computed(() => {
  let n = 0
  if (itemFilters.q) n++
  if (itemFilters.type) n++
  if (itemFilters.billable) n++
  if (itemFilters.status !== 'active') n++
  if (itemFilters.prescribable) n++
  if (itemFilters.expiry) n++
  if (itemFilters.pending_price) n++
  if (itemFilters.pending_damages) n++
  if (itemFilters.pending_disposals) n++
  return n
})
watch(anyAdvancedItemFilter, (on) => { if (on) showFilters.value = false })   // collapse when filters are entered

// ── row actions menu (print barcode / QR) ──────────────────────────────────────
const rowMenu = ref('')
const rowMenuBarcode = ref('')
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
    const res = await inv.downloadImportTemplate()
    const a = document.createElement('a')
    a.href = res.url
    a.download = res.filename || 'inventory_import_template.xlsx'
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
const openRowMenu = (e: MouseEvent, it: any) => {
  if (rowMenu.value === it.uuid) { rowMenu.value = ''; return }
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  menuPos.top = r.bottom + 6
  menuPos.left = Math.max(8, r.right - 176)   // 176 ≈ menu width
  rowMenuBarcode.value = it.barcode || ''
  rowMenu.value = it.uuid
}

const closeRowMenu = () => { rowMenu.value = '' }

// ── code → uuid resolver (stock rows carry only id/code, not inventory_uuid) ──
const codeToUuid = (code: string) =>
  items.value.find((it: any) => it.code === code)?.uuid ?? ''

// ── history-tables row-actions menu (View Inventory) ─────────────────────────
// keyed by row identity (uuid can repeat across rows) + the uuid to navigate to
const histMenuKey = ref('')
const histMenuUuid = ref('')
const histMenuPos = reactive({ top: 0, left: 0 })
const openHistMenu = (e: MouseEvent, key: string, uuid: string) => {
  if (!uuid) return                                   // no uuid → no menu (e.g. unmatched code)
  if (histMenuKey.value === key) { histMenuKey.value = ''; return }
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  histMenuPos.top = r.bottom + 6
  histMenuPos.left = Math.max(8, r.right - 176)       // 176 ≈ menu width
  histMenuKey.value = key
  histMenuUuid.value = uuid
}
const closeHistMenu = () => { histMenuKey.value = '' }

onMounted(() => {
  document.addEventListener('click', closeRowMenu)
  document.addEventListener('click', closeHeaderMenu)
  document.addEventListener('click', closeHistMenu)
  window.addEventListener('scroll', closeRowMenu, true)
  window.addEventListener('scroll', closeHistMenu, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeRowMenu)
  document.removeEventListener('click', closeHeaderMenu)
  document.removeEventListener('click', closeHistMenu)
  window.removeEventListener('scroll', closeRowMenu, true)
  window.removeEventListener('scroll', closeHistMenu, true)
})

// Print a Code-128 barcode (or QR) of the item barcode value.
// Same hidden-iframe + window.print() approach as the inspection document, with the
// code-generation library pulled from a CDN inside the iframe (no npm dependency).
const printItemCode = (barcode: string, kind: 'barcode' | 'qr') => {
  if (!barcode) return
  const isQR = kind === 'qr'
  const safe = String(barcode)
  const lib = isQR
    ? 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    : 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js'
  const codeEl = isQR ? '<div id="code"></div>' : '<svg id="code"></svg>'
  const gen = isQR
    ? `new QRCode(document.getElementById('code'), { text: ${JSON.stringify(safe)}, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });`
    : `JsBarcode('#code', ${JSON.stringify(safe)}, { format: 'EAN13', height: 90, fontSize: 18, margin: 10, displayValue: true, flat: true });`

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safe}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Tahoma, Arial, sans-serif; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .label { text-align: center; border: 1.5px solid #d0d4dc; border-radius: 12px; padding: 22px 32px; }
  .brand { font-weight: 800; letter-spacing: 1px; color: #3d7fbf; font-size: 12px; margin-bottom: 12px; }
  #code { display: flex; justify-content: center; }
  #code img, #code canvas, #code svg { display: block; margin: 0 auto; }
  .tag { margin-top: 12px; font-weight: 800; font-size: 16px; letter-spacing: 1px; color: #111; }
  @media print { .label { border: none; } }
</style></head><body>
  <div class="label">
    <div class="brand">IBCC · INVENTORY ITEM</div>
    ${codeEl}
    <div class="tag">${safe}</div>
  </div>
  <script src="${lib}"><\/script>
  <script>
    (function () {
      function run () {
        try { ${gen} } catch (e) {
          // EAN13 needs 12–13 numeric digits; fall back to CODE128 for anything else
          try { JsBarcode('#code', ${JSON.stringify(safe)}, { format: 'CODE128', height: 90, fontSize: 18, margin: 10, displayValue: true }); } catch (e2) {}
        }
        setTimeout(function () { window.focus(); window.print(); }, 400);
      }
      if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
    })();
  <\/script>
</body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:420px;height:620px;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }
  doc.open(); doc.write(html); doc.close()
  const cleanup = () => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }
  iframe.contentWindow?.addEventListener('afterprint', () => setTimeout(cleanup, 300))
  setTimeout(cleanup, 60000)
}

const loadDashboard = async () => {
  loadingDash.value = true
  try { dashboard.value = await inv.getDashboard() }
  catch (e: any) { flash(e.message || 'Failed to load dashboard', 'error') }
  finally { loadingDash.value = false }
}
const loadTypes = async () => {
  try { const res = await inv.getTypes(); types.value = res?.data ?? [] }
  catch (e: any) { flash(e.message || 'Failed to load types', 'error') }
}
const loadItems = async () => {
  loadingItems.value = true
  try { const res = await inv.listItems(serverParams.value); items.value = res?.data ?? [] }
  catch (e: any) { flash(e.message || 'Failed to load items', 'error') }
  finally { loadingItems.value = false }
}

// debounce the search; refetch the list on any item-filter change (dashboard untouched)
let qTimer: ReturnType<typeof setTimeout> | null = null
watch(() => itemFilters.q, () => { if (qTimer) clearTimeout(qTimer); qTimer = setTimeout(loadItems, 350) })
watch(() => itemFilters.status, loadItems)

// ── derived view-model ────────────────────────────────────────────────────────
const summary = computed(() => dashboard.value?.summary ?? {})
const valuation = computed(() => dashboard.value?.stock_valuation ?? {})
const itemsByType = computed(() => dashboard.value?.items_by_type ?? [])
const deptStocked = computed(() => dashboard.value?.summary?.departments_stocked ?? [])
const lowStock = computed(() => dashboard.value?.low_stock ?? [])
const expiringSoon = computed(() => dashboard.value?.expiring_soon ?? [])
const expired = computed(() => dashboard.value?.expired ?? { batches: 0, quantity: '0.0' })
const approvals = computed(() => dashboard.value?.pending_approvals ?? {})
const receipts = computed(() => dashboard.value?.recent_receipts ?? [])

// ── usage insights (overview) ────────────────────────────────────────────────
const usage = computed(() => dashboard.value?.usage_insights ?? {})
const usageWindow = computed(() => usage.value.window_days ?? 30)
const topConsumed = computed<any[]>(() => usage.value.top_consumed_items ?? [])
const byConsumerType = computed<any[]>(() => usage.value.by_consumer_type ?? [])
const usageByDept = computed<any[]>(() => usage.value.by_department ?? [])

// ── expiry lookup sets — map dashboard expiry data → item codes/names ────────
// items list carries no expiry info, so cross-reference the dashboard buckets.
const itemKey = (x: any) => String(x?.code ?? x?.name ?? '').toLowerCase()
const expirySets = computed(() => {
  const soon = new Set<string>()
  const expired = new Set<string>()
  const collect = (set: Set<string>, e: any) => {
    [e?.code, e?.name, e?.item].forEach((v) => { if (v) set.add(String(v).toLowerCase()) })
  }
    ; (dashboard.value?.expiring_soon ?? []).forEach((e: any) => collect(soon, e))
    ; (dashboard.value?.expired?.items ?? []).forEach((e: any) => collect(expired, e))
  return { soon, expired }
})

const billablePct = computed(() => {
  const t = Number(summary.value.total_items), b = Number(summary.value.billable_items)
  return t > 0 ? Math.round((b / t) * 100) : 0
})
const pad = (n: any) => String(n ?? 0).padStart(2, '0')
// cycle the five ribbon colours for type pills (literal classes so Tailwind emits them)
const TYPE_CHIPS = [
  'bg-ribbon-blue/12 text-ribbon-blue',
  'bg-ribbon-teal/12 text-ribbon-teal',
  'bg-ribbon-amber/15 text-ribbon-amber',
  'bg-ribbon-purple/12 text-ribbon-purple',
  'bg-ribbon-red/12 text-ribbon-red',
]
const typeChip = (it: any) => TYPE_CHIPS[(Number(it?.type?.id) || 0) % TYPE_CHIPS.length]
// UPPER_SNAKE / snake_case → "Title Case"
const titleCase = (v: any) =>
  String(v ?? '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'
const relTime = (dateStr: any) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const days = Math.round((startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString()
}

// ── Items by type → ApexCharts horizontal bar ───────────────────────────────
const totalTypeCount = computed(() => itemsByType.value.reduce((s: number, t: any) => s + (Number(t.count) || 0), 0))
const typeChartHeight = computed(() => Math.max(240, itemsByType.value.length * 40))
const typeChartSeries = computed(() => [{
  name: 'Items',
  data: itemsByType.value.map((t: any) => ({ x: t.type, y: Number(t.count) || 0 })),
}])
const typeChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', animations: { easing: 'easeinout' } },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '62%', distributed: true } },
  colors: ['#3d7fbf', '#3dae8c', '#e8a33d', '#b05fa8', '#c0395a'],
  dataLabels: {
    enabled: true,
    formatter: (val: number) => {
      return `${val}`
    },
    style: { fontSize: '11px', fontWeight: 700, colors: ['#ffffff'] },
  },
  grid: { borderColor: 'rgba(0,0,0,0.06)', yaxis: { lines: { show: false } } },
  xaxis: { labels: { style: { colors: '#727687', fontSize: '11px' } } },
  yaxis: { labels: { style: { colors: '#424656', fontSize: '12px', fontWeight: 600 } } },
  tooltip: { y: { formatter: (v: number) => `${v} items` } },
  legend: { show: false },
}))

// ── pagination (8 per page) ─────────────────────────────────────────────────
const PAGE_SIZE = 8
const itemPage = ref(1)
const itemPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))
const pagedItems = computed(() => filteredItems.value.slice((itemPage.value - 1) * PAGE_SIZE, itemPage.value * PAGE_SIZE))
watch(filteredItems, () => { itemPage.value = 1 })
watch(itemPages, (n) => { if (itemPage.value > n) itemPage.value = n })

// ── pending-approval deep links → Inventory Items tab (has_pending_* === true) ─
const goToItemsFiltered = (kind: 'price' | 'damages' | 'disposals') => {
  clearItemFilters()
  if (kind === 'price') itemFilters.pending_price = 'true'
  else if (kind === 'damages') itemFilters.pending_damages = 'true'
  else itemFilters.pending_disposals = 'true'
  activeTab.value = 'items'
}

// ── expiry deep links → Inventory Items tab filtered by the clicked insight ───
const goToExpiry = (kind: 'expiring' | 'expired') => {
  clearItemFilters()
  itemFilters.expiry = kind
  activeTab.value = 'items'
}

// ── create-item modal ──────────────────────────────────────────────────────────
const showCreate = ref(false)
const saving = ref(false)
const blankForm = () => ({
  inventory_type_id: '', code: '', name: '', barcode: '', description: '',
  generic_name: '', brand_name: '', strength: '',
  dosage_form: '', dosage: '', route: '', frequency: '', atc_code: '',
  unit_of_measure: '', pack_size: '', manufacturer: '', shelf_life_days: '',
  reorder_level: '', reorder_quantity: '', minimum_stock_level: '', maximum_stock_level: '',
  is_billable: false, requires_prescription: false, is_controlled_substance: false,
})
const form = reactive<Record<string, any>>(blankForm())
const selectedType = computed(() => types.value.find((t: any) => String(t.id) === String(form.inventory_type_id)))
watch(() => form.inventory_type_id, () => {
  const t = selectedType.value
  if (!t) return
  form.is_billable = !!t.is_billable_default
  form.requires_prescription = !!t.requires_prescription
  form.is_controlled_substance = !!t.is_controlled_substance
})
const openCreate = () => { Object.assign(form, blankForm()); showCreate.value = true }
const submitCreate = async () => {
  if (!form.inventory_type_id || !form.code || !form.name) { flash('Type, code and name are required', 'error'); return }
  saving.value = true
  try {
    await inv.createItem({ ...form })
    flash('Inventory item created'); showCreate.value = false
    loadItems(); loadDashboard()
  } catch (e: any) { flash(e.message || 'Failed to create item', 'error') }
  finally { saving.value = false }
}

// ── department overview (modal for privileged, inline for others) ───────────
const deptDash = ref<any>(null)
const loadingDept = ref(false)
const deptModal = ref(false)
const deptModalName = ref('')
const departmentsList = ref<any[]>([])
const deptItems = computed(() => deptDash.value?.items ?? [])
const deptPage = ref(1)
const deptPages = computed(() => Math.max(1, Math.ceil(deptItems.value.length / PAGE_SIZE)))
const pagedDeptItems = computed(() => deptItems.value.slice((deptPage.value - 1) * PAGE_SIZE, deptPage.value * PAGE_SIZE))
watch(deptItems, () => { deptPage.value = 1 })

const loadDepartments = async () => {
  try { departmentsList.value = (await inv.getDepartments()) ?? [] } catch { /* ignore */ }
}
const loadDeptDashboard = async (departmentUuid = '') => {
  loadingDept.value = true
  try { deptDash.value = await inv.getDepartmentDashboard(departmentUuid ? { department_uuid: departmentUuid } : {}) }
  catch (e: any) { flash(e.message || 'Failed to load department overview', 'error') }
  finally { loadingDept.value = false }
}
const resolveDeptUuid = (d: any): string => {
  if (d?.department_uuid) return d.department_uuid
  if (d?.uuid) return d.uuid
  const match = departmentsList.value.find((x: any) => x.name === d?.type || x.code === d?.code)
  return match?.uuid ?? ''
}
const openDeptModal = async (d: any) => {
  deptModalName.value = d?.type || 'Department overview'
  await loadDeptDashboard(resolveDeptUuid(d))
  deptModal.value = true
}

// ── shared Department Overview body (used inline + in the modal) ────────────
const DeptOverviewBody = () => {
  if (loadingDept.value && !deptDash.value) return h('p', { class: 'text-sm text-on-surface-variant py-6 text-center' }, 'Loading…')
  if (!deptDash.value) return h('p', { class: 'text-sm text-on-surface-variant' }, 'No department data loaded.')
  const s = deptDash.value.summary ?? {}
  const kpi = (label: string, value: string, accent = false) =>
    h('div', { class: `p-4 rounded-2xl border ${accent ? 'bg-primary/10 border-primary/20' : 'bg-white/60 border-white/60'}` }, [
      h('p', { class: `text-[10px] uppercase font-bold tracking-wider mb-1 ${accent ? 'text-primary' : 'text-outline'}` }, label),
      h('p', { class: `text-lg sm:text-xl font-extrabold ${accent ? 'text-primary' : 'text-on-surface'} break-words` }, value),
    ])
  const th = (t: string, extra = '') => h('th', { class: `py-3 px-4 ${extra}` }, t)
  const td = (t: any, extra = '') => h('td', { class: `py-3 px-4 ${extra}` }, String(t))
  const rows = pagedDeptItems.value.length
    ? pagedDeptItems.value.map((d: any) => h('tr', { key: d.inventory_id, class: 'hover:bg-surface-low transition-colors' }, [
      h('td', { class: 'py-3 px-4 font-bold text-xs break-words' }, d.name),
      td(fmtQty(d.allocated), 'text-right text-xs'),
      h('td', { class: 'py-3 px-4 text-right text-xs font-semibold' }, fmtQty(d.on_hand)),
      td(fmtQty(d.used), 'text-right text-xs'),
      h('td', { class: `py-3 px-4 text-right text-xs font-bold ${Number(d.utilisation_pct) >= 90 ? 'text-error' : ''}` }, `${fmtQty(d.utilisation_pct)}%`),
    ]))
    : [h('tr', [h('td', { colspan: 5, class: 'py-6 text-center text-on-surface-variant' }, 'No items allocated.')])]
  const pager = deptPages.value > 1
    ? h('div', { class: 'flex items-center justify-between gap-3 mt-4' }, [
      h('p', { class: 'text-xs sm:text-sm text-on-surface-variant' },
        `Showing ${(deptPage.value - 1) * PAGE_SIZE + 1}–${Math.min(deptPage.value * PAGE_SIZE, deptItems.value.length)} of ${deptItems.value.length}`),
      h('div', { class: 'flex items-center gap-2' }, [
        h('button', { class: 'pager-btn', disabled: deptPage.value === 1, onClick: () => deptPage.value-- }, '‹'),
        h('span', { class: 'text-sm font-semibold text-on-surface' }, `${deptPage.value} / ${deptPages.value}`),
        h('button', { class: 'pager-btn', disabled: deptPage.value === deptPages.value, onClick: () => deptPage.value++ }, '›'),
      ]),
    ])
    : null
  return h('div', [
    h('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6' }, [
      kpi('Distinct items', String(s.distinct_items ?? 0)),
      kpi('On hand', fmtQty(s.total_on_hand)),
      kpi('Used', fmtQty(s.total_used)),
      kpi('On-hand value', fmtMoney(s.on_hand_value), true),
    ]),
    h('div', { class: 'overflow-x-auto' }, [
      h('table', { class: 'w-full text-left border-collapse text-sm sm:text-base' }, [
        h('thead', { class: 'bg-primary/5' }, [h('tr', { class: 'text-[10px] text-on-surface-variant uppercase tracking-widest' }, [
          th('Item'), th('Allocation', 'text-right'), th('On hand', 'text-right'), th('Used', 'text-right'), th('Util %', 'text-right'),
        ])]),
        h('tbody', { class: 'divide-y divide-outline-variant/10' }, rows),
      ]),
    ]),
    pager,
  ])
}

// ── mount ───────────────────────────────────────────────────────────────────
onMounted(() => {
  if (route.query.tab === 'items') activeTab.value = 'items'
  if (isPrivileged.value) {
    loadDashboard(); loadTypes(); loadItems(); loadDepartments()
  } else {
    loadDeptDashboard()   // restricted users: only their own department overview
  }
})
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
  border: 3px solid transparent;
  border-radius: 2.5rem;
  /* 5-colour IBCC ribbon gradient frame */
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(214, 232, 250, 0.45)) padding-box,
    linear-gradient(135deg, #3d7fbf 0%, #3dae8c 25%, #e8a33d 50%, #b05fa8 75%, #c0395a 100%) border-box;
}

.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0px 10px 30px rgba(61, 127, 191, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
  animation: island-in 0.5s ease-out backwards;
}

/* tabs */
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

/* filter dropdowns — modern, intuitive selects */
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

/* thin scrollbars */
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

/* pagination */
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
  background: #ffffff;
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── Alive tables — ribbon-tinted headers + hover ─────────────────────── */
.alive-tbl tbody tr {
  transition: background 0.15s ease;
}

.alive-tbl tbody tr:nth-child(even) {
  background: rgba(25, 28, 30, 0.018);
}

.tbl-blue thead tr {
  background: linear-gradient(90deg, rgba(61, 127, 191, 0.14), rgba(61, 127, 191, 0.04));
}

.tbl-blue thead th {
  border-bottom: 2px solid rgba(61, 127, 191, 0.40);
}

.tbl-blue tbody tr:hover {
  background: rgba(61, 127, 191, 0.09);
}

.tbl-red thead tr {
  background: #ffffff;
}

.tbl-red thead th {
  /* opaque so the sticky header never shows rows through it */
  background: linear-gradient(180deg, rgba(192, 57, 90, 0.12), rgba(192, 57, 90, 0.05)), #ffffff;
  border-bottom: 2px solid rgba(192, 57, 90, 0.45);
}

.tbl-red tbody tr:hover {
  background: rgba(192, 57, 90, 0.08);
}

/* ribbon-teal table (ribbon.teal #3dae8c) */
.tbl-teal thead tr {
  background: linear-gradient(90deg, rgba(61, 174, 140, 0.14), rgba(61, 174, 140, 0.04));
}
.tbl-teal thead th {
  border-bottom: 2px solid rgba(61, 174, 140, 0.40);
}
.tbl-teal tbody tr:hover {
  background: rgba(61, 174, 140, 0.09);
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

/* ribbon-purple table (ribbon.purple #b05fa8) */
.tbl-purple thead tr {
  background: linear-gradient(90deg, rgba(176, 95, 168, 0.14), rgba(176, 95, 168, 0.04));
}
.tbl-purple thead th {
  border-bottom: 2px solid rgba(176, 95, 168, 0.40);
}
.tbl-purple tbody tr:hover {
  background: rgba(176, 95, 168, 0.08);
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

/* items tab — advanced options toggle + clear chip */
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

/* items tab — per-row actions menu */
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