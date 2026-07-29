import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchPhotos,
  uploadPhoto,
  softDeletePhoto,
  updatePhotoMetadata,
  getPhotoUrl,
} from '@/repositories/PhotoRepository'
import type { PhotoRecord } from '@/repositories/PhotoRepository'

export const usePhotoStore = defineStore('photo', () => {
  const photos = ref<PhotoRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按分类分组 */
  const groupedByCategory = computed(() => {
    const groups: { category: string; items: PhotoRecord[] }[] = []
    const order = ['school', 'life', 'travel', 'people', 'other']
    for (const cat of order) {
      const items = photos.value.filter((p) => p.category === cat)
      if (items.length > 0) {
        groups.push({ category: cat, items })
      }
    }
    return groups
  })

  /** 加载全部 */
  async function loadPhotos() {
    loading.value = true
    error.value = null
    try {
      photos.value = await fetchPhotos()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 上传 */
  async function addPhoto(
    file: Blob,
    fileName: string,
    metadata: { title: string; description: string; photo_date: string; location_id: string | null; category: string },
  ): Promise<PhotoRecord> {
    loading.value = true
    error.value = null
    try {
      const photo = await uploadPhoto(file, fileName, metadata)
      photos.value.unshift(photo)
      return photo
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '上传失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 编辑元数据 */
  async function editPhoto(
    id: string,
    fields: { title: string; description: string; photo_date: string; location_id: string | null; category: string },
  ): Promise<PhotoRecord> {
    loading.value = true
    error.value = null
    try {
      const photo = await updatePhotoMetadata(id, fields)
      const idx = photos.value.findIndex((p) => p.id === id)
      if (idx !== -1) photos.value[idx] = photo
      return photo
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除 */
  async function removePhoto(id: string): Promise<void> {
    const photo = photos.value.find((p) => p.id === id)
    if (!photo) return

    loading.value = true
    error.value = null
    try {
      await softDeletePhoto(id)
      photos.value = photos.value.filter((p) => p.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 获取指定照片 */
  function getPhotoById(id: string): PhotoRecord | undefined {
    return photos.value.find((p) => p.id === id)
  }

  /** 获取照片URL */
  function getPhotoDisplayUrl(photo: PhotoRecord): string {
    return getPhotoUrl(photo.storage_path)
  }

  return {
    photos,
    loading,
    error,
    groupedByCategory,
    loadPhotos,
    addPhoto,
    editPhoto,
    removePhoto,
    getPhotoById,
    getPhotoDisplayUrl,
  }
})
