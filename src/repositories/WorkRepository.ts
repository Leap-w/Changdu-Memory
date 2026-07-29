import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type WorkPlan = Database['public']['Tables']['work_plans']['Row']
type WorkPlanInsert = Database['public']['Tables']['work_plans']['Insert']
type WorkPlanUpdate = Database['public']['Tables']['work_plans']['Update']

/** 获取所有工作安排（按日期倒序） */
export async function fetchWorks(): Promise<WorkPlan[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('work_plans')
    .select('*')
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as WorkPlan[]
}

/** 获取指定日期的工作 */
export async function fetchWorksByDate(date: string): Promise<WorkPlan[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('work_plans')
    .select('*')
    .eq('work_date', date)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as WorkPlan[]
}

/** 创建工作安排 */
export async function createWork(
  fields: Pick<WorkPlanInsert, 'title' | 'work_date' | 'period' | 'content' | 'category'>,
): Promise<WorkPlan> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('work_plans')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()

  if (error) throw error
  return data as WorkPlan
}

/** 更新工作安排 */
export async function updateWork(
  id: string,
  fields: Pick<WorkPlanUpdate, 'title' | 'work_date' | 'period' | 'content' | 'category'>,
): Promise<WorkPlan> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('work_plans')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as WorkPlan
}

/** 删除工作安排 */
export async function deleteWorkById(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('work_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}
