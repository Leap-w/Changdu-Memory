import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function setSession(newSession: Session | null) {
    session.value = newSession
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function clearAuth() {
    user.value = null
    session.value = null
    error.value = null
  }

  return {
    user,
    session,
    loading,
    error,
    isLoggedIn,
    setUser,
    setSession,
    setLoading,
    setError,
    clearAuth,
  }
})
