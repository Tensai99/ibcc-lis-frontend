<!-- app/pages/customers/index.vue -->
<template>
  <div class="animate-fade-in min-h-full flex flex-col space-y-5">
    <!-- ══ HEADER ─────────────────────────────────────────────────────────
         Title on the left, the primary "Register Customer" action lives
         top-right — the standard, predictable spot for a page action. ──── -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <font-awesome-icon :icon="['fas', 'users']" class="text-primary text-lg" />
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-on-surface leading-tight">Customers Page</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">Search existing customers or register a new one</p>
        </div>
      </div>
      <button v-if="can('customer_registration')" class="btn-primary flex-shrink-0" @click="openModal">
        <font-awesome-icon :icon="['fas', 'user-plus']" /> Register Customer
      </button>
    </div>

    <!-- ══ SEARCH + FILTERS CARD ──────────────────────────────────────────
         Submit-based search: type, then press Enter or tap Search. Filters
         appear once a result set exists, to tame large same-name lists. ── -->
    <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-island p-4 sm:p-5 space-y-4">
      <!-- Search bar -->
      <div class="relative">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-base pointer-events-none" />
        <input v-model="searchQuery" type="text" placeholder="Search by name, customer number, or phone…"
          class="w-full pl-12 pr-28 sm:pr-32 py-3.5 text-sm sm:text-base bg-surface-low border-2 border-transparent rounded-2xl
                 text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:bg-white transition-all" @keyup.enter="runSearch" />
        <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 bg-primary text-white font-bold text-sm
                 px-4 py-2 rounded-xl hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
          :disabled="searching" @click="runSearch">
          <font-awesome-icon v-if="searching" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'magnifying-glass']" />
          <span class="hidden sm:inline">Search</span>
        </button>
      </div>

      <!-- Filters -->
      <div v-if="searched && results.length"
        class="flex flex-wrap items-center gap-2 pt-3 border-t border-outline-variant/20">
        <span class="text-xs font-bold text-on-surface-variant uppercase tracking-wide mr-1">
          <font-awesome-icon :icon="['fas', 'filter']" class="mr-1" /> Filters
        </span>
        <select v-if="genderOptions.length" v-model="filterGender" class="cust-filter">
          <option value="">All genders</option>
          <option v-for="g in genderOptions" :key="g" :value="g" class="capitalize">{{ g }}</option>
        </select>
        <select v-if="categoryOptions.length" v-model="filterCategory" class="cust-filter">
          <option value="">All categories</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <button v-if="filterGender || filterCategory" class="text-xs font-bold text-primary hover:underline ml-1"
          @click="clearFilters">
          Clear filters
        </button>
        <div class="ml-auto flex items-center gap-3">
          <span class="text-xs text-on-surface-variant">
            {{ filteredResults.length }} of {{ total }} result{{ total !== 1 ? 's' : '' }}
          </span>
          <!-- View toggle -->
          <div class="inline-flex items-center rounded-lg bg-surface-low p-0.5 border border-outline-variant/30">
            <button type="button" title="Grid view"
              class="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              :class="viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
              @click="viewMode = 'grid'">
              <font-awesome-icon :icon="['fas', 'table-cells-large']" class="text-xs" />
            </button>
            <button type="button" title="List view"
              class="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              :class="viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
              @click="viewMode = 'list'">
              <font-awesome-icon :icon="['fas', 'list']" class="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <AppAlert v-if="errorMsg" type="error" :title="errorMsg" />

    <!-- ══ LOADING ══ -->
    <SkeletonCardGrid v-if="showSkeleton && viewMode === 'grid'" :count="6" grid-class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" />
    <div v-else-if="showSkeleton" class="rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
      <table class="w-full text-sm min-w-[760px]">
        <thead>
          <tr class="bg-gradient-to-r from-primary/8 to-transparent border-b border-outline-variant/30
                     text-xs font-bold text-on-surface-variant uppercase tracking-wide">
            <th class="text-left font-bold px-5 py-3">Customer</th>
            <th class="text-left font-bold px-4 py-3">Customer No.</th>
            <th class="text-left font-bold px-4 py-3">Gender / Age</th>
            <th class="text-left font-bold px-4 py-3">Phone</th>
          </tr>
        </thead>
        <tbody><SkeletonTableRows :columns="4" :rows="5" /></tbody>
      </table>
    </div>
    <div v-else-if="searching" />

    <!-- ══ PRE-SEARCH STATE ──────────────────────────────────────────────
         Friendly prompt with a secondary register CTA so registration is
         reachable both from the header and from here. ──────────────────── -->
    <div v-else-if="!searched"
      class="rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island py-14 px-6 text-center">
      <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']" class="text-primary text-2xl" />
      </div>
      <h2 class="text-base font-bold text-on-surface">Find a customer</h2>
      <p class="text-sm text-on-surface-variant mt-1 max-w-md mx-auto">
        Type a name, customer number, or phone, then press
        <kbd class="px-1.5 py-0.5 rounded bg-surface-low border border-outline-variant/40 text-xs">Enter</kbd>
        or tap Search.
      </p>
      <div class="flex items-center justify-center gap-4 max-w-xs mx-auto my-6">
        <div class="flex-1 h-px bg-outline-variant/30" />
        <span class="text-xs font-bold text-outline uppercase tracking-widest">or</span>
        <div class="flex-1 h-px bg-outline-variant/30" />
      </div>
      <button class="btn-secondary" @click="openModal">
        <font-awesome-icon :icon="['fas', 'user-plus']" /> Register New Customer
      </button>
    </div>

    <!-- ══ EMPTY RESULT ══ -->
    <div v-else-if="!filteredResults.length"
      class="rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island py-14 px-6 text-center">
      <div class="w-14 h-14 rounded-2xl bg-outline-variant/15 flex items-center justify-center mx-auto mb-3">
        <font-awesome-icon :icon="['fas', 'user-slash']" class="text-2xl text-outline/40" />
      </div>
      <p class="text-sm font-bold text-on-surface-variant">
        No customers found for “{{ activeQuery }}”{{ hasActiveFilters ? ' with the current filters.' : '.' }}
      </p>
      <p class="text-xs text-outline mt-1">Check the spelling, adjust filters, or register a new customer.</p>
      <button class="btn-primary mt-5" @click="openModal">
        <font-awesome-icon :icon="['fas', 'user-plus']" /> Register New Customer
      </button>
    </div>

    <!-- ══ RESULTS (grid / list) ══ -->
    <div v-else class="flex flex-col flex-1 gap-4 min-h-0">

      <!-- ── GRID VIEW (default) ───────────────────────────────────────── -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-2">
        <article v-for="c in pagedResults" :key="c.uuid"
          class="relative pb-9 bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-island hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer group"
          @click="viewCustomer(c.uuid)">
          <!-- Header -->
          <div class="flex items-start gap-4 border-b border-outline-variant/30 pb-4 mb-4">
            <div
              class="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
              <img v-if="c.photo && !c.photoFailed" :src="c.photo" :alt="c.name" class="w-full h-full object-cover"
                @error="c.photoFailed = true" />
              <font-awesome-icon v-else :icon="['fas', 'user']" class="text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{{ c.name }}
              </h4>
              <p class="text-xs text-on-surface-variant truncate mb-2">{{ c.email || '—' }}</p>
            </div>
          </div>
          <!-- Detail rows -->
          <dl class="grid grid-cols-2 gap-y-3 text-sm">
            <dt class="text-on-surface-variant">Customer No.</dt>
            <dd class="text-right">
              <span class="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{{ c.no || '—'
              }}</span>
            </dd>
            <dt class="text-on-surface-variant">Gender / Age</dt>
            <dd class="text-right font-bold text-on-surface capitalize">{{ c.gender || '—' }}<span v-if="c.dob">, {{
              calcAge(c.dob) }}y</span></dd>
            <dt class="text-on-surface-variant">Phone</dt>
            <dd class="text-right font-bold text-on-surface truncate">{{ c.phone || '—' }}</dd>
            <template v-if="categoryOptions.length">
              <dt class="text-on-surface-variant self-center">Category</dt>
              <dd class="text-right">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed/40 text-primary">{{
                  c.category || '—' }}</span>
              </dd>
            </template>
          </dl>
          <!-- Floating action — same destination as the row -->
          <button type="button" title="View customer"
            class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-container hover:scale-110 transition-all"
            @click.stop="viewCustomer(c.uuid)">
            <font-awesome-icon :icon="['fas', 'ellipsis']" class="text-sm" />
          </button>
        </article>
      </div>

      <!-- ── LIST / TABLE VIEW ─────────────────────────────────────────── -->
      <div v-else class="rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[760px]">
            <thead>
              <tr class="bg-gradient-to-r from-primary/8 to-transparent border-b border-outline-variant/30
                     text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                <th class="text-left font-bold px-5 py-3">Customer</th>
                <th class="text-left font-bold px-4 py-3">Customer No.</th>
                <th class="text-left font-bold px-4 py-3">Gender / Age</th>
                <th class="text-left font-bold px-4 py-3">Phone</th>
                <th v-if="categoryOptions.length" class="text-left font-bold px-4 py-3">Category</th>
                <th class="text-right font-bold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/20">
              <tr v-for="c in pagedResults" :key="c.uuid"
                class="hover:bg-primary/5 transition-colors cursor-pointer group" @click="viewCustomer(c.uuid)">
                <td class="px-5 py-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img v-if="c.photo && !c.photoFailed" :src="c.photo" :alt="c.name"
                        class="w-full h-full object-cover" @error="c.photoFailed = true" />
                      <font-awesome-icon v-else :icon="['fas', 'user']" class="text-primary text-sm" />
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{{ c.name
                      }}
                      </p>
                      <p class="text-xs text-on-surface-variant truncate">{{ c.email || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit inline-block">{{
                      c.no || '—' }}</span>
                </td>
                <td class="px-4 py-3 capitalize text-on-surface">
                  {{ c.gender || '—' }}<span v-if="c.dob">, {{ calcAge(c.dob) }}y</span>
                </td>
                <td class="px-4 py-3 text-on-surface" @click.stop>
                  <a v-if="c.phone" :href="`tel:${c.phone}`" class="hover:text-primary transition-colors">{{ c.phone
                  }}</a>
                  <span v-else>—</span>
                </td>
                <td v-if="categoryOptions.length" class="px-4 py-3 text-on-surface">{{ c.category || '—' }}</td>
                <td class="px-5 py-3" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <button class="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="View customer" @click="viewCustomer(c.uuid)">
                      <font-awesome-icon :icon="['fas', 'eye']" class="text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── SHARED PAGINATION (both views) ────────────────────────────── -->
      <div
        class="mt-auto rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <p class="text-xs text-on-surface-variant">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ filteredResults.length }}
          <span v-if="filteredResults.length !== total">(filtered from {{ total }})</span>
        </p>
        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button class="page-btn" :disabled="currentPage === 1" title="First" @click="currentPage = 1">
            <font-awesome-icon :icon="['fas', 'angles-left']" class="text-xs" />
          </button>
          <button class="page-btn" :disabled="currentPage === 1" title="Previous" @click="currentPage--">
            <font-awesome-icon :icon="['fas', 'angle-left']" class="text-xs" />
          </button>
          <button v-for="n in pageNumbers" :key="n" class="page-btn"
            :class="n === currentPage ? 'bg-primary text-white border-primary' : ''" @click="currentPage = n">
            {{ n }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" title="Next" @click="currentPage++">
            <font-awesome-icon :icon="['fas', 'angle-right']" class="text-xs" />
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" title="Last"
            @click="currentPage = totalPages">
            <font-awesome-icon :icon="['fas', 'angles-right']" class="text-xs" />
          </button>
        </div>
      </div>

    </div>

  </div>
  <!-- ══ REGISTER CUSTOMER MODAL (WIZARD) ═════════════════════════════════ -->
  <Modal v-model="showModal" title="Register Customer" subtitle="Record administrative data for this walk-in visitor"
    size="lg" :class="entryMode === 'manual' ? 'max-w-[80%]' : 'max-w-2xl'">
    <div class="space-y-5" @click="closeAllDrops">

      <!-- ░░ ENTRY METHOD — passport/ID scan or manual entry ░░ -->
      <div v-if="entryMode === 'choose'" class="min-h-[240px]">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button type="button"
            class="text-left p-5 rounded-2xl border-2 border-outline-variant/40 hover:border-primary hover:bg-primary/5 transition-all group"
            @click="chooseScan">
            <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <font-awesome-icon :icon="['fas', 'id-card']" class="text-primary text-lg" />
            </div>
            <p class="font-bold text-on-surface">Scan Passport / National ID</p>
            <p class="text-xs text-on-surface-variant mt-1">Capture the document with the camera; we read the QR/barcode and the machine-readable zone, then pre-fill the form.</p>
          </button>
          <button type="button"
            class="text-left p-5 rounded-2xl border-2 border-outline-variant/40 hover:border-primary hover:bg-primary/5 transition-all group"
            @click="chooseManual">
            <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <font-awesome-icon :icon="['fas', 'keyboard']" class="text-primary text-lg" />
            </div>
            <p class="font-bold text-on-surface">Manual Entry</p>
            <p class="text-xs text-on-surface-variant mt-1">Type the customer's details directly through the standard step-by-step wizard.</p>
          </button>
        </div>
        <div class="flex justify-end mt-4">
          <button class="text-sm font-bold text-on-surface-variant hover:text-on-surface px-3 py-2" @click="showModal = false">Cancel</button>
        </div>
      </div>

      <!-- ░░ SCAN PATH ░░ -->
      <div v-else-if="entryMode === 'scan'">
        <ClientOnly>
          <IdScanner :categories="categories" @scanned="onIdScanned" @cancel="chooseManual" />
        </ClientOnly>
      </div>

      <!-- ░░ MANUAL PATH (existing wizard) ░░ -->
      <template v-else>

      <!-- Scanned-document banner -->
      <div v-if="idDocumentation" class="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
        <img v-if="idDocPreview" :src="idDocPreview" class="w-12 h-12 rounded-lg object-cover border border-primary/30" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-on-surface">ID document captured</p>
          <p class="text-xs text-on-surface-variant">Saved with the record as identification documentation.</p>
        </div>
        <button type="button" class="text-error hover:opacity-70 transition-opacity p-1" title="Remove" @click="clearIdDocumentation">
          <font-awesome-icon :icon="['fas', 'trash']" class="text-sm" />
        </button>
      </div>

      <!-- ── STEPPER ──────────────────────────────────────────────────────
           Compact icon nodes joined by a progress connector. Completed
           steps show a check, the active step is enlarged, upcoming steps
           are muted. Nodes are clickable for quick navigation. ──────────── -->
      <div>
        <div class="flex items-center">
          <template v-for="(s, i) in steps" :key="s.id">
            <button type="button"
              class="flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 flex-shrink-0"
              :class="stepCircleClass(s.id)" :title="s.label" @click="goToStep(s.id)">
              <font-awesome-icon v-if="s.id < currentStep" :icon="['fas', 'check']" />
              <font-awesome-icon v-else :icon="['fas', s.icon]" />
            </button>
            <!-- Connector between nodes -->
            <div v-if="i < steps.length - 1" class="flex-1 h-0.5 mx-1.5 rounded-full transition-colors duration-300"
              :class="s.id < currentStep ? 'bg-primary' : 'bg-outline-variant/30'" />
          </template>
        </div>

        <!-- Active-step context -->
        <div class="mt-3">
          <p class="text-[11px] font-bold uppercase tracking-widest text-primary">Step {{ currentStep }} of {{
            steps.length }}
          </p>
          <h3 class="text-base font-bold text-on-surface mt-0.5">{{ activeStep.label }}</h3>
          <p class="text-xs text-on-surface-variant">{{ activeStep.hint }}</p>
        </div>
      </div>

      <!-- Inline error (validation + API) -->
      <AppAlert v-if="formError" type="error" :title="formError" />

      <!-- ── STEP PANELS ──────────────────────────────────────────────────
           One panel visible at a time; min-height keeps the modal stable
           between steps. mode="out-in" gives a clean slide/fade swap. ───── -->
      <Transition name="step" mode="out-in">

        <!-- ░░ STEP 1 · CLASSIFICATION ░░ -->
        <div v-if="currentStep === 1" key="step-1" class="min-h-[240px]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Category combobox -->
            <div class="sm:col-span-2 relative" @click.stop>
              <label class="cust-label">Customer Category <span class="text-error">*</span></label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'tag']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="categorySearch" class="cust-input has-icon has-caret" placeholder="Search category…"
                  autocomplete="off" @focus="showCategoryDrop = true" @input="showCategoryDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showCategoryDrop && filteredCategories.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-48 overflow-y-auto">
                  <button v-for="cat in filteredCategories" :key="cat.id"
                    class="w-full text-left px-4 py-2.5 hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectCategory(cat)">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold">{{ cat.name }}</span>
                      <font-awesome-icon v-if="cat.accept_insurance" :icon="['fas', 'shield-halved']"
                        class="text-green-500 text-xs ml-auto" />
                    </div>
                    <p class="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{{ cat.description }}</p>
                  </button>
                </div>
              </Transition>
            </div>
            <!-- ID Type combobox -->
            <div class="relative" @click.stop>
              <label class="cust-label">ID Type <span class="text-error">*</span></label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'id-card']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="idTypeSearch" class="cust-input has-icon has-caret" placeholder="Search ID type…"
                  autocomplete="off" @focus="showIdTypeDrop = true" @input="showIdTypeDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showIdTypeDrop && filteredIdTypes.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="t in filteredIdTypes" :key="t.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectIdType(t)">{{ t.name }}</button>
                </div>
              </Transition>
            </div>
            <div><label class="cust-label">ID Number <span class="text-error">*</span></label>
              <input v-model="form.identification_number" class="cust-input" placeholder="e.g. RTD75TV" />
            </div>
            <div class="sm:col-span-2">
              <label class="cust-label">ID Expiry Date <span class="text-error">*</span></label>

              <VueDatePicker v-model="form.identification_expiry_date" :enable-time-picker="false" :clearable="false"
                hide-input-icon auto-apply format="yyyy-MM-dd" :day-names="['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']"
                week-start="0">
                <!-- Custom input trigger -->
                <template #trigger>
                  <div class="cust-input cursor-pointer flex items-center justify-between">
                    <span :class="form.identification_expiry_date ? 'text-on-surface' : 'text-outline'">
                      {{ form.identification_expiry_date
                        ? new Date(form.identification_expiry_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month:
                            'short', year: 'numeric'
                        })
                        : 'Select date' }}
                    </span>
                    <font-awesome-icon icon="calendar" class="text-on-surface-variant text-sm" />
                  </div>
                </template>

                <!-- Custom action buttons -->
                <template #action-buttons>
                  <div
                    class="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low px-lg py-md w-full">
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95"
                      @click="$emit('close-picker')">
                      Cancel
                    </button>
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium bg-primary text-white hover:opacity-90 transition-all active:scale-95"
                      @click="$emit('select-date')">
                      Apply Selection
                    </button>
                  </div>
                </template>
              </VueDatePicker>
            </div>
          </div>
        </div>

        <!-- ░░ STEP 2 · IDENTITY & BASICS ░░ -->
        <div v-else-if="currentStep === 2" key="step-2" class="min-h-[240px] space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="cust-label">First Name <span class="text-error">*</span></label><input
                v-model="form.first_name" class="cust-input" placeholder="e.g. Grace" /></div>
            <div><label class="cust-label">Middle Name</label><input v-model="form.middle_name" class="cust-input"
                placeholder="Optional" /></div>
            <div><label class="cust-label">Last Name <span class="text-error">*</span></label><input
                v-model="form.last_name" class="cust-input" placeholder="e.g. Banda" /></div>
            <div><label class="cust-label">Preferred Name</label><input v-model="form.preferred_name" class="cust-input"
                placeholder="What they go by" /></div>
            <div>
              <label class="cust-label">Date of Birth <span class="text-error">*</span></label>

              <VueDatePicker v-model="form.date_of_birth" :enable-time-picker="false" :clearable="false" hide-input-icon
                auto-apply format="yyyy-MM-dd" :day-names="['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" week-start="0">
                <!-- Custom input trigger -->
                <template #trigger>
                  <div class="cust-input cursor-pointer flex items-center justify-between">
                    <span :class="form.date_of_birth ? 'text-on-surface' : 'text-outline'">
                      {{ form.date_of_birth
                        ? new Date(form.date_of_birth).toLocaleDateString('en-GB', {
                          day: '2-digit', month:
                            'short', year: 'numeric'
                        })
                        : 'Select date' }}
                    </span>
                    <font-awesome-icon icon="calendar" class="text-on-surface-variant text-sm" />
                  </div>
                </template>

                <!-- Custom action buttons -->
                <template #action-buttons>
                  <div
                    class="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low px-lg py-md w-full">
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95"
                      @click="$emit('close-picker')">
                      Cancel
                    </button>
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium bg-primary text-white hover:opacity-90 transition-all active:scale-95"
                      @click="$emit('select-date')">
                      Apply Selection
                    </button>
                  </div>
                </template>
              </VueDatePicker>
            </div>
            <div>
              <label class="cust-label">Gender <span class="text-error">*</span></label>
              <select v-model="form.gender" class="cust-input appearance-none cursor-pointer">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div><label class="cust-label">Gender Identity</label><input v-model="form.gender_identity"
                class="cust-input" placeholder="Optional — self-described" /></div>
            <!-- Marital status combobox -->
            <div class="relative" @click.stop>
              <label class="cust-label">Marital Status <span class="text-error">*</span></label>
              <div class="relative">
                <input v-model="maritalSearch" class="cust-input has-caret" placeholder="Search marital status…"
                  autocomplete="off" @focus="showMaritalDrop = true" @input="showMaritalDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showMaritalDrop && filteredMarital.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="m in filteredMarital" :key="m"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectMarital(m)">{{ m }}</button>
                </div>
              </Transition>
            </div>
            <!-- Nationality combobox -->
            <div class="relative" @click.stop>
              <label class="cust-label">Nationality <span class="text-error">*</span></label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'flag']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="nationalitySearch" class="cust-input has-icon has-caret"
                  placeholder="Search nationality…" autocomplete="off" @focus="showNationalityDrop = true"
                  @input="showNationalityDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showNationalityDrop && filteredNationalities.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="country in filteredNationalities.slice(0, 20)" :key="country.id" type="button"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectNationality(country)">{{ country.nationality }}</button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Profile Photo (optional) -->
          <div class="bg-surface-low rounded-xl p-4 border border-outline-variant/20">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-xs font-bold text-on-surface">Profile Photo <span
                    class="text-outline font-normal">(optional)</span></p>
                <p class="text-xs text-on-surface-variant mt-0.5">Take a photo using the webcam or upload an image</p>
              </div>
              <button type="button"
                class="inline-flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors"
                @click="openWebcam">
                <font-awesome-icon :icon="['fas', 'camera']" />
                {{ profilePhoto ? 'Retake Photo' : 'Take Photo' }}
              </button>
            </div>
            <!-- Preview -->
            <div v-if="profilePhoto" class="flex items-center gap-3">
              <img :src="profilePhotoPreview!"
                class="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-on-surface truncate">{{ profilePhoto.name }}</p>
                <p class="text-xs text-on-surface-variant">{{ (profilePhoto.size / 1024).toFixed(0) }} KB</p>
              </div>
              <button type="button" class="text-error hover:opacity-70 transition-opacity p-1"
                @click="clearProfilePhoto">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-sm" />
              </button>
            </div>
            <div v-else class="flex items-center gap-3 text-outline">
              <div class="w-16 h-16 rounded-full bg-outline-variant/20 flex items-center justify-center flex-shrink-0">
                <font-awesome-icon :icon="['fas', 'user']" class="text-2xl text-outline/40" />
              </div>
              <p class="text-xs text-outline">No photo yet — click "Take Photo" to capture via webcam</p>
            </div>
          </div>

          <!-- Legal-name tip (relevant while capturing identity) -->
          <div class="bg-tertiary-fixed/30 border border-tertiary-fixed p-4 rounded-xl flex gap-3 items-start">
            <font-awesome-icon :icon="['fas', 'circle-info']" class="text-tertiary text-sm flex-shrink-0 mt-0.5" />
            <p class="text-sm text-on-tertiary-fixed-variant leading-snug">
              Ensure the legal name matches official government identification for billing and insurance verification
              purposes.
            </p>
          </div>
        </div>

        <!-- ░░ STEP 3 · CONTACT & ADDRESS ░░ -->
        <div v-else-if="currentStep === 3" key="step-3" class="min-h-[240px]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="cust-label">Primary Phone <span class="text-error">*</span></label>
              <div class="relative"><font-awesome-icon :icon="['fas', 'phone']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none" /><input
                  v-model="form.phone_primary" type="tel" class="cust-input has-icon" placeholder="+265 99 000 0000" />
              </div>
            </div>
            <div>
              <label class="cust-label">Secondary Phone</label>
              <div class="relative"><font-awesome-icon :icon="['fas', 'phone']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none" /><input
                  v-model="form.phone_secondary" type="tel" class="cust-input has-icon" placeholder="Optional" /></div>
            </div>
            <div><label class="cust-label">Email</label><input v-model="form.email" type="email" class="cust-input"
                placeholder="Optional" /></div>
            <!-- Preferred contact combobox -->
            <div class="relative" @click.stop>
              <label class="cust-label">Preferred Contact</label>
              <div class="relative">
                <input v-model="contactSearch" class="cust-input has-caret" placeholder="Search method…"
                  autocomplete="off" @focus="showContactDrop = true" @input="showContactDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showContactDrop && filteredContact.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 overflow-hidden">
                  <button v-for="c in filteredContact" :key="c"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectContact(c)">{{ c }}</button>
                </div>
              </Transition>
            </div>
            <div class="sm:col-span-2"><label class="cust-label">Address Line 1</label><input
                v-model="form.address_line1" class="cust-input" placeholder="Street, area, house number" /></div>
            <div class="sm:col-span-2"><label class="cust-label">Address Line 2</label><input
                v-model="form.address_line2" class="cust-input" placeholder="Landmark or additional detail" /></div>
            <!-- Country combobox -->
            <div class="relative" @click.stop>
              <label class="cust-label">Country <span class="text-error">*</span></label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'globe']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="countrySearch" class="cust-input has-icon has-caret" placeholder="Search country…"
                  autocomplete="off" @focus="showCountryDrop = true" @input="showCountryDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showCountryDrop && filteredCountries.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="country in filteredCountries.slice(0, 20)" :key="country.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectCountry(country)">{{ country.fhir_coding.display }}</button>
                </div>
              </Transition>
            </div>
            <!-- City combobox -->
            <div class="relative" @click.stop>
              <label class="cust-label">City / Town <span class="text-error">*</span></label>
              <div class="relative">
                <font-awesome-icon :icon="['fas', 'city']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
                <input v-model="citySearch" class="cust-input has-icon has-caret"
                  :class="!form.country_id ? 'opacity-60 cursor-not-allowed' : ''" :disabled="!form.country_id"
                  placeholder="Search city…" autocomplete="off" @focus="showCityDrop = true"
                  @input="showCityDrop = true" />
                <font-awesome-icon :icon="['fas', 'chevron-down']"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
              </div>
              <Transition name="dropdown">
                <div v-if="showCityDrop && filteredCities.length"
                  class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-outline-variant/40 shadow-glass z-50 max-h-44 overflow-y-auto">
                  <button v-for="city in filteredCities.slice(0, 20)" :key="city.id"
                    class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/8 hover:text-primary transition-colors"
                    @click="selectCity(city)">{{ city.name }}</button>
                </div>
              </Transition>
            </div>
            <div><label class="cust-label">Postal Code</label><input v-model="form.postal_code" class="cust-input"
                placeholder="Optional" /></div>
          </div>
        </div>

        <!-- ░░ STEP 4 · SOCIO-DEMOGRAPHICS ░░ -->
        <div v-else-if="currentStep === 4" key="step-4" class="min-h-[240px]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="cust-label">Occupation <span class="text-error">*</span></label>
              <input v-model="form.occupation" class="cust-input" placeholder="e.g. Teacher" />
            </div>
            <div>
              <label class="cust-label">Education Level <span class="text-error">*</span></label>
              <select v-model="form.education_level" class="cust-input appearance-none cursor-pointer">
                <option value="">Select level</option>
                <option value="none">None</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="tertiary">Tertiary</option>
                <option value="postgraduate">Postgraduate</option>
              </select>
            </div>
            <div><label class="cust-label">Religion <span class="text-error">*</span></label>
              <input v-model="form.religion" class="cust-input" placeholder="Optional" />
            </div>
            <div><label class="cust-label">Ethnicity <span class="text-error">*</span></label>
              <input v-model="form.ethnicity" class="cust-input" placeholder="Optional" />
            </div>
          </div>
        </div>

        <!-- ░░ STEP 5 · NEXT OF KIN ░░ -->
        <div v-else-if="currentStep === 5" key="step-5" class="min-h-[240px]">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="cust-label">Full Name <span class="text-error">*</span></label>
              <input v-model="form.nok_full_name" class="cust-input" placeholder="e.g. James Banda" />
            </div>
            <div>
              <label class="cust-label">Relationship <span class="text-error">*</span></label>
              <select v-model="form.nok_relationship" class="cust-input appearance-none cursor-pointer">
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="guardian">Guardian</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="cust-label">Phone <span class="text-error">*</span></label>
              <div class="relative"><font-awesome-icon :icon="['fas', 'phone']"
                  class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none" /><input
                  v-model="form.nok_phone" type="tel" class="cust-input has-icon" placeholder="+265 99 000 0000" />
              </div>
            </div>
            <div class="sm:col-span-2"><label class="cust-label">Address <span class="text-error">*</span></label>
              <input v-model="form.nok_address" class="cust-input" placeholder="Next of kin address" />
            </div>
          </div>
        </div>

        <!-- ░░ STEP 6 · REFERRAL ░░ -->
        <div v-else key="step-6" class="min-h-[240px] space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="cust-label">Referring Facility <span class="text-error">*</span></label>
              <input v-model="form.referring_facility" class="cust-input" placeholder="e.g. Zomba Central Hospital" />
            </div>
            <div><label class="cust-label">Referring Clinician <span class="text-error">*</span></label>
              <input v-model="form.referring_clinician" class="cust-input" placeholder="e.g. Dr. Phiri" />
            </div>
            <div>
              <label class="cust-label">Referral Date <span class="text-error">*</span></label>

              <VueDatePicker v-model="form.referral_date" :enable-time-picker="false" :clearable="false" hide-input-icon
                auto-apply format="yyyy-MM-dd" :day-names="['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" week-start="0">
                <!-- Custom input trigger -->
                <template #trigger>
                  <div class="cust-input cursor-pointer flex items-center justify-between">
                    <span :class="form.referral_date ? 'text-on-surface' : 'text-outline'">
                      {{ form.referral_date
                        ? new Date(form.referral_date).toLocaleDateString('en-GB', {
                          day: '2-digit', month:
                            'short', year: 'numeric'
                        })
                        : 'Select date' }}
                    </span>
                    <font-awesome-icon icon="calendar" class="text-on-surface-variant text-sm" />
                  </div>
                </template>

                <!-- Custom action buttons -->
                <template #action-buttons>
                  <div
                    class="flex items-center justify-end gap-md border-t border-outline-variant bg-surface-container-low px-lg py-md w-full">
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95"
                      @click="$emit('close-picker')">
                      Cancel
                    </button>
                    <button type="button"
                      class="px-lg py-2 h-10 rounded-lg text-[12px] leading-[16px] font-medium bg-primary text-white hover:opacity-90 transition-all active:scale-95"
                      @click="$emit('select-date')">
                      Apply Selection
                    </button>
                  </div>
                </template>
              </VueDatePicker>
            </div>
            <div class="sm:col-span-2">
              <label class="cust-label">Referral Reason</label>
              <textarea v-model="form.referral_reason" class="cust-input resize-none" rows="3"
                placeholder="e.g. Requires specialist review for hypertension management" />
            </div>
          </div>

          <!-- Referral Documents upload -->
          <div class="bg-surface-low rounded-xl p-4 border border-outline-variant/20">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-xs font-bold text-on-surface">Referral Documents <span
                    class="text-outline font-normal">(optional)</span></p>
                <p class="text-xs text-on-surface-variant mt-0.5">Upload referral letter or supporting documents (image
                  or
                  PDF)</p>
              </div>
              <label
                class="inline-flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                <font-awesome-icon :icon="['fas', 'paperclip']" />
                {{ referralDocuments ? 'Replace' : 'Attach File' }}
                <input ref="referralDocInput" type="file" accept="image/*,application/pdf" class="hidden"
                  @change="onReferralDocChange" />
              </label>
            </div>
            <div v-if="referralDocuments" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="referralDocuments.type === 'application/pdf' ? 'bg-red-50' : 'bg-blue-50'">
                <font-awesome-icon
                  :icon="['fas', referralDocuments.type === 'application/pdf' ? 'file-pdf' : 'file-image']"
                  :class="referralDocuments.type === 'application/pdf' ? 'text-red-500' : 'text-blue-500'"
                  class="text-lg" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-on-surface truncate">{{ referralDocuments.name }}</p>
                <p class="text-xs text-on-surface-variant">{{ (referralDocuments.size / 1024).toFixed(0) }} KB</p>
              </div>
              <button type="button" class="text-error hover:opacity-70 transition-opacity p-1"
                @click="clearReferralDoc">
                <font-awesome-icon :icon="['fas', 'trash']" class="text-sm" />
              </button>
            </div>
            <div v-else class="flex items-center gap-2 text-outline">
              <font-awesome-icon :icon="['fas', 'folder-open']" class="text-outline/40" />
              <p class="text-xs text-outline">No document attached</p>
            </div>
          </div>

          <!-- Final-step summary cue -->
          <div class="mt-4 bg-green-50 border border-green-200 p-4 rounded-xl flex gap-3 items-start">
            <font-awesome-icon :icon="['fas', 'circle-check']" class="text-green-600 text-sm flex-shrink-0 mt-0.5" />
            <p class="text-sm text-green-800 leading-snug">
              You're on the last step. Review the details, then save to create the customer record.
            </p>
          </div>
        </div>

      </Transition>
      </template>
    </div>

    <!-- ── WIZARD NAVIGATION ──────────────────────────────────────────────
         Back/Cancel on the left, Next/Save on the right. Save only appears
         on the final step. ──────────────────────────────────────────────── -->
    <template #footer>
      <div v-if="entryMode === 'manual'" class="flex items-center justify-between w-full gap-3">
        <!-- Back (or Cancel on the first step) -->
        <button v-if="currentStep > 1"
          class="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2 rounded-xl"
          @click="prevStep">
          <font-awesome-icon :icon="['fas', 'arrow-left']" />Back
        </button>
        <button v-else
          class="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
          @click="showModal = false">
          Cancel
        </button>

        <!-- Next (steps 1–5) -->
        <button v-if="currentStep < steps.length"
          class="flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
          style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" @click="nextStep">
          Next<font-awesome-icon :icon="['fas', 'arrow-right']" />
        </button>
        <!-- Save (final step) -->
        <button v-else
          class="flex items-center gap-2 bg-primary hover:bg-primary-container text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60"
          style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" :disabled="saving" @click="submitCustomer">
          <font-awesome-icon v-if="saving" :icon="['fas', 'spinner']" spin />
          <font-awesome-icon v-else :icon="['fas', 'floppy-disk']" />
          {{ saving ? 'Saving…' : 'Save Customer' }}
        </button>
      </div>
    </template>
  </Modal>

  <!-- ══ WEBCAM CAPTURE MODAL ═════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div v-if="showWebcam"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="closeWebcam">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <font-awesome-icon :icon="['fas', 'camera']" class="text-primary text-sm" />
              </div>
              <div>
                <p class="text-sm font-bold text-on-surface">Capture Profile Photo</p>
                <p class="text-xs text-on-surface-variant">Position the customer's face in the frame</p>
              </div>
            </div>
            <button type="button"
              class="text-outline hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-low"
              @click="closeWebcam">
              <font-awesome-icon :icon="['fas', 'xmark']" class="text-base" />
            </button>
          </div>

          <!-- Camera view / preview -->
          <div class="relative bg-black aspect-[4/3] flex items-center justify-center">
            <!-- Live feed -->
            <video v-show="!webcamCaptured" ref="webcamVideo" autoplay playsinline muted
              class="w-full h-full object-cover" />
            <!-- Face guide overlay -->
            <div v-if="!webcamCaptured" class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-40 h-48 rounded-full border-2 border-white/40 border-dashed" />
            </div>
            <!-- Captured preview -->
            <canvas v-show="webcamCaptured" ref="webcamCanvas" class="w-full h-full object-cover" />
            <!-- Camera init loader -->
            <div v-if="webcamLoading"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <font-awesome-icon :icon="['fas', 'spinner']" spin class="text-white text-2xl" />
              <p class="text-white text-sm font-medium">Starting camera…</p>
            </div>
            <!-- Error state -->
            <div v-if="webcamError"
              class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
              <font-awesome-icon :icon="['fas', 'camera-slash']" class="text-red-400 text-3xl" />
              <p class="text-white text-sm font-semibold">Camera unavailable</p>
              <p class="text-white/60 text-xs">{{ webcamError }}</p>
            </div>
          </div>

          <!-- Controls -->
          <div class="px-5 py-4 flex items-center justify-between gap-3 border-t border-outline-variant/20">
            <button v-if="!webcamCaptured" type="button"
              class="text-sm text-on-surface-variant hover:text-on-surface font-medium px-3 py-2 rounded-xl hover:bg-surface-low transition-colors"
              @click="closeWebcam">Cancel</button>
            <button v-else type="button"
              class="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-xl hover:bg-surface-low transition-colors"
              @click="webcamRetake">
              <font-awesome-icon :icon="['fas', 'rotate-left']" />Retake
            </button>

            <button v-if="!webcamCaptured" type="button"
              class="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
              :disabled="webcamLoading || !!webcamError" @click="webcamSnap">
              <font-awesome-icon :icon="['fas', 'circle']" class="text-red-300" />Capture
            </button>
            <button v-else type="button"
              class="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-95"
              @click="webcamConfirm">
              <font-awesome-icon :icon="['fas', 'check']" />Use this photo
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import type { ParsedIdentity } from '~/composables/useDocumentParser'

// ── Types ──────────────────────────────────────────────────────────────────
interface Country { id: number; name: string; alpha2: string; alpha3: string; numeric_code: string; phone_code: string; nationality: string; fhir_coding: { display: string } }
interface State { id: number; name: string; country_id: number }
interface City { id: number; name: string; state_id: number }
interface Category { id: number; uuid: string; name: string; description: string; accept_insurance: boolean }
interface IdType { id: number; uuid: string; name: string; description: string }
interface CustomerRow {
  uuid: string; name: string; no: string; phone: string; email: string
  gender: string; dob: string; category: string; photo: string; photoFailed?: boolean
}

const { can } = usePermission()
const { request } = useApi()
const router = useRouter()

onMounted(() => {
  if (!can('customer_view')) router.push('/dashboard')
  loadReferenceData()
})

// ── Search state ─────────────────────────────────────────────────────────────
const searchQuery = ref('')          // live input value
const activeQuery = ref('')          // last submitted query
const searched = ref(false)       // whether a search has been run
const searching = ref(false)       // loading flag for the spinner
const { showSkeleton } = useDelayedLoading(searching)
const errorMsg = ref('')
const results = ref<CustomerRow[]>([])
const total = ref(0)

// ── Filters ──────────────────────────────────────────────────────────────────
const filterGender = ref('')
const filterCategory = ref('')
const hasActiveFilters = computed(() => !!(filterGender.value || filterCategory.value))

const genderOptions = computed(() => uniq(results.value.map(r => r.gender)))
const categoryOptions = computed(() => uniq(results.value.map(r => r.category)))

const clearFilters = () => { filterGender.value = ''; filterCategory.value = '' }

// ── Pagination ───────────────────────────────────────────────────────────────
const pageSize = 10
const currentPage = ref(1)
const viewMode = ref<'grid' | 'list'>('grid')

const filteredResults = computed(() =>
  results.value.filter(r =>
    (!filterGender.value || r.gender === filterGender.value) &&
    (!filterCategory.value || r.category === filterCategory.value),
  ),
)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredResults.value.length / pageSize)))
const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredResults.value.slice(start, start + pageSize)
})
const rangeStart = computed(() => (filteredResults.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize, filteredResults.value.length))

// Windowed page numbers (max 5 around current)
const pageNumbers = computed(() => {
  const max = totalPages.value
  const window = 5
  let start = Math.max(1, currentPage.value - Math.floor(window / 2))
  const end = Math.min(max, start + window - 1)
  start = Math.max(1, end - window + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

watch([filterGender, filterCategory], () => { currentPage.value = 1 })
watch(totalPages, (max) => { if (currentPage.value > max) currentPage.value = max })

// ── FHIR parsing helpers ──────────────────────────────────────────────────────
const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort()

const telecomBy = (tel: any[] = [], system: string) =>
  tel.find(t => t?.system === system)?.value ?? ''

const extensionBy = (ext: any[] = [], suffix: string) => {
  const e = ext.find(x => typeof x?.url === 'string' && x.url.endsWith(suffix))
  if (!e) return ''
  return e.valueString ?? e.valueBoolean ?? e.valueDate ?? ''
}

const parseFhirResults = (bundle: any): CustomerRow[] => {
  const entries = (bundle?.entry as any[] | undefined) ?? []
  return entries.map((e: any) => {
    const r = e?.resource ?? {}
    const official = (r.name ?? []).find((n: any) => n.use === 'official') ?? r.name?.[0] ?? {}
    const name = official.text
      || [official.given?.join(' '), official.family].filter(Boolean).join(' ')
      || r.uuid
    const noId = (r.identifier ?? []).find((i: any) =>
      i?.type?.text === 'Customer Number' || i?.type?.coding?.some((c: any) => c.code === 'MR'))
    return {
      uuid: r.uuid ?? r.id ?? '',
      name,
      no: noId?.value ?? '',
      phone: telecomBy(r.telecom, 'phone'),
      email: telecomBy(r.telecom, 'email'),
      gender: r.gender ?? '',
      dob: r.birthDate ?? '',
      category: String(extensionBy(r.extension, 'customer-category') || ''),
      photo: r.profile_photo ?? '',
    }
  })
}

// ── Run search (icon click / Enter) ──────────────────────────────────────────
const runSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) return
  errorMsg.value = ''
  searching.value = true
  activeQuery.value = q
  currentPage.value = 1
  clearFilters()
  try {
    const data = await request<Record<string, unknown>>(`/customers/search?q=${encodeURIComponent(q)}`)
    searched.value = true
    if (data && (data as any).resourceType === 'Bundle') {
      results.value = parseFhirResults(data)
      total.value = (data as any).total ?? results.value.length
    } else {
      results.value = []
      total.value = 0
    }
  } catch (e: any) {
    errorMsg.value = e?.message || 'Search failed. Please try again.'
    results.value = []
    total.value = 0
    searched.value = true
  } finally {
    searching.value = false
  }
}

const viewCustomer = (uuid: string) => { if (uuid) router.push(`/customers/${uuid}`) }

// ── Reference data ─────────────────────────────────────────────────────────
const countries = ref<Country[]>([])
const allStates = ref<State[]>([])
const allCities = ref<City[]>([])
const categories = ref<Category[]>([])
const idTypes = ref<IdType[]>([])
const refLoaded = ref(false)

// Combobox state
const countrySearch = ref(''); const showCountryDrop = ref(false)
const nationalitySearch = ref(''); const showNationalityDrop = ref(false)
const citySearch = ref(''); const showCityDrop = ref(false)
const categorySearch = ref(''); const showCategoryDrop = ref(false)
const idTypeSearch = ref(''); const showIdTypeDrop = ref(false)
const maritalSearch = ref(''); const showMaritalDrop = ref(false)
const contactSearch = ref(''); const showContactDrop = ref(false)

const filteredCountries = computed(() => { const q = countrySearch.value.toLowerCase(); return q ? countries.value.filter(c => c.fhir_coding.display.toLowerCase().includes(q)) : countries.value })
const filteredNationalities = computed(() => { const q = nationalitySearch.value.toLowerCase(); return q ? countries.value.filter(c => c.nationality.toLowerCase().includes(q)) : countries.value })
const filteredCities = computed(() => { const q = citySearch.value.toLowerCase(); const base = form.state_id ? allCities.value.filter(c => c.state_id === Number(form.state_id)) : allCities.value; return q ? base.filter(c => c.name.toLowerCase().includes(q)) : base })
const filteredCategories = computed(() => { const q = categorySearch.value.toLowerCase(); return q ? categories.value.filter(c => c.name.toLowerCase().includes(q)) : categories.value })
const filteredIdTypes = computed(() => { const q = idTypeSearch.value.toLowerCase(); return q ? idTypes.value.filter(t => t.name.toLowerCase().includes(q)) : idTypes.value })

const maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
const contactOptions = ['Phone', 'SMS', 'Email', 'WhatsApp']
const filteredMarital = computed(() => { const q = maritalSearch.value.toLowerCase(); return q ? maritalOptions.filter(m => m.toLowerCase().includes(q)) : maritalOptions })
const filteredContact = computed(() => { const q = contactSearch.value.toLowerCase(); return q ? contactOptions.filter(c => c.toLowerCase().includes(q)) : contactOptions })

const loadReferenceData = async () => {
  if (refLoaded.value) return
  const [c, s, ci, cat, idt] = await Promise.all([
    request<Country[]>('/countries'),
    request<State[]>('/states'),
    request<City[]>('/cities?country_alpha2=MW'),
    request<Category[]>('/customer_categories'),
    request<IdType[]>('/identification_types'),
  ])
  if (c) countries.value = c
  applyDefaultNationality()
  if (s) allStates.value = s
  if (ci) allCities.value = ci
  if (cat) categories.value = cat
  if (idt) idTypes.value = idt
  refLoaded.value = true
}

const selectCountry = async (country: Country) => {
  form.country_id = String(country.id); form.country_name = country.fhir_coding.display
  countrySearch.value = country.fhir_coding.display; showCountryDrop.value = false
  form.state_id = ''; form.city_id = ''; form.city_name = ''; citySearch.value = ''
  const [s, ci] = await Promise.all([request<State[]>(`/states?country_id=${country.id}`), request<City[]>(`/cities?country_id=${country.id}`)])
  if (s) allStates.value = s
  if (ci) allCities.value = ci
}
const selectNationality = (country: Country) => {
  form.nationality_id = String(country.id)
  form.nationality = country.nationality
  nationalitySearch.value = country.nationality
  showNationalityDrop.value = false
}
const applyDefaultNationality = () => {
  const mw = countries.value.find(c => c.alpha2 === 'MW')
  if (mw) { form.nationality_id = String(mw.id); form.nationality = mw.nationality; nationalitySearch.value = mw.nationality }
}
const selectCity = (city: City) => {
  form.city_id = String(city.id); form.city_name = city.name; citySearch.value = city.name; showCityDrop.value = false
  const state = allStates.value.find(s => s.id === city.state_id)
  if (state) form.state_id = String(state.id)
}
const selectCategory = (cat: Category) => { form.customer_category_id = String(cat.id); categorySearch.value = cat.name; showCategoryDrop.value = false }
const selectIdType = (t: IdType) => { form.identification_type_id = String(t.id); idTypeSearch.value = t.name; showIdTypeDrop.value = false }
const selectMarital = (m: string) => { form.marital_status = m.toLowerCase(); maritalSearch.value = m; showMaritalDrop.value = false }
const selectContact = (m: string) => { form.preferred_contact_method = m.toLowerCase(); contactSearch.value = m; showContactDrop.value = false }

const closeAllDrops = () => { showNationalityDrop.value = false; showCountryDrop.value = false; showCityDrop.value = false; showCategoryDrop.value = false; showIdTypeDrop.value = false; showMaritalDrop.value = false; showContactDrop.value = false }

// ── Modal ──────────────────────────────────────────────────────────────────
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')

// ── Entry method (manual vs ID scan) ────────────────────────────────────────
const entryMode = ref<'choose' | 'scan' | 'manual'>('choose')
const idDocumentation = ref<File | null>(null)
const idDocPreview = ref<string | null>(null)
const chooseManual = () => { entryMode.value = 'manual'; currentStep.value = 1; formError.value = '' }
const chooseScan = () => { entryMode.value = 'scan'; formError.value = '' }
const clearIdDocumentation = () => {
  if (idDocPreview.value) URL.revokeObjectURL(idDocPreview.value)
  idDocumentation.value = null; idDocPreview.value = null
}
const sexToGender = (s: 'M' | 'F' | 'X') => (s === 'M' ? 'male' : s === 'F' ? 'female' : 'other')

// MRZ / ICAO 9303 nationality & issuing-state codes are mostly ISO 3166-1 alpha-3,
// but with documented exceptions — map the common ones onto codes in /countries.
const ICAO_TO_ISO3: Record<string, string> = {
  D: 'DEU',                                                   // Germany
  GBD: 'GBR', GBN: 'GBR', GBO: 'GBR', GBP: 'GBR', GBS: 'GBR', // British nationals → UK
  RKS: 'XKX',                                                 // Kosovo (if present)
  // XXA/XXB/XXC/XXX (stateless/refugee), UNO/UNA/UNK (UN), EUE (EU) → no single country
}

// Resolve any code the scanner produced — or the operator typed in the review form —
// to a country from loadReferenceData. Tries alpha-3 (with ICAO aliases), then alpha-2,
// numeric, then nationality text. Works for all 249 ISO 3166 rows.
const resolveCountry = (raw?: string): Country | undefined => {
  const code = (raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!code) return undefined
  const a3 = ICAO_TO_ISO3[code] ?? code
  return countries.value.find(c =>
    c.alpha3 === a3 ||
    c.alpha2 === code ||
    c.numeric_code === code ||
    (code.length >= 4 && c.nationality?.toUpperCase().includes(code)))
}

// Map the scanned document type → identification_types row (by name). We only scan
// national IDs and passports today, but drivers' licences are mapped too for safety.
const resolveIdType = (docType?: string) => {
  const needle = ({
    national_id: 'national identity',
    passport: 'passport',
    drivers_license: 'driver',
  } as Record<string, string>)[docType ?? '']
  if (!needle) return undefined
  return idTypes.value.find(t => t.name.toLowerCase().includes(needle))
}

const onIdScanned = async ({ identity, image, categoryId }: { identity: ParsedIdentity; image: File; categoryId: string }) => {
  form.customer_category_id = categoryId
  // Resolve scanned doc type → identification_types row → send customer[identification_type_id].
  const idType = resolveIdType(identity.documentType)
  if (idType) form.identification_type_id = String(idType.id)
  const given = identity.givenNames.split(/\s+/).filter(Boolean)
  form.first_name = given[0] ?? ''
  form.middle_name = given.slice(1).join(' ')
  form.last_name = identity.surname
  if (identity.sex) form.gender = sexToGender(identity.sex)
  form.identification_number = identity.idNumber
  if (identity.expiryDate) form.identification_expiry_date = identity.expiryDate
  if (identity.dateOfBirth) form.date_of_birth = identity.dateOfBirth
  // best-effort nationality → reference country (alpha-3 / nationality text)
  const natCountry = resolveCountry(identity.nationality || identity.country)
  if (natCountry) {
    form.nationality_id = String(natCountry.id)
    form.nationality = natCountry.nationality
    nationalitySearch.value = natCountry.nationality
    selectCountry(natCountry)   // sets form.country_id (+ country_name, countrySearch, states/cities)
  }
  // attach the captured still to the same multipart payload
  if (idDocPreview.value) URL.revokeObjectURL(idDocPreview.value)
  idDocumentation.value = image
  idDocPreview.value = URL.createObjectURL(image)
  formError.value = ''
  // Submit immediately with the retrieved data + image, then redirect to the new record.
  const ok = await persistCustomer()
  // If the backend rejects the partial record (e.g. category/ID type required), fall back
  // to the manual wizard so the operator can complete it — fields stay prefilled.
  if (!ok) { entryMode.value = 'manual'; currentStep.value = 1 }
}

// ── Profile photo (webcam) ─────────────────────────────────────────────────
const profilePhoto = ref<File | null>(null)
const profilePhotoPreview = ref<string | null>(null)
const showWebcam = ref(false)
const webcamVideo = ref<HTMLVideoElement | null>(null)
const webcamCanvas = ref<HTMLCanvasElement | null>(null)
const webcamLoading = ref(false)
const webcamError = ref('')
const webcamCaptured = ref(false)
let webcamStream: MediaStream | null = null

const openWebcam = async () => {
  showWebcam.value = true
  webcamCaptured.value = false
  webcamError.value = ''
  webcamLoading.value = true
  await nextTick()
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    if (webcamVideo.value) { webcamVideo.value.srcObject = webcamStream }
  } catch {
    webcamError.value = 'Permission denied or no camera found.'
  } finally {
    webcamLoading.value = false
  }
}
const stopWebcamStream = () => { webcamStream?.getTracks().forEach(t => t.stop()); webcamStream = null }
const closeWebcam = () => { stopWebcamStream(); showWebcam.value = false; webcamCaptured.value = false; webcamError.value = '' }
const webcamSnap = () => {
  if (!webcamVideo.value || !webcamCanvas.value) return
  const v = webcamVideo.value
  webcamCanvas.value.width = v.videoWidth
  webcamCanvas.value.height = v.videoHeight
  webcamCanvas.value.getContext('2d')!.drawImage(v, 0, 0)
  webcamCaptured.value = true
  stopWebcamStream()
}
const webcamRetake = async () => {
  webcamCaptured.value = false
  webcamError.value = ''
  webcamLoading.value = true
  await nextTick()
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    if (webcamVideo.value) webcamVideo.value.srcObject = webcamStream
  } catch { webcamError.value = 'Could not restart camera.' }
  finally { webcamLoading.value = false }
}
const webcamConfirm = () => {
  webcamCanvas.value?.toBlob(blob => {
    if (!blob) return
    const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' })
    profilePhoto.value = file
    profilePhotoPreview.value = URL.createObjectURL(file)
    closeWebcam()
  }, 'image/jpeg', 0.92)
}
const clearProfilePhoto = () => { profilePhoto.value = null; profilePhotoPreview.value = null }

// ── Referral documents ─────────────────────────────────────────────────────
const referralDocInput = ref<HTMLInputElement | null>(null)
const referralDocuments = ref<File | null>(null)
const onReferralDocChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  referralDocuments.value = f
}
const clearReferralDoc = () => {
  referralDocuments.value = null
  if (referralDocInput.value) referralDocInput.value.value = ''
}

const blankForm = () => ({
  customer_category_id: '', identification_type_id: '', identification_number: '', identification_expiry_date: '',
  first_name: '', middle_name: '', last_name: '', preferred_name: '',
  date_of_birth: '', gender: '', gender_identity: '', marital_status: '', nationality_id: '', nationality: '',
  phone_primary: '', phone_secondary: '', email: '', preferred_contact_method: '',
  address_line1: '', address_line2: '', country_id: '', country_name: '', state_id: '', city_id: '', city_name: '', postal_code: '',
  occupation: '', education_level: '', religion: '', ethnicity: '',
  nok_full_name: '', nok_relationship: '', nok_phone: '', nok_address: '',
  referring_facility: '', referring_clinician: '', referral_date: '', referral_reason: '',
})
const form = reactive(blankForm())

// ── Wizard ───────────────────────────────────────────────────────────────
const steps = [
  { id: 1, label: 'Classification', icon: 'tag', hint: 'Customer category and identification document · required' },
  { id: 2, label: 'Identity & Basics', icon: 'id-badge', hint: 'Legal name, DOB, gender, marital status and nationality · required' },
  { id: 3, label: 'Contact & Address', icon: 'location-dot', hint: 'Primary phone, country and city · required' },
  { id: 4, label: 'Socio-Demographics', icon: 'briefcase', hint: 'Occupation, education, religion and ethnicity · required' },
  { id: 5, label: 'Next of Kin', icon: 'user-shield', hint: 'Emergency contact details · required' },
  { id: 6, label: 'Referral', icon: 'file-medical', hint: 'Referring facility, clinician and date · required' },
] as const
const currentStep = ref(1)
const activeStep = computed(() => steps.find(s => s.id === currentStep.value)!)

// Visual state for each stepper node: active / completed / upcoming
const stepCircleClass = (id: number) => {
  if (id === currentStep.value) return 'bg-primary text-white ring-4 ring-primary/15 scale-110'
  if (id < currentStep.value) return 'bg-primary text-white'
  return 'bg-surface-low text-outline hover:text-primary'
}

// Per-step required-field validation
const validateStep = (step: number): boolean => {
  formError.value = ''
  if (step === 1 && (!form.customer_category_id || !form.identification_type_id || !form.identification_number || !form.identification_expiry_date)) {
    formError.value = 'Category, ID type, ID number and ID expiry date are required.'
    return false
  }
  if (step === 2 && (!form.first_name || !form.last_name || !form.gender || !form.date_of_birth || !form.marital_status)) {
    formError.value = 'First name, last name, gender, date of birth and marital status are required.'
    return false
  }
  if (step === 3 && (!form.phone_primary || !form.country_id || !form.city_id)) {
    formError.value = 'Primary phone, country and city are required.'
    return false
  }
  if (step === 4 && (!form.occupation || !form.education_level || !form.religion || !form.ethnicity)) {
    formError.value = 'Occupation, education level, religion and ethnicity are required.'
    return false
  }
  if (step === 5 && (!form.nok_full_name || !form.nok_relationship || !form.nok_phone || !form.nok_address)) {
    formError.value = 'All next of kin fields are required.'
    return false
  }
  if (step === 6 && (!form.referring_facility || !form.referring_clinician || !form.referral_date)) {
    formError.value = 'Referring facility, clinician and referral date are required.'
    return false
  }
  return true
}

const nextStep = () => {
  if (!validateStep(currentStep.value)) return
  closeAllDrops()
  if (currentStep.value < steps.length) currentStep.value++
}
const prevStep = () => {
  formError.value = ''
  closeAllDrops()
  if (currentStep.value > 1) currentStep.value--
}
// Jump backwards freely; jumping forward validates each intervening step
const goToStep = (target: number) => {
  closeAllDrops()
  if (target <= currentStep.value) { formError.value = ''; currentStep.value = target; return }
  for (let s = currentStep.value; s < target; s++) {
    if (!validateStep(s)) { currentStep.value = s; return }
  }
  currentStep.value = target
}

const openModal = async () => {
  Object.assign(form, blankForm())
  countrySearch.value = ''; citySearch.value = ''; categorySearch.value = ''; idTypeSearch.value = ''; maritalSearch.value = ''; contactSearch.value = ''; nationalitySearch.value = ''
  applyDefaultNationality()
  formError.value = ''; currentStep.value = 1; entryMode.value = 'choose'; showModal.value = true
  // reset file fields
  profilePhoto.value = null; profilePhotoPreview.value = null
  referralDocuments.value = null
  clearIdDocumentation()
  await loadReferenceData()
}

const persistCustomer = async (): Promise<boolean> => {
  saving.value = true
  try {
    const fd = new FormData()
    const fields = ['customer_category_id', 'identification_type_id', 'identification_number', 'identification_expiry_date', 'first_name', 'middle_name', 'last_name', 'preferred_name', 'date_of_birth', 'gender', 'gender_identity', 'marital_status', 'nationality_id', 'phone_primary', 'phone_secondary', 'email', 'preferred_contact_method', 'address_line1', 'address_line2', 'country_id', 'state_id', 'city_id', 'postal_code', 'nok_full_name', 'nok_relationship', 'nok_phone', 'occupation', 'education_level', 'religion', 'ethnicity', 'nok_address', 'referring_facility', 'referring_clinician', 'referral_date'] as const
    fields.forEach(f => { if (form[f]) fd.append(`customer[${f}]`, String(form[f])) })
    // File fields
    if (profilePhoto.value) fd.append('customer[profile_photo]', profilePhoto.value)
    if (referralDocuments.value) fd.append('customer[referral_documents]', referralDocuments.value)
    if (idDocumentation.value) fd.append('customer[identification_documentation]', idDocumentation.value)
    const result = await request<{ resourceType: string; uuid: string }>('/customer/create', { method: 'POST', body: fd })
    if (result?.uuid) { showModal.value = false; router.push(`/customers/${result.uuid}`); return true }
    return false
  } catch (e: unknown) {
    formError.value = (e as Error).message || 'Failed to register customer.'
    return false
  } finally {
    saving.value = false
  }
}

const submitCustomer = async () => {
  // Validate every step; jump to the first with missing required fields
  for (const s of steps) {
    if (!validateStep(s.id)) { currentStep.value = s.id; return }
  }
  await persistCustomer()
}

const calcAge = (dob: string) => {
  if (!dob) return '—'
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}
</script>

<style scoped>
.cust-label {
  @apply text-xs font-bold text-outline ml-1 block mb-1;
}

.cust-input {
  @apply w-full bg-surface-low border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder-outline/50 transition-all duration-200 focus:outline-none;
  box-shadow: inset 0 0 0 1.5px transparent;
}

.cust-input:focus {
  box-shadow: inset 0 0 0 1.5px #0050cb;
  background-color: #f7f9fb;
}

.cust-input:hover:not(:focus):not(:disabled) {
  background-color: #e6e8ea;
}

/* Two-class selectors → higher specificity than .cust-input, so these always
   win over the base `px-4` padding regardless of stylesheet emit order. */
.cust-input.has-icon {
  padding-left: 2.5rem;
}

.cust-input.has-caret {
  padding-right: 2.25rem;
}

/* Filter dropdowns in the search card */
.cust-filter {
  @apply text-sm bg-surface-low border border-outline-variant/40 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer;
}

/* Pagination buttons */
.page-btn {
  @apply min-w-8 h-8 px-2 rounded-lg border border-outline-variant/50 bg-white/80 text-xs font-bold text-on-surface-variant flex items-center justify-center transition-colors hover:bg-surface-high disabled:opacity-40 disabled:cursor-not-allowed;
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

/* Wizard step swap */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(14px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-14px);
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