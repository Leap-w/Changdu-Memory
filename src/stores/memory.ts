import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchMemories,
  createMemory,
  updateMemory,
  deleteMemory,
} from '@/repositories/MemoryRepository'
import type { Memory } from '@/repositories/MemoryRepository'

export const useMemoryStore = defineStore('memory', () => {
  const memories = ref<Memory[]>([])
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

  async function loadMemories() {
    loading.value = true
    error.value = null
    try {
      memories.value = await fetchMemories()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    memories,
    loading,
    error,
    groupedByMonth,
    loadMemories,
    addMemory,
    editMemory,
    removeMemory,
  }
})
