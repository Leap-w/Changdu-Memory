import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type JourneyMilestone = Database['public']['Tables']['journey_milestones']['Row']

/** 默认旅程节点（按起止日期比例推算日期，可自定义） */
export const DEFAULT_MILESTONES: { label: string; description: string; ratio: number }[] = [
  { label: '启程', description: '抵达昌都，开始支教旅程', ratio: 0 },
  { label: '适应', description: '适应高原环境与教学节奏', ratio: 0.08 },
  { label: '深耕', description: '深入教学，融入校园生活', ratio: 0.30 },
  { label: '过半', description: '支教旅程过半，收获与反思', ratio: 0.55 },
  { label: '沉淀', description: '沉淀经验，留下更多印记', ratio: 0.78 },
  { label: '归程', description: '圆满完成支教任务', ratio: 1 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/** 按起止日期 + 比例计算节点开始日期 */
export function computeMilestoneDate(startDate: string, endDate: string, ratio: number): string {
  const start = new Date(startDate + 'T00:00:00').getTime()
  const end = new Date(endDate + 'T00:00:00').getTime()
  const t = start + (end - start) * Math.max(0, Math.min(1, ratio))
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 获取当前用户的旅程节点
 * 首次访问时自动写入默认节点（日期按起止日期比例推算）
 */
export async function fetchMilestones(startDate?: string, endDate?: string): Promise<JourneyMilestone[]> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  const { data, error } = await db
    .from('journey_milestones')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error

  // 已有节点
  if (data && data.length > 0) {
    // 兼容旧数据：position 百分比时代遗留的节点 start_date 为空 → 按起止日期比例补算
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const missing = (data as any[]).some((r: any) => !r.start_date)
    if (missing && startDate && endDate) {
      const total = data.length
      const updated: JourneyMilestone[] = []
      for (let i = 0; i < data.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r: any = data[i]
        if (r.start_date) {
          updated.push(r as JourneyMilestone)
          continue
        }
        const ratio = total <= 1 ? 0 : i / (total - 1)
        const sd = computeMilestoneDate(startDate, endDate, ratio)
        const { data: up, error: upErr } = await db
          .from('journey_milestones')
          .update({ start_date: sd })
          .eq('id', r.id)
          .select('*')
          .single()
        if (upErr) throw upErr
        updated.push(up as JourneyMilestone)
      }
      return updated
    }
    return data as JourneyMilestone[]
  }

  // 首次使用：写入默认节点
  const s = startDate || new Date().toISOString().split('T')[0]
  const e = endDate || computeMilestoneDate(s, s, 0.999) // 无结束日时退回约 1 年后
  const rows = DEFAULT_MILESTONES.map((m, i) => ({
    user_id: user.id,
    label: m.label,
    description: m.description,
    start_date: computeMilestoneDate(s, e, m.ratio),
    sort_order: i,
  }))
  const { data: created, error: insertErr } = await db
    .from('journey_milestones')
    .insert(rows)
    .select('*')
    .order('sort_order', { ascending: true })
  if (insertErr) throw insertErr
  return (created ?? []) as JourneyMilestone[]
}

/**
 * 整体替换旅程节点（删除旧记录 + 批量插入新记录）
 * start_date 为各阶段开始日期
 */
export async function saveMilestones(
  items: { label: string; description: string; start_date: string }[],
): Promise<JourneyMilestone[]> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  const { error: delErr } = await db
    .from('journey_milestones')
    .delete()
    .eq('user_id', user.id)
  if (delErr) throw delErr

  if (items.length === 0) return []

  const rows = items.map((m, i) => ({
    user_id: user.id,
    label: m.label,
    description: m.description,
    start_date: m.start_date,
    sort_order: i,
  }))
  const { data, error } = await db
    .from('journey_milestones')
    .insert(rows)
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as JourneyMilestone[]
}
