<!-- app/pages/orders/[uuid].vue -->
<template>
  <div>
    <div class="max-w-[98%] mx-auto flex flex-col gap-5">

      <!-- Breadcrumb (glass pill) -->
      <nav class="g-card inline-flex self-start items-center gap-1 px-2.5 py-1.5 text-xs">
        <NuxtLink to="/orders"
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-ribbon-blue/10 hover:text-ribbon-blue transition-colors">
          <font-awesome-icon :icon="['fas', 'vials']" class="text-[11px]" />
          <span>Laboratory orders</span>
        </NuxtLink>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
        <span v-if="order" class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
          <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-[11px] text-ribbon-blue" />
          <span class="font-mono">{{ order.accession_number }}</span>
        </span>
      </nav>

      <!-- Loading -->
      <div v-if="loading" class="g-card flex flex-col items-center justify-center gap-3 py-20">
        <font-awesome-icon :icon="['fas', 'circle-notch']" class="text-3xl text-primary animate-spin" />
        <p class="text-sm text-on-surface-variant">Loading order…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="g-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div class="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
          <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-2xl text-error" />
        </div>
        <p class="text-sm text-on-surface-variant max-w-md">{{ error }}</p>
        <div class="flex gap-2">
          <NuxtLink to="/orders" class="pager-btn !w-auto !h-auto !rounded-lg !px-3 !py-2 gap-2 text-sm font-semibold">
            <font-awesome-icon :icon="['fas', 'arrow-left']" /><span>Back to orders</span>
          </NuxtLink>
          <button type="button" class="pager-btn !w-auto !h-auto !rounded-lg !px-3 !py-2 gap-2 text-sm font-semibold"
            @click="load">
            <font-awesome-icon :icon="['fas', 'rotate-right']" /><span>Retry</span>
          </button>
        </div>
      </div>

      <!-- Order -->
      <template v-else-if="order">

        <!-- Header (g-card, gradient icon tile — matches department.vue) -->
        <header
          class="g-card relative z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 sm:px-8 py-5 sm:py-6">
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="w-12 h-12 bg-primary-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
              <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-xl" />
            </div>
            <div class="min-w-0">
              <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider">Accession</p>
              <h1 class="text-xl sm:text-2xl font-bold text-on-surface break-words font-mono">{{ order.accession_number
                }}</h1>
              <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5 break-words">
                <span class="font-semibold text-on-surface">{{ order.patient_name }}</span>
                <span v-if="order.age != null || order.gender" class="text-outline">
                  · {{ [order.age != null ? `${order.age}y` : null, order.gender].filter(Boolean).join(' · ') }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
              :class="statusPillClass(order.status)">
              {{ titleCase(order.status) }}
            </span>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap uppercase"
              :class="urgencyClass(order.urgency)">
              {{ order.urgency || '—' }}
            </span>

            <!-- Advanced options -->
            <div class="relative">
              <button type="button" class="adv-toggle" @click="advOpen = !advOpen">
                <font-awesome-icon :icon="['fas', 'sliders']" />
                <span class="hidden sm:inline">Actions</span>
                <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[0.65rem] transition-transform"
                  :class="advOpen ? 'rotate-180' : ''" />
              </button>
              <div v-if="advOpen" class="fixed inset-0 z-40" @click="advOpen = false" />
              <div v-if="advOpen"
                class="absolute right-0 top-full mt-2 w-64 rounded-xl bg-surface-lowest shadow-island border border-outline-variant/40 py-1 z-50">

                <!-- 1. Update — always available -->
                <button type="button" class="adv-item" @click="openUpdate(); advOpen = false">
                  <font-awesome-icon :icon="['fas', 'pen-to-square']" class="text-ribbon-blue" />
                  <span>Update order</span>
                </button>

                <div class="my-1 h-px bg-outline-variant/40" />
                <p class="px-3 pt-1 pb-0.5 text-[9px] font-bold text-outline uppercase tracking-wider">Pre-analytic</p>

                <!-- 2. Receive — only while RECEPTION is pending -->
                <button type="button" class="adv-item" :disabled="!canReceive"
                  :title="gateReason('RECEPTION', ['pending'])"
                  :class="{ 'opacity-40 cursor-not-allowed': !canReceive }"
                  @click="canReceive && (receiveOpen = true, advOpen = false)">
                  <font-awesome-icon :icon="['fas', 'inbox']" class="text-ribbon-amber" />
                  <span>Receive order</span>
                  <span v-if="stationStatus('RECEPTION') === 'completed'"
                    class="ml-auto text-[9px] font-bold text-ribbon-teal">DONE</span>
                  <span v-else-if="canReceive" class="ml-auto text-[9px] font-bold text-ribbon-amber">PENDING</span>
                </button>

                <!-- 3. Collect — only after RECEPTION completed -->
                <button type="button" class="adv-item" :disabled="!canCollect"
                  :title="canCollect ? '' : (stationStatus('RECEPTION') === 'pending' ? 'Receive the order first' : gateReason('RECEPTION', ['completed']))"
                  :class="{ 'opacity-40 cursor-not-allowed': !canCollect }"
                  @click="canCollect && (openCollect(), advOpen = false)">
                  <font-awesome-icon :icon="['fas', 'droplet']" class="text-ribbon-teal" />
                  <span>Collect specimen</span>
                  <span v-if="stationStatus('GROSSING') === 'completed'"
                    class="ml-auto text-[9px] font-bold text-ribbon-teal">DONE</span>
                </button>

                <div class="my-1 h-px bg-outline-variant/40" />
                <p class="px-3 pt-1 pb-0.5 text-[9px] font-bold text-outline uppercase tracking-wider">Sign-out</p>

                <!-- 4. Complete report — while REPORTING is pending/in_progress -->
                <button type="button" class="adv-item" :disabled="!canCompleteReport"
                  :title="gateReason('REPORTING', ['pending', 'in_progress'])"
                  :class="{ 'opacity-40 cursor-not-allowed': !canCompleteReport }"
                  @click="canCompleteReport && (openReport(), advOpen = false)">
                  <font-awesome-icon :icon="['fas', 'file-signature']" class="text-ribbon-teal" />
                  <span>Complete report</span>
                  <span v-if="stationStatus('REPORTING') === 'completed'"
                    class="ml-auto text-[9px] font-bold text-ribbon-teal">DONE</span>
                  <span v-else-if="canCompleteReport"
                    class="ml-auto text-[9px] font-bold text-ribbon-amber">PENDING</span>
                </button>

                <!-- 5. Release — while RELEASE is pending/planned -->
                <button type="button" class="adv-item" :disabled="!canReleaseReport"
                  :title="gateReason('RELEASE', ['pending', 'planned', 'in_progress'])"
                  :class="{ 'opacity-40 cursor-not-allowed': !canReleaseReport }"
                  @click="canReleaseReport && (openRelease(), advOpen = false)">
                  <font-awesome-icon :icon="['fas', 'paper-plane']" class="text-ribbon-purple" />
                  <span>Release report</span>
                  <span v-if="stationStatus('RELEASE') === 'completed'"
                    class="ml-auto text-[9px] font-bold text-ribbon-teal">DONE</span>
                  <span v-else-if="canReleaseReport"
                    class="ml-auto text-[9px] font-bold text-ribbon-purple">READY</span>
                </button>

                <div class="my-1 h-px bg-outline-variant/40" />

                <!-- 6. Delete — always available (guarded by its own confirm modal) -->
                <button type="button" class="adv-item" @click="openVoid(); advOpen = false">
                  <font-awesome-icon :icon="['fas', 'trash-can']" class="text-ribbon-red" />
                  <span>Delete order</span>
                </button>

                <button type="button" class="adv-item"
                  @click="printLabel(order?.accession_number, order?.accession_number)">
                  <font-awesome-icon :icon="['fas', 'barcode']" class="text-ribbon-blue" />
                  <span>Print Order barcode</span>
                </button>

              </div>
            </div>
          </div>
        </header>

        <!-- KPI ribbon strip -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-blue">
            <p class="text-[10px] text-ribbon-blue font-bold uppercase tracking-wider mb-2">Tests</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ order.tests?.length ?? 0 }}</p>
          </div>
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-amber">
            <p class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider mb-2">Blocks</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ counts.blocks }}</p>
          </div>
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-teal">
            <p class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-2">Slides</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ counts.slides }}</p>
          </div>
          <div class="g-card p-5 sm:p-6 border-l-4 border-ribbon-red bg-ribbon-red/5">
            <p class="text-[10px] text-ribbon-red font-bold uppercase tracking-wider mb-2">TAT breached</p>
            <p class="text-2xl sm:text-3xl font-extrabold text-on-surface">{{ counts.breached }}</p>
          </div>
        </div>

        <!-- Tabs (pill row inside a g-card) -->
        <div class="g-card p-2 flex gap-1 self-start">
          <button type="button" class="tab-pill" :class="{ 'tab-pill-active': tab === 'general' }"
            @click="tab = 'general'">
            <font-awesome-icon :icon="['fas', 'circle-info']" class="text-[11px]" />
            <span>General</span>
          </button>
          <button type="button" class="tab-pill" :class="{ 'tab-pill-active': tab === 'tests' }" @click="tab = 'tests'">
            <font-awesome-icon :icon="['fas', 'vial']" class="text-[11px]" />
            <span>Tests</span>
            <span class="tab-count">{{ order.tests?.length || 0 }}</span>
          </button>
        </div>

        <!-- ══ General tab ══ -->
        <div v-show="tab === 'general'" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

            <!-- Left column: Order details + Notes stacked together -->
            <div class="flex flex-col gap-5 lg:col-span-2">

              <!-- Order details -->
              <div class="g-card p-6 sm:p-8">
                <div class="flex items-center gap-3 mb-6">
                  <div
                    class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
                    <font-awesome-icon :icon="['fas', 'clipboard-list']" />
                  </div>
                  <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Order details</h3>
                </div>

                <!-- Specimen & collection — teal -->
                <section class="mb-6">
                  <h4
                    class="text-[10px] text-ribbon-teal font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <font-awesome-icon :icon="['fas', 'flask-vial']" class="text-[10px]" />
                    Specimen &amp; collection
                  </h4>
                  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div v-for="f in specimenFields" :key="f.label"
                      class="flex items-start gap-3 p-3 rounded-xl bg-ribbon-teal/5 border border-ribbon-teal/15">
                      <div
                        class="w-8 h-8 rounded-lg bg-ribbon-teal/15 flex items-center justify-center text-ribbon-teal shrink-0">
                        <font-awesome-icon :icon="f.icon" class="text-xs" />
                      </div>
                      <div class="min-w-0">
                        <dt class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{{ f.label }}
                        </dt>
                        <dd class="text-sm font-semibold text-on-surface break-words">{{ f.value || '—' }}</dd>
                      </div>
                    </div>
                  </dl>
                </section>

                <!-- Scheduling & disposition — amber -->
                <section class="mb-6">
                  <h4
                    class="text-[10px] text-ribbon-amber font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <font-awesome-icon :icon="['fas', 'calendar-days']" class="text-[10px]" />
                    Scheduling &amp; disposition
                  </h4>
                  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div v-for="f in schedulingFields" :key="f.label"
                      class="flex items-start gap-3 p-3 rounded-xl bg-ribbon-amber/5 border border-ribbon-amber/15">
                      <div
                        class="w-8 h-8 rounded-lg bg-ribbon-amber/15 flex items-center justify-center text-ribbon-amber shrink-0">
                        <font-awesome-icon :icon="f.icon" class="text-xs" />
                      </div>
                      <div class="min-w-0">
                        <dt class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{{ f.label }}
                        </dt>
                        <dd class="text-sm font-semibold text-on-surface break-words">{{ f.value || '—' }}</dd>
                      </div>
                    </div>
                  </dl>
                </section>

                <!-- Referral & personnel — purple -->
                <section>
                  <h4
                    class="text-[10px] text-ribbon-purple font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <font-awesome-icon :icon="['fas', 'user-doctor']" class="text-[10px]" />
                    Referral &amp; personnel
                  </h4>
                  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div v-for="f in personnelFields" :key="f.label"
                      class="flex items-start gap-3 p-3 rounded-xl bg-ribbon-purple/5 border border-ribbon-purple/15">
                      <div
                        class="w-8 h-8 rounded-lg bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple shrink-0">
                        <font-awesome-icon :icon="f.icon" class="text-xs" />
                      </div>
                      <div class="min-w-0">
                        <dt class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{{ f.label }}
                        </dt>
                        <dd class="text-sm font-semibold text-on-surface break-words">{{ f.value || '—' }}</dd>
                      </div>
                    </div>
                  </dl>
                </section>

                <!-- Clinical details -->
                <template v-if="clinicalEntries.length">
                  <h4
                    class="text-[10px] text-ribbon-red font-bold uppercase tracking-wider mt-6 mb-3 flex items-center gap-1.5">
                    <font-awesome-icon :icon="['fas', 'notes-medical']" class="text-[10px]" />
                    Clinical details
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="[k, v] in clinicalEntries" :key="k"
                      class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ribbon-red/10 text-ribbon-red border border-ribbon-red/20">
                      {{ titleCase(k) }}: {{ v }}
                    </span>
                  </div>
                </template>
              </div>

              <!-- Notes -->
              <div v-if="order.notes?.length" class="g-card p-6 sm:p-8">
                <div class="flex items-center gap-3 mb-5">
                  <div
                    class="w-10 h-10 rounded-full bg-ribbon-purple/15 flex items-center justify-center text-ribbon-purple">
                    <font-awesome-icon :icon="['fas', 'notes-medical']" />
                  </div>
                  <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Notes</h3>
                  <span
                    class="ml-auto text-[11px] font-bold text-ribbon-purple bg-ribbon-purple/10 px-2.5 py-1 rounded-full">
                    {{ order.notes.length }}
                  </span>
                </div>
                <ol class="space-y-4">
                  <li v-for="(n, i) in order.notes" :key="n.uuid || i" class="relative pl-7">
                    <span
                      class="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-ribbon-purple ring-4 ring-ribbon-purple/15" />
                    <span v-if="i < order.notes.length - 1"
                      class="absolute left-[4.5px] top-5 bottom-[-1rem] w-px bg-outline-variant/30" />
                    <div class="p-4 rounded-xl bg-white/60 border border-outline-variant/20">
                      <div class="note-prose text-sm text-on-surface break-words"
                        v-html="sanitizeNoteHtml(noteText(n))" />
                    </div>
                  </li>
                </ol>
              </div>

            </div>

            <!-- Right column: Workflow — no scroll, timeline fills the full card height -->
            <div class="g-card p-6 lg:col-span-1 flex flex-col">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-full bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue">
                  <font-awesome-icon :icon="['fas', 'timeline']" />
                </div>
                <h3 class="text-base sm:text-lg font-semibold sm:font-bold">Workflow</h3>
                <span class="ml-auto text-[11px] font-bold text-ribbon-blue bg-ribbon-blue/10 px-2.5 py-1 rounded-full">
                  {{ timeline?.timeline?.length ?? order.encounters?.length ?? 0 }}
                </span>
              </div>

              <ol v-if="timeline?.timeline?.length" class="flex-1">
                <li v-for="(s, i) in timeline.timeline" :key="s.uuid" class="relative pl-7"
                  :class="i < timeline.timeline.length - 1 ? 'pb-5' : ''">
                  <span class="absolute left-0 top-1.5 w-3 h-3 rounded-full ring-4"
                    :class="tatDotClass(s.tat_status)" />
                  <span v-if="i < timeline.timeline.length - 1"
                    class="absolute left-[5.5px] top-5 bottom-0 w-px bg-outline-variant/30" />
                  <div class="p-3 rounded-xl border-l-4 bg-white/50" :class="tatAccent(s.tat_status)">
                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="font-bold text-xs text-on-surface truncate">{{ s.station }}</p>
                        <p class="text-[10px] text-outline font-mono">{{ s.code }} · seq {{ s.sequence }}</p>
                      </div>
                      <div class="flex flex-col items-end gap-1 shrink-0">
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase whitespace-nowrap"
                          :class="statusPillClass(s.status)">{{ titleCase(s.status) }}</span>
                        <span v-if="s.tat_status"
                          class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase whitespace-nowrap"
                          :class="tatChip(s.tat_status)">{{ titleCase(s.tat_status) }}</span>
                      </div>
                    </div>
                    <p class="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1.5">
                      <font-awesome-icon :icon="['fas', 'clock']" class="opacity-70 text-[10px]" />
                      <span>Due {{ fmtDate(s.due_at) }}</span>
                    </p>
                    <p v-if="s.performed_by" class="text-[11px] text-outline">By {{ s.performed_by }}</p>
                    <p v-if="s.ended_at" class="text-[11px] text-outline">
                      Completed {{ fmtDate(s.ended_at) }}
                      <span v-if="s.turnaround_hours != null"> · {{ s.turnaround_hours }}h</span>
                    </p>
                  </div>
                </li>
              </ol>

              <!-- Fallback: legacy encounter list if timeline hasn't returned -->
              <ol v-else-if="order.encounters?.length" class="flex-1">
                <li v-for="(e, i) in order.encounters" :key="e.uuid" class="relative pl-7"
                  :class="i < order.encounters.length - 1 ? 'pb-5' : ''">
                  <span class="absolute left-0 top-1.5 w-3 h-3 rounded-full ring-4"
                    :class="tatDotClass(e.tat_status || e.status)" />
                  <span v-if="i < order.encounters.length - 1"
                    class="absolute left-[5.5px] top-5 bottom-0 w-px bg-outline-variant/30" />
                  <div class="p-3 rounded-xl border-l-4 bg-white/50" :class="tatAccent(e.tat_status)">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-bold text-xs text-on-surface">{{ titleCase(e.type) }}</span>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase whitespace-nowrap"
                        :class="tatChip(e.tat_status)">{{ titleCase(e.tat_status || e.status) }}</span>
                    </div>
                    <p class="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1.5">
                      <font-awesome-icon :icon="['fas', 'clock']" class="opacity-70 text-[10px]" />
                      <span>Due {{ fmtDate(e.due_at) }}</span>
                    </p>
                    <p v-if="e.performed_by" class="text-[11px] text-outline">By {{ e.performed_by }}</p>
                  </div>
                </li>
              </ol>

              <div v-else class="flex-1 flex items-center justify-center">
                <p class="text-sm text-on-surface-variant text-center">No workflow stations yet.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- ══ Tests tab ══ -->
        <div v-show="tab === 'tests'">
          <div class="g-card p-6 sm:p-8">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <h3 class="text-lg sm:text-xl md:text-2xl font-semibold sm:font-bold">Tests</h3>
              <div class="text-xs sm:text-sm text-on-surface-variant">Click a row to open the test</div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm sm:text-base alive-tbl tbl-blue">
                <thead>
                  <tr class="text-[11px] text-on-surface-variant uppercase tracking-widest">
                    <th class="py-4 px-5">Accession</th>
                    <th class="py-4 px-5">Test</th>
                    <th class="py-4 px-5">Code</th>
                    <th class="py-4 px-5">Sample</th>
                    <th class="py-4 px-5 text-center">Blocks / Slides</th>
                    <th class="py-4 px-5 text-center">Status</th>
                    <th class="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/10">
                  <tr v-for="t in order.tests" :key="t.uuid" class="cursor-pointer transition-colors"
                    @click="router.push({ path: `/orders/test/${t.uuid}`, query: { order: order.uuid } })">
                    <td class="py-4 px-5 font-mono text-[11px] text-ribbon-blue whitespace-nowrap border-l-4"
                      :class="rowAccent(t.status)">
                      {{ t.accession_number }}
                    </td>
                    <td class="py-4 px-5">
                      <p class="font-bold break-words">{{ t.test_name }}</p>
                    </td>
                    <td class="py-4 px-5 font-mono text-[11px] text-outline whitespace-nowrap">{{ t.test_code }}</td>
                    <td class="py-4 px-5 text-xs text-on-surface-variant break-words">{{ t.sample_name || '—' }}</td>
                    <td class="py-4 px-5 text-center whitespace-nowrap">
                      <span class="text-xs font-semibold text-ribbon-amber">{{ t.blocks?.length ?? 0 }}</span>
                      <span class="text-outline mx-1">/</span>
                      <span class="text-xs font-semibold text-ribbon-teal">{{ t.slides?.length ?? 0 }}</span>
                    </td>
                    <td class="py-4 px-5 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                        :class="statusPillClass(t.status)">
                        {{ titleCase(t.status) }}
                      </span>
                    </td>

                    <!-- Actions — kebab menu, click never bubbles to the row's own navigate handler -->
                    <td class="py-4 px-5 text-center" @click.stop>
                      <button type="button"
                        class="inline-flex w-8 h-8 rounded-full items-center justify-center leading-none shrink-0 transition-colors test-actions-menu"
                        :class="openTestMenuUuid === t.uuid
                          ? 'bg-ribbon-blue/15 text-ribbon-blue'
                          : 'text-on-surface-variant hover:bg-surface-low hover:text-ribbon-blue'" aria-haspopup="true"
                        :aria-expanded="openTestMenuUuid === t.uuid" :title="`Actions for ${t.accession_number}`"
                        @click.stop="toggleTestMenu(t, $event)">
                        <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" class="text-sm leading-none" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!order.tests?.length">
                    <td colspan="7" class="py-8 text-center text-on-surface-variant">No tests on this order.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tests table row-actions dropdown — teleported to <body> and fixed-positioned
     off the trigger button's own rect, so the table's overflow-x-auto can never
     clip it (the same problem the department/inventory filter-bar dropdowns hit). -->
          <Teleport to="body">
            <Transition name="menu-pop">
              <div v-if="openTestMenuUuid"
                class="fixed w-48 bg-white rounded-xl shadow-island-active border border-outline-variant/20 py-1.5 z-[70] text-left test-actions-menu"
                :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }">
                <!-- pointer arrow — visually anchors the menu to the ellipsis button above it -->
                <div class="absolute -top-1.5 w-3 h-3 bg-white border-t border-l border-outline-variant/20 rotate-45"
                  :style="{ right: menuArrowOffset + 'px' }" />

                <p class="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {{ openTestRow?.accession_number }}
                </p>

                <button type="button" class="adv-item" @click.stop="goToTest(openTestRow)">
                  <span
                    class="w-7 h-7 rounded-lg bg-ribbon-blue/15 flex items-center justify-center text-ribbon-blue shrink-0">
                    <font-awesome-icon :icon="['fas', 'eye']" class="text-xs" />
                  </span>
                  <div class="min-w-0">
                    <p class="font-semibold leading-tight">View test</p>
                    <p class="text-[11px] text-on-surface-variant leading-tight">Open the full test record</p>
                  </div>
                </button>
              </div>
            </Transition>
          </Teleport>
        </div>
      </template>

      <!-- ═══ Update modal ═══ -->
      <Modal v-model="updateOpen" title="Update order" :subtitle="order?.accession_number"
        class="w-[760px] max-w-[70%]">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="input-label">Scheduled for</label>
            <input v-model="uForm.scheduled_for" type="datetime-local" class="input-field" />
          </div>
          <div>
            <label class="input-label">Specimen site</label>
            <SearchSelect v-model="uForm.laboratory_specimen_site_uuid" :options="siteOptions" label-key="label"
              value-key="value" placeholder="Search specimen site…" :clearable="true" />
          </div>
          <div>
            <label class="input-label">Requested by</label>
            <input v-model="uForm.requested_by_name" type="text" class="input-field" />
          </div>
          <div>
            <label class="input-label">Requested by occupation</label>
            <input v-model="uForm.requested_by_occupation" type="text" class="input-field" />
          </div>
          <div>
            <label class="input-label">Referring facility</label>
            <input v-model="uForm.referring_facility" type="text" class="input-field" />
          </div>
          <div>
            <label class="input-label">Referring facility type</label>
            <input v-model="uForm.referring_facility_type" type="text" class="input-field"
              placeholder="e.g. hospital, clinic" />
          </div>
          <div>
            <label class="input-label">Urgency</label>
            <select v-model="uForm.urgency" class="input-field">
              <option value="">—</option>
              <option v-for="u in URGENCY_OPTS" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>
          <div>
            <label class="input-label">Disposition</label>
            <select v-model="uForm.disposition" class="input-field">
              <option value="">—</option>
              <option v-for="d in DISPOSITION_OPTS" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Clinical details</label>
            <ConsultNoteEditor v-model="uForm.clinical_details"
              placeholder="Relevant clinical history, indication, prior findings…" />
          </div>
        </div>
        <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
        <template #footer>
          <button type="button" class="btn-secondary" @click="updateOpen = false">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving" @click="submitUpdate">
            <font-awesome-icon v-if="saving" :icon="['fas', 'circle-notch']" class="animate-spin" />
            <span>Save changes</span>
          </button>
        </template>
      </Modal>

      <!-- ═══ Collect modal ═══ -->
      <Modal v-model="collectOpen" title="Collect specimen" :subtitle="order?.accession_number"
        class="w-[520px] max-w-2xl">
        <div class="space-y-4">
          <div>
            <label class="input-label">Collected at</label>
            <input v-model="cForm.collected_at" type="datetime-local" class="input-field" />
          </div>
          <div>
            <label class="input-label">Specimen site</label>
            <SearchSelect v-model="cForm.laboratory_specimen_site_uuid" :options="siteOptions" label-key="label"
              value-key="value" placeholder="Search specimen site…" :clearable="true" />
          </div>
        </div>
        <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
        <template #footer>
          <button type="button" class="btn-secondary" @click="collectOpen = false">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving" @click="submitCollect">
            <font-awesome-icon v-if="saving" :icon="['fas', 'circle-notch']" class="animate-spin" />
            <span>Mark collected</span>
          </button>
        </template>
      </Modal>

      <!-- ═══ Receive modal ═══ -->
      <Modal v-model="receiveOpen" title="Receive order" :subtitle="order?.accession_number" class="w-[460px] max-w-xl">
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-full bg-ribbon-amber/15 flex items-center justify-center shrink-0">
            <font-awesome-icon :icon="['fas', 'inbox']" class="text-ribbon-amber" />
          </div>
          <p class="text-sm text-on-surface">
            Mark <span class="font-semibold">{{ order?.accession_number }}</span> as received at the laboratory? This
            stamps
            the reception step.
          </p>
        </div>
        <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
        <template #footer>
          <button type="button" class="btn-secondary" @click="receiveOpen = false">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving" @click="submitReceive">
            <font-awesome-icon v-if="saving" :icon="['fas', 'circle-notch']" class="animate-spin" />
            <span>Confirm receive</span>
          </button>
        </template>
      </Modal>

      <!-- ═══ Void modal ═══ -->
      <Modal v-model="voidOpen" title="Delete order" :subtitle="order?.accession_number" class="w-[640px] max-w-[95vw]">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-11 h-11 rounded-full bg-error/10 flex items-center justify-center shrink-0">
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-error" />
          </div>
          <p class="text-sm text-on-surface">
            Void <span class="font-semibold">{{ order?.accession_number }}</span>? This cancels the order and preserves
            the
            audit trail — it cannot be undone.
          </p>
        </div>
        <div>
          <label class="input-label">Reason for voiding <span class="text-error">*</span></label>
          <ConsultNoteEditor v-model="vForm.voided_reason"
            placeholder="Explain why this order is being voided (mis-accession, duplicate, wrong patient, sample rejected…)" />
          <p class="text-xs text-on-surface-variant mt-1">Sent as <code>voided_reason</code>. Required.</p>
        </div>
        <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
        <template #footer>
          <button type="button" class="btn-secondary" @click="voidOpen = false">Cancel</button>
          <button type="button" class="btn-danger" :disabled="saving || !hasVoidReason" @click="submitVoid">
            <font-awesome-icon v-if="saving" :icon="['fas', 'circle-notch']" class="animate-spin" />
            <span>Confirm delete</span>
          </button>
        </template>
      </Modal>

      <!-- ═══ Complete report modal ═══ -->
      <Modal v-model="reportOpen" title="Complete order report" :subtitle="order?.accession_number"
        class="w-[640px] max-w-[95vw]">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-11 h-11 rounded-full bg-ribbon-teal/15 flex items-center justify-center shrink-0">
            <font-awesome-icon :icon="['fas', 'file-signature']" class="text-ribbon-teal" />
          </div>
          <p class="text-sm text-on-surface">
            Finalise and lock the report for <span class="font-semibold">{{ order?.accession_number }}</span>. Add any
            final
            comments below.
          </p>
        </div>
        <div>
          <label class="input-label">Comments</label>
          <ConsultNoteEditor v-model="rForm.comments"
            placeholder="Overall report comment, synopsis, or clinical correlation…" />
        </div>
        <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
        <template #footer>
          <button type="button" class="btn-secondary" @click="reportOpen = false">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving" @click="submitReport">
            <font-awesome-icon v-if="saving" :icon="['fas', 'circle-notch']" class="animate-spin" />
            <span>Complete report</span>
          </button>
        </template>
      </Modal>

      <!-- ═══ Release report modal ═══ -->
      <Modal v-model="releaseOpen" title="Release order report" :subtitle="order?.accession_number"
        class="w-[640px] max-w-[95vw]">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-11 h-11 rounded-full bg-ribbon-purple/15 flex items-center justify-center shrink-0">
            <font-awesome-icon :icon="['fas', 'paper-plane']" class="text-ribbon-purple" />
          </div>
          <p class="text-sm text-on-surface">
            Release the finalised report for <span class="font-semibold">{{ order?.accession_number }}</span> to the
            requesting clinician.
          </p>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="input-label">Released to <span class="text-error">*</span></label>
            <input v-model="lForm.released_to" type="text" class="input-field" placeholder="e.g. Dr Chisomo Phiri" />
          </div>
          <div>
            <label class="input-label">Comments</label>
            <ConsultNoteEditor v-model="lForm.comments"
              placeholder="Release note, delivery instructions, follow-up recommendations…" />
          </div>
        </div>
        <p v-if="formError" class="alert-error mt-4">{{ formError }}</p>
        <template #footer>
          <button type="button" class="btn-secondary" @click="releaseOpen = false">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving || !lForm.released_to.trim()"
            @click="submitRelease">
            <font-awesome-icon v-if="saving" :icon="['fas', 'circle-notch']" class="animate-spin" />
            <span>Release report</span>
          </button>
        </template>
      </Modal>

      <!-- bottom-right progress/result modal -->
      <Transition enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95">
        <div v-if="visible"
          class="fixed bottom-24 right-6 z-50 w-80 rounded-2xl overflow-hidden bg-surface-lowest border border-outline-variant/60 shadow-island">
          <!-- ribbon-colored icon badge + heading -->
          <div class="flex items-center gap-3 px-5 py-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300"
              :class="{
                'bg-ribbon-blue/15 text-ribbon-blue': status === 'loading',
                'bg-ribbon-teal/15 text-ribbon-teal': status === 'success',
                'bg-ribbon-red/15 text-ribbon-red': status === 'error',
              }">
              <font-awesome-icon v-if="status === 'loading'" :icon="['fas', 'print']" class="text-sm animate-pulse" />
              <font-awesome-icon v-else-if="status === 'success'" :icon="['fas', 'check']" class="text-sm" />
              <font-awesome-icon v-else-if="status === 'error'" :icon="['fas', 'triangle-exclamation']"
                class="text-sm" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-on-surface">
                {{ status === 'loading' ? 'Printing label' : status === 'success' ? 'Print complete' : 'Print failed' }}
              </p>
              <p class="text-[11px] text-on-surface-variant truncate">{{ message }}</p>
            </div>

            <button @click="visible = false"
              class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-low transition-colors">
              <font-awesome-icon :icon="['fas', 'xmark']" class="text-xs" />
            </button>
          </div>

          <!-- progress footer -->
          <div class="h-1 w-full bg-surface-low overflow-hidden">
            <div v-if="status === 'loading'"
              class="h-full w-1/3 rounded-full bg-ribbon-blue animate-progress-indeterminate" />
            <div v-else class="h-full transition-all duration-500"
              :class="status === 'success' ? 'bg-ribbon-teal w-full' : 'bg-ribbon-red w-full'" />
          </div>
        </div>
      </Transition>

      <!-- Toast -->
      <Teleport to="body">
        <Transition name="toast">
          <div v-if="toast.show"
            class="fixed bottom-5 right-5 z-[60] px-4 py-3 rounded-xl shadow-island text-sm font-semibold flex items-center gap-2"
            :class="toast.ok ? 'bg-ribbon-teal/15 text-ribbon-teal' : 'bg-error/10 text-error'">
            <font-awesome-icon :icon="['fas', toast.ok ? 'check' : 'triangle-exclamation']" />
            <span>{{ toast.msg }}</span>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted } from 'vue'
import type { LabOrderDetail } from '~/composables/useLaboratory'
import { useLaboratorySettings } from '~/composables/useLaboratorySettings'
const { printLabel, status, message, visible } = usePrintLabel()

const route = useRoute()
const router = useRouter()
const { showOrder, updateOrder, collectOrder, receiveOrder, voidOrder, reportOrder, releaseOrder, getOrderTimeline } = useLaboratory()

const { specimenSites, loaded: settingsLoaded, preload: preloadSettings } = useLaboratorySettings()
onMounted(() => { if (!settingsLoaded.value) preloadSettings() })

const activeSites = computed(() => specimenSites.value.filter(s => s.active))
const siteOptions = computed(() =>
  activeSites.value.map(s => ({
    label: s.body_system ? `${s.name} — ${s.body_system}` : s.name,
    value: s.uuid,
  })),
)

const uuid = computed(() => (route.params.uuid as string) || '')

const order = ref<LabOrderDetail | null>(null)

interface TimelineStation {
  uuid: string
  station: string
  code: string
  sequence: number
  status: 'pending' | 'planned' | 'in_progress' | 'completed' | 'skipped' | string
  test_uuid: string | null
  started_at: string | null
  ended_at: string | null
  due_at: string | null
  tat_status: 'on_time' | 'at_risk' | 'breached' | string | null
  turnaround_hours: number | null
  performed_by: string | null
  verified_by: string | null
}
interface OrderTimeline {
  accession_number: string
  status: string
  timeline: TimelineStation[]
}

const timeline = ref<OrderTimeline | null>(null)

const loading = ref(true)
const error = ref<string | null>(null)

const tab = ref<'general' | 'tests'>('general')
const advOpen = ref(false)

// ── Tests table row actions (kebab menu) ────────────────────────────────
const openTestMenuUuid = ref<string | null>(null)
const menuPos = ref({ top: 0, left: 0 })
const MENU_WIDTH = 192 // px — matches w-44

// The row currently backing the open menu, so the teleported dropdown
// (which no longer lives inside the v-for) can still reach the right test.
const openTestRow = computed(() =>
  order.value?.tests?.find((t: any) => t.uuid === openTestMenuUuid.value) ?? null,
)

const menuArrowOffset = ref(16) // px from the menu's right edge

const toggleTestMenu = (t: { uuid: string }, ev: MouseEvent) => {
  if (openTestMenuUuid.value === t.uuid) {
    openTestMenuUuid.value = null
    return
  }
  const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
  const rawLeft = rect.right - MENU_WIDTH
  const clampedLeft = Math.max(8, rawLeft)
  menuPos.value = { top: rect.bottom + 8, left: clampedLeft }
  // Arrow sits under the button's horizontal center, relative to the menu's
  // right edge — stays correct even when clamping shifted the menu left.
  const buttonCenter = rect.left + rect.width / 2
  menuArrowOffset.value = Math.min(MENU_WIDTH - 20, Math.max(12, clampedLeft + MENU_WIDTH - buttonCenter - 6))
  openTestMenuUuid.value = t.uuid
}

const goToTest = (t: { uuid: string } | null) => {
  if (!t) return
  openTestMenuUuid.value = null
  router.push({ path: `/orders/test/${t.uuid}`, query: { order: order.value?.uuid } })
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (openTestMenuUuid.value && !target.closest?.('.test-actions-menu')) {
      openTestMenuUuid.value = null
    }
  })
  // A fixed-position menu doesn't track scroll — close it rather than let it drift
  // away from the button. `true` = capture phase, so it also catches scrolling
  // inside the table's own overflow-x-auto wrapper (scroll doesn't bubble).
  window.addEventListener('scroll', () => { openTestMenuUuid.value = null }, true)
})

const load = async () => {
  if (!uuid.value) { error.value = 'No order selected.'; loading.value = false; return }
  loading.value = true
  error.value = null
  try {
    const [orderRes, timelineRes] = await Promise.all([
      showOrder(uuid.value),
      getOrderTimeline(uuid.value).catch(() => null),  // timeline is non-fatal
    ])
    order.value = orderRes
    timeline.value = timelineRes
    if (!order.value) error.value = 'Order not found.'
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load the order. Please try again.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// KPI tallies across tests and encounters
const counts = computed(() => {
  const acc = { blocks: 0, slides: 0, breached: 0 }
  for (const t of order.value?.tests ?? []) {
    acc.blocks += t.blocks?.length ?? 0
    acc.slides += t.slides?.length ?? 0
  }
  for (const e of order.value?.encounters ?? []) {
    if ((e.tat_status || '').toLowerCase() === 'breached') acc.breached++
  }
  return acc
})

// ── Timeline-driven action gates ────────────────────────────────────────────
const stationByCode = computed<Record<string, TimelineStation | undefined>>(() => {
  const out: Record<string, TimelineStation | undefined> = {}
  for (const s of timeline.value?.timeline ?? []) out[s.code] = s
  return out
})

const stationStatus = (code: string) => stationByCode.value[code]?.status ?? null

// Business rules:
//  - Reception must be completed BEFORE the user can collect the specimen.
//  - Receive stays available only while RECEPTION is pending.
//  - Complete report is offered while REPORTING is pending.
//  - Release is offered while RELEASE is pending OR planned (after reporting).
const canReceive = computed(() => stationStatus('RECEPTION') === 'pending')
const canCollect = computed(() => stationStatus('RECEPTION') === 'completed'
  && stationStatus('GROSSING') !== 'completed')
const canCompleteReport = computed(() => stationStatus('REPORTING') === 'pending'
  || stationStatus('REPORTING') === 'in_progress')
const canReleaseReport = computed(() => ['pending', 'planned', 'in_progress']
  .includes(stationStatus('RELEASE') ?? ''))

// Reason shown as a tooltip on a disabled item
const gateReason = (code: string, wanted: string[]) => {
  const s = stationStatus(code)
  if (!s) return `Waiting for ${code.toLowerCase()} station to be scheduled`
  if (wanted.includes(s)) return ''
  return `${titleCase(code)} is ${titleCase(s)} — action not available yet`
}

// ── options ──────────────────────────────────────────────────────────────────
const URGENCY_OPTS = ['Low', 'Medium', 'High', 'STAT']
const DISPOSITION_OPTS = ['Dispose', 'Return', 'Retain']

const clinicalEntries = computed(() =>
  Object.entries(order.value?.clinical_details ?? {}).filter(([, v]) => v != null && v !== ''),
)

interface OrderField {
  icon: [string, string]
  label: string
  value: string | number | null | undefined
}

const specimenFields = computed<OrderField[]>(() => [
  { icon: ['fas', 'hospital'], label: 'Department', value: order.value?.department?.name },
  { icon: ['fas', 'layer-group'], label: 'Section', value: order.value?.department?.section },
  { icon: ['fas', 'vial'], label: 'Specimen', value: order.value?.specimen },
  { icon: ['fas', 'location-dot'], label: 'Site', value: order.value?.site },
  { icon: ['fas', 'calendar-check'], label: 'Collection time', value: fmtDate(order.value?.collection_time) },
  { icon: ['fas', 'inbox'], label: 'Reception time', value: fmtDate(order.value?.reception_time) },
])

const schedulingFields = computed<OrderField[]>(() => [
  { icon: ['fas', 'calendar-days'], label: 'Scheduled for', value: fmtDate(order.value?.scheduled_for) },
  { icon: ['fas', 'box-archive'], label: 'Disposition', value: order.value?.disposition },
])

const personnelFields = computed<OrderField[]>(() => [
  { icon: ['fas', 'hospital-user'], label: 'Referring facility', value: order.value?.referring_facility },
  { icon: ['fas', 'user-doctor'], label: 'Requested by', value: order.value?.requested_by },
  { icon: ['fas', 'id-badge'], label: 'Occupation', value: order.value?.requested_by_occupation },
  { icon: ['fas', 'user-check'], label: 'Received by', value: order.value?.received_by },
])

const tatDotClass = (tat: string | null | undefined): string => {
  switch (tat) {
    case 'on_time': return 'bg-ribbon-teal ring-ribbon-teal/20'
    case 'at_risk': return 'bg-ribbon-amber ring-ribbon-amber/20'
    case 'breached': return 'bg-ribbon-red ring-ribbon-red/20'
    default: return 'bg-ribbon-blue ring-ribbon-blue/20'
  }
}

// ── datetime helpers ─────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined)

// ── modal state ──────────────────────────────────────────────────────────────
const updateOpen = ref(false)
const collectOpen = ref(false)
const receiveOpen = ref(false)
const reportOpen = ref(false)
const releaseOpen = ref(false)
const saving = ref(false)
const formError = ref<string | null>(null)

const voidOpen = ref(false)
const vForm = reactive<{ voided_reason: string }>({ voided_reason: '' })

const hasVoidReason = computed(() => {
  const text = (vForm.voided_reason || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()
  return text.length > 0
})

const openVoid = () => { vForm.voided_reason = ''; voidOpen.value = true }

const rForm = reactive<{ comments: string }>({ comments: '' })
const lForm = reactive<{ released_to: string; comments: string }>({ released_to: 'Dr Chisomo Phiri', comments: '' })

const openReport = () => {
  formError.value = null
  rForm.comments = ''
  reportOpen.value = true
}
const openRelease = () => {
  formError.value = null
  lForm.released_to = ''
  lForm.comments = ''
  releaseOpen.value = true
}

const uForm = reactive<Record<string, any>>({
  scheduled_for: '', laboratory_specimen_site_uuid: '',
  requested_by_name: '', requested_by_occupation: '',
  referring_facility: '', referring_facility_type: '',
  urgency: '', disposition: '', clinical_details: '',
})
const cForm = reactive<Record<string, any>>({ collected_at: '', laboratory_specimen_site_uuid: '' })

const openUpdate = () => {
  formError.value = null
  const o = order.value
  if (o) {
    uForm.scheduled_for = toLocalInput(o.scheduled_for)
    uForm.requested_by_name = o.requested_by ?? ''
    uForm.requested_by_occupation = o.requested_by_occupation ?? ''
    uForm.referring_facility = o.referring_facility ?? ''
    uForm.referring_facility_type = ''
    uForm.urgency = o.urgency ?? ''
    uForm.disposition = o.disposition ?? ''
    uForm.laboratory_specimen_site_uuid = ''
    uForm.clinical_details = o.clinical_details?.notes ?? ''
  }
  updateOpen.value = true
}
const openCollect = () => {
  formError.value = null
  cForm.collected_at = toLocalInput(new Date().toISOString())
  cForm.laboratory_specimen_site_uuid = ''
  collectOpen.value = true
}

// ── submit handlers ──────────────────────────────────────────────────────────
const run = async (fn: () => Promise<any>, ok: string, close: () => void) => {
  saving.value = true
  formError.value = null
  try {
    order.value = await fn()
    await load()
    close()
    flash(true, ok)
  } catch (e: any) {
    formError.value = e?.message ?? 'Something went wrong. Please try again.'
  } finally {
    saving.value = false
  }
}

const submitUpdate = () => run(() => updateOrder(uuid.value, {
  laboratory_specimen_site_uuid: uForm.laboratory_specimen_site_uuid || undefined,
  scheduled_for: toIso(uForm.scheduled_for) || undefined,
  requested_by_name: uForm.requested_by_name || undefined,
  requested_by_occupation: uForm.requested_by_occupation || undefined,
  referring_facility: uForm.referring_facility || undefined,
  referring_facility_type: uForm.referring_facility_type || undefined,
  urgency: uForm.urgency || undefined,
  disposition: uForm.disposition || undefined,
  clinical_details: uForm.clinical_details ? { notes: uForm.clinical_details } : undefined,
}), 'Order updated.', () => (updateOpen.value = false))

const submitCollect = () => run(() => collectOrder(uuid.value, {
  collected_at: toIso(cForm.collected_at) || undefined,
  laboratory_specimen_site_uuid: cForm.laboratory_specimen_site_uuid || undefined,
}), 'Specimen collected.', () => (collectOpen.value = false))

const submitReceive = () => run(() => receiveOrder(uuid.value), 'Order received.', () => (receiveOpen.value = false))

const submitReport = () => run(
  () => reportOrder(uuid.value, rForm.comments),
  'Report completed.',
  () => (reportOpen.value = false),
)

const submitRelease = () => {
  if (!lForm.released_to.trim()) { formError.value = 'Released to is required.'; return }
  return run(
    () => releaseOrder(uuid.value, lForm.released_to.trim(), lForm.comments),
    'Report released.',
    () => (releaseOpen.value = false),
  )
}

const submitVoid = () => {
  if (!hasVoidReason.value) { formError.value = 'A reason is required to void an order.'; return }
  return run(
    () => voidOrder(uuid.value, vForm.voided_reason),
    'Order voided.',
    () => { voidOpen.value = false; router.push('/orders') },
  )
}

// ── toast ────────────────────────────────────────────────────────────────────
const toast = reactive({ show: false, ok: true, msg: '' })
let toastTimer: any
const flash = (ok: boolean, msg: string) => {
  toast.ok = ok; toast.msg = msg; toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.show = false), 3500)
}

// ── formatting ───────────────────────────────────────────────────────────────
const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const titleCase = (s: string | null | undefined) =>
  (s || '—').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// Notes payload shape is { uuid, notes }, but tolerate string / legacy
// body|note keys too rather than assuming one API version forever.
const noteText = (n: any): string =>
  typeof n === 'string' ? n : (n?.notes ?? n?.body ?? n?.note ?? '')

// Note content comes from the CKEditor-backed clinical note field, so it's
// already real HTML (paragraphs, bold, lists) rather than plain text — it
// needs to render as HTML, not print the tags literally. This strips the
// handful of genuinely dangerous constructs before it hits v-html; if a
// project-wide DOMPurify import ever gets added, swap this for that.
const sanitizeNoteHtml = (html: string): string => {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

// pill classes (ribbon palette) — covers reported / imaged / received / verified / planned
const statusPillClass = (s: string) => {
  const k = (s || '').toLowerCase()
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show') || k.includes('void')) return 'bg-error/10 text-error'
  if (k.includes('reported') || k.includes('complete') || k.includes('verified') || k.includes('final')) return 'bg-ribbon-teal/15 text-ribbon-teal'
  if (k.includes('progress') || k.includes('collected') || k.includes('received') || k.includes('imaged') || k.includes('stained')) return 'bg-ribbon-amber/15 text-ribbon-amber'
  if (k.includes('planned') || k.includes('scheduled') || k.includes('submitted')) return 'bg-ribbon-purple/15 text-ribbon-purple'
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
  if (k.includes('cancel') || k.includes('no show') || k.includes('no_show') || k.includes('void')) return 'border-ribbon-red'
  if (k.includes('reported') || k.includes('complete') || k.includes('verified') || k.includes('final')) return 'border-ribbon-teal'
  if (k.includes('progress') || k.includes('collected') || k.includes('received') || k.includes('imaged') || k.includes('stained')) return 'border-ribbon-amber'
  if (k.includes('planned') || k.includes('scheduled') || k.includes('submitted')) return 'border-ribbon-purple'
  return 'border-ribbon-blue'
}
const tatChip = (t: string | null) => {
  const k = (t || '').toLowerCase()
  if (k === 'breached') return 'bg-error/10 text-error'
  if (k === 'at_risk') return 'bg-ribbon-amber/15 text-ribbon-amber'
  return 'bg-ribbon-teal/15 text-ribbon-teal'
}
const tatAccent = (t: string | null) => {
  const k = (t || '').toLowerCase()
  if (k === 'breached') return 'border-ribbon-red'
  if (k === 'at_risk') return 'border-ribbon-amber'
  return 'border-ribbon-teal'
}

// ── tiny inline detail renderer ──────────────────────────────────────────────
const Detail = (props: { label: string; value: string | number | null | undefined }) =>
  h('div', [
    h('dt', { class: 'text-[10px] font-bold uppercase tracking-wider text-ribbon-blue mb-1' }, props.label),
    h('dd', { class: 'text-sm text-on-surface break-words font-medium' },
      props.value === null || props.value === undefined || props.value === '' ? '—' : String(props.value)),
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

/* header advanced button (matches ribbon palette) */
.adv-toggle {
  @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-ribbon-blue bg-ribbon-blue/10 hover:bg-ribbon-blue/20 transition-colors;
}

.adv-item {
  @apply w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-low transition-colors;
}

/* pill tabs */
.tab-pill {
  @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-on-surface-variant hover:bg-ribbon-blue/10 hover:text-ribbon-blue transition-colors;
}

.tab-pill-active {
  @apply text-white bg-primary-gradient shadow-md shadow-primary/20;
}

.tab-count {
  @apply ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/25;
}

.tab-pill:not(.tab-pill-active) .tab-count {
  @apply bg-ribbon-blue/15 text-ribbon-blue;
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

/* scroll area (workflow list) */
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

/* toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
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

/* dropdown menu fade (Tests table row actions) */
.menu-pop-enter-active {
  transition: opacity 0.14s ease, transform 0.14s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-pop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

/* Notes: format the CKEditor HTML rendered via v-html inside .note-prose.
   :deep() is required because v-html content isn't seen by scoped styles. */
.note-prose :deep(p) {
  margin: 0 0 0.5em;
}

.note-prose :deep(p:last-child) {
  margin-bottom: 0;
}

.note-prose :deep(strong) {
  font-weight: 700;
}

.note-prose :deep(ul),
.note-prose :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.25em 0;
}

.note-prose :deep(a) {
  color: #3d7fbf;
  text-decoration: underline;
}
</style>