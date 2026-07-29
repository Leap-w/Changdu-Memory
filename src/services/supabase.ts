import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量。请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 是否正确配置。',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
