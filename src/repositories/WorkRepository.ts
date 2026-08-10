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

export async function fetchWorksByDate(date: string): Promise<WorkPlan[]> {
  const { data, error } = await db.from('work_plans').select('*').is('deleted_at', null)
    .eq('work_date', date).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WorkPlan[]
}

export async function createWork(
  fields: Pick<WorkPlanInsert, 'title' | 'work_date' | 'content'> & Partial<Pick<WorkPlanInsert, 'period' | 'category'>>,
): Promise<WorkPlan> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const insertData = {
    user_id: user.id,
    title: fields.title,
    work_date: fields.work_date ?? formatLocalDate(),
    content: fields.content ?? null,
    period: fields.period ?? 'morning',
    category: fields.category ?? 'other',
  }
  const { data, error } = await db.from('work_plans')
    .insert(insertData).select('*').single()
  if (error) throw error
  return data as WorkPlan
}

export async function updateWork(
  id: string, fields: Pick<WorkPlanUpdate, 'title' | 'work_date' | 'content'> & Partial<Pick<WorkPlanUpdate, 'period' | 'category'>>,
): Promise<WorkPlan> {
  const { data, error } = await db.from('work_plans')
    .update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as WorkPlan
}

export async function softDeleteWork(id: string): Promise<void> {
  const { error } = await db.from('work_plans')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
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
