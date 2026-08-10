import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type MemoryPhoto = Database['public']['Tables']['memory_photos']['Row']

const BUCKET = 'photos'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/** 上传大事记图片到 Storage + 写入 memory_photos */
export async function uploadMemoryPhoto(
  memoryId: string,
  file: Blob,
  fileName: string,
): Promise<MemoryPhoto> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  const ext = fileName.split('.').pop() || 'jpg'
  const storagePath = `${user.id}/memory/${memoryId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (uploadError) throw uploadError

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const url = publicUrl.publicUrl

  const { data, error } = await db
    .from('memory_photos')
    .insert({ memory_id: memoryId, storage_path: storagePath, url })
    .select('*')
    .single()
  if (error) throw error
  return data as MemoryPhoto
}

/** 获取某条大事记的图片列表 */
async function fetchMemoryPhotos(memoryId: string): Promise<MemoryPhoto[]> {
  const { data, error } = await db
    .from('memory_photos')
    .select('*')
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as MemoryPhoto[]
}

/** 获取多条大事记的图片（批量） */
export async function fetchMemoryPhotosBatch(memoryIds: string[]): Promise<MemoryPhoto[]> {
  if (!memoryIds.length) return []
  const { data, error } = await db
    .from('memory_photos')
    .select('*')
    .in('memory_id', memoryIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as MemoryPhoto[]
}

/** 删除单张大事记图片 */
export async function deleteMemoryPhoto(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (storageError) {
    // Storage 删除失败不阻塞数据库清理，但抛出让调用方感知
    console.error('[MemoryPhoto] Storage delete failed:', storageError.message, 'path:', storagePath)
  }
  const { error } = await db.from('memory_photos').delete().eq('id', id)
  if (error) throw error
}

/** 删除某条大事记的所有图片 */
export async function deleteAllMemoryPhotos(memoryId: string): Promise<void> {
  const photos = await fetchMemoryPhotos(memoryId)
  for (const p of photos) {
    try { await deleteMemoryPhoto(p.id, p.storage_path) } catch { /* ignore */ }
  }
}
