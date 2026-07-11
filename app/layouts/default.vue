<!-- app/layouts/default.vue -->
<template>
  <!--
    Background: a rich warm-cool gradient that mimics the login_background.png
    tones (warm beige/brown office scene). If the actual photo exists in
    public/images/login_background.png it will override via the ::before
    pseudo-approach. The gradient alone already gives the glass effect depth.
  -->
  <div
    class="flex h-screen w-screen overflow-hidden relative"
    style="
      background-size: cover;
      background-position: center;
      background-blend-mode: normal;
    "
  >
    <!-- Blur + subtle light frost — stays translucent so background shows -->
    <div
      class="absolute inset-0 z-0"
      style="
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        background-color: rgba(255, 255, 255, 1);
      "
    />

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- ── Sidebar ──────────────────────────────────────────────────────── -->
    <aside
      class="h-full flex-shrink-0 w-[240px] sm:w-[260px]
             transition-transform duration-300 ease-in-out
             fixed top-0 left-0 lg:relative lg:top-auto lg:left-auto
             z-40 lg:z-10"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <Sidebar @close="sidebarOpen = false" />
    </aside>

    <!-- ── Main content panel ───────────────────────────────────────────── -->
    <div
      class="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10"
      style="
        background-color: rgba(255, 255, 255, 0.68);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-left: 1px solid rgba(255,255,255,0.50);
      "
    >
      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 md:p-6 bg-surface-container">
        <slot />
      </main>
      <AppFooter />
    </div>

    <NotificationCenter />
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => { sidebarOpen.value = false })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>