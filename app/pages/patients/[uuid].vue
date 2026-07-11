<!-- app/pages/patients/[uuid].vue -->
<template>
  <AccessDenied v-if="denied" />
  <div class="animate-fade-in min-h-full space-y-4">

    <!-- Breadcrumb -->
    <nav
      class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
      <template v-if="customerUuid">
        <NuxtLink :to="`/customers/${customerUuid}`"
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
          <font-awesome-icon :icon="['fas', 'user']" class="text-[11px]" />Back to Customer
        </NuxtLink>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
      </template>
      <template v-else>
        <NuxtLink to="/patients"
          class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
          <font-awesome-icon :icon="['fas', 'users']" class="text-[11px]" />Patients
        </NuxtLink>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
      </template>
      <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
        <font-awesome-icon :icon="['fas', 'heart-pulse']" class="text-[11px] text-primary" />{{ p?.full_name }} -
        Patient
        Record
      </span>
    </nav>

    <!-- Loading skeleton -->
    <div v-if="showSkeleton && !dash" class="space-y-4">
      <SkeletonDetailHeader />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div class="lg:col-span-7"><SkeletonPanel :bars="5" /></div>
        <div class="lg:col-span-5"><SkeletonPanel :bars="4" /></div>
      </div>
    </div>
    <div v-else-if="loading && !dash" />

    <!-- Not found -->
    <div v-else-if="!loading && !dash" class="rounded-xl bg-white/80 text-center py-16">
      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-4xl text-outline mb-3" />
      <p class="text-sm text-on-surface-variant">Patient not found.</p>
      <NuxtLink to="/patients" class="btn-secondary mt-4">Back to Patients</NuxtLink>
    </div>

    <template v-else-if="dash">

      <!-- ══ TOP ROW — patient header + vitals ══════════════════════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

        <!-- Patient demographic card -->
        <div
          class="lg:col-span-8 bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/50 shadow-island flex flex-col md:flex-row gap-4 items-start relative">
          <!-- decorative blob, clipped to the card so the Actions menu can overflow -->
          <div class="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div class="absolute -right-16 -top-16 w-56 h-56 bg-secondary-container/10 rounded-full blur-3xl" />
          </div>

          <!-- Avatar -->
          <div
            class="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white/80 shadow-md overflow-hidden flex-shrink-0 relative bg-primary-fixed flex items-center justify-center">
            <img v-if="profilePhoto && !photoError" :src="profilePhoto" :alt="p?.full_name"
              class="w-full h-full object-cover" @error="photoError = true" />
            <font-awesome-icon v-else :icon="['fas', 'user']" class="text-primary text-3xl" />
            <div
              class="absolute bottom-0 right-0 w-5 h-5 bg-secondary rounded-full border-2 border-white flex items-center justify-center">
              <font-awesome-icon :icon="['fas', 'check']" class="text-white text-xs" />
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0 relative z-10">
            <div class="flex flex-wrap items-start justify-between gap-2 mb-1">
              <div class="min-w-0">
                <h1 class="text-lg sm:text-xl md:text-2xl font-bold text-on-surface break-words">
                  {{ p?.full_name }}
                  <span v-if="p?.preferred_name" class="text-on-surface-variant text-sm font-normal ml-1">"{{
                    p.preferred_name }}"</span>
                </h1>
                <p class="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <font-awesome-icon :icon="['fas', 'envelope']" class="text-xs" />
                  {{ fhirPatient?.email || p?.phone_primary || '—' }}
                </p>
              </div>
              <!-- Status + Actions -->
              <div class="relative flex items-center gap-2 flex-shrink-0">
                <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full"
                  :class="statusPillClass">
                  {{ treatmentStatus }}
                </span>
                <button type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-container transition-colors"
                  @click.stop="showActions = !showActions">
                  <font-awesome-icon :icon="['fas', 'bolt']" class="text-[11px]" /> Actions
                  <font-awesome-icon :icon="['fas', 'chevron-down']" class="text-[9px] transition-transform"
                    :class="showActions ? 'rotate-180' : ''" />
                </button>

                <!-- click-away backdrop -->
                <div v-if="showActions" class="fixed inset-0 z-40" @click="showActions = false" />

                <!-- menu -->
                <Transition name="dropdown">
                  <div v-if="showActions"
                    class="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white rounded-xl border border-outline-variant/30 shadow-glass py-1.5">
                    <button v-if="can('patient_registration')" class="action-item" @click="openEditPatient">
                      <font-awesome-icon :icon="['fas', 'user-pen']" class="w-4 text-primary" /> Edit Patient
                    </button>
                    <button v-if="can('encounter_management')" class="action-item" @click="openTriageExisting">
                      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="w-4 text-accent" /> Triage
                    </button>
                    <button v-if="can('vitals_capture')" class="action-item" @click="openVitalsExisting">
                      <font-awesome-icon :icon="['fas', 'heart-pulse']" class="w-4 text-error" /> Vitals
                    </button>
                    <button v-if="can('encounter_management')" class="action-item"
                      @click="showActions = false; showVisitModal = true">
                      <font-awesome-icon :icon="['fas', 'calendar-plus']" class="w-4 text-secondary" /> New Visit
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Key stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <!-- cycled ribbon tints: blue → red → teal → purple -->
              <div class="bg-primary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Gender / Age</p>
                <p class="text-sm font-bold text-on-surface capitalize">{{ p?.gender }}, {{ age }}y</p>
              </div>
              <div class="bg-error-container/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Blood Type</p>
                <p class="text-sm font-bold" :class="p?.blood_group ? 'text-error' : 'text-outline'">{{ p?.blood_group
                  || '—' }}</p>
              </div>
              <div class="bg-secondary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Patient ID</p>
                <p class="text-xs font-bold font-mono text-on-surface truncate">{{ p?.mrn }}</p>
              </div>
              <div class="bg-tertiary-fixed/60 border border-white/40 p-2.5 rounded-lg">
                <p class="text-xs text-on-surface-variant mb-0.5">Cancer Type</p>
                <p class="text-sm font-bold text-primary truncate">{{ cs?.cancer_type || '—' }}</p>
              </div>
            </div>

            <!-- Visit history mini-stats -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-on-surface-variant">
              <span class="flex items-center gap-1.5">
                <font-awesome-icon :icon="['fas', 'hospital']" class="text-[11px] text-primary" />
                <strong class="text-on-surface">{{ vh?.total_visits ?? 0 }}</strong> visits
              </span>
              <span class="flex items-center gap-1.5">
                <font-awesome-icon :icon="['fas', 'circle-check']" class="text-[11px] text-secondary" />
                <strong class="text-on-surface">{{ vh?.completed_visits ?? 0 }}</strong> completed
              </span>
              <span v-if="vh?.last_visit_date" class="flex items-center gap-1.5">
                <font-awesome-icon :icon="['fas', 'clock-rotate-left']" class="text-[11px]" />Last {{
                  fmtDate(vh.last_visit_date) }}
              </span>
              <span v-if="p?.registered_at" class="flex items-center gap-1.5">
                <font-awesome-icon :icon="['fas', 'user-plus']" class="text-[11px]" />Registered {{
                  fmtDate(p.registered_at) }}
              </span>
            </div>

            <!-- Quick actions -->
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/10"
                @click="loadQr">
                <font-awesome-icon :icon="['fas', 'qrcode']" class="text-xs" />QR Code
              </button>
            </div>

            <!-- Referral details (from show extensions) -->
            <div v-if="referral.facility || referral.clinician || referral.date || referral.documentUrl"
              class="mt-3 pt-3 border-t border-outline-variant/30">
              <p class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                <font-awesome-icon :icon="['fas', 'share-from-square']" class="mr-1 text-primary" /> Referral
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                <div><span class="text-on-surface-variant">Facility</span>
                  <p class="font-semibold text-on-surface">{{ referral.facility || '—' }}</p>
                </div>
                <div><span class="text-on-surface-variant">Clinician</span>
                  <p class="font-semibold text-on-surface">{{ referral.clinician || '—' }}</p>
                </div>
                <div><span class="text-on-surface-variant">Date</span>
                  <p class="font-semibold text-on-surface">{{ fmtDate(referral.date) }}</p>
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <template v-if="referral.documentUrl">
                  <span
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-on-fixed bg-secondary-fixed border border-secondary/30 px-2 py-1 rounded-lg">
                    <font-awesome-icon :icon="['fas', 'file-circle-check']" class="text-[11px]" /> Document available
                  </span>
                  <button
                    class="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/10 px-2.5 py-1 rounded-lg transition-colors"
                    @click="showReferralDoc = true">
                    <font-awesome-icon :icon="['fas', 'eye']" class="text-[11px]" /> View
                  </button>
                </template>
                <span v-else
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant bg-surface-low border border-outline-variant/40 px-2 py-1 rounded-lg">
                  <font-awesome-icon :icon="['fas', 'file-circle-xmark']" class="text-[11px]" /> No referral document
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Vitals card -->
        <div
          class="lg:col-span-4 bg-[#DB9D00] backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 shadow-island text-white flex flex-col justify-between relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <div class="flex items-center justify-between relative z-10">
            <h3 class="text-base sm:text-lg font-bold text-white">Current Vitals</h3>
            <div class="flex items-center gap-1.5">
              <!-- Add vitals button visible in the card header -->
              <button v-if="can('vitals_capture')" @click="openVitalsExisting"
                class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                title="Record new vitals" Current Vitals>
                <font-awesome-icon :icon="['fas', 'plus']" class="text-white text-xs" />
              </button>
              <button
                class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" class="text-white text-xs" />
              </button>
            </div>
          </div>

          <!-- Vitals data -->
          <div v-if="latestVitals" class="relative z-10 mt-4 space-y-2.5">
            <div class="grid grid-cols-2 gap-2.5">
              <div class="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                <div class="flex items-center gap-1.5 mb-1.5 text-primary-on-container">
                  <font-awesome-icon :icon="['fas', 'heart-pulse']" class="text-sm" />
                  <span class="text-xs">Heart Rate</span>
                </div>
                <p class="text-xl font-bold text-white">{{ latestVitals.pulse_rate ?? '—' }}<span
                    class="text-xs font-normal text-primary-on-container ml-1">bpm</span></p>
              </div>
              <div class="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                <div class="flex items-center gap-1.5 mb-1.5 text-primary-on-container">
                  <font-awesome-icon :icon="['fas', 'droplet']" class="text-sm" />
                  <span class="text-xs">Blood Press.</span>
                </div>
                <p class="text-lg font-bold text-white">{{ latestVitals.blood_pressure_display ?? '—' }}<span
                    v-if="latestVitals.blood_pressure_display"
                    class="text-xs font-normal text-primary-on-container ml-1">mmHg</span></p>
              </div>
              <div class="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                <div class="flex items-center gap-1.5 mb-1.5 text-primary-on-container">
                  <font-awesome-icon :icon="['fas', 'weight-scale']" class="text-sm" />
                  <span class="text-xs">Weight</span>
                </div>
                <p class="text-xl font-bold text-white">{{ latestVitals.weight_kg ?? '—' }}<span
                    class="text-xs font-normal text-primary-on-container ml-1">kg</span></p>
              </div>
              <div class="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                <div class="flex items-center gap-1.5 mb-1.5 text-primary-on-container">
                  <font-awesome-icon :icon="['fas', 'temperature-half']" class="text-sm" />
                  <span class="text-xs">Temp</span>
                </div>
                <p class="text-xl font-bold text-white">{{ latestVitals.temperature ?? '—' }}<span
                    class="text-xs font-normal text-primary-on-container ml-1">°C</span></p>
              </div>
            </div>

            <!-- Secondary metrics — SpO2 / Resp / BMI / Height / BSA / ECOG / Pain -->
            <div v-if="vitalChips.length" class="flex flex-wrap gap-1.5">
              <span v-for="c in vitalChips" :key="c.label"
                class="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/10 border border-white/20 text-white px-2 py-0.5 rounded-md">
                <span class="text-primary-on-container">{{ c.label }}</span>{{ c.value }}
              </span>
            </div>
          </div>

          <!-- No vitals empty state inside the card -->
          <div v-else class="flex-1 flex flex-col items-center justify-center relative z-10 py-4 text-center">
            <div class="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center mb-3">
              <font-awesome-icon :icon="['fas', 'heart-pulse']" class="text-2xl text-white/50" />
            </div>
            <p class="text-white/80 text-sm font-semibold">No vitals recorded</p>
            <p class="text-white/50 text-xs mt-0.5 mb-3">Record the first vitals for this patient</p>
            <button v-if="can('vitals_capture')"
              class="flex items-center gap-1.5 bg-white text-primary text-xs font-bold px-4 py-2 rounded-full hover:bg-primary-fixed transition-all shadow-sm"
              @click="showVitalsModal = true">
              <font-awesome-icon :icon="['fas', 'plus']" class="text-xs" />Record Vitals
            </button>
          </div>

          <div class="mt-3 pt-3 border-t border-white/20 flex justify-between items-center gap-2 relative z-10">
            <span class="text-xs text-primary-on-container truncate">
              {{ latestVitals
                ? `Recorded ${fmtDate(latestVitals.recorded_at)}${latestVitals.recorded_by ? ' · ' +
                  latestVitals.recorded_by :
                  ''}`
                : 'Awaiting first capture' }}
            </span>
            <span v-if="latestVitals?.bmi_category"
              class="flex items-center gap-1 text-xs text-secondary/50 flex-shrink-0">
              <font-awesome-icon :icon="['fas', 'arrow-trend-up']" class="text-xs" />{{ latestVitals.bmi_category }}
            </span>
            <span v-else class="flex items-center gap-1 text-xs text-secondary/50 flex-shrink-0">
              <font-awesome-icon :icon="['fas', 'arrow-trend-up']" class="text-xs" />Stable
            </span>
          </div>
        </div>
      </div>

      <!-- ══ MIDDLE ROW — care timeline + care team ══════════════════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

        <!-- Care timeline + upcoming appointment -->
        <div class="lg:col-span-7 flex flex-col gap-4">

          <!-- Care timeline -->
          <div
            class="bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/50 shadow-island flex flex-col"
            style="max-height:460px;">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 class="text-base sm:text-lg font-bold text-on-surface">Care Timeline</h3>
              <div class="flex items-center gap-2">
                <button class="px-2.5 py-1 rounded-md text-xs font-bold transition-colors"
                  :class="timelineTab === 'all' ? 'bg-white/60 border border-white/40 text-on-surface shadow-sm' : 'border border-outline-variant/50 text-on-surface-variant hover:bg-white/40'"
                  @click="timelineTab = 'all'">All Events</button>
                <button class="px-2.5 py-1 rounded-md text-xs font-bold transition-colors"
                  :class="timelineTab === 'lab' ? 'bg-white/60 border border-white/40 text-on-surface shadow-sm' : 'border border-outline-variant/50 text-on-surface-variant hover:bg-white/40'"
                  @click="timelineTab = 'lab'">Lab Results</button>
                <!-- Add visit from within timeline -->
                <button v-if="can('encounter_management')"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/15 hover:bg-primary/20 transition-colors"
                  @click="showVisitModal = true">
                  <font-awesome-icon :icon="['fas', 'plus']" class="text-xs" />Visit
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto pr-1 relative">
              <!-- Vertical line -->
              <div class="absolute left-[19px] top-2 bottom-0 w-0.5 bg-outline-variant/30" />
              <!-- Empty state with action -->
              <div v-if="!timelineVisits.length" class="pl-12 flex flex-col items-center py-8 text-center">
                <div
                  class="w-14 h-14 rounded-full bg-surface-low border-2 border-dashed border-outline-variant flex items-center justify-center mb-3">
                  <font-awesome-icon :icon="['fas', 'calendar-days']" class="text-2xl text-outline/50" />
                </div>
                <p class="text-sm font-semibold text-on-surface-variant">No clinical events yet</p>
                <p class="text-xs text-outline mt-1 mb-3">Create the patient's first visit to start tracking their care
                  journey</p>
                <button v-if="can('encounter_management')"
                  class="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-primary-container transition-colors shadow-sm"
                  @click="showVisitModal = true">
                  <font-awesome-icon :icon="['fas', 'calendar-plus']" class="text-xs" />Create First Visit
                </button>
                <p v-else class="text-xs text-outline">Ask a clinician to register a visit for this patient.</p>
              </div>
              <!-- Timeline visits -->
              <div v-for="visit in timelineVisits" :key="visit.visit_uuid" class="relative pl-12 pb-5">
                <!-- Node -->
                <div
                  class="absolute left-0 top-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white/80 z-10">
                  <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-primary text-sm" />
                </div>
                <!-- Visit card -->
                <div
                  class="backdrop-blur-sm p-3 rounded-xl border border-white/40 hover:border-primary/20 transition-colors"
                  :class="visitCardAccent(visit.status)">
                  <!-- Visit header: visit_number + date -->
                  <div class="flex flex-wrap justify-between items-start gap-1 mb-1.5">
                    <h4 class="text-sm font-bold text-on-surface font-mono">{{ visit.visit_number }}</h4>
                    <span class="text-xs text-on-surface-variant flex-shrink-0">{{ fmtDate(visit.date) }}</span>
                  </div>
                  <!-- Visit meta: status + visit_type + triage -->
                  <div class="flex items-center gap-1.5 flex-wrap mb-2.5">
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      :class="statusClass(visit.status)">
                      <span class="w-1.5 h-1.5 rounded-full"
                        :class="visit.status === 'completed' ? 'bg-secondary' : visit.status === 'scheduled' ? 'bg-accent' : 'bg-primary'" />
                      {{ prettyLabel(visit.status) }}
                    </span>
                    <span
                      class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/10">
                      <font-awesome-icon :icon="['fas', 'hospital']" class="text-[9px]" />{{
                        prettyLabel(visit.visit_type) }}
                    </span>
                    <span v-if="visit.triage_level"
                      class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                      :class="triageClass(visit.triage_level)">
                      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[9px]" />{{
                        visit.triage_level }}
                    </span>
                  </div>
                  <!-- Encounters: type_name + status + meta -->
                  <div v-if="visit.encounters.length" class="space-y-2 pt-2 border-t border-outline-variant/15">
                    <div v-for="enc in visit.encounters" :key="enc.uuid">
                      <div class="flex items-center justify-between gap-2">
                        <span class="flex items-center gap-2 min-w-0 text-xs text-on-surface">
                          <font-awesome-icon :icon="['fas', encounterIcon(enc.type_code)]"
                            class="text-on-surface-variant text-[11px] flex-shrink-0" />
                          <span class="truncate font-medium">{{ enc.type_name }}</span>
                        </span>
                        <span
                          class="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0"
                          :class="statusClass(enc.status)">{{ prettyLabel(enc.status) }}</span>
                      </div>
                      <!-- Encounter detail line(s): clinician · department · time · notes -->
                      <div v-if="enc.assigned_to || enc.department || enc.ended_at || enc.notes"
                        class="pl-5 mt-0.5 space-y-0.5">
                        <p v-if="enc.assigned_to || enc.department"
                          class="text-[10px] text-on-surface-variant flex items-center gap-1 flex-wrap">
                          <span v-if="enc.assigned_to" class="flex items-center gap-1">
                            <font-awesome-icon :icon="['fas', 'user']" class="text-[8px]" />{{ enc.assigned_to }}
                          </span>
                          <span v-if="enc.department" class="text-outline">· {{ enc.department }}</span>
                        </p>
                        <p v-if="enc.ended_at" class="text-[10px] text-on-surface-variant flex items-center gap-1">
                          <font-awesome-icon :icon="['fas', 'clock']" class="text-[8px]" />{{ fmtDateTime(enc.ended_at)
                          }}
                        </p>
                        <p v-if="enc.notes" class="text-[10px] text-on-surface-variant italic">"{{ enc.notes }}"</p>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-xs text-on-surface-variant pt-2 border-t border-outline-variant/15">No
                    encounters
                    recorded</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming appointment -->
          <div
            class="bg-secondary/10 backdrop-blur-md rounded-xl p-4 border border-white/50 shadow-island relative overflow-hidden group hover:bg-secondary/15 transition-colors cursor-pointer">
            <div
              class="absolute right-[-16px] top-[-16px] opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500">
              <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-[90px] text-secondary" />
            </div>
            <h4 class="text-xs font-bold text-secondary mb-1">Upcoming Appointment</h4>
            <template v-if="nextAppt">
              <p class="text-sm font-bold text-on-surface">{{ nextAppt.scheduled_date ?? nextAppt.date ?? '—' }}<span
                  class="text-sm font-normal text-on-surface-variant ml-2">{{ nextAppt.time ?? '' }}</span></p>
              <p class="flex items-center gap-1 text-xs text-on-surface-variant mt-2">
                <font-awesome-icon :icon="['fas', 'location-dot']" class="text-xs" />{{ nextAppt.location ??
                  nextAppt.encounter_type ?? 'Location TBC' }}
              </p>
            </template>
            <template v-else-if="nextVisit">
              <p class="text-sm font-bold text-on-surface">{{ fmtDate(nextVisit.scheduled_at) }}</p>
              <div class="flex items-center gap-1.5 flex-wrap mt-2">
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                  :class="statusClass(nextVisit.status)">{{ prettyLabel(nextVisit.status) }}</span>
                <span class="inline-flex items-center gap-1 text-[11px] text-on-surface-variant">
                  <font-awesome-icon :icon="['fas', 'hospital']" class="text-[9px]" />{{
                    prettyLabel(nextVisit.visit_type) }}
                </span>
              </div>
            </template>
            <template v-else>
              <p class="text-sm text-on-surface-variant mt-0.5">No upcoming appointments</p>
              <p v-if="vh?.next_scheduled_date" class="text-sm font-bold text-on-surface mt-1">Next: {{
                fmtDate(vh.next_scheduled_date)
                }}</p>
            </template>
          </div>
        </div>

        <!-- Care team + appointment -->
        <div class="lg:col-span-5 flex flex-col gap-4">

          <!-- Care team -->
          <div class="bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/50 shadow-island flex-1">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base sm:text-lg font-bold text-on-surface">Care Team</h3>
              <button class="text-on-surface-variant hover:text-primary transition-colors">
                <font-awesome-icon :icon="['fas', 'ellipsis']" />
              </button>
            </div>
            <div class="space-y-2.5">
              <div
                class="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/60 transition-colors border border-transparent hover:border-white/40">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                    <font-awesome-icon :icon="['fas', 'user-doctor']" class="text-primary text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-on-surface truncate">{{ p?.registered_by || 'System' }}</p>
                    <p class="text-xs text-on-surface-variant">Registered by</p>
                  </div>
                </div>
                <button
                  class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 border border-primary/5">
                  <font-awesome-icon :icon="['fas', 'message']" class="text-xs" />
                </button>
              </div>
              <!-- Referring clinician (from clinical_status) -->
              <div v-if="cs?.referring_clinician || cs?.referring_facility"
                class="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/60 transition-colors border border-transparent hover:border-white/40">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <font-awesome-icon :icon="['fas', 'user-doctor']" class="text-secondary text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-on-surface truncate">{{ cs?.referring_clinician || '—' }}</p>
                    <p class="text-xs text-on-surface-variant truncate">Referring · {{ cs?.referring_facility ||
                      'External facility' }}</p>
                  </div>
                </div>
                <span v-if="cs?.referral_date" class="text-[10px] text-on-surface-variant flex-shrink-0">{{
                  fmtDate(cs.referral_date) }}</span>
              </div>
              <div v-if="p?.nok_full_name"
                class="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/60 transition-colors border border-transparent hover:border-white/40">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center flex-shrink-0">
                    <font-awesome-icon :icon="['fas', 'person']" class="text-tertiary text-sm" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-on-surface truncate">{{ p.nok_full_name }}</p>
                    <p class="text-xs text-on-surface-variant">{{ p.nok_relationship }} — Emergency Contact</p>
                  </div>
                </div>
                <a v-if="p?.nok_phone" :href="`tel:${p.nok_phone}`"
                  class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 border border-primary/5">
                  <font-awesome-icon :icon="['fas', 'phone']" class="text-xs" />
                </a>
              </div>
            </div>
          </div>

          <!-- Insurance -->
          <div class="bg-white/80 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/50 shadow-island">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                <font-awesome-icon :icon="['fas', 'shield-halved']" class="text-primary text-sm" />Insurance
              </h3>
              <span class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
                :class="ins?.has_insurance ? 'bg-secondary-fixed text-secondary-on-fixed border-secondary/30' : 'bg-accent-fixed text-accent-on-container border-accent/30'">
                <span class="w-1.5 h-1.5 rounded-full" :class="ins?.has_insurance ? 'bg-secondary' : 'bg-accent'" />
                {{ ins?.has_insurance ? 'Active' : 'Self Pay' }}
              </span>
            </div>

            <template v-if="ins?.has_insurance">
              <!-- Provider banner -->
              <div
                class="rounded-xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/15 p-3.5 mb-3">
                <p class="text-[11px] font-bold text-primary uppercase tracking-wide mb-0.5">Provider</p>
                <p class="text-sm font-bold text-on-surface">{{ ins.provider }}</p>
                <p v-if="ins.primary_scheme" class="text-xs text-on-surface-variant mt-0.5">
                  {{ ins.primary_scheme }}<span v-if="ins.primary_code" class="font-mono"> · {{ ins.primary_code
                  }}</span>
                </p>
              </div>

              <!-- Coverages -->
              <div class="space-y-2.5">
                <div v-for="cov in ins.active_coverages" :key="cov.uuid"
                  class="rounded-xl border border-secondary/20 bg-secondary-fixed/20 p-3 hover:bg-secondary-fixed/40 transition-colors">
                  <div class="flex items-start justify-between gap-2 mb-2.5">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-on-surface truncate">{{ cov.scheme_name }}</p>
                      <p class="text-xs text-on-surface-variant font-mono">{{ cov.scheme_code }}</p>
                    </div>
                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                      <span v-if="cov.is_primary"
                        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">Primary</span>
                      <span v-if="cov.direct_billing"
                        class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary-on-fixed border border-primary/30 whitespace-nowrap">
                        <font-awesome-icon :icon="['fas', 'bolt']" class="text-[8px]" />Direct Billing</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p class="text-on-surface-variant mb-0.5">Membership No.</p>
                      <p class="font-bold font-mono text-on-surface truncate">{{ cov.membership_number }}</p>
                    </div>
                    <div>
                      <p class="text-on-surface-variant mb-0.5">Member Type</p>
                      <p class="font-bold capitalize text-on-surface">{{ cov.member_type }}</p>
                    </div>
                    <div>
                      <p class="text-on-surface-variant mb-0.5">Valid From</p>
                      <p class="font-bold text-on-surface">{{ fmtDate(cov.valid_from) }}</p>
                    </div>
                    <div>
                      <p class="text-on-surface-variant mb-0.5">Valid To</p>
                      <p class="font-bold text-on-surface">{{ cov.valid_to ? fmtDate(cov.valid_to) : 'No expiry' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Self pay -->
            <div v-else class="flex items-center gap-3 p-3 rounded-xl bg-accent-fixed border border-accent/20">
              <div class="w-9 h-9 rounded-full bg-accent-fixed flex items-center justify-center flex-shrink-0">
                <font-awesome-icon :icon="['fas', 'circle-info']" class="text-accent text-sm" />
              </div>
              <div>
                <p class="text-sm font-bold text-on-surface">Self Pay</p>
                <p class="text-xs text-accent font-semibold">No insurance on file</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ BOTTOM ROW — clinical / lab / billing ══════════════════════ -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Clinical profile — ribbon blue accent -->
        <div class="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white/50 border-l-4 border-l-ribbon-blue shadow-island">
          <h3 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <font-awesome-icon :icon="['fas', 'stethoscope']" class="text-primary text-sm" />Clinical Profile
          </h3>
          <dl class="space-y-2 text-xs sm:text-sm">
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Diagnosis</dt>
              <dd class="font-bold font-mono truncate max-w-[120px]">{{ cs?.primary_diagnosis_icd10 || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Stage</dt>
              <dd class="font-bold">{{ cs?.cancer_stage ? `Stage ${cs.cancer_stage}` : '—' }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">ECOG</dt>
              <dd class="font-bold">{{ ecogDisplay }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Protocol</dt>
              <dd class="font-bold truncate max-w-[120px]">{{ cs?.treatment_protocol || '—' }}</dd>
            </div>
          </dl>

          <!-- Allergies -->
          <div class="mt-3 pt-3 border-t border-outline-variant/15">
            <p class="text-xs text-on-surface-variant mb-1.5 flex items-center gap-1.5">
              <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-error text-[11px]" />Known
              Allergies
            </p>
            <div v-if="cs?.known_allergies?.length" class="flex flex-wrap gap-1.5">
              <span v-for="a in cs.known_allergies" :key="a.uuid"
                class="inline-flex items-center gap-1 text-[11px] font-semibold bg-error-container/60 text-error border border-error/20 px-2 py-0.5 rounded-md"
                :title="a.category">
                {{ a.name }}
              </span>
            </div>
            <p v-else class="text-xs font-semibold text-secondary">None recorded</p>
          </div>

          <!-- Chronic conditions -->
          <div class="mt-3 pt-3 border-t border-outline-variant/15">
            <p class="text-xs text-on-surface-variant mb-1.5 flex items-center gap-1.5">
              <font-awesome-icon :icon="['fas', 'heart-pulse']" class="text-primary text-[11px]" />Chronic Conditions
            </p>
            <div v-if="cs?.chronic_conditions?.length" class="flex flex-wrap gap-1.5">
              <span v-for="c in cs.chronic_conditions" :key="c.uuid"
                class="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/5 text-primary border border-primary/15 px-2 py-0.5 rounded-md"
                :title="c.category">
                {{ c.name }}
              </span>
            </div>
            <p v-else class="text-xs font-semibold text-on-surface-variant">None recorded</p>
          </div>
        </div>

        <!-- Lab results — ribbon teal accent -->
        <div class="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white/50 border-l-4 border-l-ribbon-teal shadow-island">
          <h3 class="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
            <font-awesome-icon :icon="['fas', 'flask']" class="text-secondary text-sm" />Lab Results
          </h3>
          <div v-if="lab?.total_referrals" class="grid grid-cols-2 gap-2 mb-2">
            <div class="bg-secondary-fixed/60 p-2.5 rounded-lg text-center">
              <p class="text-xl font-bold text-secondary">{{ lab.total_referrals }}</p>
              <p class="text-xs text-on-surface-variant">Total</p>
            </div>
            <div class="bg-accent-fixed p-2.5 rounded-lg text-center">
              <p class="text-xl font-bold text-accent">{{ lab.pending_count }}</p>
              <p class="text-xs text-on-surface-variant">Pending</p>
            </div>
            <div class="bg-error-container p-2.5 rounded-lg text-center col-span-2">
              <p class="text-xl font-bold text-error">{{ lab.critical_count }}</p>
              <p class="text-xs text-on-surface-variant">Critical</p>
            </div>
          </div>
          <div v-else class="py-4 text-center">
            <p class="text-xs text-on-surface-variant">No lab referrals yet</p>
          </div>
        </div>

        <!-- Billing — ribbon amber accent -->
        <div v-if="can('billing_view')"
          class="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white/50 border-l-4 border-l-ribbon-amber shadow-island">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
              <font-awesome-icon :icon="['fas', 'file-invoice-dollar']" class="text-primary text-sm" />Billing Summary
            </h3>
            <span class="text-xs text-on-surface-variant">
              {{ bs?.total_invoices ?? 0 }} invoice<span v-if="(bs?.total_invoices ?? 0) !== 1">s</span>
              <span v-if="bs?.unpaid_invoices" class="text-accent font-semibold"> · {{ bs.unpaid_invoices }}
                unpaid</span>
            </span>
          </div>

          <dl class="space-y-2 text-xs sm:text-sm">
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Total Billed</dt>
              <dd class="font-bold tabular-nums text-right">
                <span v-for="p in amountParts(bs?.total_billed, majorCcy)" :key="p" class="block">{{ p }}</span>
              </dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Total Paid</dt>
              <dd class="font-bold text-secondary tabular-nums text-right">
                <span v-for="p in amountParts(bs?.total_paid, majorCcy)" :key="p" class="block">{{ p }}</span>
              </dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Outstanding</dt>
              <dd class="font-bold tabular-nums text-right"
                :class="hasAmount(bs?.total_outstanding) ? 'text-error' : 'text-secondary'">
                <span v-for="p in amountParts(bs?.total_outstanding, majorCcy)" :key="p" class="block">{{ p }}</span>
              </dd>
            </div>
            <div v-if="hasAmount(bs?.insurance_covered)" class="flex justify-between gap-2">
              <dt class="text-on-surface-variant">Insurance Covered</dt>
              <dd class="font-bold text-primary tabular-nums text-right">
                <span v-for="p in amountParts(bs?.insurance_covered, majorCcy)" :key="p" class="block">{{ p }}</span>
              </dd>
            </div>
          </dl>

          <!-- Recent invoices -->
          <div v-if="bs?.recent_invoices?.length" class="mt-3 pt-3 border-t border-outline-variant/15 space-y-2">
            <p class="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">Recent Invoices</p>
            <div v-for="inv in bs.recent_invoices" :key="inv.uuid" class="text-xs">
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono font-semibold text-on-surface truncate">{{ inv.proforma_invoice_no }}</span>
                <span
                  class="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0"
                  :class="inv.status === 'Settled' ? 'bg-secondary-fixed text-secondary-on-fixed border-secondary/30' : 'bg-accent-fixed text-accent-on-container border-accent/30'">
                  <span class="w-1.5 h-1.5 rounded-full"
                    :class="inv.status === 'Settled' ? 'bg-secondary' : 'bg-accent'" />
                  {{ inv.status }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2 mt-0.5 text-on-surface-variant">
                <span>{{ fmtDate(inv.created_at) }}</span>
                <span class="tabular-nums">
                  {{ inv.currency }} {{ Number(inv.total).toLocaleString('en-MW', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) }}
                  <span v-if="Number(inv.outstanding) > 0" class="text-error font-semibold"> · {{
                    Number(inv.outstanding).toLocaleString('en-MW', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    }) }}
                    due</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ══ QR CODE MODAL ══════════════════════════════════════════════════ -->
    <Modal v-model="showQrModal" title="Patient QR Code" size="sm">
      <div class="flex justify-center" v-html="qrCode" />
      <p class="text-center text-xs text-on-surface-variant mt-3">Encoded: <span class="font-mono">EHIS:MRN:{{ p?.mrn
      }}</span></p>
    </Modal>

    <!-- ══ ADD VISIT MODAL ════════════════════════════════════════════════ -->
    <Modal v-model="showVisitModal" title="Register New Visit" size="md" class="max-w-2xl">
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'hospital-user']" class="text-primary text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-on-surface">{{ p?.full_name }}</p>
            <p class="text-xs text-on-surface-variant font-mono">{{ p?.mrn }}</p>
          </div>
        </div>

        <AppAlert v-if="visitError" type="error" :title="visitError" />
        <AppAlert v-if="visitSuccess" type="success" :title="visitSuccess" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="input-label">Visit Date <span class="text-error">*</span></label>
            <input v-model="visitForm.visit_date" type="date" class="input-field" />
          </div>
          <div>
            <label class="input-label">Visit Type</label>
            <select v-model="visitForm.visit_type" class="input-field">
              <option value="outpatient">Outpatient</option>
              <option value="inpatient">Inpatient</option>
              <option value="emergency">Emergency</option>
              <option value="day_case">Day Case</option>
            </select>
          </div>
          <div>
            <label class="input-label">Status</label>
            <select v-model="visitForm.status" class="input-field">
              <option value="in_progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div>
            <label class="input-label">Arrival Time <span
                class="text-xs text-on-surface-variant">(optional)</span></label>
            <input v-model="visitForm.arrived_at" type="datetime-local" class="input-field" />
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Presenting Complaint <span
                class="text-xs text-on-surface-variant">(optional)</span></label>
            <textarea v-model="visitForm.presenting_complaint" rows="2" class="input-field resize-none"
              placeholder="Reason for visit…" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showVisitModal = false">Cancel</button>
        <button class="btn-primary" :disabled="visitSaving" @click="submitVisit">
          <font-awesome-icon v-if="visitSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'calendar-plus']" />
          {{ visitSaving ? 'Saving…' : 'Create Visit' }}
        </button>
      </template>
    </Modal>

    <!-- ══ ADD VITALS MODAL ═══════════════════════════════════════════════ -->
    <Modal v-model="showVitalsModal" title="Vitals Assessment" subtitle="Record the patient's baseline observations"
      size="xl" class="max-w-2xl">
      <div class="space-y-4">
        <div v-if="currentAction" class="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant">
          <span v-for="a in ACTION_ORDER" :key="a" class="px-2 py-0.5 rounded-full border"
            :class="a === 'VITALS' ? 'bg-primary text-white border-primary' : 'border-outline-variant/40 text-outline'">
            {{ a.charAt(0) + a.slice(1).toLowerCase() }}
          </span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'heart-pulse']" class="text-primary text-sm" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-on-surface">{{ p?.full_name }} <span
                class="font-mono text-xs text-on-surface-variant">· {{ p?.mrn }}</span></p>
            <p v-if="allergyNames.length" class="text-xs text-error font-semibold mt-0.5">
              <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[10px]" /> Allergies: {{
                allergyNames.join(', ') }}
            </p>
          </div>
        </div>
        <AppAlert v-if="vitalsError" type="error" :title="vitalsError" />
        <AppAlert v-if="vitalsSuccess" type="success" :title="vitalsSuccess" />
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label class="input-label">Temperature (°C)</label>
            <input v-model="vitalsForm.temperature" type="number" step="0.1" class="input-field" placeholder="36.5" />
          </div>
          <div>
            <label class="input-label">Systolic Blood Pressure (mmHg)</label>
            <input v-model="vitalsForm.blood_pressure_systolic" type="number" class="input-field" placeholder="120" />
          </div>
          <div>
            <label class="input-label">Diastolic Blood Pressure (mmHg)</label>
            <input v-model="vitalsForm.blood_pressure_diastolic" type="number" class="input-field" placeholder="80" />
          </div>
          <div>
            <label class="input-label">Pulse Rate (bpm)</label>
            <input v-model="vitalsForm.pulse_rate" type="number" class="input-field" placeholder="72" />
          </div>
          <div>
            <label class="input-label">Resp. Rate (/min)</label>
            <input v-model="vitalsForm.respiratory_rate" type="number" class="input-field" placeholder="16" />
          </div>
          <div>
            <label class="input-label">SpO2 (%)</label>
            <input v-model="vitalsForm.oxygen_saturation" type="number" class="input-field" placeholder="98" />
          </div>
          <div>
            <label class="input-label">Weight (kg)</label>
            <input v-model="vitalsForm.weight" type="number" step="0.1" class="input-field" placeholder="70" />
          </div>
          <div>
            <label class="input-label">Height (cm)</label>
            <input v-model="vitalsForm.height" type="number" step="0.1" class="input-field" placeholder="170" />
          </div>
          <div>
            <label class="input-label">Pain Score</label>
            <select v-model="vitalsForm.pain_score" class="input-field appearance-none cursor-pointer">
              <option value="">—</option>
              <option value="0">0 — No pain</option>
              <option value="1">1 — Mild pain</option>
              <option value="2">2 — Mild pain</option>
              <option value="3">3 — Mild pain</option>
              <option value="4">4 — Moderate pain</option>
              <option value="5">5 — Moderate pain</option>
              <option value="6">6 — Moderate pain</option>
              <option value="7">7 — Severe pain</option>
              <option value="8">8 — Severe pain</option>
              <option value="9">9 — Severe pain</option>
              <option value="10">10 — Worst possible pain</option>
              <option value="11">Unable to assess (non-verbal/sedated)</option>
            </select>
          </div>
          <div>
            <label class="input-label">Pain Location</label>
            <select v-model="vitalsForm.pain_location" class="input-field appearance-none cursor-pointer">
              <option value="">—</option>

              <optgroup label="Head & Neck">
                <option value="head_frontal">Frontal / Forehead</option>
                <option value="head_temporal_right">Temporal — Right</option>
                <option value="head_temporal_left">Temporal — Left</option>
                <option value="head_occipital">Occipital</option>
                <option value="face_general">Face — General</option>
                <option value="orbital_right">Orbital / Eye — Right</option>
                <option value="orbital_left">Orbital / Eye — Left</option>
                <option value="ear_right">Ear — Right</option>
                <option value="ear_left">Ear — Left</option>
                <option value="nose">Nose</option>
                <option value="oral_cavity">Oral Cavity / Mouth</option>
                <option value="jaw_tmj_right">Jaw / TMJ — Right</option>
                <option value="jaw_tmj_left">Jaw / TMJ — Left</option>
                <option value="neck_anterior">Neck — Anterior</option>
                <option value="neck_posterior">Neck — Posterior</option>
                <option value="throat_pharynx">Throat / Pharynx</option>
                <option value="thyroid_region">Thyroid Region</option>
              </optgroup>

              <optgroup label="Chest / Thorax">
                <option value="chest_general">Chest — General</option>
                <option value="sternum">Sternum</option>
                <option value="chest_wall_right">Chest Wall — Right</option>
                <option value="chest_wall_left">Chest Wall — Left</option>
                <option value="breast_right">Breast — Right</option>
                <option value="breast_left">Breast — Left</option>
                <option value="axilla_right">Axilla — Right</option>
                <option value="axilla_left">Axilla — Left</option>
                <option value="interscapular">Upper Back / Interscapular</option>
              </optgroup>

              <optgroup label="Abdomen">
                <option value="abdomen_general">Abdomen — General</option>
                <option value="abdomen_ruq">Right Upper Quadrant (RUQ)</option>
                <option value="abdomen_luq">Left Upper Quadrant (LUQ)</option>
                <option value="abdomen_rlq">Right Lower Quadrant (RLQ)</option>
                <option value="abdomen_llq">Left Lower Quadrant (LLQ)</option>
                <option value="abdomen_epigastric">Epigastric</option>
                <option value="abdomen_periumbilical">Periumbilical</option>
                <option value="abdomen_suprapubic">Suprapubic</option>
                <option value="flank_right">Flank — Right</option>
                <option value="flank_left">Flank — Left</option>
              </optgroup>

              <optgroup label="Back & Spine">
                <option value="back_upper">Upper Back</option>
                <option value="back_mid">Mid Back</option>
                <option value="back_lower_lumbar">Lower Back / Lumbar</option>
                <option value="back_sacral">Sacral</option>
                <option value="back_coccyx">Coccyx / Tailbone</option>
              </optgroup>

              <optgroup label="Pelvis & Perineum">
                <option value="pelvis_general">Pelvis — General</option>
                <option value="groin_right">Groin — Right</option>
                <option value="groin_left">Groin — Left</option>
                <option value="perineum">Perineum</option>
                <option value="genitalia">Genitalia</option>
                <option value="rectal_anal">Rectal / Anal</option>
              </optgroup>

              <optgroup label="Upper Limb">
                <option value="shoulder_right">Shoulder — Right</option>
                <option value="shoulder_left">Shoulder — Left</option>
                <option value="upper_arm_right">Upper Arm — Right</option>
                <option value="upper_arm_left">Upper Arm — Left</option>
                <option value="elbow_right">Elbow — Right</option>
                <option value="elbow_left">Elbow — Left</option>
                <option value="forearm_right">Forearm — Right</option>
                <option value="forearm_left">Forearm — Left</option>
                <option value="wrist_right">Wrist — Right</option>
                <option value="wrist_left">Wrist — Left</option>
                <option value="hand_right">Hand — Right</option>
                <option value="hand_left">Hand — Left</option>
                <option value="fingers_right">Fingers — Right</option>
                <option value="fingers_left">Fingers — Left</option>
              </optgroup>

              <optgroup label="Lower Limb">
                <option value="hip_right">Hip — Right</option>
                <option value="hip_left">Hip — Left</option>
                <option value="thigh_right">Thigh — Right</option>
                <option value="thigh_left">Thigh — Left</option>
                <option value="knee_right">Knee — Right</option>
                <option value="knee_left">Knee — Left</option>
                <option value="lower_leg_right">Lower Leg / Calf — Right</option>
                <option value="lower_leg_left">Lower Leg / Calf — Left</option>
                <option value="ankle_right">Ankle — Right</option>
                <option value="ankle_left">Ankle — Left</option>
                <option value="foot_right">Foot — Right</option>
                <option value="foot_left">Foot — Left</option>
                <option value="toes_right">Toes — Right</option>
                <option value="toes_left">Toes — Left</option>
              </optgroup>

              <optgroup label="Generalized">
                <option value="generalized_whole_body">Generalized / Whole Body</option>
                <option value="multiple_sites">Multiple Sites</option>
                <option value="other_specify">Other (specify)</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="input-label">BSA (m²)
              <span class="text-xs text-on-surface-variant font-normal">· auto</span></label>
            <input v-model="vitalsForm.surface_area_bsa" type="number" step="0.01" class="input-field"
              placeholder="1.73" />
          </div>
          <div>
            <label class="input-label">ECOG Score</label>
            <select v-model="vitalsForm.ecog_score" class="input-field appearance-none cursor-pointer">
              <option value="">—</option>
              <option value="0">0 — Fully active</option>
              <option value="1">1 — Restricted strenuous activity</option>
              <option value="2">2 — Ambulatory, self-care</option>
              <option value="3">3 — Limited self-care</option>
              <option value="4">4 — Completely disabled</option>
            </select>
          </div>
          <div class="col-span-2 sm:col-span-3">
            <label class="input-label">Notes <span class="text-xs text-on-surface-variant">(optional)</span></label>
            <textarea v-model="vitalsForm.notes" rows="2" class="input-field resize-none"
              placeholder="Clinician observations…" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showVitalsModal = false">Cancel</button>
        <button class="btn-primary" :disabled="vitalsSaving" @click="submitVitals">
          <font-awesome-icon v-if="vitalsSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'heart-pulse']" />
          {{ vitalsSaving ? 'Saving…' : 'Save Vitals' }}
        </button>
      </template>
    </Modal>

    <!-- ══ TRIAGE MODAL ═══════════════════════════════════════════════════ -->
    <Modal v-model="showTriageModal" title="Triage Assessment" subtitle="Set the clinical priority for this visit"
      size="md" class="max-w-2xl">
      <div class="space-y-4">
        <!-- Step context (only during auto-flow) -->
        <div v-if="currentAction" class="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant">
          <span v-for="a in ACTION_ORDER" :key="a" class="px-2 py-0.5 rounded-full border"
            :class="a === 'TRIAGE' ? 'bg-primary text-white border-primary' : 'border-outline-variant/40 text-outline'">
            {{ a.charAt(0) + a.slice(1).toLowerCase() }}
          </span>
        </div>

        <!-- Patient + allergy safety banner -->
        <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-primary text-sm" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-on-surface">{{ p?.full_name }} <span
                class="font-mono text-xs text-on-surface-variant">· {{ p?.mrn }}</span></p>
            <p v-if="allergyNames.length" class="text-xs text-error font-semibold mt-0.5">
              <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-[10px]" /> Allergies: {{
                allergyNames.join(', ') }}
            </p>
            <p v-else class="text-xs text-on-surface-variant mt-0.5">No known allergies</p>
          </div>
        </div>

        <AppAlert v-if="triageError" type="error" :title="triageError" />
        <AppAlert v-if="triageSuccess" type="success" :title="triageSuccess" />

        <div>
          <label class="input-label">Triage Level <span class="text-error">*</span></label>
          <div class="grid grid-cols-3 gap-2 mt-1">
            <button v-for="level in [
              { value: 'P1', desc: 'Immediate — life-threatening', cls: 'border-error bg-error-container text-error' },
              { value: 'P2', desc: 'Urgent — within 30 min', cls: 'border-accent bg-accent-fixed text-accent-on-container' },
              { value: 'P3', desc: 'Routine — can wait', cls: 'border-secondary bg-secondary-fixed text-secondary-on-fixed' },
            ]" :key="level.value"
              class="flex flex-col items-center p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer"
              :class="[level.cls, triageForm.triage_level === level.value ? 'ring-2 ring-offset-1 ring-primary scale-[1.03]' : 'opacity-60 hover:opacity-100']"
              @click="triageForm.triage_level = level.value">
              <span class="text-lg font-black">{{ level.value }}</span>
              <span class="mt-0.5 text-center leading-tight">{{ level.desc }}</span>
            </button>
          </div>
        </div>

        <div>
          <label class="input-label">Presenting Complaint <span
              class="text-xs text-on-surface-variant">(optional)</span></label>
          <textarea v-model="triageForm.presenting_complaint" rows="2" class="input-field resize-none"
            placeholder="Describe the patient's complaint…" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showTriageModal = false">Cancel</button>
        <button class="btn-primary" :disabled="triageSaving" @click="submitTriage">
          <font-awesome-icon v-if="triageSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'check']" />
          {{ triageSaving ? 'Saving…' : 'Record Triage' }}
        </button>
      </template>
    </Modal>

    <!-- ══ LABORATORY MODAL ═══════════════════════════════════════════════ -->
    <Modal v-model="showLabModal" title="Laboratory" subtitle="Start the laboratory encounter for this visit" size="md" class="max-w-2xl">
      <div class="space-y-4">
        <div v-if="currentAction" class="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant">
          <span v-for="a in ACTION_ORDER" :key="a" class="px-2 py-0.5 rounded-full border"
            :class="a === 'LAB' ? 'bg-primary text-white border-primary' : 'border-outline-variant/40 text-outline'">
            {{ a.charAt(0) + a.slice(1).toLowerCase() }}
          </span>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'flask']" class="text-primary text-sm" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-on-surface">{{ p?.full_name }} <span
                class="font-mono text-xs text-on-surface-variant">· {{ p?.mrn }}</span></p>
            <p class="text-xs text-on-surface-variant mt-0.5">{{ encByType('LAB')?.type_name || 'Laboratory' }}</p>
          </div>
        </div>

        <AppAlert v-if="labError" type="error" :title="labError" />
        <AppAlert v-if="labSuccess" type="success" :title="labSuccess" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="input-label">Specimen Type <span
                class="text-xs text-on-surface-variant">(optional)</span></label>
            <input v-model="labForm.specimen_type" type="text" class="input-field"
              placeholder="e.g. Serum, Whole blood" />
          </div>
          <div>
            <label class="input-label">Priority</label>
            <div class="grid grid-cols-3 gap-1.5 mt-1">
              <button v-for="pr in ['routine', 'urgent', 'stat']" :key="pr" type="button"
                class="px-2 py-2 rounded-lg text-xs font-bold border-2 capitalize transition-all"
                :class="labForm.priority === pr ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/30 text-on-surface hover:border-primary/40'"
                @click="labForm.priority = pr">{{ pr }}</button>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Notes <span class="text-xs text-on-surface-variant">(optional)</span></label>
            <textarea v-model="labForm.notes" rows="2" class="input-field resize-none"
              placeholder="Collection notes, instructions…" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showLabModal = false">Cancel</button>
        <button class="btn-primary" :disabled="labSaving" @click="submitLab">
          <font-awesome-icon v-if="labSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'flask']" />
          {{ labSaving ? 'Starting…' : 'Start Laboratory' }}
        </button>
      </template>
    </Modal>

    <!-- ══ IMAGING MODAL ══════════════════════════════════════════════════ -->
    <Modal v-model="showImagingModal" title="Diagnostic Imaging" subtitle="Start the imaging encounter for this visit"
      size="md" class="max-w-2xl">
      <div class="space-y-4">
        <div v-if="currentAction" class="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant">
          <span v-for="a in ACTION_ORDER" :key="a" class="px-2 py-0.5 rounded-full border"
            :class="a === 'IMAGING' ? 'bg-primary text-white border-primary' : 'border-outline-variant/40 text-outline'">
            {{ a.charAt(0) + a.slice(1).toLowerCase() }}
          </span>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'x-ray']" class="text-primary text-sm" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-on-surface">{{ p?.full_name }} <span
                class="font-mono text-xs text-on-surface-variant">· {{ p?.mrn }}</span></p>
            <p class="text-xs text-on-surface-variant mt-0.5">{{ encByType('IMAGING')?.type_name || 'Diagnostic Imaging'
              }}
            </p>
          </div>
        </div>

        <AppAlert v-if="imagingError" type="error" :title="imagingError" />
        <AppAlert v-if="imagingSuccess" type="success" :title="imagingSuccess" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="input-label">Modality</label>
            <select v-model="imagingForm.modality" class="input-field">
              <option value="" disabled>Select modality…</option>
              <option v-for="m in imagingModalities" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="input-label">Body Part <span class="text-xs text-on-surface-variant">(optional)</span></label>
            <input v-model="imagingForm.body_part" type="text" class="input-field" placeholder="e.g. Chest, Abdomen" />
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Priority</label>
            <div class="grid grid-cols-3 gap-1.5 mt-1 max-w-xs">
              <button v-for="pr in ['routine', 'urgent', 'stat']" :key="pr" type="button"
                class="px-2 py-2 rounded-lg text-xs font-bold border-2 capitalize transition-all"
                :class="imagingForm.priority === pr ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/30 text-on-surface hover:border-primary/40'"
                @click="imagingForm.priority = pr">{{ pr }}</button>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="input-label">Notes <span class="text-xs text-on-surface-variant">(optional)</span></label>
            <textarea v-model="imagingForm.notes" rows="2" class="input-field resize-none"
              placeholder="Clinical indication, instructions…" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showImagingModal = false">Cancel</button>
        <button class="btn-primary" :disabled="imagingSaving" @click="submitImaging">
          <font-awesome-icon v-if="imagingSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'x-ray']" />
          {{ imagingSaving ? 'Starting…' : 'Start Imaging' }}
        </button>
      </template>
    </Modal>

    <!-- ══ EDIT PATIENT MODAL (PATCH /patient/update) ══════════════════ -->
    <Modal v-model="showEditModal" title="Edit Patient" subtitle="Update demographic and contact details" size="lg" class="max-w-[70%]">
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <font-awesome-icon :icon="['fas', 'user-pen']" class="text-primary text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-on-surface">{{ p?.full_name }}</p>
            <p class="text-xs text-on-surface-variant font-mono">{{ p?.mrn }}</p>
          </div>
        </div>

        <AppAlert v-if="editError" type="error" :title="editError" />
        <AppAlert v-if="editSuccess" type="success" :title="editSuccess" />

        <!-- Identity -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label class="input-label">First Name <span class="text-error">*</span></label>
            <input v-model="editForm.first_name" class="input-field" />
          </div>
          <div><label class="input-label">Middle Name</label><input v-model="editForm.middle_name"
              class="input-field" />
          </div>
          <div><label class="input-label">Last Name <span class="text-error">*</span></label>
            <input v-model="editForm.last_name" class="input-field" />
          </div>
          <div><label class="input-label">Preferred Name</label><input v-model="editForm.preferred_name"
              class="input-field" /></div>
          <div><label class="input-label">Date of Birth <span class="text-error">*</span></label>
            <input v-model="editForm.date_of_birth" type="date" class="input-field" />
          </div>
          <div><label class="input-label">Gender <span class="text-error">*</span></label>
            <select v-model="editForm.gender" class="input-field">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div><label class="input-label">Gender Identity</label>
            <input v-model="editForm.gender_identity" class="input-field" placeholder="Optional" />
          </div>
          <div><label class="input-label">Marital Status</label>
            <select v-model="editForm.marital_status" class="input-field">
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
          </div>
          <div><label class="input-label">Nationality</label>
            <input v-model="editForm.nationality" class="input-field" placeholder="e.g. Malawian" />
          </div>
        </div>

        <!-- Contact -->
        <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wide pt-1">Contact</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label class="input-label">Primary Phone</label><input v-model="editForm.phone_primary" type="tel"
              class="input-field" /></div>
          <div><label class="input-label">Secondary Phone</label><input v-model="editForm.phone_secondary" type="tel"
              class="input-field" /></div>
          <div><label class="input-label">Email</label><input v-model="editForm.email" type="email"
              class="input-field" />
          </div>
          <div><label class="input-label">Preferred Contact</label>
            <select v-model="editForm.preferred_contact_method" class="input-field">
              <option value="">Select</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>

        <!-- Address -->
        <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wide pt-1">Address</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2"><label class="input-label">Address Line 1</label><input
              v-model="editForm.address_line1" class="input-field" /></div>
          <div class="sm:col-span-2"><label class="input-label">Address Line 2</label><input
              v-model="editForm.address_line2" class="input-field" /></div>
          <div><label class="input-label">Country</label>
            <select v-model="editForm.country_id" class="input-field">
              <option value="">Select country</option>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.fhir_coding?.display || c.name }}</option>
            </select>
          </div>
          <div><label class="input-label">Region / State</label>
            <select v-model="editForm.state_id" class="input-field" :disabled="!filteredStates.length">
              <option value="">Select region</option>
              <option v-for="s in filteredStates" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div><label class="input-label">City / District</label>
            <select v-model="editForm.city_id" class="input-field" :disabled="!filteredCities.length">
              <option value="">Select city</option>
              <option v-for="c in filteredCities" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div><label class="input-label">Postal Code</label><input v-model="editForm.postal_code"
              class="input-field" />
          </div>
        </div>

        <!-- Next of Kin -->
        <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wide pt-1">Next of Kin</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label class="input-label">Full Name</label><input v-model="editForm.nok_full_name"
              class="input-field" />
          </div>
          <div><label class="input-label">Relationship</label>
            <select v-model="editForm.nok_relationship" class="input-field">
              <option value="">Select</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="guardian">Guardian</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div><label class="input-label">Phone</label><input v-model="editForm.nok_phone" type="tel"
              class="input-field" />
          </div>
          <div><label class="input-label">Address</label><input v-model="editForm.nok_address" class="input-field" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showEditModal = false">Cancel</button>
        <button class="btn-primary" :disabled="editSaving" @click="submitEditPatient">
          <font-awesome-icon v-if="editSaving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'floppy-disk']" />
          {{ editSaving ? 'Saving…' : 'Update Patient' }}
        </button>
      </template>
    </Modal>

    <!-- ══ REFERRAL DOCUMENT VIEWER (view-only, no download) ══════════════ -->
    <Modal v-model="showReferralDoc" title="Referral Document" subtitle="Preview only — download is disabled" size="xl"
      class="max-w-[80%]">
      <div v-if="referralDocMeta"
        class="h-[70vh] min-h-[420px] rounded-xl border border-outline-variant/30 bg-surface-low/60 overflow-auto"
        @contextmenu.prevent>
        <div v-if="referralDocMeta.kind === 'image'" class="min-h-full flex items-center justify-center p-3">
          <img :src="referralDocMeta.url" :alt="referralDocMeta.name"
            class="max-w-full rounded-md shadow-sm select-none pointer-events-none" draggable="false" />
        </div>
        <object v-else-if="referralDocMeta.kind === 'pdf'" :data="`${referralDocMeta.url}#toolbar=0`"
          type="application/pdf" class="w-full h-full min-h-[400px]">
          <iframe :src="`${referralDocMeta.url}#toolbar=0`" title="Referral document"
            class="w-full h-full min-h-[400px] border-0" sandbox="allow-same-origin allow-scripts" />
        </object>
        <div v-else class="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
          <font-awesome-icon :icon="['fas', 'file']" class="text-3xl text-outline/30" />
          <p class="text-sm text-on-surface-variant">Preview not available for this file type.</p>
        </div>
      </div>
      <div v-else class="py-10 text-center text-sm text-on-surface-variant">No document available.</div>
      <template #footer>
        <button class="btn-secondary" @click="showReferralDoc = false">Close</button>
      </template>
    </Modal>

  </div>
</template>

<script setup lang="ts">
import { parseFhirPatient, type FhirPatient } from '~/composables/useFhir'

// ── Types ──────────────────────────────────────────────────────────────────
interface CodedItem { name: string; uuid: string; category: string }
interface RecentVisit {
  uuid: string; visit_number: string; visit_date: string; visit_type: string
  status: string; triage_level: string | null; presenting_complaint: string | null
  discharge_disposition: string | null; duration_minutes: number | null; created_by: string
}
interface UpcomingVisit { scheduled_at: string; status: string; visit_type: string }
interface VitalsRecord {
  uuid: string; recorded_at: string; recorded_by: string | null
  blood_pressure_systolic: string | null; blood_pressure_diastolic: string | null
  blood_pressure_display: string | null
  pulse_rate: number | null; respiratory_rate: number | null
  temperature: string | null; oxygen_saturation: string | null
  weight_kg: string | null; height_cm: string | null
  bmi: string | null; bmi_category: string | null
  pain_score: string | null; pain_location: string | null
  surface_area_bsa: string | null; ecog_score: string | null; notes: string | null
}
interface DashboardData {
  patient: {
    uuid: string; mrn: string; full_name: string; preferred_name: string | null
    date_of_birth: string; age: number; gender: string; blood_group: string | null
    phone_primary: string | null; nok_full_name: string | null
    nok_relationship: string | null; nok_phone: string | null
    registered_at: string; registered_by: string
  }
  clinical_status: {
    cancer_type: string | null; cancer_stage: string | null
    primary_diagnosis_icd10: string | null; ecog_performance_status: number | null
    ecog_label: string | null; on_treatment_protocol: boolean
    treatment_protocol: string | null; known_allergies: CodedItem[]
    chronic_conditions: CodedItem[]; referring_facility: string | null
    referring_clinician: string | null; referral_date: string | null
  }
  visit_history: {
    total_visits: number; completed_visits: number
    last_visit_date: string | null; next_scheduled_date: string | null
    recent: RecentVisit[]
  }
  vitals_trend: {
    latest: VitalsRecord | null
    history: VitalsRecord[]
  }
  active_diagnoses: { primary: unknown[]; secondary: unknown[]; total_consultations: number; last_consultation_at: string | null }
  medications: { medications: unknown[]; as_of: string | null }
  lab_results: { total_referrals: number; pending_count: number; critical_count: number; recent: unknown[] }
  upcoming_visits: UpcomingVisit[]
  upcoming_appointments: unknown[]
  billing_summary: {
    total_invoices: number
    total_billed: { MWK: string | number; USD: string | number }
    total_paid: { MWK: string | number; USD: string | number }
    total_outstanding: { MWK: string | number; USD: string | number }
    insurance_covered: { MWK: string | number; USD: string | number }
    unpaid_invoices: number
    recent_invoices: { uuid: string; proforma_invoice_no: string; currency: string; status: string; total: string; paid: string; outstanding: string; created_at: string }[]
  }
  insurance: {
    has_insurance: boolean; provider: string | null; primary_scheme: string | null; primary_code: string | null
    active_coverages: {
      uuid: string; scheme_name: string; scheme_code: string; provider: string
      membership_number: string; member_type: string; is_primary: boolean
      valid_from: string | null; valid_to: string | null; direct_billing: boolean
    }[]
  }
  alerts: { level: string; message: string }[]
}

// ── Care timeline (GET /patient/timeline?uuid=) ─────────────────────────
interface TimelineEncounter {
  uuid: string; type_code: string; type_name: string; status: string
  fhir_status: string; started_at: string | null; ended_at: string | null
  department: string | null; assigned_to: string | null; notes: string | null
  is_manual_capture: boolean
}
interface TimelineVisit {
  date: string; visit_uuid: string; visit_number: string; status: string
  visit_type: string; triage_level: string | null; arrived_at: string | null
  discharged_at: string | null; duration_minutes: number | null
  encounters: TimelineEncounter[]
}

const route = useRoute()
const { denied } = usePageGuard(['patient_view'])
const { can } = usePermission()
const { request, loading } = useApi()
const { showSkeleton } = useDelayedLoading(loading)

// ── State ──────────────────────────────────────────────────────────────────
const dash = ref<DashboardData | null>(null)
const fhirPatient = ref<FhirPatient | null>(null)
const profilePhoto = ref('')
const photoError = ref(false)
const timeline = ref<TimelineVisit[]>([])
const timelineTab = ref<'all' | 'lab'>('all')
const qrCode = ref('')
const showQrModal = ref(false)

// ── Modal visibility ───────────────────────────────────────────────────────
const showVisitModal = ref(false)
const showVitalsModal = ref(false)
const showTriageModal = ref(false)

// ── Visit form ─────────────────────────────────────────────────────────────
const visitForm = reactive({
  visit_date: new Date().toISOString().split('T')[0],
  visit_type: 'outpatient' as string,
  arrived_at: '',        // optional — server defaults to now()
  presenting_complaint: '',
  status: 'in_progress' as string,
})
const visitSaving = ref(false)
const visitError = ref('')
const visitSuccess = ref('')

// ── Vitals form ────────────────────────────────────────────────────────────
const vitalsForm = reactive({
  temperature: '',
  pulse_rate: '',
  blood_pressure_systolic: '',
  blood_pressure_diastolic: '',
  respiratory_rate: '',
  oxygen_saturation: '',
  weight: '',
  height: '',
  pain_score: '',
  pain_location: '',
  surface_area_bsa: '',
  ecog_score: '',
  notes: '',
})
const vitalsSaving = ref(false)
const vitalsError = ref('')
const vitalsSuccess = ref('')

// auto-fill BSA from weight + height (Mosteller); editable for override
watch([() => vitalsForm.weight, () => vitalsForm.height], ([w, h]) => {
  const wn = Number(w), hn = Number(h)
  if (wn > 0 && hn > 0) vitalsForm.surface_area_bsa = Math.sqrt((wn * hn) / 3600).toFixed(2)
})

// ── Triage form (PATCH /patient/patient_visit/triage) ────────────────────
const triageForm = reactive({ triage_level: 'P3' as string, presenting_complaint: '' })
const triageSaving = ref(false)
const triageError = ref('')
const triageSuccess = ref('')

const uuid = computed(() => route.params.uuid as string)
const customerUuid = computed(() => route.query.customer_uuid as string)

// ── Load data ──────────────────────────────────────────────────────────────
const loadDashboard = async () => {
  const [dashData, patientData, timelineData] = await Promise.all([
    request<DashboardData>(`/patient/dashboard?uuid=${uuid.value}`),
    request<Record<string, unknown>>(`/patient/show?uuid=${uuid.value}`),
    request<TimelineVisit[]>(`/patient/timeline?uuid=${uuid.value}`),
  ])
  if (dashData) dash.value = dashData
  if (patientData) {
    profilePhoto.value = (patientData.profile_photo as string) || ''
    photoError.value = false
    fhirPatient.value = patientData.resourceType === 'Patient'
      ? parseFhirPatient(patientData)
      : patientData as unknown as FhirPatient

    // Referral details + document URL straight from the show extensions
    const ext = (patientData.extension as any[]) ?? []
    const extVal = (suffix: string) => {
      const e = ext.find(x => typeof x?.url === 'string' && x.url.endsWith(suffix))
      return e ? (e.valueString ?? e.valueDate ?? e.valueBoolean ?? '') : ''
    }
    const docExt = ext.find(x => x?.code === 'REFERRAL_DOCUMENTS'
      || (typeof x?.url === 'string' && x.url.endsWith('referral-document')))
    referral.facility = String(extVal('referring-facility') || cs.value?.referring_facility || '')
    referral.clinician = String(extVal('referring-clinician') || cs.value?.referring_clinician || '')
    referral.date = String(extVal('referral-date') || cs.value?.referral_date || '')
    referral.documentUrl = Array.isArray(docExt?.valueDate) ? (docExt.valueDate[0]?.document ?? '') : ''
  }
  if (timelineData) timeline.value = timelineData
}

// ══ AUTO-FLOW: triage → vitals → lab → imaging ═══════════════════════════════
const showLabModal = ref(false)
const showImagingModal = ref(false)

// order the modals must appear in
const ACTION_ORDER = ['TRIAGE', 'VITALS', 'LAB', 'IMAGING'] as const
type ActionKey = typeof ACTION_ORDER[number]

// session-only dismissals — cleared on reload/remount, so conditions re-trigger
const dismissed = ref<Set<ActionKey>>(new Set())
const currentAction = ref<ActionKey | null>(null)
const advancing = ref(false)

// the visit we drive the flow from (first non-closed visit, else the latest)
const activeVisit = computed<TimelineVisit | null>(() =>
  timeline.value.find(v => !['completed', 'cancelled', 'discharged'].includes(v.status))
  ?? timeline.value[0] ?? null)

const encByType = (code: string) => activeVisit.value?.encounters.find(e => e.type_code === code) ?? null

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const needsEncounter = (code: string) => {
  if (activeVisit.value?.date !== todayStr()) return false   // only auto-prompt for today's visit
  const e = encByType(code)
  return !!e && ['planned', 'in_progress', 'scheduled'].includes(e.status) && e.is_manual_capture && !e.started_at
}

const actionPending = (a: ActionKey) => needsEncounter(a)

const pendingActions = computed<ActionKey[]>(() =>
  ACTION_ORDER.filter(a => !dismissed.value.has(a) && actionPending(a)))

const anyAutoModalOpen = () =>
  showTriageModal.value || showVitalsModal.value || showLabModal.value || showImagingModal.value

const openAction = (a: ActionKey) => {
  currentAction.value = a
  advancing.value = true
  showTriageModal.value = a === 'TRIAGE'
  showVitalsModal.value = a === 'VITALS'
  showLabModal.value = a === 'LAB'
  showImagingModal.value = a === 'IMAGING'
  nextTick(() => { advancing.value = false })
}

// open the next pending modal if nothing is currently open
const maybeAutoOpen = () => {
  if (anyAutoModalOpen()) return
  const next = pendingActions.value[0]
  if (next) openAction(next)
  else currentAction.value = null
}

// when an auto-opened modal closes (cancel / X / backdrop), dismiss it for this
// session and advance to the next pending one
const onAutoModalToggle = (action: ActionKey, open: boolean) => {
  if (open || advancing.value) return
  if (currentAction.value === action) {
    dismissed.value.add(action)
    currentAction.value = null
  }
  nextTick(maybeAutoOpen)
}
watch(showTriageModal, v => onAutoModalToggle('TRIAGE', v))
watch(showVitalsModal, v => onAutoModalToggle('VITALS', v))
watch(showLabModal, v => onAutoModalToggle('LAB', v))
watch(showImagingModal, v => onAutoModalToggle('IMAGING', v))

// every time the timeline refreshes (initial load + after each submit), re-evaluate
watch(timeline, () => maybeAutoOpen())

onMounted(loadDashboard)

// ── Computed helpers ───────────────────────────────────────────────────────
const p = computed(() => dash.value?.patient)
const cs = computed(() => dash.value?.clinical_status)
const vh = computed(() => dash.value?.visit_history)
const vt = computed(() => dash.value?.vitals_trend)
const lab = computed(() => dash.value?.lab_results)
const bs = computed(() => dash.value?.billing_summary)
const ins = computed(() => dash.value?.insurance)
const appts = computed(() => dash.value?.upcoming_appointments ?? [])
const upcomingVisits = computed(() => dash.value?.upcoming_visits ?? [])
const alerts = computed(() => dash.value?.alerts ?? [])

// ── Care timeline (from /patient/timeline) ───────────────────────────────
// "All Events" shows every visit; "Lab Results" keeps only visits that contain
// a laboratory encounter (and narrows the encounter list to those).
const timelineVisits = computed<TimelineVisit[]>(() => {
  if (timelineTab.value === 'lab') {
    return timeline.value
      .map(v => ({ ...v, encounters: v.encounters.filter(e => e.type_code === 'LAB') }))
      .filter(v => v.encounters.length)
  }
  return timeline.value
})

// Title-case a snake/lower status or visit_type, e.g. "in_progress" → "In Progress"
const prettyLabel = (s: string | null | undefined) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'

// Colour scheme for a visit/encounter status pill
const statusClass = (s: string | null | undefined) => {
  switch ((s ?? '').toLowerCase()) {
    case 'completed':
    case 'finished': return 'bg-secondary-fixed text-secondary-on-fixed border-secondary/30'
    case 'in_progress':
    case 'in-progress':
    case 'arrived': return 'bg-primary-fixed text-primary-on-fixed border-primary/30'
    case 'scheduled':
    case 'planned': return 'bg-accent-fixed text-accent-on-container border-accent/30'
    case 'cancelled':
    case 'no_show': return 'bg-error-container text-error border-error/30'
    default: return 'bg-surface-low text-on-surface-variant border-outline-variant/40'
  }
}

// Subtle ribbon-tinted card background + left accent, matched to the same status palette as statusClass
const visitCardAccent = (s: string | null | undefined) => {
  switch ((s ?? '').toLowerCase()) {
    case 'completed':
    case 'finished': return 'bg-secondary-fixed/25 border-l-4 border-l-ribbon-teal'
    case 'in_progress':
    case 'in-progress':
    case 'arrived': return 'bg-primary-fixed/25 border-l-4 border-l-ribbon-blue'
    case 'scheduled':
    case 'planned': return 'bg-accent-fixed/25 border-l-4 border-l-ribbon-amber'
    case 'cancelled':
    case 'no_show': return 'bg-error-container/25 border-l-4 border-l-ribbon-red'
    default: return 'bg-white/60 border-l-4 border-l-outline-variant'
  }
}

// Colour scheme for a triage priority pill
const triageClass = (lvl: string | null | undefined) => {
  switch ((lvl ?? '').toUpperCase()) {
    case 'P1': return 'bg-error-container text-error border-error/30'
    case 'P2': return 'bg-accent-fixed text-accent-on-container border-accent/30'
    case 'P3': return 'bg-secondary-fixed text-secondary-on-fixed border-secondary/30'
    default: return 'bg-surface-low text-on-surface-variant border-outline-variant/40'
  }
}

// Icon for an encounter based on its type code
const encounterIcon = (code: string) => {
  switch ((code ?? '').toUpperCase()) {
    case 'LAB': return 'flask'
    case 'IMAGING': return 'x-ray'
    case 'VITALS': return 'heart-pulse'
    case 'TRIAGE': return 'triangle-exclamation'
    case 'REG': return 'user-plus'
    case 'PRECOST': return 'file-invoice-dollar'
    default: return 'notes-medical'
  }
}

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-MW', { dateStyle: 'medium' }) : '—'

const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-MW', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const age = computed(() => {
  if (p.value?.age) return p.value.age
  if (!p.value?.date_of_birth) return null
  return Math.floor((Date.now() - new Date(p.value.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
})

const latestVitals = computed(() => (vt.value?.latest ?? null) as VitalsRecord | null)

// Secondary vitals chips — only those actually present
const vitalChips = computed(() => {
  const v = latestVitals.value
  if (!v) return [] as { label: string; value: string }[]
  const chips: { label: string; value: string }[] = []
  if (v.oxygen_saturation != null) chips.push({ label: 'SpO₂ ', value: `${v.oxygen_saturation}%` })
  if (v.respiratory_rate != null) chips.push({ label: 'Resp ', value: `${v.respiratory_rate}/min` })
  if (v.bmi != null) chips.push({ label: 'BMI ', value: `${v.bmi}${v.bmi_category ? ` · ${v.bmi_category}` : ''}` })
  if (v.height_cm != null) chips.push({ label: 'Height ', value: `${v.height_cm} cm` })
  if (v.surface_area_bsa != null) chips.push({ label: 'BSA ', value: `${v.surface_area_bsa} m²` })
  if (v.ecog_score != null && v.ecog_score !== '') chips.push({ label: 'ECOG ', value: v.ecog_score })
  if (v.pain_score != null) chips.push({ label: 'Pain ', value: String(v.pain_score) })
  return chips
})

// ECOG — prefer the clinical label, fall back to the latest vitals score
const ecogDisplay = computed(() => {
  if (cs.value?.ecog_label) return cs.value.ecog_label
  if (cs.value?.ecog_performance_status != null) return `ECOG ${cs.value.ecog_performance_status}`
  const v = latestVitals.value?.ecog_score
  return v != null && v !== '' ? `ECOG ${v}` : '—'
})

const treatmentStatus = computed(() => {
  if (cs.value?.on_treatment_protocol) return 'On Treatment'
  if (cs.value?.cancer_type) return 'Under Treatment'
  return 'Active'
})

const mwk = (v: string | number) => `MWK ${Number(v).toLocaleString('en-MW', { maximumFractionDigits: 0 })}`
const mwk2 = (v: string | number) => `MWK ${Number(v).toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const money = (code: string, v: string | number) =>
  `${code} ${Number(v).toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const majorCcy = computed<'MWK' | 'USD'>(() => {
  const fields = [
    bs.value?.total_billed,
    bs.value?.total_paid,
    bs.value?.total_outstanding,
    bs.value?.insurance_covered,
  ]
  let mwk = 0, usd = 0
  for (const f of fields) {
    if (Number(f?.MWK ?? 0) > 0) mwk++
    if (Number(f?.USD ?? 0) > 0) usd++
  }
  return usd > mwk ? 'USD' : 'MWK' // tie → MWK
})

// Returns the currency strings to show: both if both > 0,
// only the non-zero one otherwise. Falls back to MWK 0.00 when both are 0.
const amountParts = (
  amt?: { MWK?: string | number; USD?: string | number },
  fallbackCcy: 'MWK' | 'USD' = 'MWK',
) => {
  const parts: string[] = []
  if (Number(amt?.MWK ?? 0) > 0) parts.push(money('MWK', amt!.MWK!))
  if (Number(amt?.USD ?? 0) > 0) parts.push(money('USD', amt!.USD!))
  if (parts.length === 0) parts.push(money(fallbackCcy, 0))
  return parts
}

const hasAmount = (amt?: { MWK?: string | number; USD?: string | number }) =>
  Number(amt?.MWK ?? 0) > 0 || Number(amt?.USD ?? 0) > 0

const loadQr = async () => {
  const svg = await request<string>(`/patient/qr_code?uuid=${uuid.value}`)
  if (svg) { qrCode.value = svg as unknown as string; showQrModal.value = true }
}

const nextAppt = computed(() => (appts.value[0] ?? null) as Record<string, unknown> | null)
const nextVisit = computed(() => upcomingVisits.value[0] ?? null)

// ── What's missing — drives the banner ────────────────────────────────────
const noVisits = computed(() => !vh.value?.total_visits)
const noVitals = computed(() => !latestVitals.value)

// Show the combined "needs attention" banner when any gap exists post-load
const showSetupBanner = computed(() =>
  !loading.value && !!dash.value && (noVisits.value || noVitals.value)
)

// ── Submit handlers ────────────────────────────────────────────────────────

// POST /patients/:id/patient_visits
const submitVisit = async () => {
  visitError.value = ''; visitSaving.value = true
  try {
    const fd = new FormData()
    fd.append('patient_visit[visit_date]', String(visitForm.visit_date))
    fd.append('patient_visit[visit_type]', String(visitForm.visit_type))
    fd.append('patient_visit[status]', String(visitForm.status))
    if (visitForm.presenting_complaint) fd.append('patient_visit[presenting_complaint]', String(visitForm.presenting_complaint))
    if (visitForm.arrived_at) fd.append('patient_visit[arrived_at]', String(visitForm.arrived_at))

    // Use numeric patient ID from dash if available; fallback to uuid
    const patientId = p.value?.uuid ?? uuid.value
    await request(`/patients/${patientId}/patient_visits`, { method: 'POST', body: fd })
    visitSuccess.value = 'Visit created successfully.'
    await loadDashboard()  // refresh to show the new visit
    setTimeout(() => { showVisitModal.value = false; visitSuccess.value = '' }, 1500)
  } catch (e: unknown) {
    visitError.value = (e as Error).message || 'Failed to create visit.'
  } finally {
    visitSaving.value = false
  }
}

// POST /patient/patient_visit/vitals
const submitVitals = async () => {
  vitalsError.value = ''; vitalsSuccess.value = ''
  const patientUuid = p.value?.uuid ?? uuid.value
  const visit = activeVisit.value
  if (!visit) { vitalsError.value = 'No active visit found.'; return }

  vitalsSaving.value = true
  try {
    const fd = new FormData()
    fd.append('uuid', patientUuid)
    fd.append('visit_uuid', visit.visit_uuid)
    // map form fields → exact payload keys (omit empties)
    const payload: Record<string, string> = {
      pulse_rate: vitalsForm.pulse_rate,
      respiratory_rate: vitalsForm.respiratory_rate,
      temperature: vitalsForm.temperature,
      blood_pressure_systolic: vitalsForm.blood_pressure_systolic,
      blood_pressure_diastolic: vitalsForm.blood_pressure_diastolic,
      oxygen_saturation: vitalsForm.oxygen_saturation,
      weight_kg: vitalsForm.weight,
      height_cm: vitalsForm.height,
      pain_score: vitalsForm.pain_score,
      pain_location: vitalsForm.pain_location,
      surface_area_bsa: vitalsForm.surface_area_bsa,
      ecog_score: vitalsForm.ecog_score,
      notes: vitalsForm.notes,
    }
    Object.entries(payload).forEach(([k, v]) => { if (v) fd.append(`patient_vital[${k}]`, v) })

    await request('/patient/patient_visit/vitals', { method: 'POST', body: fd })
    await loadDashboard()           // spinner stays on until the dashboard fully reloads
    showVitalsModal.value = false   // success → close
  } catch (e: unknown) {
    vitalsError.value = (e as Error).message || 'Failed to record vitals.'  // error → keep modal open
  } finally {
    vitalsSaving.value = false
  }
}

// PATCH /patient/patient_visit/triage
const submitTriage = async () => {
  triageError.value = ''; triageSuccess.value = ''
  const patientUuid = p.value?.uuid ?? uuid.value
  const visit = activeVisit.value
  if (!visit) { triageError.value = 'No active visit found to triage.'; return }

  triageSaving.value = true
  try {
    const fd = new FormData()
    fd.append('uuid', patientUuid)
    fd.append('visit_uuid', visit.visit_uuid)
    fd.append('triage_level', triageForm.triage_level)
    if (triageForm.presenting_complaint) fd.append('presenting_complaint', triageForm.presenting_complaint)

    await request('/patient/patient_visit/triage', { method: 'PATCH', body: fd })
    await loadDashboard()            // spinner stays on until the dashboard fully reloads
    showTriageModal.value = false    // success → close
  } catch (e: unknown) {
    triageError.value = (e as Error).message || 'Failed to record triage.'  // error → keep modal open
  } finally {
    triageSaving.value = false
  }
}

// ── Lab encounter ────────────────────────────────────────────────────────────
const labForm = reactive({ specimen_type: '', priority: 'routine', notes: '' })
const labSaving = ref(false); const labError = ref(''); const labSuccess = ref('')

const submitLab = async () => {
  labError.value = ''; labSaving.value = true
  try {
    const enc = encByType('LAB')
    if (!enc) { labError.value = 'No laboratory encounter found.'; labSaving.value = false; return }
    const fd = new FormData()
    fd.append('encounter[status]', 'in_progress')
    if (labForm.specimen_type) fd.append('encounter[specimen_type]', labForm.specimen_type)
    fd.append('encounter[priority]', labForm.priority)
    if (labForm.notes) fd.append('encounter[notes]', labForm.notes)
    const patientId = p.value?.uuid ?? uuid.value
    // TODO: confirm endpoint — encounter "start"/update
    await request(`/patients/${patientId}/encounters/${enc.uuid}/start`, { method: 'PATCH', body: fd })
    labSuccess.value = 'Laboratory encounter started.'
    await loadDashboard()
    setTimeout(() => { showLabModal.value = false; labSuccess.value = '' }, 1200)
  } catch (e: unknown) {
    labError.value = (e as Error).message || 'Failed to start laboratory encounter.'
  } finally {
    labSaving.value = false
  }
}

// ── Imaging encounter ──────────────────────────────────────────────────────────
const imagingForm = reactive({ modality: '', body_part: '', priority: 'routine', notes: '' })
const imagingSaving = ref(false); const imagingError = ref(''); const imagingSuccess = ref('')
const imagingModalities = ['X-Ray', 'Ultrasound', 'CT', 'MRI', 'Mammography', 'PET']

const submitImaging = async () => {
  imagingError.value = ''; imagingSaving.value = true
  try {
    const enc = encByType('IMAGING')
    if (!enc) { imagingError.value = 'No imaging encounter found.'; imagingSaving.value = false; return }
    const fd = new FormData()
    fd.append('encounter[status]', 'in_progress')
    if (imagingForm.modality) fd.append('encounter[modality]', imagingForm.modality)
    if (imagingForm.body_part) fd.append('encounter[body_part]', imagingForm.body_part)
    fd.append('encounter[priority]', imagingForm.priority)
    if (imagingForm.notes) fd.append('encounter[notes]', imagingForm.notes)
    const patientId = p.value?.uuid ?? uuid.value
    // TODO: confirm endpoint — encounter "start"/update
    await request(`/patients/${patientId}/encounters/${enc.uuid}/start`, { method: 'PATCH', body: fd })
    imagingSuccess.value = 'Imaging encounter started.'
    await loadDashboard()
    setTimeout(() => { showImagingModal.value = false; imagingSuccess.value = '' }, 1200)
  } catch (e: unknown) {
    imagingError.value = (e as Error).message || 'Failed to start imaging encounter.'
  } finally {
    imagingSaving.value = false
  }
}

// ── Actions dropdown + status pill ───────────────────────────────────────────
const showActions = ref(false)
const statusPillClass = computed(() => {
  switch (treatmentStatus.value) {
    case 'On Treatment': return 'bg-primary-fixed text-primary-on-fixed border border-primary/30'
    case 'Under Treatment': return 'bg-accent-fixed text-accent-on-container border border-accent/30'
    default: return 'bg-secondary-fixed text-secondary-on-fixed border border-secondary/30'
  }
})

// ── Referral (parsed from /patient/show extensions) ───────────────────────
const referral = reactive({ facility: '', clinician: '', date: '', documentUrl: '' })
const referralDocMeta = computed(() => {
  const url = referral.documentUrl
  if (!url) return null
  let name = 'Referral document', ct = ''
  try {
    const q = new URL(url).searchParams
    ct = (q.get('response-content-type') || '').toLowerCase()
    const cd = q.get('response-content-disposition') || ''
    const m = cd.match(/filename="?([^";]+)"?/i)
    if (m?.[1]) name = decodeURIComponent(m[1])
  } catch { /* keep defaults */ }
  const ext = name.split('.').pop()?.toLowerCase() || ''
  let kind: 'image' | 'pdf' | 'other' = 'other'
  if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) kind = 'image'
  else if (ct === 'application/pdf' || ext === 'pdf') kind = 'pdf'
  return { url, name, kind }
})
const showReferralDoc = ref(false)

// ── Edit Patient modal ───────────────────────────────────────────────────────
const showEditModal = ref(false)
const editSaving = ref(false)
const editError = ref('')
const editSuccess = ref('')
const blankEditForm = () => ({
  first_name: '', middle_name: '', last_name: '', preferred_name: '',
  date_of_birth: '', gender: '', gender_identity: '', marital_status: '', nationality: '',
  phone_primary: '', phone_secondary: '', email: '', preferred_contact_method: '',
  address_line1: '', address_line2: '', country_id: '', state_id: '', city_id: '', postal_code: '',
  nok_full_name: '', nok_relationship: '', nok_phone: '', nok_address: '',
})
const editForm = reactive(blankEditForm())

// Reference data for the edit modal (loaded lazily on open)
const countries = ref<any[]>([])
const allStates = ref<any[]>([])
const allCities = ref<any[]>([])
const refLoaded = ref(false)
const loadRefData = async () => {
  if (refLoaded.value) return
  const [c, s, ci] = await Promise.all([
    request<any[]>('/countries'),
    request<any[]>('/states'),
    request<any[]>('/cities?country_alpha2=MW'),
  ])
  if (c) countries.value = c
  if (s) allStates.value = s
  if (ci) allCities.value = ci
  refLoaded.value = true
}
const filteredStates = computed(() =>
  editForm.country_id ? allStates.value.filter(s => s.country_id === Number(editForm.country_id)) : allStates.value)
const filteredCities = computed(() =>
  editForm.state_id ? allCities.value.filter(c => c.state_id === Number(editForm.state_id)) : allCities.value)

watch(() => editForm.country_id, async (v) => {
  editForm.state_id = ''; editForm.city_id = ''
  if (!v) return
  const [s, c] = await Promise.all([
    request<any[]>(`/states?country_id=${v}`),
    request<any[]>(`/cities?country_id=${v}`),
  ])
  if (s) allStates.value = s
  if (c) allCities.value = c
})
watch(() => editForm.state_id, async (v) => {
  editForm.city_id = ''
  if (!v) return
  const c = await request<any[]>(`/cities?state_id=${v}`)
  if (c) allCities.value = c
})

const openEditPatient = async () => {
  showActions.value = false
  editError.value = ''; editSuccess.value = ''
  Object.assign(editForm, blankEditForm())
  // prefill from the data we already have (show + dashboard)
  const given = String((fhirPatient.value as any)?.given ?? '').trim()
  const parts = (given || p.value?.full_name || '').trim().split(/\s+/).filter(Boolean)
  editForm.first_name = parts[0] ?? ''
  editForm.middle_name = parts.length > 2 ? parts.slice(1, -1).join(' ') : ''
  editForm.last_name = String((fhirPatient.value as any)?.family ?? (parts.length > 1 ? parts[parts.length - 1] : ''))
  editForm.preferred_name = p.value?.preferred_name ?? ''
  editForm.date_of_birth = p.value?.date_of_birth ?? ''
  editForm.gender = p.value?.gender ?? ''
  editForm.phone_primary = p.value?.phone_primary ?? String((fhirPatient.value as any)?.phone_primary ?? '')
  editForm.phone_secondary = String((fhirPatient.value as any)?.phone_secondary ?? '')
  editForm.email = String((fhirPatient.value as any)?.email ?? '')
  editForm.nok_full_name = p.value?.nok_full_name ?? ''
  editForm.nok_relationship = p.value?.nok_relationship ?? ''
  editForm.nok_phone = p.value?.nok_phone ?? ''
  showEditModal.value = true
  await loadRefData()
}

const submitEditPatient = async () => {
  editError.value = ''; editSuccess.value = ''
  if (!editForm.first_name || !editForm.last_name || !editForm.date_of_birth || !editForm.gender) {
    editError.value = 'First name, last name, date of birth and gender are required.'
    return
  }
  editSaving.value = true
  try {
    const fd = new FormData()
    fd.append('uuid', p.value?.uuid ?? uuid.value)
    const keys = [
      'first_name', 'middle_name', 'last_name', 'preferred_name', 'date_of_birth', 'gender',
      'gender_identity', 'marital_status', 'nationality', 'phone_primary', 'phone_secondary',
      'email', 'preferred_contact_method', 'address_line1', 'address_line2', 'country_id',
      'state_id', 'city_id', 'postal_code', 'nok_full_name', 'nok_relationship', 'nok_phone', 'nok_address',
    ] as const
    // only append filled fields → avoids wiping values the form couldn't prefill
    keys.forEach(k => { const v = (editForm as any)[k]; if (v !== '' && v != null) fd.append(`patient[${k}]`, String(v)) })
    await request('/patient/update', { method: 'PATCH', body: fd })
    editSuccess.value = 'Patient updated successfully.'
    await loadDashboard()
    setTimeout(() => { showEditModal.value = false; editSuccess.value = '' }, 1200)
  } catch (e: unknown) {
    editError.value = (e as Error).message || 'Failed to update patient.'
  } finally {
    editSaving.value = false
  }
}

// ── Open Triage / Vitals showing existing data ───────────────────────────────
const openTriageExisting = () => {
  showActions.value = false
  triageError.value = ''; triageSuccess.value = ''
  const last = (vh.value?.recent ?? []).find(v => v.triage_level)
  triageForm.triage_level = last?.triage_level ?? activeVisit.value?.triage_level ?? 'P3'
  triageForm.presenting_complaint = last?.presenting_complaint ?? ''
  showTriageModal.value = true
}
const openVitalsExisting = () => {
  showActions.value = false
  vitalsError.value = ''; vitalsSuccess.value = ''
  const v = latestVitals.value
  vitalsForm.temperature = v?.temperature ?? ''
  vitalsForm.blood_pressure_systolic = v?.blood_pressure_systolic ?? ''
  vitalsForm.blood_pressure_diastolic = v?.blood_pressure_diastolic ?? ''
  vitalsForm.pulse_rate = v?.pulse_rate != null ? String(v.pulse_rate) : ''
  vitalsForm.respiratory_rate = v?.respiratory_rate != null ? String(v.respiratory_rate) : ''
  vitalsForm.oxygen_saturation = v?.oxygen_saturation ?? ''
  vitalsForm.weight = v?.weight_kg ?? ''
  vitalsForm.height = v?.height_cm ?? ''
  vitalsForm.pain_score = v?.pain_score ?? ''
  vitalsForm.pain_location = v?.pain_location ?? ''
  vitalsForm.surface_area_bsa = v?.surface_area_bsa ?? ''
  vitalsForm.ecog_score = v?.ecog_score ?? ''
  vitalsForm.notes = v?.notes ?? ''
  showVitalsModal.value = true
}

// allergy chips shown inside clinical modals (safety cue)
const allergyNames = computed(() => (dash.value?.clinical_status?.known_allergies ?? []).map(a => a.name))
</script>

<style scoped>
/* ── Floating action card — slides in from right with bounce spring ── */
@keyframes slideInBounce {
  0% {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }

  70% {
    opacity: 1;
    transform: translateX(-10px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* ── Ambient breathing — subtle scale pulse ── */
@keyframes ambientBreathe {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.015);
  }
}

/* ── Shimmer sweep across the card surface ── */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }

  20% {
    opacity: 0.5;
  }

  50% {
    opacity: 0.5;
  }

  80% {
    opacity: 0;
  }

  100% {
    transform: translateX(200%);
    opacity: 0;
  }
}

.floating-action-card {
  position: fixed;
  top: 5.5rem;
  right: 8.5rem;
  z-index: 50;
  animation: slideInBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.floating-action-card:hover {
  transform: translateY(-4px) scale(1.02);
  transition: transform 0.3s ease;
}

.ambient-loop {
  animation: ambientBreathe 4s ease-in-out infinite;
}

.shimmer-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  width: 50%;
  height: 100%;
  animation: shimmer 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

/* ── Teleport entry transition ── */
.hint-pop-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.hint-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.hint-pop-enter-from {
  opacity: 0;
  transform: translateX(60px) scale(0.92);
}

.hint-pop-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

/* Actions dropdown */
.action-item {
  @apply w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-on-surface text-left hover:bg-primary hover:text-primary transition-colors;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>