import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchSchedules(): Promise<Schedule[]> {
  const { data, error } = await db
    .from('schedules')
    .select('*')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as Schedule[]
}

export async function createSchedule(
  fields: Pick<ScheduleInsert, 'course_name' | 'class_name' | 'day_of_week' | 'start_time' | 'end_time' | 'location' | 'notes'>,
): Promise<Schedule> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db
    .from('schedules')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()
  if (error) throw error
  return data as Schedule
}

export async function updateSchedule(
  id: string,
  fields: Pick<ScheduleUpdate, 'course_name' | 'class_name' | 'day_of_week' | 'start_time' | 'end_time' | 'location' | 'notes'>,
): Promise<Schedule> {
  const { data, error } = await db
    .from('schedules')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Schedule
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await db.from('schedules').delete().eq('id', id)
  if (error) throw error
}
