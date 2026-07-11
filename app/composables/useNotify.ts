// app/composables/useNotify.ts
import { useNotificationsStore } from '~/stores/notifications'

type Opts = { title?: string; duration?: number }

export const useNotify = () => {
  const store = useNotificationsStore()

  return {
    success: (message: string, opts?: Opts) => store.push('success', message, opts),
    error:   (message: string, opts?: Opts) => store.push('error', message, opts),
    warning: (message: string, opts?: Opts) => store.push('warning', message, opts),
    info:    (message: string, opts?: Opts) => store.push('info', message, opts),
    dismiss: (id: number) => store.dismiss(id),
    clear:   () => store.clear(),
  }
}