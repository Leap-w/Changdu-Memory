import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'
import { formatLocalDate } from '@/utils/date'

export type WorkPlan = Database['public']['Tables']['work_plans']['Row']
type WorkPlanInsert = Database['public']['Tables']['work_plans']['Insert']
type WorkPlanUpdate = Database['public']['Tables']['work_plans']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchWorks(): Promise<WorkPlan[]> {
  const { data, error } = await db.from('work_plans').select('*').is('deleted_at', null)
    .order('work_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WorkPlan[]
}

/**
 * 根据开始时间推导时间段（用于 period 排序/统计字段）。
 * 不再默认补成 'morning'，避免"未设置时间却显示上午"。
 */
function periodFromTime(t: string | null | undefined): string {
  if (!t) return 'morning'
  const hour = Number(String(t).split(':')[0])
  if (!Number.isFinite(hour)) return 'morning'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export async function createWork(
  fields: Pick<WorkPlanInsert, 'title' | 'work_date' | 'content'> & Partial<Pick<WorkPlanInsert, 'period' | 'category' | 'start_time' | 'end_time'>>,
): Promise<WorkPlan> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const insertData = {
    user_id: user.id,
    title: fields.title,
    work_date: fields.work_date ?? formatLocalDate(),
    content: fields.content ?? null,
    period: fields.period ?? periodFromTime(fields.start_time),
    category: fields.category ?? 'other',
    start_time: fields.start_time ?? null,
    end_time: fields.end_time ?? null,
  }
  const { data, error } = await db.from('work_plans')
    .insert(insertData).select('*').single()
  if (error) throw error
  return data as WorkPlan
}

export async function updateWork(
  id: string, fields: Pick<WorkPlanUpdate, 'title' | 'work_date' | 'content'> & Partial<Pick<WorkPlanUpdate, 'period' | 'category' | 'start_time' | 'end_time'>>,
): Promise<WorkPlan> {
  const updateData: Record<string, unknown> = { ...fields, updated_at: new Date().toISOString() }
  // 开始时间变化时同步推导 period（保证排序/统计与真实时间一致）
  if (fields.start_time !== undefined) {
    updateData.period = periodFromTime(fields.start_time)
  }
  const { data, error } = await db.from('work_plans')
    .update(updateData).eq('id', id).select('*').single()
  if (error) throw error
  return data as WorkPlan
}

export async function softDeleteWork(id: string): Promise<void> {
  const { error } = await db.from('work_plans')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** 批量软删除多个行政安排（进回收站，批量编辑多选删除用） */
export async function softDeleteWorks(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await db.from('work_plans')
    .update({ deleted_at: new Date().toISOString() }).in('id', ids)
  if (error) throw error
}

export async function fetchDeletedWorks(): Promise<WorkPlan[]> {
  const { data, error } = await db.from('work_plans').select('*')
    .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WorkPlan[]
}

export async function restoreWork(id: string): Promise<void> {
  const { error } = await db.from('work_plans')
    .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function permanentDeleteWork(id: string): Promise<void> {
  const { error } = await db.from('work_plans').delete().eq('id', id)
  if (error) throw error
}
