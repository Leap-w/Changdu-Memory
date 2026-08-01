import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type MoodRecord = Database['public']['Tables']['moods']['Row']
export type MoodOption = Database['public']['Tables']['mood_options']['Row']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ==========================================
// Moods（心情记录）
// ==========================================

/** 加载全部心情记录（按设置时间倒序） */
export async function fetchMoods(): Promise<MoodRecord[]> {
  const { data, error } = await db
    .from('moods')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MoodRecord[]
}

/** 新增一条心情记录（一天可多条） */
export async function createMood(
  fields: { label: string; emoji: string; note: string },
): Promise<MoodRecord> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db
    .from('moods')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()
  if (error) throw error
  return data as MoodRecord
}

/** 删除一条心情记录 */
export async function deleteMood(id: string): Promise<void> {
  const { error } = await db.from('moods').delete().eq('id', id)
  if (error) throw error
}

// ==========================================
// MoodOptions（自定义心情选项）
// ==========================================

/** 加载自定义心情选项（按 sort_order 排序） */
export async function fetchMoodOptions(): Promise<MoodOption[]> {
  const { data, error } = await db
    .from('mood_options')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as MoodOption[]
}

/** 新增自定义心情选项 */
export async function createMoodOption(
  fields: { label: string; emoji: string },
): Promise<MoodOption> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db
    .from('mood_options')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()
  if (error) throw error
  return data as MoodOption
}

/** 删除自定义心情选项 */
export async function deleteMoodOption(id: string): Promise<void> {
  const { error } = await db.from('mood_options').delete().eq('id', id)
  if (error) throw error
}
