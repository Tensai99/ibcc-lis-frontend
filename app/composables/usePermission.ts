// app/composables/usePermission.ts
/**
 * Convenience wrapper around the auth store's permission helpers.
 * Usage in a component:
 *   const { can, canAny } = usePermission()
 *   if (can('billing_approve')) { ... }
 */
export const usePermission = () => {
  const auth = useAuthStore()

  return {
    can:    (permission: string) => auth.can(permission),
    canAll: (permissions: string[]) => auth.canAll(permissions),
    canAny: (permissions: string[]) => auth.canAny(permissions),
    role:   computed(() => auth.currentRole),
    user:   computed(() => auth.currentUser),
  }
}
