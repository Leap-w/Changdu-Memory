import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getTimeProfile,
  updateTimeProfile,
  fetchCountdowns,
  createCountdown,
  updateCountdown,
  deleteCountdown,
  toggleCountdownPin,
} from '@/repositories/TimeRepository'
import type { TimeProfile, Countdown } from '@/repositories/TimeRepository'

/** 基于目标日计算距离目标还有多少天/已过多少天 */
export function getCountdownStats(item: { end_date: string }) {
  const target = new Date(item.end_date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return {
    diff,
    isPast: diff < 0,
    label: diff < 0 ? `已过 ${Math.abs(diff)} 天` : diff === 0 ? '就是今天' : `还有 ${diff} 天`,
  }
}

export const useTimeStore = defineStore('time', () => {
  const profile = ref<TimeProfile | null>(null)
  const countdowns = ref<Countdown[]>([])
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

  /** 加载所有倒计时 */
  async function loadCountdowns() {
    try {
      countdowns.value = await fetchCountdowns()
    } catch { /* ignore */ }
  }

  /** 排序：置顶优先，再按目标日 */
  function sortCountdowns() {
    countdowns.value.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.end_date.localeCompare(a.end_date)
    })
  }

  /** 创建倒计时 */
  async function addCountdown(fields: { title: string; end_date: string }): Promise<Countdown> {
    const cd = await createCountdown(fields)
    countdowns.value.push(cd)
    sortCountdowns()
    return cd
  }

  /** 编辑倒计时 */
  async function editCountdown(id: string, fields: { title: string; end_date: string }): Promise<Countdown> {
    const cd = await updateCountdown(id, fields)
    const idx = countdowns.value.findIndex((c) => c.id === id)
    if (idx !== -1) countdowns.value[idx] = cd
    sortCountdowns()
    return cd
  }

  /** 删除倒计时 */
  async function removeCountdown(id: string): Promise<void> {
    await deleteCountdown(id)
    countdowns.value = countdowns.value.filter((c) => c.id !== id)
  }

  /** 置顶切换 */
  async function togglePin(id: string): Promise<void> {
    const cd = countdowns.value.find((c) => c.id === id)
    if (!cd) return
    const newPinned = !cd.pinned
    await toggleCountdownPin(id, newPinned)
    cd.pinned = newPinned
    sortCountdowns()
  }

  return {
    profile,
    countdowns,
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
    loadCountdowns,
    addCountdown,
    editCountdown,
    removeCountdown,
    togglePin,
  }
})
