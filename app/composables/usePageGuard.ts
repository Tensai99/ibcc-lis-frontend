// app/composables/usePageGuard.ts
export const usePageGuard = (permissions: string[]) => {
  const auth   = useAuthStore()
  const router = useRouter()
  const denied = ref(false)

  onMounted(() => {
    const ok = permissions.length === 0 || auth.canAny(permissions)
    if (!ok) {
      denied.value = true
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  })

  return { denied }
}
