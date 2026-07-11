<!-- app/pages/customers/proforma-invoice/[uuid].vue -->
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
                <NuxtLink
                    :to="{ path: `/customers/pre-costing/${detail?.pre_costing.uuid}`, query: { customer_uuid: customerUuid } }"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
                    <font-awesome-icon :icon="['fas', 'file']" class="text-[11px]" />Pre-Costing
                </NuxtLink>
                <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
                <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
                    <font-awesome-icon :icon="['fas', 'file-invoice']" class="text-[11px] text-primary" />Proforma
                    Invoice
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
                        <h1 class="text-white font-bold text-base tracking-tight font-mono">
                            Proforma Invoice for {{ detail.customer.full_name }} ({{ detail.no }})
                        </h1>
                        <span v-if="detail.is_settled"
                            class="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold bg-green-400/20 text-green-200 border border-green-300/20 px-2.5 py-1 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-400" />Settled by {{ detail.settled_by }} on
                            {{ fmtDate(detail.settled_on) }}
                        </span>
                        <span v-else
                            class="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold bg-white/15 text-white/75 border border-white/10 px-2.5 py-1 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />Outstanding
                            {{ f(detail.currency, Number(detail.outstanding)) }}
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Settle -->
                        <button v-if="!detail.is_settled"
                            class="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md"
                            @click="openSettle">
                            <font-awesome-icon :icon="['fas', 'money-bill-wave']" class="text-xs" />Settle Invoice
                        </button>
                        <span v-else
                            class="flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/10 text-white/60 py-2 px-3.5 rounded-xl cursor-not-allowed">
                            <font-awesome-icon :icon="['fas', 'lock']" class="text-xs" />Settled
                        </span>
                        <!-- Schedule Visit -->
                        <button v-if="detail.to_be_scheduled"
                            class="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md"
                            @click="openSchedule">
                            <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-xs" />Schedule Visit
                        </button>

                        <!-- Advanced options dropdown -->
                        <div class="relative">
                            <button
                                class="flex items-center gap-1.5 bg-gray-300 hover:bg-white/20 border border-gray-300 text-gray-600 hover:text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-all"
                                @click="showAdvanced = !showAdvanced">
                                <font-awesome-icon :icon="['fas', 'sliders']" class="text-xs" />Advanced Options
                                <font-awesome-icon :icon="['fas', 'chevron-down']"
                                    class="text-[9px] transition-transform" :class="showAdvanced ? 'rotate-180' : ''" />
                            </button>

                            <div v-if="showAdvanced" class="fixed inset-0 z-40" @click="showAdvanced = false" />

                            <transition enter-active-class="transition ease-out duration-150"
                                enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                                leave-active-class="transition ease-in duration-100"
                                leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
                                <div v-if="showAdvanced"
                                    class="absolute right-0 mt-2 w-60 z-50 rounded-2xl bg-white shadow-2xl border border-slate-100 p-1.5 origin-top-right"
                                    style="box-shadow:0 20px 50px -12px rgba(0,0,0,0.25);">
                                    <button
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="openReceiptsModal">
                                        <font-awesome-icon :icon="['fas', 'receipt']"
                                            class="text-xs text-slate-400 w-4" />View Receipts
                                    </button>
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
                                    <template v-if="detail.insurance.filled_forms_urls?.length">
                                        <div class="my-1 border-t border-slate-100" />
                                        <button
                                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                            @click="showAdvanced = false; showFormsModal = true">
                                            <font-awesome-icon :icon="['fas', 'file-circle-check']"
                                                class="text-xs text-slate-400 w-4" />View Insurance Forms
                                        </button>
                                    </template>
                                    <button
                                        class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                        @click="router.push({ path: `/customers/pre-costing/${detail.pre_costing.uuid}`, query: { customer_uuid: customerUuid } })">
                                        <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" /> View
                                        Pre-costing
                                    </button>
                                </div>
                            </transition>
                        </div>
                    </div>
                </header>

                <!-- Meta strip -->
                <div class="no-print w-full text-right bg-white/60 text-gray-500 rounded-lg py-3 px-4">
                    <p class="text-xs font-bold mt-0.5">
                        Currency: {{ detail.currency }} - Generated on: {{ fmtDate(detail.created_at) }} ({{
                            detail.created_by }}) - Last Modified: {{ fmtDate(detail.updated_at) }} ({{ detail.updated_by ||
                            '—' }})
                    </p>
                </div>

                <!-- ══ INVOICE HEADER — THREE COLUMNS ═════════════════════════════════ -->
                <section
                    class="bg-white/90 rounded-2xl border border-slate-200/80 p-7 grid grid-cols-1 md:grid-cols-3 gap-6 items-start relative overflow-hidden"
                    style="backdrop-filter:blur(12px);">
                    <div class="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none select-none">
                        <font-awesome-icon :icon="['fas', 'hospital']" style="font-size:120px;" />
                    </div>

                    <!-- Left: Issue + Facility -->
                    <div class="space-y-4">
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Details
                            </p>
                            <p class="text-sm font-bold text-slate-800">
                                {{ detail.insurance.pay_with_insurance ? 'Insurance Payment Proforma Invoice' : 'Cash Payment Proforma Invoice' }}
                            </p>
                            <p class="text-xs font-semibold text-slate-700 mt-1">Created At:
                                <span class="font-normal text-slate-500">{{ fmtDate(detail.created_at) }}</span>
                            </p>
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
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Insurance</p>
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
                            <div v-if="detail.insurance.filled_forms_urls?.length"
                                class="pt-1 flex md:justify-start no-print">
                                <button
                                    class="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-lg transition-colors"
                                    @click="showFormsModal = true">
                                    <font-awesome-icon :icon="['fas', 'file-circle-check']" class="text-xs" />View
                                    Form{{
                                        detail.insurance.filled_forms_urls.length > 1 ? 's' : '' }} ({{
                                        detail.insurance.filled_forms_urls.length }})
                                </button>
                            </div>
                        </div>
                        <span v-else class="text-[10px] text-slate-400 italic">No insurance attached</span>
                    </div>
                </section>

                <!-- ══ LINE ITEMS TABLE (read-only) ════════════════════════════════════ -->
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
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100/60">

                            <!-- Each section rendered from a shared template -->
                            <template v-for="grp in sections" :key="grp.key">
                                <tr class="bg-surface-low">
                                    <td :colspan="detail.insurance.pay_with_insurance ? 8 : 5" class="px-7 py-2.5">
                                        <div class="flex items-center gap-2">
                                            <font-awesome-icon :icon="grp.icon" class="text-xs" :class="grp.color" />
                                            <span class="text-[11px] font-bold uppercase tracking-widest"
                                                :class="grp.color">{{ grp.label }}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-for="(item, i) in grp.items" :key="`${grp.key}-${i}`"
                                    class="hover:bg-slate-50/80 transition-colors">
                                    <td class="px-7 py-3.5 text-sm font-medium text-slate-700">{{ item.name }}</td>
                                    <template v-if="detail.insurance.pay_with_insurance">
                                        <td class="bg-blue-100 px-5 py-3.5 text-center font-bold text-xs text-blue-500">
                                            {{ item.insurance_coverage.percentage }}%</td>
                                        <td
                                            class="bg-orange-100 px-5 py-3.5 text-center font-bold text-xs text-orange-500">
                                            {{ item.insurance_coverage.per_encounter_limit ? f(item.currency,
                                                item.insurance_coverage.per_encounter_limit) : "—" }}</td>
                                        <td class="bg-red-100 px-5 py-3.5 text-center font-bold text-xs text-red-500">
                                            {{ item.insurance_coverage.annual_limit ? f(item.currency,
                                                item.insurance_coverage.annual_limit) : "—" }}</td>
                                    </template>
                                    <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{
                                        f(item.currency, item.base_amount) }}</td>
                                    <td class="px-5 py-3.5 text-right font-mono text-xs text-slate-400">{{
                                        f(item.currency, item.adjusted_amount) }}</td>
                                    <td class="px-5 py-3.5 text-right">
                                        <span v-if="item.discount_amount > 0"
                                            class="text-emerald-600 font-bold text-xs">{{ f(item.currency,
                                                item.discount_amount) }}</span>
                                        <span v-else class="text-slate-300">—</span>
                                    </td>
                                    <td class="px-5 py-3.5 text-right font-bold text-sm text-slate-800">{{
                                        f(item.currency, item.total_amount) }}</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>

                    <!-- ── TOTALS FOOTER ──────────────────────────────────────────────── -->
                    <div class="px-7 py-6 border-t border-slate-100" style="background:#f8fafc30;">
                        <div class="flex flex-col md:flex-row justify-between gap-6">

                            <!-- Left: Summary + settlement -->
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
                                        <span class="text-slate-400">+{{ t.percentage }}% <span
                                                class="ml-1 text-slate-500">{{ t.name
                                                }}</span></span>
                                        <span class="text-[#1e5bb9] font-bold tabular-nums">{{ f(detail.currency,
                                            t.tax_amount) }}</span>
                                    </div>
                                    <div v-for="t in deductTaxes" :key="t.name"
                                        class="flex justify-between text-[11px]">
                                        <span class="text-slate-400">-{{ t.percentage }}% <span
                                                class="ml-1 text-slate-500">{{ t.name
                                                }}</span></span>
                                        <span class="text-orange-500 font-bold tabular-nums">{{ f(detail.currency,
                                            t.tax_amount) }}</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-baseline pt-1">
                                    <span class="text-lg font-bold text-slate-800">Total Price</span>
                                    <span class="text-2xl font-black text-[#1e5bb9] tracking-tighter tabular-nums">{{
                                        f(detail.currency, Number(detail.total_price)) }}</span>
                                </div>
                                <!-- Settlement state -->
                                <div class="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5 text-xs">
                                    <div class="flex items-center justify-between gap-6">
                                        <span class="text-slate-400 uppercase tracking-wider font-bold">Total
                                            Paid</span>
                                        <span class="font-bold text-emerald-600 tabular-nums">{{ f(detail.currency,
                                            Number(detail.total_paid)) }}</span>
                                    </div>
                                    <div class="flex items-center justify-between gap-6">
                                        <span
                                            class="text-slate-400 uppercase tracking-wider font-bold">Outstanding</span>
                                        <span class="font-bold tabular-nums"
                                            :class="Number(detail.outstanding) > 0 ? 'text-rose-600' : 'text-emerald-600'">{{
                                                f(detail.currency, Number(detail.outstanding)) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ── Print QR + Barcode (visible only on print) ───────────────────── -->
                <div class="print-only flex justify-between items-end px-2 pt-2">
                    <div class="flex flex-col items-start gap-1">
                        <p class="text-[8px] text-slate-400 uppercase tracking-widest">Scan to verify</p>
                        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="w-16 h-16" />
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <p class="text-[8px] text-slate-400 uppercase tracking-widest">{{ detail.no }}</p>
                        <img v-if="barcodeDataUrl" :src="barcodeDataUrl" alt="barcode" class="h-10 w-auto" />
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

        <!-- ══ SETTLE INVOICE MODAL ══════════════════════════════════════════════ -->
        <Modal v-model="showSettleModal" title="Settle Proforma Invoice"
            subtitle="Record a payment against this invoice" size="md" class="max-w-lg" :close-on-backdrop="false">
            <div class="space-y-4">
                <AppAlert v-if="settleError" type="error" :title="settleError" />

                <div v-if="detail"
                    class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                    <span class="font-mono font-bold text-slate-700">{{ detail.no }}</span>
                    <span class="text-slate-500">Outstanding:
                        <strong class="text-rose-600">{{ f(detail.currency, Number(detail.outstanding)) }}</strong>
                    </span>
                </div>

                <!-- Payment method — search bar -->
                <div class="relative" @click.stop>
                    <label class="block text-sm font-bold text-on-surface mb-1.5">Payment Method</label>
                    <div class="relative">
                        <font-awesome-icon :icon="['fas', 'magnifying-glass']"
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-outline/50" />
                        <input v-model="pmSearch" type="text" placeholder="Search payment methods…"
                            class="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm bg-slate-50 text-on-surface placeholder-outline/50 focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9] transition-all"
                            @focus="showPmDrop = true" @input="showPmDrop = true" />
                    </div>
                    <transition name="dropdown">
                        <div v-if="showPmDrop"
                            class="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl">
                            <div v-if="pmLoading" class="px-4 py-3 space-y-2">
                                <SkeletonBase v-for="i in 3" :key="i" width="100%" height="1.5rem" />
                            </div>
                            <button v-for="m in filtPm" :key="m.id" type="button"
                                class="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                :class="selPm?.id === m.id ? 'bg-blue-50/60' : ''" @click="selectPm(m)">
                                <p class="text-sm font-semibold text-slate-800">{{ m.name }}</p>
                                <p class="text-xs text-slate-400 line-clamp-2">{{ m.description }}</p>
                            </button>
                            <p v-if="!pmLoading && !filtPm.length" class="px-4 py-6 text-center text-sm text-slate-400">
                                No
                                matches</p>
                        </div>
                    </transition>
                </div>

                <!-- Paid amount -->
                <div>
                    <label class="block text-sm font-bold text-on-surface mb-1.5">Paid Amount</label>
                    <div class="relative">
                        <span
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-outline pointer-events-none">{{
                                detail?.currency }}</span>
                        <input v-model="paidAmount" type="text" inputmode="decimal" placeholder="0.00"
                            class="w-full border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-sm bg-slate-50 text-on-surface placeholder-outline/50 focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9] transition-all"
                            @input="onPaidInput" />
                    </div>
                </div>

                <!-- Payment description -->
                <div>
                    <label class="block text-sm font-bold text-on-surface mb-1.5">Payment Description</label>
                    <textarea v-model="paymentDescription" rows="2" placeholder="e.g. Airtel Money reference TXN-00231"
                        class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-on-surface placeholder-outline/50 focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9] transition-all resize-none" />
                </div>

                <!-- Proof of payment -->
                <div>
                    <label class="block text-sm font-bold text-on-surface mb-1.5">Proof of Payment</label>
                    <div class="flex items-center gap-3">
                        <label
                            class="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1e5bb9] bg-white hover:bg-blue-50 border border-[#1e5bb9]/30 px-3 py-2 rounded-lg transition-colors">
                            <font-awesome-icon :icon="['fas', 'paperclip']" class="text-xs" />Choose file
                            <input type="file" class="hidden" accept="image/*,application/pdf"
                                @change="onProofChange" />
                        </label>
                        <span class="text-xs text-slate-500 truncate">{{ proofFile?.name || 'No file selected' }}</span>
                    </div>
                </div>
            </div>

            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showSettleModal = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    style="box-shadow:0 4px 16px rgba(22,163,74,0.25);" :disabled="settleSaving || !selPm"
                    @click="submitSettle">
                    <font-awesome-icon v-if="settleSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'money-bill-wave']" />
                    {{ settleSaving ? 'Settling…' : 'Settle Invoice' }}
                </button>
            </template>
        </Modal>

        <!-- ══ INSURANCE FORMS VIEWER MODAL ══════════════════════════════════════ -->
        <Modal v-model="showFormsModal" title="Insurance Forms" subtitle="Preview the uploaded form(s)" size="xl" class="max-w-lg">
            <div v-if="formsWithMeta.length" class="flex flex-col md:flex-row gap-4 h-[70vh] min-h-[420px]">

                <!-- Sidebar list -->
                <aside class="md:w-56 flex-shrink-0 md:border-r md:border-slate-100 md:pr-3 overflow-y-auto">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                        {{ formsWithMeta.length }} Form{{ formsWithMeta.length > 1 ? 's' : '' }}
                    </p>
                    <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                        <button v-for="form in formsWithMeta" :key="form.id" type="button"
                            class="flex-shrink-0 w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all"
                            :class="activeForm?.id === form.id
                                ? 'border-[#1e5bb9]/40 bg-blue-50/60 ring-1 ring-[#1e5bb9]/20'
                                : 'border-slate-200 hover:border-[#1e5bb9]/30 hover:bg-slate-50'"
                            @click="activeFormId = form.id">
                            <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                                :class="form.kind === 'pdf' ? 'bg-rose-50 text-rose-500'
                                    : form.kind === 'image' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'">
                                <font-awesome-icon
                                    :icon="['fas', form.kind === 'pdf' ? 'file-pdf' : form.kind === 'image' ? 'file-image' : 'file']" />
                            </span>
                            <span class="min-w-0">
                                <span class="block truncate text-xs font-semibold text-slate-700">{{ form.name }}</span>
                                <span class="block text-[10px] text-slate-400">{{ fmtDate(form.uploaded_on) }}</span>
                            </span>
                        </button>
                    </div>
                </aside>

                <!-- Viewer pane -->
                <div class="flex-1 flex flex-col min-w-0">
                    <!-- Toolbar -->
                    <div class="flex items-center justify-between gap-2 mb-2.5">
                        <div class="flex items-center gap-2 min-w-0">
                            <span
                                class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                                :class="activeForm?.kind === 'pdf' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'">
                                <font-awesome-icon
                                    :icon="['fas', activeForm?.kind === 'pdf' ? 'file-pdf' : 'file-image']"
                                    class="text-[10px]" />
                                {{ activeForm?.kind === 'pdf' ? 'PDF' : 'Image' }}
                            </span>
                            <span class="truncate text-xs text-slate-400">{{ activeForm?.name }}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <template v-if="activeForm?.kind === 'image'">
                                <button
                                    class="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    @click="imgZoom = Math.max(0.25, imgZoom - 0.25)">
                                    <font-awesome-icon :icon="['fas', 'magnifying-glass-minus']" class="text-xs" />
                                </button>
                                <span class="text-[11px] font-mono text-slate-500 w-10 text-center">{{
                                    Math.round(imgZoom * 100) }}%</span>
                                <button
                                    class="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                    @click="imgZoom = Math.min(4, imgZoom + 0.25)">
                                    <font-awesome-icon :icon="['fas', 'magnifying-glass-plus']" class="text-xs" />
                                </button>
                            </template>
                        </div>
                    </div>

                    <!-- Canvas -->
                    <div class="flex-1 rounded-xl border border-slate-200 bg-slate-100/70 overflow-auto">
                        <!-- Image -->
                        <div v-if="activeForm?.kind === 'image'"
                            class="min-h-full flex items-center justify-center p-3">
                            <img :src="activeForm.url" :alt="activeForm.name"
                                class="max-w-none rounded-md shadow-sm transition-transform origin-center"
                                :style="{ transform: `scale(${imgZoom})` }" />
                        </div>
                        <!-- PDF: object → iframe fallback -->
                        <object v-else-if="activeForm?.kind === 'pdf'" :data="activeForm.url" type="application/pdf"
                            class="w-full h-full min-h-[400px]">
                            <iframe :src="activeForm.url" title="Insurance form"
                                class="w-full h-full min-h-[400px] border-0"
                                sandbox="allow-same-origin allow-scripts allow-popups" />
                        </object>
                        <!-- Unknown type -->
                        <div v-else class="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                            <font-awesome-icon :icon="['fas', 'file']" class="text-3xl text-slate-300" />
                            <p class="text-sm text-slate-500">Preview not available for this file type.</p>
                            <a :href="activeForm?.url" target="_blank" rel="noopener"
                                class="text-xs font-bold text-[#1e5bb9] hover:underline">Open in a new tab</a>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="py-10 text-center text-sm text-slate-400">No forms uploaded.</div>

            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showFormsModal = false">Close</button>
            </template>
        </Modal>

        <!-- ══ SCHEDULE VISIT WIZARD ════════════════════════════════════════════ -->
        <Modal v-model="showScheduleModal" title="Schedule Visit"
            subtitle="Complete the patient record to schedule this visit" size="xl" class="max-w-[80%]">
            <div class="space-y-5">
                <AppAlert v-if="svError" type="error" :title="svError" />

                <!-- Stepper -->
                <div v-if="svSteps.length > 1" class="flex items-center gap-1">
                    <template v-for="(step, i) in svSteps" :key="step.id">
                        <div class="flex flex-col items-center min-w-0" :class="i < svSteps.length - 1 ? 'flex-1' : ''">
                            <div class="flex items-center w-full">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all"
                                    :class="svStep === i + 1 ? 'bg-[#1e5bb9] border-[#1e5bb9] text-white' : svStep > i + 1 ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-slate-400 bg-white'">
                                    <font-awesome-icon v-if="svStep > i + 1" :icon="['fas', 'check']" class="text-xs" />
                                    <span v-else>{{ i + 1 }}</span>
                                </div>
                                <div v-if="i < svSteps.length - 1" class="flex-1 h-0.5 mx-1 rounded"
                                    :class="svStep > i + 1 ? 'bg-green-400' : 'bg-slate-200'" />
                            </div>
                            <span class="text-[11px] mt-1 font-semibold whitespace-nowrap"
                                :class="svStep === i + 1 ? 'text-[#1e5bb9]' : svStep > i + 1 ? 'text-green-600' : 'text-slate-400'">{{
                                step.label }}</span>
                        </div>
                    </template>
                </div>

                <!-- STEP: Next of Kin -->
                <div v-if="svCurrentId === 'nok'" class="space-y-4">
                    <div class="flex items-center gap-2 text-[#1e5bb9]">
                        <font-awesome-icon :icon="['fas', 'user-group']" class="text-sm" />
                        <span class="text-xs font-bold uppercase tracking-widest">Next of Kin</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                            <input v-model="nokForm.full_name" type="text" placeholder="Jane Doe"
                                class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9]" />
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Relationship</label>
                            <select v-model="nokForm.relationship"
                                class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9]">
                                <option value="" disabled>Select relationship…</option>
                                <option v-for="rel in nokRelationships" :key="rel" :value="rel">{{ rel }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                            <input v-model="nokForm.phone" type="tel" placeholder="+265 99 545 123"
                                class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e5bb9]/30 focus:border-[#1e5bb9]" />
                        </div>
                    </div>
                    <p class="text-xs text-slate-400">All next-of-kin fields are required to continue.</p>
                </div>

                <!-- STEP: Blood group + rhesus -->
                <div v-else-if="svCurrentId === 'blood'" class="space-y-4">
                    <div class="flex items-center gap-2 text-[#1e5bb9]">
                        <font-awesome-icon :icon="['fas', 'droplet']" class="text-sm" />
                        <span class="text-xs font-bold uppercase tracking-widest">Blood Group &amp; Rhesus</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="bg in bloodGroups" :key="bg" type="button"
                            class="w-12 py-2 rounded-lg text-sm font-bold border-2 transition-all"
                            :class="bloodGroup === bg ? 'border-[#1e5bb9] bg-[#1e5bb9]/5 text-[#1e5bb9]' : 'border-slate-200 text-slate-700 hover:border-[#1e5bb9]/40'"
                            @click="selectBloodGroup(bg)">{{ bg }}</button>
                    </div>
                    <div class="flex gap-2 max-w-xs">
                        <button v-for="r in ['positive', 'negative']" :key="r" type="button"
                            class="flex-1 px-3 py-2 rounded-lg text-sm font-bold border-2 capitalize transition-all"
                            :class="rhesusFactor === r ? 'border-[#1e5bb9] bg-[#1e5bb9]/5 text-[#1e5bb9]' : 'border-slate-200 text-slate-700 hover:border-[#1e5bb9]/40'"
                            @click="rhesusFactor = r">{{ r }}</button>
                    </div>
                </div>

                <!-- STEP: Allergies -->
                <div v-else-if="svCurrentId === 'allergies'" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Known Allergies</span>
                        <span v-if="selAllergies.length"
                            class="text-xs font-bold bg-[#1e5bb9]/10 text-[#1e5bb9] px-2 py-0.5 rounded-full">{{
                            selAllergies.length }} selected</span>
                    </div>
                    <p class="text-xs text-slate-400">Select allergies which apply — leave empty if none.</p>
                    <div class="flex rounded-xl border border-slate-200 overflow-hidden" style="height:340px;">
                        <div class="w-52 flex-shrink-0 overflow-y-auto bg-slate-50 border-r border-slate-200">
                            <button v-for="(g, i) in allergyGroups" :key="g.category" type="button"
                                class="w-full text-left px-3 py-2.5 text-xs font-semibold border-b border-slate-100 transition-colors"
                                :class="activeAllergyCat === i ? 'bg-white text-[#1e5bb9] border-l-2 border-l-[#1e5bb9]' : 'text-slate-500 hover:bg-white/60'"
                                @click="activeAllergyCat = i">
                                {{ shortCat(g.category) }}
                                <span v-if="countSel(g.allergies, selAllergies)"
                                    class="ml-1 text-[10px] text-[#1e5bb9] font-bold">({{ countSel(g.allergies,
                                    selAllergies)
                                    }})</span>
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-2">
                            <div class="grid grid-cols-2 gap-1.5">
                                <button v-for="a in allergyGroups[activeAllergyCat]?.allergies" :key="a.uuid"
                                    type="button" :title="a.name"
                                    class="text-left flex items-center gap-2 p-2 rounded-lg border transition-all"
                                    :class="selAllergies.includes(a.uuid) ? 'border-[#1e5bb9] bg-[#1e5bb9]/5' : 'border-slate-200 hover:border-[#1e5bb9]/30'"
                                    @click="toggleId(selAllergies, a.uuid)">
                                    <span
                                        class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                                        :class="selAllergies.includes(a.uuid) ? 'bg-[#1e5bb9] border-[#1e5bb9]' : 'border-slate-300'">
                                        <font-awesome-icon v-if="selAllergies.includes(a.uuid)" :icon="['fas', 'check']"
                                            class="text-white text-[9px]" />
                                    </span>
                                    <span class="text-xs font-semibold text-slate-700 truncate">{{ nameTitle(a.name)
                                        }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- STEP: Chronic conditions -->
                <div v-else-if="svCurrentId === 'chronic'" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Chronic
                            Conditions</span>
                        <span v-if="selChronic.length"
                            class="text-xs font-bold bg-[#1e5bb9]/10 text-[#1e5bb9] px-2 py-0.5 rounded-full">{{
                            selChronic.length }} selected</span>
                    </div>
                    <p class="text-xs text-slate-400">Select conditions which apply — leave empty if none.</p>
                    <div class="flex rounded-xl border border-slate-200 overflow-hidden" style="height:340px;">
                        <div class="w-52 flex-shrink-0 overflow-y-auto bg-slate-50 border-r border-slate-200">
                            <button v-for="(g, i) in chronicGroups" :key="g.category" type="button"
                                class="w-full text-left px-3 py-2.5 text-xs font-semibold border-b border-slate-100 transition-colors"
                                :class="activeChronicCat === i ? 'bg-white text-[#1e5bb9] border-l-2 border-l-[#1e5bb9]' : 'text-slate-500 hover:bg-white/60'"
                                @click="activeChronicCat = i">
                                {{ shortCat(g.category) }}
                                <span v-if="countSel(g.chronic_conditions, selChronic)"
                                    class="ml-1 text-[10px] text-[#1e5bb9] font-bold">({{ countSel(g.chronic_conditions,
                                    selChronic) }})</span>
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-2">
                            <div class="grid grid-cols-2 gap-1.5">
                                <button v-for="c in chronicGroups[activeChronicCat]?.chronic_conditions" :key="c.uuid"
                                    type="button" :title="c.name"
                                    class="text-left flex items-center gap-2 p-2 rounded-lg border transition-all"
                                    :class="selChronic.includes(c.uuid) ? 'border-[#1e5bb9] bg-[#1e5bb9]/5' : 'border-slate-200 hover:border-[#1e5bb9]/30'"
                                    @click="toggleId(selChronic, c.uuid)">
                                    <span
                                        class="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                                        :class="selChronic.includes(c.uuid) ? 'bg-[#1e5bb9] border-[#1e5bb9]' : 'border-slate-300'">
                                        <font-awesome-icon v-if="selChronic.includes(c.uuid)" :icon="['fas', 'check']"
                                            class="text-white text-[9px]" />
                                    </span>
                                    <span class="text-xs font-semibold text-slate-700 truncate">{{ nameTitle(c.name)
                                        }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- STEP: Visit -->
                <div v-else-if="svCurrentId === 'visit'" class="space-y-4">
                    <div class="flex items-center gap-2 text-[#1e5bb9]">
                        <font-awesome-icon :icon="['fas', 'calendar-check']" class="text-sm" />
                        <span class="text-xs font-bold uppercase tracking-widest">Visit Details</span>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">Visit Type</label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button v-for="vt in visitTypes" :key="vt" type="button"
                                class="px-3 py-2 rounded-lg text-xs font-bold border-2 capitalize transition-all"
                                :class="visitType === vt ? 'border-[#1e5bb9] bg-[#1e5bb9]/5 text-[#1e5bb9]' : 'border-slate-200 text-slate-700 hover:border-[#1e5bb9]/40'"
                                @click="visitType = vt">{{ vt.replace('_', ' ') }}</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">Visit Date &amp; Time</label>
                        <VueDatePicker v-model="visitDateTime" :min-date="new Date()" :clearable="false"
                            :teleport="true" :auto-position="true" :enable-time-picker="true" :is-24="true"
                            time-picker-inline format="yyyy-MM-dd HH:mm" menu-class-name="visit-dp-menu"
                            placeholder="Select date and time" />
                    </div>
                </div>
            </div>

            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="svStep > 1 ? svStep-- : showScheduleModal = false">{{ svStep > 1 ? '← Back' : 'Cancel'
                    }}</button>
                <button
                    class="flex items-center gap-2 bg-[#1e5bb9] hover:bg-[#0050cb] text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style="box-shadow:0 4px 16px rgba(0,80,203,0.25);" :disabled="svSaving || !svCanNext"
                    @click="svNext">
                    <font-awesome-icon v-if="svSaving" :icon="['fas', 'spinner']" spin />
                    <template v-else>
                        <span>{{ svIsLast ? 'Schedule Visit' : 'Next' }}</span>
                        <font-awesome-icon :icon="['fas', svIsLast ? 'calendar-check' : 'arrow-right']" />
                    </template>
                </button>
            </template>
        </Modal>

        <!-- ══ RECEIPTS MODAL ══════════════════════════════════════════════════════ -->
<Modal
    v-model="showReceiptsModal"
    title="Receipts"
    subtitle="Select a receipt to view"
    size="lg"
    class="max-w-lg"
    :show-logo="true"
    :close-on-backdrop="true"
>
    <!-- Loading -->
    <div v-if="receiptsLoading" class="space-y-3 py-2">
        <SkeletonBase v-for="i in 3" :key="i" width="100%" height="2.5rem" />
    </div>

    <!-- Empty -->
    <div v-else-if="!receipts.length" class="flex flex-col items-center justify-center gap-3 py-14">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <font-awesome-icon :icon="['fas', 'receipt']" class="text-slate-300 text-xl" />
        </div>
        <p class="text-sm font-semibold text-slate-500">No receipts found</p>
        <p class="text-xs text-slate-400">No receipts are linked to this proforma invoice.</p>
    </div>

    <!-- Receipt List -->
    <div v-else class="space-y-3">
        <button v-for="r in receipts" :key="r.uuid"
            class="w-full text-left group rounded-2xl border border-slate-200 hover:border-[#1e5bb9]/40 hover:shadow-lg transition-all duration-200 overflow-hidden"
            style="box-shadow:0 2px 8px -2px rgba(0,0,0,0.06);"
            @click="goToReceipt(r.uuid)">
            <div class="flex items-stretch">
                <!-- Accent strip + icon -->
                <div class="w-14 flex-shrink-0 flex items-center justify-center"
                    :style="r.payment_method.toLowerCase().includes('insurance')
                        ? 'background:linear-gradient(180deg,#dbeafe,#bfdbfe)'
                        : 'background:linear-gradient(180deg,#dcfce7,#bbf7d0)'">
                    <font-awesome-icon
                        :icon="r.payment_method.toLowerCase().includes('insurance') ? ['fas','shield-halved'] : ['fas','money-bill-wave']"
                        :class="r.payment_method.toLowerCase().includes('insurance') ? 'text-blue-600' : 'text-emerald-600'"
                        class="text-lg" />
                </div>
                <!-- Details -->
                <div class="flex-1 px-4 py-3.5">
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <p class="text-sm font-bold text-slate-800 font-mono leading-none">{{ r.no }}</p>
                            <p class="text-[11px] text-slate-400 mt-0.5">Proforma: {{ r.proforma_invoice_no }}</p>
                        </div>
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            :class="r.payment_method.toLowerCase().includes('insurance')
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'">
                            <font-awesome-icon
                                :icon="r.payment_method.toLowerCase().includes('insurance') ? ['fas','shield-halved'] : ['fas','coins']"
                                class="text-[9px]" />
                            {{ r.payment_method }}
                        </span>
                    </div>
                    <div class="mt-2.5 grid grid-cols-3 gap-2">
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                            <p class="text-xs font-bold text-slate-800 font-mono">{{ r.currency }} {{ Number(r.total_price).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</p>
                        </div>
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paid</p>
                            <p class="text-xs font-bold text-emerald-600 font-mono">{{ r.currency }} {{ Number(r.paid_amount).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}</p>
                        </div>
                        <div>
                            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Balance</p>
                            <p class="text-xs font-bold font-mono"
                                :class="Number(r.balance_amount) > 0 ? 'text-rose-500' : 'text-slate-400'">
                                {{ r.currency }} {{ Number(r.balance_amount).toLocaleString('en-MW', { minimumFractionDigits: 2 }) }}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-2.5">
                        <p class="text-[10px] text-slate-400">
                            {{ new Date(r.created_at).toLocaleDateString('en-MW', { dateStyle: 'medium' }) }} · {{ r.created_by }}
                        </p>
                        <span class="text-[10px] font-bold text-[#1e5bb9] group-hover:underline flex items-center gap-1">
                            Open <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-[9px]" />
                        </span>
                    </div>
                </div>
            </div>
        </button>
    </div>

    <template #footer>
        <button
            class="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors px-4 py-2 rounded-xl hover:bg-slate-100"
            @click="showReceiptsModal = false">
            Close
        </button>
    </template>
</Modal>

    </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const { denied } = usePageGuard(['proforma_invoice_view', 'proforma_invoice_settle', 'proforma_invoice_schedule'])

interface PiLineItem {
    uuid?: string; price_uuid?: string; type?: string; name: string; currency: string
    base_amount: number; adjusted_amount: number; discount_amount: number; total_amount: number
    insurance_coverage: { percentage: number; per_encounter_limit: number | null; annual_limit: number | null }
}
interface PiTax { name: string; mode: string; percentage: number; tax_amount: number }
interface PaymentMethod { id: number; name: string; description: string }

interface ProformaDetail {
    uuid: string; no: string
    pre_costing: { uuid: string; no: string }
    customer: { uuid: string; no: string; full_name: string; preferred_name: string | null; gender: string; date_of_birth: string; age: number; phone_primary: string }
    insurance: {
        pay_with_insurance: boolean; provider: string | null; scheme: string | null; code: string | null
        membership_number: string | null; requires_preauthorization?: boolean; use_base_price?: boolean
        coverage_regions?: string[]
        filled_forms_urls?: { id: number; url: string; uploaded_on: string }[]
    }
    facility: { facility_name: string; facility_address_line1: string; facility_address_line2: string; facility_phone: string; facility_email: string; tin: string; vat_reg_number: string; pre_costing_validity_terms_days: number }
    currency: string
    encounter_types: PiLineItem[]; laboratory_tests: PiLineItem[]; radiology_images: PiLineItem[]
    total_services: number; total: number; discount: { percentage: number; amount: number }; sub_total: number; total_price: string
    taxation: PiTax[]
    initial_settlement_percentage: number; deposit_due: string; total_paid: string; outstanding: string
    is_settled: boolean; settled_by: string | null; settled_on: string | null
    to_be_scheduled?: boolean; receipt_uuid?: string | null
    created_by: string; created_at: string; updated_at: string | null; updated_by: string | null
}

// ── Receipt types ─────────────────────────────────────────────────────────────
interface Receipt {
    uuid: string; no: string; proforma_invoice_no: string
    payment_method: string; currency: string
    total_price: string; paid_amount: string; balance_amount: string
    change_amount: string; payment_description: string
    proof_of_payment: string; created_by: string; created_at: string
}

const showReceiptsModal = ref(false)
const receipts = ref<Receipt[]>([])
const receiptsLoading = ref(false)

async function openReceiptsModal() {
    showAdvanced.value = false
    showReceiptsModal.value = true
    if (receipts.value.length) return          // already fetched
    receiptsLoading.value = true
    try {
        const data = await request<Receipt[]>(
            `/customer/receipts?uuid=${customerUuid.value}`
        )
        receipts.value = data ?? []
    } finally {
        receiptsLoading.value = false
    }
}

function goToReceipt(receiptUuid: string) {
    router.push({
        path: `/customers/receipt/${receiptUuid}`,
        query: { uuid: receiptUuid, customer_uuid: customerUuid?.value }
    })
}

const route = useRoute()
const router = useRouter()
const { request } = useApi()

const proformaUuid = computed(() => route.params.uuid as string)
const customerUuid = computed(() => route.query.customer_uuid as string)

const detail = ref<ProformaDetail | null>(null)
const loading = ref(false)
const { showSkeleton } = useDelayedLoading(loading)

const showAdvanced = ref(false)
const showFormsModal = ref(false)

type FormKind = 'image' | 'pdf' | 'other'
interface FilledForm { id: number; url: string; uploaded_on: string }
interface FormMeta extends FilledForm { name: string; kind: FormKind; contentType: string }

const parseFormMeta = (form: FilledForm): FormMeta => {
    let name = `Form #${form.id}`
    let contentType = ''
    try {
        const q = new URL(form.url).searchParams
        contentType = (q.get('response-content-type') || '').toLowerCase()
        const cd = q.get('response-content-disposition') || ''
        // matches  filename*=UTF-8''name.png  or  filename="name.png"
        const star = cd.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
        const plain = cd.match(/filename="?([^";]+)"?/i)
        const raw = star?.[1] || plain?.[1]
        if (raw) name = decodeURIComponent(raw.trim())
    } catch { /* keep defaults */ }

    const ext = name.split('.').pop()?.toLowerCase() || ''
    let kind: FormKind = 'other'
    if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) kind = 'image'
    else if (contentType === 'application/pdf' || ext === 'pdf') kind = 'pdf'

    return { ...form, name, kind, contentType }
}

const formsWithMeta = computed<FormMeta[]>(() =>
    (detail.value?.insurance.filled_forms_urls ?? []).map(parseFormMeta))

const activeFormId = ref<number | null>(null)
const imgZoom = ref(1)
const activeForm = computed<FormMeta | null>(() =>
    formsWithMeta.value.find(fm => fm.id === activeFormId.value) ?? formsWithMeta.value[0] ?? null)

// pick first form + reset zoom on open; reset zoom on switch
watch(showFormsModal, (open) => {
    if (open) { activeFormId.value = formsWithMeta.value[0]?.id ?? null; imgZoom.value = 1 }
})
watch(activeFormId, () => { imgZoom.value = 1 })

// ── Section groups for the read-only table ──────────────────────────────────
const sections = computed(() => detail.value ? [
    { key: 'enc', label: 'Clinical Services', icon: ['fas', 'notes-medical'] as [string, string], color: 'text-[#1e5bb9]', items: detail.value.encounter_types },
    { key: 'lab', label: 'Laboratory Tests', icon: ['fas', 'flask'] as [string, string], color: 'text-slate-600', items: detail.value.laboratory_tests },
    { key: 'rad', label: 'Radiology', icon: ['fas', 'x-ray'] as [string, string], color: 'text-violet-600', items: detail.value.radiology_images },
] : [])

// ── Helpers ──────────────────────────────────────────────────────────────────
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

const validUntil = computed(() => {
    if (!detail.value) return '—'
    const d = new Date(detail.value.created_at)
    d.setDate(d.getDate() + (detail.value.facility.pre_costing_validity_terms_days || 0))
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
})

// ── QR + barcode (PNG data URLs from d.no) ──────────────────────────────────
const qrDataUrl = ref('')
const barcodeDataUrl = ref('')

const generateCodes = async (value: string) => {
    if (!import.meta.client || !value) return
    qrDataUrl.value = await QRCode.toDataURL(value, {
        width: 240, margin: 1, errorCorrectionLevel: 'M',
        color: { dark: '#1e293b', light: '#00000000' },
    })
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, value, {
        format: 'CODE128', displayValue: false, height: 38, width: 2, margin: 0,
        lineColor: '#1e293b', background: 'transparent',
    })
    barcodeDataUrl.value = canvas.toDataURL('image/png')
}
watch(() => detail.value?.no, (no) => { if (no) generateCodes(no) }, { immediate: true })

// ── Load ──────────────────────────────────────────────────────────────────────
const loadDetail = async () => {
    loading.value = true
    const d = await request<ProformaDetail>(`/customer/proforma_invoice/show?uuid=${customerUuid.value}&proforma_invoice_uuid=${proformaUuid.value}`)
    if (d) detail.value = d
    loading.value = false
}

onMounted(async () => {
    await loadDetail()
    // Auto-launch the schedule-visit wizard when this invoice still needs a visit
    if (detail.value?.to_be_scheduled) await openSchedule()
})

// ── Settle ──────────────────────────────────────────────────────────────────
const showSettleModal = ref(false)
const settleSaving = ref(false)
const settleError = ref('')
const paidAmount = ref('')
const paymentDescription = ref('')
const proofFile = ref<File | null>(null)

// Billing payment methods — search bar
const pmList = ref<PaymentMethod[]>([])
const pmLoading = ref(false)
const pmSearch = ref('')
const showPmDrop = ref(false)
const selPm = ref<PaymentMethod | null>(null)
const filtPm = computed(() => {
    const q = pmSearch.value.toLowerCase()
    return q ? pmList.value.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) : pmList.value
})
const selectPm = (m: PaymentMethod) => { selPm.value = m; pmSearch.value = m.name; showPmDrop.value = false }

const loadPaymentMethods = async () => {
    if (pmList.value.length) return
    pmLoading.value = true
    const d = await request<PaymentMethod[]>('/billing/payment_methods')
    if (d) pmList.value = d
    pmLoading.value = false
}

// Format paid amount while typing: "1,000.50"
const onPaidInput = (e: Event) => {
    const stripped = (e.target as HTMLInputElement).value.replace(/[^0-9.]/g, '')
    const parts = stripped.split('.')
    const int = (parts[0] ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    paidAmount.value = parts.length > 1 ? `${int}.${(parts[1] ?? '').slice(0, 2)}` : int
}
const onProofChange = (e: Event) => { proofFile.value = (e.target as HTMLInputElement).files?.[0] ?? null }

const openSettle = async () => {
    settleError.value = ''
    selPm.value = null; pmSearch.value = ''; paymentDescription.value = ''; proofFile.value = null
    paidAmount.value = detail.value ? detail.value.outstanding : ''
    showSettleModal.value = true
    await loadPaymentMethods()
}

const submitSettle = async () => {
    if (!selPm.value) { settleError.value = 'Select a payment method.'; return }
    settleError.value = ''; settleSaving.value = true
    try {
        const fd = new FormData()
        fd.append('uuid', customerUuid.value)
        fd.append('proforma_invoice_uuid', proformaUuid.value)
        fd.append('proforma_invoice[payment_method_id]', String(selPm.value.id))
        fd.append('proforma_invoice[payment_description]', paymentDescription.value)
        fd.append('proforma_invoice[paid_amount]', paidAmount.value.replace(/,/g, ''))
        if (proofFile.value) fd.append('proforma_invoice[proof_of_payment]', proofFile.value)
        const res = await request<{ receipt_uuid: string; message?: string }>(
            '/customer/proforma_invoice/settle', { method: 'PATCH', body: fd },
        )
        showSettleModal.value = false
        if (res?.receipt_uuid) {
            // receipt_uuid is the route param; customer uuid travels as a query
            router.push({ path: `/customers/receipt/${res.receipt_uuid}`, query: { customer_uuid: customerUuid.value } })
        } else {
            await loadDetail()
        }
    } catch (e: unknown) {
        settleError.value = (e as Error).message || 'Failed to settle invoice.'
    } finally {
        settleSaving.value = false
    }
}

// ══ SCHEDULE-VISIT WIZARD ════════════════════════════════════════════════════
interface CodedGroupAllergy { category: string; allergies: { uuid: string; name: string }[] }
interface CodedGroupChronic { category: string; chronic_conditions: { uuid: string; name: string }[] }
interface CustExt { url: string; code?: string; valueBoolean?: boolean; valueString?: string | null }

const showScheduleModal = ref(false)
const svStep = ref(1)
const svSaving = ref(false)
const svError = ref('')

// customer FHIR extensions (HAS_PATIENT_RECORD / HAS_NEXT_KIN)
const custFhir = ref<{ extension?: CustExt[] } | null>(null)
const custExt = (code: string) => custFhir.value?.extension?.find(e => e.code === code)
const hasNextKin = computed(() => custExt('HAS_NEXT_KIN')?.valueBoolean ?? false)
const hasPatientRecord = computed(() => custExt('HAS_PATIENT_RECORD')?.valueBoolean ?? false)

// step data
const nokForm = reactive({ full_name: '', relationship: '', phone: '' })
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const nokRelationships = [
    'Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Friend', 'Other',
]
const bloodGroup = ref('')
const rhesusFactor = ref('')
const selectBloodGroup = (bg: string) => { bloodGroup.value = bg; rhesusFactor.value = bg.includes('-') ? 'negative' : 'positive' }

const allergyGroups = ref<CodedGroupAllergy[]>([])
const chronicGroups = ref<CodedGroupChronic[]>([])
const selAllergies = ref<string[]>([])
const selChronic = ref<string[]>([])
const activeAllergyCat = ref(0)
const activeChronicCat = ref(0)

const visitTypes = ['outpatient', 'inpatient', 'emergency', 'day_case']
const visitType = ref('outpatient')
const visitDateTime = ref<Date | null>(null)

// helpers
const shortCat = (c: string) => c.split(' (')[0]
const nameTitle = (n: string) => n.split(' - ')[0]
const toggleId = (arr: string[], id: string) => {
    const i = arr.indexOf(id); i >= 0 ? arr.splice(i, 1) : arr.push(id)
}
const countSel = (items: { uuid: string }[], arr: string[]) => items.filter(x => arr.includes(x.uuid)).length
const fmtVisitDateTime = (d: Date | null): string => {
    if (!d) return ''
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// loaders
const loadCustomerFhir = async () => {
    const d = await request<{ extension?: CustExt[] }>(`/customer/show?uuid=${customerUuid.value}`)
    if (d) custFhir.value = d
}
const loadAllergies = async () => { if (allergyGroups.value.length) return; const d = await request<CodedGroupAllergy[]>('/allergies'); if (d) allergyGroups.value = d }
const loadChronic = async () => { if (chronicGroups.value.length) return; const d = await request<CodedGroupChronic[]>('/chronic_conditions'); if (d) chronicGroups.value = d }

// dynamic step flow
const svSteps = computed(() => {
    const s: { id: string; label: string }[] = []
    if (!hasNextKin.value) s.push({ id: 'nok', label: 'Next of Kin' })
    if (!hasPatientRecord.value) {
        s.push({ id: 'blood', label: 'Blood Group' })
        s.push({ id: 'allergies', label: 'Allergies' })
        s.push({ id: 'chronic', label: 'Chronic Conditions' })
    }
    s.push({ id: 'visit', label: 'Visit' })
    return s
})
const svCurrentId = computed(() => svSteps.value[svStep.value - 1]?.id)
const svIsLast = computed(() => svStep.value >= svSteps.value.length)
const svCanNext = computed(() => {
    switch (svCurrentId.value) {
        case 'nok': return !!(nokForm.full_name.trim() && nokForm.relationship.trim() && nokForm.phone.trim())
        case 'blood': return !!bloodGroup.value && !!rhesusFactor.value
        case 'visit': return !!visitType.value && !!visitDateTime.value
        default: return true   // allergies / chronic are optional
    }
})

const openSchedule = async () => {
    svStep.value = 1; svError.value = ''
    Object.assign(nokForm, { full_name: '', relationship: '', phone: '' })
    bloodGroup.value = ''; rhesusFactor.value = ''
    selAllergies.value = []; selChronic.value = []
    activeAllergyCat.value = 0; activeChronicCat.value = 0
    visitType.value = 'outpatient'; visitDateTime.value = null
    showScheduleModal.value = true
    await loadCustomerFhir()
    if (!hasPatientRecord.value) await Promise.all([loadAllergies(), loadChronic()])
}

const submitSchedule = async () => {
    svError.value = ''; svSaving.value = true
    try {
        const body: Record<string, unknown> = {
            uuid: customerUuid.value,
            proforma_invoice_uuid: proformaUuid.value,
        }
        if (!hasNextKin.value) {
            body.customer = {
                nok_full_name: nokForm.full_name.trim(),
                nok_relationship: nokForm.relationship.trim(),
                nok_phone: nokForm.phone.trim(),
            }
        }
        const patient: Record<string, unknown> = {
            visit_type: visitType.value,
            visit_datetime: fmtVisitDateTime(visitDateTime.value),
        }
        if (!hasPatientRecord.value) {
            patient.blood_group = bloodGroup.value
            patient.rhesus_factor = rhesusFactor.value
            patient.known_allergies = [...selAllergies.value]      // empty array when none chosen
            patient.chronic_conditions = [...selChronic.value]
        }
        body.patient = patient
        // raw JSON body — not stringified; useApi serializes it
        const res = await request<{ patient_uuid: string; message?: string }>(
            '/customer/proforma_invoice/schedule_visit',
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
        )
        showScheduleModal.value = false
        if (res?.patient_uuid) {
            router.push({
                path: `/patients/${res.patient_uuid}`,
                query: { customer_uuid: customerUuid.value },
            })
        } else {
            await loadDetail()   // fallback: refresh so to_be_scheduled flips false
        }
    } catch (e: unknown) {
        svError.value = (e as Error).message || 'Failed to schedule visit.'
    } finally {
        svSaving.value = false
    }
}

const svNext = () => { svIsLast.value ? submitSchedule() : svStep.value++ }

// ── Print — hidden iframe triggers browser print dialog ───────────────────
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
        const ready = (win as Window & { fonts?: FontFaceSet }).fonts?.ready
        const doPrint = () => { win.focus(); win.print() }
        ready ? ready.then(doPrint) : setTimeout(doPrint, 800)
    }
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 8000)
}

// ── Download PDF — html2pdf.js inside an off-screen iframe ─────────────────
const downloadPdf = () => {
    const html = buildDocHtml(false)
    if (!detail.value || !html) return
    const filename = `${detail.value.no}.pdf`
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:0;width:794px;height:3000px;border:0;z-index:-1;'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) { document.body.removeChild(iframe); return }
    const pdfHtml = html.replace('</body>', `
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>
(function() {
  var el = document.querySelector('.wrap');
  var opt = {
    margin:       [6, 6, 6, 6],
    filename:     '${filename}',
    image:        { type: 'jpeg', quality: 0.97 },
    html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#e0e7ff', logging: false, scrollX: 0, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: 'css', avoid: 'tr' }
  };
  document.fonts.ready.then(function() {
    html2pdf().set(opt).from(el).save().then(function() { parent.postMessage('pdf-done', '*'); });
  });
})();
<\/script>
</body>`)
    doc.open(); doc.write(pdfHtml); doc.close()
    const onMsg = (e: MessageEvent) => {
        if (e.data === 'pdf-done') {
            window.removeEventListener('message', onMsg)
            setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 500)
        }
    }
    window.addEventListener('message', onMsg)
    setTimeout(() => {
        window.removeEventListener('message', onMsg)
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
    }, 30000)
}

// ── Document HTML builder (self-contained reference design) ─────────────────
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

    // Settlement status badge for the document header
    const statusBadge = d.is_settled
        ? `<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:9999px;background:#dcfce7;color:#047857;font-size:9px;font-weight:700;border:1px solid #bbf7d0;"><span style="width:4px;height:4px;border-radius:50%;background:#10b981;margin-right:4px;display:inline-block;"></span>SETTLED</span>`
        : `<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:9999px;background:#fef3c7;color:#b45309;font-size:9px;font-weight:700;border:1px solid #fde68a;"><span style="width:4px;height:4px;border-radius:50%;background:#f59e0b;margin-right:4px;display:inline-block;"></span>OUTSTANDING</span>`

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
    body{font-family:Inter,sans-serif;background:linear-gradient(135deg,#e0e7ff 0%,#f1f5f9 100%);min-height:100vh;padding:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .wrap{max-width:760px;margin:0 auto;}
    .card{background:rgba(255,255,255,0.94);border-radius:18px;border:1px solid rgba(226,232,240,0.9);margin-bottom:14px;}
    .hdr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;padding:24px;align-items:start;}
    .sub{background:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.6);border-radius:12px;padding:14px;}
    table{width:100%;border-collapse:collapse;}
    thead{display:table-header-group;}
    tr{page-break-inside:avoid;}
    @page{margin:8mm;size:A4;}
    @media print{body{background:linear-gradient(135deg,#e0e7ff 0%,#f1f5f9 100%)!important;padding:8px!important;}.card{border-radius:14px!important;}}
  </style>
</head>
<body>
<div class="wrap">

  <!-- HEADER -->
  <div class="card hdr">
    <div>
      <div class="sub">
        <div style="">
          ${qrBlock}
          <div>
            <p style="font-size:12px;font-weight:700;color:#1e5bb9;margin-bottom:6px;">${d.no}</p>
            ${statusBadge}
          </div>
        </div>
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(226,232,240,.5);">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:10px;">
                ${d.insurance.pay_with_insurance ? 'Insurance Payment Proforma Invoice' : 'Cash Payment Proforma Invoice'}
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
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:8px;">
      <img src="${window.location.origin}/images/ibcc_logo.png" alt="IBCC" style="height:80px;width:auto;" onerror="this.style.display='none'"/>
      <p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.22em;text-align:center;line-height:1.7;margin-top:12px;">International Blantyre<br>Cancer Centre</p>
      <div style="height:2px;width:28px;background:rgba(30,91,185,.25);border-radius:9999px;margin-top:10px;"></div>
    </div>
    <div style="text-align:left;">
      <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;margin-bottom:5px;">Customer Details</p>
      <div style="  ">
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

        <div style="flex:1;min-width:240px;">
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px;">Summary</p>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:#10b981;flex-shrink:0;display:inline-block;"></span>
            <p style="font-size:12px;color:#475569;">Gross (${d.total_services} services): <strong style="color:#1e293b;">${fA(d.currency, d.total)}</strong></p>
          </div>
          ${d.discount.amount
            ? `<div style="display:flex;align-items:center;gap:6px;"><span style="width:6px;height:6px;border-radius:50%;background:#fb923c;flex-shrink:0;display:inline-block;"></span><p style="font-size:12px;color:#059669;font-weight:600;">Total Discount (${d.discount.percentage}%): ${fA(d.currency, d.discount.amount)}</p></div>`
            : ''}
            <!-- Barcode + facility line -->
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(226,232,240,.6);">
            <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(226,232,240,.6);align-items:center;">
                ${barcode}
            </div>
            <p style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">${d.no}</p>
            <p style="font-size:9px;color:#94a3b8;line-height:1.5;">${d.facility.facility_name} • ${d.facility.facility_address_line1}, ${d.facility.facility_address_line2} • ${d.facility.facility_phone}</p>
            <p style="font-size:9px;color:#94a3b8;line-height:1.5;">Generated On: ${fD(d.created_at)}</p>
          </div>
        </div>

        <div style="width:240px;flex-shrink:0;">
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;padding-bottom:7px;border-bottom:1px solid #e2e8f0;">
            <span>Sub-total</span><span style="white-space:nowrap;">${fA(d.currency, d.sub_total)}</span>
          </div>
          <div style="padding:8px 0;border-bottom:1px solid #e2e8f0;margin-bottom:8px;">${taxRows}</div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:14px;font-weight:700;color:#1e293b;">Total Price</span>
            <span style="font-size:20px;font-weight:900;color:#1e5bb9;letter-spacing:-.04em;white-space:nowrap;">${fA(d.currency, Number(d.total_price))}</span>
          </div>
          <!-- Settlement -->
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(226,232,240,.6);">
            <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;"><span style="color:#94a3b8;">Total Paid</span><span style="color:#059669;font-weight:700;">${fA(d.currency, Number(d.total_paid))}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;"><span style="color:#94a3b8;">Outstanding</span><span style="color:${Number(d.outstanding) > 0 ? '#e11d48' : '#059669'};font-weight:700;">${fA(d.currency, Number(d.outstanding))}</span></div>
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
</script>

<style scoped>
@media screen {
    .print-only {
        display: none !important;
    }
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

/* Lay the calendar and the inline time picker side by side */
.visit-dp-menu .dp__menu_inner {
    flex-direction: row;
    align-items: stretch;
}

.visit-dp-menu .dp__time_picker_inline_container {
    display: flex;
    align-items: center;
    border-left: 1px solid var(--dp-border-color, #e2e8f0);
    padding-left: 8px;
    margin-left: 4px;
}
</style>