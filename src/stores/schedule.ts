import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '@/repositories/ScheduleRepository'
import type { Schedule } from '@/repositories/ScheduleRepository'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按星期几分组 */
  const byDayOfWeek = computed(() => {
    const map = new Map<number, Schedule[]>()
    for (let i = 1; i <= 7; i++) map.set(i, [])
    for (const s of schedules.value) {
      const list = map.get(s.day_of_week) || []
      list.push(s)
    }
    return map
  })

  async function loadSchedules() {
    loading.value = true
    error.value = null
    try {
      schedules.value = await fetchSchedules()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function addSchedule(fields: {
    course_name: string; class_name: string; day_of_week: number
    start_time: string; end_time: string; location: string; notes: string
  }): Promise<Schedule> {
    loading.value = true
    error.value = null
    try {
      const s = await createSchedule(fields)
      schedules.value.push(s)
      return s
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function editSchedule(id: string, fields: {
    course_name: string; class_name: string; day_of_week: number
    start_time: string; end_time: string; location: string; notes: string
  }): Promise<Schedule> {
    loading.value = true
    error.value = null
    try {
      const s = await updateSchedule(id, fields)
      const idx = schedules.value.findIndex((x) => x.id === id)
      if (idx !== -1) schedules.value[idx] = s
      return s
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeSchedule(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await deleteSchedule(id)
      schedules.value = schedules.value.filter((x) => x.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { schedules, loading, error, byDayOfWeek, loadSchedules, addSchedule, editSchedule, removeSchedule }
})
