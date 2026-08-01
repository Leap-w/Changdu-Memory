import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'
import { deleteAllMemoryPhotos } from './MemoryPhotoRepository'

export type Memory = Database['public']['Tables']['memories']['Row']
type MemoryInsert = Database['public']['Tables']['memories']['Insert']
type MemoryUpdate = Database['public']['Tables']['memories']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchMemories(): Promise<Memory[]> {
  const { data, error } = await db
    .from('memories')
    .select('*')
    .order('event_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Memory[]
}

export async function createMemory(
  fields: Pick<MemoryInsert, 'title' | 'content' | 'event_date' | 'category' | 'location' | 'image_urls'>,
): Promise<Memory> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db
    .from('memories')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()
  if (error) throw error
  return data as Memory
}

export async function updateMemory(
  id: string,
  fields: Pick<MemoryUpdate, 'title' | 'content' | 'event_date' | 'category' | 'location' | 'image_urls'>,
): Promise<Memory> {
  const { data, error } = await db
    .from('memories')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Memory
}

export async function deleteMemory(id: string): Promise<void> {
  // 先删除关联的 Storage 图片
  try { await deleteAllMemoryPhotos(id) } catch { /* ignore */ }
  const { error } = await db.from('memories').delete().eq('id', id)
  if (error) throw error
}
