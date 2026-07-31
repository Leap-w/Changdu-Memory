import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchMemories,
  createMemory,
  updateMemory,
  deleteMemory,
} from '@/repositories/MemoryRepository'
import {
  fetchMemoryPhotosBatch,
} from '@/repositories/MemoryPhotoRepository'
import type { Memory } from '@/repositories/MemoryRepository'
import type { MemoryPhoto } from '@/repositories/MemoryPhotoRepository'

export const useMemoryStore = defineStore('memory', () => {
  const memories = ref<Memory[]>([])
  const memoryPhotos = ref<Map<string, MemoryPhoto[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按月份分组（YYYY-MM），降序 */
  const groupedByMonth = computed(() => {
    const groups: { month: string; items: Memory[] }[] = []
    for (const m of memories.value) {
      const month = (m.event_date || '').substring(0, 7)
      const last = groups[groups.length - 1]
      if (last && last.month === month) {
        last.items.push(m)
      } else {
        groups.push({ month, items: [m] })
      }
    }
    return groups
  })

  function getPhotosForMemory(memoryId: string): MemoryPhoto[] {
    return memoryPhotos.value.get(memoryId) || []
  }

  async function loadMemories() {
    loading.value = true
    error.value = null
    try {
      memories.value = await fetchMemories()
      // 加载所有 memory 的照片
      const ids = memories.value.map((m) => m.id)
      if (ids.length > 0) {
        const photos = await fetchMemoryPhotosBatch(ids)
        const map = new Map<string, MemoryPhoto[]>()
        for (const p of photos) {
          const list = map.get(p.memory_id) || []
          list.push(p)
          map.set(p.memory_id, list)
        }
        memoryPhotos.value = map
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  function addPhotosToMemory(memoryId: string, photos: MemoryPhoto[]) {
    const existing = memoryPhotos.value.get(memoryId) || []
    memoryPhotos.value.set(memoryId, [...existing, ...photos])
    // 强制触发响应式更新
    memoryPhotos.value = new Map(memoryPhotos.value)
  }

  function removePhotoFromMemory(memoryId: string, photoId: string) {
    const existing = memoryPhotos.value.get(memoryId) || []
    memoryPhotos.value.set(memoryId, existing.filter((p) => p.id !== photoId))
    memoryPhotos.value = new Map(memoryPhotos.value)
  }

  function removePhotosForMemory(memoryId: string) {
    memoryPhotos.value.delete(memoryId)
    memoryPhotos.value = new Map(memoryPhotos.value)
  }

  async function addMemory(
    fields: {
      title: string
      content: string
      event_date: string
      category: string
      image_urls: string[]
    },
  ): Promise<Memory> {
    loading.value = true
    error.value = null
    try {
      const memory = await createMemory(fields)
      memories.value.unshift(memory)
      return memory
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function editMemory(
    id: string,
    fields: {
      title: string
      content: string
      event_date: string
      category: string
      image_urls: string[]
    },
  ): Promise<Memory> {
    loading.value = true
    error.value = null
    try {
      const memory = await updateMemory(id, fields)
      const idx = memories.value.findIndex((m) => m.id === id)
      if (idx !== -1) memories.value[idx] = memory
      return memory
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeMemory(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await deleteMemory(id)
      memories.value = memories.value.filter((m) => m.id !== id)
      removePhotosForMemory(id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    memories,
    memoryPhotos,
    loading,
    error,
    groupedByMonth,
    getPhotosForMemory,
    addPhotosToMemory,
    removePhotoFromMemory,
    removePhotosForMemory,
    loadMemories,
    addMemory,
    editMemory,
    removeMemory,
  }
})
