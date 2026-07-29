import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getTimeProfile, updateTimeProfile } from '@/repositories/TimeRepository'
import type { TimeProfile } from '@/repositories/TimeRepository'

export const useTimeStore = defineStore('time', () => {
  const profile = ref<TimeProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // === 计算属性 ===

  /** 开始日期（Date 对象） */
  const startDate = computed(() => {
    if (!profile.value?.start_date) return null
    return new Date(profile.value.start_date + 'T00:00:00')
  })

  /** 结束日期（Date 对象） */
  const endDate = computed(() => {
    if (!profile.value?.end_date) return null
    return new Date(profile.value.end_date + 'T00:00:00')
  })

  /** 总天数 */
  const totalDays = computed(() => {
    if (!startDate.value || !endDate.value) return 0
    return Math.ceil((endDate.value.getTime() - startDate.value.getTime()) / (1000 * 60 * 60 * 24))
  })

  /** 已过天数（基于今天日期） */
  const daysPassed = computed(() => {
    if (!startDate.value) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.ceil((today.getTime() - startDate.value.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  })

  /** 剩余天数 */
  const daysRemaining = computed(() => {
    if (!endDate.value) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.ceil((endDate.value.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  })

  /** 完成百分比（0-100） */
  const progress = computed(() => {
    if (totalDays.value === 0) return 0
    const pct = Math.round((daysPassed.value / totalDays.value) * 100)
    return Math.min(100, Math.max(0, pct))
  })

  /** 当前阶段（文字描述） */
  const phase = computed(() => {
    const pct = progress.value
    if (pct <= 0) return '即将开始'
    if (pct < 10) return '适应期'
    if (pct < 40) return '进行中'
    if (pct < 70) return '深入期'
    if (pct < 95) return '沉淀期'
    if (pct < 100) return '倒计时'
    return '已完成'
  })

  // === 操作 ===

  /** 加载时间配置（首次自动创建默认记录） */
  async function loadTimeProfile() {
    loading.value = true
    error.value = null
    try {
      const data = await getTimeProfile()
      profile.value = data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 更新时间配置 */
  async function updateProfile(
    fields: Pick<TimeProfile, 'project_name' | 'location' | 'start_date' | 'end_date'>,
  ) {
    loading.value = true
    error.value = null
    try {
      const data = await updateTimeProfile(fields)
      profile.value = data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    error,
    startDate,
    endDate,
    totalDays,
    daysPassed,
    daysRemaining,
    progress,
    phase,
    loadTimeProfile,
    updateProfile,
  }
})
