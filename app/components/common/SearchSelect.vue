<!-- app/components/SearchSelect.vue -->
<!-- Searchable combobox matched to the Register-Customer wizard search bars:
     a single input you TYPE into (left icon + right caret), filtering a dropdown
     that opens beneath it. The menu is teleported to <body> and fixed-positioned
     via getBoundingClientRect so it never clips inside overflow-hidden / scroll
     containers (islands, modals).
     - Local filtering by default; set `server-filter` and listen to @search to
       drive a server-side query (e.g. /users?q=).
     - `change` emits the full option object (handy when you need a second field
       like witness_name alongside the id). -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

interface Props {
  modelValue: any
  options: any[]
  optionValue?: string | ((o: any) => any)
  optionLabel?: string | ((o: any) => string)
  optionSubtitle?: string | ((o: any) => string)
  placeholder?: string
  searchPlaceholder?: string
  icon?: string            // left FontAwesome solid icon
  disabled?: boolean
  clearable?: boolean
  serverFilter?: boolean   // skip local filtering — parent fetches via @search
}
const props = withDefaults(defineProps<Props>(), {
  optionValue: 'value',
  optionLabel: 'label',
  placeholder: 'Select…',
  searchPlaceholder: 'Search…',
  icon: 'magnifying-glass',
  disabled: false,
  clearable: false,
  serverFilter: false,
})
const emit = defineEmits<{
  (e: 'update:modelValue', v: any): void
  (e: 'change', option: any): void
  (e: 'search', q: string): void
}>()

const valOf = (o: any) => (typeof props.optionValue === 'function' ? props.optionValue(o) : o?.[props.optionValue])
const labOf = (o: any) => (typeof props.optionLabel === 'function' ? props.optionLabel(o) : o?.[props.optionLabel])
const subOf = (o: any) =>
  !props.optionSubtitle ? '' : (typeof props.optionSubtitle === 'function' ? props.optionSubtitle(o) : o?.[props.optionSubtitle])

const open = ref(false)
const query = ref('')           // what the user is typing while open
const triggerEl = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const selected = computed(() => props.options.find(o => String(valOf(o)) === String(props.modelValue)))
const displayLabel = computed(() => (selected.value ? labOf(selected.value) : ''))
const hasValue = computed(() => props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined)

// when closed → show the selected label; when open → show what's being typed
const inputValue = computed(() => (open.value ? query.value : displayLabel.value))

const filtered = computed(() => {
  if (props.serverFilter) return props.options
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o =>
    String(labOf(o)).toLowerCase().includes(q) || String(subOf(o)).toLowerCase().includes(q))
})

const position = () => {
  const el = triggerEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  menuStyle.value = {
    position: 'fixed',
    top: `${r.bottom + 6}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
    zIndex: '60',
  }
}

const openMenu = async () => {
  if (props.disabled) return
  open.value = true
  query.value = ''
  await nextTick()
  position()
}
const closeMenu = () => { open.value = false; query.value = '' }

const onInput = (e: Event) => {
  open.value = true
  query.value = (e.target as HTMLInputElement).value
  nextTick(position)
}

const pick = (o: any) => {
  emit('update:modelValue', valOf(o))
  emit('change', o)
  closeMenu()
}
const clear = () => {
  emit('update:modelValue', '')
  emit('change', null)
  query.value = ''
}

// debounce + bubble the query so a parent can run a server search
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(query, (q) => {
  if (!open.value) return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('search', q), 250)
})

// outside-click + reposition wiring, only while open
const onDocClick = (e: MouseEvent) => {
  const t = e.target as Node
  if (triggerEl.value?.contains(t) || menuRef.value?.contains(t)) return
  closeMenu()
}
watch(open, (v) => {
  if (v) {
    document.addEventListener('mousedown', onDocClick)
    window.addEventListener('scroll', position, true)
    window.addEventListener('resize', position)
  } else {
    document.removeEventListener('mousedown', onDocClick)
    window.removeEventListener('scroll', position, true)
    window.removeEventListener('resize', position)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  window.removeEventListener('scroll', position, true)
  window.removeEventListener('resize', position)
})
</script>

<template>
  <div ref="triggerEl" class="relative">
    <font-awesome-icon :icon="['fas', icon]"
      class="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline/50 text-sm pointer-events-none z-10" />
    <input
      ref="inputRef"
      type="text"
      autocomplete="off"
      class="ss-input has-icon has-caret"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      :disabled="disabled"
      :placeholder="hasValue ? displayLabel : placeholder"
      :value="inputValue"
      @focus="openMenu"
      @input="onInput"
      @keydown.esc="closeMenu"
    />
    <!-- clear / caret -->
    <button v-if="clearable && hasValue && !disabled" type="button"
      class="absolute right-8 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface z-10" aria-label="Clear" @click.stop="clear">
      <font-awesome-icon :icon="['fas', 'xmark']" class="text-xs" />
    </button>
    <font-awesome-icon :icon="['fas', 'chevron-down']"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none transition-transform"
      :class="{ 'rotate-180': open }" />

    <!-- teleported dropdown -->
    <Teleport to="body">
      <Transition name="ss-drop">
        <div v-if="open" ref="menuRef" :style="menuStyle"
          class="bg-white rounded-xl border border-outline-variant/40 shadow-glass overflow-hidden">
          <ul class="max-h-64 overflow-y-auto py-1">
            <li v-for="o in filtered" :key="String(valOf(o))"
              class="px-4 py-2.5 cursor-pointer text-sm hover:bg-primary/8 hover:text-primary transition-colors"
              :class="{ 'bg-primary/8 text-primary': String(valOf(o)) === String(modelValue) }"
              @click="pick(o)">
              <span class="block font-medium break-words">{{ labOf(o) }}</span>
              <span v-if="subOf(o)" class="block text-xs text-on-surface-variant break-words mt-0.5">{{ subOf(o) }}</span>
            </li>
            <li v-if="!filtered.length" class="px-4 py-3 text-sm text-on-surface-variant text-center">No matches.</li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.ss-input {
  width: 100%;
  background: var(--color-surface-low, #f2f4f6);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-on-surface, #191c1e);
  transition: all 0.2s ease;
  box-shadow: inset 0 0 0 1.5px transparent;
}
.ss-input::placeholder { color: rgba(114, 118, 135, 0.6); }
.ss-input:focus { outline: none; box-shadow: inset 0 0 0 1.5px #0050cb; background: #f7f9fb; }
.ss-input:hover:not(:focus):not(:disabled) { background: #e6e8ea; }
.ss-input.has-icon { padding-left: 2.5rem; }
.ss-input.has-caret { padding-right: 2.25rem; }

.ss-drop-enter-active, .ss-drop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.ss-drop-enter-from, .ss-drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>