import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Asset = Database['public']['Tables']['assets']['Row']
type AssetInsert = Database['public']['Tables']['assets']['Insert']
type AssetUpdate = Database['public']['Tables']['assets']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await db.from('assets').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Asset[]
}

export async function createAsset(fields: Pick<AssetInsert, 'name' | 'amount' | 'sort_order'>) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db.from('assets').insert({ user_id: user.id, ...fields }).select('*').single()
  if (error) throw error
  return data as Asset
}

export async function updateAsset(id: string, fields: Pick<AssetUpdate, 'name' | 'amount'>) {
  const { data, error } = await db.from('assets').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as Asset
}

export async function deleteAsset(id: string) {
  const { error } = await db.from('assets').delete().eq('id', id)
  if (error) throw error
}
