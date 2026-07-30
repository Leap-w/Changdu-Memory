import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type DiaryPhoto = Database['public']['Tables']['diary_photos']['Row']

const BUCKET = 'photos'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/** 上传日记图片到 Storage + 写入 diary_photos */
export async function uploadDiaryPhoto(
  diaryId: string,
  file: Blob,
  fileName: string,
  sortOrder: number,
): Promise<DiaryPhoto> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  const ext = fileName.split('.').pop() || 'jpg'
  const storagePath = `${user.id}/diary/${diaryId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) throw uploadError

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  const { data, error } = await db
    .from('diary_photos')
    .insert({ diary_id: diaryId, storage_path: storagePath, image_url: publicUrl.publicUrl, sort_order: sortOrder })
    .select('*')
    .single()
  if (error) throw error
  return data as DiaryPhoto
}

/** 获取某篇日记的图片列表 */
export async function fetchDiaryPhotos(diaryId: string): Promise<DiaryPhoto[]> {
  const { data, error } = await db
    .from('diary_photos')
    .select('*')
    .eq('diary_id', diaryId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as DiaryPhoto[]
}

/** 删除单张日记图片 */
export async function deleteDiaryPhoto(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (storageError) console.warn('Storage delete failed:', storageError.message)
  const { error } = await db.from('diary_photos').delete().eq('id', id)
  if (error) throw error
}

/** 删除日记的所有图片 */
export async function deleteAllDiaryPhotos(diaryId: string): Promise<void> {
  const photos = await fetchDiaryPhotos(diaryId)
  for (const p of photos) {
    try { await deleteDiaryPhoto(p.id, p.storage_path) } catch { /* ignore */ }
  }
}

/** 获取图片公开 URL */
export function getDiaryPhotoUrl(photo: DiaryPhoto): string {
  if (photo.image_url) return photo.image_url
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(photo.storage_path)
  return data.publicUrl
}
