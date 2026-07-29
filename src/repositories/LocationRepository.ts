import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']
type LocationUpdate = Database['public']['Tables']['locations']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await db.from('locations').select('*').is('deleted_at', null)
    .order('visit_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Location[]
}

export async function createLocation(
  fields: Pick<LocationInsert, 'name' | 'location_type' | 'description' | 'address' | 'visit_date'>,
): Promise<Location> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db.from('locations')
    .insert({ user_id: user.id, ...fields }).select('*').single()
  if (error) throw error
  return data as Location
}

export async function updateLocation(
  id: string, fields: Pick<LocationUpdate, 'name' | 'location_type' | 'description' | 'address' | 'visit_date'>,
): Promise<Location> {
  const { data, error } = await db.from('locations')
    .update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as Location
}

export async function softDeleteLocation(id: string): Promise<void> {
  const { error } = await db.from('locations')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function fetchDeletedLocations(): Promise<Location[]> {
  const { data, error } = await db.from('locations').select('*')
    .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Location[]
}

export async function restoreLocation(id: string): Promise<void> {
  const { error } = await db.from('locations')
    .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function permanentDeleteLocation(id: string): Promise<void> {
  const { error } = await db.from('locations').delete().eq('id', id)
  if (error) throw error
}
