import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量。请在 Vercel 配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新部署。',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/** 邮箱密码注册 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
    },
  })

  if (error) throw error
  return data
}

/** 邮箱密码登录 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/** 登出 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** 获取当前 Session */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
