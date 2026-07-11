// app/stores/notifications.ts
import { defineStore } from 'pinia'

export type NotifyType = 'success' | 'error' | 'warning' | 'info'

export interface NotifyItem {
  id: number
  type: NotifyType
  title: string
  message: string
  duration: number // ms, 0 = persistent until dismissed
}

const DEFAULT_TITLES: Record<NotifyType, string> = {
  success: 'Done',
  error: 'Request failed',
  warning: 'Heads up',
  info: 'Note',
}

const DEFAULT_DURATIONS: Record<NotifyType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
}

// timer bookkeeping lives outside reactive state — timeout handles have no
// business being tracked by Pinia/Vue's reactivity system
const timers = new Map<number, { timeoutId: ReturnType<typeof setTimeout>; remaining: number; startedAt: number }>()

let seq = 0

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as NotifyItem[],
  }),
  actions: {
    push(type: NotifyType, message: string, opts: { title?: string; duration?: number } = {}) {
      const id = ++seq
      const duration = opts.duration ?? DEFAULT_DURATIONS[type]

      this.items.push({
        id,
        type,
        title: opts.title ?? DEFAULT_TITLES[type],
        message,
        duration,
      })

      if (duration > 0) {
        timers.set(id, { timeoutId: setTimeout(() => this.dismiss(id), duration), remaining: duration, startedAt: Date.now() })
      }

      return id
    },
    pause(id: number) {
      const t = timers.get(id)
      if (!t) return
      clearTimeout(t.timeoutId)
      t.remaining -= Date.now() - t.startedAt
    },
    resume(id: number) {
      const t = timers.get(id)
      if (!t || t.remaining <= 0) return
      t.startedAt = Date.now()
      t.timeoutId = setTimeout(() => this.dismiss(id), t.remaining)
    },
    dismiss(id: number) {
      const t = timers.get(id)
      if (t) { clearTimeout(t.timeoutId); timers.delete(id) }
      this.items = this.items.filter(n => n.id !== id)
    },
    clear() {
      timers.forEach(t => clearTimeout(t.timeoutId))
      timers.clear()
      this.items = []
    },
  },
})