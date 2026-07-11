<!-- app/pages/billing/reports.vue -->
<script setup lang="ts">
const { can } = usePermission()
const { request, loading } = useApi()

// Redirect if no permission
onMounted(async () => {
  if (!can('report_view')) navigateTo('/dashboard')
})

// Revenue over time chart
const revenueChart = {
  type: 'area',
  series: [
    { name: 'Invoiced', data: [3200000, 4100000, 3800000, 5200000, 4700000, 6100000] },
    { name: 'Collected', data: [2800000, 3600000, 3200000, 4600000, 4100000, 5500000] },
  ],
  options: {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Manrope, sans-serif' },
    colors: ['#0050cb','#b3c5ff'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    stroke: { curve: 'smooth', width: [2,2] },
    xaxis: { categories: ['Dec','Jan','Feb','Mar','Apr','May'], labels: { style:{ fontSize:'12px' } } },
    yaxis: { labels: { formatter: (v: number) => `${(v/1000000).toFixed(1)}M`, style:{ fontSize:'12px' } } },
    legend: { position: 'top' },
    grid: { borderColor: '#e0e3e5', strokeDashArray: 4 },
    tooltip: { y: { formatter: (v: number) => `MWK ${v.toLocaleString()}` } },
    dataLabels: { enabled: false },
  },
}

// Payment method breakdown
const paymentMethodChart = {
  type: 'pie',
  series: [45, 25, 20, 8, 2],
  options: {
    chart: { type: 'pie', toolbar: { show: false }, fontFamily: 'Manrope, sans-serif' },
    labels: ['Cash','MoMo','Insurance','Bank Transfer','Cheque'],
    colors: ['#0050cb','#3557bc','#7796fe','#b3c5ff','#c2c6d8'],
    legend: { position: 'bottom', fontSize:'12px' },
    tooltip: { y: { formatter: (v: number) => `${v}%` } },
    dataLabels: { formatter: (v: number) => `${v.toFixed(1)}%` },
  },
}

// Insurance claims status
const claimsChart = {
  type: 'bar',
  series: [
    { name: 'Submitted', data: [12,18,9,22,16,25] },
    { name: 'Approved',  data: [10,15,8,19,14,22] },
    { name: 'Rejected',  data: [2,3,1,3,2,3] },
  ],
  options: {
    chart: { type: 'bar', stacked: false, toolbar: { show: false }, fontFamily: 'Manrope, sans-serif' },
    colors: ['#0050cb','#22c55e','#ba1a1a'],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } },
    xaxis: { categories: ['Dec','Jan','Feb','Mar','Apr','May'], labels: { style:{ fontSize:'12px' } } },
    yaxis: { labels: { style:{ fontSize:'12px' } } },
    legend: { position: 'top' },
    dataLabels: { enabled: false },
    grid: { borderColor: '#e0e3e5', strokeDashArray: 4 },
  },
}

// Outstanding by encounter type
const encounterRevenueChart = {
  type: 'bar',
  series: [{ name: 'Revenue (MWK)', data: [1200000, 980000, 750000, 540000, 420000, 380000] }],
  options: {
    chart: { type: 'bar', horizontal: true, toolbar: { show: false }, fontFamily: 'Manrope, sans-serif' },
    colors: ['#0050cb'],
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    xaxis: { labels: { formatter: (v: number) => `${(v/1000000).toFixed(1)}M`, style:{ fontSize:'11px' } } },
    yaxis: { categories: ['Chemotherapy','OPD Consult','Lab','Imaging','Pharmacy','Surgery'], labels: { style:{ fontSize:'12px' } } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#e0e3e5', strokeDashArray: 4 },
    tooltip: { x: { formatter: (v: string) => v }, y: { formatter: (v: number) => `MWK ${v.toLocaleString()}` } },
  },
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">

    <div class="page-header">
      <div>
        <h1 class="page-title">Revenue Reports</h1>
        <p class="page-subtitle">Financial performance · Insurance claims · Payment analysis</p>
      </div>
      <button v-if="can('report_export')" class="btn-secondary">
        <font-awesome-icon :icon="['fas','file-excel']" />
        Export to Excel
      </button>
    </div>

    <!-- KPI row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <StatCard label="Total Revenue (YTD)" value="28400000" format="currency" icon="['fas','chart-line']" icon-bg="bg-green-50" icon-color="text-green-600" />
      <StatCard label="Outstanding Balance" value="4200000" format="currency" icon="['fas','hourglass-half']" icon-bg="bg-amber-50" icon-color="text-amber-600" />
      <StatCard label="Insurance Recovery %" value="78" format="percent" icon="['fas','shield-halved']" icon-bg="bg-primary-fixed" icon-color="text-primary" />
      <StatCard label="Avg Invoice Value" value="32500" format="currency" icon="['fas','receipt']" icon-bg="bg-secondary-fixed" icon-color="text-secondary" />
    </div>

    <!-- Revenue trend -->
    <div class="island">
      <h3 class="section-heading">Revenue Trend (6 months)</h3>
      <ClientOnly>
        <apexchart :type="revenueChart.type" :series="revenueChart.series" :options="revenueChart.options" height="300" />
        <template #fallback><div class="h-[300px] grid place-items-center text-on-surface-variant text-sm">Loading…</div></template>
      </ClientOnly>
    </div>

    <!-- Row of 2 charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="island">
        <h3 class="section-heading">Payment Method Breakdown</h3>
        <ClientOnly>
          <apexchart :type="paymentMethodChart.type" :series="paymentMethodChart.series" :options="paymentMethodChart.options" height="260" />
          <template #fallback><div class="h-[260px] grid place-items-center text-on-surface-variant text-sm">Loading…</div></template>
        </ClientOnly>
      </div>
      <div class="island">
        <h3 class="section-heading">Insurance Claims Status</h3>
        <ClientOnly>
          <apexchart :type="claimsChart.type" :series="claimsChart.series" :options="claimsChart.options" height="260" />
          <template #fallback><div class="h-[260px] grid place-items-center text-on-surface-variant text-sm">Loading…</div></template>
        </ClientOnly>
      </div>
    </div>

    <!-- Revenue by encounter type -->
    <div class="island">
      <h3 class="section-heading">Revenue by Service Type</h3>
      <ClientOnly>
        <apexchart :type="encounterRevenueChart.type" :series="encounterRevenueChart.series" :options="encounterRevenueChart.options" height="280" />
        <template #fallback><div class="h-[280px] grid place-items-center text-on-surface-variant text-sm">Loading…</div></template>
      </ClientOnly>
    </div>

    <!-- SAGE integration notice -->
    <div class="island border border-outline-variant/50">
      <div class="flex flex-wrap items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
          <font-awesome-icon :icon="['fas','link']" class="text-primary" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm sm:text-base font-bold text-on-surface">SAGE Accounting Integration</h3>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-0.5 break-words">
            Revenue data is pushed to SAGE via the middleware API. Invoices are exported as SAGE-compatible journal entries on approval.
            Configure the SAGE API endpoint in System Settings.
          </p>
        </div>
        <button v-if="can('admin_system')" class="btn-secondary flex-shrink-0">
          <font-awesome-icon :icon="['fas','gear']" />
          Configure
        </button>
      </div>
    </div>

  </div>
</template>
