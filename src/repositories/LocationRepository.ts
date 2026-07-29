import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']
type LocationUpdate = Database['public']['Tables']['locations']['Update']

/** 获取所有地点（按日期倒序） */
export async function fetchLocations(): Promise<Location[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .select('*')
    .order('visit_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Location[]
}

/** 创建地点 */
export async function createLocation(
  fields: Pick<LocationInsert, 'name' | 'location_type' | 'description' | 'address' | 'visit_date'>,
): Promise<Location> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()

  if (error) throw error
  return data as Location
}

/** 更新地点 */
export async function updateLocation(
  id: string,
  fields: Pick<LocationUpdate, 'name' | 'location_type' | 'description' | 'address' | 'visit_date'>,
): Promise<Location> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('locations')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Location
}

/** 删除地点 */
export async function deleteLocationById(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) throw error
}
