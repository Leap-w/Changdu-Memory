import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type WelfareItem = Database['public']['Tables']['welfare_items']['Row']
type WelfareItemInsert = Database['public']['Tables']['welfare_items']['Insert']
type WelfareItemUpdate = Database['public']['Tables']['welfare_items']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchWelfareItems(): Promise<WelfareItem[]> {
  const { data, error } = await db.from('welfare_items').select('*').order('received_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as WelfareItem[]
}

export async function createWelfareItem(fields: Pick<WelfareItemInsert, 'title' | 'category' | 'description' | 'value_estimate' | 'received_date'>) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db.from('welfare_items').insert({ user_id: user.id, ...fields }).select('*').single()
  if (error) throw error
  return data as WelfareItem
}

export async function updateWelfareItem(id: string, fields: Pick<WelfareItemUpdate, 'title' | 'category' | 'description' | 'value_estimate' | 'received_date'>) {
  const { data, error } = await db.from('welfare_items').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as WelfareItem
}

export async function deleteWelfareItem(id: string) {
  const { error } = await db.from('welfare_items').delete().eq('id', id)
  if (error) throw error
}
