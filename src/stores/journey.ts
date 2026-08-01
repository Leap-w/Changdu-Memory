import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchMilestones,
  saveMilestones,
} from '@/repositories/JourneyRepository'
import type { JourneyMilestone } from '@/repositories/JourneyRepository'

export const useJourneyStore = defineStore('journey', () => {
  const milestones = ref<JourneyMilestone[]>([])
  const loading = ref(false)

  /** 加载旅程节点（首次自动写入默认值，日期按旅程起止日期推算） */
  async function loadMilestones(startDate?: string | null, endDate?: string | null) {
    loading.value = true
    try {
      milestones.value = await fetchMilestones(startDate ?? undefined, endDate ?? undefined)
    } catch { /* ignore */ }
    finally {
      loading.value = false
    }
  }

  /** 整体保存旅程节点 */
  async function persistMilestones(
    items: { label: string; description: string; start_date: string }[],
  ): Promise<void> {
    loading.value = true
    try {
      milestones.value = await saveMilestones(items)
    } finally {
      loading.value = false
    }
  }

  return {
    milestones,
    loading,
    loadMilestones,
    persistMilestones,
  }
})
