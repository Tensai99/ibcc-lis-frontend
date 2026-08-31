<!-- app/pages/dashboard/laboratory-admin.vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- Header (glass, gradient icon tile) -->
      <header
        class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-xl" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words">Good {{ greeting }}, {{ displayName }}
            </h1>
            <p class="text-[11px] text-outline font-mono mt-0.5">
              {{ roleLabel }}{{ department ? ` · ${department}` : '' }} · Window {{ windowLabel }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span
            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-ribbon-blue/15 text-ribbon-blue">Laboratory
            admin</span>
          <button type="button" class="pager-btn" :disabled="loading" @click="load(true)">
            <font-awesome-icon :icon="['fas', 'rotate-right']" :class="loading ? 'animate-spin' : ''" />
          </button>
        </div>
      </header>

      <!-- ── Filters (inline, chip-driven) ─────────────────────────────────── -->
      <div class="g-card p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
              <font-awesome-icon :icon="['fas', 'sliders']" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Filters</h3>
              <p class="text-[11px] text-outline">Refine the window and scope of this dashboard</p>
            </div>
          </div>
          <button type="button" class="filter-toggle" @click="filtersOpen = !filtersOpen">
            <font-awesome-icon :icon="['fas', filtersOpen ? 'chevron-up' : 'chevron-down']" />
            <span>{{ filtersOpen ? 'Hide' : 'Show' }}</span>
          </button>
        </div>

        <div v-show="filtersOpen" class="flex flex-col gap-5">
          <!-- Quick range presets -->
          <div>
            <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Quick range</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="p in PRESETS" :key="p.key" type="button" class="preset-chip"
                :class="{ 'preset-chip-active': activePreset === p.key }" @click="applyPreset(p.key)">
                <font-awesome-icon :icon="['fas', p.icon]" class="text-[10px]" />
                <span>{{ p.label }}</span>
              </button>
            </div>
          </div>

          <!-- Custom range + sub-department -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label class="filter-label">From</label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'calendar-day']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="filters.from" type="date" class="cust-input has-icon"
                  @change="activePreset = 'custom'" />
              </div>
            </div>
            <div>
              <label class="filter-label">To</label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'calendar-check']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="filters.to" type="date" class="cust-input has-icon" @change="activePreset = 'custom'" />
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="filter-label">Sub-department</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SearchSelect v-model="deptUuid" :options="departments" option-value="uuid" option-label="name"
                  icon="building" placeholder="Department…" search-placeholder="Search departments…" clearable />
                <SearchSelect v-model="filters.sub_department_id" :options="subDepartments" :disabled="!deptUuid"
                  option-value="id" option-label="name" icon="sitemap"
                  :placeholder="deptUuid ? 'Sub-department…' : 'Pick a department first'"
                  search-placeholder="Search sub-departments…" clearable />
              </div>
              <p class="text-[11px] text-outline mt-1.5">
                <font-awesome-icon :icon="['fas', 'circle-info']" class="mr-1 opacity-70" />
                Leave sub-department blank to include the whole department.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" class="btn-reset" @click="resetFilters">
              <font-awesome-icon :icon="['fas', 'rotate-left']" />
              <span>Reset</span>
            </button>
            <button type="button" class="btn-apply" @click="load(true)">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
              <span>Apply filters</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Loading ───────────────────────────────────────────────────────── -->
      <div v-if="loading" class="g-card flex flex-col items-center justify-center gap-3 py-16">
        <font-awesome-icon :icon="['fas', 'circle-notch']" class="text-3xl text-primary animate-spin" />
        <p class="text-sm sm:text-base text-on-surface-variant">Loading laboratory dashboard…</p>
      </div>

      <!-- ── Error ─────────────────────────────────────────────────────────── -->
      <div v-else-if="error" class="g-card flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div class="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
          <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-2xl text-error" />
        </div>
        <p class="text-sm sm:text-base text-on-surface-variant max-w-md">{{ error }}</p>
        <button type="button" class="pager-btn !w-auto !h-auto !rounded-lg !px-3 !py-2 gap-2 text-sm font-semibold"
          @click="load()">
          <font-awesome-icon :icon="['fas', 'rotate-right']" />
          <span>Retry</span>
        </button>
      </div>

      <!-- ── Live data ─────────────────────────────────────────────────────── -->
      <template v-else-if="d">

        <!-- KPI tiles (ribbon accents — matches department.vue) -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          <div v-for="k in kpis" :key="k.label" class="g-card p-5 sm:p-6 border-l-4" :class="k.accent">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] font-bold uppercase tracking-wider" :class="k.tint">{{ k.label }}</p>
              <font-awesome-icon :icon="['fas', k.icon]" :class="k.tint" />
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface break-words">{{ k.value }}</p>
          </div>
        </div>

        <!-- ── Orders (prominent, search + paginated) ─────────────────────────── -->
        <div class="g-card p-5 sm:p-7 ring-1 ring-ribbon-blue/20 shadow-xl shadow-ribbon-blue/5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-11 h-11 rounded-2xl bg-primary-gradient flex items-center justify-center text-white shadow-md shadow-primary/25 shrink-0">
                <font-awesome-icon :icon="['fas', 'vials']" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-lg sm:text-xl font-bold text-on-surface">Laboratory orders</h3>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-ribbon-amber/15 text-ribbon-amber whitespace-nowrap">
                    <font-awesome-icon :icon="['fas', 'calendar-day']" class="text-[9px]" />
                    Today
                  </span>
                </div>
                <p class="text-[11px] text-outline">
                  <span v-if="ordersMeta">{{ fmt(ordersMeta.total) }} today · page {{ ordersMeta.page }} / {{
                    ordersMeta.total_pages }}</span>
                  <span v-else>{{ todayLabel }}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <div class="relative w-full md:w-72">
                <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/60 text-sm pointer-events-none z-10" />
                <input v-model="ordersQuery" type="search" placeholder="Search accession, patient…"
                  class="cust-input has-icon" />
              </div>
            </div>
          </div>

          <div v-if="ordersLoading && !orders.length" class="py-16 flex flex-col items-center gap-2">
            <font-awesome-icon :icon="['fas', 'circle-notch']" class="text-2xl text-primary animate-spin" />
            <p class="text-xs text-on-surface-variant">Loading orders…</p>
          </div>

          <div v-else-if="orders.length" class="overflow-x-auto -mx-2 sm:mx-0">
            <table class="w-full text-left border-collapse text-sm alive-tbl tbl-blue">
              <thead>
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                  <th class="py-3 px-4">Accession</th>
                  <th class="py-3 px-4">Patient</th>
                  <th class="py-3 px-4">Scheduled</th>
                  <th class="py-3 px-4">Department</th>
                  <th class="py-3 px-4">Specimen</th>
                  <th class="py-3 px-4 text-center">Urgency</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-right w-12">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="o in orders" :key="o.uuid" class="cursor-pointer">
                  <td class="py-3 px-4 font-mono text-[11px] text-ribbon-blue whitespace-nowrap border-l-4"
                    :class="rowAccent(o.status)">
                    {{ o.accession_number }}
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-bold break-words">{{ o.patient_name }}</p>
                    <p class="text-[10px] text-outline">{{ [o.age != null ? `${o.age}y` : null,
                    o.gender].filter(Boolean).join(' · ') || '—' }}</p>
                  </td>
                  <td class="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap">{{ fmtDate(o.scheduled_for) }}
                  </td>
                  <td class="py-3 px-4">
                    <p class="text-sm break-words">{{ o.department?.section || o.department?.name || '—' }}</p>
                    <p class="text-[10px] text-outline font-mono">{{ o.department?.section_code || o.department?.code ||
                      '' }}</p>
                  </td>
                  <td class="py-3 px-4 text-xs text-on-surface-variant break-words">{{ o.specimen || '—' }}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap"
                      :class="urgencyClass(o.urgency)">
                      {{ o.urgency || '—' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                      :class="statusPillClass(o.status)">
                      {{ titleCase(o.status) }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right" @click.stop>
                    <button type="button" class="ellipsis-btn" @click="toggleOrderMenu(o.uuid, $event)">
                      <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="py-14 flex flex-col items-center gap-2 text-center">
            <div class="w-12 h-12 rounded-full bg-ribbon-blue/10 flex items-center justify-center text-ribbon-blue">
              <font-awesome-icon :icon="['fas', 'inbox']" />
            </div>
            <!-- was: No orders match your search. -->
            <p class="text-sm text-on-surface-variant">
              {{ ordersQuery ? 'No orders today match your search.' : 'No orders scheduled for today.' }}
            </p>
          </div>

          <!-- Pagination -->
          <div v-if="ordersMeta && ordersMeta.total_pages > 1"
            class="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-outline-variant/20">
            <p class="text-xs text-on-surface-variant">
              Page <span class="font-bold text-on-surface">{{ ordersMeta.page }}</span> of {{ ordersMeta.total_pages }}
              · {{ fmt(ordersMeta.total) }} total
            </p>
            <div class="flex items-center gap-2">
              <button type="button" class="pager-btn" :disabled="ordersMeta.page <= 1"
                @click="goOrdersPage(ordersMeta.page - 1)">
                <font-awesome-icon :icon="['fas', 'chevron-left']" />
              </button>
              <span class="text-sm font-semibold text-on-surface px-2">{{ ordersMeta.page }} / {{ ordersMeta.total_pages
                }}</span>
              <button type="button" class="pager-btn" :disabled="ordersMeta.page >= ordersMeta.total_pages"
                @click="goOrdersPage(ordersMeta.page + 1)">
                <font-awesome-icon :icon="['fas', 'chevron-right']" />
              </button>
            </div>
          </div>
        </div>

        <!-- ── Insights (6 distinct panels, visually separated) ──────────────────── -->
        <section>
          <!-- Section header (not wrapped in a card — introduces the group only) -->
          <div class="flex items-center justify-between gap-3 mb-3 px-1">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
                <font-awesome-icon :icon="['fas', 'chart-pie']" />
              </div>
              <div>
                <h3 class="text-base font-bold">Insights at a glance</h3>
                <p class="text-[11px] text-outline">Six independent views · {{ windowLabel }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            <!-- 1 · Status -->
            <div class="insight-card border-ribbon-blue/40">
              <div class="insight-head bg-ribbon-blue/8">
                <div class="flex items-center gap-2">
                  <span class="insight-icon bg-ribbon-blue/15 text-ribbon-blue">
                    <font-awesome-icon :icon="['fas', 'chart-simple']" />
                  </span>
                  <div>
                    <p class="insight-title">Status breakdown</p>
                    <p class="insight-sub">How orders are distributed</p>
                  </div>
                </div>
                <span class="insight-badge bg-ribbon-blue/15 text-ribbon-blue">{{ fmt(statusTotal) }}</span>
              </div>
              <div class="insight-body">
                <template v-if="hasStatus">
                  <div class="flex h-2.5 rounded-full overflow-hidden bg-surface-low mb-3">
                    <div v-for="(s, i) in statusEntries" :key="s.label"
                      class="h-full first:rounded-l-full last:rounded-r-full" :class="RIBBON_BAR[i % RIBBON_BAR.length]"
                      :style="{ width: statusPct(s.value) + '%' }" :title="`${s.label}: ${s.value}`" />
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="(s, i) in statusEntries" :key="s.label"
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-outline-variant/25">
                      <span class="w-1.5 h-1.5 rounded-full" :class="RIBBON_BAR[i % RIBBON_BAR.length]" />
                      {{ s.label }} · {{ fmt(s.value) }}
                    </span>
                  </div>
                </template>
                <p v-else class="empty-line !py-3">No orders in this window.</p>
              </div>
            </div>

            <!-- 2 · Turnaround -->
            <div class="insight-card border-ribbon-teal/40">
              <div class="insight-head bg-ribbon-teal/8">
                <div class="flex items-center gap-2">
                  <span class="insight-icon bg-ribbon-teal/15 text-ribbon-teal">
                    <font-awesome-icon :icon="['fas', 'gauge-high']" />
                  </span>
                  <div>
                    <p class="insight-title">Turnaround</p>
                    <p class="insight-sub">On-time delivery vs breaches</p>
                  </div>
                </div>
                <span class="insight-badge"
                  :class="d.turnaround.breached > 0 ? 'bg-error/10 text-error' : 'bg-ribbon-teal/15 text-ribbon-teal'">
                  {{ fmt(d.turnaround.breached) }} breached
                </span>
              </div>
              <div class="insight-body">
                <div class="flex items-baseline gap-2 mb-3">
                  <p class="text-3xl font-extrabold text-on-surface">{{ pct(d.turnaround.on_time_rate) }}</p>
                  <p class="text-[11px] text-outline">on-time · avg {{ hoursFmt(d.summary.avg_station_tat_hours) }}</p>
                </div>
                <div v-if="hasEntries(d.turnaround.by_station_avg_hours)" class="flex items-end gap-1 h-10">
                  <div v-for="(v, k, i) in d.turnaround.by_station_avg_hours" :key="k"
                    class="flex-1 rounded-sm min-w-[3px]" :class="RIBBON_BAR[i % RIBBON_BAR.length]"
                    :style="{ height: `${Math.min(100, (Number(v) / stationTatMax) * 100)}%`, opacity: 0.85 }"
                    :title="`${titleCase(String(k))}: ${v}h`" />
                </div>
                <p v-else class="empty-line !py-3">No station turnaround yet.</p>
              </div>
            </div>

            <!-- 3 · Backlog -->
            <div class="insight-card border-ribbon-amber/40">
              <div class="insight-head bg-ribbon-amber/8">
                <div class="flex items-center gap-2">
                  <span class="insight-icon bg-ribbon-amber/15 text-ribbon-amber">
                    <font-awesome-icon :icon="['fas', 'hourglass-half']" />
                  </span>
                  <div>
                    <p class="insight-title">Backlog</p>
                    <p class="insight-sub">Open work still in the pipeline</p>
                  </div>
                </div>
              </div>
              <div class="insight-body">
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-on-surface-variant">In progress</span>
                    <span class="text-lg font-extrabold">{{ fmt(d.backlog.orders_in_progress) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-on-surface-variant">Awaiting reporting</span>
                    <span class="text-lg font-extrabold">{{ fmt(d.backlog.awaiting_reporting) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-on-surface-variant">Oldest open</span>
                    <span class="text-lg font-extrabold"
                      :class="(d.backlog.oldest_open_days ?? 0) > 7 ? 'text-error' : ''">
                      {{ d.backlog.oldest_open_days == null ? '—' : `${d.backlog.oldest_open_days}d` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4 · Discipline -->
            <div class="insight-card border-ribbon-teal/40">
              <div class="insight-head bg-ribbon-teal/8">
                <div class="flex items-center gap-2">
                  <span class="insight-icon bg-ribbon-teal/15 text-ribbon-teal">
                    <font-awesome-icon :icon="['fas', 'microscope']" />
                  </span>
                  <div>
                    <p class="insight-title">By discipline</p>
                    <p class="insight-sub">Volume across sub-departments</p>
                  </div>
                </div>
              </div>
              <div class="insight-body">
                <DistBars :data="d.by_discipline" empty="No discipline data." />
              </div>
            </div>

            <!-- 5 · Urgency -->
            <div class="insight-card border-ribbon-red/40">
              <div class="insight-head bg-ribbon-red/8">
                <div class="flex items-center gap-2">
                  <span class="insight-icon bg-ribbon-red/15 text-ribbon-red">
                    <font-awesome-icon :icon="['fas', 'gauge']" />
                  </span>
                  <div>
                    <p class="insight-title">By urgency</p>
                    <p class="insight-sub">Clinical priority mix</p>
                  </div>
                </div>
              </div>
              <div class="insight-body">
                <DistBars :data="d.by_urgency" empty="No urgency data." />
              </div>
            </div>

            <!-- 6 · Results -->
            <div class="insight-card border-ribbon-purple/40">
              <div class="insight-head bg-ribbon-purple/8">
                <div class="flex items-center gap-2">
                  <span class="insight-icon bg-ribbon-purple/15 text-ribbon-purple">
                    <font-awesome-icon :icon="['fas', 'file-lines']" />
                  </span>
                  <div>
                    <p class="insight-title">Results</p>
                    <p class="insight-sub">Reported & pending validation</p>
                  </div>
                </div>
              </div>
              <div class="insight-body">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-[10px] text-outline uppercase tracking-wider">Recorded</p>
                    <p class="text-lg font-extrabold">{{ fmt(d.results.recorded) }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-outline uppercase tracking-wider">Critical</p>
                    <p class="text-lg font-extrabold" :class="d.results.critical > 0 ? 'text-error' : ''">{{
                      fmt(d.results.critical)
                      }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-outline uppercase tracking-wider">Pending tech</p>
                    <p class="text-base font-bold">{{ fmt(d.results.pending_technical) }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] text-outline uppercase tracking-wider">Pending clin</p>
                    <p class="text-base font-bold">{{ fmt(d.results.pending_clinical) }}</p>
                  </div>
                </div>
                <div v-if="hasEntries(d.results.by_flag)"
                  class="flex flex-wrap gap-1 mt-3 pt-3 border-t border-outline-variant/15">
                  <span v-for="(v, key) in d.results.by_flag" :key="key"
                    class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-ribbon-amber/15 text-ribbon-amber">
                    {{ titleCase(String(key)) }} · {{ v }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Worklist -->
        <div class="g-card p-6 sm:p-8">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
                <font-awesome-icon :icon="['fas', 'list-check']" />
              </div>
              <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Worklist</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ribbon-blue/15 text-ribbon-blue">
                Open · {{ fmt(d.worklist.open_total) }}
              </span>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                :class="d.worklist.overdue > 0 ? 'bg-error/10 text-error' : 'bg-ribbon-teal/15 text-ribbon-teal'">
                Overdue · {{ fmt(d.worklist.overdue) }}
              </span>
            </div>
          </div>

          <div v-if="d.worklist.by_station.length" class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-blue">
              <thead>
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                  <th class="py-4 px-5">Station</th>
                  <th class="py-4 px-5 text-center">Open</th>
                  <th class="py-4 px-5 text-center">Overdue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="(st, i) in d.worklist.by_station" :key="i">
                  <td class="py-4 px-5 font-bold break-words">{{ st.station ?? st.name ?? '—' }}</td>
                  <td class="py-4 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ribbon-blue/15 text-ribbon-blue">
                      {{ fmt(st.open ?? st.open_total ?? 0) }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      :class="(st.overdue ?? 0) > 0 ? 'bg-error/10 text-error' : 'bg-ribbon-teal/15 text-ribbon-teal'">
                      {{ fmt(st.overdue ?? 0) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-line">No open worklist items in this window.</p>
        </div>

        <!-- Received trend -->
        <div class="g-card p-6 sm:p-8">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
              <font-awesome-icon :icon="['fas', 'chart-area']" />
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Orders received</h3>
          </div>
          <ClientOnly>
            <apexchart v-if="trendEntries.length" type="area" height="260" :options="trendArea.options"
              :series="trendArea.series" />
            <p v-else class="empty-line">No orders received in this window.</p>
            <template #fallback>
              <div class="h-[260px] flex items-center justify-center text-outline text-sm">Loading chart…</div>
            </template>
          </ClientOnly>
        </div>

        <!-- Teleported orders row action menu -->
        <Teleport to="body">
          <div v-if="orderMenuFor" class="fixed inset-0 z-40" @click="orderMenuFor = null" />
          <div v-if="orderMenuFor"
            class="fixed z-50 w-44 rounded-xl bg-white shadow-xl border border-outline-variant/40 py-1 overflow-hidden"
            :style="{ top: `${orderMenuPos.top}px`, left: `${orderMenuPos.left}px` }">
            <button type="button" class="menu-item" @click="openOrder(orderMenuFor!)">
              <font-awesome-icon :icon="['fas', 'eye']" class="text-ribbon-blue" />
              <span>View order</span>
            </button>
          </div>
        </Teleport>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

// ── payload interfaces ───────────────────────────────────────────────────────
interface LabWindow { from: string | null; to: string | null; sub_department_id: number | null }
interface LabSummary {
  orders_received: number; tests: number; tests_verified: number
  results_recorded: number; critical_results: number; avg_station_tat_hours: number | null
}
interface LabTurnaround {
  by_tat_status: Record<string, number>; breached: number
  on_time_rate: number | null; by_station_avg_hours: Record<string, number>
}
interface LabWorklist { open_total: number; overdue: number; by_station: any[] }
interface LabResults {
  recorded: number; by_flag: Record<string, number>; critical: number
  pending_technical: number; pending_clinical: number
}
interface LabBacklog { orders_in_progress: number; oldest_open_days: number | null; awaiting_reporting: number }
interface LabDashboard {
  window: LabWindow
  summary: LabSummary
  by_discipline: Record<string, number>
  by_status: Record<string, number>
  by_urgency: Record<string, number>
  turnaround: LabTurnaround
  worklist: LabWorklist
  results: LabResults
  backlog: LabBacklog
  received_trend: Record<string, number>
}

// ── role / identity ──────────────────────────────────────────────────────────
const auth = useAuthStore()

// existing line: import { ref, reactive, computed, h, onMounted, watch } from 'vue'
// add:
const { listOrders } = useLaboratory()

// ── Orders table state (search + paginated) ─────────────────────────────────
const orders = ref<any[]>([])
const ordersMeta = ref<any>(null)
const ordersLoading = ref(false)
const ordersQuery = ref('')
const ordersPage = ref(1)
const ordersPerPage = 25

const todayIso = () => isoDate(new Date())

const loadOrders = async () => {
  ordersLoading.value = true
  try {
    const today = todayIso()
    const res = await listOrders({
      q: ordersQuery.value || undefined,
      page: ordersPage.value,
      per_page: ordersPerPage,
      // Fall back to today only when no dashboard filter window is set
      from: filters.from || today,
      to: filters.to || today,
      sub_department_id: filters.sub_department_id || undefined,
    })
    orders.value = res?.data ?? []
    ordersMeta.value = res?.meta ?? null
  } catch {
    orders.value = []; ordersMeta.value = null
  } finally {
    ordersLoading.value = false
  }
}
const goOrdersPage = (p: number) => { ordersPage.value = p; loadOrders() }

// debounce search
let searchTimer: any = null
watch(ordersQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { ordersPage.value = 1; loadOrders() }, 350)
})

// ── Insights helpers ────────────────────────────────────────────────────────
const stationTatMax = computed(() =>
  Math.max(1, ...Object.values(d.value?.turnaround?.by_station_avg_hours ?? {}).map(v => Number(v) || 0)),
)

// ── row-styling helpers (mirror index.vue) ──────────────────────────────────
const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const statusPillClass = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no_show')) return 'bg-error/10 text-error'
  if (k.includes('reported') || k.includes('complete') || k.includes('verified')) return 'bg-ribbon-teal/15 text-ribbon-teal'
  if (k.includes('progress') || k.includes('collected') || k.includes('received')) return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-blue/15 text-ribbon-blue'
}
const urgencyClass = (u: string) => {
  const k = (u || '').toLowerCase()
  if (k === 'stat' || k === 'high') return 'bg-error/10 text-error'
  if (k === 'medium') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-teal/15 text-ribbon-teal'
}
const rowAccent = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no_show')) return 'border-ribbon-red'
  if (k.includes('reported') || k.includes('complete') || k.includes('verified')) return 'border-ribbon-teal'
  if (k.includes('progress') || k.includes('collected') || k.includes('received')) return 'border-ribbon-amber'
  return 'border-ribbon-blue'
}

const openOrder = (uuid: string) => {
  orderMenuFor.value = null
  navigateTo(`/orders/${uuid}`)
}

// Row action menu (teleported to escape overflow-x-auto)
const orderMenuFor = ref<string | null>(null)
const orderMenuPos = reactive({ top: 0, left: 0 })
const toggleOrderMenu = (uuid: string, ev: MouseEvent) => {
  if (orderMenuFor.value === uuid) { orderMenuFor.value = null; return }
  const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  orderMenuPos.top = r.bottom + 6
  orderMenuPos.left = Math.max(8, r.right - 176)
  orderMenuFor.value = uuid
}

// close menu when navigating
const _openOrder = openOrder
// (if openOrder already exists, replace it with this wrapped version)

const displayName = computed(() => auth.currentUser?.full_name || 'Clinician')
const roleLabel = computed(() => auth.currentUser?.role_label || 'Laboratory')
const department = computed(() => auth.currentUser?.department || '')

const greeting = (() => {
  const hr = new Date().getHours()
  return hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'
})()

// ── filters ──────────────────────────────────────────────────────────────────
const filters = reactive<Record<string, any>>({
  from: '2026-05-01',
  to: '2026-06-11',
  sub_department_id: undefined,
})
const filtersOpen = ref(false)

const fmtWindowDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const windowLabel = computed(() => {
  const from = d.value?.window?.from ?? filters.from
  const to = d.value?.window?.to ?? filters.to
  return `${fmtWindowDate(from)} → ${fmtWindowDate(to)}`
})

// ADD ↓
const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
)

// ── quick range presets ──────────────────────────────────────────────────────
const PRESETS = [
  { key: 'today', label: 'Today', icon: 'calendar-day' },
  { key: '7d', label: 'Last 7 days', icon: 'calendar-week' },
  { key: '30d', label: 'Last 30 days', icon: 'calendar' },
  { key: 'month', label: 'This month', icon: 'calendar-days' },
  { key: 'all', label: 'This Quarter', icon: 'infinity' },
] as const
type PresetKey = typeof PRESETS[number]['key'] | 'custom'
const activePreset = ref<PresetKey>('custom')

const isoDate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const applyPreset = (key: PresetKey) => {
  activePreset.value = key
  const now = new Date()
  if (key === 'today') {
    filters.from = isoDate(now); filters.to = isoDate(now)
  } else if (key === '7d') {
    const from = new Date(now); from.setDate(from.getDate() - 6)
    filters.from = isoDate(from); filters.to = isoDate(now)
  } else if (key === '30d') {
    const from = new Date(now); from.setDate(from.getDate() - 29)
    filters.from = isoDate(from); filters.to = isoDate(now)
  } else if (key === 'month') {
    filters.from = isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
    filters.to = isoDate(now)
  } else if (key === 'all') {
    filters.from = ''
    filters.to = ''
  }
}

const resetFilters = () => {
  filters.from = ''
  filters.to = ''
  filters.sub_department_id = undefined
  deptUuid.value = ''
  activePreset.value = 'all'
  load(true)
}

// ── department / sub-department cascade ──────────────────────────────────────
const { request } = useApi()
const departments = ref<any[]>([])
const subDepartments = ref<any[]>([])
const deptUuid = ref<string>('')

const loadDepartments = async () => {
  try { departments.value = (await request<any[]>('/departments')) ?? [] } catch { departments.value = [] }
}
const loadSubDepartments = async (uuid: string) => {
  try {
    const res = await request<any>(`/department/show?uuid=${uuid}`)
    subDepartments.value = res?.sub_departments ?? []
  } catch { subDepartments.value = [] }
}
watch(deptUuid, (uuid) => {
  filters.sub_department_id = undefined
  subDepartments.value = []
  if (uuid) loadSubDepartments(uuid)
})

// ── fetch ────────────────────────────────────────────────────────────────────
const d = ref<LabDashboard | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const buildQuery = () => {
  const p = new URLSearchParams()
  if (filters.from) p.set('from', filters.from)
  if (filters.to) p.set('to', filters.to)
  if (filters.sub_department_id != null && filters.sub_department_id !== '') {
    p.set('sub_department_id', String(filters.sub_department_id))
  }
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

const load = async (useFilters = true) => {
  loading.value = true
  error.value = null
  try {
    const qs = useFilters ? buildQuery() : ''
    d.value = await request<LabDashboard>(`/laboratories/dashboard${qs}`)
    if (!d.value) error.value = 'The dashboard service returned no data.'
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load the laboratory dashboard. Please try again.'
  } finally {
    loading.value = false
  }
  ordersPage.value = 1
  loadOrders()
}

onMounted(() => {
  loadDepartments()
  load(false) // initial fetch: no filters applied — also loads orders now
})

// ── formatting helpers ───────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat().format(n)
const titleCase = (s: string) =>
  s.replace(/[_\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
const pct = (v: number | null | undefined) =>
  v == null ? '—' : `${Math.round(v <= 1 ? v * 100 : v)}%`
const hoursFmt = (v: number | null | undefined) =>
  v == null ? '—' : `${v} h`
const hasEntries = (o: Record<string, unknown> | null | undefined) =>
  !!o && Object.keys(o).length > 0

// ── KPI tiles ────────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const s = d.value?.summary
  if (!s) return []
  return [
    { label: 'Orders received', value: fmt(s.orders_received), icon: 'clipboard-list', accent: 'border-ribbon-blue', tint: 'text-ribbon-blue' },
    { label: 'Tests', value: fmt(s.tests), icon: 'flask', accent: 'border-ribbon-teal', tint: 'text-ribbon-teal' },
    { label: 'Tests verified', value: fmt(s.tests_verified), icon: 'circle-check', accent: 'border-ribbon-purple', tint: 'text-ribbon-purple' },
    { label: 'Results recorded', value: fmt(s.results_recorded), icon: 'file-lines', accent: 'border-ribbon-amber', tint: 'text-ribbon-amber' },
    { label: 'Critical results', value: fmt(s.critical_results), icon: 'triangle-exclamation', accent: 'border-ribbon-red', tint: 'text-ribbon-red' },
    { label: 'Avg station TAT', value: hoursFmt(s.avg_station_tat_hours), icon: 'clock', accent: 'border-ribbon-blue', tint: 'text-ribbon-blue' },
  ]
})

// ── status progress bars (replaces the donut) ────────────────────────────────
const statusEntries = computed(() =>
  Object.entries(d.value?.by_status ?? {}).map(([k, v]) => ({ label: titleCase(k), value: Number(v) || 0 })),
)
const statusTotal = computed(() => statusEntries.value.reduce((a, s) => a + s.value, 0))
const hasStatus = computed(() => statusEntries.value.length > 0 && statusTotal.value > 0)
const statusPct = (v: number) => statusTotal.value > 0 ? Math.round((v / statusTotal.value) * 100) : 0

// ── received trend chart (kept as area) ──────────────────────────────────────
const trendEntries = computed(() => Object.entries(d.value?.received_trend ?? {}))
const trendArea = computed(() => ({
  series: [{ name: 'Orders received', data: trendEntries.value.map(([, v]) => v) }],
  options: {
    chart: { toolbar: { show: false }, fontFamily: 'Manrope, sans-serif' },
    colors: ['#3d7fbf'],
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, gradientToColors: ['#3dae8c'] },
    },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: trendEntries.value.map(([k]) => k || 'Unknown'),
      labels: { style: { fontFamily: 'Manrope, sans-serif' } },
    },
    yaxis: { labels: { style: { fontFamily: 'Manrope, sans-serif' } } },
    grid: { borderColor: '#e0e3e5', strokeDashArray: 4 },
  },
}))

// ── tiny inline render components ────────────────────────────────────────────
const RIBBON_BAR = [
  'bg-ribbon-blue', 'bg-ribbon-teal', 'bg-ribbon-amber', 'bg-ribbon-purple', 'bg-ribbon-red',
]

const DistBars = (props: { data: Record<string, number>; suffix?: string; empty?: string }) => {
  const entries = Object.entries(props.data ?? {})
  if (!entries.length) return h('p', { class: 'empty-line' }, props.empty ?? 'No data.')
  const max = Math.max(...entries.map(([, v]) => Number(v) || 0), 1)
  return h('div', { class: 'space-y-3' }, entries.map(([label, val], i) =>
    h('div', { key: label }, [
      h('div', { class: 'flex items-center justify-between text-xs sm:text-sm mb-1' }, [
        h('span', { class: 'font-semibold text-on-surface truncate pr-2' }, titleCase(label)),
        h('span', { class: 'text-on-surface-variant font-semibold shrink-0' },
          `${new Intl.NumberFormat().format(Number(val))}${props.suffix ?? ''}`),
      ]),
      h('div', { class: 'h-2 rounded-full bg-surface-low overflow-hidden' }, [
        h('div', {
          class: ['h-full rounded-full', RIBBON_BAR[i % RIBBON_BAR.length]],
          style: { width: `${Math.max((Number(val) / max) * 100, 4)}%` },
        }),
      ]),
    ]),
  ))
}

const MiniStat = (props: { label: string; value: string; danger?: boolean }) =>
  h('div', { class: 'rounded-xl bg-white/60 border border-white/40 px-3 py-2.5' }, [
    h('p', { class: 'text-[10px] text-outline font-bold uppercase tracking-wider' }, props.label),
    h('p', { class: ['text-lg sm:text-xl font-extrabold mt-0.5', props.danger ? 'text-error' : 'text-on-surface'] },
      props.value),
  ])
</script>

<style scoped>
@reference "~/assets/css/main.css";

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

.cust-input {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
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

.cust-input.has-icon {
  padding-left: 2.5rem;
}

/* filter chrome */
.filter-toggle {
  @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-ribbon-blue bg-ribbon-blue/10 hover:bg-ribbon-blue/20 transition-colors;
}

.filter-label {
  @apply block text-[10px] font-bold uppercase tracking-wider text-ribbon-blue mb-1.5 ml-0.5;
}

.preset-chip {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant bg-white/60 border border-white/60 hover:bg-ribbon-blue/10 hover:text-ribbon-blue transition-colors;
}

.preset-chip-active {
  @apply text-white border-transparent bg-primary-gradient shadow-md shadow-primary/20;
}

.btn-apply {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary-gradient shadow-md shadow-primary/20 hover:brightness-105 transition;
}

.btn-reset {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant bg-white/60 border border-white/60 hover:bg-white transition;
}

/* alive table — ribbon blue header + hover, matches department.vue */
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

.sub-label {
  @apply text-[10px] font-bold uppercase tracking-wider text-ribbon-blue mt-3 mb-2;
}

.empty-line {
  @apply text-sm text-on-surface-variant py-6 text-center;
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
  color: #3d7fbf;
  transition: background 0.15s ease;
}

.pager-btn:hover:not(:disabled) {
  background: #fff;
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.insight-card {
  @apply relative rounded-2xl bg-white/75 border-l-4 border border-white/40 overflow-hidden transition-transform;
  box-shadow: 0 6px 20px rgba(61, 127, 191, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(61, 127, 191, 0.10);
}

.insight-head {
  @apply flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant/15;
}

.insight-icon {
  @apply w-8 h-8 rounded-lg inline-flex items-center justify-center text-sm;
}

.insight-title {
  @apply text-sm font-bold text-on-surface leading-tight;
}

.insight-sub {
  @apply text-[10.5px] text-outline leading-tight;
}

.insight-badge {
  @apply text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap;
}

.insight-body {
  @apply px-4 py-4;
}

.ellipsis-btn {
  @apply w-8 h-8 inline-flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-ribbon-blue/10 hover:text-ribbon-blue transition-colors;
}

.menu-item {
  @apply w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors;
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