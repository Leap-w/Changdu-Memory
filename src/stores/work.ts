import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchWorks,
  createWork,
  updateWork as updateWorkRepo,
  softDeleteWork,
  softDeleteWorks,
} from '@/repositories/WorkRepository'
import type { WorkPlan } from '@/repositories/WorkRepository'
import { formatLocalDate } from '@/utils/date'

/** 时间段排序权重 */
const PERIOD_ORDER: Record<string, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
}

export const useWorkStore = defineStore('work', () => {
  const works = ref<WorkPlan[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按日期分组（每组内按时间段排序） */
  const groupedByDate = computed(() => {
    const groups: { date: string; items: WorkPlan[] }[] = []
    for (const w of works.value) {
      const last = groups[groups.length - 1]
      if (last && last.date === w.work_date) {
        last.items.push(w)
        // 按 period 排序
        last.items.sort((a, b) => (PERIOD_ORDER[a.period] ?? 9) - (PERIOD_ORDER[b.period] ?? 9))
      } else {
        groups.push({ date: w.work_date, items: [w] })
      }
    }
    return groups
  })

  /** 今日工作 */
  const todayWorks = computed(() => {
    const today = formatLocalDate()
    return works.value
      .filter((w) => w.work_date === today)
      .sort((a, b) => (PERIOD_ORDER[a.period] ?? 9) - (PERIOD_ORDER[b.period] ?? 9))
  })

  /** 加载全部 */
  async function loadWorks() {
    loading.value = true
    error.value = null
    try {
      works.value = await fetchWorks()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 创建 */
  async function addWork(
    fields: { title: string; work_date: string; content: string; start_time?: string | null; end_time?: string | null },
  ): Promise<WorkPlan> {
    loading.value = true
    error.value = null
    try {
      const work = await createWork(fields)
      works.value.unshift(work)
      return work
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 编辑 */
  async function updateWork(
    id: string,
    fields: { title: string; work_date: string; content: string; start_time?: string | null; end_time?: string | null },
  ): Promise<WorkPlan> {
    loading.value = true
    error.value = null
    try {
      const work = await updateWorkRepo(id, fields)
      const idx = works.value.findIndex((w) => w.id === id)
      if (idx >= 0) works.value[idx] = work
      else works.value.unshift(work)
      return work
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除 */
  async function removeWork(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await softDeleteWork(id)
      works.value = works.value.filter((w) => w.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 批量删除（软删除，进回收站） */
  async function batchRemove(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    loading.value = true
    error.value = null
    try {
      await softDeleteWorks(ids)
      const set = new Set(ids)
      works.value = works.value.filter((w) => !set.has(w.id))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '批量删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    works,
    loading,
    error,
    groupedByDate,
    todayWorks,
    loadWorks,
    addWork,
    updateWork,
    removeWork,
    batchRemove,
  }
})
