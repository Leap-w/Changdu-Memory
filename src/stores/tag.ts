import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchTags, createTag, deleteTagById } from '@/repositories/TagRepository'
import type { Tag } from '@/repositories/TagRepository'

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按名称排序的所有标签 */
  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  })

  /** 加载 */
  async function loadTags() {
    loading.value = true
    error.value = null
    try {
      tags.value = await fetchTags()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 创建（如果标签已存在则返回已有标签） */
  async function addTag(name: string, color?: string): Promise<Tag> {
    loading.value = true
    error.value = null
    try {
      // 检查是否已存在同名校对
      const existing = tags.value.find((t) => t.name === name)
      if (existing) return existing

      const tag = await createTag(name, color)
      tags.value.push(tag)
      return tag
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除 */
  async function removeTag(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await deleteTagById(id)
      tags.value = tags.value.filter((t) => t.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    tags,
    loading,
    error,
    sortedTags,
    loadTags,
    addTag,
    removeTag,
  }
})
