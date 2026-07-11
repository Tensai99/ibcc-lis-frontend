<!-- app/pages/customers/[uuid].vue -->
<template>
  <AccessDenied v-if="denied" />
  <div class="animate-fade-in min-h-full space-y-5" @click="closeDrops">

    <nav
      class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
      <NuxtLink to="/customers"
        class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
        <font-awesome-icon :icon="['fas', 'users']" class="text-[11px]" />Customers
      </NuxtLink>
      <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
      <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
        <font-awesome-icon :icon="['fas', 'user']" class="text-[11px] text-primary" />{{ dash?.customer.full_name }}
      </span>
    </nav>

    <!-- Loading -->
    <div v-if="showSkeleton && !dash" class="space-y-4">
      <SkeletonDetailHeader />
      <SkeletonPanel :bars="4" />
    </div>
    <div v-else-if="loading && !dash" />
    <div v-else-if="!loading && !dash" class="island text-center py-16"><font-awesome-icon
        :icon="['fas', 'triangle-exclamation']" class="text-4xl text-outline mb-3" />
      <p class="text-sm text-on-surface-variant">Customer not found.</p>
    </div>

    <template v-else-if="dash && p">

      <!-- ══ HEADER CARD ═══════════════════════════════════════════════════ -->
      <div
        class="bg-white/80 backdrop-blur-md rounded-xl p-5 border border-white/50 shadow-island relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div class="flex flex-col sm:flex-row gap-4 items-start relative z-10">
          <div
            class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-md">
            <img v-if="profilePhoto && !photoError" :src="profilePhoto" :alt="p.full_name"
              class="w-full h-full object-cover" @error="photoError = true" />
            <span v-else class="text-primary text-xl sm:text-2xl font-bold">{{ initials(p.full_name) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h1 class="text-lg sm:text-xl font-bold text-on-surface">{{ p.full_name }}<span v-if="p.preferred_name"
                    class="text-on-surface-variant text-sm font-normal ml-1">"{{ p.preferred_name }}"</span></h1>
                <p class="text-xs sm:text-sm font-mono text-on-surface-variant mt-0.5">{{ p.no }}</p>
              </div>

              <!-- Right cluster: category badge + Advanced Options, inline -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <span
                  class="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap"
                  :class="cat?.accept_insurance ? 'bg-secondary-fixed text-secondary-on-fixed border-secondary/30' : 'bg-surface-low text-on-surface-variant border-outline-variant/40'">
                  <font-awesome-icon v-if="cat?.accept_insurance" :icon="['fas', 'shield-halved']" class="text-xs" />{{
                    cat?.name }}
                </span>

                <!-- Advanced Options dropdown -->
                <div class="relative">
                  <button ref="headerMenuBtn"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/10 whitespace-nowrap"
                    @click.stop="toggleHeaderMenu">
                    <font-awesome-icon :icon="['fas', 'sliders']" class="text-xs" />Advanced Options
                    <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[9px] transition-transform"
                      :class="showHeaderMenu ? 'rotate-180' : ''" />
                  </button>
                  <ClientOnly>
                    <Teleport to="body">
                      <div v-if="showHeaderMenu" class="fixed inset-0 z-[90]" @click="showHeaderMenu = false" />
                      <transition enter-active-class="transition ease-out duration-150"
                        enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition ease-in duration-100"
                        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                        <div v-if="showHeaderMenu" ref="headerMenuEl"
                          class="fixed w-56 z-[91] rounded-2xl bg-white shadow-2xl border border-outline-variant/30 p-1.5 origin-top-right"
                          :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }"
                          style="box-shadow:0 20px 50px -12px rgba(0,0,0,0.25);">
                          <button
                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-on-surface hover:bg-surface-low px-3 py-2.5 rounded-xl transition-colors"
                            @click="showHeaderMenu = false; openQr()">
                            <font-awesome-icon :icon="['fas', 'qrcode']" class="text-xs text-outline w-4" />QR / ID
                            Card
                          </button>
                          <button
                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-on-surface hover:bg-surface-low px-3 py-2.5 rounded-xl transition-colors"
                            @click="showHeaderMenu = false; openUpdate()">
                            <font-awesome-icon :icon="['fas', 'pen']" class="text-xs text-outline w-4" />Update
                            Customer
                          </button>
                          <button v-if="acceptsInsurance && can('customer_view')"
                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-on-surface hover:bg-surface-low px-3 py-2.5 rounded-xl transition-colors"
                            @click="showHeaderMenu = false; openInsModal()">
                            <font-awesome-icon :icon="['fas', 'shield-halved']" class="text-xs text-outline w-4" />Add
                            Insurance
                          </button>
                          <button
                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-on-surface hover:bg-surface-low px-3 py-2.5 rounded-xl transition-colors"
                            @click="showHeaderMenu = false; openPreCost()">
                            <font-awesome-icon :icon="['fas', 'calculator']" class="text-xs text-outline w-4" />Add
                            Pre-Costing
                          </button>
                        </div>
                      </transition>
                    </Teleport>
                  </ClientOnly>
                </div>
              </div>
            </div>
            <!-- Detail grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              <!-- cycled ribbon tints: blue → teal → amber → purple → blue → teal -->
              <div class="bg-primary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Gender / Age</p>
                <p class="text-sm font-bold capitalize">{{ p.gender }}, {{ p.age }}y</p>
              </div>
              <div class="bg-secondary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Date of Birth</p>
                <p class="text-sm font-bold">{{ fmtDate(p.date_of_birth) }}</p>
              </div>
              <div class="bg-accent-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Phone</p>
                <p class="text-sm font-bold font-mono">{{ p.phone_primary }}</p>
              </div>
              <div v-if="p.identification" class="bg-tertiary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">{{ p.identification.type }}</p>
                <p class="text-sm font-bold font-mono">{{ p.identification.number }}</p>
              </div>
              <div class="bg-primary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Registered</p>
                <p class="text-sm font-bold">{{ fmtDate(p.registered_at) }}</p>
              </div>
              <div class="bg-secondary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">By</p>
                <p class="text-sm font-bold truncate">{{ p.registered_by }}</p>
              </div>
            </div>
            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-2 mt-3">
              <!-- Patient record (only when one exists) — NOT in the dropdown -->
              <template v-if="patientMrn">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary-fixed text-secondary-on-fixed border border-secondary/20">
                  <font-awesome-icon :icon="['fas', 'id-card-clip']" class="text-xs" />MRN
                  <span class="font-mono">{{ patientMrn }}</span>
                </span>
                <button v-if="patientUuid"
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-secondary-container transition-colors"
                  @click="router.push({ path: `/patients/${patientUuid}`, query: { customer_uuid: uuid } })">
                  <font-awesome-icon :icon="['fas', 'hospital-user']" class="text-xs" />View Patient Record
                </button>
              </template>
            </div>
            <!-- Billing summary -->
            <div v-if="billing" class="mt-3 rounded-lg border border-accent/20 bg-accent-fixed/30 p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5 text-primary">
                  <font-awesome-icon :icon="['fas', 'file-invoice-dollar']" class="text-xs" />
                  <span class="text-xs font-bold uppercase tracking-widest">Billing Summary</span>
                </div>
                <span class="text-xs text-on-surface-variant">
                  {{ billing.total_invoices }} invoice<span v-if="billing.total_invoices !== 1">s</span>
                  <span v-if="billing.unpaid_invoices" class="text-accent font-semibold">
                    · {{ billing.unpaid_invoices }} unpaid</span>
                </span>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <!-- Billed — ribbon blue -->
                <div class="bg-primary-fixed/50 p-2.5 rounded-lg">
                  <p class="text-xs text-on-surface-variant mb-0.5">Billed</p>
                  <template v-for="(p, i) in amountParts(billing.total_billed, majorCcy)" :key="p.ccy">
                    <p v-if="i === 0" class="text-sm font-bold tabular-nums">{{ fmtMoney(p.val, p.ccy) }}</p>
                    <p v-else class="text-xs text-on-surface-variant tabular-nums">{{ fmtMoney(p.val, p.ccy) }}</p>
                  </template>
                </div>

                <!-- Paid — ribbon teal -->
                <div class="bg-secondary-fixed/50 p-2.5 rounded-lg">
                  <p class="text-xs text-on-surface-variant mb-0.5">Paid</p>
                  <template v-for="(p, i) in amountParts(billing.total_paid, majorCcy)" :key="p.ccy">
                    <p v-if="i === 0" class="text-sm font-bold text-secondary tabular-nums">{{ fmtMoney(p.val, p.ccy) }}
                    </p>
                    <p v-else class="text-xs text-secondary/70 tabular-nums">{{ fmtMoney(p.val, p.ccy) }}</p>
                  </template>
                </div>

                <!-- Outstanding — ribbon amber -->
                <div class="bg-accent-fixed/50 p-2.5 rounded-lg">
                  <p class="text-xs text-on-surface-variant mb-0.5">Outstanding</p>
                  <template v-for="(p, i) in amountParts(billing.total_outstanding, majorCcy)" :key="p.ccy">
                    <p v-if="i === 0" class="text-sm font-bold tabular-nums"
                      :class="hasAmount(billing.total_outstanding) ? 'text-accent' : 'text-on-surface'">
                      {{ fmtMoney(p.val, p.ccy) }}</p>
                    <p v-else class="text-xs text-accent/70 tabular-nums">{{ fmtMoney(p.val, p.ccy) }}</p>
                  </template>
                </div>

                <!-- Insurance Covered — ribbon purple (distinct from Billed's blue) -->
                <div class="bg-tertiary-fixed/50 p-2.5 rounded-lg">
                  <p class="text-xs text-on-surface-variant mb-0.5">Insurance Covered</p>
                  <template v-for="(p, i) in amountParts(billing.insurance_covered, majorCcy)" :key="p.ccy">
                    <p v-if="i === 0" class="text-sm font-bold text-tertiary tabular-nums">{{ fmtMoney(p.val, p.ccy) }}
                    </p>
                    <p v-else class="text-xs text-tertiary/70 tabular-nums">{{ fmtMoney(p.val, p.ccy) }}</p>
                  </template>
                </div>
              </div>

              <!-- Recent invoices -->
              <div v-if="billing.recent_invoices?.length" class="mt-3 border-t border-outline-variant/30 pt-2.5">
                <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Recent Invoices
                </p>
                <ul class="space-y-1.5">
                  <li v-for="inv in billing.recent_invoices" :key="inv.uuid"
                    class="flex items-center justify-between gap-2 bg-white/70 rounded-lg px-2.5 py-1.5">
                    <div class="min-w-0">
                      <p class="text-xs font-semibold truncate">{{ inv.proforma_invoice_no }}</p>
                      <p class="text-[11px] text-on-surface-variant">{{ fmtDate(inv.created_at) }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-xs font-bold tabular-nums">{{ fmtMoney(inv.total, inv.currency) }}</p>
                      <p v-if="Number(inv.outstanding ?? 0) > 0" class="text-[11px] text-accent tabular-nums">
                        {{ fmtMoney(inv.outstanding, inv.currency) }} due</p>
                      <span class="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        :class="invStatusClass(inv.status)">{{ inv.status }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ FLOATING INSURANCE HINT ════════════════════════════════════════ -->
      <Teleport to="body">
        <Transition name="hint-pop">
          <div v-if="noInsurance && !dismissInsHint" class="fixed bottom-6 right-6 z-50 w-72">
            <div class="floating-action-card ambient-loop relative rounded-2xl overflow-hidden"
              style="background:rgba(255,255,255,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.60);box-shadow:0 10px 40px -10px rgba(0,51,153,0.20),0 20px 25px -5px rgba(0,0,0,0.08);">
              <div class="shimmer-overlay" />
              <div class="relative z-10 p-5">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0">
                    <font-awesome-icon :icon="['fas', 'shield-halved']" class="text-secondary text-base" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-on-surface leading-tight">Insurance Available</h4>
                    <p class="text-xs text-on-surface-variant leading-tight mt-0.5">This customer can be covered under
                      an insurance plan</p>
                  </div>
                  <button class="text-outline/40 hover:text-on-surface transition-colors"
                    @click="dismissInsHint = true">
                    <font-awesome-icon :icon="['fas', 'xmark']" class="text-sm" />
                  </button>
                </div>
                <div class="flex gap-2">
                  <button
                    class="flex-1 px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                    @click="openInsModal; dismissInsHint = true">
                    Add Insurance
                  </button>
                  <button
                    class="px-3 py-2 bg-white/60 border border-outline-variant/40 text-xs font-bold rounded-xl hover:bg-white/80 transition-all text-on-surface-variant"
                    @click="dismissInsHint = true">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ══ TABS ════════════════════════════════════════════════════════════ -->
      <div class="bg-white/80 backdrop-blur-md rounded-xl border border-white/50 shadow-island overflow-hidden">
        <div class="flex gap-0 border-b border-outline-variant/20 overflow-x-auto"
          style="background:linear-gradient(90deg,#f0f5ff,#e8eeff);">
          <button v-for="tab in tabs" :key="tab.id"
            class="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0"
            :class="activeTab === tab.id ? 'border-primary text-primary bg-white/60' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/40'"
            @click="activeTab = tab.id">
            <font-awesome-icon :icon="tab.icon" class="text-xs" />{{ tab.label }}
          </button>
        </div>

        <!-- ── GENERAL INFORMATION (read-only) ──────────────────────────── -->
        <div v-if="activeTab === 'general'" class="p-5 space-y-5">
          <!-- Classification — ribbon blue accent -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 border-l-4 border-l-ribbon-blue p-5">
            <div class="flex items-center gap-2 text-primary mb-4"><font-awesome-icon :icon="['fas', 'tag']"
                class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Classification</span></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div class="bg-primary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Category</p>
                <p class="font-bold">{{ cat?.name || ext('CUSTOMER_CATEGORY')?.valueString || '—' }}</p>
              </div>
              <div class="bg-primary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">ID Type</p>
                <p class="font-bold">{{ ext('IDENTIFICATION_TYPE')?.valueString || idNo?.type?.text || '—' }}</p>
              </div>
              <div class="bg-primary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">ID Number</p>
                <p class="font-bold font-mono">{{ ext('IDENTIFICATION_NUMBER')?.valueString || idNo?.value || '—' }}</p>
              </div>
              <div class="bg-primary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">ID Expiry</p>
                <p class="font-bold">{{ fmtDate(ext('IDENTIFICATION_EXPIRY_DATE')?.valueDate || idNo?.period?.end) }}
                </p>
              </div>
            </div>
          </section>
          <!-- Identity — ribbon teal accent -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 border-l-4 border-l-ribbon-teal p-5">
            <div class="flex items-center gap-2 text-secondary mb-4"><font-awesome-icon :icon="['fas', 'id-badge']"
                class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Identity &amp; Basics</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
              <div class="bg-secondary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Full Name</p>
                <p class="font-bold">{{ officialName?.text || p.full_name }}</p>
              </div>
              <div class="bg-secondary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Gender</p>
                <p class="font-bold capitalize">{{ fhirData?.gender || p.gender }}</p>
              </div>
              <div class="bg-secondary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Date of Birth</p>
                <p class="font-bold">{{ fmtDate(fhirData?.birthDate || p.date_of_birth) }}</p>
              </div>
              <div class="bg-secondary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Age</p>
                <p class="font-bold">{{ p.age || '—' }} years</p>
              </div>
              <div class="bg-secondary-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Nationality</p>
                <p class="font-bold">{{ p.nationality || '—' }} </p>
              </div>
            </div>
          </section>
          <!-- Contact & Address — ribbon amber accent -->
          <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 border-l-4 border-l-ribbon-amber p-5">
            <div class="flex items-center gap-2 text-accent mb-4"><font-awesome-icon :icon="['fas', 'location-dot']"
                class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Contact &amp; Address</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div class="bg-accent-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Primary Phone</p>
                <p class="font-bold font-mono">{{ phone0?.value || p.phone_primary }}</p>
              </div>
              <div class="bg-accent-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Address</p>
                <p class="font-bold">{{ addr0?.line?.join(', ') || '—' }}</p>
              </div>
              <div class="bg-accent-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">City</p>
                <p class="font-bold">{{ addr0?.city || '—' }}</p>
              </div>
              <div class="bg-accent-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Region</p>
                <p class="font-bold">{{ addr0?.state || '—' }}</p>
              </div>
              <div class="bg-accent-fixed/50 p-3 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-1">Country</p>
                <p class="font-bold">{{ addr0?.country || '—' }}</p>
              </div>
            </div>
          </section>
          <!-- Referral — ribbon purple accent -->
          <section v-if="ext('REFERRING_FACILITY')?.valueString"
            class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 border-l-4 border-l-ribbon-purple p-5 sm:p-6 space-y-5">
            <!-- Header -->
            <div class="flex items-center gap-3">
              <span class="grid place-items-center w-9 h-9 rounded-xl bg-tertiary-fixed text-tertiary flex-shrink-0">
                <font-awesome-icon :icon="['fas', 'share-from-square']" class="text-sm" />
              </span>
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-tertiary leading-none">Referral</p>
                <p class="text-xs text-on-surface-variant mt-1">Source and supporting documentation</p>
              </div>
            </div>

            <!-- Details -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-tertiary-fixed/50 rounded-xl p-4">
                <p class="text-xs text-on-surface-variant mb-1.5">Referring Facility</p>
                <p class="text-sm font-bold break-words">{{ ext('REFERRING_FACILITY')?.valueString || '—' }}</p>
              </div>
              <div class="bg-tertiary-fixed/50 rounded-xl p-4">
                <p class="text-xs text-on-surface-variant mb-1.5">Referring Clinician</p>
                <p class="text-sm font-bold break-words">{{ ext('REFERRING_CLINICIAN')?.valueString || '—' }}</p>
              </div>
              <div class="bg-tertiary-fixed/50 rounded-xl p-4">
                <p class="text-xs text-on-surface-variant mb-1.5">Referral Date</p>
                <p class="text-sm font-bold">{{ fmtDate(ext('REFERRAL_DATE')?.valueDate) }}</p>
              </div>
            </div>

            <!-- Referral document -->
            <div class="flex flex-wrap items-center justify-between gap-3 bg-tertiary-fixed/50 rounded-xl p-4">
              <div class="flex items-center gap-3 min-w-0">
                <span class="grid place-items-center w-10 h-10 rounded-lg flex-shrink-0"
                  :class="hasReferralDoc ? 'bg-secondary-fixed text-secondary-on-fixed' : 'bg-surface-container text-outline'">
                  <font-awesome-icon :icon="['fas', hasReferralDoc ? 'file-circle-check' : 'file-circle-xmark']"
                    class="text-base" />
                </span>
                <div class="min-w-0">
                  <p class="text-xs text-on-surface-variant">Referral Document</p>
                  <p class="text-sm font-bold" :class="hasReferralDoc ? 'text-secondary-on-fixed' : 'text-on-surface-variant'">
                    {{ hasReferralDoc ? 'Available' : 'Not available' }}
                  </p>
                </div>
              </div>
              <button v-if="hasReferralDoc"
                class="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-lg transition-colors flex-shrink-0"
                @click="showRefDocViewer = true">
                <font-awesome-icon :icon="['fas', 'eye']" class="text-xs" />View
              </button>
            </div>
          </section>
          <!-- Update CTA -->
          <div class="flex justify-end">
            <button class="btn-primary" @click="openUpdate"><font-awesome-icon :icon="['fas', 'pen']" />Update
              Customer</button>
          </div>
        </div>

        <!-- ── INSURANCE TAB ─────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'insurance'" class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-on-surface">Insurance Coverages</h3>
            <button class="btn-primary !py-1.5 !px-3 !text-xs" @click="openInsModal"><font-awesome-icon
                :icon="['fas', 'plus']" />Add Coverage</button>
          </div>
          <div v-if="!ins?.has_insurance || !ins?.active_coverages?.length" class="py-12 text-center">
            <font-awesome-icon :icon="['fas', 'shield-halved']" class="text-3xl text-outline/20 mb-3" />
            <p class="text-sm font-semibold text-on-surface-variant">No insurance on file</p>
            <button class="btn-primary !text-xs mt-3" @click="openInsModal"><font-awesome-icon
                :icon="['fas', 'plus']" />Add
              Insurance</button>
          </div>
          <div v-else class="space-y-3">
            <div v-for="cov in ins.active_coverages" :key="cov.uuid"
              class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4">
              <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <h4 class="text-sm font-bold">{{ cov.scheme_name }}</h4>
                    <span class="font-mono text-xs bg-primary/8 text-primary px-1.5 py-0.5 rounded">{{ cov.scheme_code
                      }}</span>
                    <span v-if="cov.is_primary"
                      class="text-xs font-bold bg-accent-fixed text-accent-on-container border border-accent/30 px-2 py-0.5 rounded-full">Primary</span>
                    <span v-if="cov.direct_billing"
                      class="text-xs font-bold bg-secondary-fixed text-secondary-on-fixed border border-secondary/30 px-2 py-0.5 rounded-full">Direct
                      Billing</span>
                  </div>
                  <p class="text-xs text-on-surface-variant">{{ cov.provider }}</p>
                  <div class="flex flex-wrap gap-4 mt-2 text-xs text-on-surface-variant">
                    <span><strong class="text-on-surface">Membership:</strong> {{ cov.membership_number }}</span>
                    <span class="capitalize"><strong class="text-on-surface">Type:</strong> {{ cov.member_type }}</span>
                    <span><strong class="text-on-surface">From:</strong> {{ fmtDate(cov.valid_from) }}</span>
                    <span v-if="cov.valid_to"><strong class="text-on-surface">Expires:</strong> {{ fmtDate(cov.valid_to)
                      }}</span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 sm:items-end flex-shrink-0">
                  <a v-for="form in (cov.latest_completed_forms ?? [])" :key="form.id" :href="form.url" target="_blank"
                    rel="noopener"
                    class="flex items-center gap-1 text-xs text-primary hover:underline"><font-awesome-icon
                      :icon="['fas', 'file']" class="text-xs" />Form ({{ new Date(form.uploaded_on).toLocaleDateString()
                      }})</a>
                  <p v-if="!cov.latest_completed_forms?.length" class="text-xs text-outline">No forms uploaded</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PRE-COSTING TAB ───────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'pre_costing'" class="p-5 space-y-4" @vue:mounted="loadPreCostings">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 class="text-sm font-bold text-on-surface">Pre-Costing Estimates</h3>
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <div class="relative flex-1 sm:flex-initial">
                <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50" />
                <input v-model="pcSearch" type="text" placeholder="Search by reference or creator…"
                  class="w-full sm:w-64 border border-outline-variant/30 rounded-xl pl-9 pr-3 py-2 text-sm bg-surface-low focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
              </div>
              <button class="btn-primary !py-2 !px-3 !text-xs whitespace-nowrap flex items-center gap-1.5"
                @click="openPreCost">
                <font-awesome-icon :icon="['fas', 'plus']" />New Pre Costing
              </button>
            </div>
          </div>


          <!-- Loading -->
          <div v-if="pcListSkeleton" class="overflow-hidden rounded-xl border border-outline-variant/25 shadow-sm p-4 space-y-3">
            <SkeletonBase v-for="i in 3" :key="i" width="100%" height="2.5rem" />
          </div>
          <div v-else-if="pcListLoading" />

          <!-- Empty state -->
          <div v-else-if="!preCostings.length" class="py-12 text-center">
            <div class="w-12 h-12 rounded-full bg-surface-low flex items-center justify-center mx-auto mb-3">
              <font-awesome-icon :icon="['fas', 'calculator']" class="text-xl text-outline/30" />
            </div>
            <p class="text-sm font-semibold text-on-surface-variant">No pre-costing estimates yet</p>
            <p class="text-xs text-outline mt-1 mb-3">Create an estimate to preview costs before admission</p>
            <button class="btn-primary !text-xs" @click="openPreCost">
              <font-awesome-icon :icon="['fas', 'plus']" />Start Pre-Costing
            </button>
          </div>

          <!-- Pre-costing table -->
          <div v-else class="overflow-hidden rounded-xl border border-outline-variant/25 shadow-sm">
            <!-- Table header -->
            <div
              class="hidden sm:grid px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wide border-b border-outline-variant/20"
              style="grid-template-columns:1fr 80px 1fr 1fr 1fr 80px; background:linear-gradient(90deg,#f0f5ff,#e8eeff);">
              <span>Reference</span>
              <span class="text-center">Services</span>
              <span class="text-right">Gross</span>
              <span class="text-right">Discount</span>
              <span class="text-right">Net Total</span>
              <span />
            </div>
            <div class="divide-y divide-outline-variant/15 bg-white">
              <div v-for="pc in filtPreCostings" :key="pc.uuid"
                class="hidden sm:grid items-center px-4 py-3.5 hover:bg-surface-low transition-colors"
                style="grid-template-columns:1fr 80px 1fr 1fr 1fr 80px;">
                <!-- Date + created by -->
                <div>
                  <p class="text-sm font-semibold text-on-surface font-mono">{{ pc.no }}</p>
                  <p class="text-xs text-on-surface-variant">{{ new Date(pc.created_at).toLocaleDateString('en-MW', {
                    dateStyle: 'medium'
                  }) }} · {{ pc.created_by }}</p>
                </div>
                <!-- Services count -->
                <div class="text-center">
                  <span class="text-sm font-bold text-on-surface">{{ pc.total_services }}</span>
                </div>
                <!-- Gross -->
                <div class="text-right">
                  <p class="text-sm font-bold text-on-surface tabular-nums">{{ pc.currency }}{{
                    Number(pc.total).toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </p>
                </div>
                <!-- Discount -->
                <div class="text-right">
                  <p class="text-sm text-secondary font-semibold tabular-nums" v-if="pc.discount.amount > 0">
                    -{{ pc.currency }}{{
                      Number(pc.discount.amount).toLocaleString('en-MW', {
                        minimumFractionDigits:
                          2, maximumFractionDigits: 2
                      })
                    }}
                    <span class="text-xs font-normal text-secondary">({{ pc.discount.percentage }}%)</span>
                  </p>
                  <p v-else class="text-sm text-outline">—</p>
                </div>
                <!-- Net total -->
                <div class="text-right">
                  <p class="text-sm font-bold text-primary tabular-nums">{{ pc.currency }}{{
                    Number(pc.total_price).toLocaleString('en-MW', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    })
                  }}
                  </p>
                </div>
                <!-- Show button -->
                <div class="flex justify-end">
                  <button
                    class="flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors"
                    @click="router.push({ path: `/customers/pre-costing/${pc.uuid}`, query: { customer_uuid: uuid } })">
                    View <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" />
                  </button>
                </div>
              </div>

              <!-- Mobile card fallback -->
              <div v-for="pc in filtPreCostings" :key="`m-${pc.uuid}`" class="sm:hidden p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-on-surface font-mono">{{ pc.no }}</p>
                    <p class="text-sm font-semibold text-on-surface">{{ new
                      Date(pc.created_at).toLocaleDateString('en-MW', {
                        dateStyle: 'medium'
                      }) }} · {{ pc.created_by }}</p>
                    <p class="text-xs text-on-surface-variant">{{ pc.created_by }} · {{ pc.total_services }} services
                    </p>
                  </div>
                  <button class="text-xs font-bold text-primary flex items-center gap-1 flex-shrink-0"
                    @click="router.push({ path: `/customers/pre-costing/${pc.uuid}`, query: { customer_uuid: uuid } })">
                    View <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" />
                  </button>
                </div>
                <div class="flex gap-4 text-xs">
                  <span class="text-on-surface-variant">Gross: <strong class="text-on-surface">{{ pc.currency }}{{
                    Number(pc.total).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</strong></span>
                  <span class="text-primary font-bold">Net: {{ pc.currency }}{{
                    Number(pc.total_price).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <!-- Tax chips -->
                <div class="flex flex-wrap gap-1">
                  <span v-for="t in pc.taxation" :key="t.name" class="text-xs px-1.5 py-0.5 rounded font-semibold"
                    :class="t.mode === 'collect' ? 'bg-primary-fixed text-primary-on-fixed' : 'bg-accent-fixed text-accent-on-container'">
                    {{ t.name.match(/\(([^)]+)\)/)?.[1] ?? t.name }} {{ t.percentage }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PREFORMA INVOICE TAB ───────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'preforma-invoice'" class="p-5 space-y-4" @vue:mounted="loadProformaInvoices">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 class="text-sm font-bold text-on-surface">Proforma Invoices</h3>
            <div class="relative">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50" />
              <input v-model="piSearch" type="text" placeholder="Search by reference, pre-costing, or creator…"
                class="w-full sm:max-w-sm border border-outline-variant/30 rounded-xl pl-9 pr-3 py-2 text-sm bg-surface-low focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
          </div>

          <!-- Loading -->
          <div v-if="piListSkeleton" class="overflow-hidden rounded-xl border border-outline-variant/25 shadow-sm p-4 space-y-3">
            <SkeletonBase v-for="i in 3" :key="i" width="100%" height="2.5rem" />
          </div>
          <div v-else-if="piListLoading" />

          <!-- Empty state -->
          <div v-else-if="!proformaInvoices.length" class="py-12 text-center">
            <div class="w-12 h-12 rounded-full bg-surface-low flex items-center justify-center mx-auto mb-3">
              <font-awesome-icon :icon="['fas', 'file-invoice-dollar']" class="text-xl text-outline/30" />
            </div>
            <p class="text-sm font-semibold text-on-surface-variant">No preforma invoices yet</p>
          </div>

          <!-- Invoice table -->
          <div v-else class="rounded-xl border border-outline-variant/25 shadow-sm overflow-x-auto">
            <!-- Table header -->
            <div
              class="hidden sm:grid gap-x-3 px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wide border-b border-outline-variant/20"
              style="grid-template-columns:minmax(170px,1.6fr) minmax(150px,1.3fr) 64px minmax(104px,1fr) minmax(104px,1fr) minmax(116px,1fr) 100px 48px; background:linear-gradient(90deg,#eef9f5,#e2f3ea);">
              <span>Reference</span>
              <span>Pre-Costing</span>
              <span class="text-center">Services</span>
              <span class="text-right">Gross</span>
              <span class="text-right">Net Total</span>
              <span class="text-right">Outstanding</span>
              <span class="text-center">Status</span>
              <span />
            </div>
            <div class="divide-y divide-outline-variant/15 bg-white">
              <!-- Desktop rows -->
              <div v-for="pi in filtProformaInvoices" :key="pi.uuid"
                class="hidden sm:grid items-center gap-x-3 px-4 py-3.5 hover:bg-surface-low transition-colors"
                style="grid-template-columns:minmax(170px,1.6fr) minmax(150px,1.3fr) 64px minmax(104px,1fr) minmax(104px,1fr) minmax(116px,1fr) 100px 48px;">
                <!-- Reference -->
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-on-surface font-mono truncate">{{ pi.no }}</p>
                  <p class="text-xs text-on-surface-variant truncate">{{ new
                    Date(pi.created_at).toLocaleDateString('en-MW', {
                      dateStyle: 'medium'
                    }) }} · {{ pi.created_by }}</p>
                </div>
                <!-- Pre-costing -->
                <div class="min-w-0">
                  <span class="text-xs font-semibold text-on-surface font-mono break-all">{{ pi.pre_costing_no }}</span>
                </div>
                <!-- Services -->
                <div class="text-center">
                  <span class="text-sm font-bold text-on-surface">{{ pi.total_services }}</span>
                </div>
                <!-- Gross -->
                <div class="text-right">
                  <p class="text-sm font-semibold text-on-surface tabular-nums">{{ pi.currency }}{{
                    Number(pi.total).toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </p>
                </div>
                <!-- Net Total -->
                <div class="text-right">
                  <p class="text-sm font-bold text-primary tabular-nums">{{ pi.currency }}{{
                    Number(pi.total_price).toLocaleString('en-MW', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    }) }}
                  </p>
                </div>
                <!-- Outstanding -->
                <div class="text-right">
                  <p class="text-sm font-semibold tabular-nums"
                    :class="Number(pi.outstanding) > 0 ? 'text-error' : 'text-secondary'">{{ pi.currency }}{{
                      Number(pi.outstanding).toLocaleString('en-MW', {
                        minimumFractionDigits: 2, maximumFractionDigits: 2
                      }) }}
                  </p>
                </div>
                <!-- Status -->
                <div class="flex justify-center">
                  <span
                    class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                    :class="pi.is_settled ? 'bg-secondary-fixed text-secondary-on-fixed border-secondary/30' : 'bg-accent-fixed text-accent-on-container border-accent/30'">
                    <span class="w-1.5 h-1.5 rounded-full" :class="pi.is_settled ? 'bg-secondary' : 'bg-accent'" />
                    {{ pi.is_settled ? 'Settled' : 'Unsettled' }}
                  </span>
                </div>
                <!-- Action -->
                <div class="flex justify-end">
                  <button type="button"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-primary transition-colors"
                    @click.stop="openPiMenu(pi.uuid, $event)">
                    <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                  </button>
                </div>
              </div>

              <!-- Mobile card fallback -->
              <div v-for="pi in filtProformaInvoices" :key="`m-${pi.uuid}`" class="sm:hidden p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-on-surface font-mono truncate">{{ pi.no }}</p>
                    <p class="text-xs text-on-surface-variant">{{ new Date(pi.created_at).toLocaleDateString('en-MW', {
                      dateStyle: 'medium'
                    }) }} · {{ pi.total_services }} services</p>
                    <p class="text-xs text-on-surface-variant font-mono break-all">{{ pi.pre_costing_no }}</p>
                  </div>
                  <button type="button"
                    class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-primary transition-colors"
                    @click.stop="openPiMenu(`m-${pi.uuid}`, $event)">
                    <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" />
                  </button>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span class="text-on-surface-variant">Net: <strong class="text-primary">{{ pi.currency }}{{
                    Number(pi.total_price).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</strong></span>
                  <span class="text-on-surface-variant">Outstanding: <strong
                      :class="Number(pi.outstanding) > 0 ? 'text-error' : 'text-secondary'">{{ pi.currency }}{{
                        Number(pi.outstanding).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</strong></span>
                  <span class="font-bold" :class="pi.is_settled ? 'text-secondary' : 'text-accent'">{{ pi.is_settled
                    ?
                    'Settled' : 'Unsettled' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Shared action menu — teleported so it escapes the table's scroll/clip box -->
          <ClientOnly>
            <Teleport to="body">
              <div v-if="piMenuOpen" class="fixed inset-0 z-[90]" @click="piMenuOpen = null" />
              <transition enter-active-class="transition ease-out duration-150"
                enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1">
                <div v-if="piMenuOpen && activePiInvoice"
                  class="fixed w-44 z-[91] rounded-xl bg-white shadow-2xl border border-outline-variant/30 p-1.5 origin-top-right"
                  :style="{ top: `${piMenuPos.top}px`, left: `${piMenuPos.left}px` }"
                  style="box-shadow:0 20px 50px -12px rgba(0,0,0,0.25);">
                  <button
                    class="w-full flex items-center gap-3 text-left text-sm font-medium text-on-surface hover:bg-surface-low px-3 py-2 rounded-lg transition-colors"
                    @click="router.push({ path: `/customers/proforma-invoice/${activePiInvoice.uuid}`, query: { customer_uuid: uuid } }); piMenuOpen = null">
                    <font-awesome-icon :icon="['fas', 'eye']" class="text-xs text-outline w-4" />View
                  </button>
                  <button v-if="activePiInvoice.to_be_scheduled"
                    class="w-full flex items-center gap-3 text-left text-sm font-medium text-secondary-on-fixed hover:bg-secondary-fixed px-3 py-2 rounded-lg transition-colors"
                    @click="router.push({ path: `/customers/proforma-invoice/${activePiInvoice.uuid}`, query: { customer_uuid: uuid } }); piMenuOpen = null">
                    <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-xs text-secondary w-4" />Schedule
                    Visit
                  </button>
                </div>
              </transition>
            </Teleport>
          </ClientOnly>
        </div>

        <!-- ── RECEIPTS TAB ───────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'receipts'" class="p-5 space-y-4" @vue:mounted="loadReceipts">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 class="text-sm font-bold text-on-surface">Receipts</h3>
            <div class="relative">
              <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50" />
              <input v-model="rcSearch" type="text" placeholder="Search by receipt, proforma, or method…"
                class="w-full sm:max-w-sm border border-outline-variant/30 rounded-xl pl-9 pr-3 py-2 text-sm bg-surface-low focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
          </div>

          <!-- Loading -->
          <div v-if="rcListSkeleton" class="overflow-hidden rounded-xl border border-outline-variant/25 shadow-sm p-4 space-y-3">
            <SkeletonBase v-for="i in 3" :key="i" width="100%" height="2.5rem" />
          </div>
          <div v-else-if="rcListLoading" />

          <!-- Empty state -->
          <div v-else-if="!receipts.length" class="py-12 text-center">
            <div class="w-12 h-12 rounded-full bg-surface-low flex items-center justify-center mx-auto mb-3">
              <font-awesome-icon :icon="['fas', 'receipt']" class="text-xl text-outline/30" />
            </div>
            <p class="text-sm font-semibold text-on-surface-variant">No receipts yet</p>
          </div>

          <!-- Receipts table -->
          <div v-else class="overflow-hidden rounded-xl border border-outline-variant/25 shadow-sm">
            <!-- Table header -->
            <div
              class="hidden sm:grid px-4 py-2.5 text-xs font-bold text-on-surface-variant uppercase tracking-wide border-b border-outline-variant/20"
              style="grid-template-columns:1.3fr 1.1fr 1fr 1fr 1fr 70px; background:linear-gradient(90deg,#fdf6ec,#fbecd4);">
              <span>Receipt</span>
              <span>Proforma</span>
              <span>Payment Method</span>
              <span class="text-right">Paid</span>
              <span class="text-right">Balance</span>
              <span />
            </div>
            <div class="divide-y divide-outline-variant/15 bg-white">
              <!-- Desktop rows -->
              <div v-for="r in filtReceipts" :key="r.uuid"
                class="hidden sm:grid items-center px-4 py-3.5 hover:bg-surface-low transition-colors"
                style="grid-template-columns:1.3fr 1.1fr 1fr 1fr 1fr 70px;">
                <div>
                  <p class="text-sm font-semibold text-on-surface font-mono">{{ r.no }}</p>
                  <p class="text-xs text-on-surface-variant">{{ new Date(r.created_at).toLocaleDateString('en-MW', {
                    dateStyle: 'medium'
                  }) }} · {{ r.created_by }}</p>
                </div>
                <div>
                  <span class="text-sm font-semibold text-on-surface font-mono">{{ r.proforma_invoice_no }}</span>
                </div>
                <div>
                  <span class="text-sm text-on-surface">{{ r.payment_method }}</span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-secondary tabular-nums">{{ r.currency }}{{
                    Number(r.paid_amount).toLocaleString('en-MW', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    }) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold tabular-nums"
                    :class="Number(r.balance_amount) > 0 ? 'text-error' : 'text-secondary'">{{ r.currency }}{{
                      Number(r.balance_amount).toLocaleString('en-MW', {
                        minimumFractionDigits: 2, maximumFractionDigits:
                          2
                      }) }}</p>
                </div>
                <div class="flex justify-end">
                  <button
                    class="flex items-center gap-1 text-xs font-bold text-primary hover:underline transition-colors"
                    @click="router.push({ path: `/customers/receipt/${r.uuid}`, query: { customer_uuid: uuid } })">
                    View <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" />
                  </button>
                </div>
              </div>

              <!-- Mobile card fallback -->
              <div v-for="r in filtReceipts" :key="`m-${r.uuid}`" class="sm:hidden p-4 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-on-surface font-mono">{{ r.no }}</p>
                    <p class="text-xs text-on-surface-variant">{{ r.proforma_invoice_no }} · {{ r.payment_method }}</p>
                  </div>
                  <button class="text-xs font-bold text-primary flex items-center gap-1 flex-shrink-0"
                    @click="router.push({ path: `/customers/receipt/${r.uuid}`, query: { customer_uuid: uuid } })">
                    View <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" />
                  </button>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span class="text-on-surface-variant">Paid: <strong class="text-secondary">{{ r.currency }}{{
                    Number(r.paid_amount).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</strong></span>
                  <span class="text-on-surface-variant">Balance: <strong
                      :class="Number(r.balance_amount) > 0 ? 'text-error' : 'text-secondary'">{{ r.currency }}{{
                        Number(r.balance_amount).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ══ QR / ID CARD MODAL ════════════════════════════════════════════════ -->
    <Modal v-model="showQrModal" title="Customer ID Card" :show-logo="false" size="lg">
      <div class="space-y-4">
        <!-- The printable ID card -->
        <div id="customer-id-card" class="overflow-hidden"
          style="border-radius:1.25rem;border:2px solid #e0e3e5;font-family:Manrope,sans-serif;">
          <!-- Card body -->
          <div class="flex gap-0" style="min-height:200px;">
            <!-- Left — QR code + primary colour stripe -->
            <div class="flex flex-col items-center justify-center gap-3 p-5 flex-shrink-0"
              style="background:linear-gradient(160deg,#0066ff 0%,#0050cb 100%);min-width:160px;">
              <div class="bg-white p-2 rounded-xl" v-html="qrSvg"
                style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;" />
              <p class="text-white text-xs font-bold text-center" style="word-break:break-all;">{{ p?.no }}</p>
            </div>
            <!-- Right — customer details -->
            <div class="flex-1 p-5 bg-white">
              <div class="flex items-center gap-3 mb-4">
                <img src="/images/ibcc_logo.png" alt="IBCC" style="height:36px;width:auto;object-fit:contain;"
                  @error="($event.target as HTMLImageElement).style.display = 'none'" />
                <div>
                  <p class="text-xs font-bold text-primary uppercase tracking-widest">International Blantyre Cancer
                    Centre
                  </p>
                  <p class="text-xs text-on-surface-variant">Customer Identification Card</p>
                </div>
              </div>
              <h2 class="text-lg font-bold text-on-surface mb-1">{{ p?.full_name }}<span v-if="p?.preferred_name"
                  class="text-on-surface-variant text-sm font-normal ml-1">"{{ p.preferred_name }}"</span></h2>
              <div class="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-2 text-xs">
                <div><span class="text-on-surface-variant">Gender:</span> <span class="font-bold capitalize ml-1">{{
                  p?.gender }}</span></div>
                <div><span class="text-on-surface-variant">Age:</span> <span class="font-bold ml-1">{{ p?.age }}y</span>
                </div>
                <div><span class="text-on-surface-variant">Date of Birth:</span> <span class="font-bold ml-1">{{
                  fmtDate(p?.date_of_birth) }}</span></div>
                <div><span class="text-on-surface-variant">Phone:</span> <span class="font-bold font-mono ml-1">{{
                  p?.phone_primary }}</span></div>
                <div v-if="p?.identification" class="col-span-2"><span class="text-on-surface-variant">{{
                  p.identification.type }}:</span> <span class="font-bold font-mono ml-1">{{ p.identification.number
                    }}</span></div>
                <div class="col-span-2"><span class="text-on-surface-variant">Category:</span> <span
                    class="font-bold ml-1">{{ cat?.name }}</span></div>
              </div>
            </div>
          </div>
          <!-- Card footer -->
          <div class="px-5 py-2.5 flex items-center justify-between"
            style="background:#f0f5ff;border-top:1px solid #dae1ff;">
            <p class="text-xs text-on-surface-variant">Registered: {{ fmtDate(p?.registered_at) }} by {{
              p?.registered_by }}
            </p>
            <p class="text-xs font-bold text-primary">IBCC Property — If found, return to IBCC</p>
          </div>
        </div>
        <!-- Print button -->
        <div class="flex justify-center pt-1">
          <button class="btn-primary" @click="printCard">
            <font-awesome-icon :icon="['fas', 'print']" />Print ID Card
          </button>
        </div>
      </div>
    </Modal>

    <!-- ══ REFERRAL DOCUMENT VIEWER (view only) ════════════════════════════════ -->
    <Modal v-model="showRefDocViewer" title="Referral Document" subtitle="View only — download disabled" size="xl">
      <div v-if="referralDocsMeta.length" class="flex flex-col md:flex-row gap-4 h-[70vh] min-h-[420px]">
        <!-- Sidebar only when more than one -->
        <aside v-if="referralDocsMeta.length > 1"
          class="md:w-56 flex-shrink-0 md:border-r md:border-outline-variant/20 md:pr-3 overflow-y-auto">
          <p class="text-[10px] font-bold text-outline uppercase tracking-widest mb-2 px-1">
            {{ referralDocsMeta.length }} Documents</p>
          <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            <button v-for="d in referralDocsMeta" :key="d.id" type="button"
              class="flex-shrink-0 w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
              :class="activeRefDoc?.id === d.id ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'border-outline-variant/30 hover:border-primary/30 hover:bg-surface-low'"
              @click="activeRefDocId = d.id">
              <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                :class="d.kind === 'pdf' ? 'bg-error-container text-error' : d.kind === 'image' ? 'bg-secondary-fixed text-secondary' : 'bg-surface-low text-on-surface-variant'">
                <font-awesome-icon
                  :icon="['fas', d.kind === 'pdf' ? 'file-pdf' : d.kind === 'image' ? 'file-image' : 'file']" />
              </span>
              <span class="block truncate text-xs font-semibold text-on-surface">{{ d.name }}</span>
            </button>
          </div>
        </aside>

        <!-- Viewer pane -->
        <div class="flex-1 flex flex-col min-w-0">
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                :class="activeRefDoc?.kind === 'pdf' ? 'bg-error-container text-error' : 'bg-secondary-fixed text-secondary'">
                <font-awesome-icon :icon="['fas', activeRefDoc?.kind === 'pdf' ? 'file-pdf' : 'file-image']"
                  class="text-[10px]" />
                {{ activeRefDoc?.kind === 'pdf' ? 'PDF' : 'Image' }}
              </span>
              <span class="truncate text-xs text-on-surface-variant">{{ activeRefDoc?.name }}</span>
            </div>
            <div v-if="activeRefDoc?.kind === 'image'" class="flex items-center gap-1.5">
              <button
                class="h-8 w-8 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-low"
                @click="refImgZoom = Math.max(0.25, refImgZoom - 0.25)">
                <font-awesome-icon :icon="['fas', 'magnifying-glass-minus']" class="text-xs" />
              </button>
              <span class="text-[11px] font-mono text-on-surface-variant w-10 text-center">{{ Math.round(refImgZoom *
                100)
              }}%</span>
              <button
                class="h-8 w-8 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-low"
                @click="refImgZoom = Math.min(4, refImgZoom + 0.25)">
                <font-awesome-icon :icon="['fas', 'magnifying-glass-plus']" class="text-xs" />
              </button>
            </div>
          </div>

          <div class="flex-1 rounded-xl border border-outline-variant/30 bg-surface-low/70 overflow-auto">
            <!-- Image -->
            <div v-if="activeRefDoc?.kind === 'image'" class="min-h-full flex items-center justify-center p-3">
              <img :src="activeRefDoc.url" :alt="activeRefDoc.name" oncontextmenu="return false"
                class="max-w-none rounded-md shadow-sm transition-transform origin-center"
                :style="{ transform: `scale(${refImgZoom})` }" />
            </div>
            <!-- PDF: object → iframe fallback, toolbar hidden -->
            <object v-else-if="activeRefDoc?.kind === 'pdf'" :data="`${activeRefDoc.url}#toolbar=0`"
              type="application/pdf" class="w-full h-full min-h-[400px]">
              <iframe :src="`${activeRefDoc.url}#toolbar=0`" title="Referral document"
                class="w-full h-full min-h-[400px] border-0" sandbox="allow-same-origin allow-scripts" />
            </object>
            <!-- Unknown -->
            <div v-else class="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
              <font-awesome-icon :icon="['fas', 'file']" class="text-3xl text-outline/40" />
              <p class="text-sm text-on-surface-variant">Preview not available for this file type.</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="py-10 text-center text-sm text-on-surface-variant">No referral document on file.</div>

      <template #footer>
        <button class="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
          @click="showRefDocViewer = false">Close</button>
      </template>
    </Modal>

    <!-- ══ UPDATE CUSTOMER MODAL ══════════════════════════════════════════════ -->
    <Modal v-model="showUpdateModal" title="Update Customer" subtitle="Edit customer demographics" size="lg"
      class="max-w-[80%]">
      <div class="space-y-5" @click.stop="closeDrops">
        <AppAlert v-if="eError" type="error" :title="eError" />
        <AppAlert v-if="eSuccess" type="success" :title="eSuccess" />

        <!-- Stepper -->
        <nav class="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          <template v-for="(s, i) in wizSteps" :key="s.id">
            <button type="button"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
              :class="wizStep === s.id ? 'bg-primary text-white' : wizStep > s.id ? 'bg-primary/10 text-primary' : 'bg-surface-low text-on-surface-variant'"
              @click="wizStep = s.id">
              <span class="flex items-center justify-center w-5 h-5 rounded-full text-[10px]"
                :class="wizStep === s.id ? 'bg-white/20' : wizStep > s.id ? 'bg-primary/20' : 'bg-outline-variant/30'">
                <font-awesome-icon v-if="wizStep > s.id" :icon="['fas', 'check']" /><span v-else>{{ s.id }}</span>
              </span>
              <span class="hidden sm:inline">{{ s.label }}</span>
            </button>
            <font-awesome-icon v-if="i < wizSteps.length - 1" :icon="['fas', 'chevron-right']"
              class="text-[9px] text-outline/40 flex-shrink-0" />
          </template>
        </nav>

        <!-- ── STEP 1 · Classification + Photo ─────────────────────────────── -->
        <section v-show="wizStep === 1"
          class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-5">
          <div class="flex items-center gap-2 text-primary"><font-awesome-icon :icon="['fas', 'tag']"
              class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Classification</span></div>

          <!-- Profile photo -->
          <div class="flex items-center gap-4">
            <div
              class="w-20 h-20 rounded-full overflow-hidden bg-primary/10 border-4 border-white shadow-md flex items-center justify-center flex-shrink-0">
              <img v-if="photoPreview || (profilePhoto && !photoError)" :src="photoPreview || profilePhoto"
                class="w-full h-full object-cover" alt="" />
              <span v-else class="text-primary text-xl font-bold">{{ initials(p?.full_name || '') }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <label class="u-label">Profile Photo</label>
              <div class="flex items-center gap-2">
                <label
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold cursor-pointer hover:bg-primary/20 transition-colors">
                  <font-awesome-icon :icon="['fas', 'camera']" />Choose Image
                  <input type="file" accept="image/*" class="hidden" @change="onPhotoChange" />
                </label>
                <button v-if="photoFile" type="button" class="text-xs font-bold text-error hover:underline"
                  @click="clearPhoto">Remove</button>
              </div>
              <p class="text-xs text-on-surface-variant mt-1 truncate">{{ photoFile?.name || 'JPG, PNG or WEBP' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div class="sm:col-span-2 relative" @click.stop><label class="u-label">Customer Category</label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'tag']"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="catSearch" class="u-input has-icon has-caret" placeholder="Search category…"
                  autocomplete="off" @focus="showCatDrop = true" @input="showCatDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showCatDrop && filtCats.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="c in filtCats" :key="c.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selCat(c)">{{ c.name }}</button>
                </div>
              </Transition>
            </div>
            <div class="relative" @click.stop><label class="u-label">ID Type</label>
              <div class="relative"><input v-model="idtSearch" class="u-input pr-8" placeholder="Search ID type…"
                  autocomplete="off" @focus="showIdtDrop = true" @input="showIdtDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showIdtDrop && filtIdts.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="t in filtIdts" :key="t.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selIdt(t)">{{ t.name }}</button>
                </div>
              </Transition>
            </div>
            <div><label class="u-label">ID Number</label><input v-model="eForm.identification_number" class="u-input"
                placeholder="e.g. RTD75TV" /></div>
            <div>
              <label class="u-label">ID Expiry</label>

              <VueDatePicker v-model="eForm.identification_expiry_date" :enable-time-picker="false" :clearable="false"
                hide-input-icon auto-apply format="yyyy-MM-dd" :day-names="['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']"
                week-start="0">
                <template #trigger>
                  <div class="u-input cursor-pointer flex items-center justify-between">
                    <span :class="eForm.identification_expiry_date ? 'text-on-surface' : 'text-outline'">
                      {{ eForm.identification_expiry_date
                        ? new Date(eForm.identification_expiry_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month:
                            'short', year: 'numeric'
                        })
                        : 'Select date' }}
                    </span>
                    <font-awesome-icon icon="calendar" class="text-on-surface-variant text-sm" />
                  </div>
                </template>

                <template #action-buttons>
                  <div
                    class="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low px-lg py-md w-full">
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95">
                      Cancel
                    </button>
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium bg-primary text-white hover:opacity-90 transition-all active:scale-95">
                      Apply Selection
                    </button>
                  </div>
                </template>
              </VueDatePicker>
            </div>
          </div>
        </section>

        <!-- ── STEP 2 · Identity ───────────────────────────────────────────── -->
        <section v-show="wizStep === 2"
          class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-5">
          <div class="flex items-center gap-2 text-primary"><font-awesome-icon :icon="['fas', 'id-badge']"
              class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Identity</span></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div><label class="u-label">First Name</label><input v-model="eForm.first_name" class="u-input" /></div>
            <div><label class="u-label">Middle Name</label><input v-model="eForm.middle_name" class="u-input"
                placeholder="Optional" /></div>
            <div><label class="u-label">Last Name</label><input v-model="eForm.last_name" class="u-input" /></div>
            <div><label class="u-label">Preferred Name</label><input v-model="eForm.preferred_name" class="u-input"
                placeholder="Optional" /></div>
            <div>
              <label class="u-label">Date of Birth</label>

              <VueDatePicker v-model="eForm.date_of_birth" :enable-time-picker="false" :clearable="false"
                hide-input-icon auto-apply format="yyyy-MM-dd" :day-names="['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']"
                week-start="0">
                <template #trigger>
                  <div class="u-input cursor-pointer flex items-center justify-between">
                    <span :class="eForm.date_of_birth ? 'text-on-surface' : 'text-outline'">
                      {{ eForm.date_of_birth
                        ? new Date(eForm.date_of_birth).toLocaleDateString('en-GB', {
                          day: '2-digit', month:
                            'short', year: 'numeric'
                        })
                        : 'Select date' }}
                    </span>
                    <font-awesome-icon icon="calendar" class="text-on-surface-variant text-sm" />
                  </div>
                </template>

                <template #action-buttons>
                  <div
                    class="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low px-lg py-md w-full">
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95">
                      Cancel
                    </button>
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium bg-primary text-white hover:opacity-90 transition-all active:scale-95">
                      Apply Selection
                    </button>
                  </div>
                </template>
              </VueDatePicker>
            </div>
            <div><label class="u-label">Gender</label><select v-model="eForm.gender"
                class="u-input appearance-none cursor-pointer">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select></div>
            <div class="relative" @click.stop><label class="u-label">Gender Identity</label>
              <div class="relative"><input v-model="genIdSearch" class="u-input pr-8" placeholder="Search…"
                  autocomplete="off" @focus="showGenIdDrop = true" @input="showGenIdDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showGenIdDrop && filtGenId.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="g in filtGenId" :key="g"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selGenId(g)">{{ g }}</button>
                </div>
              </Transition>
            </div>
            <div class="relative" @click.stop><label class="u-label">Marital Status</label>
              <div class="relative"><input v-model="marSearch" class="u-input pr-8" placeholder="Search…"
                  autocomplete="off" @focus="showMarDrop = true" @input="showMarDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showMarDrop && filtMar.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="m in filtMar" :key="m"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selMar(m)">{{ m }}</button>
                </div>
              </Transition>
            </div>
            <div class="relative" @click.stop><label class="u-label">Nationality</label>
              <div class="relative"><input v-model="natSearch" class="u-input" placeholder="Search nationality…"
                  autocomplete="off" @focus="showNatDrop = true" @input="showNatDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showNatDrop && filtNationalities.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="c in filtNationalities.slice(0, 20)" :key="c.id" type="button"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selNationality(c)">{{ c.nationality }}</button>
                </div>
              </Transition>
            </div>
          </div>
        </section>

        <!-- ── STEP 3 · Contact & Address ──────────────────────────────────── -->
        <section v-show="wizStep === 3"
          class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-5">
          <div class="flex items-center gap-2 text-primary"><font-awesome-icon :icon="['fas', 'location-dot']"
              class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Contact &amp; Address</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div><label class="u-label">Primary Phone</label>
              <div class="relative"><font-awesome-icon :icon="['fas', 'phone']"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none" /><input
                  v-model="eForm.phone_primary" type="tel" class="u-input has-icon" /></div>
            </div>
            <div><label class="u-label">Secondary Phone</label>
              <div class="relative"><font-awesome-icon :icon="['fas', 'phone']"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none" /><input
                  v-model="eForm.phone_secondary" type="tel" class="u-input has-icon" placeholder="Optional" /></div>
            </div>
            <div><label class="u-label">Email</label><input v-model="eForm.email" type="email" class="u-input"
                placeholder="Optional" /></div>
            <div class="relative" @click.stop><label class="u-label">Preferred Contact</label>
              <div class="relative"><input v-model="conSearch" class="u-input has-caret" placeholder="Search…"
                  autocomplete="off" @focus="showConDrop = true" @input="showConDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showConDrop && filtCon.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="c in filtCon" :key="c"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selCon(c)">{{ c }}</button>
                </div>
              </Transition>
            </div>
            <div class="sm:col-span-2"><label class="u-label">Address Line 1</label><input v-model="eForm.address_line1"
                class="u-input" /></div>
            <div class="sm:col-span-2"><label class="u-label">Address Line 2</label><input v-model="eForm.address_line2"
                class="u-input" placeholder="Optional" /></div>
            <div class="relative" @click.stop><label class="u-label">Country</label>
              <div class="relative"><input v-model="ctrSearch" class="u-input" placeholder="Search country…"
                  autocomplete="off" @focus="showCtrDrop = true" @input="showCtrDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showCtrDrop && filtCountries.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="c in filtCountries.slice(0, 20)" :key="c.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selCountry(c)">{{ c.fhir_coding.display }}</button>
                </div>
              </Transition>
            </div>
            <div class="relative" @click.stop><label class="u-label">City / Town</label>
              <div class="relative"><font-awesome-icon :icon="['fas', 'city']"
                  class="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" /><input
                  v-model="ctySearch" class="u-input has-icon has-caret"
                  :class="!eForm.country_id ? 'opacity-60 cursor-not-allowed' : ''" :disabled="!eForm.country_id"
                  placeholder="Search city…" autocomplete="off" @focus="showCtyDrop = true"
                  @input="showCtyDrop = true" /><font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showCtyDrop && filtCities.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="c in filtCities.slice(0, 20)" :key="c.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selCity(c)">{{ c.name }}</button>
                </div>
              </Transition>
            </div>
            <div><label class="u-label">Postal Code</label><input v-model="eForm.postal_code" class="u-input"
                placeholder="Optional" /></div>
          </div>
        </section>

        <!-- ── STEP 4 · Social & Referral + Document ───────────────────────── -->
        <section v-show="wizStep === 4"
          class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-5">
          <div class="flex items-center gap-2 text-primary"><font-awesome-icon :icon="['fas', 'user-group']"
              class="text-sm" /><span class="text-xs font-bold uppercase tracking-widest">Social &amp; Referral</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div><label class="u-label">Occupation</label><input v-model="eForm.occupation" class="u-input"
                placeholder="Optional" /></div>
            <div class="relative" @click.stop><label class="u-label">Education</label>
              <div class="relative"><input v-model="eduSearch" class="u-input pr-8" placeholder="Search…"
                  autocomplete="off" @focus="showEduDrop = true" @input="showEduDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showEduDrop && filtEdu.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="e in filtEdu" :key="e"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selEdu(e)">{{ e }}</button>
                </div>
              </Transition>
            </div>
            <div class="relative" @click.stop><label class="u-label">Religion</label>
              <div class="relative"><input v-model="relSearch" class="u-input pr-8" placeholder="Search…"
                  autocomplete="off" @focus="showRelDrop = true" @input="showRelDrop = true" /><font-awesome-icon
                  :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" /></div>
              <Transition name="dropdown">
                <div v-if="showRelDrop && filtRel.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="r in filtRel" :key="r"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selRel(r)">{{ r }}</button>
                </div>
              </Transition>
            </div>
            <div><label class="u-label">Ethnicity</label><input v-model="eForm.ethnicity" class="u-input"
                placeholder="Optional" /></div>
            <div><label class="u-label">Referring Facility</label><input v-model="eForm.referring_facility"
                class="u-input" placeholder="Optional" /></div>
            <div><label class="u-label">Referring Clinician</label><input v-model="eForm.referring_clinician"
                class="u-input" placeholder="Optional" /></div>
            <div>
              <label class="u-label">Referral Date</label>

              <VueDatePicker v-model="eForm.referral_date" :enable-time-picker="false" :clearable="false"
                hide-input-icon auto-apply format="yyyy-MM-dd" :day-names="['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']"
                week-start="0">
                <template #trigger>
                  <div class="u-input cursor-pointer flex items-center justify-between">
                    <span :class="eForm.referral_date ? 'text-on-surface' : 'text-outline'">
                      {{ eForm.referral_date
                        ? new Date(eForm.referral_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month:
                            'short', year: 'numeric'
                        })
                        : 'Select date' }}
                    </span>
                    <font-awesome-icon icon="calendar" class="text-on-surface-variant text-sm" />
                  </div>
                </template>

                <template #action-buttons>
                  <div
                    class="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low px-lg py-md w-full">
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95">
                      Cancel
                    </button>
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium bg-primary text-white hover:opacity-90 transition-all active:scale-95">
                      Apply Selection
                    </button>
                  </div>
                </template>
              </VueDatePicker>
            </div>

            <!-- Referral document upload -->
            <div class="sm:col-span-2"><label class="u-label">Referral Document</label>
              <div class="flex flex-wrap items-center gap-2">
                <label
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold cursor-pointer hover:bg-primary/20 transition-colors">
                  <font-awesome-icon :icon="['fas', 'paperclip']" />Attach Document
                  <input type="file" accept="image/*,application/pdf" class="hidden" @change="onRefDocChange" />
                </label>
                <button v-if="refDocFile" type="button" class="text-xs font-bold text-error hover:underline"
                  @click="clearRefDoc">Remove</button>
                <button v-if="!refDocFile && hasReferralDoc" type="button"
                  class="text-xs font-bold text-primary hover:underline" @click="showRefDocViewer = true">View
                  current</button>
              </div>
              <p class="text-xs text-on-surface-variant mt-1 truncate">
                {{ refDocFile?.name || (hasReferralDoc ? 'A referral document is on file' : 'No document uploaded') }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="flex items-center w-full gap-2">
          <button class="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
            @click="showUpdateModal = false">Cancel</button>
          <div class="flex items-center gap-2 ml-auto">
            <button v-if="wizStep > 1" type="button"
              class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-on-surface bg-surface-low hover:bg-surface-container transition-colors"
              @click="wizBack"><font-awesome-icon :icon="['fas', 'arrow-left']" />Back</button>
            <!-- Next: shown on every step except the last -->
            <button v-if="wizStep < wizSteps.length" type="button"
              class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-95"
              @click="wizNext">Next<font-awesome-icon :icon="['fas', 'arrow-right']" /></button>
            <!-- Update: always available, so the user can save from any step -->
            <button type="button"
              class="flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
              style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" :disabled="eSaving" @click="submitUpdate">
              <font-awesome-icon v-if="eSaving" :icon="['fas', 'spinner']" spin /><font-awesome-icon v-else
                :icon="['fas', 'floppy-disk']" />{{ eSaving ? 'Saving…' : 'Update Customer' }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- ══ ADD INSURANCE MODAL ════════════════════════════════════════════════ -->
    <Modal v-model="showInsModal" title="Add Insurance Coverage" size="md" class="max-w-[50%]">
      <div class="space-y-4">
        <AppAlert v-if="insError" type="error" :title="insError" />
        <AppAlert v-if="insSuccess" type="success" :title="insSuccess" />
        <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="u-label">Insurance Plan <span class="text-error">*</span></label>
              <div ref="insSelectRef" class="relative">
                <!-- Search input -->
                <div class="relative">
                  <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none" />
                  <input v-model="insSearch" type="text" placeholder="Search insurance plan…"
                    class="u-input has-icon cursor-text" @focus="openIns" />
                </div>
                <!-- Dropdown -->
                <div v-if="insOpen"
                  class="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-outline-variant/30 bg-white shadow-lg">
                  <button v-for="i in insFiltered" :key="i.id" type="button"
                    class="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 hover:bg-primary/5"
                    :class="insForm.insurance_id === i.id ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface'"
                    @click="selectIns(i)">
                    <span class="truncate">{{ i.name }}</span>
                    <font-awesome-icon v-if="insForm.insurance_id === i.id" :icon="['fas', 'check']"
                      class="text-primary text-xs flex-shrink-0" />
                  </button>
                  <p v-if="!insFiltered.length" class="px-4 py-3 text-sm text-on-surface-variant text-center">No plans
                    found.</p>
                </div>
              </div>
            </div>
            <div><label class="u-label">Membership Number <span class="text-error">*</span></label><input
                v-model="insForm.membership_number" class="u-input" placeholder="e.g. 12345678" /></div>
            <div><label class="u-label">Member Type</label><select v-model="insForm.member_type"
                class="u-input appearance-none cursor-pointer">
                <option value="principal">Principal</option>
                <option value="spouse">Spouse</option>
                <option value="dependent">Dependent</option>
              </select></div>
            <div><label class="u-label">Valid From</label><input v-model="insForm.valid_from" type="date"
                class="u-input" />
            </div>
            <div><label class="u-label">Group Number</label><input v-model="insForm.group_number" class="u-input"
                placeholder="Optional" /></div>
            <div class="sm:col-span-2"><label class="u-label">Employer Name</label><input
                v-model="insForm.employer_name" class="u-input" placeholder="Optional" /></div>
            <div class="sm:col-span-2 flex items-center gap-2"><input v-model="insForm.is_primary" type="checkbox"
                id="is_primary" class="w-4 h-4 accent-primary" /><label for="is_primary"
                class="text-sm cursor-pointer">Set
                as primary insurance</label></div>
          </div>
        </section>
      </div>
      <template #footer>
        <button class="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
          @click="showInsModal = false">Cancel</button>
        <button
          class="flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
          style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" :disabled="insSaving" @click="submitIns">
          <font-awesome-icon v-if="insSaving" :icon="['fas', 'spinner']" spin /><font-awesome-icon v-else
            :icon="['fas', 'shield-halved']" />{{ insSaving ? 'Saving…' : 'Add Coverage' }}
        </button>
      </template>
    </Modal>

    <!-- ══ PRE-COSTING WIZARD MODAL ══════════════════════════════════════════ -->
    <Modal v-model="showPreCostModal" title="Service Pre-Costing" subtitle="Build a cost estimate before admission"
      size="xl" :show-logo="false" class="max-w-[90%]">
      <div class="space-y-5">
        <AppAlert v-if="pcError" type="error" :title="pcError" />
        <AppAlert v-if="pcSuccess" type="success" :title="pcSuccess" />
        <!-- Progress steps — adaptive based on encounter selection -->
        <div class="flex items-center gap-1">
          <template v-for="(step, i) in pcSteps" :key="step.id">
            <div class="flex flex-col items-center min-w-0" :class="i < pcSteps.length - 1 ? 'flex-1' : ''">
              <div class="flex items-center w-full">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all"
                  :class="pcStep === i + 1 ? 'bg-primary border-primary text-white shadow-sm' : pcStep > i + 1 ? 'bg-secondary border-secondary text-white' : 'border-outline-variant text-outline bg-white'">
                  <font-awesome-icon v-if="pcStep > i + 1" :icon="['fas', 'check']" class="text-xs" />
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <div v-if="i < pcSteps.length - 1" class="flex-1 h-0.5 mx-1 rounded"
                  :class="pcStep > i + 1 ? 'bg-secondary' : 'bg-outline-variant/30'" />
              </div>
              <span class="text-xs mt-1 font-semibold whitespace-nowrap"
                :class="pcStep === i + 1 ? 'text-primary' : pcStep > i + 1 ? 'text-secondary' : 'text-outline'">{{
                  step.label }}</span>
            </div>
          </template>
        </div>
        <!-- ── STEP: Billing Taxes ───────────────────────────────────── -->
        <div v-if="currentStepId === 'taxes'" class="space-y-3">
          <p class="text-xs text-on-surface-variant">Select applicable billing taxes. VAT is selected by default.</p>
          <div class="space-y-2">
            <button v-for="tax in billingTaxes" :key="tax.id"
              class="w-full text-left flex items-start gap-4 p-4 rounded-xl transition-all border-2"
              :class="selTaxIds.includes(tax.id) ? 'border-primary bg-primary/4' : 'border-outline-variant/20 bg-white/80 hover:border-primary/30 hover:bg-primary/2'"
              @click="toggleTax(tax.id)">
              <!-- Checkbox -->
              <div class="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                :class="selTaxIds.includes(tax.id) ? 'bg-primary border-primary' : 'border-outline-variant'">
                <font-awesome-icon v-if="selTaxIds.includes(tax.id)" :icon="['fas', 'check']"
                  class="text-white text-xs" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-bold text-on-surface">{{ tax.name }}</span>
                  <span class="font-mono text-xs px-1.5 py-0.5 rounded font-bold"
                    :class="tax.mode === 'collect' ? 'bg-primary-fixed text-primary-on-fixed' : 'bg-accent-fixed text-accent-on-container'">
                    {{ tax.code }}
                  </span>
                  <span class="text-xs font-semibold capitalize px-2 py-0.5 rounded-full"
                    :class="tax.mode === 'collect' ? 'bg-secondary-fixed text-secondary-on-fixed' : 'bg-accent-fixed text-accent-on-container'">
                    {{ tax.mode }}
                  </span>
                </div>
                <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">{{ tax.description }}</p>
              </div>
            </button>
          </div>
        </div>
        <!-- ── STEP: Encounters / Services ──────────────────────────── -->
        <div v-else-if="currentStepId === 'encounters'" class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-on-surface-variant">Select the services for this visit. Selecting Laboratory or
              Radiology
              will add extra steps to pick specific tests.</p>
            <span v-if="selEncs.length"
              class="flex-shrink-0 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{{
                selEncs.length
              }} selected</span>
          </div>
          <!-- Search bar -->
          <div class="relative">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']"
              class="absolute left-3.5 inline-block top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none" />
            <input v-model="encSearch" type="text" placeholder="Search services…" class="u-input has-icon" />
          </div>
          <!-- Service rows — tabular design (Name · Price) -->
          <div class="rounded-xl border border-outline-variant/20 overflow-hidden max-h-80 overflow-y-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="sticky top-0 z-10 bg-primary-fixed/60">
                <tr class="text-left text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  <th class="w-10 px-3 py-2.5"></th>
                  <th class="px-3 py-2.5">Name</th>
                  <th class="px-3 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="e in encPrices" :key="e.uuid">
                  <tr class="border-t border-outline-variant/15 cursor-pointer transition-colors"
                    :class="isSelEnc(e) ? 'bg-primary/5' : 'hover:bg-surface-low'" @click="toggleEnc(e)">
                    <td class="px-3 py-2.5 align-top">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        :class="isSelEnc(e) ? 'bg-primary border-primary' : 'border-outline-variant'">
                        <font-awesome-icon v-if="isSelEnc(e)" :icon="['fas', 'check']" class="text-white text-xs" />
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <p class="font-semibold text-on-surface">{{ e.name }}</p>
                      <p class="text-xs font-mono text-on-surface-variant">{{ e.code }}</p>
                    </td>
                    <!-- currency comes from the row's own price payload -->
                    <td class="px-3 py-2.5 text-right whitespace-nowrap font-bold text-on-surface tabular-nums">
                      {{ fmtMoney(encPrice(e), e.price?.[0]?.currency) }}
                    </td>
                  </tr>
                  <!-- Discount row — only when selected -->
                  <tr v-if="isSelEnc(e)" class="bg-primary/3">
                    <td class="border-t border-primary/10"></td>
                    <td colspan="2" class="border-t border-primary/10 px-3 py-2">
                      <div class="flex items-center gap-3">
                        <font-awesome-icon :icon="['fas', 'tag']" class="text-primary/50 text-xs flex-shrink-0" />
                        <label class="text-xs text-on-surface-variant flex-shrink-0">Discount</label>
                        <div class="relative flex-1 max-w-[160px]">
                          <span
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-outline pointer-events-none">{{
                              e.price?.[0]?.currency ?? currency }}</span>
                          <input type="text" inputmode="decimal" :value="encDiscountDisplay[e.uuid] ?? ''"
                            placeholder="0"
                            class="w-full pl-12 pr-2 py-1.5 text-xs font-mono bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                            @input="onEncDiscount(e.uuid, ($event.target as HTMLInputElement).value)" @click.stop />
                        </div>
                        <p v-if="(encDiscounts[e.uuid] ?? 0) > 0"
                          class="text-xs text-secondary font-semibold flex-shrink-0">
                          Net: {{ fmtMoney(encNet(e), e.price?.[0]?.currency) }}
                        </p>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!encPrices.length">
                  <td colspan="3" class="py-8 text-center text-sm text-on-surface-variant">No services found.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Lab/Radiology hint badges -->
          <div v-if="selEncs.length" class="flex gap-2 flex-wrap">
            <span v-if="needsLab"
              class="flex items-center gap-1.5 text-xs font-bold bg-primary-fixed text-primary-on-fixed px-2.5 py-1 rounded-full border border-primary/30">
              <font-awesome-icon :icon="['fas', 'flask']" class="text-xs" />Laboratory step added
            </span>
            <span v-if="needsRad"
              class="flex items-center gap-1.5 text-xs font-bold bg-tertiary-fixed text-tertiary-on-fixed px-2.5 py-1 rounded-full border border-tertiary/30">
              <font-awesome-icon :icon="['fas', 'x-ray']" class="text-xs" />Radiology step added
            </span>
          </div>
        </div>
        <!-- ── STEP: Laboratory Tests ────────────────────────────────── -->
        <div v-else-if="currentStepId === 'lab'" class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-on-surface-variant">Select laboratory tests to include in the cost estimate.</p>
            <span v-if="selLabs.length"
              class="flex-shrink-0 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{{
                selLabs.length
              }} selected</span>
          </div>
          <div class="relative">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']"
              class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none" />
            <input v-model="labSearch" type="text" placeholder="Search laboratory tests…" class="u-input has-icon" />
          </div>
          <!-- Tabular design (Name · Department · Price) -->
          <div class="rounded-xl border border-outline-variant/20 overflow-hidden max-h-80 overflow-y-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="sticky top-0 z-10 bg-secondary-fixed/60">
                <tr class="text-left text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  <th class="w-10 px-3 py-2.5"></th>
                  <th class="px-3 py-2.5">Name</th>
                  <th class="px-3 py-2.5">Department</th>
                  <th class="px-3 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="l in labPrices" :key="l.uuid">
                  <tr class="border-t border-outline-variant/15 cursor-pointer transition-colors"
                    :class="isSelLab(l) ? 'bg-primary/5' : 'hover:bg-surface-low'" @click="toggleLab(l)">
                    <td class="px-3 py-2.5 align-top">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        :class="isSelLab(l) ? 'bg-primary border-primary' : 'border-outline-variant'">
                        <font-awesome-icon v-if="isSelLab(l)" :icon="['fas', 'check']" class="text-white text-xs" />
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <p class="font-semibold text-on-surface">{{ l.name }}</p>
                      <p class="text-xs font-mono text-on-surface-variant">{{ l.code }}</p>
                    </td>
                    <td class="px-3 py-2.5 text-on-surface-variant whitespace-nowrap">{{ l.department }}</td>
                    <!-- currency comes from the row's own price payload -->
                    <td class="px-3 py-2.5 text-right whitespace-nowrap font-bold text-on-surface tabular-nums">
                      {{ fmtMoney(labPrice(l), l.price?.[0]?.currency) }}
                    </td>
                  </tr>
                  <tr v-if="isSelLab(l)" class="bg-primary/3">
                    <td class="border-t border-primary/10"></td>
                    <td colspan="3" class="border-t border-primary/10 px-3 py-2">
                      <div class="flex items-center gap-3">
                        <font-awesome-icon :icon="['fas', 'tag']" class="text-primary/50 text-xs flex-shrink-0" />
                        <label class="text-xs text-on-surface-variant flex-shrink-0">Discount</label>
                        <div class="relative flex-1 max-w-[160px]">
                          <span
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-outline pointer-events-none">{{
                              l.price?.[0]?.currency ?? currency }}</span>
                          <input type="text" inputmode="decimal" :value="labDiscountDisplay[l.uuid] ?? ''"
                            placeholder="0"
                            class="w-full pl-12 pr-2 py-1.5 text-xs font-mono bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                            @input="onLabDiscount(l.uuid, ($event.target as HTMLInputElement).value)" @click.stop />
                        </div>
                        <p v-if="(labDiscounts[l.uuid] ?? 0) > 0"
                          class="text-xs text-secondary font-semibold flex-shrink-0">
                          Net: {{ fmtMoney(labNet(l), l.price?.[0]?.currency) }}
                        </p>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!labPrices.length">
                  <td colspan="4" class="py-8 text-center text-sm text-on-surface-variant">No laboratory tests found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- ── STEP: Radiology Images ─────────────────────────────────── -->
        <div v-else-if="currentStepId === 'imaging'" class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-on-surface-variant">Select radiology investigations to include.</p>
            <span v-if="selRads.length"
              class="flex-shrink-0 text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{{
                selRads.length
              }} selected</span>
          </div>
          <div class="relative">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']"
              class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none" />
            <input v-model="radSearch" type="text" placeholder="Search radiology images…" class="u-input has-icon" />
          </div>
          <!-- Tabular design (Name · Department · Price) -->
          <div class="rounded-xl border border-outline-variant/20 overflow-hidden max-h-80 overflow-y-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="sticky top-0 z-10 bg-tertiary-fixed/60">
                <tr class="text-left text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  <th class="w-10 px-3 py-2.5"></th>
                  <th class="px-3 py-2.5">Name</th>
                  <th class="px-3 py-2.5">Department</th>
                  <th class="px-3 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="r in radPrices" :key="r.uuid">
                  <tr class="border-t border-outline-variant/15 cursor-pointer transition-colors"
                    :class="isSelRad(r) ? 'bg-primary/5' : 'hover:bg-surface-low'" @click="toggleRad(r)">
                    <td class="px-3 py-2.5 align-top">
                      <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                        :class="isSelRad(r) ? 'bg-primary border-primary' : 'border-outline-variant'">
                        <font-awesome-icon v-if="isSelRad(r)" :icon="['fas', 'check']" class="text-white text-xs" />
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      <p class="font-semibold text-on-surface">{{ r.name }}</p>
                      <p class="text-xs font-mono text-on-surface-variant">{{ r.code }}</p>
                    </td>
                    <td class="px-3 py-2.5 text-on-surface-variant whitespace-nowrap">{{ r.department }}</td>
                    <!-- currency comes from the row's own price payload -->
                    <td class="px-3 py-2.5 text-right whitespace-nowrap font-bold text-on-surface tabular-nums">
                      {{ fmtMoney(radPrice(r), r.price?.[0]?.currency) }}
                    </td>
                  </tr>
                  <tr v-if="isSelRad(r)" class="bg-primary/3">
                    <td class="border-t border-primary/10"></td>
                    <td colspan="3" class="border-t border-primary/10 px-3 py-2">
                      <div class="flex items-center gap-3">
                        <font-awesome-icon :icon="['fas', 'tag']" class="text-primary/50 text-xs flex-shrink-0" />
                        <label class="text-xs text-on-surface-variant flex-shrink-0">Discount</label>
                        <div class="relative flex-1 max-w-[160px]">
                          <span
                            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-outline pointer-events-none">{{
                              r.price?.[0]?.currency ?? currency }}</span>
                          <input type="text" inputmode="decimal" :value="radDiscountDisplay[r.uuid] ?? ''"
                            placeholder="0"
                            class="w-full pl-12 pr-2 py-1.5 text-xs font-mono bg-white border border-primary/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-on-surface"
                            @input="onRadDiscount(r.uuid, ($event.target as HTMLInputElement).value)" @click.stop />
                        </div>
                        <p v-if="(radDiscounts[r.uuid] ?? 0) > 0"
                          class="text-xs text-secondary font-semibold flex-shrink-0">
                          Net: {{ fmtMoney(radNet(r), r.price?.[0]?.currency) }}
                        </p>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!radPrices.length">
                  <td colspan="4" class="py-8 text-center text-sm text-on-surface-variant">No radiology images found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- ── STEP: Summary — receipt style ────────────────────────── -->
        <div v-else-if="currentStepId === 'summary'">
          <!--
        Receipt card: white paper-like surface, dashed centre dividers,
        IBCC header, line items grouped by category, tax section, total.
      -->
          <div class="rounded-2xl overflow-hidden"
            style="background:#ffffff; box-shadow: 0 4px 24px rgba(0,51,153,0.10), 0 1px 4px rgba(0,0,0,0.06);">
            <!-- Receipt header -->
            <div class="flex flex-col items-center gap-1 px-6 py-6"
              style="background:linear-gradient(135deg,#f1f5f9 0%,#cbd5e1 100%);border-bottom:1px solid rgba(0,0,0,0.06);">
              <img src="/images/ibcc_logo.png" alt="IBCC" class="w-auto max-w-[220px] object-contain mb-2 block"
                @error="($event.target as HTMLImageElement).style.display = 'none'" />
              <p class="text-on-surface font-bold text-sm tracking-wide">International Blantyre Cancer Centre</p>
              <p class="text-on-surface-variant text-xs">Service Pre-Costing Estimate</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                <span>{{ p?.full_name }}</span>
                <span class="opacity-40">·</span>
                <span class="font-mono">{{ p?.no }}</span>
                <span class="opacity-40">·</span>
                <span>{{ new Date().toLocaleDateString('en-MW', { dateStyle: 'medium' }) }}</span>
              </div>
            </div>
            <!-- Receipt body -->
            <div class="px-6 py-4 space-y-0">
              <!-- ── Encounters ─────────────────────────────────── -->
              <div v-if="selEncs.length">
                <div class="flex items-center gap-2 py-3">
                  <font-awesome-icon :icon="['fas', 'notes-medical']" class="text-primary text-xs flex-shrink-0" />
                  <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Clinical
                    Services</span>
                </div>
                <div v-for="(e, i) in selEncs" :key="e.uuid" class="flex items-start justify-between gap-3 py-2.5"
                  :class="i < selEncs.length - 1 ? 'border-b border-dashed border-outline-variant/25' : ''">
                  <div class="min-w-0">
                    <p class="text-sm text-on-surface leading-snug">{{ e.name }}</p>
                    <p class="text-xs font-mono text-outline mt-0.5">{{ e.code }}</p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-on-surface tabular-nums">{{ fmtMoney(encNet(e), priceCcy(e)) }}</p>
                    <p v-if="(encDiscounts[e.uuid] ?? 0) > 0" class="text-xs text-secondary tabular-nums">-{{
                      fmtMoney(encDiscounts[e.uuid] ?? 0, priceCcy(e)) }}</p>
                  </div>
                </div>
              </div>
              <!-- Section divider -->
              <div v-if="selEncs.length && (selLabs.length || selRads.length)"
                class="my-1 border-t-2 border-dashed border-outline-variant/20" />
              <!-- ── Laboratory Tests ───────────────────────────── -->
              <div v-if="selLabs.length">
                <div class="flex items-center gap-2 py-3">
                  <font-awesome-icon :icon="['fas', 'flask']" class="text-primary text-xs flex-shrink-0" />
                  <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Laboratory
                    Tests</span>
                  <span class="ml-auto text-xs text-outline">{{ selLabs.length }} test{{ selLabs.length !== 1 ? 's' : ''
                    }}</span>
                </div>
                <div v-for="(l, i) in selLabs" :key="l.uuid" class="flex items-start justify-between gap-3 py-2.5"
                  :class="i < selLabs.length - 1 ? 'border-b border-dashed border-outline-variant/25' : ''">
                  <div class="min-w-0">
                    <p class="text-sm text-on-surface leading-snug truncate">{{ l.name }}</p>
                    <p class="text-xs text-outline mt-0.5">{{ l.department }} · <span class="font-mono">{{ l.code
                        }}</span>
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-on-surface tabular-nums">{{ fmtMoney(labNet(l), priceCcy(l)) }}</p>
                    <p v-if="(labDiscounts[l.uuid] ?? 0) > 0" class="text-xs text-secondary tabular-nums">-{{
                      fmtMoney(labDiscounts[l.uuid] ?? 0, priceCcy(l)) }}</p>
                  </div>
                </div>
              </div>
              <!-- Section divider -->
              <div v-if="selLabs.length && selRads.length"
                class="my-1 border-t-2 border-dashed border-outline-variant/20" />
              <!-- ── Radiology ───────────────────────────────────── -->
              <div v-if="selRads.length">
                <div class="flex items-center gap-2 py-3">
                  <font-awesome-icon :icon="['fas', 'x-ray']" class="text-primary text-xs flex-shrink-0" />
                  <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Radiology</span>
                  <span class="ml-auto text-xs text-outline">{{ selRads.length }} image{{ selRads.length !== 1 ? 's' :
                    ''
                    }}</span>
                </div>
                <div v-for="(r, i) in selRads" :key="r.uuid" class="flex items-start justify-between gap-3 py-2.5"
                  :class="i < selRads.length - 1 ? 'border-b border-dashed border-outline-variant/25' : ''">
                  <div class="min-w-0">
                    <p class="text-sm text-on-surface leading-snug truncate">{{ r.name }}</p>
                    <p class="text-xs text-outline mt-0.5">{{ r.department }} · <span class="font-mono">{{ r.code
                        }}</span>
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-on-surface tabular-nums">{{ fmtMoney(radNet(r), priceCcy(r)) }}</p>
                    <p v-if="(radDiscounts[r.uuid] ?? 0) > 0" class="text-xs text-secondary tabular-nums">-{{
                      fmtMoney(radDiscounts[r.uuid] ?? 0, priceCcy(r)) }}</p>
                  </div>
                </div>
              </div>
              <!-- Subtotal row -->
              <div class="mt-1 border-t border-outline-variant/30 pt-3 space-y-1.5">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-on-surface-variant">Gross</p>
                  <p class="text-xs text-on-surface-variant tabular-nums">{{ fmtMoney(subtotal, pcCurrency) }}</p>
                </div>
                <div v-if="subtotal !== subtotalNet" class="flex items-center justify-between">
                  <p class="text-xs text-secondary">Total Discounts</p>
                  <p class="text-xs text-secondary tabular-nums">-{{ fmtMoney(subtotal - subtotalNet, pcCurrency) }}</p>
                </div>
                <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                  <p class="text-sm font-bold text-on-surface">Subtotal (after discounts)</p>
                  <p class="text-sm font-bold tabular-nums">{{ fmtMoney(subtotalNet, pcCurrency) }}</p>
                </div>
              </div>
              <!-- ── Billing Taxes ───────────────────────────────── -->
              <div v-if="selTaxIds.length" class="border-t border-dashed border-outline-variant/25 pt-3 space-y-2 mt-1">
                <div class="flex items-center gap-2 mb-2">
                  <font-awesome-icon :icon="['fas', 'percent']" class="text-accent text-xs flex-shrink-0" />
                  <span class="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Applicable
                    Taxes</span>
                </div>
                <div v-for="tid in selTaxIds" :key="tid" class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold bg-accent-fixed text-accent-on-container px-1.5 py-0.5 rounded">{{
                      billingTaxes.find(t => t.id === tid)?.code}}</span>
                    <span class="text-sm text-on-surface-variant">{{billingTaxes.find(t => t.id === tid)?.name}}</span>
                  </div>
                  <span class="text-xs font-semibold capitalize text-on-surface-variant">{{
                    billingTaxes.find(t => t.id === tid)?.mode}}</span>
                </div>
              </div>
            </div>
            <!-- Receipt footer — total -->
            <div class="px-6 py-4 mt-2" style="background:linear-gradient(135deg,#0050cb 0%,#003fa4 100%);">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-white/70 text-xs font-semibold uppercase tracking-widest">Estimated Total</p>
                  <p class="text-white/60 text-xs mt-0.5">Before tax adjustments &amp; discounts</p>
                </div>
                <p class="text-2xl font-bold text-white tabular-nums">{{ fmtMoney(subtotalNet, pcCurrency) }}</p>
              </div>
            </div>
            <!-- Perforated tear line -->
            <div class="flex items-center gap-1 px-4 py-2 bg-surface-low">
              <div v-for="n in 28" :key="n" class="flex-1 h-1 rounded-full"
                :class="n % 2 === 0 ? 'bg-outline-variant/30' : 'bg-transparent'" />
            </div>
            <p class="text-center text-xs text-outline py-2 px-4">This is a pre-costing estimate only. Final invoice may
              differ. · IBCC © {{ new Date().getFullYear() }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
          @click="pcStep > 1 ? pcStep-- : showPreCostModal = false">
          {{ pcStep > 1 ? '← Back' : 'Cancel' }}
        </button>
        <!-- Next button for all steps except summary -->
        <button v-if="currentStepId !== 'summary'"
          class="flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
          style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" @click="pcNext">
          Next <font-awesome-icon :icon="['fas', 'arrow-right']" />
        </button>
        <!-- Save on summary -->
        <button v-else
          class="flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
          style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" :disabled="pcSaving" @click="submitPreCost">
          <font-awesome-icon v-if="pcSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'calculator']" />
          {{ pcSaving ? 'Saving…' : 'Save Pre-Costing' }}
        </button>
      </template>
    </Modal>

    <!-- ══ SCHEDULE-VISIT INVOICE LIST MODAL ════════════════════════════════ -->
    <Modal v-model="showScheduleListModal" title="Schedule a Visit"
      subtitle="Invoices ready for a patient visit appointment" size="md">
      <!-- Header callout -->
      <div class="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-secondary-fixed border border-secondary/20">
        <div class="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0">
          <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-secondary text-sm" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-secondary-on-fixed leading-tight">{{ toScheduleInvoices.length }} invoice{{
            toScheduleInvoices.length !== 1 ? 's' : '' }} awaiting scheduling</p>
          <p class="text-xs text-secondary leading-tight mt-0.5">Select one to open it and book the visit</p>
        </div>
      </div>

      <div v-if="toScheduleInvoices.length" class="flex flex-col gap-2 max-h-[52vh] overflow-y-auto pr-1">
        <button v-for="pi in toScheduleInvoices" :key="`schm-${pi.uuid}`" type="button"
          class="group w-full text-left rounded-xl border border-outline-variant/30 bg-white hover:border-secondary hover:bg-secondary-fixed/30 transition-all shadow-sm hover:shadow-md"
          @click="showScheduleListModal = false; router.push({ path: `/customers/proforma-invoice/${pi.uuid}`, query: { customer_uuid: uuid } })">
          <div class="flex items-center gap-3 px-4 py-3.5">
            <!-- Invoice icon -->
            <div
              class="w-9 h-9 rounded-lg bg-secondary-fixed group-hover:bg-secondary-fixed flex items-center justify-center flex-shrink-0 transition-colors">
              <font-awesome-icon :icon="['fas', 'file-invoice-dollar']" class="text-secondary text-sm" />
            </div>
            <!-- Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold font-mono text-on-surface">{{ pi.no }}</span>
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                  :class="pi.is_settled ? 'bg-secondary-fixed text-secondary-on-fixed' : 'bg-accent-fixed text-accent-on-container'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="pi.is_settled ? 'bg-secondary' : 'bg-accent'" />
                  {{ pi.is_settled ? 'Settled' : 'Unsettled' }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-0.5 text-xs text-on-surface-variant">
                <span>{{ pi.total_services }} service{{ pi.total_services !== 1 ? 's' : '' }}</span>
                <span class="text-outline/30">·</span>
                <span class="font-semibold text-on-surface">{{ pi.currency }}{{
                  Number(pi.total_price).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</span>
                <span v-if="Number(pi.outstanding) > 0" class="text-error font-semibold">
                  {{ pi.currency }}{{ Number(pi.outstanding).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}
                  due
                </span>
              </div>
            </div>
            <!-- CTA arrow -->
            <span
              class="flex items-center gap-1.5 text-xs font-bold text-secondary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              Open <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" />
            </span>
          </div>
        </button>
      </div>
      <div v-else class="py-10 text-center">
        <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-3xl text-outline/20 mb-2" />
        <p class="text-sm text-on-surface-variant">No invoices awaiting a scheduled visit.</p>
      </div>

      <template #footer>
        <button class="btn-secondary" @click="showScheduleListModal = false">Close</button>
      </template>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface FhirExtension { url: string; code: string; valueString?: string; valueBoolean?: boolean; valueDate?: string }
interface FhirIdentifier { use: string; type: { text: string; coding?: { display: string }[] }; value: string; period?: { end: string } }
interface FhirName { use: string; text?: string; family?: string; given?: string[] }
interface FhirAddress { use: string; line?: string[]; city?: string; state?: string; country?: string; postalCode?: string | null }
interface ReferralDoc { id: number; document: string }
interface FhirCustomer {
  resourceType: string; id: string
  identifier: FhirIdentifier[]; active: boolean
  name: FhirName[]; telecom: { system: string; value: string; use: string }[]
  gender: string; birthDate: string; address: FhirAddress[]; extension: FhirExtension[]
  profile_photo?: string | null
}
interface Coverage { uuid: string; scheme_name: string; scheme_code: string; provider: string; membership_number: string; member_type: string; direct_billing: boolean; valid_from: string; valid_to: string | null; is_primary: boolean; latest_completed_forms: { id: number; url: string; uploaded_on: string }[] }
interface DashboardData {
  customer: { uuid: string; no: string; full_name: string; preferred_name: string | null; date_of_birth: string; nationality: string; age: number; gender: string; identification: { type: string; number: string; expiry_date: string } | null; phone_primary: string; registered_at: string; registered_by: string }
  category: { name: string; accept_insurance: boolean }
  insurance: { has_insurance: boolean; active_coverages: Coverage[] }
  pre_costing: Record<string, unknown>; billing_summary: BillingSummary
}
interface Insurance { id: number; uuid: string; name: string }
interface BillingTax { id: number; name: string; code: string; mode: string; description: string }
interface EncounterPrice { uuid: string; name: string; code: string; price: { currency: string; amount: string }[] }
interface LabPrice { uuid: string; name: string; code: string; department: string; price: { currency: string; amount: number }[] }
interface RadPrice { uuid: string; name: string; code: string; department: string; price: { currency: string; amount: number }[] }
interface Country { id: number; name: string; alpha2: string; phone_code: string; nationality: string; fhir_coding: { display: string } }
interface PreCostingRecord {
  uuid: string; no: string; currency: string; total_services: number; total: number
  discount: { percentage: number; amount: number }
  sub_total: number; total_price: number
  taxation: { name: string; mode: string; percentage: number; tax_amount: number }[]
  created_by: string; created_at: string
}
interface State { id: number; name: string; country_id: number }
interface City { id: number; name: string; state_id: number }
interface Category { id: number; uuid: string; name: string; description: string; accept_insurance: boolean }
interface IdType { id: number; uuid: string; name: string; description: string }
interface ProformaRecord {
  uuid: string; no: string; pre_costing_no: string; currency: string; total_services: number; total: number
  discount: { percentage: number; amount: number }
  sub_total: number; total_price: string
  taxation: { name: string; mode: string; percentage: number; tax_amount: number }[]
  total_paid: string; outstanding: string; is_settled: boolean; to_be_scheduled: boolean
  created_by: string; created_at: string
}
interface ReceiptRecord {
  uuid: string; no: string; proforma_invoice_no: string; payment_method: string; currency: string
  total_price: string; paid_amount: string; balance_amount: string; change_amount: string
  payment_description: string | null; proof_of_payment: string | null
  created_by: string; created_at: string
}
interface Money { MWK: number | string; USD: number | string }
interface RecentInvoice {
  uuid: string
  proforma_invoice_no: string
  currency: string
  status: string
  total: string | number
  paid: string | number
  outstanding: string | number
  created_at: string
}

interface BillingSummary {
  total_invoices: number
  total_billed: Money; total_paid: Money; total_outstanding: Money; insurance_covered: Money
  unpaid_invoices: number; recent_invoices: RecentInvoice[]
}

const route = useRoute()
const router = useRouter()
const { request, loading } = useApi()
const { showSkeleton } = useDelayedLoading(loading)
const { denied } = usePageGuard(['customer_view'])
const { can } = usePermission()
const uuid = computed(() => route.params.uuid as string)

// ── Core data ──────────────────────────────────────────────────────────────
const dash = ref<DashboardData | null>(null)
const fhirData = ref<FhirCustomer | null>(null)
const qrSvg = ref('')

// ── Tabs ───────────────────────────────────────────────────────────────────
const acceptsInsurance = computed(() => fhirData.value?.extension?.find(e => e.code === 'ACCEPT_INSURANCE')?.valueBoolean ?? false)
const tabs = computed(() => {
  const t = [
    { id: 'general', label: 'General Information', icon: ['fas', 'user'] as [string, string] },
    { id: 'pre_costing', label: 'Pre-Costing', icon: ['fas', 'calculator'] as [string, string] },
    { id: 'preforma-invoice', label: 'Proforma-Invoice', icon: ['fas', 'file-invoice-dollar'] as [string, string] },
    { id: 'receipts', label: 'Receipts', icon: ['fas', 'receipt'] as [string, string] },
  ]
  if (acceptsInsurance.value) t.splice(1, 0, { id: 'insurance', label: 'Insurance', icon: ['fas', 'shield-halved'] as [string, string] })
  return t
})
const activeTab = ref<string>('general')

// ── FHIR helpers ───────────────────────────────────────────────────────────
const ext = (code: string) => fhirData.value?.extension?.find(e => e.code === code)
const fmtDate = (d: string | undefined | null) => d ? new Date(d).toLocaleDateString('en-MW', { dateStyle: 'medium' }) : '—'
const initials = (n: string) => n?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() ?? '?'
const p = computed(() => dash.value?.customer)
const cat = computed(() => dash.value?.category)
const ins = computed(() => dash.value?.insurance)
const officialName = computed(() => fhirData.value?.name?.find(n => n.use === 'official'))
const addr0 = computed(() => fhirData.value?.address?.[0])
const phone0 = computed(() => fhirData.value?.telecom?.find(t => t.system === 'phone'))
const idNo = computed(() => fhirData.value?.identifier?.find(i => i.type?.text !== 'Customer Number'))
// Profile photo (falls back to initials if absent or load fails)
const profilePhoto = computed(() => fhirData.value?.profile_photo || '')
const photoError = ref(false)

// Referral documents — array lives under valueDate on this extension
const referralDocs = computed<ReferralDoc[]>(() => {
  const v = ext('REFERRAL_DOCUMENTS')?.valueDate as unknown
  return Array.isArray(v) ? (v as ReferralDoc[]) : []
})
const isImageDoc = (url: string) =>
  /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(url) || /content-type=image/i.test(url)

// Billing
const billing = computed(() => dash.value?.billing_summary)

const noInsurance = computed(() => acceptsInsurance.value && (!ins.value?.has_insurance || !ins.value?.active_coverages.length))
const dismissInsHint = ref(false)

// ── Reference data ─────────────────────────────────────────────────────────
const categories = ref<Category[]>([]); const idTypes = ref<IdType[]>([])
const countries = ref<Country[]>([]); const allStates = ref<State[]>([]); const allCities = ref<City[]>([])
const insurances = ref<Insurance[]>([]); const insLoaded = ref(false)
const refLoaded = ref(false)

// Combobox state — edit form
const catSearch = ref(''); const showCatDrop = ref(false)
const idtSearch = ref(''); const showIdtDrop = ref(false)
const ctrSearch = ref(''); const showCtrDrop = ref(false)
const natSearch = ref(''); const showNatDrop = ref(false)
const ctySearch = ref(''); const showCtyDrop = ref(false)
const marSearch = ref(''); const showMarDrop = ref(false)
const conSearch = ref(''); const showConDrop = ref(false)
const genIdSearch = ref(''); const showGenIdDrop = ref(false)
const eduSearch = ref(''); const showEduDrop = ref(false)
const relSearch = ref(''); const showRelDrop = ref(false)

const filtCats = computed(() => { const q = catSearch.value.toLowerCase(); return q ? categories.value.filter(c => c.name.toLowerCase().includes(q)) : categories.value })
const filtIdts = computed(() => { const q = idtSearch.value.toLowerCase(); return q ? idTypes.value.filter(t => t.name.toLowerCase().includes(q)) : idTypes.value })
const filtCountries = computed(() => { const q = ctrSearch.value.toLowerCase(); return q ? countries.value.filter(c => c.fhir_coding.display.toLowerCase().includes(q)) : countries.value })
const filtNationalities = computed(() => { const q = natSearch.value.toLowerCase(); return q ? countries.value.filter(c => c.nationality.toLowerCase().includes(q)) : countries.value })
const filtCities = computed(() => { const q = ctySearch.value.toLowerCase(); const base = eForm.state_id ? allCities.value.filter(c => c.state_id === Number(eForm.state_id)) : allCities.value; return q ? base.filter(c => c.name.toLowerCase().includes(q)) : base })
const marOpts = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
const conOpts = ['Phone', 'SMS', 'Email', 'WhatsApp']
const genIdOpts = ['Cisgender Man', 'Cisgender Woman', 'Non-binary', 'Transgender Man', 'Transgender Woman', 'Other']
const eduOpts = ['Primary', 'Secondary', 'Tertiary', 'Postgraduate', 'Vocational', 'None']
const relOpts = ['Christianity', 'Islam', 'Hinduism', 'Traditional', 'Other', 'None']
const filtMar = computed(() => { const q = marSearch.value.toLowerCase(); return q ? marOpts.filter(m => m.toLowerCase().includes(q)) : marOpts })
const filtCon = computed(() => { const q = conSearch.value.toLowerCase(); return q ? conOpts.filter(c => c.toLowerCase().includes(q)) : conOpts })
const filtGenId = computed(() => { const q = genIdSearch.value.toLowerCase(); return q ? genIdOpts.filter(g => g.toLowerCase().includes(q)) : genIdOpts })
const filtEdu = computed(() => { const q = eduSearch.value.toLowerCase(); return q ? eduOpts.filter(e => e.toLowerCase().includes(q)) : eduOpts })
const filtRel = computed(() => { const q = relSearch.value.toLowerCase(); return q ? relOpts.filter(r => r.toLowerCase().includes(q)) : relOpts })

const closeDrops = () => { showNatDrop.value = false; showCatDrop.value = false; showIdtDrop.value = false; showCtrDrop.value = false; showCtyDrop.value = false; showMarDrop.value = false; showConDrop.value = false; showGenIdDrop.value = false; showEduDrop.value = false; showRelDrop.value = false }
const selCat = (c: Category) => { eForm.customer_category_id = String(c.id); catSearch.value = c.name; showCatDrop.value = false }
const selIdt = (t: IdType) => { eForm.identification_type_id = String(t.id); idtSearch.value = t.name; showIdtDrop.value = false }
const selMar = (m: string) => { eForm.marital_status = m.toLowerCase(); marSearch.value = m; showMarDrop.value = false }
const selCon = (c: string) => { eForm.preferred_contact_method = c.toLowerCase(); conSearch.value = c; showConDrop.value = false }
const selGenId = (g: string) => { eForm.gender_identity = g.toLowerCase().replace(/ /g, '_'); genIdSearch.value = g; showGenIdDrop.value = false }
const selEdu = (e: string) => { eForm.education_level = e.toLowerCase(); eduSearch.value = e; showEduDrop.value = false }
const selRel = (r: string) => { eForm.religion = r.toLowerCase(); relSearch.value = r; showRelDrop.value = false }
const selCountry = async (c: Country) => { eForm.country_id = String(c.id); eForm.country_name = c.fhir_coding.display; ctrSearch.value = c.fhir_coding.display; showCtrDrop.value = false; eForm.state_id = ''; eForm.city_id = ''; eForm.city_name = ''; ctySearch.value = ''; const [s, ci] = await Promise.all([request<State[]>(`/states?country_id=${c.id}`), request<City[]>(`/cities?country_id=${c.id}`)]); if (s) allStates.value = s; if (ci) allCities.value = ci }
const selNationality = (c: Country) => { eForm.nationality_id = String(c.id); eForm.nationality = c.nationality; natSearch.value = c.nationality; showNatDrop.value = false }
// Match an existing nationality string (from FHIR) to a country id once countries are loaded
const resolveNat = () => {
  const val = (eForm.nationality || '').toLowerCase().trim()
  if (!val || !countries.value.length) return
  const m = countries.value.find(c => c.nationality.toLowerCase() === val) || countries.value.find(c => c.nationality.toLowerCase().includes(val))
  if (m) { eForm.nationality_id = String(m.id); eForm.nationality = m.nationality; natSearch.value = m.nationality }
}

const selCity = (c: City) => { eForm.city_id = String(c.id); eForm.city_name = c.name; ctySearch.value = c.name; showCtyDrop.value = false; const s = allStates.value.find(x => x.id === c.state_id); if (s) eForm.state_id = String(s.id) }

const loadRefs = async () => {
  if (refLoaded.value) return
  const [c, s, ci, cat, idt] = await Promise.all([request<Country[]>('/countries'), request<State[]>('/states'), request<City[]>('/cities?country_alpha2=MW'), request<Category[]>('/customer_categories'), request<IdType[]>('/identification_types')])
  if (c) countries.value = c; if (s) allStates.value = s; if (ci) allCities.value = ci; if (cat) categories.value = cat; if (idt) idTypes.value = idt
  refLoaded.value = true
  resolveNat()
}
const loadIns = async () => { if (insLoaded.value) return; const d = await request<Insurance[]>('/insurances'); if (d) insurances.value = d; insLoaded.value = true }

// ── Load all ───────────────────────────────────────────────────────────────
const loadAll = async () => {
  const [d, f] = await Promise.all([request<DashboardData>(`/customer/dashboard?uuid=${uuid.value}`), request<FhirCustomer>(`/customer/show?uuid=${uuid.value}`)])
  if (d) dash.value = d
  if (f) { fhirData.value = f; populateEditForm() }
}
const loadQr = async () => { const d = await request<{ no: string; qr_svg: string }>(`/customer/qr_code?uuid=${uuid.value}`); if (d?.qr_svg) qrSvg.value = d.qr_svg }

const preCostings = ref<PreCostingRecord[]>([])
const pcListLoading = ref(false)
const { showSkeleton: pcListSkeleton } = useDelayedLoading(pcListLoading)

const loadPreCostings = async () => {
  pcListLoading.value = true
  const d = await request<PreCostingRecord[]>(`/customer/pre_costings?uuid=${uuid.value}`)
  if (d) preCostings.value = d
  pcListLoading.value = false
}

const proformaInvoices = ref<ProformaRecord[]>([])
const piListLoading = ref(false)
const { showSkeleton: piListSkeleton } = useDelayedLoading(piListLoading)

const loadProformaInvoices = async () => {
  piListLoading.value = true
  const d = await request<ProformaRecord[]>(`/customer/proforma_invoices?uuid=${uuid.value}`)
  if (d) proformaInvoices.value = d
  piListLoading.value = false
}

const receipts = ref<ReceiptRecord[]>([])
const rcListLoading = ref(false)
const { showSkeleton: rcListSkeleton } = useDelayedLoading(rcListLoading)

const loadReceipts = async () => {
  rcListLoading.value = true
  const d = await request<ReceiptRecord[]>(`/customer/receipts?uuid=${uuid.value}`)
  if (d) receipts.value = d
  rcListLoading.value = false
}

const headerMenuBtn = ref<HTMLElement | null>(null)
const menuPos = ref({ top: 0, left: 0 })

const toggleHeaderMenu = () => {
  if (!showHeaderMenu.value) {
    const r = headerMenuBtn.value?.getBoundingClientRect()
    if (r) {
      const menuWidth = 224 // w-56
      menuPos.value = {
        top: r.bottom + 8,                              // 8px gap below the button
        left: Math.max(8, r.right - menuWidth),         // right-align to button, clamp to viewport
      }
    }
  }
  showHeaderMenu.value = !showHeaderMenu.value
}

// ── Table search ─────────────────────────────────────────────────────────────
const pcSearch = ref('')
const piSearch = ref('')
const rcSearch = ref('')

const filtPreCostings = computed(() => {
  const q = pcSearch.value.trim().toLowerCase()
  return q ? preCostings.value.filter(pc =>
    pc.no.toLowerCase().includes(q) || pc.created_by.toLowerCase().includes(q)) : preCostings.value
})
const filtProformaInvoices = computed(() => {
  const q = piSearch.value.trim().toLowerCase()
  return q ? proformaInvoices.value.filter(pi =>
    pi.no.toLowerCase().includes(q) || pi.pre_costing_no.toLowerCase().includes(q) ||
    pi.created_by.toLowerCase().includes(q)) : proformaInvoices.value
})
const filtReceipts = computed(() => {
  const q = rcSearch.value.trim().toLowerCase()
  return q ? receipts.value.filter(r =>
    r.no.toLowerCase().includes(q) || r.proforma_invoice_no.toLowerCase().includes(q) ||
    r.payment_method.toLowerCase().includes(q) || r.created_by.toLowerCase().includes(q)) : receipts.value
})

const toScheduleInvoices = computed(() => proformaInvoices.value.filter(pi => pi.to_be_scheduled))
const showScheduleListModal = ref(false)
const piMenuOpen = ref<string | null>(null)
const piMenuPos = ref({ top: 0, left: 0 })
const openPiMenu = (key: string, e: MouseEvent) => {
  if (piMenuOpen.value === key) { piMenuOpen.value = null; return }
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const menuWidth = 176 // w-44
  piMenuPos.value = { top: r.bottom + 8, left: Math.max(8, r.right - menuWidth) }
  piMenuOpen.value = key
}
// resolve the invoice behind the open menu (desktop key = uuid, mobile key = `m-${uuid}`)
const activePiInvoice = computed(() =>
  piMenuOpen.value
    ? proformaInvoices.value.find(pi => pi.uuid === piMenuOpen.value!.replace(/^m-/, '')) ?? null
    : null)

// Auto-open the schedule list (like the old banner) when entering the tab
const scheduleListSeen = ref(false)
watch([() => activeTab.value, toScheduleInvoices], ([tab, list]) => {
  if (tab === 'preforma-invoice') {
    if (list.length && !scheduleListSeen.value) {
      showScheduleListModal.value = true
      scheduleListSeen.value = true
    }
  } else {
    // reset when leaving the tab so it re-shows next time you come back
    scheduleListSeen.value = false
  }
}, { immediate: true })

const insSearch = ref('')
const insOpen = ref(false)
const insSelectRef = ref<HTMLElement | null>(null)

const selectedInsName = computed(() =>
  insurances.value.find(i => i.id === insForm.insurance_id)?.name ?? '')

const insFiltered = computed(() => {
  const q = insSearch.value.trim().toLowerCase()
  return q ? insurances.value.filter(i => i.name.toLowerCase().includes(q)) : insurances.value
})

const openIns = () => { insOpen.value = true; insSearch.value = '' }

const selectIns = (i: Insurance) => {
  insForm.insurance_id = i.id
  insSearch.value = i.name
  insOpen.value = false
}

const closeIns = () => { insOpen.value = false; insSearch.value = selectedInsName.value }

const onInsClickOutside = (e: MouseEvent) => {
  if (insSelectRef.value && !insSelectRef.value.contains(e.target as Node)) closeIns()
}
onMounted(() => document.addEventListener('mousedown', onInsClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onInsClickOutside))

onMounted(async () => { await loadAll(); await loadRefs(); await loadQr() })

// ── Edit form ──────────────────────────────────────────────────────────────
const showUpdateModal = ref(false); const eSaving = ref(false); const eError = ref(''); const eSuccess = ref('')
const eForm = reactive({ customer_category_id: '', identification_type_id: '', identification_number: '', identification_expiry_date: '', first_name: '', middle_name: '', last_name: '', preferred_name: '', date_of_birth: '', gender: '', gender_identity: '', marital_status: '', nationality_id: '', nationality: '', phone_primary: '', phone_secondary: '', email: '', preferred_contact_method: '', address_line1: '', address_line2: '', country_id: '', country_name: '', state_id: '', city_id: '', city_name: '', postal_code: '', nok_full_name: '', nok_relationship: '', nok_phone: '', nok_address: '', occupation: '', education_level: '', religion: '', ethnicity: '', referring_facility: '', referring_clinician: '', referral_date: '' })

const populateEditForm = () => {
  if (!fhirData.value) return
  const f = fhirData.value
  const name = f.name?.find(n => n.use === 'official')
  eForm.first_name = name?.given?.[0] ?? ''; eForm.last_name = name?.family ?? ''
  eForm.date_of_birth = f.birthDate ?? ''; eForm.gender = f.gender ?? ''
  eForm.phone_primary = f.telecom?.find(t => t.system === 'phone')?.value ?? ''
  eForm.address_line1 = f.address?.[0]?.line?.[0] ?? ''
  eForm.identification_number = ext('IDENTIFICATION_NUMBER')?.valueString ?? ''
  eForm.identification_expiry_date = ext('IDENTIFICATION_EXPIRY_DATE')?.valueDate ?? ''
  eForm.referring_facility = ext('REFERRING_FACILITY')?.valueString ?? ''
  eForm.referring_clinician = ext('REFERRING_CLINICIAN')?.valueString ?? ''
  eForm.referral_date = ext('REFERRAL_DATE')?.valueDate ?? ''
  catSearch.value = ext('CUSTOMER_CATEGORY')?.valueString ?? ''
  ctrSearch.value = f.address?.[0]?.country ?? ''; ctySearch.value = f.address?.[0]?.city ?? ''
  eForm.nationality = ext('NATIONALITY')?.valueString ?? ''; natSearch.value = eForm.nationality; resolveNat()
  idtSearch.value = ext('IDENTIFICATION_TYPE')?.valueString ?? ''
  ctrSearch.value = f.address?.[0]?.country ?? ''; ctySearch.value = f.address?.[0]?.city ?? ''
}

// ── Profile photo upload (Update modal) ─────────────────────────────────────
const photoFile = ref<File | null>(null)
const photoPreview = ref('')
const onPhotoChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  photoFile.value = f
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = f ? URL.createObjectURL(f) : ''
}
const clearPhoto = () => {
  photoFile.value = null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = ''
}

// ── Referral document upload (Update modal) ─────────────────────────────────
const refDocFile = ref<File | null>(null)
const onRefDocChange = (e: Event) => { refDocFile.value = (e.target as HTMLInputElement).files?.[0] ?? null }
const clearRefDoc = () => { refDocFile.value = null }

// ── Referral document viewer (view-only, no download) ───────────────────────
type DocKind = 'image' | 'pdf' | 'other'
interface RefDocMeta { id: number; url: string; name: string; kind: DocKind }
const parseDocMeta = (d: ReferralDoc): RefDocMeta => {
  let name = `Document #${d.id}`, contentType = ''
  try {
    const q = new URL(d.document).searchParams
    contentType = (q.get('response-content-type') || '').toLowerCase()
    const cd = q.get('response-content-disposition') || ''
    const raw = cd.match(/filename\*=(?:UTF-8'')?([^;]+)/i)?.[1] || cd.match(/filename="?([^";]+)"?/i)?.[1]
    if (raw) name = decodeURIComponent(raw.trim())
  } catch { /* keep defaults */ }
  const ext = name.split('.').pop()?.toLowerCase() || ''
  let kind: DocKind = 'other'
  if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) kind = 'image'
  else if (contentType === 'application/pdf' || ext === 'pdf') kind = 'pdf'
  return { id: d.id, url: d.document, name, kind }
}
const referralDocsMeta = computed<RefDocMeta[]>(() => referralDocs.value.map(parseDocMeta))
const hasReferralDoc = computed(() => referralDocsMeta.value.length > 0)

const showRefDocViewer = ref(false)
const activeRefDocId = ref<number | null>(null)
const refImgZoom = ref(1)
const activeRefDoc = computed<RefDocMeta | null>(() =>
  referralDocsMeta.value.find(d => d.id === activeRefDocId.value) ?? referralDocsMeta.value[0] ?? null)
watch(showRefDocViewer, o => { if (o) { activeRefDocId.value = referralDocsMeta.value[0]?.id ?? null; refImgZoom.value = 1 } })
watch(activeRefDocId, () => { refImgZoom.value = 1 })

// ── Update wizard ───────────────────────────────────────────────────────────
const wizSteps = [
  { id: 1, label: 'Classification', icon: ['fas', 'tag'] as [string, string] },
  { id: 2, label: 'Identity', icon: ['fas', 'id-badge'] as [string, string] },
  { id: 3, label: 'Contact & Address', icon: ['fas', 'location-dot'] as [string, string] },
  { id: 4, label: 'Social & Referral', icon: ['fas', 'user-group'] as [string, string] },
] as const
const wizStep = ref(1)
const wizNext = () => { if (wizStep.value < wizSteps.length) wizStep.value++ }
const wizBack = () => { if (wizStep.value > 1) wizStep.value-- }

const openUpdate = async () => {
  populateEditForm(); eError.value = ''; eSuccess.value = ''
  wizStep.value = 1; clearPhoto(); clearRefDoc()        // ← reset wizard + uploads
  showUpdateModal.value = true; await loadRefs()
}

const submitUpdate = async () => {
  eError.value = ''
  if (!eForm.first_name || !eForm.last_name || !eForm.gender || !eForm.date_of_birth) {
    eError.value = 'First name, last name, gender and DOB are required.'; wizStep.value = 2; return   // ← jump to offending step
  }
  if (!eForm.phone_primary) { eError.value = 'Primary phone is required.'; wizStep.value = 3; return }
  eSaving.value = true
  try {
    const fd = new FormData(); fd.append('uuid', uuid.value)
    const flds = ['customer_category_id', 'identification_type_id', 'identification_number', 'identification_expiry_date', 'first_name', 'middle_name', 'last_name', 'preferred_name', 'date_of_birth', 'gender', 'gender_identity', 'marital_status', 'nationality_id', 'phone_primary', 'phone_secondary', 'email', 'preferred_contact_method', 'address_line1', 'address_line2', 'country_id', 'state_id', 'city_id', 'postal_code', 'nok_full_name', 'nok_relationship', 'nok_phone', 'nok_address', 'occupation', 'education_level', 'religion', 'ethnicity', 'referring_facility', 'referring_clinician', 'referral_date'] as const
    flds.forEach(f => { if (eForm[f]) fd.append(`customer[${f}]`, String(eForm[f])) })
    if (photoFile.value) fd.append('customer[profile_photo]', photoFile.value)       // ← NEW
    if (refDocFile.value) fd.append('customer[referral_document]', refDocFile.value) // ← NEW
    await request('/customer/update', { method: 'PATCH', body: fd })
    eSuccess.value = 'Customer updated successfully.'   // shows alongside the spinner during refresh
    await loadAll()                                     // keep loading state until fully reloaded
    showUpdateModal.value = false; eSuccess.value = ''  // close only after loadAll resolves
  } catch (e: unknown) { eError.value = (e as Error).message || 'Update failed.' } finally { eSaving.value = false }
}

// ── Insurance modal ────────────────────────────────────────────────────────
const showInsModal = ref(false); const insSaving = ref(false); const insError = ref(''); const insSuccess = ref('')
const insForm = reactive<{
  insurance_id: number | ''
  membership_number: string
  member_type: string
  valid_from: string
  employer_name: string
  group_number: string
  is_primary: boolean
}>({ insurance_id: '', membership_number: '', member_type: 'principal', valid_from: '', employer_name: '', group_number: '', is_primary: false })
const openInsModal = async () => { Object.assign(insForm, { insurance_id: '', membership_number: '', member_type: 'principal', valid_from: '', employer_name: '', group_number: '', is_primary: false }); insError.value = ''; insSuccess.value = ''; showInsModal.value = true; await loadIns() }

const submitIns = async () => {
  insError.value = ''
  if (!insForm.insurance_id || !insForm.membership_number) { insError.value = 'Plan and membership number required.'; return }
  insSaving.value = true
  try {
    const fd = new FormData(); fd.append('uuid', uuid.value); fd.append('customer[insurance_id]', String(insForm.insurance_id)); fd.append('customer[membership_number]', insForm.membership_number); fd.append('customer[member_type]', insForm.member_type); fd.append('customer[valid_from]', insForm.valid_from); fd.append('customer[employer_name]', insForm.employer_name); fd.append('customer[group_number]', insForm.group_number); fd.append('customer[is_primary]', String(insForm.is_primary))
    await request('/customer/insurance/create', { method: 'POST', body: fd })
    insSuccess.value = 'Coverage added.'   // shows alongside the spinner during refresh
    await loadAll()                        // keep loading state until fully reloaded
    showInsModal.value = false; insSuccess.value = ''  // close only after loadAll resolves
  }
  catch (e: unknown) { insError.value = (e as Error).message || 'Failed.' } finally { insSaving.value = false }
}

const patientMrn = computed(() => ext('PATIENT_MRN')?.valueString || '')
const patientUuid = computed(() => ext('PATIENT_UUID')?.valueString || '')

const showHeaderMenu = ref(false)

// ── Pre-Costing wizard ─────────────────────────────────────────────────────
const showPreCostModal = ref(false)
const pcStep = ref(1)
const pcSaving = ref(false)
const pcError = ref('')
const pcSuccess = ref('')
const pcResultUuid = ref('')

// Reference data — fetched on wizard open
const billingTaxes = ref<BillingTax[]>([])
const encPrices = ref<EncounterPrice[]>([])
const labPrices = ref<LabPrice[]>([])
const radPrices = ref<RadPrice[]>([])

// Selections
const selTaxIds = ref<number[]>([])          // billing tax ids, VAT default
const selEncs = ref<EncounterPrice[]>([])
const selLabs = ref<LabPrice[]>([])
const selRads = ref<RadPrice[]>([])

// Search queries — live against API with debounce
const encSearch = ref('')
const labSearch = ref('')
const radSearch = ref('')
let encDebounce: ReturnType<typeof setTimeout> | null = null
let labDebounce: ReturnType<typeof setTimeout> | null = null
let radDebounce: ReturnType<typeof setTimeout> | null = null

// Determine step flow based on encounter selections
const needsLab = computed(() => selEncs.value.some(e => e.code === 'LAB'))
const needsRad = computed(() => selEncs.value.some(e => e.code === 'IMAGING'))
// Dynamic steps: 1=Tax, 2=Encounters, then Lab if needed, then Rad if needed, then Summary
const pcSteps = computed(() => {
  const s = [
    { id: 'taxes', label: 'Billing Tax', icon: 'percent' },
    { id: 'encounters', label: 'Services', icon: 'notes-medical' },
  ]
  if (needsLab.value) s.push({ id: 'lab', label: 'Laboratory', icon: 'flask' })
  if (needsRad.value) s.push({ id: 'imaging', label: 'Radiology', icon: 'x-ray' })
  s.push({ id: 'summary', label: 'Summary', icon: 'file-invoice-dollar' })
  return s
})
const currentStepId = computed(() => pcSteps.value[pcStep.value - 1]?.id ?? 'taxes')
const totalPcSteps = computed(() => pcSteps.value.length)

// Helpers
// Currency is read from the pricing endpoints (encounters / laboratory / radiology),
// never hard-coded. Falls back through loaded → selected lists, then USD as last resort.
const currency = computed(() =>
  encPrices.value[0]?.price?.[0]?.currency ??
  labPrices.value[0]?.price?.[0]?.currency ??
  radPrices.value[0]?.price?.[0]?.currency ??
  selEncs.value[0]?.price?.[0]?.currency ??
  selLabs.value[0]?.price?.[0]?.currency ??
  selRads.value[0]?.price?.[0]?.currency ??
  'USD'
)
// Generic money formatter; pass a per-row currency to override the derived one.
const fmtMoney = (n: number | string | undefined, cur = 'MWK') =>
  `${cur} ${Number(n ?? 0).toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type Amt = { MWK?: string | number; USD?: string | number }

// Dominant currency across the whole summary (drop .value if `billing` is a prop)
const majorCcy = computed<'MWK' | 'USD'>(() => {
  const fields = [
    billing.value?.total_billed,
    billing.value?.total_paid,
    billing.value?.total_outstanding,
    billing.value?.insurance_covered,
  ]
  let mwk = 0, usd = 0
  for (const f of fields) {
    if (Number(f?.MWK ?? 0) > 0) mwk++
    if (Number(f?.USD ?? 0) > 0) usd++
  }
  return usd > mwk ? 'USD' : 'MWK' // tie → MWK
})

// Major currency first (if > 0), then the other (if > 0); all-zero → major 0.00
const amountParts = (amt?: Amt, major: 'MWK' | 'USD' = 'MWK') => {
  const other = major === 'MWK' ? 'USD' : 'MWK'
  const parts: { ccy: 'MWK' | 'USD'; val: string | number }[] = []
  if (Number(amt?.[major] ?? 0) > 0) parts.push({ ccy: major, val: amt![major]! })
  if (Number(amt?.[other] ?? 0) > 0) parts.push({ ccy: other, val: amt![other]! })
  if (parts.length === 0) parts.push({ ccy: major, val: 0 })
  return parts
}

// Currency from a price-bearing row, falling back to the page currency
const priceCcy = (item?: { price?: { currency: string }[] }) =>
  item?.price?.[0]?.currency ?? currency.value

// Currency for the totals — taken from whatever the user actually selected
const pcCurrency = computed(() => {
  const first = selEncs.value[0] ?? selLabs.value[0] ?? selRads.value[0]
  return first?.price?.[0]?.currency ?? currency.value
})

const hasAmount = (amt?: Amt) => Number(amt?.MWK ?? 0) > 0 || Number(amt?.USD ?? 0) > 0

const invStatusClass = (s?: string) => {
  switch ((s ?? '').toLowerCase()) {
    case 'settled':
    case 'paid': return 'bg-secondary-fixed text-secondary-on-fixed'
    case 'partial':
    case 'partially paid': return 'bg-accent-fixed text-accent-on-container'
    case 'unpaid':
    case 'pending': return 'bg-error-container text-error'
    case 'cancelled':
    case 'void': return 'bg-surface-container text-on-surface-variant'
    default: return 'bg-surface-container text-on-surface-variant'
  }
}

const encPrice = (e: EncounterPrice) => Number(e.price?.[0]?.amount ?? 0)
const labPrice = (l: LabPrice) => Number(l.price?.[0]?.amount ?? 0)
const radPrice = (r: RadPrice) => Number(r.price?.[0]?.amount ?? 0)

const subtotal = computed(() =>
  selEncs.value.reduce((s, e) => s + encPrice(e), 0) +
  selLabs.value.reduce((s, l) => s + labPrice(l), 0) +
  selRads.value.reduce((s, r) => s + radPrice(r), 0)
)

const isSelEnc = (e: EncounterPrice) => selEncs.value.some(x => x.uuid === e.uuid)
const isSelLab = (l: LabPrice) => selLabs.value.some(x => x.uuid === l.uuid)
const isSelRad = (r: RadPrice) => selRads.value.some(x => x.uuid === r.uuid)
const toggleEnc = (e: EncounterPrice) => { const i = selEncs.value.findIndex(x => x.uuid === e.uuid); i >= 0 ? selEncs.value.splice(i, 1) : selEncs.value.push(e) }
const toggleLab = (l: LabPrice) => { const i = selLabs.value.findIndex(x => x.uuid === l.uuid); i >= 0 ? selLabs.value.splice(i, 1) : selLabs.value.push(l) }
const toggleRad = (r: RadPrice) => { const i = selRads.value.findIndex(x => x.uuid === r.uuid); i >= 0 ? selRads.value.splice(i, 1) : selRads.value.push(r) }
const toggleTax = (id: number) => { const i = selTaxIds.value.indexOf(id); i >= 0 ? selTaxIds.value.splice(i, 1) : selTaxIds.value.push(id) }

// ── Discount maps — keyed by item uuid ───────────────────────────────────
const encDiscounts = ref<Record<string, number>>({})
const labDiscounts = ref<Record<string, number>>({})
const radDiscounts = ref<Record<string, number>>({})
const encDiscountDisplay = ref<Record<string, string>>({})
const labDiscountDisplay = ref<Record<string, string>>({})
const radDiscountDisplay = ref<Record<string, string>>({})

const parseDiscount = (raw: string): number => { const n = parseFloat(raw.replace(/,/g, '')); return isNaN(n) ? 0 : n }
const formatDiscount = (raw: string): string => {
  const stripped = raw.replace(/[^0-9.]/g, '')
  const parts = stripped.split('.')
  const int = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.length > 1 ? `${int}.${(parts[1] ?? '').slice(0, 2)}` : int
}
const onEncDiscount = (u: string, raw: string) => { const f = formatDiscount(raw); encDiscountDisplay.value[u] = f; encDiscounts.value[u] = parseDiscount(f) }
const onLabDiscount = (u: string, raw: string) => { const f = formatDiscount(raw); labDiscountDisplay.value[u] = f; labDiscounts.value[u] = parseDiscount(f) }
const onRadDiscount = (u: string, raw: string) => { const f = formatDiscount(raw); radDiscountDisplay.value[u] = f; radDiscounts.value[u] = parseDiscount(f) }

const encNet = (e: EncounterPrice) => Math.max(0, encPrice(e) - (encDiscounts.value[e.uuid] ?? 0))
const labNet = (l: LabPrice) => Math.max(0, labPrice(l) - (labDiscounts.value[l.uuid] ?? 0))
const radNet = (r: RadPrice) => Math.max(0, radPrice(r) - (radDiscounts.value[r.uuid] ?? 0))
const subtotalNet = computed(() =>
  selEncs.value.reduce((s, e) => s + encNet(e), 0) +
  selLabs.value.reduce((s, l) => s + labNet(l), 0) +
  selRads.value.reduce((s, r) => s + radNet(r), 0)
)

// Live search handlers
const onEncSearch = (q: string) => {
  if (encDebounce) clearTimeout(encDebounce)
  encDebounce = setTimeout(async () => {
    const url = q.trim() ? `/encounter_types/prices?customer_uuid=${uuid.value}&q=${encodeURIComponent(q)}` : `/encounter_types/prices?customer_uuid=${uuid.value}`
    const d = await request<EncounterPrice[]>(url)
    if (d) encPrices.value = d
  }, 300)
}
const onLabSearch = (q: string) => {
  if (labDebounce) clearTimeout(labDebounce)
  labDebounce = setTimeout(async () => {
    const url = q.trim() ? `/laboratory_tests/prices?customer_uuid=${uuid.value}&q=${encodeURIComponent(q)}` : `/laboratory_tests/prices?customer_uuid=${uuid.value}`
    const d = await request<LabPrice[]>(url)
    if (d) labPrices.value = d
  }, 300)
}
const onRadSearch = (q: string) => {
  if (radDebounce) clearTimeout(radDebounce)
  radDebounce = setTimeout(async () => {
    const url = q.trim() ? `/radiology_images/prices?customer_uuid=${uuid.value}&q=${encodeURIComponent(q)}` : `/radiology_images/prices?customer_uuid=${uuid.value}`
    const d = await request<RadPrice[]>(url)
    if (d) radPrices.value = d
  }, 300)
}

watch(encSearch, onEncSearch)
watch(labSearch, onLabSearch)
watch(radSearch, onRadSearch)

// Open wizard — load taxes and encounters, VAT selected by default
const openPreCost = async () => {
  pcStep.value = 1; pcError.value = ''; pcSuccess.value = ''; pcResultUuid.value = ''
  selTaxIds.value = []; selEncs.value = []; selLabs.value = []; selRads.value = []
  encSearch.value = ''; labSearch.value = ''; radSearch.value = ''
  showPreCostModal.value = true

  const [taxes, encs] = await Promise.all([
    request<BillingTax[]>('/billing/taxes'),
    request<EncounterPrice[]>(`/encounter_types/prices?customer_uuid=${uuid.value}`),
  ])
  if (taxes) {
    billingTaxes.value = taxes
    // VAT selected by default
    const vat = taxes.find(t => t.code === 'VAT')
    if (vat) selTaxIds.value = [vat.id]
  }
  if (encs) encPrices.value = encs
}

// Navigate forward — load data for next step lazily
const pcNext = async () => {
  const nextStepId = pcSteps.value[pcStep.value]?.id
  if (nextStepId === 'lab' && labPrices.value.length === 0) {
    const d = await request<LabPrice[]>(`/laboratory_tests/prices?customer_uuid=${uuid.value}`)
    if (d) labPrices.value = d
  }
  if (nextStepId === 'imaging' && radPrices.value.length === 0) {
    const d = await request<RadPrice[]>(`/radiology_images/prices?customer_uuid=${uuid.value}`)
    if (d) radPrices.value = d
  }
  pcStep.value++
}

// Save pre-costing
const submitPreCost = async () => {
  pcError.value = ''; pcSaving.value = true
  try {
    const body = {
      uuid: uuid.value,
      pre_costing: {
        billing_taxes: selTaxIds.value,
        encounter_type_prices: selEncs.value.map(e => ({ uuid: e.uuid, discount_amount: encDiscounts.value[e.uuid] ?? 0 })),
        laboratory_test_prices: selLabs.value.map(l => ({ uuid: l.uuid, discount_amount: labDiscounts.value[l.uuid] ?? 0 })),
        radiology_image_prices: selRads.value.map(r => ({ uuid: r.uuid, discount_amount: radDiscounts.value[r.uuid] ?? 0 })),
      }
    }
    const res = await request<{ uuid: string; message: string }>(
      '/customer/pre_costing/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      }
    )
    if (res?.uuid) {
      showPreCostModal.value = false
      // res.uuid is the new pre-costing; uuid.value is the customer
      router.push({
        path: `/customers/pre-costing/${res.uuid}`,
        query: { customer_uuid: uuid.value },
      })
    }
  } catch (e: unknown) {
    pcError.value = (e as Error).message || 'Failed to save pre-costing.'
  } finally {
    pcSaving.value = false
  }
}

// ── QR modal ───────────────────────────────────────────────────────────────
const showQrModal = ref(false)
const openQr = () => showQrModal.value = true
const printCard = () => {
  const w = window.open('', '_blank', 'width=600,height=400')
  if (!w) return
  const el = document.getElementById('customer-id-card')
  w.document.write(`<html><head><title>Customer ID Card</title><style>body{margin:0;font-family:sans-serif}@media print{body{margin:0}}</style></head><body>${el?.innerHTML ?? ''}</body></html>`)
  w.document.close(); w.focus(); w.print(); w.close()
}
</script>

<style scoped>
.u-label {
  @apply text-xs font-bold text-outline ml-1 block mb-1;
}

.u-input {
  @apply w-full bg-surface-low border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/50 transition-all duration-200 focus:outline-none;
  box-shadow: inset 0 0 0 1.5px transparent;
}

.u-input:focus {
  box-shadow: inset 0 0 0 1.5px #0050cb;
  background-color: #f7f9fb;
}

.u-input:hover:not(:focus):not(:disabled) {
  background-color: #e6e8ea;
}

.u-input.has-icon {
  padding-left: 2.5rem;
}

.u-input.has-caret {
  padding-right: 2.25rem;
}

/* Floating hint */
@keyframes ambientBreathe {

  0%,
  100% {
    transform: scale(1)
  }

  50% {
    transform: scale(1.015)
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
    opacity: 0
  }

  20% {
    opacity: .5
  }

  50% {
    opacity: .5
  }

  80% {
    opacity: 0
  }

  100% {
    transform: translateX(200%);
    opacity: 0
  }
}

.floating-action-card {
  animation: none;
}

.ambient-loop {
  animation: ambientBreathe 4s ease-in-out infinite;
}

.shimmer-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .45), transparent);
  width: 50%;
  height: 100%;
  animation: shimmer 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

.hint-pop-enter-active {
  transition: opacity .4s ease, transform .4s cubic-bezier(.22, 1, .36, 1);
}

.hint-pop-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.hint-pop-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(.92);
}

.hint-pop-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(.95);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity .15s ease, transform .15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Container / popup */
.dp__theme_light {
  --dp-background-color: #ffffff;
  --dp-text-color: #0b1c30;
  --dp-hover-color: #e5eeff;
  --dp-hover-text-color: #0b1c30;
  --dp-hover-icon-color: #464555;
  --dp-primary-color: #3525cd;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #c7c4d8;
  --dp-border-color: #c7c4d8;
  --dp-menu-border-color: #c7c4d8;
  --dp-border-color-hover: #777587;
  --dp-disabled-color: #c7c4d8;
  --dp-disabled-color-text: #777587;
  --dp-scroll-bar-background: #f8f9ff;
  --dp-scroll-bar-color: #c7c4d8;
  --dp-success-color: #3525cd;
  --dp-icon-color: #464555;
  --dp-danger-color: #ba1a1a;
  --dp-highlight-color: rgba(53, 37, 205, 0.1);
  --dp-range-between-dates-background-color: rgba(53, 37, 205, 0.08);
}

/* Popup shape */
.dp__menu {
  border-radius: 0.75rem !important;
  border-color: #c7c4d8 !important;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 24px 0 rgba(53, 37, 205, 0.08);
}

/* Header: month/year title */
.dp__month_year_row {
  padding: 0 24px;
  min-height: 52px;
  border-bottom: 1px solid #c7c4d8;
}

.dp__month_year_select {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  color: #0b1c30;
}

/* Nav arrows */
.dp__nav_icon {
  color: #464555;
}

/* Day-of-week header labels */
.dp__calendar_header_item {
  font-size: 12px;
  font-weight: 500;
  color: #464555;
  text-align: center;
}

.dp__calendar_header_separator {
  display: none;
}

/* Date cells */
.dp__cell_inner {
  border-radius: 9999px !important;
  width: 40px;
  height: 40px;
  font-size: 14px;
  font-weight: 400;
}

.dp__cell_inner:hover {
  background-color: #e5eeff;
}

/* Selected date */
.dp__active_date {
  background-color: #3525cd !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(53, 37, 205, 0.3);
}

/* Outside-month dates */
.dp__cell_offset {
  color: #777587;
  opacity: 0.4;
}

/* Today highlight (subtle) */
.dp__today {
  border: 1px solid #3525cd !important;
}

/* Action row — hide default dp actions so our slot shows */
.dp__action_row {
  padding: 0 !important;
}

/* Calendar body padding */
.dp__calendar {
  padding: 16px 24px;
}
</style>