import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchDiaries,
  fetchDiaryById,
  fetchLatestDiary,
  createDiary,
  updateDiary,
  softDeleteDiary,
} from '@/repositories/DiaryRepository'
import type { Diary } from '@/repositories/DiaryRepository'

export const useDiaryStore = defineStore('diary', () => {
  const diaries = ref<Diary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按月份分组 */
  const groupedByMonth = computed(() => {
    const groups: { month: string; items: Diary[] }[] = []
    for (const d of diaries.value) {
      const month = d.diary_date.substring(0, 7) // YYYY-MM
      const last = groups[groups.length - 1]
      if (last && last.month === month) {
        last.items.push(d)
      } else {
        groups.push({ month, items: [d] })
      }
    }
    return groups
  })

  /** 加载列表 */
  async function loadDiaries() {
    loading.value = true
    error.value = null
    try {
      diaries.value = await fetchDiaries()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 获取单篇（先查内存再查数据库） */
  async function getDiaryById(id: string): Promise<Diary | null> {
    const cached = diaries.value.find((d) => d.id === id)
    if (cached) return cached
    return await fetchDiaryById(id)
  }

  /** 获取最近一篇 */
  async function getLatestDiary(): Promise<Diary | null> {
    return await fetchLatestDiary()
  }

  /** 创建 */
  async function addDiary(
    fields: { title: string; content: string; diary_date: string },
  ): Promise<Diary> {
    loading.value = true
    error.value = null
    try {
      const diary = await createDiary(fields)
      diaries.value.unshift(diary)
      return diary
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 更新 */
  async function editDiary(
    id: string,
    fields: { title: string; content: string; diary_date: string },
  ): Promise<Diary> {
    loading.value = true
    error.value = null
    try {
      const diary = await updateDiary(id, fields)
      const idx = diaries.value.findIndex((d) => d.id === id)
      if (idx !== -1) diaries.value[idx] = diary
      return diary
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除 */
  async function removeDiary(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await softDeleteDiary(id)
      diaries.value = diaries.value.filter((d) => d.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    diaries,
    loading,
    error,
    groupedByMonth,
    loadDiaries,
    getDiaryById,
    getLatestDiary,
    addDiary,
    editDiary,
    removeDiary,
  }
})
