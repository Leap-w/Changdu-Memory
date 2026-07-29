import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type PhotoRecord = Database['public']['Tables']['photo_records']['Row']
type PhotoRecordInsert = Database['public']['Tables']['photo_records']['Insert']
type PhotoRecordUpdate = Database['public']['Tables']['photo_records']['Update']

const BUCKET = 'photos'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadPhoto(
  file: Blob, fileName: string,
  metadata: Pick<PhotoRecordInsert, 'title' | 'description' | 'photo_date' | 'location_id' | 'category'>,
): Promise<PhotoRecord> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const ext = fileName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const storagePath = `${user.id}/${timestamp}-${random}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET).upload(storagePath, file, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) throw uploadError

  const { data, error: dbError } = await db.from('photo_records').insert({
    user_id: user.id, storage_path: storagePath,
    title: metadata.title ?? '', description: metadata.description ?? '',
    photo_date: metadata.photo_date, location_id: metadata.location_id ?? null,
    category: metadata.category ?? 'life',
  }).select('*').single()
  if (dbError) throw dbError
  return data as PhotoRecord
}

export async function fetchPhotos(): Promise<PhotoRecord[]> {
  const { data, error } = await db.from('photo_records').select('*').is('deleted_at', null)
    .order('photo_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PhotoRecord[]
}

export async function updatePhotoMetadata(
  id: string, fields: Pick<PhotoRecordUpdate, 'title' | 'description' | 'photo_date' | 'location_id' | 'category'>,
): Promise<PhotoRecord> {
  const { data, error } = await db.from('photo_records')
    .update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as PhotoRecord
}

/** 软删除（暂时不删 Storage 文件） */
export async function softDeletePhoto(id: string): Promise<void> {
  const { error } = await db.from('photo_records')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function fetchDeletedPhotos(): Promise<PhotoRecord[]> {
  const { data, error } = await db.from('photo_records').select('*')
    .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as PhotoRecord[]
}

export async function restorePhoto(id: string): Promise<void> {
  const { error } = await db.from('photo_records')
    .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** 永久删除（Storage 文件 + DB 记录） */
export async function permanentDeletePhoto(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (storageError) console.warn('Storage delete failed:', storageError.message)
  const { error } = await db.from('photo_records').delete().eq('id', id)
  if (error) throw error
}
