import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Diary = Database['public']['Tables']['diaries']['Row']
type DiaryInsert = Database['public']['Tables']['diaries']['Insert']
type DiaryUpdate = Database['public']['Tables']['diaries']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/** 获取日记列表（按日期倒序，排除已删除） */
export async function fetchDiaries(): Promise<Diary[]> {
  const { data, error } = await db
    .from('diaries')
    .select('*')
    .is('deleted_at', null)
    .order('diary_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Diary[]
}

export async function fetchDiaryById(id: string): Promise<Diary | null> {
  const { data, error } = await db.from('diaries').select('*').eq('id', id).single()
  if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
  return data as Diary
}

export async function fetchLatestDiary(): Promise<Diary | null> {
  const { data, error } = await db
    .from('diaries').select('*').is('deleted_at', null)
    .order('diary_date', { ascending: false }).limit(1).single()
  if (error) return error.code === 'PGRST116' ? null : (() => { throw error })()
  return data as Diary
}

export async function createDiary(
  fields: Pick<DiaryInsert, 'title' | 'content' | 'diary_date'>,
): Promise<Diary> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db.from('diaries').insert({
    user_id: user.id, title: fields.title ?? '', content: fields.content ?? '', diary_date: fields.diary_date,
  }).select('*').single()
  if (error) throw error
  return data as Diary
}

export async function updateDiary(
  id: string, fields: Pick<DiaryUpdate, 'title' | 'content' | 'diary_date'>,
): Promise<Diary> {
  const { data, error } = await db.from('diaries')
    .update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as Diary
}

/** 软删除 */
export async function softDeleteDiary(id: string): Promise<void> {
  const { error } = await db.from('diaries')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** 获取回收站 */
export async function fetchDeletedDiaries(): Promise<Diary[]> {
  const { data, error } = await db.from('diaries').select('*')
    .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Diary[]
}

/** 恢复 */
export async function restoreDiary(id: string): Promise<void> {
  const { error } = await db.from('diaries')
    .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** 永久删除 */
export async function permanentDeleteDiary(id: string): Promise<void> {
  const { error } = await db.from('diaries').delete().eq('id', id)
  if (error) throw error
}
