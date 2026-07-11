<!-- app/pages/inventory/[uuid].vue -->
<!-- Single inventory item — tabbed detail view (Details, Price history, Central store,
     Department holdings, Used / Damaged / Disposed stock) with all stock actions. -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <div class="mb-5">
        <nav
          class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
          <NuxtLink :to="{ path: `/inventory`, query: { tab: 'items' } }"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
            <font-awesome-icon :icon="['fas', 'boxes-stacked']" class="text-[11px]" />Inventory Overview
          </NuxtLink>
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
          <span v-if="item" class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
            <font-awesome-icon :icon="['fa-solid', 'fa-cart-flatbed']" class="text-[11px] text-primary" />{{ item.name
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
      <div class="g-card relative z-10 p-2 flex items-center gap-1 overflow-x-auto scroll-area">
        <button v-for="t in tabs" :key="t.key" class="tab-btn whitespace-nowrap"
          :class="{ 'tab-active': activeTab === t.key }" @click="activeTab = t.key">
          <font-awesome-icon :icon="['fas', t.icon]" class="text-sm" /><span>{{ t.label }}</span>
          <span v-if="t.count != null" class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            :class="activeTab === t.key ? 'bg-white/25' : 'bg-primary/10 text-primary'">{{ t.count }}</span>
        </button>
      </div>

      <template v-if="showSkeleton">
        <SkeletonDetailHeader />
        <SkeletonPanel :bars="4" />
      </template>
      <div v-else-if="loading" />

      <template v-else-if="item">
        <!-- ── Header island ─────────────────────────────────────────────── -->
        <section class="g-card ribbon-edge relative z-30 p-6 pl-7">
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div class="space-y-3 min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-on-surface break-words">{{ item.name }}</h1>
                <span
                  class="bg-surface-high text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">{{
                    item.code }}</span>
                <span class="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"
                  :class="item.active ? 'bg-secondary-fixed text-secondary-on-fixed' : 'bg-surface-container text-on-surface-variant'">
                  <span v-if="item.active" class="w-2 h-2 bg-secondary rounded-full" />{{ item.active ? 'active' :
                    'inactive' }}
                </span>
                <!-- expired-stock alert → jumps to Central store, pre-filtered -->
                <button v-if="expiredCentral.length" type="button"
                  class="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-error-container text-on-error-container hover:brightness-95 transition"
                  @click="goToExpired()">
                  <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
                  {{ expiredCentral.length }} expired {{ expiredCentral.length === 1 ? 'batch' : 'batches' }}
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span v-if="item.type?.name"
                  class="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-lg text-[12px] font-bold">{{
                    item.type.name }}</span>
                <span v-if="item.barcode"
                  class="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-lg text-[12px] font-bold">{{
                    item.barcode }}</span>
                <span v-if="item.is_billable"
                  class="bg-secondary-fixed text-secondary-on-fixed px-3 py-1 rounded-lg text-[12px] font-bold">billable</span>
                <span v-if="item.is_controlled_substance"
                  class="bg-error-container text-on-error-container px-3 py-1 rounded-lg text-[12px] font-bold">controlled</span>
                <span v-if="item.requires_prescription"
                  class="bg-ribbon-amber/15 text-ribbon-amber px-3 py-1 rounded-lg text-[12px] font-bold">Rx</span>
              </div>
              <!-- current price only when billable -->
              <div v-if="item.is_billable" class="flex items-center gap-2 pt-1">
                <span class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Current
                  price</span>
                <span v-if="item.current_price" class="text-base sm:text-lg font-extrabold text-primary">{{
                  fmtMoney(item.current_price.amount, item.current_price.currency) }}</span>
                <span v-else class="text-sm text-on-surface-variant italic">No active price.</span>
              </div>
            </div>

            <!-- Advanced Options dropdown -->
            <div v-if="canAnyAction" class="relative shrink-0">
              <button
                class="px-5 py-2.5 bg-white/60 border border-white/40 text-primary rounded-xl text-sm sm:text-base font-bold flex items-center gap-2 hover:bg-white/80 transition-all shadow-sm"
                @click.stop="headerMenu = !headerMenu">
                <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                <span>Advanced Options</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-xs" />
              </button>
              <div v-if="headerMenu" class="menu-pop" @click.stop>
                <button v-if="can('inventory_management')" class="menu-item"
                  @click="closeMenus(); openEdit()"><font-awesome-icon :icon="['fas', 'pen']" class="text-[14px]" />
                  Edit item</button>
                <button v-if="can('inventory_pricing')" class="menu-item"
                  @click="closeMenus(); openPrice()"><font-awesome-icon :icon="['fas', 'tag']" class="text-[14px]" />
                  Set price</button>
                <button v-if="can('inventory_stock')" class="menu-item"
                  @click="closeMenus(); openCapture()"><font-awesome-icon :icon="['fas', 'truck-ramp-box']"
                    class="text-[14px]" /> Capture stock</button>
                <button v-if="can('inventory_stock')" class="menu-item text-primary font-bold"
                  @click="closeMenus(); openAllocate()"><font-awesome-icon :icon="['fas', 'dolly']"
                    class="text-[14px]" /> Allocate stock</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── DETAILS ───────────────────────────────────────────────────── -->
        <section v-if="activeTab === 'details'" class="g-card p-6">
          <h3 class="text-lg sm:text-xl font-semibold sm:font-bold mb-6">Details</h3>
          <dl class="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 sm:gap-x-12">
            <div v-for="[label, value] in attributes" :key="label" class="min-w-0">
              <dt class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{{ label }}</dt>
              <dd class="text-sm sm:text-base font-semibold text-on-surface break-words">{{ value }}</dd>
            </div>
            <p v-if="!attributes.length" class="text-sm text-on-surface-variant col-span-full">No additional attributes
              recorded.</p>
          </dl>
        </section>

        <!-- ── PRICE HISTORY ─────────────────────────────────────────────── -->
        <section v-else-if="activeTab === 'pricing'" class="g-card p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg sm:text-xl font-semibold sm:font-bold">Price history</h3>
            <button v-if="can('inventory_pricing')" class="btn-secondary !px-4 !py-2 text-sm" @click="openPrice()">
              <font-awesome-icon :icon="['fas', 'tag']" /><span>Set price</span>
            </button>
          </div>
          <ul v-if="item.price_history?.length" class="flex flex-col gap-2">
            <li v-for="(p, i) in item.price_history" :key="i"
              class="flex items-center justify-between gap-3 p-3.5 rounded-xl border"
              :class="p.voided?.status ? 'bg-surface-low/60 border-white/40 opacity-70' : 'bg-surface-low border-white/50'">
              <div class="min-w-0">
                <span class="font-bold text-on-surface break-words" :class="{ 'line-through': p.voided?.status }">{{
                  fmtMoney(p.amount, p.currency) }}</span>
                <span v-if="p.created_by" class="block text-xs text-on-surface-variant">Set by {{ p.created_by }}</span>
              </div>
              <span v-if="p.voided?.status" class="badge-error shrink-0">Voided<template v-if="p.voided?.by"> · {{
                p.voided.by }}</template></span>
            </li>
          </ul>
          <div v-else class="flex flex-col items-center justify-center py-12 text-outline">
            <font-awesome-icon :icon="['fas', 'clock-rotate-left']" class="text-[32px] mb-2 text-tertiary" />
            <p class="text-sm sm:text-base">No price history found.</p>
          </div>
        </section>

        <!-- ── CENTRAL STORE ─────────────────────────────────────────────── -->
        <section v-else-if="activeTab === 'central'" class="g-card overflow-hidden">
          <div
            class="p-6 border-b border-outline-variant/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl font-semibold sm:font-bold">Central store batches</h3>
              <p v-if="expiredCentral.length" class="text-xs sm:text-sm text-error mt-1 flex items-center gap-1.5">
                <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
                {{ expiredCentral.length }} expired {{ expiredCentral.length === 1 ? 'batch needs' : 'batches need' }}
                disposal — use the Dispose action below, or filter to review them.
              </p>
            </div>
            <button v-if="expiredCentral.length" type="button"
              class="shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-colors"
              :class="centralExpiredOnly
                ? 'bg-error text-white border-error'
                : 'bg-error-container text-on-error-container border-transparent hover:brightness-95'"
              @click="centralExpiredOnly = !centralExpiredOnly">
              {{ centralExpiredOnly ? 'Show all batches' : 'Show expired only' }}
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm sm:text-base alive-tbl tbl-blue">
              <thead class="bg-primary/5 border-b border-outline-variant/10">
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  <th class="px-6 py-3">Batch</th>
                  <th class="px-6 py-3">GRN</th>
                  <th class="px-6 py-3">Supplier</th>
                  <th class="px-6 py-3 text-right">Received</th>
                  <th class="px-6 py-3 text-right">Available</th>
                  <th class="px-6 py-3">Unit cost</th>
                  <th class="px-6 py-3">Expiry</th>
                  <th class="px-6 py-3">Expiration Status</th>
                  <th class="px-6 py-3">Stock Status</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="b in centralRows" :key="b.uuid" class="hover:bg-surface-low/50 transition-colors"
                  :class="b.expired ? 'bg-error-container/20' : ''">
                  <td class="px-6 py-5"><span class="bg-surface-variant px-2 py-1 rounded font-mono text-xs">{{
                    b.batch_no
                      }}</span></td>
                  <td class="px-6 py-5 text-on-surface-variant whitespace-nowrap">{{ b.grn_number }}</td>
                  <td class="px-6 py-5 font-semibold break-words">{{ b.supplier }}</td>
                  <td class="px-6 py-5 text-right">{{ fmtQty(b.quantity_received) }}</td>
                  <td class="px-6 py-5 text-right text-lg sm:text-xl font-semibold"
                    :class="Number(b.quantity_available) > 0 ? 'text-primary' : 'text-on-surface-variant'">{{
                      fmtQty(b.quantity_available) }}</td>
                  <td class="px-6 py-5 whitespace-nowrap">{{ fmtMoney(b.unit_cost) }}</td>
                  <td class="px-6 py-5 whitespace-nowrap"><span
                      :class="b.expired ? 'text-error font-semibold' : 'text-on-surface-variant'">{{ b.expiry_date ||
                        '—'
                      }}</span></td>
                  <!-- expiration status (from `expired`) -->
                  <td class="px-6 py-5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                      :class="b.expired ? 'bg-error-container text-on-error-container'
                        : (b.expiry_date ? 'bg-secondary-fixed text-secondary-on-fixed' : 'bg-surface-variant text-on-surface-variant')">
                      {{ b.expired ? 'Expired' : (b.expiry_date ? 'Valid' : 'No expiry') }}
                    </span>
                  </td>
                  <td class="px-6 py-5"><span
                      class="bg-secondary-fixed text-secondary-on-fixed px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">{{
                        b.status }}</span></td>
                  <td class="px-6 py-5 text-right">
                    <div class="flex justify-end">
                      <button
                        class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-high rounded-full transition-colors"
                        @click.stop="openRowMenu($event, b, 'central')">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!centralRows.length">
                  <td colspan="10" class="px-6 py-8 text-center text-on-surface-variant">
                    {{ centralExpiredOnly ? 'No expired batches.' : 'No central batches.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── DEPARTMENT HOLDINGS ───────────────────────────────────────── -->
        <section v-else-if="activeTab === 'departments'" class="g-card overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10">
            <h3 class="text-lg sm:text-xl font-semibold sm:font-bold">Department holdings</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm sm:text-base alive-tbl tbl-purple">
              <thead class="bg-primary/5 border-b border-outline-variant/10">
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  <th class="px-6 py-3">Department</th>
                  <th class="px-6 py-3">Sub-dept</th>
                  <th class="px-6 py-3">Batch</th>
                  <th class="px-6 py-3 text-right">Allocated</th>
                  <th class="px-6 py-3 text-right">On hand</th>
                  <th class="px-6 py-3 text-right">Used</th>
                  <th class="px-6 py-3">Expiry</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="d in departments" :key="d.uuid" class="hover:bg-surface-low/50 transition-colors">
                  <td class="px-6 py-5 font-semibold break-words">{{ d.department }}</td>
                  <td class="px-6 py-5 text-on-surface-variant break-words">{{ d.sub_department || '—' }}</td>
                  <td class="px-6 py-5"><span class="bg-surface-variant px-2 py-1 rounded font-mono text-xs">{{
                    d.batch_no
                      }}</span></td>
                  <td class="px-6 py-5 text-right">{{ fmtQty(d.quantity_allocated) }}</td>
                  <td class="px-6 py-5 text-right text-lg sm:text-xl font-semibold text-primary">{{
                    fmtQty(d.quantity_on_hand)
                  }}</td>
                  <td class="px-6 py-5 text-right">{{ fmtQty(d.quantity_used) }}</td>
                  <td class="px-6 py-5 whitespace-nowrap text-on-surface-variant">{{ d.expiry_date || '—' }}</td>
                  <td class="px-6 py-5"><span
                      class="bg-secondary-fixed text-secondary-on-fixed px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">{{
                        d.status }}</span></td>
                  <td class="px-6 py-5">
                    <div v-if="can('inventory_adjustment')" class="flex justify-end">
                      <button
                        class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-high rounded-full transition-colors"
                        @click.stop="openRowMenu($event, d, 'departments')">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!departments.length">
                  <td colspan="9" class="px-6 py-8 text-center text-on-surface-variant">No departmental holdings.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── USED STOCK ────────────────────────────────────────────────── -->
        <section v-else-if="activeTab === 'used'" class="g-card overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10">
            <h3 class="text-lg sm:text-xl font-semibold sm:font-bold">Used stock</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm sm:text-base alive-tbl tbl-teal">
              <thead class="bg-primary/5 border-b border-outline-variant/10">
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  <th class="px-6 py-3">Department</th>
                  <th class="px-6 py-3">Sub-dept</th>
                  <th class="px-6 py-3">Batch</th>
                  <th class="px-6 py-3 text-right">Allocated</th>
                  <th class="px-6 py-3 text-right">On hand</th>
                  <th class="px-6 py-3 text-right">Used</th>
                  <th class="px-6 py-3 text-right">Util %</th>
                  <th class="px-6 py-3">Last used</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="d in usedStock" :key="d.uuid" class="hover:bg-surface-low/50 transition-colors">
                  <td class="px-6 py-5 font-semibold break-words">{{ d.department }}</td>
                  <td class="px-6 py-5 text-on-surface-variant break-words">{{ d.sub_department || '—' }}</td>
                  <td class="px-6 py-5"><span class="bg-surface-variant px-2 py-1 rounded font-mono text-xs">{{
                    d.batch_no
                      }}</span></td>
                  <td class="px-6 py-5 text-right">{{ fmtQty(d.quantity_allocated) }}</td>
                  <td class="px-6 py-5 text-right">{{ fmtQty(d.quantity_on_hand) }}</td>
                  <td class="px-6 py-5 text-right text-lg sm:text-xl font-semibold text-primary">{{
                    fmtQty(d.usage?.quantity) }}
                  </td>
                  <td class="px-6 py-5 text-right text-on-surface-variant">{{ d.usage?.utilisation_pct ?
                    `${fmtQty(d.usage.utilisation_pct)}%` : '—' }}</td>
                  <td class="px-6 py-5 text-on-surface-variant">{{ d.usage?.last_used_on || '—' }}</td>
                </tr>
                <tr v-if="!usedStock.length">
                  <td colspan="7" class="px-6 py-8 text-center text-on-surface-variant">No stock has been used yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── DAMAGED STOCK ─────────────────────────────────────────────── -->
        <section v-else-if="activeTab === 'damaged'" class="g-card overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10">
            <h3 class="text-lg sm:text-xl font-semibold sm:font-bold">Damaged stock</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm sm:text-base alive-tbl tbl-amber">
              <thead class="bg-primary/5 border-b border-outline-variant/10">
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  <th class="px-6 py-3">Department</th>
                  <th class="px-6 py-3">Sub-dept</th>
                  <th class="px-6 py-3">Batch</th>
                  <th class="px-6 py-3 text-right">On hand</th>
                  <th class="px-6 py-3 text-right">Damaged</th>
                  <th class="px-6 py-3 text-right">Util %</th>
                  <th class="px-6 py-3">Last damaged</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="d in damagedStock" :key="d.uuid" class="hover:bg-surface-low/50 transition-colors">
                  <td class="px-6 py-4 font-semibold break-words">{{ d.department }}</td>
                  <td class="px-6 py-4 text-on-surface-variant break-words">{{ d.sub_department || '—' }}</td>
                  <td class="px-6 py-4"><span class="bg-surface-variant px-2 py-1 rounded font-mono text-xs">{{
                    d.batch_no }}</span></td>
                  <td class="px-6 py-4 text-right">{{ fmtQty(d.quantity_on_hand) }}</td>
                  <td class="px-6 py-4 text-right text-lg font-semibold text-ribbon-amber">{{
                    fmtQty(d.damaged?.quantity) }}
                  </td>
                  <td class="px-6 py-4 text-right text-on-surface-variant">{{ d.damaged?.utilisation_pct ?
                    `${fmtQty(d.damaged.utilisation_pct)}%` : '—' }}</td>
                  <td class="px-6 py-4 text-on-surface-variant">{{ d.damaged?.last_used_on || '—' }}</td>
                  <td class="px-6 py-4">
                    <div class="flex justify-end">
                      <button
                        class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-high rounded-full transition-colors"
                        @click.stop="openRowMenu($event, d, 'damaged')">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!damagedStock.length">
                  <td colspan="8" class="px-6 py-8 text-center text-on-surface-variant">No damage records.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── DISPOSED STOCK ────────────────────────────────────────────── -->
        <section v-else-if="activeTab === 'disposed'" class="g-card overflow-hidden">
          <div class="p-6 border-b border-outline-variant/10">
            <h3 class="text-lg sm:text-xl font-semibold sm:font-bold">Disposed stock</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm sm:text-base alive-tbl tbl-red">
              <thead class="bg-primary/5 border-b border-outline-variant/10">
                <tr class="text-[11px] text-on-surface-variant uppercase tracking-wider">
                  <th class="px-6 py-3">Department</th>
                  <th class="px-6 py-3">Sub-dept</th>
                  <th class="px-6 py-3">Batch</th>
                  <th class="px-6 py-3 text-right">On hand</th>
                  <th class="px-6 py-3 text-right">Disposed</th>
                  <th class="px-6 py-3 text-right">Util %</th>
                  <th class="px-6 py-3">Last disposed</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/10">
                <tr v-for="d in disposedStock" :key="d.uuid" class="hover:bg-surface-low/50 transition-colors">
                  <td class="px-6 py-4 font-semibold break-words">{{ d.department }}</td>
                  <td class="px-6 py-4 text-on-surface-variant break-words">{{ d.sub_department || '—' }}</td>
                  <td class="px-6 py-4"><span class="bg-surface-variant px-2 py-1 rounded font-mono text-xs">{{
                    d.batch_no }}</span></td>
                  <td class="px-6 py-4 text-right">{{ fmtQty(d.quantity_on_hand) }}</td>
                  <td class="px-6 py-4 text-right text-lg font-semibold text-ribbon-red">{{ fmtQty(d.disposed?.quantity)
                    }}</td>
                  <td class="px-6 py-4 text-right text-on-surface-variant">{{ d.disposed?.utilisation_pct ?
                    `${fmtQty(d.disposed.utilisation_pct)}%` : '—' }}</td>
                  <td class="px-6 py-4 text-on-surface-variant">{{ d.disposed?.last_used_on || '—' }}</td>
                  <td class="px-6 py-4">
                    <div class="flex justify-end">
                      <button
                        class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-high rounded-full transition-colors"
                        @click.stop="openRowMenu($event, d, 'damaged')">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!disposedStock.length">
                  <td colspan="8" class="px-6 py-8 text-center text-on-surface-variant">No disposal records.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>

    <!-- teleported per-row action menu (context-aware by kind) -->
    <Teleport to="body">
      <div v-if="rowMenu.open" class="menu-fixed" :style="{ top: `${rowMenu.y}px`, left: `${rowMenu.x}px` }"
        @click.stop>
        <button v-if="rowMenu.row?.batch_no" class="menu-item" @click="openPrintPickerFromRow()">
          <font-awesome-icon :icon="['fas', 'qrcode']" class="text-[14px]" /> Print batch number
        </button>

        <template v-if="rowMenu.kind === 'departments'">
          <button class="menu-item" @click="closeMenus(); openDamage(rowMenu.row?.batch_no)">
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[14px]" /> Report damage
          </button>
        </template>

        <button
          v-if="rowMenu.kind === 'central' && can('inventory_stock') && Number(rowMenu.row?.quantity_available) > 0"
          class="menu-item text-primary font-bold" @click="closeMenus(); openAllocate(rowMenu.row?.batch_no)">
          <font-awesome-icon :icon="['fas', 'dolly']" class="text-[14px]" /> Allocate
        </button>

        <!-- dispose expired central batch -->
        <button v-if="rowMenu.kind === 'central' && rowMenu.row?.expired && can('inventory_adjustment')"
          class="menu-item text-error" @click="closeMenus(); openDisposal(rowMenu.row?.batch_no)">
          <font-awesome-icon :icon="['fas', 'trash-can']" class="text-[14px]" /> Dispose
        </button>

        <button
          v-if="(rowMenu.kind === 'damaged' || rowMenu.kind === 'disposed') && !rowMenu.row?.is_approved && can('inventory_adjustment')"
          class="menu-item text-primary font-bold" :disabled="busy"
          @click="closeMenus(); approveAdjustmentRow({ kind: rowMenu.kind === 'damaged' ? 'damage' : 'disposal', ...rowMenu.row })">
          <font-awesome-icon :icon="['fas', 'check']" class="text-[14px]" /> Approve adjustment
        </button>

        <p v-if="!rowMenu.row?.batch_no && rowMenu.kind !== 'departments'"
          class="px-4 py-2 text-xs text-on-surface-variant">
          No actions available.
        </p>
      </div>
    </Teleport>

    <!-- print format picker (QR vs Barcode) -->
    <Teleport to="body">
      <div v-if="printPicker.open" class="menu-fixed" :style="{ top: `${printPicker.y}px`, left: `${printPicker.x}px` }"
        @click.stop>
        <button class="menu-item" @click="printBatch('qr')">
          <font-awesome-icon :icon="['fas', 'qrcode']" class="text-[14px]" /> Print as QR code
        </button>
        <button class="menu-item" @click="printBatch('barcode')">
          <font-awesome-icon :icon="['fas', 'barcode']" class="text-[14px]" /> Print as Barcode
        </button>
      </div>
    </Teleport>

    <!-- ════════ MODALS ════════ -->

    <!-- EDIT -->
    <Modal v-model="modal.edit" title="Edit item" :subtitle="item?.code" :show-logo="true" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="sm:col-span-2">
          <label class="input-label">Type</label>
          <SearchSelect v-model="editForm.inventory_type_id" :options="types" option-value="id"
            :option-label="(t) => `${t.name} (${t.code})`" icon="tag" placeholder="Select type…"
            search-placeholder="Search types…" />
        </div>
        <div><label class="input-label">Code</label><input v-model="editForm.code" class="input-field" /></div>
        <div><label class="input-label">Name</label><input v-model="editForm.name" class="input-field" /></div>
        <div><label class="input-label">Barcode</label><input v-model="editForm.barcode" class="input-field" /></div>
        <div><label class="input-label">Manufacturer</label><input v-model="editForm.manufacturer"
            class="input-field" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Description</label><input v-model="editForm.description"
            class="input-field" /></div>
        <div><label class="input-label">Generic name</label><input v-model="editForm.generic_name"
            class="input-field" />
        </div>
        <div><label class="input-label">Brand name</label><input v-model="editForm.brand_name" class="input-field" />
        </div>
        <div><label class="input-label">Strength</label><input v-model="editForm.strength" class="input-field" /></div>
        <div><label class="input-label">Dosage form</label><input v-model="editForm.dosage_form" class="input-field" />
        </div>
        <div><label class="input-label">Dosage</label><input v-model="editForm.dosage" class="input-field" /></div>
        <div><label class="input-label">Route</label><input v-model="editForm.route" class="input-field" /></div>
        <div><label class="input-label">Frequency</label><input v-model="editForm.frequency" class="input-field" />
        </div>
        <div><label class="input-label">ATC code</label><input v-model="editForm.atc_code" class="input-field" /></div>
        <div><label class="input-label">Unit of measure</label><input v-model="editForm.unit_of_measure"
            class="input-field" /></div>
        <div><label class="input-label">Pack size</label><input v-model.number="editForm.pack_size" type="number"
            class="input-field" /></div>
        <div><label class="input-label">Shelf life (days)</label><input v-model.number="editForm.shelf_life_days"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Reorder level</label><input v-model.number="editForm.reorder_level"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Reorder quantity</label><input v-model.number="editForm.reorder_quantity"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Minimum stock</label><input v-model.number="editForm.minimum_stock_level"
            type="number" class="input-field" /></div>
        <div><label class="input-label">Maximum stock</label><input v-model.number="editForm.maximum_stock_level"
            type="number" class="input-field" /></div>
        <div class="sm:col-span-2 flex flex-wrap gap-4 pt-2">
          <label class="inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"><input
              v-model="editForm.is_billable" type="checkbox"
              class="rounded border-outline-variant text-primary focus:ring-primary/30" /> Billable</label>
          <label class="inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"><input
              v-model="editForm.requires_prescription" type="checkbox"
              class="rounded border-outline-variant text-primary focus:ring-primary/30" /> Requires prescription</label>
          <label class="inline-flex items-center gap-2 text-sm sm:text-base cursor-pointer"><input
              v-model="editForm.is_controlled_substance" type="checkbox"
              class="rounded border-outline-variant text-primary focus:ring-primary/30" /> Controlled</label>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="modal.edit = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitEdit"><font-awesome-icon
            :icon="['fas', 'check']" /><span>{{ busy ? 'Saving…' : 'Save changes' }}</span></button>
      </template>
    </Modal>

    <!-- SET PRICE (two-step: set → approve) -->
    <Modal v-model="modal.price" :title="priceStep === 1 ? 'Set price' : 'Approve price'" :subtitle="item?.name"
      :show-logo="true" class="max-w-2xl">
      <!-- step 1: enter price -->
      <div v-if="priceStep === 1" class="grid grid-cols-1 gap-3 sm:gap-4">
        <div>
          <label class="input-label">Currency</label>
          <SearchSelect v-model="priceForm.currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Select currency…"
            search-placeholder="Search currency or country…" />
        </div>
        <div><label class="input-label">Amount</label><input v-model.number="priceForm.amount" type="number" step="0.01"
            min="0" class="input-field" /></div>
        <div><label class="input-label">Effective from</label><input v-model="priceForm.effective_from" type="date"
            class="input-field" /></div>
        <p class="text-xs sm:text-sm text-on-surface-variant">New prices require approval before they become active.</p>
      </div>
      <!-- step 2: approve the price just created -->
      <div v-else class="flex flex-col gap-4">
        <div class="flex items-center gap-3 p-4 bg-secondary-fixed rounded-xl border border-secondary/30">
          <font-awesome-icon :icon="['fas', 'circle-check']" class="text-secondary-container text-xl" />
          <p class="text-sm sm:text-base text-secondary-on-fixed font-medium">Price saved. It is <strong>pending
              approval</strong>
            — approve it now to make it active.</p>
        </div>
        <div class="grid grid-cols-2 gap-y-4 gap-x-8 p-4 bg-surface-low rounded-xl border border-white/50">
          <div>
            <p class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Amount</p>
            <p class="text-lg font-extrabold text-primary">{{ fmtMoney(pendingPrice?.amount, pendingPrice?.currency) }}
            </p>
          </div>
          <div>
            <p class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Effective from</p>
            <p class="font-semibold">{{ pendingPrice?.effective_from }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <template v-if="priceStep === 1">
          <button class="btn-secondary" @click="modal.price = false">Cancel</button>
          <button class="btn-primary" :disabled="busy" @click="submitPrice"><font-awesome-icon
              :icon="['fas', 'tag']" /><span>{{ busy ? 'Saving…' : 'Set price' }}</span></button>
        </template>
        <template v-else>
          <button class="btn-secondary" :disabled="busy" @click="finishPriceLater">Approve later</button>
          <button class="btn-primary" :disabled="busy" @click="approvePendingPrice"><font-awesome-icon
              :icon="['fas', 'check']" /><span>{{ busy ? 'Approving…' : 'Approve price' }}</span></button>
        </template>
      </template>
    </Modal>

    <!-- CAPTURE STOCK -->
    <Modal v-model="modal.capture" title="Capture stock" :subtitle="item?.name" :show-logo="true" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div><label class="input-label">Batch no *</label><input v-model="captureForm.batch_no" class="input-field" />
        </div>
        <div><label class="input-label">GRN number</label><input v-model="captureForm.grn_number" class="input-field" />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Supplier</label><input v-model="captureForm.supplier"
            class="input-field" /></div>
        <div><label class="input-label">Quantity received *</label><input v-model.number="captureForm.quantity_received"
            type="number" min="0" class="input-field" /></div>
        <div><label class="input-label">Quantity available</label><input v-model.number="captureForm.quantity_available"
            type="number" min="0" class="input-field" placeholder="defaults to received" /></div>
        <div><label class="input-label">Unit cost</label><input v-model.number="captureForm.unit_cost" type="number"
            step="0.01" min="0" class="input-field" /></div>
        <div>
          <label class="input-label">Currency</label>
          <SearchSelect v-model="captureForm.currency_id" :options="countries" option-value="id"
            :option-label="(c) => `${c.currency_code} — ${c.name}`" icon="coins" placeholder="Select currency…"
            search-placeholder="Search currency or country…" />
        </div>
        <div><label class="input-label">Manufacture date</label><input v-model="captureForm.manufacture_date"
            type="date" class="input-field" /></div>
        <div><label class="input-label">Expiry date</label><input v-model="captureForm.expiry_date" type="date"
            class="input-field" /></div>
        <div><label class="input-label">Received date</label><input v-model="captureForm.received_date" type="date"
            class="input-field" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="modal.capture = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitCapture"><font-awesome-icon
            :icon="['fas', 'truck-ramp-box']" /><span>{{ busy ? 'Saving…' : 'Capture' }}</span></button>
      </template>
    </Modal>

    <!-- ALLOCATE STOCK -->
    <Modal v-model="modal.allocate" title="Allocate stock" :subtitle="item?.name" :show-logo="true" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="sm:col-span-2">
          <label class="input-label">Central batch *</label>
          <select v-model="allocForm.inventory_stock_batch_no" class="input-field">
            <option value="">Select batch…</option>
            <option v-for="b in central" :key="b.uuid" :value="b.batch_no"
              :disabled="Number(b.quantity_available) <= 0">{{
                b.batch_no }} — {{ fmtQty(b.quantity_available) }} available</option>
          </select>
        </div>
        <div>
          <label class="input-label">Department *</label>
          <SearchSelect v-model="allocForm.department_uuid" :options="departmentsList" option-value="uuid"
            :option-label="(d) => `${d.name} (${d.code})`" icon="building" placeholder="Select department…"
            search-placeholder="Search departments…" />
        </div>
        <div>
          <label class="input-label">Sub-department</label>
          <SearchSelect v-model="allocForm.sub_department_uuid" :options="subDepartments" option-value="uuid"
            :option-label="(s) => `${s.name} (${s.code})`"
            :placeholder="allocForm.department_uuid ? 'Select sub-department…' : 'Select a department first'"
            search-placeholder="Search sub-departments…" :disabled="!allocForm.department_uuid" clearable />
        </div>
        <div class="sm:col-span-2"><label class="input-label">Quantity *</label><input
            v-model.number="allocForm.quantity" type="number" min="0" class="input-field" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="modal.allocate = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitAllocate"><font-awesome-icon
            :icon="['fas', 'dolly']" /><span>{{ busy ? 'Saving…' : 'Allocate' }}</span></button>
      </template>
    </Modal>

    <!-- REPORT DAMAGE -->
    <Modal v-model="modal.damage" title="Report damage" :subtitle="item?.name" :show-logo="true" class="max-w-2xl">
      <div class="grid grid-cols-1 gap-3 sm:gap-4">
        <div>
          <label class="input-label">Department batch *</label>
          <select v-model="damageForm.department_inventory_stock_batch_no" class="input-field">
            <option value="">Select batch…</option>
            <option v-for="d in departments" :key="d.uuid" :value="d.batch_no">{{ d.batch_no }} — {{ d.department }} ({{
              fmtQty(d.quantity_on_hand) }})</option>
          </select>
        </div>
        <div><label class="input-label">Quantity *</label><input v-model.number="damageForm.quantity" type="number"
            min="0" class="input-field" /></div>
        <div>
          <label class="input-label">Reason *</label>
          <select v-model="damageForm.damage_reason" class="input-field">
            <option value="">Select reason…</option>
            <option v-for="r in DAMAGE_REASONS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div><label class="input-label">Notes</label><textarea v-model="damageForm.damage_notes" rows="3"
            class="input-field" /></div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="modal.damage = false">Cancel</button>
        <button class="btn-primary" :disabled="busy" @click="submitDamage"><font-awesome-icon
            :icon="['fas', 'triangle-exclamation']" /><span>{{ busy ? 'Saving…' : 'Report' }}</span></button>
      </template>
    </Modal>

    <!-- REPORT DISPOSAL -->
    <Modal v-model="modal.disposal" title="Report disposal" :subtitle="item?.name" :show-logo="true" class="max-w-2xl">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div class="sm:col-span-2">
          <label class="input-label">Department batch *</label>
          <select v-model="disposalForm.department_inventory_stock_batch_no" class="input-field">
            <option value="">Select batch…</option>
            <option v-for="d in departments" :key="d.uuid" :value="d.batch_no">{{ d.batch_no }} — {{ d.department }} ({{
              fmtQty(d.quantity_on_hand) }})</option>
          </select>
        </div>
        <div><label class="input-label">Quantity *</label><input v-model.number="disposalForm.quantity" type="number"
            min="0" class="input-field" /></div>
        <div>
          <label class="input-label">Reason *</label>
          <select v-model="disposalForm.disposal_reason" class="input-field">
            <option value="">Select reason…</option>
            <option v-for="r in DISPOSAL_REASONS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div>
          <label class="input-label">Method *</label>
          <select v-model="disposalForm.disposal_method" class="input-field">
            <option value="">Select method…</option>
            <option v-for="m in DISPOSAL_METHODS" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="input-label">Witness</label>
          <SearchSelect v-model="disposalForm.witnessed_by_id" :options="users" option-value="id"
            :option-label="(u) => u.full_name" :option-subtitle="(u) => u.role?.name" placeholder="Select witness…"
            search-placeholder="Search users…" server-filter
            @change="(u) => (disposalForm.witness_name = u ? u.full_name : '')" @search="onWitnessSearch" />
          <p v-if="disposalForm.witness_name" class="text-xs sm:text-sm text-on-surface-variant mt-1">Witness: {{
            disposalForm.witness_name }}</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="modal.disposal = false">Cancel</button>
        <button class="btn-danger" :disabled="busy" @click="submitDisposal"><font-awesome-icon
            :icon="['fas', 'trash-can']" /><span>{{ busy ? 'Saving…' : 'Report disposal' }}</span></button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

const route = useRoute()
const uuid = computed(() => String(route.params.uuid))

const inv = useInventory()
const auth = useAuthStore()
const can = (p: string) => auth.can(p)
const canAnyAction = computed(() => can('inventory_management') || can('inventory_pricing') || can('inventory_stock'))

// ── feedback ────────────────────────────────────────────────────────────────
const feedback = reactive<{ msg: string; kind: 'success' | 'error' | '' }>({ msg: '', kind: '' })
const flash = (msg: string, kind: 'success' | 'error' = 'success') => {
  feedback.msg = msg; feedback.kind = kind
  if (kind === 'success') setTimeout(() => { if (feedback.msg === msg) feedback.msg = '' }, 4000)
}

// ── data ─────────────────────────────────────────────────────────────────────
const item = ref<any>(null)
const stock = ref<any>({ central: [], departments: [] })
const types = ref<any[]>([])
const countries = ref<any[]>([])
const loading = ref(true)
const { showSkeleton } = useDelayedLoading(loading)

const loadItem = async () => { item.value = await inv.showItem(uuid.value) }
const loadStock = async () => { stock.value = await inv.showStock(uuid.value) }
const loadTypes = async () => { const r = await inv.getTypes(); types.value = r?.data ?? [] }
const loadCountries = async () => { countries.value = (await inv.getCountries()) ?? [] }

// ── departments + sub-departments (allocate modal) ───────────────────────────
const departmentsList = ref<any[]>([])
const subDepartments = ref<any[]>([])
const loadDepartments = async () => { try { departmentsList.value = (await inv.getDepartments()) ?? [] } catch { /* ignore */ } }
const loadSubDepartments = async (deptUuid: string) => {
  subDepartments.value = []
  if (!deptUuid) return
  try { const d = await inv.showDepartment(deptUuid); subDepartments.value = d?.sub_departments ?? [] } catch { subDepartments.value = [] }
}


// ── users (disposal witness) ─────────────────────────────────────────────────
const users = ref<any[]>([])
const loadUsers = async (q = '') => { try { const r = await inv.getUsers(q ? { q } : {}); users.value = r?.users ?? [] } catch { /* ignore */ } }
const onWitnessSearch = (q: string) => loadUsers(q)

const refresh = async () => {
  loading.value = true
  try { await Promise.all([loadItem(), loadStock()]) }
  catch (e: any) { flash(e.message || 'Failed to load item', 'error') }
  finally { loading.value = false }
}

onMounted(async () => {
  await refresh()
  loadTypes(); loadCountries(); loadDepartments()
})

const defaultCurrencyId = computed(() => {
  const mwk = countries.value.find((c: any) => c.currency_code === 'MWK')
  return mwk ? String(mwk.id) : ''
})

const central = computed(() => stock.value?.central ?? [])
const departments = computed(() => stock.value?.departments ?? [])

// ── expired central batches (header alert + tab filter) ─────────────────────
const expiredCentral = computed(() => central.value.filter((b: any) => b.expired))   // expired === true from loadStock
const centralExpiredOnly = ref(false)                                                 // "show expired only" toggle
const centralRows = computed(() =>                                                    // rows rendered in the central table
  centralExpiredOnly.value ? expiredCentral.value : central.value)
// header badge → open Central store and pre-filter to the expired batches
const goToExpired = () => {
  closeMenus()                        // runtime-safe: closeMenus is initialised before this ever fires
  centralExpiredOnly.value = true
  activeTab.value = 'central'
}

// ── derived stock views — sourced from the nested usage/damaged/disposed on each department row ──
const usedStock = computed(() => departments.value.filter((d: any) => Number(d.usage?.quantity) > 0))
const damagedStock = computed(() => departments.value.filter((d: any) => Number(d.damaged?.quantity) > 0))
const disposedStock = computed(() => departments.value.filter((d: any) => Number(d.disposed?.quantity) > 0))

// ── tabs ──────────────────────────────────────────────────────────────────────
type TabKey = 'details' | 'pricing' | 'central' | 'departments' | 'used' | 'damaged' | 'disposed'
const tabs = computed<{ key: TabKey; label: string; icon: string; count: number | null }[]>(() => [
  { key: 'details', label: 'Details', icon: 'circle-info', count: null },
  { key: 'pricing', label: 'Price history', icon: 'tag', count: item.value?.price_history?.length ?? null },
  { key: 'central', label: 'Central store', icon: 'warehouse', count: central.value.length || null },
  { key: 'departments', label: 'Department holdings', icon: 'building', count: departments.value.length || null },
  { key: 'used', label: 'Used stock', icon: 'arrow-trend-down', count: usedStock.value.length || null },
  { key: 'damaged', label: 'Damaged stock', icon: 'triangle-exclamation', count: damagedStock.value.length || null },
  { key: 'disposed', label: 'Disposed stock', icon: 'trash-can', count: disposedStock.value.length || null },
])
const activeTab = ref<TabKey>('details')

// attribute rows that actually have a value
const attributes = computed(() => {
  if (!item.value) return []
  const rows: Array<[string, any]> = [
    ['Generic name', item.value.generic_name],
    ['Brand name', item.value.brand_name],
    ['Strength', item.value.strength],
    ['Dosage form', item.value.dosage_form],
    ['Dosage', item.value.dosage],
    ['Route', item.value.route],
    ['Frequency', item.value.frequency],
    ['ATC code', item.value.atc_code],
    ['Manufacturer', item.value.manufacturer],
    ['Unit of measure', item.value.unit_of_measure],
    ['Pack size', item.value.pack_size],
    ['Shelf life (days)', item.value.shelf_life_days],
    ['Reorder level', fmtQty(item.value.reorder_level)],
    ['Reorder quantity', fmtQty(item.value.reorder_quantity)],
    ['Minimum stock', fmtQty(item.value.minimum_stock_level)],
    ['Maximum stock', item.value.maximum_stock_level == null ? null : fmtQty(item.value.maximum_stock_level)],
    ['Description', item.value.description],
  ]
  return rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
})

// ── dropdown menus (header + per-row) ───────────────────────────────────────
const headerMenu = ref(false)
const rowMenu = reactive<{ open: boolean; x: number; y: number; row: any | null; kind: TabKey | '' }>({
  open: false, x: 0, y: 0, row: null, kind: ''
})
const openRowMenu = (e: MouseEvent, row: any, kind: TabKey) => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  rowMenu.x = Math.max(8, r.right - 200); rowMenu.y = r.bottom + 6
  rowMenu.row = row; rowMenu.kind = kind; rowMenu.open = true
  headerMenu.value = false; printPicker.open = false
}
const closeMenus = () => { headerMenu.value = false; rowMenu.open = false; printPicker.open = false }
onMounted(() => { document.addEventListener('click', closeMenus); window.addEventListener('scroll', closeMenus, true) })
onBeforeUnmount(() => { document.removeEventListener('click', closeMenus); window.removeEventListener('scroll', closeMenus, true) })

// ── PRINT BATCH NUMBER (QR / Barcode) ───────────────────────────────────────
const printPicker = reactive<{ open: boolean; x: number; y: number; batchNo: string }>({
  open: false, x: 0, y: 0, batchNo: ''
})
const openPrintPicker = (e: MouseEvent, batchNo: string) => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  printPicker.x = Math.max(8, r.right - 200); printPicker.y = r.bottom + 6
  printPicker.batchNo = batchNo; printPicker.open = true
  headerMenu.value = false; rowMenu.open = false
}

const openPrintPickerFromRow = () => {
  printPicker.x = rowMenu.x; printPicker.y = rowMenu.y
  printPicker.batchNo = rowMenu.row?.batch_no ?? ''
  rowMenu.open = false; printPicker.open = true
}

const printBatch = async (format: 'qr' | 'barcode') => {
  const batchNo = printPicker.batchNo
  printPicker.open = false
  if (!batchNo) return

  let imgMarkup = ''
  if (format === 'qr') {
    const dataUrl = await QRCode.toDataURL(batchNo, { width: 260, margin: 1 })
    imgMarkup = `<img src="${dataUrl}" alt="QR code" />`
  } else {
    const svgNs = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(svgNs, batchNo, { format: 'CODE128', width: 2, height: 80, displayValue: true, fontSize: 16, margin: 8 })
    imgMarkup = new XMLSerializer().serializeToString(svgNs)
  }

  const win = window.open('', '_blank', 'width=1024,height=720')
  if (!win) { flash('Pop-up blocked — allow pop-ups to print', 'error'); return }
  win.document.write(`
    <html>
      <head>
        <title>Batch ${batchNo}</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; flex-direction: column;
                 align-items: center; justify-content: center; height: 100vh; margin: 0; gap: 12px; }
          img, svg { max-width: 280px; }
          p { font-weight: 700; font-size: 14px; letter-spacing: 0.05em; }
        </style>
      </head>
      <body>
        ${imgMarkup}
        <p>${batchNo}</p>
        <script>
          window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
        <\/script>
      </body>
    </html>
  `)
  win.document.close()
}

// ── modal visibility ───────────────────────────────────────────────────────
const modal = reactive({ edit: false, price: false, capture: false, allocate: false, damage: false, disposal: false })
const busy = ref(false)
const closeAll = () => Object.keys(modal).forEach(k => (modal[k as keyof typeof modal] = false))

// ── EDIT ──────────────────────────────────────────────────────────────────
const editForm = reactive<Record<string, any>>({})
const openEdit = () => {
  Object.assign(editForm, {
    inventory_type_id: item.value.type?.id ?? '',
    code: item.value.code ?? '', name: item.value.name ?? '', barcode: item.value.barcode ?? '',
    description: item.value.description ?? '', generic_name: item.value.generic_name ?? '',
    brand_name: item.value.brand_name ?? '', strength: item.value.strength ?? '',
    dosage_form: item.value.dosage_form ?? '', dosage: item.value.dosage ?? '',
    route: item.value.route ?? '', frequency: item.value.frequency ?? '', atc_code: item.value.atc_code ?? '',
    unit_of_measure: item.value.unit_of_measure ?? '', pack_size: item.value.pack_size ?? '',
    manufacturer: item.value.manufacturer ?? '', shelf_life_days: item.value.shelf_life_days ?? '',
    reorder_level: item.value.reorder_level ?? '', reorder_quantity: item.value.reorder_quantity ?? '',
    minimum_stock_level: item.value.minimum_stock_level ?? '', maximum_stock_level: item.value.maximum_stock_level ?? '',
    is_billable: !!item.value.is_billable, requires_prescription: !!item.value.requires_prescription, is_controlled_substance: !!item.value.is_controlled_substance,
  })
  modal.edit = true
}
const submitEdit = async () => {
  busy.value = true
  try { await inv.updateItem(uuid.value, { ...editForm }); flash('Item updated'); closeAll(); await loadItem() }
  catch (e: any) { flash(e.message || 'Update failed', 'error') }
  finally { busy.value = false }
}

// ── PRICE (two-step: set → approve) ─────────────────────────────────────────
const priceForm = reactive<Record<string, any>>({ currency_id: '', amount: '', effective_from: '' })
const priceStep = ref<1 | 2>(1)
const pendingPrice = ref<any>(null)
const openPrice = () => {
  Object.assign(priceForm, { currency_id: defaultCurrencyId.value, amount: '', effective_from: new Date().toISOString().slice(0, 10) })
  priceStep.value = 1; pendingPrice.value = null; modal.price = true
}
const submitPrice = async () => {
  if (!priceForm.currency_id || !priceForm.amount) { flash('Currency and amount required', 'error'); return }
  busy.value = true
  try {
    const res = await inv.setPrice(uuid.value, { ...priceForm })
    pendingPrice.value = res                 // { uuid, amount, currency, effective_from, is_approved, ... }
    priceStep.value = 2                      // keep modal open → approval step
    flash('Price saved — pending approval')
    await loadItem()
  } catch (e: any) { flash(e.message || 'Set price failed', 'error') }
  finally { busy.value = false }
}
const approvePendingPrice = async () => {
  if (!pendingPrice.value?.uuid) { flash('Missing price reference', 'error'); return }
  busy.value = true
  try {
    await inv.approvePrice(uuid.value, pendingPrice.value.uuid)
    flash('Price approved'); closeAll(); priceStep.value = 1; pendingPrice.value = null; await loadItem()
  } catch (e: any) { flash(e.message || 'Approve failed', 'error') }
  finally { busy.value = false }
}
const finishPriceLater = () => { closeAll(); priceStep.value = 1; pendingPrice.value = null }
// approve an existing pending price from the history tab
const approvePriceRow = async (priceUuid: string) => {
  busy.value = true
  try { await inv.approvePrice(uuid.value, priceUuid); flash('Price approved'); await loadItem() }
  catch (e: any) { flash(e.message || 'Approve failed', 'error') }
  finally { busy.value = false }
}

// ── CAPTURE STOCK ───────────────────────────────────────────────────────────
const captureForm = reactive<Record<string, any>>({})
const openCapture = () => {
  const today = new Date().toISOString().slice(0, 10)
  Object.assign(captureForm, {
    batch_no: '', grn_number: '', supplier: '', quantity_received: '', quantity_available: '', unit_cost: '',
    currency_id: defaultCurrencyId.value, manufacture_date: '', expiry_date: '', received_date: today,
  })
  modal.capture = true
}
const submitCapture = async () => {
  if (!captureForm.batch_no || !captureForm.quantity_received) { flash('Batch no and quantity required', 'error'); return }
  busy.value = true
  try {
    const payload = { ...captureForm }
    if (!payload.quantity_available) payload.quantity_available = payload.quantity_received
    await inv.captureStock(uuid.value, payload)
    flash('Stock captured'); closeAll(); await loadStock()
  } catch (e: any) { flash(e.message || 'Capture failed', 'error') }
  finally { busy.value = false }
}

// ── ALLOCATE STOCK ───────────────────────────────────────────────────────────
const allocForm = reactive<Record<string, any>>({})
watch(() => allocForm.department_uuid, (u) => { allocForm.sub_department_uuid = ''; loadSubDepartments(u) })
const openAllocate = (batchNo = '') => {
  Object.assign(allocForm, { inventory_stock_batch_no: batchNo, department_uuid: '', sub_department_uuid: '', quantity: '' })
  modal.allocate = true
}
const submitAllocate = async () => {
  if (!allocForm.inventory_stock_batch_no || !allocForm.department_uuid || !allocForm.quantity) { flash('Batch, department and quantity required', 'error'); return }
  busy.value = true
  try { await inv.allocateStock(uuid.value, { ...allocForm }); flash('Stock allocated'); closeAll(); await loadStock() }
  catch (e: any) { flash(e.message || 'Allocation failed', 'error') }
  finally { busy.value = false }
}

// ── REPORT DAMAGE ─────────────────────────────────────────────────────────────
const DAMAGE_REASONS = ['BREAKAGE', 'SPILLAGE', 'CONTAMINATION', 'EXPIRED', 'TEMPERATURE_EXCURSION', 'OTHER']
const damageForm = reactive<Record<string, any>>({})
const openDamage = (batchNo = '') => {
  Object.assign(damageForm, { department_inventory_stock_batch_no: batchNo, quantity: '', damage_reason: '', damage_notes: '' })
  modal.damage = true
}
const submitDamage = async () => {
  if (!damageForm.department_inventory_stock_batch_no || !damageForm.quantity || !damageForm.damage_reason) { flash('Batch, quantity and reason required', 'error'); return }
  busy.value = true
  try {
    const res = await inv.reportDamage(uuid.value, { ...damageForm })
    if (res?.uuid) sessionAdjustments.value.unshift({ kind: 'damage', department: departmentForBatch(damageForm.department_inventory_stock_batch_no), batch_no: damageForm.department_inventory_stock_batch_no, ...res })
    flash('Damage reported — awaiting approval'); closeAll(); await loadStock(); activeTab.value = 'damaged'
  } catch (e: any) { flash(e.message || 'Damage report failed', 'error') }
  finally { busy.value = false }
}

// ── REPORT DISPOSAL ────────────────────────────────────────────────────────────
const DISPOSAL_REASONS = ['EXPIRED', 'DAMAGED', 'RECALLED', 'CONTAMINATED', 'OBSOLETE']
const DISPOSAL_METHODS = ['INCINERATION', 'RETURN_TO_SUPPLIER', 'AUTHORIZED_DISPOSAL', 'LANDFILL']
const disposalForm = reactive<Record<string, any>>({})
const openDisposal = (batchNo = '') => {
  Object.assign(disposalForm, { department_inventory_stock_batch_no: batchNo, quantity: '', disposal_reason: '', disposal_method: '', witnessed_by_id: '', witness_name: '' })
  loadUsers(); modal.disposal = true
}
const submitDisposal = async () => {
  if (!disposalForm.department_inventory_stock_batch_no || !disposalForm.quantity || !disposalForm.disposal_reason || !disposalForm.disposal_method) { flash('Batch, quantity, reason and method required', 'error'); return }
  busy.value = true
  try {
    const res = await inv.reportDisposal(uuid.value, { ...disposalForm })
    if (res?.uuid) sessionAdjustments.value.unshift({ kind: 'disposal', department: departmentForBatch(disposalForm.department_inventory_stock_batch_no), batch_no: disposalForm.department_inventory_stock_batch_no, ...res })
    flash('Disposal reported — awaiting approval'); closeAll(); await loadStock(); activeTab.value = 'disposed'
  } catch (e: any) { flash(e.message || 'Disposal report failed', 'error') }
  finally { busy.value = false }
}

const departmentForBatch = (batchNo: string) => departments.value.find((d: any) => d.batch_no === batchNo)?.department ?? ''

// ── APPROVE ADJUSTMENTS ─────────────────────────────────────────────────────────
const sessionAdjustments = ref<any[]>([])
const approveAdjustmentRow = async (adj: any) => {
  busy.value = true
  try {
    await inv.approveAdjustment(adj.kind, adj.uuid)
    adj.is_approved = true
    flash(`${adj.kind === 'damage' ? 'Damage' : 'Disposal'} approved`); await loadStock()
  } catch (e: any) { flash(e.message || 'Approve failed', 'error') }
  finally { busy.value = false }
}
</script>

<style scoped>
.detail-page {
  min-height: 100%;
  background: linear-gradient(135deg, #d6e8fa 0%, #aed0f0 100%);
  padding: 1rem;
}

@media (min-width: 768px) {
  .detail-page {
    padding: 1.5rem;
  }
}

.g-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0px 10px 30px rgba(61, 127, 191, 0.08);
  border-radius: 0.75rem;
}

/* 5-colour IBCC ribbon accent edge */
.ribbon-edge::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 5px;
  border-top-left-radius: 0.75rem;
  border-bottom-left-radius: 0.75rem;
  background: linear-gradient(180deg, #3d7fbf 0%, #3dae8c 25%, #e8a33d 50%, #b05fa8 75%, #c0395a 100%);
}

/* ─── Alive tables — per-tab ribbon colour ─────────────────────────────── */
.alive-tbl tbody tr {
  transition: background 0.15s ease;
}

.alive-tbl tbody tr:nth-child(even) {
  background: rgba(25, 28, 30, 0.018);
}

.tbl-blue thead {
  background: linear-gradient(90deg, rgba(61, 127, 191, 0.14), rgba(61, 127, 191, 0.04));
  border-bottom: 2px solid rgba(61, 127, 191, 0.40);
}

.tbl-blue tbody tr:hover {
  background: rgba(61, 127, 191, 0.09);
}

.tbl-teal thead {
  background: linear-gradient(90deg, rgba(61, 174, 140, 0.14), rgba(61, 174, 140, 0.04));
  border-bottom: 2px solid rgba(61, 174, 140, 0.40);
}

.tbl-teal tbody tr:hover {
  background: rgba(61, 174, 140, 0.09);
}

.tbl-amber thead {
  background: linear-gradient(90deg, rgba(232, 163, 61, 0.16), rgba(232, 163, 61, 0.05));
  border-bottom: 2px solid rgba(232, 163, 61, 0.45);
}

.tbl-amber tbody tr:hover {
  background: rgba(232, 163, 61, 0.10);
}

.tbl-purple thead {
  background: linear-gradient(90deg, rgba(176, 95, 168, 0.14), rgba(176, 95, 168, 0.04));
  border-bottom: 2px solid rgba(176, 95, 168, 0.40);
}

.tbl-purple tbody tr:hover {
  background: rgba(176, 95, 168, 0.09);
}

.tbl-red thead {
  background: linear-gradient(90deg, rgba(192, 57, 90, 0.14), rgba(192, 57, 90, 0.04));
  border-bottom: 2px solid rgba(192, 57, 90, 0.40);
}

.tbl-red tbody tr:hover {
  background: rgba(192, 57, 90, 0.09);
}

/* tabs */
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-on-surface-variant, #424656);
  transition: all 0.18s ease;
}

.tab-btn:hover:not(.tab-active) {
  background: rgba(61, 127, 191, 0.08);
}

.tab-active {
  background: linear-gradient(135deg, #5b9bdb 0%, #3d7fbf 100%);
  color: #fff;
  box-shadow: 0 6px 16px rgba(61, 127, 191, 0.25);
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

/* dropdown menus */
.menu-pop {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;
  margin-top: 0.5rem;
  min-width: 190px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.menu-fixed {
  position: fixed;
  z-index: 60;
  min-width: 200px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 0.7rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-on-surface, #191c1e);
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: rgba(61, 127, 191, 0.08);
}
</style>