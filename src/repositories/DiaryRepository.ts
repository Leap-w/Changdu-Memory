import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Diary = Database['public']['Tables']['diaries']['Row']
type DiaryInsert = Database['public']['Tables']['diaries']['Insert']
type DiaryUpdate = Database['public']['Tables']['diaries']['Update']

/** 获取日记列表（按日期倒序） */
export async function fetchDiaries(): Promise<Diary[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('diaries')
    .select('*')
    .order('diary_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Diary[]
}

/** 获取单篇日记 */
export async function fetchDiaryById(id: string): Promise<Diary | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Diary
}

/** 获取最近一篇日记 */
export async function fetchLatestDiary(): Promise<Diary | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('diaries')
    .select('*')
    .order('diary_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Diary
}

/** 创建日记 */
export async function createDiary(
  fields: Pick<DiaryInsert, 'title' | 'content' | 'diary_date'>,
): Promise<Diary> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('diaries')
    .insert({
      user_id: user.id,
      title: fields.title ?? '',
      content: fields.content ?? '',
      diary_date: fields.diary_date,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Diary
}

/** 更新日记 */
export async function updateDiary(
  id: string,
  fields: Pick<DiaryUpdate, 'title' | 'content' | 'diary_date'>,
): Promise<Diary> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('diaries')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Diary
}

/** 删除日记 */
export async function deleteDiary(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('diaries')
    .delete()
    .eq('id', id)

  if (error) throw error
}
