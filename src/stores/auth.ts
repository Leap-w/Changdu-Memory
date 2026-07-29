import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import {
  supabase,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getCurrentSession,
} from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!session.value)

  /** 注册 */
  async function register(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const data = await signUpWithEmail(email, password)
      // 启用邮箱验证时，Supabase 会返回 user 但不会创建 session。
      // 只有取得 session 后才视为已登录。
      if (data.session) {
        user.value = data.user
        session.value = data.session
      }
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 登录 */
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const data = await signInWithEmail(email, password)
      user.value = data.user
      session.value = data.session
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 登出 */
  async function logout() {
    loading.value = true
    error.value = null
    try {
      await signOut()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登出失败'
      error.value = message
    } finally {
      user.value = null
      session.value = null
      loading.value = false
    }
  }

  /** 初始化：检查已有 Session */
  async function initialize() {
    loading.value = true
    try {
      const currentSession = await getCurrentSession()
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }
    } catch {
      // 无 session，忽略
    } finally {
      loading.value = false
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        session.value = newSession
        user.value = newSession?.user ?? null
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
      }
    })
  }

  return {
    user,
    session,
    loading,
    error,
    isLoggedIn,
    login,
    register,
    logout,
    initialize,
  }
})
