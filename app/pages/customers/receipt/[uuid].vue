<!-- app/pages/customers/receipt/[uuid].vue -->
<template>
  <AccessDenied v-if="denied" />
    <div class="animate-fade-in min-h-full" @dblclick.self.stop>

        <!-- Breadcrumb — hidden in print -->
        <div class="no-print mb-5">
            <nav class="inline-flex items-center gap-1 bg-white/80 border border-white/50 rounded-xl px-2 py-1.5 text-xs shadow-sm">
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
                <NuxtLink :to="{ path: `/customers/pre-costing/${detail?.pre_costing.uuid}`, query: { customer_uuid: customerUuid } }"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
                    <font-awesome-icon :icon="['fas', 'file']" class="text-[11px]" />Pre-Costing
                </NuxtLink>
                <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
                <NuxtLink :to="{ path: `/customers/proforma-invoice/${detail?.proforma_invoice.uuid}`, query: { customer_uuid: customerUuid } }"
                    class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors">
                    <font-awesome-icon :icon="['fas', 'file']" class="text-[11px]" />Proforma Invoice
                </NuxtLink>
                <font-awesome-icon :icon="['fas', 'chevron-right']" class="text-[9px] text-outline/40" />
                <span class="flex items-center gap-1.5 px-2 py-1 text-on-surface font-semibold">
                    <font-awesome-icon :icon="['fas', 'file-invoice']" class="text-[11px] text-primary" />Receipt
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
                            Official Receipt for {{ detail.customer.full_name }} ({{ detail.no }})
                        </h1>
                        <span v-if="detail.revoked_at"
                            class="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold bg-rose-400/20 text-rose-100 border border-rose-300/20 px-2.5 py-1 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400" />Revoked
                            {{ detail.revoked_by ? `by ${detail.revoked_by}` : '' }} on {{ fmtDate(detail.revoked_at) }}
                        </span>
                        <span v-else
                            class="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold bg-green-400/20 text-green-200 border border-green-300/20 px-2.5 py-1 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-400" />Valid · Paid
                            {{ f(detail.currency, Number(detail.paid_amount)) }}
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Revoke -->
                        <button v-if="!detail.revoked_at"
                            class="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md"
                            @click="openRevoke">
                            <font-awesome-icon :icon="['fas', 'ban']" class="text-xs" />Revoke Receipt
                        </button>
                        <span v-else
                            class="flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/10 text-white/60 py-2 px-3.5 rounded-xl cursor-not-allowed">
                            <font-awesome-icon :icon="['fas', 'ban']" class="text-xs" />Revoked
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
                                        @click="router.push({ path: `/customers/proforma-invoice/${detail.proforma_invoice.uuid}`, query: { customer_uuid: customerUuid } })">
                                        <font-awesome-icon :icon="['fas', 'arrow-right']" class="text-xs" /> View Proforma-Invoice
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
                                    <template v-if="proofForm">
                                        <div class="my-1 border-t border-slate-100" />
                                        <button
                                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                            @click="showAdvanced = false; openProof()">
                                            <font-awesome-icon :icon="['fas', 'receipt']"
                                                class="text-xs text-slate-400 w-4" />View Proof of Payment
                                        </button>
                                    </template>
                                    <template v-if="detail.insurance.filled_forms_urls?.length">
                                        <button
                                            class="w-full flex items-center gap-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
                                            @click="showAdvanced = false; openInsuranceForms()">
                                            <font-awesome-icon :icon="['fas', 'file-circle-check']"
                                                class="text-xs text-slate-400 w-4" />View Insurance Forms
                                        </button>
                                    </template>
                                </div>
                            </transition>
                        </div>
                    </div>
                </header>

                <!-- Meta strip -->
                <div class="no-print w-full text-right bg-white/60 text-gray-500 rounded-lg py-3 px-4">
                    <p class="text-xs font-bold mt-0.5">
                        Currency: {{ detail.currency }} - Receipted on: {{ fmtDate(detail.created_at) }} ({{
                            detail.created_by }}) - Proforma: {{ detail.proforma_invoice.no }} - Method: {{
                            detail.payment_method }}
                    </p>
                </div>

                <!-- ══ REVOKED BANNER ═════════════════════════════════════════════════ -->
                <div v-if="detail.revoked_at"
                    class="rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-3 flex items-start gap-3">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-rose-500 mt-0.5" />
                    <div>
                        <p class="text-sm font-bold text-rose-700">This receipt has been revoked.</p>
                        <p v-if="detail.revoke_reason" class="text-xs text-rose-600 mt-0.5">Reason: {{
                            detail.revoke_reason }}</p>
                    </div>
                </div>

                <!-- ══ RECEIPT HEADER — THREE COLUMNS ═════════════════════════════════ -->
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
                                {{ detail.payment_method }} Payment Receipt
                            </p>
                            <p class="text-xs font-semibold text-slate-700 mt-1">Receipted At:
                                <span class="font-normal text-slate-500">{{ fmtDate(detail.created_at) }}</span>
                            </p>
                            <p class="text-xs font-semibold text-slate-700 mt-1">Against Proforma:
                                <NuxtLink
                                    class="font-mono font-bold text-[#1e5bb9] hover:underline"
                                    :to="{ path: `/customers/proforma-invoice/${detail.proforma_invoice.uuid}`, query: { customer_uuid: customerUuid } }">
                                    {{ detail.proforma_invoice.no }}
                                </NuxtLink>
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Facility</p>
                            <p class="text-sm font-bold text-slate-800">{{ detail.facility.facility_name }}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ detail.facility.facility_address_line1 }}</p>
                            <p class="text-xs text-slate-500">{{ detail.facility.facility_address_line2 }}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ detail.facility.facility_phone }}</p>
                            <p class="text-xs font-medium text-[#1e5bb9]">{{ detail.facility.facility_email }}</p>
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
                            <p class="text-sm font-bold text-slate-800 underline decoration-slate-200 underline-offset-4">
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
                                    @click="openInsuranceForms()">
                                    <font-awesome-icon :icon="['fas', 'file-circle-check']" class="text-xs" />View
                                    Form{{ detail.insurance.filled_forms_urls.length > 1 ? 's' : '' }} ({{
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
                                        <td class="bg-orange-100 px-5 py-3.5 text-center font-bold text-xs text-orange-500">
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

                            <!-- Left: Summary + payment -->
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

                                <!-- Payment state -->
                                <div class="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5 text-xs">
                                    <div v-if="detail.payment_description" class="flex items-center justify-between gap-6">
                                        <span class="text-slate-400 uppercase tracking-wider font-bold">Note</span>
                                        <span class="font-medium text-slate-600 text-right">{{ detail.payment_description }}</span>
                                    </div>
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
                                                class="ml-1 text-slate-500">{{ t.name }}</span></span>
                                        <span class="text-[#1e5bb9] font-bold tabular-nums">{{ f(detail.currency,
                                            t.tax_amount) }}</span>
                                    </div>
                                    <div v-for="t in deductTaxes" :key="t.name"
                                        class="flex justify-between text-[11px]">
                                        <span class="text-slate-400">-{{ t.percentage }}% <span
                                                class="ml-1 text-slate-500">{{ t.name }}</span></span>
                                        <span class="text-orange-500 font-bold tabular-nums">{{ f(detail.currency,
                                            t.tax_amount) }}</span>
                                    </div>
                                </div>
                                <div class="flex justify-between items-baseline pt-1">
                                    <span class="text-lg font-bold text-slate-800">Total Price</span>
                                    <span class="text-2xl font-black text-[#1e5bb9] tracking-tighter tabular-nums">{{
                                        f(detail.currency, Number(detail.total_price)) }}</span>
                                </div>
                                <div class="flex justify-between items-baseline pt-1">
                                    <span class="text-sm font-bold text-emerald-700">Amount Paid</span>
                                    <span class="text-xl font-black text-emerald-600 tracking-tighter tabular-nums">{{
                                        f(detail.currency, Number(detail.paid_amount)) }}</span>
                                </div>
                                <div class="flex items-center justify-between gap-6">
                                        <span class="text-slate-400 text-sm font-bold">Balance</span>
                                        <span class="font-bold tabular-nums"
                                            :class="Number(detail.balance_amount) > 0 ? 'text-rose-600' : 'text-emerald-600'">{{
                                                f(detail.currency, Number(detail.balance_amount)) }}</span>
                                    </div>
                                    <div v-if="Number(detail.change_amount) > 0" class="flex items-center justify-between gap-6">
                                        <span class="text-slate-400 text-sm font-bold font-bold">Change</span>
                                        <span class="font-bold text-slate-700 tabular-nums">{{ f(detail.currency,
                                            Number(detail.change_amount)) }}</span>
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

        <!-- ══ REVOKE RECEIPT MODAL ══════════════════════════════════════════════ -->
        <Modal v-model="showRevokeModal" title="Revoke Receipt"
            subtitle="This permanently voids the receipt" size="md" class="max-w-lg" :close-on-backdrop="false">
            <div class="space-y-4">
                <AppAlert v-if="revokeError" type="error" :title="revokeError" />

                <div class="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm">
                    <font-awesome-icon :icon="['fas', 'triangle-exclamation']" class="text-rose-500 mt-0.5" />
                    <p class="text-rose-700">Revoking <strong class="font-mono">{{ detail?.no }}</strong> cannot be
                        undone. The linked proforma invoice may revert to unsettled.</p>
                </div>

                <div>
                    <label class="block text-sm font-bold text-on-surface mb-1.5">Reason for revocation</label>
                    <textarea v-model="revokeReason" rows="3"
                        placeholder="e.g. Duplicate receipt / payment reversed by bank"
                        class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-on-surface placeholder-outline/50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none" />
                </div>
            </div>

            <template #footer>
                <button class="text-sm font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
                    @click="showRevokeModal = false">Cancel</button>
                <button
                    class="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 font-bold rounded-xl transition-all active:scale-95"
                    style="box-shadow:0 4px 16px rgba(225,29,72,0.25);" :disabled="revokeSaving || !revokeReason.trim()"
                    @click="submitRevoke">
                    <font-awesome-icon v-if="revokeSaving" :icon="['fas', 'spinner']" spin />
                    <font-awesome-icon v-else :icon="['fas', 'ban']" />
                    {{ revokeSaving ? 'Revoking…' : 'Revoke Receipt' }}
                </button>
            </template>
        </Modal>

        <!-- ══ DOCUMENT VIEWER MODAL (proof of payment + insurance forms) ════════ -->
        <Modal v-model="showFormsModal" :title="viewerTitle" subtitle="Preview the uploaded document(s)" size="xl" class="max-w-[80%]">
            <div v-if="formsWithMeta.length" class="flex flex-col md:flex-row gap-4 max-w-[98%] h-[70vh] min-h-[420px]">

                <!-- Sidebar list -->
                <aside class="md:w-56 flex-shrink-0 md:border-r md:border-slate-100 md:pr-3 overflow-y-auto">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                        {{ formsWithMeta.length }} Document{{ formsWithMeta.length > 1 ? 's' : '' }}
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
                                <font-awesome-icon :icon="['fas', activeForm?.kind === 'pdf' ? 'file-pdf' : 'file-image']"
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
                        <div v-if="activeForm?.kind === 'image'" class="min-h-full flex items-center justify-center p-3">
                            <img :src="activeForm.url" :alt="activeForm.name"
                                class="max-w-none rounded-md shadow-sm transition-transform origin-center"
                                :style="{ transform: `scale(${imgZoom})` }" />
                        </div>
                        <!-- PDF: object → iframe fallback -->
                        <object v-else-if="activeForm?.kind === 'pdf'" :data="activeForm.url" type="application/pdf"
                            class="w-full h-full min-h-[400px]">
                            <iframe :src="activeForm.url" title="Receipt document"
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

            <div v-else class="py-10 text-center text-sm text-slate-400">No documents to display.</div>

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

const { denied } = usePageGuard(['receipt_view', 'receipt_revoke'])

interface PiLineItem {
    uuid?: string; price_uuid?: string; type?: string; name: string; currency: string
    base_amount: number; adjusted_amount: number; discount_amount: number; total_amount: number
    insurance_coverage: { percentage: number; per_encounter_limit: number | null; annual_limit: number | null }
}
interface PiTax { name: string; mode: string; percentage: number; tax_amount: number }

interface ReceiptDetail {
    uuid: string; no: string
    proforma_invoice: { uuid: string; no: string }; pre_costing: { uuid: string; no: string }
    customer: { uuid: string; no: string; full_name: string; preferred_name: string | null; gender: string; date_of_birth: string; age: number; phone_primary: string }
    insurance: {
        pay_with_insurance: boolean; provider: string | null; scheme: string | null; code: string | null
        membership_number: string | null; requires_preauthorization?: boolean; use_base_price?: boolean
        coverage_regions?: string[]
        filled_forms_urls?: { id: number; url: string; uploaded_on: string }[]
    }
    facility: { facility_name: string; facility_address_line1: string; facility_address_line2: string; facility_phone: string; facility_email: string; tin: string; vat_reg_number: string; pre_costing_validity_terms_days: number }
    currency: string
    payment_method: string
    encounter_types: PiLineItem[]; laboratory_tests: PiLineItem[]; radiology_images: PiLineItem[]
    total_services: number; total: number; discount: { percentage: number; amount: number }; sub_total: number; total_price: string
    taxation: PiTax[]
    paid_amount: string; balance_amount: string; change_amount: string; payment_description: string | null
    proof_of_payment: string | null
    created_by: string; created_at: string
    // optional revoke metadata if the API returns it
    revoked_at?: string | null; revoked_by?: string | null; revoke_reason?: string | null
}

const route = useRoute()
const router = useRouter()
const { request } = useApi()

const receiptUuid = computed(() => route.params.uuid as string)
const customerUuid = computed(() => route.query.customer_uuid as string)

const detail = ref<ReceiptDetail | null>(null)
const loading = ref(false)
const { showSkeleton } = useDelayedLoading(loading)

const showAdvanced = ref(false)
const showFormsModal = ref(false)

// ── Document viewer (shared by proof-of-payment & insurance forms) ──────────
type FormKind = 'image' | 'pdf' | 'other'
interface FilledForm { id: number; url: string; uploaded_on: string }
interface FormMeta extends FilledForm { name: string; kind: FormKind; contentType: string }

const parseFormMeta = (form: FilledForm): FormMeta => {
    let name = `Document #${form.id}`
    let contentType = ''
    try {
        const q = new URL(form.url).searchParams
        contentType = (q.get('response-content-type') || '').toLowerCase()
        const cd = q.get('response-content-disposition') || ''
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

// proof-of-payment as a single-item "form"
const proofForm = computed<FilledForm | null>(() =>
    detail.value?.proof_of_payment
        ? { id: 0, url: detail.value.proof_of_payment, uploaded_on: detail.value.created_at }
        : null)

// which source is being viewed
const viewerSource = ref<'proof' | 'insurance'>('proof')
const viewerTitle = computed(() => viewerSource.value === 'proof' ? 'Proof of Payment' : 'Insurance Forms')

const formsWithMeta = computed<FormMeta[]>(() => {
    const src = viewerSource.value === 'proof'
        ? (proofForm.value ? [proofForm.value] : [])
        : (detail.value?.insurance.filled_forms_urls ?? [])
    return src.map(parseFormMeta)
})

const activeFormId = ref<number | null>(null)
const imgZoom = ref(1)
const activeForm = computed<FormMeta | null>(() =>
    formsWithMeta.value.find(fm => fm.id === activeFormId.value) ?? formsWithMeta.value[0] ?? null)

const openProof = () => { viewerSource.value = 'proof'; showFormsModal.value = true }
const openInsuranceForms = () => { viewerSource.value = 'insurance'; showFormsModal.value = true }

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
    const d = await request<ReceiptDetail>(`/customer/receipt/show?uuid=${customerUuid.value}&receipt_uuid=${receiptUuid.value}`)
    if (d) detail.value = d
    loading.value = false
}
onMounted(async () => { await loadDetail() })

// ── Revoke ──────────────────────────────────────────────────────────────────
const showRevokeModal = ref(false)
const revokeSaving = ref(false)
const revokeError = ref('')
const revokeReason = ref('')

const openRevoke = () => { revokeError.value = ''; revokeReason.value = ''; showRevokeModal.value = true }

const submitRevoke = async () => {
    if (!revokeReason.value.trim()) { revokeError.value = 'A reason is required.'; return }
    revokeError.value = ''; revokeSaving.value = true
    try {
        await request('/customer/receipt/revoke', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: {
                uuid: customerUuid.value,
                receipt_uuid: receiptUuid.value,
                revoke_reason: revokeReason.value.trim(),
            },
        })
        showRevokeModal.value = false
        // back to the customer record (receipts tab) after a successful revoke
        router.push({ path: `/customers/${customerUuid.value}` })
    } catch (e: unknown) {
        revokeError.value = (e as Error).message || 'Failed to revoke receipt.'
    } finally {
        revokeSaving.value = false
    }
}

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

    // Receipt status badge for the document header
    const statusBadge = d.revoked_at
        ? `<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:9999px;background:#fee2e2;color:#b91c1c;font-size:9px;font-weight:700;border:1px solid #fecaca;"><span style="width:4px;height:4px;border-radius:50%;background:#ef4444;margin-right:4px;display:inline-block;"></span>REVOKED</span>`
        : `<span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:9999px;background:#dcfce7;color:#047857;font-size:9px;font-weight:700;border:1px solid #bbf7d0;"><span style="width:4px;height:4px;border-radius:50%;background:#10b981;margin-right:4px;display:inline-block;"></span>PAID</span>`

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
                ${d.payment_description} Receipt
            </p>
            <p style="font-size:12px;font-weight:700;color:#1e5bb9;margin-bottom:2px;line-height:1.3;">${d.facility.facility_name}</p>
            <p style="font-size:10px;color:#64748b;margin-bottom:1px;">📍 ${d.facility.facility_address_line1}, ${d.facility.facility_address_line2}</p>
            <p style="font-size:10px;color:#64748b;">📞 ${d.facility.facility_phone}</p>
            <p style="font-size:10px;color:#64748b;">${d.facility.facility_email}</p>
            <p style="font-size:10px;color:#64748b;">Against Proforma: <span style="font-weight:700;color:#1e5bb9;">${d.proforma_invoice.no}</span></p>
            <p style="font-size:10px;color:#64748b;">Payment Method: <span style="font-weight:700;color:#475569;">${d.payment_method}</span></p>
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
            <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(226,232,240,.6);align-items:center;">
                ${barcode}
            </div>
            <p style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px;">${d.no}</p>
            <p style="font-size:9px;color:#94a3b8;line-height:1.5;">${d.facility.facility_name} • ${d.facility.facility_address_line1}, ${d.facility.facility_address_line2} • ${d.facility.facility_phone}</p>
            <p style="font-size:9px;color:#94a3b8;line-height:1.5;">Receipted On: ${fD(d.created_at)}</p>
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
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;">
            <span style="font-size:12px;font-weight:700;color:#047857;">Amount Paid</span>
            <span style="font-size:16px;font-weight:900;color:#059669;letter-spacing:-.04em;white-space:nowrap;">${fA(d.currency, Number(d.paid_amount))}</span>
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(226,232,240,.6);">
            <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;"><span style="color:#94a3b8;">Balance</span><span style="color:${Number(d.balance_amount) > 0 ? '#e11d48' : '#059669'};font-weight:700;">${fA(d.currency, Number(d.balance_amount))}</span></div>
            ${Number(d.change_amount) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;"><span style="color:#94a3b8;">Change</span><span style="color:#475569;font-weight:700;">${fA(d.currency, Number(d.change_amount))}</span></div>` : ''}
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
</style>