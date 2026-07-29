import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type TimeProfile = Database['public']['Tables']['time_profile']['Row']
type TimeProfileUpdate = Database['public']['Tables']['time_profile']['Update']

const DEFAULT_PROFILE = {
  project_name: '昌都记忆',
  location: '西藏昌都',
  start_date: '2026-07-20',
  end_date: '2027-07-20',
}

/**
 * 获取当前用户的时间配置
 * 如果不存在则自动创建默认记录
 */
export async function getTimeProfile(): Promise<TimeProfile> {
  const { data: existing } = await supabase
    .from('time_profile')
    .select('*')
    .single()

  if (existing) return existing

  // 首次使用：自动创建默认记录
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (supabase as any)
    .from('time_profile')
    .insert({
      user_id: user.id,
      ...DEFAULT_PROFILE,
    })
    .select('*')
    .single()

  if (error) throw error
  return created as TimeProfile
}

/**
 * 更新时间配置
 */
export async function updateTimeProfile(
  fields: Pick<TimeProfileUpdate, 'project_name' | 'location' | 'start_date' | 'end_date'>,
): Promise<TimeProfile> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: current } = await (supabase as any)
    .from('time_profile')
    .select('id')
    .single()

  if (!current) throw new Error('未找到时间配置')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('time_profile')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select('*')
    .single()

  if (error) throw error
  return data as TimeProfile
}
