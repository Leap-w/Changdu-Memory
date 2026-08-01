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

interface Profile {
  nickname: string | null
  avatar_url: string | null
  bio: string | null
  school: string | null
  subject: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const profile = ref<Profile>({ nickname: null, avatar_url: null, bio: null, school: null, subject: null })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!session.value)

  const displayName = computed(() => profile.value.nickname || user.value?.email?.split('@')[0] || '用户')
  const displayBio = computed(() => profile.value.bio || '')

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

  /** 初始化：检查已有 Session + 加载 profile */
  async function initialize() {
    loading.value = true
    try {
      const currentSession = await getCurrentSession()
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
        await loadProfile()
      }
    } catch {
      // 无 session，忽略
    } finally {
      loading.value = false
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        session.value = newSession
        user.value = newSession?.user ?? null
        await loadProfile()
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        session.value = null
        profile.value = { nickname: null, avatar_url: null, bio: null, school: null, subject: null }
      }
    })
  }

  /** 加载 profile */
  async function loadProfile() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = supabase as any
      const { data, error } = await s
        .from('profiles')
        .select('nickname, avatar_url, bio')
        .single()
      if (error) return
      if (data) {
        profile.value = {
          nickname: data.nickname ?? null,
          avatar_url: data.avatar_url ?? null,
          bio: data.bio ?? null,
          school: null,
          subject: null,
        }
      }

      // 学校/科目字段（数据库新增列后可读取；列不存在时静默降级）
      try {
        const { data: extra } = await s
          .from('profiles')
          .select('school, subject')
          .single()
        if (extra) {
          profile.value.school = extra.school ?? null
          profile.value.subject = extra.subject ?? null
        }
      } catch { /* 列不存在，忽略 */ }
    } catch { /* ignore */ }
  }

  /** 更新 profile */
  async function updateProfile(fields: {
    nickname?: string | null
    bio?: string | null
    avatar_url?: string | null
    school?: string | null
    subject?: string | null
  }) {
    loading.value = true
    error.value = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = supabase as any
      const { error: err } = await s
        .from('profiles')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', user.value?.id)
      if (err) throw err
      if (fields.nickname !== undefined) profile.value.nickname = fields.nickname ?? null
      if (fields.bio !== undefined) profile.value.bio = fields.bio ?? null
      if (fields.avatar_url !== undefined) profile.value.avatar_url = fields.avatar_url ?? null
      if (fields.school !== undefined) profile.value.school = fields.school ?? null
      if (fields.subject !== undefined) profile.value.subject = fields.subject ?? null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user, session, profile, loading, error, isLoggedIn, displayName, displayBio,
    login, register, logout, initialize, loadProfile, updateProfile,
  }
})
