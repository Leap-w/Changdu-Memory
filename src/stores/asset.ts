import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAssets, createAsset, updateAsset, deleteAsset } from '@/repositories/AssetRepository'
import type { Asset } from '@/repositories/AssetRepository'

export const useAssetStore = defineStore('asset', () => {
  const assets = ref<Asset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalAssets = computed(() => {
    return Math.round(assets.value.reduce((s, a) => s + Number(a.amount), 0) * 100) / 100
  })

  async function loadAssets() {
    loading.value = true; error.value = null
    try { assets.value = await fetchAssets() }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '加载失败' }
    finally { loading.value = false }
  }

  async function addAsset(fields: { name: string; amount: number }) {
    loading.value = true; error.value = null
    try { const a = await createAsset({ name: fields.name, amount: fields.amount, sort_order: assets.value.length }); assets.value.push(a); return a }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '创建失败'; throw err }
    finally { loading.value = false }
  }

  async function editAsset(id: string, fields: { name: string; amount: number }) {
    loading.value = true; error.value = null
    try { const a = await updateAsset(id, fields); const i = assets.value.findIndex((x) => x.id === id); if (i >= 0) assets.value[i] = a; return a }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '更新失败'; throw err }
    finally { loading.value = false }
  }

  async function removeAsset(id: string) {
    loading.value = true; error.value = null
    try { await deleteAsset(id); assets.value = assets.value.filter((x) => x.id !== id) }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '删除失败'; throw err }
    finally { loading.value = false }
  }

  return { assets, loading, error, totalAssets, loadAssets, addAsset, editAsset, removeAsset }
})
