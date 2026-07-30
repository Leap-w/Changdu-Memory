import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchWelfareItems, createWelfareItem, updateWelfareItem, deleteWelfareItem } from '@/repositories/WelfareRepository'
import type { WelfareItem } from '@/repositories/WelfareRepository'

export const useWelfareStore = defineStore('welfare', () => {
  const items = ref<WelfareItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalValue = computed(() => {
    return Math.round(items.value.reduce((s, i) => s + Number(i.value_estimate), 0) * 100) / 100
  })

  async function loadItems() {
    loading.value = true; error.value = null
    try { items.value = await fetchWelfareItems() }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '加载失败' }
    finally { loading.value = false }
  }

  async function addItem(fields: { title: string; category: string; description: string; value_estimate: number; received_date: string }) {
    loading.value = true; error.value = null
    try { const w = await createWelfareItem(fields); items.value.unshift(w); return w }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '创建失败'; throw err }
    finally { loading.value = false }
  }

  async function editItem(id: string, fields: { title: string; category: string; description: string; value_estimate: number; received_date: string }) {
    loading.value = true; error.value = null
    try { const w = await updateWelfareItem(id, fields); const i = items.value.findIndex((x) => x.id === id); if (i >= 0) items.value[i] = w; return w }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '更新失败'; throw err }
    finally { loading.value = false }
  }

  async function removeItem(id: string) {
    loading.value = true; error.value = null
    try { await deleteWelfareItem(id); items.value = items.value.filter((x) => x.id !== id) }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '删除失败'; throw err }
    finally { loading.value = false }
  }

  return { items, loading, error, totalValue, loadItems, addItem, editItem, removeItem }
})
