import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchLocations,
  createLocation,
  updateLocation,
  softDeleteLocation,
} from '@/repositories/LocationRepository'
import type { Location } from '@/repositories/LocationRepository'

/** 按 type 分组排序 */
const TYPE_ORDER: Record<string, number> = {
  school: 0,
  city: 1,
  travel: 2,
  life: 3,
  other: 4,
}

export const useLocationStore = defineStore('location', () => {
  const locations = ref<Location[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按类型分组 */
  const groupedByType = computed(() => {
    const groups: { type: string; items: Location[] }[] = []
    for (const loc of locations.value) {
      const last = groups[groups.length - 1]
      if (last && last.type === loc.location_type) {
        last.items.push(loc)
      } else {
        groups.push({ type: loc.location_type, items: [loc] })
      }
    }
    // 按 TYPE_ORDER 排序
    groups.sort(
      (a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9),
    )
    return groups
  })

  /** 最近添加的5个地点 */
  const recentLocations = computed(() => {
    return locations.value.slice(0, 5)
  })

  /** 加载全部 */
  async function loadLocations() {
    loading.value = true
    error.value = null
    try {
      locations.value = await fetchLocations()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 创建 */
  async function addLocation(
    fields: { name: string; location_type: string; description: string; address: string; visit_date: string },
  ): Promise<Location> {
    loading.value = true
    error.value = null
    try {
      const location = await createLocation(fields)
      locations.value.unshift(location)
      return location
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 编辑 */
  async function editLocation(
    id: string,
    fields: { name: string; location_type: string; description: string; address: string; visit_date: string },
  ): Promise<Location> {
    loading.value = true
    error.value = null
    try {
      const location = await updateLocation(id, fields)
      const idx = locations.value.findIndex((l) => l.id === id)
      if (idx !== -1) locations.value[idx] = location
      return location
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除 */
  async function removeLocation(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await softDeleteLocation(id)
      locations.value = locations.value.filter((l) => l.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    locations,
    loading,
    error,
    groupedByType,
    recentLocations,
    loadLocations,
    addLocation,
    editLocation,
    removeLocation,
  }
})
