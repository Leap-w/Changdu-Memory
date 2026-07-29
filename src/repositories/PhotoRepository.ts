import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type PhotoRecord = Database['public']['Tables']['photo_records']['Row']
type PhotoRecordInsert = Database['public']['Tables']['photo_records']['Insert']
type PhotoRecordUpdate = Database['public']['Tables']['photo_records']['Update']

const BUCKET = 'photos'

/**
 * 获取照片公开URL（带签名）
 */
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/**
 * 上传照片到 Supabase Storage 并写入数据库
 * @param file 原始文件（前端已压缩）
 */
export async function uploadPhoto(
  file: Blob,
  fileName: string,
  metadata: Pick<PhotoRecordInsert, 'title' | 'description' | 'photo_date' | 'location_id' | 'category'>,
): Promise<PhotoRecord> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // 构建唯一存储路径
  const ext = fileName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const storagePath = `${user.id}/${timestamp}-${random}.${ext}`

  // 上传到 Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) throw uploadError

  // 写入数据库
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await (supabase as any)
    .from('photo_records')
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      title: metadata.title ?? '',
      description: metadata.description ?? '',
      photo_date: metadata.photo_date,
      location_id: metadata.location_id ?? null,
      category: metadata.category ?? 'life',
    })
    .select('*')
    .single()

  if (dbError) throw dbError
  return data as PhotoRecord
}

/**
 * 获取所有照片（按日期倒序）
 */
export async function fetchPhotos(): Promise<PhotoRecord[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('photo_records')
    .select('*')
    .order('photo_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PhotoRecord[]
}

/**
 * 删除照片（Storage 文件 + 数据库记录）
 */
export async function deletePhotoById(id: string, storagePath: string): Promise<void> {
  // 先删 Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (storageError) {
    console.warn('Storage 删除失败:', storageError.message)
  }

  // 再删数据库
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (supabase as any)
    .from('photo_records')
    .delete()
    .eq('id', id)

  if (dbError) throw dbError
}

/**
 * 更新照片元数据（标题、描述、日期、地点、分类）
 */
export async function updatePhotoMetadata(
  id: string,
  fields: Pick<PhotoRecordUpdate, 'title' | 'description' | 'photo_date' | 'location_id' | 'category'>,
): Promise<PhotoRecord> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('photo_records')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as PhotoRecord
}
