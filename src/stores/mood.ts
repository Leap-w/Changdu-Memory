import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchMoods,
  createMood,
  deleteMood,
  fetchMoodOptions,
  createMoodOption,
  deleteMoodOption,
} from '@/repositories/MoodRepository'
import type { MoodRecord, MoodOption } from '@/repositories/MoodRepository'
import { formatLocalDate } from '@/utils/date'

/** 预设心情（可自定义扩充） */
export const PRESET_MOODS: { label: string; emoji: string }[] = [
  { label: '开心', emoji: '😄' },
  { label: '充实', emoji: '💪' },
  { label: '疲惫', emoji: '😪' },
  { label: '思念', emoji: '🥺' },
  { label: '感动', emoji: '🥹' },
  { label: '饿', emoji: '🍜' },
  { label: '低落', emoji: '😞' },
]

/** 自定义心情可选的通用 emoji 集合 */
export const EMOJI_CHOICES: string[] = [
  '😊', '😄', '😁', '😆', '🤩', '🥰', '😌', '😎',
  '🥹', '😴', '😪', '🥺', '😭', '😤', '😋', '🍜',
  '🍰', '☕', '🏔️', '📚', '💪', '🔥', '⭐', '❤️',
]

export function todayStr(): string {
  return formatLocalDate()
}

export const useMoodStore = defineStore('mood', () => {
  const records = ref<MoodRecord[]>([])
  const customOptions = ref<MoodOption[]>([])
  const loading = ref(false)

  /** 今日全部心情记录（按设置时间倒序） */
  const todayRecords = computed(() => {
    const today = todayStr()
    return records.value.filter((r) => r.mood_date === today)
  })

  /** 外部卡片展示：今日最新的心情 */
  const todayLatestMood = computed(() => todayRecords.value[0] ?? null)

  /** 加载全部心情记录 + 自定义选项 */
  async function loadAll() {
    loading.value = true
    try {
      const [moods, options] = await Promise.all([fetchMoods(), fetchMoodOptions()])
      records.value = moods
      customOptions.value = options
    } catch { /* ignore */ }
    finally {
      loading.value = false
    }
  }

  /** 新增一条心情记录（mood_date 可选，JSON 恢复时保留原日期） */
  async function addRecord(label: string, emoji: string, note: string, moodDate?: string): Promise<MoodRecord> {
    const rec = await createMood({ label, emoji, note, ...(moodDate ? { mood_date: moodDate } : {}) })
    records.value.unshift(rec)
    return rec
  }

  /** 删除一条心情记录 */
  async function removeRecord(id: string): Promise<void> {
    await deleteMood(id)
    records.value = records.value.filter((r) => r.id !== id)
  }

  /** 新增自定义心情选项 */
  async function addOption(label: string, emoji: string): Promise<MoodOption> {
    const opt = await createMoodOption({ label, emoji })
    customOptions.value.push(opt)
    return opt
  }

  /** 删除自定义心情选项 */
  async function removeOption(id: string): Promise<void> {
    await deleteMoodOption(id)
    customOptions.value = customOptions.value.filter((o) => o.id !== id)
  }

  return {
    records,
    customOptions,
    loading,
    todayRecords,
    todayLatestMood,
    loadAll,
    addRecord,
    removeRecord,
    addOption,
    removeOption,
  }
})
