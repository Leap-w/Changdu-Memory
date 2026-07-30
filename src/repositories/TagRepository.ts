import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Tag = Database['public']['Tables']['tags']['Row']

/** 获取用户所有标签（按使用频率排序） */
export async function fetchTags(): Promise<Tag[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tags')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Tag[]
}

/** 创建新标签 */
export async function createTag(name: string, color: string = '#4A8C94'): Promise<Tag> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('tags')
    .insert({ user_id: user.id, name, color })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('标签名已存在')
    throw error
  }
  return data as Tag
}

/** 删除标签 */
export async function deleteTagById(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ====== 日记标签关联 ======

export async function fetchDiaryTagIds(diaryId: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('diary_tags')
    .select('tag_id')
    .eq('diary_id', diaryId)

  if (error) throw error
  return (data ?? []).map((r: { tag_id: string }) => r.tag_id)
}

export async function setDiaryTags(diaryId: string, tagIds: string[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // 删除旧的
  await db.from('diary_tags').delete().eq('diary_id', diaryId)

  // 插入新的
  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ diary_id: diaryId, tag_id: tagId }))
    const { error } = await db.from('diary_tags').insert(rows)
    if (error) throw error
  }
}

// ====== 全量表查询（统计用） ======

export async function fetchAllDiaryTags(): Promise<{ diary_id: string; tag_id: string }[]> {
  const { data } = await (supabase as any).from('diary_tags').select('diary_id,tag_id')
  return (data ?? [])
}
