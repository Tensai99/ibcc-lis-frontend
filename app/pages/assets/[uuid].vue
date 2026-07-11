<!-- app/pages/assets/[uuid].vue -->
<!-- Single asset — tabbed detail view (Overview, Issues, Inspections, Maintenances,
     Damages) with all asset actions. Mirrors the inventory [uuid] UI/UX. -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <div class="mb-5">
        <nav
          class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
          <NuxtLink :to="{ path: `/assets/overview`, query: { tab: 'assets' } }"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
            <font-awesome-icon :icon="['fas', 'server']" class="text-[11px]" />Assets Overview
          </NuxtLink>
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
          <span v-if="asset" class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
            <font-awesome-icon :icon="['fas', 'hard-drive']" class="text-[11px] text-primary" />{{ asset.name
            }}
          </span>
        </nav>
      </div>

      <div v-if="feedback.msg" :class="feedback.kind === 'error' ? 'alert-error' : 'alert-success'">
        <font-awesome-icon :icon="['fas', feedback.kind === 'error' ? 'circle-exclamation' : 'circle-check']"
          class="mt-0.5" />
        <span class="break-words">{{ feedback.msg }}</span>
      </div>

      <!-- ── Tab bar — always visible; tab labels/icons are static, only counts
             and content wait on the fetch ────────────────────────────────── -->
      <div class="g-card p-2 flex items-center gap-1 overflow-x-auto scroll-area">
        <button v-for="t in tabs" :key="t.key" class="tab-btn whitespace-nowrap gap-2"
          :class="{ 'tab-active': activeTab === t.key }" @click="activeTab = t.key">
          <font-awesome-icon :icon="['fas', t.icon]" class="text-sm" />
          <span>{{ t.label }}</span>
          <span v-if="t.count != null" class="ml-0.5 min-w-[1.25rem] text-center text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            :class="activeTab === t.key ? 'bg-white/25' : 'bg-primary/10 text-primary'">{{ t.count }}</span>
        </button>
      </div>

      <template v-if="showSkeleton">
        <SkeletonDetailHeader />
        <SkeletonPanel :bars="4" />
      </template>
      <div v-else-if="loading" />

      <template v-else-if="asset">
        <!-- ── Header island ─────────────────────────────────────────────── -->
        <section class="g-card relative z-30 p-6">
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div class="space-y-3 min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-on-surface break-words">{{ asset.name }}</h1>
                <span
                  class="bg-surface-high text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-bold tracking-wide font-mono">{{
                  asset.asset_tag }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-[12px]">
                <span v-if="asset.type?.name"
                  class="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold break-words">{{ asset.type.name
                  }}</span>
                <span class="px-3 py-1 rounded-lg font-bold" :class="statusClass(asset.operational_status)">{{
                  titleCase(asset.operational_status) }}</span>
                <span class="px-3 py-1 rounded-lg font-bold" :class="conditionClass(asset.condition)">{{
                  titleCase(asset.condition) }}</span>
                <span v-if="asset.serial_number"
                  class="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-lg font-bold break-words">SN {{
                    asset.serial_number }}</span>
                <span v-if="asset.has_pending_disposal_approval"
                  class="bg-ribbon-amber/15 text-ribbon-amber px-3 py-1 rounded-lg font-bold">disposal pending</span>
                <span v-if="asset.has_pending_damages_approval"
                  class="bg-ribbon-amber/15 text-ribbon-amber px-3 py-1 rounded-lg font-bold">damage pending</span>
              </div>
              <div class="flex items-center gap-2 pt-1">
                <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Net book
                  value</span>
                <span class="text-base sm:text-lg font-extrabold text-primary break-words">{{
                  fmtAssetMoney(asset.net_book_value, asset.purchase_cost?.facility_currency || 'MWK') }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">

              <!-- Advanced Options -->
              <div v-if="canWrite" class="relative">
                <button
                  class="px-5 py-2.5 bg-white/60 border border-white/40 text-primary rounded-xl text-sm sm:text-base font-bold flex items-center gap-2 hover:bg-white/80 transition-all shadow-sm"
                  @click.stop="headerMenu = !headerMenu">
                  <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" /><span>Actions</span><font-awesome-icon
                    :icon="['fas', 'chevron-down']" class="text-xs" />
                </button>
                <div v-if="headerMenu" class="menu-pop" @click.stop>
                  <button class="menu-item" @click="closeMenus(); openEdit()"><font-awesome-icon :icon="['fas', 'pen']"
                      class="text-[14px]" /> Edit asset</button>
                  <button v-if="asset.operational_status === 'IN_USE'"
                    class="bg-ribbon-teal text-white px-5 py-3 text-sm sm:text-base font-bold flex items-center rounded-lg gap-2 hover:scale-105 active:scale-95 transition-all w-fit"
                    @click="closeMenus(); navigateTo(`/assets/inspect?asset_uuid=${asset.uuid || route.params.uuid}`)"><font-awesome-icon
                      :icon="['fas', 'clipboard-check']" /><span>Make Inspection</span></button>
                  <button class="menu-item" @click="closeMenus(); openSchedule()"><font-awesome-icon
                      :icon="['fas', 'screwdriver']" class="text-[14px]" />Schedule Maintenance</button>
                  <button class="menu-item" @click="closeMenus(); openAllocate()"><font-awesome-icon
                      :icon="['fas', 'dolly']" class="text-[14px]" /> Allocate</button>
                  <button class="menu-item" @click="closeMenus(); openIssue()"><font-awesome-icon
                      :icon="['fas', 'triangle-exclamation']" class="text-[14px]" /> Report issue</button>
                  <button class="menu-item" @click="closeMenus(); openDamage()"><font-awesome-icon
                      :icon="['fas', 'house-crack']" class="text-[14px]" /> Report damage</button>
                  <button class="menu-item text-error" @click="closeMenus(); openDispose()"><font-awesome-icon
                      :icon="['fas', 'trash-can']" class="text-[14px]" /> Dispose</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ───────────── OVERVIEW TAB ───────────── -->
        <section v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="g-card p-6 lg:col-span-2">
            <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4">Attributes</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div v-for="row in attributeRows" :key="row.label"
                class="flex justify-between gap-3 border-b border-outline-variant/10 pb-2">
                <span class="text-xs sm:text-sm text-on-surface-variant">{{ row.label }}</span>
                <span class="text-xs sm:text-sm font-semibold text-on-surface text-right break-words">{{ row.value
                  }}</span>
              </div>
            </div>

            <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold mt-6 mb-3">Custody</h3>
            <div class="overflow-x-auto rounded-t-2xl">
              <table class="w-full text-left border-collapse text-xs sm:text-sm">
                <thead class="bg-primary/5">
                  <tr class="text-[10px] text-on-surface-variant uppercase tracking-widest">
                    <th class="py-2.5 px-3">Department</th>
                    <th class="py-2.5 px-3">Sub-department</th>
                    <th class="py-2.5 px-3">Room</th>
                    <th class="py-2.5 px-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  <tr v-for="(c, i) in (asset.custodies ?? [])" :key="i">
                    <td class="py-2.5 px-3 font-semibold break-words">{{ c.department || '—' }}</td>
                    <td class="py-2.5 px-3 break-words">{{ c.sub_department || '—' }}</td>
                    <td class="py-2.5 px-3 break-words">{{ c.room || '—' }}</td>
                    <td class="py-2.5 px-3 text-right font-bold">{{ c.quantity }}</td>
                  </tr>
                  <tr v-if="!asset.custodies?.length">
                    <td colspan="4" class="py-4 text-center text-on-surface-variant">Not yet allocated. {{
                      asset.unallocated_quantity }} unallocated.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="g-card p-6">
            <h3 class="text-base sm:text-lg md:text-xl font-semibold sm:font-bold mb-4">Pictures</h3>
            <div v-if="asset.pictures_urls?.length" class="grid grid-cols-2 gap-3">
              <a v-for="p in asset.pictures_urls" :key="p.id" :href="p.url" target="_blank" rel="noopener"
                class="block rounded-xl overflow-hidden border border-outline-variant/30 hover:shadow-md transition-all">
                <img :src="p.url" alt="asset" class="w-full h-24 object-cover" />
              </a>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-10 text-outline">
              <font-awesome-icon :icon="['fas', 'image']" class="text-[28px] mb-2" />
              <p class="text-xs sm:text-sm">No pictures.</p>
            </div>
          </div>
        </section>

        <!-- ───────────── ISSUES TAB ───────────── -->
        <section v-else-if="activeTab === 'issues'" class="g-card p-6">
          <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4">Issues</h3>
          <div class="flex flex-col gap-3">
            <div v-for="iss in history.issues" :key="iss.uuid"
              class="p-4 rounded-2xl bg-surface-low border border-white/50">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span class="font-mono text-xs text-primary">{{ iss.reference_no }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="severityClass(iss.severity)">{{
                    titleCase(iss.severity) }}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    :class="iss.status === 'RESOLVED' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                    titleCase(iss.status) }}</span>
                </div>
              </div>
              <p class="text-sm sm:text-base text-on-surface break-words">{{ iss.fault_description }}</p>
              <p class="text-[11px] text-on-surface-variant mt-1">{{ iss.department }} · qty {{ iss.quantity }} · {{
                fmtDateTime(iss.reported_at) }}</p>
              <div class="flex items-center gap-2 mt-3">
                <button v-if="filesOf(iss).length" class="btn-secondary !px-3 !py-1.5 text-xs sm:text-sm"
                  @click="openFiles(iss, `Issue ${iss.reference_no} — Files`)">
                  <font-awesome-icon :icon="['fas', 'paperclip']" /><span>View Files ({{ filesOf(iss).length }})</span>
                </button>
                <button v-if="canWrite && iss.status !== 'RESOLVED'" class="btn-secondary !px-3 !py-1.5 text-xs sm:text-sm"
                  @click="openSchedule(iss)"><font-awesome-icon :icon="['fas', 'screwdriver-wrench']" /><span>Schedule
                    maintenance</span></button>
              </div>
            </div>
            <p v-if="!history.issues?.length" class="text-sm text-on-surface-variant text-center py-8">No issues
              reported.</p>
          </div>
        </section>

        <!-- ───────────── INSPECTIONS TAB ───────────── -->
        <section v-else-if="activeTab === 'inspections'" class="g-card p-6">
          <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4">Inspections</h3>
          <div class="flex flex-col gap-3">
            <div v-for="insp in history.inspections" :key="insp.uuid"
              class="p-4 rounded-2xl bg-surface-low border border-white/50 cursor-pointer hover:border-primary/30 transition-colors"
              @click="goInspection(insp)">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span class="font-semibold text-sm sm:text-base">{{ titleCase(insp.type) }}<span v-if="insp.quarter">
                    · {{ insp.quarter }}</span></span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="insp.outcome === 'PASS' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-error/10 text-error'">{{
                    titleCase(insp.outcome) }}</span>
              </div>
              <p class="text-[11px] text-on-surface-variant">{{ insp.date }} <span v-if="insp.next_due_on">· next due
                  {{ insp.next_due_on }}</span></p>
              <p v-if="insp.observations" class="text-sm text-on-surface break-words mt-1">{{ insp.observations }}</p>

              <details v-if="insp.checklist?.length" class="mt-3 group" @click.stop>
                <summary class="text-xs sm:text-sm font-semibold text-primary cursor-pointer select-none">
                  {{ insp.checklist.length }} checklist items
                  <font-awesome-icon :icon="['fas', 'chevron-down']"
                    class="text-[10px] ml-1 group-open:rotate-180 transition-transform" />
                </summary>
                <div class="mt-2 flex flex-col gap-2">
                  <div v-for="(row, i) in insp.checklist" :key="i"
                    class="flex items-start justify-between gap-3 text-xs sm:text-sm border-b border-outline-variant/10 pb-1.5">
                    <div class="min-w-0">
                      <p class="font-medium break-words">{{ row.task }}</p>
                      <p class="text-on-surface-variant text-[11px]">{{ row.section }}<span v-if="row.comment"> · {{
                          row.comment }}</span></p>
                    </div>
                    <span class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      :class="row.result === 'PASSED' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-error/10 text-error'">{{
                        titleCase(row.result) }}</span>
                  </div>
                </div>
              </details>

              <div v-if="filesOf(insp).length" class="mt-3">
                <button class="btn-secondary !px-3 !py-1.5 text-xs sm:text-sm"
                  @click.stop="openFiles(insp, 'Inspection — Files')">
                  <font-awesome-icon :icon="['fas', 'paperclip']" /><span>View Files ({{ filesOf(insp).length }})</span>
                </button>
              </div>
            </div>
            <p v-if="!history.inspections?.length" class="text-sm text-on-surface-variant text-center py-8">No
              inspections recorded.</p>
          </div>
        </section>

        <!-- ───────────── MAINTENANCES TAB ───────────── -->
        <section v-else-if="activeTab === 'maintenances'" class="g-card p-6">
          <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4">Maintenances</h3>
          <div class="flex flex-col gap-3">
            <div v-for="m in history.maintenances" :key="m.uuid"
              class="p-4 rounded-2xl bg-surface-low border border-white/50 cursor-pointer hover:border-primary/30 transition-colors"
              @click="goMaintenance(m)">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span class="font-mono text-xs text-primary">{{ m.job_card_no }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{{
                    titleCase(m.type) }}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    :class="m.status === 'COMPLETED' ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                      titleCase(m.status) }}</span>
                </div>
              </div>
              <p v-if="m.fault_reported" class="text-[11px] text-on-surface-variant">Reported fault: {{
                m.fault_reported }}</p>
              <p v-if="m.work_description" class="text-sm text-on-surface break-words mt-1">{{ m.work_description }}</p>
              <p class="text-[11px] text-on-surface-variant mt-1">
                Scheduled {{ m.scheduled_date }}<span v-if="m.completed_at"> · completed {{ fmtDateTime(m.completed_at) }}</span>
                <span v-if="m.next_due_on"> · next due {{ m.next_due_on }}</span>
              </p>
              <p v-if="m.by_external_contractor && m.external_contractor" class="text-[11px] text-on-surface-variant mt-1">
                Contractor: {{ m.external_contractor.entity_name }} ({{ m.external_contractor.full_name }} · {{
                m.external_contractor.phone }})
              </p>

              <div v-if="m.parts?.length" class="mt-2 overflow-x-auto rounded-lg border border-outline-variant/10">
                <table class="w-full text-left text-xs">
                  <thead class="bg-primary/5 text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <tr><th class="px-3 py-1.5">Part</th><th class="px-3 py-1.5 text-right">Qty</th>
                      <th class="px-3 py-1.5 text-right">Cost</th></tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/10">
                    <tr v-for="(p, i) in m.parts" :key="i">
                      <td class="px-3 py-1.5 break-words">{{ p.inventory }}</td>
                      <td class="px-3 py-1.5 text-right">{{ p.quantity }}</td>
                      <td class="px-3 py-1.5 text-right">{{ fmtAssetMoney(p.total_cost) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p v-if="m.total_cost" class="text-[11px] font-semibold mt-2">Total cost: {{ fmtAssetMoney(m.total_cost,
                m.labour_currency) }}</p>

              <div v-if="filesOf(m).length" class="mt-3">
                <button class="btn-secondary !px-3 !py-1.5 text-xs sm:text-sm"
                  @click.stop="openFiles(m, `Maintenance ${m.job_card_no} — Files`)">
                  <font-awesome-icon :icon="['fas', 'paperclip']" /><span>View Files ({{ filesOf(m).length }})</span>
                </button>
              </div>
            </div>
            <p v-if="!history.maintenances?.length" class="text-sm text-on-surface-variant text-center py-8">No
              maintenance records.</p>
          </div>
        </section>

        <!-- ───────────── ADJUSTMENTS TAB (damages + disposals) ───────────── -->
        <section v-else-if="activeTab === 'adjustments'" class="g-card p-6">
          <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold mb-4">Adjustments</h3>
          <div class="flex flex-col gap-3">
            <div v-for="adj in adjustments" :key="adj.uuid"
              class="p-4 rounded-2xl bg-surface-low border border-white/50">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span class="text-sm sm:text-base font-bold break-words">
                  <font-awesome-icon :icon="['fas', adj._kind === 'damage' ? 'house-crack' : 'trash-can']"
                    class="mr-1 text-xs" :class="adj._kind === 'damage' ? 'text-ribbon-amber' : 'text-error'" />
                  {{ adj._kind === 'damage' ? `${titleCase(adj.cause)} · ${titleCase(adj.extent)}` :
                    `${titleCase(adj.disposal_reason)} · ${titleCase(adj.disposal_method)}` }}
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :class="adj.is_approved ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-ribbon-amber/15 text-ribbon-amber'">{{
                    adj.is_approved ? 'Approved' : 'Pending' }}</span>
              </div>
              <p class="text-sm text-on-surface break-words">{{ adj.description || adj.disposal_certificate_no }}</p>
              <p class="text-[11px] text-on-surface-variant mt-1">
                {{ adj.department }} · qty {{ adj.quantity }}
                <template v-if="adj._kind === 'damage'"> · {{ adj.repairable ? 'repairable' : 'not repairable' }} · est.
                  {{ fmtAssetMoney(adj.estimated_repair_cost) }}</template>
                <template v-else-if="adj.proceeds"> · proceeds {{ fmtAssetMoney(adj.proceeds) }}</template>
                <span v-if="adj.approved_on"> · approved {{ adj.approved_on }}</span>
              </p>

              <div class="flex items-center gap-2 mt-3">
                <button v-if="filesOf(adj).length" class="btn-secondary !px-3 !py-1.5 text-xs sm:text-sm"
                  @click="openFiles(adj, 'Adjustment — Files')">
                  <font-awesome-icon :icon="['fas', 'paperclip']" /><span>View Files ({{ filesOf(adj).length }})</span>
                </button>
              </div>
            </div>
            <p v-if="!adjustments.length" class="text-sm text-on-surface-variant text-center py-8">No damage or
              disposal records.</p>
          </div>
        </section>
      </template>
    </div>

    <!-- ════════════════════════ MODALS ════════════════════════ -->

    <!-- Edit -->
    <Modal v-model="editModal" title="Edit asset" :show-logo="false" class="max-w-3xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="sm:col-span-2"><label class="input-label">Asset type</label>
          <SearchSelect v-model="editForm.asset_type_id" :options="types" option-value="id"
            :option-label="(t) => `${t.name} (${t.code})`" icon="tag" placeholder="Select type…"
            search-placeholder="Search types…" />
        </div>
        <div><label class="input-label">Asset tag</label><input v-model="editForm.asset_tag" class="input-field" />
        </div>
        <div><label class="input-label">Name</label><input v-model="editForm.name" class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Description</label><input v-model="editForm.description"
            class="input-field" /></div>
        <div><label class="input-label">Make</label><input v-model="editForm.make" class="input-field" /></div>
        <div><label class="input-label">Model</label><input v-model="editForm.model" class="input-field" /></div>
        <div><label class="input-label">Serial number</label><input v-model="editForm.serial_number"
            class="input-field" />
        </div>
        <div><label class="input-label">Supplier</label><input v-model="editForm.supplier" class="input-field" /></div>
        <!-- <div><label class="input-label">Quantity</label><input v-model.number="editForm.quantity" type="number"
            class="input-field" /></div> -->
        <div><label class="input-label">Main location</label><input v-model="editForm.main_location"
            class="input-field" />
        </div>
        <div><label class="input-label">Sub location</label><input v-model="editForm.sub_location"
            class="input-field" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Room description</label><input
            v-model="editForm.room_description" class="input-field" /></div>
        <div><label class="input-label">Condition</label>
          <div class="filter-wrap"><select v-model="editForm.condition" class="filter-select">
              <option v-for="c in CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Operational status</label>
          <div class="filter-wrap"><select v-model="editForm.operational_status" class="filter-select">
              <option v-for="s in OP_STATUSES" :key="s" :value="s">{{ titleCase(s) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Acquisition date</label><input v-model="editForm.acquisition_date" type="date"
            class="input-field" /></div>
        <div><label class="input-label">Commissioned on</label><input v-model="editForm.commissioned_on" type="date"
            class="input-field" /></div>
        <div><label class="input-label">Currency</label>
          <SearchSelect v-model="editForm.currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Select currency…"
            search-placeholder="Search currency…" />
        </div>
        <div><label class="input-label">Purchase cost</label><input v-model.number="editForm.purchase_cost"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Life span (years)</label><input v-model.number="editForm.life_span_years"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Depreciation rate (%)</label><input v-model.number="editForm.depreciation_rate"
            type="number" step="0.1" class="input-field" /></div>
        <div><label class="input-label">Depreciation method</label>
          <div class="filter-wrap"><select v-model="editForm.depreciation_method" class="filter-select">
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="REDUCING_BALANCE">Reducing Balance</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Salvage value</label><input v-model.number="editForm.salvage_value"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Warranty provider</label><input v-model="editForm.warranty_provider"
            class="input-field" /></div>
        <div><label class="input-label">Warranty expiry</label><input v-model="editForm.warranty_expiry" type="date"
            class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Add pictures</label><input type="file" multiple
            accept="image/*"
            class="block w-full text-xs sm:text-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-bold"
            @change="editPics = Array.from(($event.target as HTMLInputElement).files || [])" /></div>
      </div>
      <template #footer><button class="btn-secondary" @click="editModal = false">Cancel</button><button
          class="btn-primary" :disabled="busy" @click="submitEdit"><font-awesome-icon :icon="['fas', 'check']" /><span>{{
            busy ? 'Saving…' : 'Save changes' }}</span></button></template>
    </Modal>

    <!-- Allocate -->
    <Modal v-model="allocModal" title="Allocate asset" subtitle="Assign units to a department" :show-logo="false"
      class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- <div><label class="input-label">Quantity</label><input v-model.number="allocForm.quantity" type="number" min="1"
            class="input-field" placeholder="blank = all unallocated" /></div> -->
        <div><label class="input-label">Room description</label><input v-model="allocForm.room_description"
            class="input-field" /></div>
        <div><label class="input-label">Department *</label>
          <SearchSelect v-model="allocForm.department_uuid" :options="departmentsList" option-value="uuid"
            :option-label="(d) => `${d.name} (${d.code})`" icon="building" placeholder="Select department…"
            search-placeholder="Search departments…" />
        </div>
        <div><label class="input-label">Sub-department</label>
          <SearchSelect v-model="allocForm.sub_department_uuid" :options="subDepartments" option-value="uuid"
            :option-label="(s) => `${s.name} (${s.code})`" icon="building" :disabled="!allocForm.department_uuid"
            placeholder="Select sub-department…" search-placeholder="Search…" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Custodian</label>
          <SearchSelect v-model="allocForm.custodian_uuid" :options="users" option-value="uuid"
            :option-label="(u) => u.full_name" :option-subtitle="(u) => u.role?.name" icon="user" server-filter
            placeholder="Select custodian…" search-placeholder="Search users…" @search="onUserSearch" />
        </div>
      </div>
      <template #footer><button class="btn-secondary" @click="allocModal = false">Cancel</button><button
          class="btn-primary" :disabled="busy" @click="submitAllocate"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Allocating…' : 'Allocate' }}</span></button></template>
    </Modal>

    <!-- Report issue -->
    <Modal v-model="issueModal" title="Report issue" :show-logo="false" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- <div><label class="input-label">Quantity</label><input v-model.number="issueForm.quantity" type="number" min="1"
            class="input-field" /></div> -->
        <div><label class="input-label">Severity</label>
          <div class="filter-wrap"><select v-model="issueForm.severity" class="filter-select">
              <option v-for="s in SEVERITIES" :key="s" :value="s">{{ titleCase(s) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div class="sm:col-span-2"><label class="input-label">Fault description *</label><textarea
            v-model="issueForm.fault_description" rows="3" class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Pictures</label><input type="file" multiple
            accept="image/*"
            class="block w-full text-xs sm:text-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-bold"
            @change="issuePics = Array.from(($event.target as HTMLInputElement).files || [])" /></div>
      </div>
      <template #footer><button class="btn-secondary" @click="issueModal = false">Cancel</button><button
          class="btn-primary" :disabled="busy" @click="submitIssue"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Reporting…' : 'Report issue' }}</span></button></template>
    </Modal>


    <!-- Schedule maintenance -->
    <Modal v-model="scheduleModal" title="Schedule maintenance" :show-logo="false" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label class="input-label">Type</label>
          <div class="filter-wrap"><select v-model="scheduleForm.maintenance_type" class="filter-select">
              <option v-for="t in MAINT_TYPES" :key="t" :value="t">{{ titleCase(t) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Frequency</label>
          <div class="filter-wrap"><select v-model="scheduleForm.frequency" class="filter-select">
              <option v-for="f in FREQUENCIES" :key="f" :value="f">{{ titleCase(f) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div v-if="['QUARTERLY', 'BIANNUAL', 'ANNUAL'].includes(scheduleForm.frequency)"><label
            class="input-label">Quarter</label>
          <div class="filter-wrap"><select v-model="scheduleForm.quarter" class="filter-select">
              <option value="">—</option>
              <option v-for="q in QUARTERS" :key="q" :value="q">{{ q }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Scheduled date *</label><input v-model="scheduleForm.scheduled_date" type="date"
            class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Assigned to</label>
          <SearchSelect v-model="scheduleForm.assigned_to_id" :options="users" option-value="id"
            :option-label="(u) => u.full_name" :option-subtitle="(u) => u.role?.name" icon="user" server-filter
            placeholder="Select user…" search-placeholder="Search users…" @search="onUserSearch" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Fault reported</label><textarea
            v-model="scheduleForm.fault_reported" rows="2" class="input-field" /></div>
        <div class="sm:col-span-2 flex items-center gap-2"><input id="sched-ext"
            v-model="scheduleForm.by_external_contractor" type="checkbox"
            class="rounded border-outline-variant text-primary focus:ring-primary/30" /><label for="sched-ext"
            class="text-sm sm:text-base cursor-pointer">By external contractor</label></div>
        <template v-if="scheduleForm.by_external_contractor">
          <div><label class="input-label">Contractor name</label><input
              v-model="scheduleForm.external_contractor.full_name" class="input-field" /></div>
          <div><label class="input-label">Entity</label><input v-model="scheduleForm.external_contractor.entity_name"
              class="input-field" /></div>
          <div><label class="input-label">Phone</label><input v-model="scheduleForm.external_contractor.phone"
              class="input-field" /></div>
          <div><label class="input-label">Email</label><input v-model="scheduleForm.external_contractor.email"
              class="input-field" /></div>
        </template>
      </div>
      <template #footer><button class="btn-secondary" @click="scheduleModal = false">Cancel</button><button
          class="btn-primary" :disabled="busy" @click="submitSchedule"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Scheduling…' : 'Schedule' }}</span></button></template>
    </Modal>

    <!-- Complete maintenance -->
    <Modal v-model="completeModal" title="Complete maintenance" :subtitle="completeForm._job" :show-logo="false"
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

    <!-- Report damage -->
    <Modal v-model="damageModal" title="Report damage" :show-logo="false" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- <div><label class="input-label">Quantity</label><input v-model.number="damageForm.quantity" type="number"
            min="1" class="input-field" placeholder="blank = 1" /></div> -->
        <div><label class="input-label">Cause</label>
          <div class="filter-wrap"><select v-model="damageForm.damage_cause" class="filter-select">
              <option v-for="c in DAMAGE_CAUSES" :key="c" :value="c">{{ titleCase(c) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Extent</label>
          <div class="filter-wrap"><select v-model="damageForm.damage_extent" class="filter-select">
              <option v-for="e in DAMAGE_EXTENTS" :key="e" :value="e">{{ titleCase(e) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Repairable</label>
          <div class="filter-wrap"><select v-model="damageForm.is_repairable" class="filter-select">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Currency</label>
          <SearchSelect v-model="damageForm.currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Currency…"
            search-placeholder="Search…" />
        </div>
        <div><label class="input-label">Est. repair cost</label><input v-model.number="damageForm.estimated_repair_cost"
            type="number" min="0" class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Description *</label><textarea
            v-model="damageForm.damage_description" rows="3" class="input-field" /></div>
      </div>
      <template #footer><button class="btn-secondary" @click="damageModal = false">Cancel</button><button
          class="btn-primary" :disabled="busy" @click="submitDamage"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Reporting…' : 'Report damage' }}</span></button></template>
    </Modal>

    <!-- Dispose -->
    <Modal v-model="disposeModal" title="Dispose asset" :show-logo="false" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- <div><label class="input-label">Quantity</label><input v-model.number="disposeForm.quantity" type="number"
            min="1" class="input-field" placeholder="blank = all" /></div> -->
        <div><label class="input-label">Certificate no.</label><input v-model="disposeForm.disposal_certificate_no"
            class="input-field" /></div>
        <div><label class="input-label">Reason</label>
          <div class="filter-wrap"><select v-model="disposeForm.disposal_reason" class="filter-select">
              <option v-for="r in DISPOSAL_REASONS" :key="r" :value="r">{{ titleCase(r) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Method</label>
          <div class="filter-wrap"><select v-model="disposeForm.disposal_method" class="filter-select">
              <option v-for="m in DISPOSAL_METHODS" :key="m" :value="m">{{ titleCase(m) }}</option>
            </select><font-awesome-icon :icon="['fas', 'chevron-down']" class="filter-caret" /></div>
        </div>
        <div><label class="input-label">Currency</label>
          <SearchSelect v-model="disposeForm.currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Currency…"
            search-placeholder="Search…" />
        </div>
        <div><label class="input-label">Proceeds</label><input v-model.number="disposeForm.proceeds" type="number"
            min="0" class="input-field" /></div>
        <div class="sm:col-span-2"><label class="input-label">Witnessed by</label>
          <SearchSelect v-model="disposeForm.witnessed_by_id" :options="users" option-value="id"
            :option-label="(u) => u.full_name" :option-subtitle="(u) => u.role?.name" icon="user" server-filter
            placeholder="Select witness…" search-placeholder="Search users…" @search="onUserSearch" />
        </div>
      </div>
      <template #footer><button class="btn-secondary" @click="disposeModal = false">Cancel</button><button
          class="btn-danger" :disabled="busy" @click="submitDispose"><font-awesome-icon
            :icon="['fas', 'trash-can']" /><span>{{ busy ? 'Disposing…' : 'Dispose' }}</span></button></template>
    </Modal>

    <!-- Files / pictures preview -->
    <Modal v-model="filesModal" :title="filesModalTitle" :show-logo="false" class="max-w-2xl">
      <div v-if="filesModalItems.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="f in filesModalItems" :key="f.id" class="rounded-xl border border-outline-variant/30 overflow-hidden">
          <a v-if="isImageFile(f.url)" :href="f.url" target="_blank" rel="noopener" class="block">
            <img :src="f.url" :alt="fileName(f.url)" class="w-full h-48 object-cover" />
          </a>
          <a v-else :href="f.url" target="_blank" rel="noopener"
            class="flex flex-col items-center justify-center h-48 gap-2 text-on-surface-variant hover:bg-surface-low">
            <font-awesome-icon :icon="['fas', 'file-lines']" class="text-3xl" />
            <span class="text-xs break-all px-3 text-center">{{ fileName(f.url) }}</span>
          </a>
          <p v-if="f.uploaded_on" class="text-[10px] text-on-surface-variant px-3 py-1.5 border-t border-outline-variant/10">
            Uploaded {{ fmtDateTime(f.uploaded_on) }}
          </p>
        </div>
      </div>
      <p v-else class="text-sm text-on-surface-variant text-center py-8">No files attached.</p>
      <template #footer><button class="btn-secondary" @click="filesModal = false">Close</button></template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
// explicit import so these resolve regardless of Nuxt auto-import state
import { useAssets, fmtAssetMoney, titleCase } from '~/composables/useAssets'

const route = useRoute()
const uuid = route.params.uuid as string
const assetsApi = useAssets()
const auth = useAuthStore()
const can = (p: string) => auth.can(p)
const PRIVILEGED_ROLES = ['system_administrator', 'bme_lead']
const canWrite = computed(() => can('asset_management') || PRIVILEGED_ROLES.includes(auth.currentRole))

// enum option sets
const CONDITIONS = ['VERY_GOOD', 'GOOD', 'FAIR', 'POOR', 'FAULTY']
const OP_STATUSES = ['IN_USE', 'NOT_COMMISSIONED', 'JUST_INSTALLED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'DISPOSED']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const MAINT_TYPES = ['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'UPGRADE']
const FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'AD_HOC']
const DAMAGE_CAUSES = ['ACCIDENTAL', 'MISUSE', 'WEAR_AND_TEAR', 'POWER_SURGE', 'ENVIRONMENTAL', 'UNKNOWN']
const DAMAGE_EXTENTS = ['MINOR', 'PARTIAL', 'MAJOR', 'TOTAL']
const DISPOSAL_REASONS = ['END_OF_LIFE', 'BEYOND_ECONOMIC_REPAIR', 'OBSOLETE', 'DAMAGED', 'RECALLED', 'DECOMMISSIONED']
const DISPOSAL_METHODS = ['SALE', 'AUCTION', 'DONATION', 'SCRAP', 'RETURN_TO_SUPPLIER', 'RECYCLING', 'SECURE_DESTRUCTION']

// ── feedback ────────────────────────────────────────────────────────────────
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── data ────────────────────────────────────────────────────────────────────
const asset = ref<any>(null)
const history = ref<any>({ issues: [], inspections: [], maintenances: [], damages: [], disposals: [] })
const loading = ref(true)
const { showSkeleton } = useDelayedLoading(loading)
const busy = ref(false)
const types = ref<any[]>([])
const countries = ref<any[]>([])
const departmentsList = ref<any[]>([])
const subDepartments = ref<any[]>([])
const users = ref<any[]>([])

// ── tabs ────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'issues' | 'inspections' | 'maintenances' | 'adjustments'
const tabs = computed<{ key: TabKey; label: string; icon: string; count: number | null }[]>(() => [
  { key: 'overview', label: 'Overview', icon: 'circle-info', count: null },
  { key: 'issues', label: 'Issues', icon: 'triangle-exclamation', count: history.value.issues?.length || null },
  { key: 'inspections', label: 'Inspections', icon: 'clipboard-check', count: history.value.inspections?.length || null },
  { key: 'maintenances', label: 'Maintenances', icon: 'screwdriver-wrench', count: history.value.maintenances?.length || null },
  { key: 'adjustments', label: 'Adjustments', icon: 'house-crack', count: adjustments.value.length || null },
])
const activeTab = ref<TabKey>('overview')

// damages + disposals merged into one feed, tagged with _kind for the shared card/actions
const adjustments = computed(() => [
  ...(history.value.damages ?? []).map((d: any) => ({ ...d, _kind: 'damage' as const })),
  ...(history.value.disposals ?? []).map((d: any) => ({ ...d, _kind: 'disposal' as const })),
].sort((a, b) => new Date(b.approved_on ?? b.reported_at ?? 0).getTime() - new Date(a.approved_on ?? a.reported_at ?? 0).getTime()))

// ── file/picture preview (issues, inspections, maintenances, adjustments) ───
const filesOf = (record: any): { id: number | string; url: string; uploaded_on?: string }[] =>
  record?.pictures_url ?? record?.files_url ?? []
// signed MinIO URLs carry the real content-type/filename in their query string
const isImageFile = (url: string) => {
  try { return (new URL(url).searchParams.get('response-content-type') ?? '').startsWith('image/') }
  catch { return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url) }
}

const fileName = (url: string) => {
  try {
    const cd = new URL(url).searchParams.get('response-content-disposition') ?? ''
    const m = cd.match(/filename="?([^";]+)"?/)
    return m?.[1] ? decodeURIComponent(m[1]) : 'file'
  } catch { return 'file' }
}

const filesModal = ref(false)
const filesModalTitle = ref('')
const filesModalItems = ref<{ id: number | string; url: string; uploaded_on?: string }[]>([])
const openFiles = (record: any, title: string) => {
  filesModalItems.value = filesOf(record)
  filesModalTitle.value = title
  filesModal.value = true
}

// ── header menu ───────────────────────────────────────────────────────────────
const headerMenu = ref(false)
const closeMenus = () => { headerMenu.value = false }
const onDocClick = () => closeMenus()
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// ── display helpers ───────────────────────────────────────────────────────────
const fmtDateTime = (s: any) => { if (!s) return '—'; const d = new Date(s); return Number.isNaN(d.getTime()) ? String(s) : d.toLocaleString() }
const statusClass = (s: string) => s === 'IN_USE' ? 'bg-ribbon-teal/15 text-ribbon-teal' : (s === 'OUT_OF_SERVICE' || s === 'DISPOSED') ? 'bg-error/10 text-error' : s === 'UNDER_MAINTENANCE' ? 'bg-ribbon-amber/15 text-ribbon-amber' : 'bg-surface-container text-on-surface-variant'
const conditionClass = (c: string) => c === 'VERY_GOOD' || c === 'GOOD' ? 'bg-ribbon-teal/15 text-ribbon-teal' : c === 'FAULTY' || c === 'POOR' ? 'bg-error/10 text-error' : 'bg-ribbon-amber/15 text-ribbon-amber'
const severityClass = (s: string) => s === 'CRITICAL' || s === 'HIGH' ? 'bg-error/10 text-error' : s === 'MEDIUM' ? 'bg-ribbon-amber/15 text-ribbon-amber' : 'bg-surface-container text-on-surface-variant'

const attributeRows = computed(() => {
  const a = asset.value || {}
  const out: { label: string; value: string }[] = []
  const push = (label: string, value: any) => { if (value !== null && value !== undefined && value !== '') out.push({ label, value: String(value) }) }
  push('Make', a.make); push('Model', a.model); push('Supplier', a.supplier)
  push('Quantity', a.quantity); push('Allocated', a.allocated_quantity); push('Unallocated', a.unallocated_quantity)
  if (a.location) push('Location', [a.location.main, a.location.sub, a.location.room].filter(Boolean).join(' · '))
  push('Acquisition date', a.acquisition_date); push('Commissioned on', a.commissioned_on)
  if (a.purchase_cost) push('Purchase cost', fmtAssetMoney(a.purchase_cost.amount, a.purchase_cost.currency))
  if (a.purchase_cost?.facilit_currency_amount) push('Facility cost', fmtAssetMoney(a.purchase_cost.facilit_currency_amount, a.purchase_cost.facility_currency))
  push('Life span (yrs)', a.life_span_years); push('Depreciation rate', a.depreciation_rate ? `${a.depreciation_rate}%` : null)
  push('Depreciation method', a.depreciation_method ? titleCase(a.depreciation_method) : null)
  push('Net book value', a.net_book_value ? fmtAssetMoney(a.net_book_value, a.purchase_cost?.facility_currency || 'MWK') : null)
  push('Warranty provider', a.warranty_provider); push('Warranty expiry', a.warranty_expiry)
  push('Requires PPM', a.requires_ppm ? 'Yes' : 'No'); push('Requires inspection', a.requires_inspection ? 'Yes' : 'No')
  return out
})

// ── loaders ───────────────────────────────────────────────────────────────────
const loadAsset = async () => {
  loading.value = true
  try { asset.value = await assetsApi.showAsset(uuid) }
  catch (e: any) { flash(e.message || 'Failed to load asset', 'error') }
  finally { loading.value = false }
}
const loadHistory = async () => { try { history.value = await assetsApi.getHistory(uuid) } catch { /* ignore */ } }
const loadTypes = async () => { try { const r = await assetsApi.getTypes(); types.value = r?.data ?? [] } catch { /* ignore */ } }
const loadCountries = async () => { try { const r = await assetsApi.getCountries(); countries.value = r?.data ?? r ?? [] } catch { /* ignore */ } }
const loadDepartments = async () => { try { departmentsList.value = (await assetsApi.getDepartments()) ?? [] } catch { /* ignore */ } }
const loadSubDepartments = async (deptUuid: string) => {
  if (!deptUuid) { subDepartments.value = []; return }
  try { const r = await assetsApi.showDepartment(deptUuid); subDepartments.value = r?.sub_departments ?? [] } catch { subDepartments.value = [] }
}
let userTimer: ReturnType<typeof setTimeout> | null = null
const onUserSearch = (q: string) => {
  if (userTimer) clearTimeout(userTimer)
  userTimer = setTimeout(async () => { try { const r = await assetsApi.getUsers({ q }); users.value = r?.users ?? [] } catch { /* ignore */ } }, 200)
}
const refresh = () => { loadAsset(); loadHistory() }

// ════════ EDIT ════════
const editModal = ref(false)
const editPics = ref<File[]>([])
const editForm = reactive<Record<string, any>>({})
const openEdit = () => {
  const a = asset.value
  Object.assign(editForm, {
    asset_type_id: a.type?.id ?? '', asset_tag: a.asset_tag ?? '', name: a.name ?? '', description: a.description ?? '',
    make: a.make ?? '', model: a.model ?? '', serial_number: a.serial_number ?? '', supplier: a.supplier ?? '', quantity: a.quantity ?? '',
    main_location: a.location?.main ?? '', sub_location: a.location?.sub ?? '', room_description: a.location?.room ?? '',
    condition: a.condition ?? 'VERY_GOOD', operational_status: a.operational_status ?? 'IN_USE',
    acquisition_date: a.acquisition_date ?? '', commissioned_on: a.commissioned_on ?? '', currency_id: '',
    purchase_cost: a.purchase_cost?.amount ?? '', life_span_years: a.life_span_years ?? '', depreciation_rate: a.depreciation_rate ?? '',
    depreciation_method: a.depreciation_method ?? 'STRAIGHT_LINE', salvage_value: '', warranty_provider: a.warranty_provider ?? '', warranty_expiry: a.warranty_expiry ?? '',
  })
  editPics.value = []; editModal.value = true
}
const submitEdit = async () => {
  busy.value = true
  try { await assetsApi.updateAsset(uuid, { ...editForm }, editPics.value); flash('Asset updated'); editModal.value = false; refresh() }
  catch (e: any) { flash(e.message || 'Update failed', 'error') } finally { busy.value = false }
}

// ════════ ALLOCATE ════════
const allocModal = ref(false)
const allocForm = reactive<Record<string, any>>({ quantity: '', department_uuid: '', sub_department_uuid: '', room_description: '', custodian_uuid: '' })
watch(() => allocForm.department_uuid, (v) => { allocForm.sub_department_uuid = ''; loadSubDepartments(v) })
const openAllocate = () => { Object.assign(allocForm, { quantity: '', department_uuid: '', sub_department_uuid: '', room_description: '', custodian_uuid: '' }); onUserSearch(''); allocModal.value = true }
const submitAllocate = async () => {
  if (!allocForm.department_uuid) { flash('Department is required', 'error'); return }
  busy.value = true
  try { await assetsApi.allocateAsset(uuid, { ...allocForm }); flash('Asset allocated'); allocModal.value = false; refresh() }
  catch (e: any) { flash(e.message || 'Allocation failed', 'error') } finally { busy.value = false }
}

// ════════ REPORT ISSUE ════════
const issueModal = ref(false)
const issuePics = ref<File[]>([])
const issueForm = reactive<Record<string, any>>({ quantity: 1, fault_description: '', severity: 'MEDIUM' })
const openIssue = () => { Object.assign(issueForm, { quantity: 1, fault_description: '', severity: 'MEDIUM' }); issuePics.value = []; issueModal.value = true }
const submitIssue = async () => {
  if (!issueForm.fault_description) { flash('Fault description is required', 'error'); return }
  busy.value = true
  try { await assetsApi.reportIssue(uuid, { ...issueForm }, issuePics.value); flash('Issue reported'); issueModal.value = false; activeTab.value = 'issues'; refresh() }
  catch (e: any) { flash(e.message || 'Failed to report issue', 'error') } finally { busy.value = false }
}

// ════════ INSPECT → page wizard ════════
// inspection is now its own page; deep-link with the asset uuid pre-selected
const goInspect = () => navigateTo(`/assets/inspect?asset_uuid=${uuid}`)

// view an existing record on its dedicated page — both pages read ?uuid=<record_uuid>
const goInspection = (insp: any) => navigateTo(`/assets/inspect?uuid=${insp.uuid}`)
const goMaintenance = (m: any) => navigateTo(`/assets/maintenance?uuid=${m.uuid}`)

// ════════ SCHEDULE MAINTENANCE ════════
const scheduleModal = ref(false)
const scheduleForm = reactive<Record<string, any>>({ department_asset_issue_uuid: '', maintenance_type: 'CORRECTIVE', frequency: 'AD_HOC', quarter: '', scheduled_date: '', assigned_to_id: '', fault_reported: '', by_external_contractor: false, external_contractor: { full_name: '', entity_name: '', phone: '', email: '' } })
const openSchedule = (issue?: any) => {
  Object.assign(scheduleForm, { department_asset_issue_uuid: issue?.uuid ?? '', maintenance_type: 'CORRECTIVE', frequency: 'AD_HOC', quarter: '', scheduled_date: '', assigned_to_id: '', fault_reported: issue?.fault_description ?? '', by_external_contractor: false, external_contractor: { full_name: '', entity_name: '', phone: '', email: '' } })
  onUserSearch(''); scheduleModal.value = true
}
const submitSchedule = async () => {
  if (!scheduleForm.scheduled_date) { flash('Scheduled date is required', 'error'); return }
  busy.value = true
  try {
    const payload: Record<string, any> = {
      uuid, maintenance_type: scheduleForm.maintenance_type, frequency: scheduleForm.frequency,
      scheduled_date: scheduleForm.scheduled_date,
      assigned_to_id: scheduleForm.assigned_to_id || undefined,
      department_asset_issue_uuid: scheduleForm.department_asset_issue_uuid || undefined,
      fault_reported: scheduleForm.fault_reported || undefined,
      quarter: scheduleForm.quarter || undefined,
      by_external_contractor: scheduleForm.by_external_contractor,
    }
    if (scheduleForm.by_external_contractor) payload.external_contractor = scheduleForm.external_contractor
    await assetsApi.scheduleMaintenance(payload)
    flash('Maintenance scheduled'); scheduleModal.value = false; activeTab.value = 'issues'; refresh()
  } catch (e: any) { flash(e.message || 'Failed to schedule', 'error') } finally { busy.value = false }
}

// ════════ COMPLETE MAINTENANCE ════════
const completeModal = ref(false)
const completeForm = reactive<Record<string, any>>({ _job: '', maintenance_uuid: '', work_description: '', parts: [] as any[], labour_currency_id: '', labour_cost: '', by_external_contractor: false, external_contractor: { full_name: '', entity_name: '', phone: '', email: '' }, equipment_status_after: '', return_to_service: true })
const openComplete = (m: any) => {
  Object.assign(completeForm, {
    _job: m.job_card_no, maintenance_uuid: m.uuid, work_description: '', parts: [],
    labour_currency_id: '', labour_cost: '', by_external_contractor: !!m.by_external_contractor,
    external_contractor: m.external_contractor ? { ...m.external_contractor } : { full_name: '', entity_name: '', phone: '', email: '' },
    equipment_status_after: '', return_to_service: true,
  })
  completeModal.value = true
}
const submitComplete = async () => {
  if (!completeForm.work_description) { flash('Work description is required', 'error'); return }
  busy.value = true
  try {
    const payload: Record<string, any> = {
      uuid, maintenance_uuid: completeForm.maintenance_uuid, work_description: completeForm.work_description,
      parts: completeForm.parts.filter((p: any) => p.department_inventory_stock_id).map((p: any) => ({ department_inventory_stock_id: Number(p.department_inventory_stock_id), quantity: Number(p.quantity) })),
      labour_currency_id: completeForm.labour_currency_id || undefined,
      labour_cost: completeForm.labour_cost || undefined,
      by_external_contractor: completeForm.by_external_contractor,
      equipment_status_after: completeForm.equipment_status_after || undefined,
      return_to_service: completeForm.return_to_service,
    }
    if (completeForm.by_external_contractor) payload.external_contractor = completeForm.external_contractor
    await assetsApi.completeMaintenance(payload)
    flash('Maintenance completed'); completeModal.value = false; refresh()
  } catch (e: any) { flash(e.message || 'Failed to complete', 'error') } finally { busy.value = false }
}

// ════════ REPORT DAMAGE ════════
const damageModal = ref(false)
const damageForm = reactive<Record<string, any>>({ quantity: '', damage_description: '', damage_cause: 'ACCIDENTAL', damage_extent: 'MINOR', is_repairable: true, currency_id: '', estimated_repair_cost: '' })
const openDamage = () => { Object.assign(damageForm, { quantity: '', damage_description: '', damage_cause: 'ACCIDENTAL', damage_extent: 'MINOR', is_repairable: true, currency_id: '', estimated_repair_cost: '' }); damageModal.value = true }
const submitDamage = async () => {
  if (!damageForm.damage_description) { flash('Description is required', 'error'); return }
  busy.value = true
  try { await assetsApi.reportDamage(uuid, { ...damageForm }); flash('Damage reported'); damageModal.value = false; activeTab.value = 'adjustments'; refresh() }
  catch (e: any) { flash(e.message || 'Failed to report damage', 'error') } finally { busy.value = false }
}

// ════════ DISPOSE ════════
const disposeModal = ref(false)
const disposeForm = reactive<Record<string, any>>({ quantity: '', disposal_reason: 'END_OF_LIFE', disposal_method: 'SCRAP', disposal_certificate_no: '', currency_id: '', proceeds: '', witnessed_by_id: '' })
const openDispose = () => { Object.assign(disposeForm, { quantity: '', disposal_reason: 'END_OF_LIFE', disposal_method: 'SCRAP', disposal_certificate_no: '', currency_id: '', proceeds: '', witnessed_by_id: '' }); onUserSearch(''); disposeModal.value = true }
const submitDispose = async () => {
  busy.value = true
  try { await assetsApi.disposeAsset(uuid, { ...disposeForm }); flash('Asset disposal recorded'); disposeModal.value = false; refresh() }
  catch (e: any) { flash(e.message || 'Failed to dispose', 'error') } finally { busy.value = false }
}

// ── mount ───────────────────────────────────────────────────────────────────
onMounted(() => { loadAsset(); loadHistory(); loadTypes(); loadCountries(); loadDepartments() })
</script>

<style scoped>
.detail-page {
  min-height: 100%;
  background: linear-gradient(135deg, #f7f9fb 0%, #d6e8fa 100%);
  padding: 1rem;
}

@media (min-width: 768px) {
  .detail-page {
    padding: 2rem;
  }
}

.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(61, 127, 191, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 1rem;
  font-size: 0.85rem;
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

/* filter dropdowns (reused in modals) */
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

.filter-caret {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-outline, #727687);
  font-size: 0.7rem;
  pointer-events: none;
}

/* header actions popover */
.menu-pop {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 50;
  min-width: 15rem;
  background: #fff;
  border: 1px solid rgba(194, 198, 216, 0.5);
  border-radius: 1rem;
  box-shadow: 0 12px 32px rgba(61, 127, 191, 0.12);
  padding: 0.4rem;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.6rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-on-surface, #191c1e);
  text-align: left;
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: rgba(61, 127, 191, 0.07);
}

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
}

.pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>