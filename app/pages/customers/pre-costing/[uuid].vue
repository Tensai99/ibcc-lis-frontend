<!-- app/pages/customers/pre-costing/[uuid].vue -->
<template>
    <AccessDenied v-if="denied" />
    <div class="animate-fade-in min-h-full" @dblclick.self.stop>

        <!-- Breadcrumb — hidden in print -->
        <div class="no-print mb-5">
            <nav
                class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
                <NuxtLink :to="{ path: `/customers` }"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
                    <font-awesome-icon :icon="['fas', 'users']" class="text-[11px]" />Customers
                </NuxtLink>
                <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
                <NuxtLink :to="{ path: `/customers/${customerUuid}` }"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
                    <font-awesome-icon :icon="['fas', 'user']" class="text-[11px]" />{{ detail?.customer.full_name }}
                </NuxtLink>
                <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
                <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
                    <font-awesome-icon :icon="['fas', 'file-invoice']" class="text-[11px] text-primary" />Pre-Costing
                </span>
            </nav>
        </div>

        <!-- Loading -->
        <div v-if="showSkeleton && !detail" class="space-y-4">
            <SkeletonDetailHeader />
            <div class="rounded-2xl bg-white/80 backdrop-blur-md border border-white/50 shadow-island overflow-hidden p-5">
                <SkeletonBase width="30%" height="1.1rem" class="mb-4" />
                <table class="w-full text-sm">
                    <tbody><SkeletonTableRows :columns="4" :rows="5" /></tbody>
                </table>
            </div>
        </div>
        <div v-else-if="loading && !detail" />

        <template v-else-if="detail">
            <div id="printable-area" class="max-w-[98%] mx-auto space-y-4">

                <!-- ══ ACTION BAR — hidden on print ═══════════════════════════════════ -->
                <header
                    class="no-print rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style="background:linear-gradient(135deg,#1e5bb9 0%,#0050cb 100%);box-shadow:0 8px 32px -8px rgba(30,91,185,0.35);">
                    <div>
                        <div>
                            <h1 class="text-white font-bold text-base tracking-tight font-mono">Pre-costing for {{
                                detail.customer.full_name }} ({{ detail.no }})</h1>
                            <span v-if="detail.is_approved"
                                class="flex items-center gap-1.5 text-[10px] font-bold bg-green-400/20 text-green-200 border border-green-300/20 px-2.5 py-1 rounded-full">
                                <span class="w-1.5 h-1.5 rounded-full bg-green-400" />Approved By {{ detail.approved_by
                                }} on {{ fmtDate(detail.approved_on) }}
                            </span>
                            <span v-else
                                class="flex items-center gap-1.5 text-[10px] font-bold bg-white/15 text-white/75 border border-white/10 px-2.5 py-1 rounded-full">
                                <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />Pending Approval
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <button v-if="!detail.is_approved"
                            class="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md"
                            @click="showApproveDialog = true">
                            <font-awesome-icon :icon="['fas', 'circle-check']" class="text-xs" />Approve
                        </button>
                        <span v-else
                            class="flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/10 text-white/60 py-2 px-3.5 rounded-xl cursor-not-allowed">
                            <font-awesome-icon :icon="['fas', 'lock']" class="text-xs" />Approved
                        </span>

                        <!-- Advanced options dropdown -->
                        <div class="relative">
                            <button
                                class="flex items-center gap-1.5 bg-gray-300 hover:bg-white/20 border border-gray-300 text-gray-600 hover:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all"
                                @click="showAdvanced = !showAdvanced">
                                <font-awesome-icon :icon="['fas', 'sliders']" class="text-xs" />Advanced Options
                                <font-awesome-icon :icon="['fas', 'chevron-down']"
                                    class="text-[9px] transition-transform" :class="showAdvanced ? 'rotate-180' : ''" />
                            </button>

                            <!-- Click-away backdrop -->
                            <div v-if="showAdvanced" class="fixed inset-0 z-40" @click="showAdvanced = false" />

                            <!-- Menu -->
                            <transition enter-active-class="transition ease-out duration-150"
                                enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                                leave-active-class="transition ease-in duration-100"
                                leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                                <div v-if="showAdvanced"
                                    class="absolute right-0 mt-2 w-60 z-50 rounded-2xl bg-white shadow-2xl border border-slate-100 p-1.5 origin-top-right"
                                    style="box-shadow:0 20px 50px -12px rgba(0,0,0,0.25);">
                                    <button
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="showAdvanced = false; printDoc()">
                                        <font-awesome-icon :icon="['fas', 'print']"
                                            class="text-xs text-slate-400 w-4" />Print Document
                                    </button>
                                    <button
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="showAdvanced = false; downloadPdf()">
                                        <font-awesome-icon :icon="['fas', 'file-pdf']"
                                            class="text-xs text-slate-400 w-4" />Download PDF
                                    </button>
                                    <div class="my-1 border-t border-slate-100" />
                                    <button v-if="!detail.is_approved && !detail.insurance.pay_with_insurance"
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="openInsModal">
                                        <font-awesome-icon :icon="['fas', 'shield-halved']"
                                            class="text-xs text-slate-400 w-4" />Add Insurance
                                    </button>
                                    <button v-if="!detail.is_approved"
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="openTaxModal">
                                        <font-awesome-icon :icon="['fas', 'percent']"
                                            class="text-xs text-slate-400 w-4" />Adjust Billing Taxes
                                    </button>
                                    <button
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="router.push({ path: `/customers/proforma-invoice/${detail.proforma_invoice.uuid}`, query: { customer_uuid: customerUuid } })">
                                        <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" /> View
                                        Proforma-Invoice
                                    </button>
                                </div>
                            </transition>
                        </div>
                    </div>
                </header>

                <div class="w-full text-right bg-white/60 text-gray-500 rounded-lg py-3 px-4">
                    <p class="text-xs font-bold mt-0.5">
                        Currency: {{ detail.currency }} - Generated on: {{ fmtDate(detail.created_at) }} ({{
                        detail.created_by }}) - Last Modified: {{ fmtDate(detail.updated_at) }} ({{ detail.updated_by
                        }})
                    </p>
                </div>

                <!-- ══ INVOICE HEADER — THREE COLUMNS ═════════════════════════════════ -->
                <section
                    class="bg-white/90 rounded-2xl border border-slate-200/80 p-7 grid grid-cols-1 md:grid-cols-3 gap-6 items-start relative overflow-hidden"
                    style="backdrop-filter:blur(12px);">
                    <!-- Faint watermark icon -->
                    <div class="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none select-none">
                        <font-awesome-icon :icon="['fas', 'hospital']" style="font-size:120px;" />
                    </div>

                    <!-- Left: Issue + Facility -->
                    <div class="space-y-4">
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Details
                            </p>
                            <p class="text-sm font-bold text-slate-800">
                                {{ detail.insurance.pay_with_insurance ? 'Insurance Payment Pre-Costing' : 'Cash Payment Pre-Costing' }}
                            </p>
                            <p class="text-xs font-semibold text-slate-700 mt-1">Created At: <span
                                    class="font-normal text-slate-500">{{ fmtDate(detail.created_at) }}</span></p>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Facility</p>
                            <p class="text-sm font-bold text-slate-800">{{ detail.facility.facility_name }}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ detail.facility.facility_address_line1 }}</p>
                            <p class="text-xs text-slate-500">{{ detail.facility.facility_address_line2 }}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ detail.facility.facility_phone }}</p>
                            <p class="text-xs font-medium text-[#1e5bb9]">{{ detail.facility.facility_email }}</p>
                            <p class="text-[11px] text-slate-400 mt-1">Estimate valid for
                                {{ detail.facility.pre_costing_validity_terms_days }} days · due
                                <span class="font-semibold text-slate-600">{{ validUntil }}</span>
                            </p>
                            <!-- TIN + VAT as badges -->
                            <div class="flex flex-wrap gap-1.5 mt-2">
                                <span
                                    class="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                    TIN <span class="font-mono font-semibold text-slate-800">{{ detail.facility.tin
                                    }}</span>
                                </span>
                                <span
                                    class="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                                    VAT REG <span class="font-mono font-semibold text-slate-800">{{
                                        detail.facility.vat_reg_number }}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Centre: Logo -->
                    <div class="flex flex-col items-center justify-center">
                        <img src="/images/ibcc_logo.png" alt="IBCC" class="h-[200px] w-auto object-contain"
                            @error="($event.target as HTMLImageElement).style.display = 'none'" />
                    </div>

                    <!-- Right: Customer -->
                    <div class="md:text-left space-y-4">
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                            <p
                                class="text-sm font-bold text-slate-800 underline decoration-slate-200 underline-offset-4">
                                {{ detail.customer.full_name }}</p>
                            <p class="text-xs font-mono text-slate-500 mt-0.5">Customer NO: {{ detail.customer.no }}</p>
                            <p class="text-xs text-slate-500 capitalize">{{ detail.customer.gender }}, {{
                                fmtDate(detail.customer.date_of_birth) }}</p>
                            <p class="text-xs text-slate-500">Contact: {{ detail.customer.phone_primary }}</p>
                        </div>
                        <!-- Insurance details -->
                        <div v-if="detail.insurance.pay_with_insurance">
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Insurance
                            </p>
                            <p class="text-sm font-bold text-slate-800">{{ detail.insurance.provider || '—' }}</p>
                            <p class="text-xs text-slate-600">Scheme: {{ detail.insurance.scheme }}
                                <span v-if="detail.insurance.code" class="text-slate-400">({{ detail.insurance.code
                                }})</span>
                            </p>
                            <p class="text-xs font-mono text-slate-500">Membership Number: {{
                                detail.insurance.membership_number }}</p>
                            <p class="text-[11px] font-semibold"
                                :class="detail.insurance.requires_preauthorization ? 'text-rose-600' : 'text-emerald-600'">
                                {{ detail.insurance.requires_preauthorization ? 'Requires pre-authorization from insurance' : 'Does not require preauthorization from insurance' }}
                            </p>
                            <p class="text-[11px] text-slate-500">
                                {{ detail.insurance.use_base_price ? 'Using base price' : 'Not using base price' }}
                            </p>
                            <!-- Coverage regions -->
                            <div v-if="detail.insurance.coverage_regions?.length" class="mt-2">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Coverage
                                    Regions</p>
                                <div class="flex flex-wrap gap-1.5">
                                    <span v-for="region in detail.insurance.coverage_regions" :key="region"
                                        class="inline-flex items-center gap-1 text-[10px] font-bold bg-[#1e5bb9]/5 text-[#1e5bb9] border border-[#1e5bb9]/15 px-2 py-0.5 rounded-md">
                                        <font-awesome-icon :icon="['fas', 'earth-africa']" class="text-[9px]" />{{
                                            region }}
                                    </span>
                                </div>
                            </div>
                            <div v-if="!detail.insurance.filled_forms_urls?.length"
                                class="pt-1 flex md:justify-end no-print">
                                <button
                                    class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1e5bb9] bg-white hover:bg-blue-50 border border-[#1e5bb9]/30 px-2.5 py-1.5 rounded-lg transition-colors"
                                    @click="openUploadModal()">
                                    <font-awesome-icon :icon="['fas', 'cloud-arrow-up']" class="text-xs" />Upload
                                    Form
                                </button>
                            </div>
                            <div v-else class="pt-1 flex md:justify-end gap-2 no-print">
                                <button
                                    class="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-lg transition-colors"
                                    @click="showFormsModal = true">
                                    <font-awesome-icon :icon="['fas', 'file-circle-check']" class="text-xs" />View
                                    Form{{ detail.insurance.filled_forms_urls.length > 1 ? 's' : '' }} ({{
                                        detail.insurance.filled_forms_urls.length }})
                                </button>
                                <button v-if="!detail.is_approved"
                                    class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1e5bb9] bg-white hover:bg-blue-50 border border-[#1e5bb9]/30 px-2.5 py-1.5 rounded-lg transition-colors"
                                    @click="openUploadModal()" title="Upload more">
                                    <font-awesome-icon :icon="['fas', 'plus']" class="text-xs" />
                                </button>
                            </div>
                        </div>
                        <span v-else class="text-[10px] text-slate-400 italic">No insurance attached</span>
                    </div>
                </section>

                <!-- ══ LINE ITEMS TABLE ════════════════════════════════════════════════ -->
                <div class="bg-white/95 rounded-2xl border border-slate-200/80 overflow-hidden"
                    style="box-shadow:0 10px 40px -10px rgba(0,0,0,0.04);">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-100" style="background:#f8fafc;">
                                <th class="px-7 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Item Description</th>
                                <template v-if="detail.insurance.pay_with_insurance">
                                    <th
                                        class="bg-blue-100 px-7 py-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                        Insurance Coverage %</th>
                                    <th
                                        class="bg-orange-100 px-7 py-4 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                                        Insurance Coverage<br> Per Service Limit</th>
                                    <th
                                        class="bg-red-100 px-7 py-4 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                        Insurance Coverage<br> Annual Limit</th>
                                </template>
                                <th
                                    class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                                    Base</th>
                                <th
                                    class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                                    Adjusted</th>
                                <th
                                    class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                                    Discount</th>
                                <th
                                    class="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                                    Amount</th>
                                <th class="px-3 py-4 no-print w-8" />
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100/60">

                            <!-- ── CLINICAL SERVICES ─────────────────────────────────────── -->
                            <tr class="bg-surface-low">
                                <td :colspan="detail.insurance.pay_with_insurance ? 7 : 4" class="px-7 py-2.5">
                                    <div class="flex items-center gap-2">
                                        <font-awesome-icon :icon="['fas', 'notes-medical']"
                                            class="text-[#1e5bb9] text-xs" />
                                        <span
                                            class="text-[11px] font-bold text-[#1e5bb9] uppercase tracking-widest">Clinical
                                            Services</span>
                                    </div>
                                </td>
                                <td class="px-5 py-2.5 text-right" />
                                <td class="px-3 py-2.5 no-print">
                                    <button
                                        class="flex items-center gap-1 text-[10px] font-bold text-[#1e5bb9] hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors border border-[#1e5bb9]/20"
                                        @click="openAddModal('enc')">
                                        <font-awesome-icon :icon="['fas', 'plus']" class="text-[9px]" />Add
                                    </button>
                                </td>
                            </tr>
                            <tr v-for="(item, i) in detail.encounter_types" :key="`enc-${i}`"
                                class="hover:bg-slate-50/80 transition-colors group">
                                <td class="px-7 py-3.5 text-sm font-medium text-slate-700">{{ item.name }}</td>
                                <template v-if="detail.insurance.pay_with_insurance">
                                    <td class="bg-blue-100 px-5 py-3.5 text-center font-bold text-xs text-blue-500">
                                        {{ item.insurance_coverage.percentage }}%</td>
                                    <td class="bg-orange-100 px-5 py-3.5 text-center font-bold text-xs text-orange-500">
                                        {{
                                            item.insurance_coverage.per_encounter_limit ? f(item.currency,
                                                item.insurance_coverage.per_encounter_limit) : "—"}}</td>
                                    <td class="bg-red-100 px-5 py-3.5 text-center font-bold text-xs text-red-500">{{
                                        item.insurance_coverage.annual_limit ? f(item.currency,
                                            item.insurance_coverage.annual_limit) : "—"}}</td>
                                </template>
                                <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{ f(item.currency,
                                    item.base_amount) }}</td>
                                <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{ f(item.currency,
                                    item.adjusted_amount) }}</td>
                                <!-- Editable discount — double click to edit -->
                                <td class="px-5 py-3.5 text-right"
                                    @dblclick.stop="startEditDiscount('enc', i, item.discount_amount)">
                                    <div v-if="editingDiscount?.section === 'enc' && editingDiscount?.index === i"
                                        class="flex items-center justify-end gap-1">
                                        <input
                                            class="w-24 text-right text-xs font-mono border border-[#1e5bb9]/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1e5bb9]"
                                            :value="editDiscountVal" @input="onDiscInput" @keyup.enter="saveDiscount"
                                            @keyup.escape="cancelEditDiscount" autofocus />
                                        <button v-if="!discSaving"
                                            class="text-emerald-600 hover:text-emerald-700 transition-colors"
                                            @click="saveDiscount">
                                            <font-awesome-icon :icon="['fas', 'floppy-disk']" class="text-sm" />
                                        </button>
                                        <font-awesome-icon v-else :icon="['fas', 'spinner']" spin
                                            class="text-xs text-slate-400" />
                                    </div>
                                    <span v-else-if="item.discount_amount > 0"
                                        class="text-emerald-600 font-bold text-xs cursor-pointer hover:underline"
                                        title="Double-click to edit">
                                        {{ f(item.currency, item.discount_amount) }}
                                    </span>
                                    <span v-else class="text-slate-300 cursor-pointer"
                                        title="Double-click to add discount">—</span>
                                </td>
                                <td class="px-5 py-3.5 text-right font-bold text-sm text-slate-800">{{ f(item.currency,
                                    item.total_amount) }}</td>
                                <td class="px-3 py-3.5 no-print">
                                    <button
                                        class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"
                                        @click="deleteItem('enc', i)" title="Remove">
                                        <font-awesome-icon :icon="['fas', 'trash-can']" class="text-xs" />
                                    </button>
                                </td>
                            </tr>

                            <!-- ── LABORATORY TESTS ──────────────────────────────────────── -->
                            <tr class="bg-surface-low">
                                <td :colspan="detail.insurance.pay_with_insurance ? 7 : 4" class="px-7 py-2.5">
                                    <div class="flex items-center gap-2">
                                        <font-awesome-icon :icon="['fas', 'flask']" class="text-slate-500 text-xs" />
                                        <span
                                            class="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Laboratory
                                            Tests</span>
                                    </div>
                                </td>
                                <td class="px-5 py-2.5 text-right" />
                                <td class="px-3 py-2.5 no-print">
                                    <button
                                        class="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors border border-slate-300/60"
                                        @click="openAddModal('lab')">
                                        <font-awesome-icon :icon="['fas', 'plus']" class="text-[9px]" />Add
                                    </button>
                                </td>
                            </tr>
                            <tr v-for="(item, i) in detail.laboratory_tests" :key="`lab-${i}`"
                                class="hover:bg-slate-50/80 transition-colors group">
                                <td class="px-7 py-3.5 text-sm font-medium text-slate-700">{{ item.name }}</td>
                                <template v-if="detail.insurance.pay_with_insurance">
                                    <td class="bg-blue-100 px-5 py-3.5 text-center font-bold text-xs text-blue-500">
                                        {{ item.insurance_coverage.percentage }}%</td>
                                    <td class="bg-orange-100 px-5 py-3.5 text-center font-bold text-xs text-orange-500">
                                        {{
                                            item.insurance_coverage.per_encounter_limit ? f(item.currency,
                                                item.insurance_coverage.per_encounter_limit) : "—"}}</td>
                                    <td class="bg-red-100 px-5 py-3.5 text-center font-bold text-xs text-red-500">{{
                                        item.insurance_coverage.annual_limit ? f(item.currency,
                                            item.insurance_coverage.annual_limit) : "—"}}</td>
                                </template>
                                <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{ f(item.currency,
                                    item.base_amount) }}</td>
                                <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{ f(item.currency,
                                    item.adjusted_amount) }}</td>
                                <td class="px-5 py-3.5 text-right"
                                    @dblclick.stop="startEditDiscount('lab', i, item.discount_amount)">
                                    <div v-if="editingDiscount?.section === 'lab' && editingDiscount?.index === i"
                                        class="flex items-center justify-end gap-1">
                                        <input
                                            class="w-24 text-right text-xs font-mono border border-[#1e5bb9]/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1e5bb9]"
                                            :value="editDiscountVal" @input="onDiscInput" @keyup.enter="saveDiscount"
                                            @keyup.escape="cancelEditDiscount" autofocus />
                                        <button v-if="!discSaving" class="text-emerald-600 hover:text-emerald-700"
                                            @click="saveDiscount">
                                            <font-awesome-icon :icon="['fas', 'floppy-disk']" class="text-sm" />
                                        </button>
                                        <font-awesome-icon v-else :icon="['fas', 'spinner']" spin
                                            class="text-xs text-slate-400" />
                                    </div>
                                    <span v-else-if="item.discount_amount > 0"
                                        class="text-emerald-600 font-bold text-xs cursor-pointer hover:underline"
                                        title="Double-click to edit">
                                        -{{ f(item.currency, item.discount_amount) }}
                                    </span>
                                    <span v-else class="text-slate-300 cursor-pointer"
                                        title="Double-click to add discount">—</span>
                                </td>
                                <td class="px-5 py-3.5 text-right font-bold text-sm text-slate-800">{{ f(item.currency,
                                    item.total_amount) }}</td>
                                <td class="px-3 py-3.5 no-print">
                                    <button
                                        class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"
                                        @click="deleteItem('lab', i)" title="Remove">
                                        <font-awesome-icon :icon="['fas', 'trash-can']" class="text-xs" />
                                    </button>
                                </td>
                            </tr>

                            <!-- ── RADIOLOGY ──────────────────────────────────────────────── -->
                            <tr class="bg-surface-low">
                                <td :colspan="detail.insurance.pay_with_insurance ? 7 : 4" class="px-7 py-2.5">
                                    <div class="flex items-center gap-2">
                                        <font-awesome-icon :icon="['fas', 'x-ray']" class="text-violet-600 text-xs" />
                                        <span
                                            class="text-[11px] font-bold text-violet-600 uppercase tracking-widest">Radiology</span>
                                    </div>
                                </td>
                                <td class="px-5 py-2.5 text-right" />
                                <td class="px-3 py-2.5 no-print">
                                    <button
                                        class="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors border border-violet-300/60"
                                        @click="openAddModal('rad')">
                                        <font-awesome-icon :icon="['fas', 'plus']" class="text-[9px]" />Add
                                    </button>
                                </td>
                            </tr>
                            <tr v-for="(item, i) in detail.radiology_images" :key="`rad-${i}`"
                                class="hover:bg-slate-50/80 transition-colors group">
                                <td class="px-7 py-3.5 text-sm font-medium text-slate-700">{{ item.name }}</td>
                                <template v-if="detail.insurance.pay_with_insurance">
                                    <td class="bg-blue-100 px-5 py-3.5 text-center font-bold text-xs text-blue-500">
                                        {{ item.insurance_coverage.percentage }}%</td>
                                    <td class="bg-orange-100 px-5 py-3.5 text-center font-bold text-xs text-orange-500">
                                        {{
                                            item.insurance_coverage.per_encounter_limit ? f(item.currency,
                                                item.insurance_coverage.per_encounter_limit) : "—"}}</td>
                                    <td class="bg-red-100 px-5 py-3.5 text-center font-bold text-xs text-red-500">{{
                                        item.insurance_coverage.annual_limit ? f(item.currency,
                                            item.insurance_coverage.annual_limit) : "—"}}</td>
                                </template>
                                <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{ f(item.currency,
                                    item.base_amount) }}</td>
                                <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{ f(item.currency,
                                    item.adjusted_amount) }}</td>
                                <td class="px-5 py-3.5 text-right"
                                    @dblclick.stop="startEditDiscount('rad', i, item.discount_amount)">
                                    <div v-if="editingDiscount?.section === 'rad' && editingDiscount?.index === i"
                                        class="flex items-center justify-end gap-1">
                                        <input
                                            class="w-24 text-right text-xs font-mono border border-[#1e5bb9]/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1e5bb9]"
                                            :value="editDiscountVal" @input="onDiscInput" @keyup.enter="saveDiscount"
                                            @keyup.escape="cancelEditDiscount" autofocus />
                                        <button v-if="!discSaving" class="text-emerald-600 hover:text-emerald-700"
                                            @click="saveDiscount">
                                            <font-awesome-icon :icon="['fas', 'floppy-disk']" class="text-sm" />
                                        </button>
                                        <font-awesome-icon v-else :icon="['fas', 'spinner']" spin
                                            class="text-xs text-slate-400" />
                                    </div>
                                    <span v-else-if="item.discount_amount > 0"
                                        class="text-emerald-600 font-bold text-xs cursor-pointer hover:underline"
                                        title="Double-click to edit">
                                        -{{ f(item.currency, item.discount_amount) }}
                                    </span>
                                    <span v-else class="text-slate-300 cursor-pointer"
                                        title="Double-click to add discount">—</span>
                                </td>
                                <td class="px-5 py-3.5 text-right font-bold text-sm text-slate-800">{{ f(item.currency,
                                    item.total_amount) }}</td>
                                <td class="px-3 py-3.5 no-print">
                                    <button
                                        class="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all"
                                        @click="deleteItem('rad', i)" title="Remove">
                                        <font-awesome-icon :icon="['fas', 'trash-can']" class="text-xs" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- ── TOTALS FOOTER ──────────────────────────────────────────────── -->
                    <div class="px-7 py-6 border-t border-slate-100" style="background:#f8fafc30;">
                        <div class="flex flex-col md:flex-row justify-between gap-6">

                            <!-- Left: Summary -->
                            <div class="space-y-2">
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Summary</p>
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <p class="text-sm text-slate-600">Gross ({{ detail.total_services }} services):
                                        <span class="font-bold text-slate-800">{{ f(detail.currency, detail.total)
                                        }}</span>
                                    </p>
                                </div>
                                <div v-if="detail.discount.amount" class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                                    <p class="text-sm text-emerald-600 font-semibold">
                                        Total Discount ({{ detail.discount.percentage }}%): {{ f(detail.currency,
                                            detail.discount.amount) }}
                                    </p>
                                </div>
                            </div>

                            <!-- Right: Tax breakdown + total -->
                            <div class="md:w-80 space-y-2.5">
                                <div
                                    class="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <span>Sub-total</span>
                                    <span class="tabular-nums">{{ f(detail.currency, detail.sub_total) }}</span>
                                </div>
                                <div class="space-y-2 border-y border-slate-200/60 py-3">
                                    <div v-for="t in collectTaxes" :key="t.name"
                                        class="flex justify-between text-[11px]">
                                        <span class="text-slate-400">
                                            +{{ t.percentage }}% <span class="ml-1 text-slate-500">{{ t.name }}</span>
                                        </span>
                                        <span class="text-[#1e5bb9] font-bold tabular-nums">{{ f(detail.currency,
                                            t.tax_amount) }}</span>
                                    </div>
                                    <div v-for="t in deductTaxes" :key="t.name"
                                        class="flex justify-between text-[11px]">
                                        <span class="text-slate-400">
                                            -{{ t.percentage }}% <span class="ml-1 text-slate-500">{{ t.name }}</span>
                                        </span>
                                        <span class="text-orange-500 font-bold tabular-nums">{{ f(detail.currency,
                                            t.tax_amount) }}</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-baseline pt-1">
                                    <span class="text-lg font-bold text-slate-800">Total Price</span>
                                    <span class="text-2xl font-black text-[#1e5bb9] tracking-tighter tabular-nums">{{
                                        f(detail.currency, detail.total_price) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Print QR + Barcode (visible only on print) ───────────────────── -->
                <div class="print-only flex justify-between items-end px-2 pt-2">
                    <!-- QR placeholder — in real implementation render actual QR SVG from API -->
                    <div class="flex flex-col items-start gap-1">
                        <p class="text-[8px] text-slate-400 uppercase tracking-widest">Scan to verify</p>
                        <div
                            class="w-16 h-16 border border-slate-200 rounded bg-slate-50 flex items-center justify-center">
                            <span class="text-[8px] text-slate-400 text-center leading-tight">QR<br>CODE</span>
                        </div>
                    </div>
                    <!-- Barcode -->
                    <div class="flex flex-col items-end gap-1">
                        <p class="text-[8px] text-slate-400 uppercase tracking-widest">{{ detail.no }}</p>
                        <div class="flex items-end gap-[1px] h-10">
                            <div v-for="(w, i) in barWidths" :key="i" :class="['bg-slate-800 h-full', w]"
                                :style="{ height: i % 7 === 0 ? '100%' : i % 3 === 0 ? '80%' : '90%' }" />
                        </div>
                    </div>
                </div>

                <!-- ── Footer meta ───────────────────────────────────────────────────── -->
                <footer class="flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
                    <p>Created by <span class="text-slate-600 font-bold uppercase">{{ detail.created_by }}</span> on {{
                        fmtDateTime(detail.created_at) }}</p>
                    <p class="uppercase tracking-widest">© {{ new Date().getFullYear() }} IBCC</p>
                </footer>

            </div>
        </template>

        <!-- ══ APPROVE DIALOG ════════════════════════════════════════════════════ -->
        <Modal v-model="showApproveDialog" title="Approve Pre-Costing" :show-logo="false" size="sm" class="max-w-lg"
            :close-on-backdrop="false">
            <div class="space-y-4">
                <AppAlert v-if="approveError" type="error" :title="approveError" />
                <div class="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 items-start">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']"
                        class="text-amber-500 text-lg flex-shrink-0 mt-0.5" />
                    <div>
                        <p class="text-sm font-bold text-amber-800">Confirm Approval</p>
                        <p class="text-sm text-amber-700 mt-1 leading-relaxed">Once approved this estimate cannot be
                            edited.
                            Proceed?</p>
                        <div v-if="detail" class="mt-3 space-y-1 text-xs text-amber-700">
                            <p>Reference: <strong class="font-mono">{{ detail.no }}</strong></p>
                            <p>Total: <strong>{{ f(detail.currency, detail.total_price) }}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Initial settlement rate -->
            <div>
                <label class="block text-sm font-bold text-on-surface mb-1.5">Initial Settlement Percentage</label>
                <div class="relative">
                    <input v-model.number="initialSettlementPercentage" type="number" min="1" max="100" step="0.01"
                        placeholder="e.g. 100" required
                        class="w-full border rounded-xl pl-4 pr-9 py-3 text-sm bg-slate-50 text-on-surface placeholder-outline/50 focus:outline-none focus:ring-2 transition-all"
                        :class="initialSettlementPercentage !== null && (initialSettlementPercentage < 1 || initialSettlementPercentage > 100)
                            ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500'" />
                    <span
                        class="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none">%</span>
                </div>
                <p v-if="initialSettlementPercentage !== null && initialSettlementPercentage < 1"
                    class="flex items-center gap-1 text-xs text-rose-600 font-semibold mt-1.5">
                    <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="text-xs" />
                    Minimum value is 1%.
                </p>
                <p v-else-if="initialSettlementPercentage !== null && initialSettlementPercentage > 100"
                    class="flex items-center gap-1 text-xs text-rose-600 font-semibold mt-1.5">
                    <font-awesome-icon :icon="['fas', 'circle-exclamation']" class="text-xs" />
                    Maximum value is 100%.
                </p>
                <p v-else class="text-xs text-on-surface-variant mt-1.5">Portion of the invoice to settle up front when
                    this
                    estimate is approved.</p>
            </div>
            <template #footer>
                <button
                    class="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1"
                    @click="showApproveDialog = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    style="box-shadow:0 4px 16px rgba(22,163,74,0.25);" :disabled="approveSaving"
                    @click="submitApprove">
                    <font-awesome-icon v-if="approveSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'circle-check']" />
                    {{ approveSaving ? 'Approving…' : 'Yes, Approve' }}
                </button>
            </template>
        </Modal>

        <!-- ══ ADD INSURANCE MODAL ════════════════════════════════════════════════ -->
        <Modal v-model="showInsModal" title="Add Insurance to Pre-Costing" size="md">
            <div class="space-y-3">
                <AppAlert v-if="insError" type="error" :title="insError" />
                <div v-if="!coverages.length" class="py-8 text-center text-sm text-on-surface-variant">No coverages on
                    file.
                </div>
                <button v-for="cov in coverages" :key="cov.uuid"
                    class="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all"
                    :class="selCovUuid === cov.uuid ? 'border-[#1e5bb9] bg-blue-50/60' : 'border-slate-200/80 bg-white hover:border-blue-300'"
                    @click="selCovUuid = cov.uuid">
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        :class="selCovUuid === cov.uuid ? 'border-[#1e5bb9]' : 'border-slate-300'">
                        <div v-if="selCovUuid === cov.uuid" class="w-2.5 h-2.5 rounded-full bg-[#1e5bb9]" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <p class="text-sm font-bold text-slate-800">{{ cov.scheme_name }}</p>
                            <span class="font-mono text-[10px] bg-blue-50 text-[#1e5bb9] px-1.5 py-0.5 rounded">{{
                                cov.scheme_code }}</span>
                            <span v-if="cov.is_primary"
                                class="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">Primary</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">{{ cov.provider }} · {{ cov.membership_number }}</p>
                    </div>
                </button>
            </div>
            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showInsModal = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-[#1e5bb9] hover:bg-[#1a4fa3] text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    :disabled="insSaving || !selCovUuid" @click="submitInsurance">
                    <font-awesome-icon v-if="insSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'shield-halved']" />
                    {{ insSaving ? 'Saving…' : 'Attach Insurance' }}
                </button>
            </template>
        </Modal>

        <!-- ══ ADD ITEM MODAL (Encounter / Lab / Radiology) ══════════════════════ -->
        <Modal v-model="showAddModal" :title="addModalTitle" size="lg" class="max-w-[70%]">
            <div class="space-y-4">
                <!-- Search bar -->
                <div class="relative">
                    <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                        class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                    <input v-model="addSearch" type="text"
                        :placeholder="`Search ${addSection === 'enc' ? 'services' : addSection === 'lab' ? 'lab tests' : 'radiology'}…`"
                        class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9] transition-all bg-slate-50" />
                </div>
                <p class="text-xs text-slate-400">{{ addSelUuids.length }} selected</p>

                <!-- Loading -->
                <div v-if="addLoading" class="space-y-2">
                    <SkeletonBase v-for="i in 4" :key="i" width="100%" height="2rem" />
                </div>

                <!-- Table — enc: name + price; lab/rad: name + dept + price -->
                <div v-else class="overflow-hidden rounded-xl border border-slate-200/80">
                    <!-- Encounter table -->
                    <table v-if="addSection === 'enc'" class="w-full text-left">
                        <thead>
                            <tr
                                class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th class="px-4 py-3 w-8" />
                                <th class="px-4 py-3">Service</th>
                                <th class="px-4 py-3 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100/60 max-h-72 overflow-y-auto block">
                            <tr v-for="item in (visibleAddItems as EncPrice[])" :key="item.uuid"
                                class="hover:bg-slate-50 transition-colors cursor-pointer"
                                @click="toggleAddSel(item.uuid)">
                                <td class="px-4 py-3">
                                    <div class="w-4 h-4 rounded border-2 flex items-center justify-center"
                                        :class="addSelUuids.includes(item.uuid) ? 'bg-[#1e5bb9] border-[#1e5bb9]' : 'border-slate-300'">
                                        <font-awesome-icon v-if="addSelUuids.includes(item.uuid)"
                                            :icon="['fas', 'check']" class="text-white text-[8px]" />
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <p class="text-sm text-slate-700">{{ item.name }}</p>
                                    <p class="text-[10px] font-mono text-slate-400">{{ item.code }}</p>
                                </td>
                                <td class="px-4 py-3 text-right font-mono text-xs font-bold text-slate-700">
                                    {{ item.price?.[0]?.currency }}{{ Number(item.price?.[0]?.amount ??
                                        0).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}
                                </td>
                            </tr>
                            <tr v-if="!visibleAddItems.length">
                                <td colspan="3" class="px-4 py-8 text-center text-sm text-slate-400">No results</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Lab / Rad table -->
                    <table v-else class="w-full text-left">
                        <thead>
                            <tr
                                class="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th class="px-4 py-3 w-8" />
                                <th class="px-4 py-3">Name</th>
                                <th class="px-4 py-3">Department</th>
                                <th class="px-4 py-3 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100/60">
                            <tr v-for="item in (visibleAddItems as (LabPrice | RadPrice)[])" :key="item.uuid"
                                class="hover:bg-slate-50 transition-colors cursor-pointer max-h-72 overflow-y-auto"
                                @click="toggleAddSel(item.uuid)">
                                <td class="px-4 py-3">
                                    <div class="w-4 h-4 rounded border-2 flex items-center justify-center"
                                        :class="addSelUuids.includes(item.uuid) ? 'bg-[#1e5bb9] border-[#1e5bb9]' : 'border-slate-300'">
                                        <font-awesome-icon v-if="addSelUuids.includes(item.uuid)"
                                            :icon="['fas', 'check']" class="text-white text-[8px]" />
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <p class="text-sm text-slate-700 leading-snug">{{ item.name }}</p>
                                    <p class="text-[10px] font-mono text-slate-400">{{ item.code }}</p>
                                </td>
                                <td class="px-4 py-3 text-xs text-slate-400">{{ item.department }}</td>
                                <td class="px-4 py-3 text-right font-mono text-xs font-bold text-slate-700">
                                    {{ item.price?.[0]?.currency }}{{ Number(item.price?.[0]?.amount ??
                                        0).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}
                                </td>
                            </tr>
                            <tr v-if="!visibleAddItems.length">
                                <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-400">No results</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showAddModal = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-[#1e5bb9] hover:bg-[#1a4fa3] text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    :disabled="addSaving || !addSelUuids.length" @click="submitAdd">
                    <font-awesome-icon v-if="addSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'plus']" />
                    {{ addSaving ? 'Adding…' : `Add ${addSelUuids.length} Item${addSelUuids.length !== 1 ? 's' : ''}` }}
                </button>
            </template>
        </Modal>

        <!-- ══ ADJUST BILLING TAXES MODAL ═════════════════════════════════════════ -->
        <Modal v-model="showTaxModal" title="Adjust Billing Taxes"
            subtitle="Select the taxes to apply to this pre-costing" :show-logo="false" size="md" class="max-w-[70%]">
            <div class="space-y-3">
                <AppAlert v-if="taxError" type="error" :title="taxError" />
                <div v-if="taxLoading" class="space-y-2">
                    <SkeletonBase v-for="i in 3" :key="i" width="100%" height="2rem" />
                </div>
                <template v-else>
                    <p class="text-xs text-slate-400">{{ selTaxIds.length }} selected</p>
                    <button v-for="t in taxes" :key="t.id"
                        class="w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 transition-all"
                        :class="selTaxIds.includes(t.id) ? 'border-[#1e5bb9] bg-blue-50/60' : 'border-slate-200/80 bg-white hover:border-blue-300'"
                        @click="toggleTax(t.id)">
                        <div class="w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            :class="selTaxIds.includes(t.id) ? 'bg-[#1e5bb9] border-[#1e5bb9]' : 'border-slate-300'">
                            <font-awesome-icon v-if="selTaxIds.includes(t.id)" :icon="['fas', 'check']"
                                class="text-white text-[9px]" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <p class="text-sm font-bold text-slate-800">{{ t.name }}</p>
                                <span class="font-mono text-[10px] bg-blue-50 text-[#1e5bb9] px-1.5 py-0.5 rounded">{{
                                    t.code }}</span>
                                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    :class="t.mode === 'collect' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'">
                                    {{ t.mode === 'collect' ? 'Collect' : 'Deduct' }}
                                </span>
                            </div>
                            <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ t.description }}</p>
                        </div>
                    </button>
                    <p v-if="!taxes.length" class="py-6 text-center text-sm text-slate-400">No taxes configured.</p>
                </template>
            </div>
            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showTaxModal = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-[#1e5bb9] hover:bg-[#1a4fa3] text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    :disabled="taxSaving" @click="submitTaxes">
                    <font-awesome-icon v-if="taxSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'floppy-disk']" />
                    {{ taxSaving ? 'Saving…' : 'Save Taxes' }}
                </button>
            </template>
        </Modal>

        <!-- ══ UPLOAD INSURANCE FORM MODAL ════════════════════════════════════════ -->
        <Modal v-model="showUploadModal" title="Upload Completed Form" subtitle="Attach the filled insurance form(s)"
            :show-logo="false" size="md">
            <div class="space-y-3">
                <AppAlert v-if="uploadError" type="error" :title="uploadError" />
                <AppAlert v-if="uploadSuccess" type="success" :title="uploadSuccess" />

                <!-- Drag & drop / browse -->
                <label
                    class="block cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors"
                    :class="uploadDragging ? 'border-[#1e5bb9] bg-blue-50/60' : 'border-slate-300 bg-slate-50 hover:border-blue-300'"
                    @dragover.prevent="uploadDragging = true" @dragleave.prevent="uploadDragging = false"
                    @drop.prevent="onUploadDrop">
                    <font-awesome-icon :icon="['fas', 'cloud-arrow-up']" class="text-3xl text-slate-300" />
                    <p class="mt-2 text-sm font-semibold text-slate-600">Drag &amp; drop files here</p>
                    <p class="text-xs text-slate-400">or <span class="text-[#1e5bb9] font-semibold">browse</span> to
                        choose —
                        images or PDFs</p>
                    <input type="file" multiple accept="image/*,application/pdf" class="hidden"
                        @change="onUploadPick" />
                </label>

                <!-- Selected files -->
                <div v-if="uploadFiles.length" class="space-y-1.5">
                    <div v-for="(file, i) in uploadFiles" :key="i"
                        class="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200">
                        <font-awesome-icon :icon="['fas', 'file-lines']" class="text-slate-400 text-sm" />
                        <span class="flex-1 min-w-0 text-sm text-slate-700 truncate">{{ file.name }}</span>
                        <span class="text-[10px] text-slate-400">{{ (file.size / 1024).toFixed(0) }} KB</span>
                        <button class="text-rose-400 hover:text-rose-600 transition-colors"
                            @click="removeUploadFile(i)">
                            <font-awesome-icon :icon="['fas', 'xmark']" class="text-sm" />
                        </button>
                    </div>
                </div>
            </div>
            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showUploadModal = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-[#1e5bb9] hover:bg-[#1a4fa3] text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    :disabled="uploadSaving || !uploadFiles.length" @click="submitUpload">
                    <font-awesome-icon v-if="uploadSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'cloud-arrow-up']" />
                    {{ uploadSaving ? 'Uploading…' : `Upload ${uploadFiles.length || ''} File${uploadFiles.length !== 1
                        ? 's' : ''}`.trim() }}
                </button>
            </template>
        </Modal>

        <!-- ══ VIEW UPLOADED FORMS MODAL ══════════════════════════════════════════ -->
        <Modal v-model="showFormsModal" title="Insurance Forms" subtitle="View the uploaded form(s)" :show-logo="false"
            size="xl" class="max-w-[98%]">
            <div class="space-y-5">
                <div v-for="form in (detail?.insurance.filled_forms_urls ?? [])" :key="form.id"
                    class="rounded-xl border border-slate-200 overflow-hidden">
                    <div
                        class="flex items-center justify-between gap-3 bg-slate-50 border-b border-slate-100 px-4 py-2.5">
                        <p class="text-sm font-semibold text-slate-700 truncate">
                            <font-awesome-icon :icon="['fas', 'file-lines']" class="text-slate-400 mr-2" /> Upload
                            Number {{
                            form.id }}
                        </p>
                    </div>
                    <iframe :src="form.url" class="w-full h-[60vh] bg-white" :title="fileNameFromUrl(form.url)" />
                </div>
                <p v-if="!(detail?.insurance.filled_forms_urls?.length)"
                    class="py-8 text-center text-sm text-slate-400">No
                    forms uploaded.</p>
            </div>
            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showFormsModal = false">Close</button>
            </template>
        </Modal>

    </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

const { denied } = usePageGuard(['pre_costing_view', 'pre_costing_create'])

interface PcLineItem {
    uuid?: string; price_uuid?: string; type?: string; name: string; currency: string
    base_amount: number; adjusted_amount: number; discount_amount: number; total_amount: number
    insurance_coverage: { percentage: number; per_encounter_limit: number; annual_limit: number }
}
interface PcTax { name: string; mode: string; percentage: number; tax_amount: number }
interface BillingTax { id: number; name: string; code: string; mode: string; description: string }
interface Coverage { uuid: string; scheme_name: string; scheme_code: string; provider: string; membership_number: string; is_primary: boolean; direct_billing: boolean }
interface EncPrice { uuid: string; name: string; code: string; price: { currency: string; amount: string | number }[] }
interface LabPrice { uuid: string; name: string; code: string; department: string; price: { currency: string; amount: number }[] }
interface RadPrice { uuid: string; name: string; code: string; department: string; price: { currency: string; amount: number }[] }

interface PreCostDetail {
    uuid: string; no: string; proforma_invoice: { uuid: string; no: string }
    customer: { uuid: string; no: string; full_name: string; preferred_name: string | null; gender: string; date_of_birth: string; age: number; identification: { type: string; number: string; expiry_date: string } | null; phone_primary: string; registered_at: string; registered_by: string }
    insurance: {
        pay_with_insurance: boolean; provider: string | null; scheme: string | null; code: string | null
        membership_number: string | null; requires_preauthorization?: boolean; use_base_price?: boolean
        coverage_regions?: string[]
        filled_forms_urls?: { id: number; url: string; uploaded_on: string }[]
    }
    facility: { facility_name: string; facility_address_line1: string; facility_address_line2: string; facility_phone: string; facility_email: string; tin: string; vat_reg_number: string; pre_costing_validity_terms_days: number }
    currency: string
    encounter_types: PcLineItem[]; laboratory_tests: PcLineItem[]; radiology_images: PcLineItem[]
    total_services: number; total: number; discount: { percentage: number; amount: number }; sub_total: number; total_price: number
    taxation: PcTax[]
    created_by: string; created_at: string; is_approved: boolean; approved_by: string | null; approved_on: string | null
    updated_at: string | null; updated_by: string | null
}
interface DashboardInsurance { has_insurance: boolean; active_coverages: Coverage[] }

const route = useRoute()
const router = useRouter()
const { request } = useApi()

const preCostingUuid = computed(() => route.params.uuid as string)
const customerUuid = computed(() => route.query.customer_uuid as string)

const detail = ref<PreCostDetail | null>(null)
const loading = ref(false)
const { showSkeleton } = useDelayedLoading(loading)
const coverages = ref<Coverage[]>([])

// ── Inline discount editing ────────────────────────────────────────────────
// Tracks which cell is being edited: { section, index }
const editingDiscount = ref<{ section: string; index: number } | null>(null)
const editDiscountVal = ref('')
const discSaving = ref(false)

const startEditDiscount = (section: string, index: number, current: number) => {
    editingDiscount.value = { section, index }
    editDiscountVal.value = current > 0 ? String(current) : ''
}
const cancelEditDiscount = () => { editingDiscount.value = null; editDiscountVal.value = '' }

// Format while typing: "1,000.50"
const fmtDiscInput = (raw: string): string => {
    const stripped = raw.replace(/[^0-9.]/g, '')
    const parts = stripped.split('.')
    const int = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.length > 1 ? `${int}.${(parts[1] ?? '').slice(0, 2)}` : int
}
const onDiscInput = (e: Event) => {
    const v = (e.target as HTMLInputElement).value
    const fmt = fmtDiscInput(v);
    (e.target as HTMLInputElement).value = fmt
    editDiscountVal.value = fmt
}

// Service type tokens sent to the API. Existing line items use their own `type`
// (from loadDetail) when present; these per-section defaults match the API's
// response values and are used when adding brand-new services.
const SERVICE_TYPE: Record<'enc' | 'lab' | 'rad', string> = {
    enc: 'encounter',
    lab: 'laboratory',
    rad: 'imaging',
}
const serviceType = (section: 'enc' | 'lab' | 'rad', item?: PcLineItem) => item?.type || SERVICE_TYPE[section]

const saveDiscount = async () => {
    if (!editingDiscount.value || !detail.value) return
    discSaving.value = true
    const amount = parseFloat(editDiscountVal.value.replace(/,/g, '')) || 0
    const { section, index } = editingDiscount.value
    const items = section === 'enc' ? detail.value.encounter_types : section === 'lab' ? detail.value.laboratory_tests : detail.value.radiology_images
    const item = items[index]
    if (!item) { discSaving.value = false; return }
    try {
        const fd = new FormData()
        fd.append('uuid', customerUuid.value)
        fd.append('pre_costing_uuid', preCostingUuid.value)
        fd.append('service_uuid', item.uuid ?? '')
        fd.append('type', serviceType(section as 'enc' | 'lab' | 'rad', item))
        fd.append('discount_amount', String(amount))
        await request('/customer/pre_costing/service/discount/update', { method: 'PATCH', body: fd })
        await loadDetail()
    } catch { /* silent */ } finally {
        discSaving.value = false
        editingDiscount.value = null
    }
}

// ── Delete item ────────────────────────────────────────────────────────────
const deleteItem = async (section: string, index: number) => {
    if (!detail.value) return
    const items = section === 'enc' ? detail.value.encounter_types : section === 'lab' ? detail.value.laboratory_tests : detail.value.radiology_images
    const item = items[index]
    if (!item) return
    try {
        const fd = new FormData()
        fd.append('uuid', customerUuid.value)
        fd.append('pre_costing_uuid', preCostingUuid.value)
        fd.append('type', serviceType(section as 'enc' | 'lab' | 'rad', item))
        fd.append('service_uuid', item.uuid ?? '')
        await request('/customer/pre_costing/service/delete', { method: 'DELETE', body: fd })
        await loadDetail()
    } catch { /* silent */ }
}

// ── Add item modals ────────────────────────────────────────────────────────
type AddSection = 'enc' | 'lab' | 'rad'
const showAddModal = ref(false)
const addSection = ref<AddSection>('enc')
const addItems = ref<(EncPrice | LabPrice | RadPrice)[]>([])
const addSearch = ref('')
const addLoading = ref(false)
const addSaving = ref(false)
const addSelUuids = ref<string[]>([])
let addDebounce: ReturnType<typeof setTimeout> | null = null

const addModalTitle = computed(() => ({ enc: 'Add Clinical Service', lab: 'Add Laboratory Test', rad: 'Add Radiology' }[addSection.value]))

// price_uuids already present in the current section of the pre-costing — used to
// hide services that have already been added.
const existingPriceUuids = computed(() => {
    if (!detail.value) return new Set<string>()
    const list = addSection.value === 'enc' ? detail.value.encounter_types
        : addSection.value === 'lab' ? detail.value.laboratory_tests
            : detail.value.radiology_images
    return new Set(list.map(i => i.price_uuid).filter(Boolean) as string[])
})
// Items shown in the modal: list-endpoint items whose uuid is NOT already in the pre-costing.
const visibleAddItems = computed(() => addItems.value.filter(i => !existingPriceUuids.value.has(i.uuid)))

const fetchAddItems = async (q = '') => {
    addLoading.value = true
    const cu = customerUuid.value
    const url = addSection.value === 'enc'
        ? `/encounter_types/prices?customer_uuid=${cu}${q ? '&q=' + encodeURIComponent(q) : ''}`
        : addSection.value === 'lab'
            ? `/laboratory_tests/prices?customer_uuid=${cu}${q ? '&q=' + encodeURIComponent(q) : ''}`
            : `/radiology_images/prices?customer_uuid=${cu}${q ? '&q=' + encodeURIComponent(q) : ''}`
    const d = await request<(EncPrice | LabPrice | RadPrice)[]>(url)
    if (d) addItems.value = d
    addLoading.value = false
}

const openAddModal = async (section: AddSection) => {
    addSection.value = section; addSearch.value = ''; addSelUuids.value = []; addItems.value = []
    showAddModal.value = true
    await fetchAddItems()
}

watch(addSearch, (q) => {
    if (addDebounce) clearTimeout(addDebounce)
    addDebounce = setTimeout(() => fetchAddItems(q), 300)
})

const toggleAddSel = (uuid: string) => {
    const i = addSelUuids.value.indexOf(uuid)
    i >= 0 ? addSelUuids.value.splice(i, 1) : addSelUuids.value.push(uuid)
}

const submitAdd = async () => {
    if (!addSelUuids.value.length) return
    addSaving.value = true
    const type = serviceType(addSection.value)
    try {
        // Endpoint accepts one service per call; send each selected price uuid.
        for (const priceUuid of addSelUuids.value) {
            const fd = new FormData()
            fd.append('uuid', customerUuid.value)
            fd.append('pre_costing_uuid', preCostingUuid.value)
            fd.append('type', type)
            fd.append('service_price_uuid', priceUuid)
            fd.append('discount_amount', '0')
            await request('/customer/pre_costing/service/add', { method: 'PATCH', body: fd })
        }
        await loadDetail()
        showAddModal.value = false
    } catch { /* silent */ } finally {
        addSaving.value = false
    }
}

// ── Approve ────────────────────────────────────────────────────────────────
const showApproveDialog = ref(false)
const approveSaving = ref(false)
const approveError = ref('')
const initialSettlementPercentage = ref(0)

const submitApprove = async () => {
    approveError.value = ''
    if (initialSettlementPercentage.value < 1 || initialSettlementPercentage.value > 100) {
        approveError.value = 'Initial settlement percentage must be between 1 and 100.'
        return
    }
    approveSaving.value = true
    try {
        const fd = {
            uuid: customerUuid.value,
            pre_costing_uuid: preCostingUuid.value,
            initial_settlement_percentage: initialSettlementPercentage.value,
        }
        const res = await request<{ proforma_invoice_uuid: string; message?: string }>(
            '/customer/pre_costing/approve', { method: 'PATCH', body: fd },
        )
        showApproveDialog.value = false
        if (res?.proforma_invoice_uuid) {
            router.push({
                path: `/customers/proforma-invoice/${res.proforma_invoice_uuid}`,
                query: { customer_uuid: customerUuid.value },
            })
        } else {
            await loadDetail()
        }
    } catch (e: unknown) {
        approveError.value = (e as Error).message || 'Approval failed.'
    } finally {
        approveSaving.value = false
    }
}

// ── Add Insurance ──────────────────────────────────────────────────────────
const showInsModal = ref(false)
const selCovUuid = ref('')
const insSaving = ref(false)
const insError = ref('')

const openInsModal = async () => {
    selCovUuid.value = ''; insError.value = ''
    if (!coverages.value.length) {
        const d = await request<{ insurance: DashboardInsurance }>(`/customer/dashboard?uuid=${customerUuid.value}`)
        if (d?.insurance?.active_coverages) coverages.value = d.insurance.active_coverages
    }
    showInsModal.value = true
}

const submitInsurance = async () => {
    insError.value = ''
    if (!selCovUuid.value) { insError.value = 'Select a coverage.'; return }
    insSaving.value = true
    try {
        const fd = new FormData()
        fd.append('uuid', customerUuid.value)
        fd.append('pre_costing_uuid', preCostingUuid.value)
        fd.append('insurance_uuid', selCovUuid.value)
        await request('/customer/pre_costing/insurance/add', { method: 'PATCH', body: fd })
        await loadDetail(); showInsModal.value = false
    } catch (e: unknown) {
        insError.value = (e as Error).message || 'Failed.'
    } finally {
        insSaving.value = false
    }
}

// ── Advanced options menu ────────────────────────────────────────────────────
const showAdvanced = ref(false)

// ── Adjust Billing Taxes ─────────────────────────────────────────────────────
const showTaxModal = ref(false)
const taxes = ref<BillingTax[]>([])
const selTaxIds = ref<number[]>([])
const taxLoading = ref(false)
const taxSaving = ref(false)
const taxError = ref('')

const openTaxModal = async () => {
    showAdvanced.value = false
    taxError.value = ''
    showTaxModal.value = true
    taxLoading.value = true
    try {
        const d = await request<BillingTax[]>('/billing/taxes')
        if (d) taxes.value = d
        // Auto-tick taxes already applied on the pre-costing. Response names include
        // the code in parentheses (e.g. "Value Added Tax (VAT)"), so match on that.
        const applied = detail.value?.taxation?.map(t => t.name) ?? []
        selTaxIds.value = taxes.value
            .filter(t => applied.some(n => n === t.name || n.includes(`(${t.code})`) || n.startsWith(t.name)))
            .map(t => t.id)
    } catch (e: unknown) {
        taxError.value = (e as Error).message || 'Failed to load taxes.'
    } finally {
        taxLoading.value = false
    }
}

const toggleTax = (id: number) => {
    const i = selTaxIds.value.indexOf(id)
    i >= 0 ? selTaxIds.value.splice(i, 1) : selTaxIds.value.push(id)
}

const submitTaxes = async () => {
    taxError.value = ''; taxSaving.value = true
    try {
        const fd = new FormData()
        fd.append('uuid', customerUuid.value)
        fd.append('pre_costing_uuid', preCostingUuid.value)
        // Sent as an array (billing_taxes[]); if none selected the array is simply empty.
        selTaxIds.value.forEach(id => fd.append('billing_taxes[]', String(id)))
        await request('/customer/pre_costing/taxes/update', { method: 'PATCH', body: fd })
        await loadDetail()
        showTaxModal.value = false
    } catch (e: unknown) {
        taxError.value = (e as Error).message || 'Failed to update taxes.'
    } finally {
        taxSaving.value = false
    }
}

// ── Upload insurance completed form ──────────────────────────────────────────
const showUploadModal = ref(false)
const uploadFiles = ref<File[]>([])
const uploadSaving = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const uploadDragging = ref(false)

// ── View uploaded forms ───────────────────────────────────────────────────────
const showFormsModal = ref(false)

const openUploadModal = () => {
    uploadFiles.value = []
    uploadError.value = ''
    uploadSuccess.value = ''
    showUploadModal.value = true
}
const onUploadPick = (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (files) uploadFiles.value.push(...Array.from(files))
}
const onUploadDrop = (e: DragEvent) => {
    uploadDragging.value = false
    if (e.dataTransfer?.files) uploadFiles.value.push(...Array.from(e.dataTransfer.files))
}
const removeUploadFile = (i: number) => uploadFiles.value.splice(i, 1)

const submitUpload = async () => {
    uploadError.value = ''
    if (!uploadFiles.value.length) { uploadError.value = 'Please select a file.'; return }
    uploadSaving.value = true
    try {
        const fd = new FormData()
        fd.append('uuid', customerUuid.value)
        fd.append('pre_costing_uuid', preCostingUuid.value)
        // Multiple files supported — sent as an array.
        uploadFiles.value.forEach(file => fd.append('filled_forms[]', file))
        await request('/customer/pre_costing/insurance/completed_form/upload', { method: 'PATCH', body: fd })
        uploadSuccess.value = 'Uploaded.'                 // shows alongside the spinner during refresh
        await loadDetail()                                // keep loading state until fully reloaded
        showUploadModal.value = false; uploadSuccess.value = ''  // close only after loadDetail resolves
    } catch (e: unknown) {
        uploadError.value = (e as Error).message || 'Failed.'
    } finally {
        uploadSaving.value = false
    }
}

// Filename helper for the forms viewer.
const fileNameFromUrl = (url: string) => {
    try { return decodeURIComponent((url.split('?')[0] ?? url).split('/').pop() || 'form') } catch { return 'form' }
}

// ── QR code and Barcode ───────────────────────────────────────────────────────────────────
const qrDataUrl = ref('')
const barcodeDataUrl = ref('')

// Build both codes from d.no as PNG data URLs (client-only)
const generateCodes = async (value: string) => {
    if (!import.meta.client || !value) return

    // QR → render at 240px for crisp 80px print box; margin:1 = scannable quiet zone
    qrDataUrl.value = await QRCode.toDataURL(value, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#1e293b', light: '#00000000' }, // transparent bg to match card
    })

    // Barcode (CODE128) → off-DOM canvas → PNG
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, value, {
        format: 'CODE128',
        displayValue: false,
        height: 38,
        width: 2,
        margin: 0,
        lineColor: '#1e293b',
        background: 'transparent', // switch to '#ffffff' if scanners struggle on glass bg
    })
    barcodeDataUrl.value = canvas.toDataURL('image/png')
}

// Regenerate whenever the document number changes
watch(() => detail.value?.no, (no) => { if (no) generateCodes(no) }, { immediate: true })

const loadDetail = async () => {
    loading.value = true
    const d = await request<PreCostDetail>(`/customer/pre_costing/show?uuid=${customerUuid.value}&pre_costing_uuid=${preCostingUuid.value}`)
    if (d) detail.value = d
    loading.value = false
}

onMounted(async () => { await loadDetail() })

// ── Document HTML builder ────────────────────────────────────────────────────
// Builds the full self-contained reference-design HTML string.
// Used by both Print (iframe + window.print) and PDF (html2pdf.js).
// footer: true = include the "Created by / © IBCC" footer line.
const buildDocHtml = (includeFooter: boolean): string => {
    if (!detail.value) return ''
    const d = detail.value
    const fA = (currency: string, amount: number) => {
        const abs = Math.abs(amount)
        const formatted = `${currency}${abs.toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        return amount < 0 ? `(${formatted})` : formatted
    }
    const fD = (s: string | null | undefined) =>
        s ? new Date(s).toLocaleDateString('en-MW', { dateStyle: 'medium' }) : '—'
    const fDT = (s: string | null | undefined) =>
        s ? new Date(s).toLocaleString('en-MW', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

    const cT = d.taxation.filter(t => t.mode === 'collect')
    const dT = d.taxation.filter(t => t.mode === 'deduct')

    const qrBlock = qrDataUrl.value
        ? `<img src="${qrDataUrl.value}" alt="QR ${d.no}" style="width:80px;height:80px;flex-shrink:0;"/>`
        : `<div style="width:150px;height:150px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8;text-align:center;flex-shrink:0;">QR<br>CODE</div>`

    const barcode = barcodeDataUrl.value
        ? `<img src="${barcodeDataUrl.value}" alt="${d.no}" style="height:38px;width:150px;object-fit:contain;display:block;"/>`
        : ''

    const mkRow = (it: { name: string; currency: string; base_amount: number; adjusted_amount: number; discount_amount: number; total_amount: number }) =>
        `<tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:11px 20px;font-size:12px;color:#334155;line-height:1.4;">${it.name}</td>
          <td style="padding:11px 14px;text-align:right;font-family:ui-monospace,monospace;font-size:11px;color:#64748b;white-space:nowrap;">${fA(it.currency, it.adjusted_amount)}</td>
          <td style="padding:11px 14px;text-align:right;white-space:nowrap;">${it.discount_amount > 0
            ? `<span style="color:#059669;font-weight:700;font-size:11px;">${fA(it.currency, it.discount_amount)}</span>`
            : `<span style="color:#cbd5e1;font-size:13px;">—</span>`}</td>
          <td style="padding:11px 14px;text-align:right;font-weight:700;font-size:12px;color:#1e293b;white-space:nowrap;">${fA(it.currency, it.total_amount)}</td>
        </tr>`

    const sectionHeader = (label: string, color: string) =>
        `<tr style="background:#f8fafc;"><td colspan="5" style="padding:8px 20px;font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.08em;">${label}</td></tr>`

    const taxRows = [
        ...cT.map(t => `<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;padding:3px 0;"><span style="color:#94a3b8;">+${t.percentage}% <span style="color:#64748b;">${t.name}</span></span><span style="color:#1e5bb9;font-weight:700;white-space:nowrap;">${fA(d.currency, t.tax_amount)}</span></div>`),
        ...dT.map(t => `<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;padding:3px 0;"><span style="color:#94a3b8;">-${t.percentage}% <span style="color:#64748b;">${t.name}</span></span><span style="color:#f97316;font-weight:700;white-space:nowrap;">${fA(d.currency, t.tax_amount)}</span></div>`),
    ].join('')

    const insBlock = d.insurance.pay_with_insurance
        ? `<span style="background:#ecfdf5;color:#047857;font-size:10px;font-weight:700;padding:5px 12px;border-radius:8px;border:1px solid #d1fae5;display:inline-flex;align-items:center;gap:5px;">✓ ${d.insurance.scheme} (${d.insurance.code})</span>`
        : `<span style="color:#94a3b8;font-style:italic;font-size:10px;">No insurance</span>`

    const tin = d.facility.tin
        ? `<span style="background:#DBDBDB;color:#2E2E2E;font-size:8px;font-weight:700;padding:5px 12px;border-radius:8px;border:1px solid #DBDBDB;display:inline-flex;align-items:center;gap:5px;">TIN: ${d.facility.tin}</span>`
        : `<span style="color:#DBDBDB;font-style:italic;font-size:8px;">No TIN</span>`

    const vrn = d.facility.vat_reg_number
        ? `<span style="background:#DBDBDB;color:#2E2E2E;font-size:8px;font-weight:700;padding:5px 12px;border-radius:8px;border:1px solid #DBDBDB;display:inline-flex;align-items:center;gap:5px;">VAT REG: ${d.facility.vat_reg_number}</span>`
        : `<span style="color:#DBDBDB;font-style:italic;font-size:8px;">No Vat Reg Number</span>`

    const footerHtml = includeFooter
        ? `<div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#94a3b8;padding:8px 0 0;">
            <p style="margin:0;">Created by <strong style="color:#475569;text-transform:uppercase;">${d.created_by}</strong> on ${fDT(d.created_at)}</p>
            <p style="margin:0;text-transform:uppercase;letter-spacing:.08em;">© ${new Date().getFullYear()} Island Health Information Systems</p>
           </div>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${d.no}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:Inter,sans-serif;
      background:linear-gradient(135deg,#e0e7ff 0%,#f1f5f9 100%);
      min-height:100vh;
      padding:20px;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .wrap{max-width:760px;margin:0 auto;}
    /* Island card — white glass panel */
    .card{
      background:rgba(255,255,255,0.94);
      border-radius:18px;
      border:1px solid rgba(226,232,240,0.9);
      margin-bottom:14px;
    }
    /* Three-column header grid */
    .hdr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;padding:24px;align-items:start;}
    /* Inner glass sub-card */
    .sub{background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.6);border-radius:12px;padding:14px;}
    table{width:100%;border-collapse:collapse;}
    thead{display:table-header-group;}
    tr{page-break-inside:avoid;}
    @page{margin:8mm;size:A4;}
    @media print{
      body{background:linear-gradient(135deg,#e0e7ff 0%,#f1f5f9 100%)!important;padding:8px!important;}
      .card{border-radius:14px!important;}
    }
  </style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="card hdr">
    <!-- Left: QR + Issue + Facility -->
    <div>
      <div class="sub">
        <div style="">
          ${qrBlock}
          <div>
            <p style="font-size:12px;font-weight:700;color:#1e5bb9;margin-bottom:6px;">${d.no}</p>
            <span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:9999px;background:#dcfce7;color:#047857;font-size:9px;font-weight:700;border:1px solid #bbf7d0;">
              <span style="width:4px;height:4px;border-radius:50%;background:#10b981;margin-right:4px;display:inline-block;"></span>VALID ESTIMATE
            </span>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(226,232,240,.5);">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:10px;">
                ${d.insurance.pay_with_insurance ? 'Insurance Payment Pre-Costing' : 'Cash Payment Pre-Costing'}
            </p>
            <p style="font-size:12px;font-weight:700;color:#1e5bb9;margin-bottom:2px;line-height:1.3;">${d.facility.facility_name}</p>
            <p style="font-size:10px;color:#64748b;margin-bottom:1px;">📍 ${d.facility.facility_address_line1}, ${d.facility.facility_address_line2}</p>
            <p style="font-size:10px;color:#64748b;">📞 ${d.facility.facility_phone}</p>
            <p style="font-size:10px;color:#64748b;">${d.facility.facility_email}</p>
            <p style="font-size:10px;color:#64748b;">Estimate valid for ${d.facility.pre_costing_validity_terms_days} days · due
                                <span style="font-size:10px;font-weight:700;color:#64748b;">${validUntil.value}</span>
            </p>
            ${tin} ${vrn}
        </div>
      </div>
    </div>
    <!-- Centre: Logo -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:8px;">
      <img src="${window.location.origin}/images/ibcc_logo.png" alt="IBCC" style="height:80px;width:auto;" onerror="this.style.display='none'"/>
      <p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.22em;text-align:center;line-height:1.7;margin-top:12px;">International Blantyre<br>Cancer Centre</p>
      <div style="height:2px;width:28px;background:rgba(30,91,185,.25);border-radius:9999px;margin-top:10px;"></div>
    </div>
    <!-- Right: Customer -->
    <div style="text-align:left;">
      <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:5px;">Customer Details</p>
      <div style="background:rgba(255,255,255,.65);padding:14px;border-radius:12px;border:1px solid rgba(226,232,240,.6);display:inline-block;text-align:right;">
        <p style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:3px;">${d.customer.full_name}</p>
        <p style="font-size:10px;color:#64748b;margin-bottom:2px;">Gender: ${d.customer.gender.charAt(0).toUpperCase() + d.customer.gender.slice(1)}</p>
        <p style="font-size:10px;color:#64748b;margin-bottom:2px;">Date of Birth: ${fD(d.customer.date_of_birth)}</p>
        <p style="font-size:10px;color:#64748b;">Phone Number: ${d.customer.phone_primary}</p>
      </div>
      ${d.insurance.pay_with_insurance ? `
      <div style="margin-top:10px;">
        <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:5px;">Insurance</p>
        <p style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:3px;">${d.insurance.provider}</p>
        <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:5px;">Scheme: ${insBlock}</p>
        <p style="font-size:10px;color:#64748b;margin-bottom:2px;">Membership Number: ${d.insurance.membership_number}</p>
      </div>` : `
      <div style="margin-top:10px;">
        <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:5px;">Insurance</p>
        <p style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:3px;">No Insurance</p>
        <br>
      </div>`}
    </div>
  </div>

  <!-- LINE ITEMS -->
  <div class="card">
    <table>
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="padding:12px 20px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;text-align:left;">Item Description</th>
          <th style="padding:12px 14px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;text-align:right;">Cost</th>
          <th style="padding:12px 14px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;text-align:right;">Discount</th>
          <th style="padding:12px 14px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${sectionHeader('🏥 Clinical Services', '#1e5bb9')}
        ${d.encounter_types.map(mkRow).join('')}
        ${sectionHeader('🧪 Laboratory Tests', '#475569')}
        ${d.laboratory_tests.map(mkRow).join('')}
        ${sectionHeader('🔬 Radiology', '#7c3aed')}
        ${d.radiology_images.map(mkRow).join('')}
      </tbody>
    </table>

    <!-- TOTALS SECTION -->
    <div style="padding:20px;background:rgba(248,250,252,.5);border-top:1px solid #f1f5f9;">
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">

        <!-- Left: Summary + Signature + Barcode -->
        <div style="flex:1;min-width:240px;">
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px;">Summary</p>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:#10b981;flex-shrink:0;display:inline-block;"></span>
            <p style="font-size:12px;color:#475569;">Gross (${d.total_services} services): <strong style="color:#1e293b;">${fA(d.currency, d.total)}</strong></p>
          </div>
          ${d.discount.amount
            ? `<div style="display:flex;align-items:center;gap:6px;"><span style="width:6px;height:6px;border-radius:50%;background:#fb923c;flex-shrink:0;display:inline-block;"></span><p style="font-size:12px;color:#059669;font-weight:600;">Total Discount (${d.discount.percentage}%): ${fA(d.currency, d.discount.amount)}</p></div>`
            : ''}
          <!-- Signature -->
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(226,232,240,.6);">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;">Customer Signature</p>
            <div style="display:flex;gap:14px;align-items:flex-end;">
              <div style="flex:1;"><div style="border-bottom:1px solid #cbd5e1;height:30px;"></div><p style="font-size:8px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Authorized Signature</p></div>
              <div><div style="border-bottom:1px solid #cbd5e1;width:100px;height:30px;"></div><p style="font-size:8px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Date</p></div>
            </div>
          </div>
          <!-- Barcode + facility line -->
            <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(226,232,240,.6);align-items:center;">
                ${barcode}
            </div>
            <p style="font-size:12px;font-weight:700;color:#00000;margin-bottom:6px;">${d.no}</p>
            
            <p style="font-size:9px;color:#94a3b8;line-height:1.5;">${d.facility.facility_name} • ${d.facility.facility_address_line1}, ${d.facility.facility_address_line2} • ${d.facility.facility_phone}</p>
            <p style="font-size:9px;color:#94a3b8;line-height:1.5;">Generated On: ${fD(d.created_at)}</p>
        </div>

        <!-- Right: Tax breakdown + Total -->
        <div style="width:240px;flex-shrink:0;">
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;padding-bottom:7px;border-bottom:1px solid #e2e8f0;">
            <span>Sub-total</span><span style="white-space:nowrap;">${fA(d.currency, d.sub_total)}</span>
          </div>
          <div style="padding:8px 0;border-bottom:1px solid #e2e8f0;margin-bottom:8px;">${taxRows}</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:14px;font-weight:700;color:#1e293b;">Total Price</span>
            <span style="font-size:20px;font-weight:900;color:#1e5bb9;letter-spacing:-.04em;white-space:nowrap;">${fA(d.currency, d.total_price)}</span>
          </div>
        </div>

      </div>
    </div>
  </div>

  ${footerHtml}

</div>
</body>
</html>`
}

// ── Print — hidden iframe triggers browser print dialog ───────────────────
// The iframe renders the full reference-design document in isolation so only
// the document content appears in the print dialog / print preview.
// Footer ("Created by…") is excluded from print output.
const printDoc = () => {
    const html = buildDocHtml(false)
    if (!html) return
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;opacity:0;pointer-events:none;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }
    doc.open(); doc.write(html); doc.close()
    const win = iframe.contentWindow
    if (win) {
        // Wait for fonts then open the print dialog
        const ready = (win as Window & { fonts?: FontFaceSet }).fonts?.ready
        const doPrint = () => { win.focus(); win.print() }
        ready ? ready.then(doPrint) : setTimeout(doPrint, 800)
    }
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 8000)
}

// ── Download PDF — uses html2pdf.js loaded inside a visible iframe ─────────
// html2pdf.js renders the document to canvas via html2canvas then saves a
// real binary .pdf file — no print dialog, no user action required.
// The iframe is sized off-screen but must have dimensions for html2canvas to
// render correctly. It is removed after the download fires.
const downloadPdf = () => {
    const html = buildDocHtml(false)
    if (!detail.value || !html) return
    const filename = `${detail.value.no}.pdf`

    // Inject a full-size off-screen iframe that loads html2pdf from CDN
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:0;width:794px;height:3000px;border:0;z-index:-1;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }

    // Inject the document HTML + html2pdf CDN + auto-download trigger
    const pdfHtml = html.replace('</body>', `
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>
(function() {
  var el = document.querySelector('.wrap');
  var opt = {
    margin:       [6, 6, 6, 6],
    filename:     '${filename}',
    image:        { type: 'jpeg', quality: 0.97 },
    html2canvas:  {
      scale: 2,
      useCORS: true,
      backgroundColor: '#e0e7ff',
      logging: false,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: 'css', avoid: 'tr' }
  };
  // Wait for fonts then generate
  document.fonts.ready.then(function() {
    html2pdf().set(opt).from(el).save().then(function() {
      parent.postMessage('pdf-done', '*');
    });
  });
})();
<\/script>
</body>`)

    doc.open(); doc.write(pdfHtml); doc.close()

    // Listen for completion message then clean up the iframe
    const onMsg = (e: MessageEvent) => {
        if (e.data === 'pdf-done') {
            window.removeEventListener('message', onMsg)
            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 500)
        }
    }
    window.addEventListener('message', onMsg)
    // Safety fallback — remove after 30 s if message never arrives
    setTimeout(() => {
        window.removeEventListener('message', onMsg)
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
    }, 30000)
}

// ── Helpers ────────────────────────────────────────────────────────────────
const f = (currency: string, amount: number) => {
    const abs = Math.abs(amount)
    const formatted = `${currency}${abs.toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return amount < 0 ? `(${formatted})` : formatted
}

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-MW', { dateStyle: 'medium' }) : '—'

const fmtDateTime = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString('en-MW', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const collectTaxes = computed(() => detail.value?.taxation.filter(t => t.mode === 'collect') ?? [])
const deductTaxes = computed(() => detail.value?.taxation.filter(t => t.mode === 'deduct') ?? [])

// Due date = created_at + validity terms days, e.g. "02 April 2026"
const validUntil = computed(() => {
    if (!detail.value) return '—'
    const d = new Date(detail.value.created_at)
    d.setDate(d.getDate() + (detail.value.facility.pre_costing_validity_terms_days || 0))
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
})

const encAmt = (i: EncPrice) => Number(i.price?.[0]?.amount ?? 0)
const labAmt = (i: LabPrice) => Number(i.price?.[0]?.amount ?? 0)
const radAmt = (i: RadPrice) => Number(i.price?.[0]?.amount ?? 0)

// Barcode lines — pseudo Code128 visual (decorative, non-scannable)
const barWidths = Array.from({ length: 80 }, () => Math.random() > 0.5 ? 'w-[2px]' : 'w-[1px]')
</script>

<style scoped>
/*
  Print and PDF are both handled by the hidden iframe approach — the iframe
  contains its own fully self-contained HTML/CSS document matching the
  reference design, so no @media print rules are needed here.
  The only thing we hide on screen are print-only decorative elements that
  live inside #printable-area (QR, barcode) — those render inside the iframe.
*/
@media screen {
    .print-only {
        display: none !important;
    }
}
</style>