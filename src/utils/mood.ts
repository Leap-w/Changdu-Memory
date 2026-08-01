/**
 * 今日心情 — 独立轻量功能
 *
 * 仅保存在浏览器 localStorage，不写入数据库。
 */

export interface MoodOption {
  key: string
  label: string
  emoji: string
  color: string
}

export interface MoodRecord {
  date: string
  key: string
  label: string
  emoji: string
  note: string
  updated_at: number
}

export const MOODS: MoodOption[] = [
  { key: 'happy',   label: '开心', emoji: '😄', color: '#F0A63C' },
  { key: 'calm',    label: '平静', emoji: '😌', color: '#4A8C94' },
  { key: 'busy',    label: '充实', emoji: '💪', color: '#6FA8DC' },
  { key: 'tired',   label: '疲惫', emoji: '😪', color: '#8E8E93' },
  { key: 'miss',    label: '思念', emoji: '🥺', color: '#8E7CB5' },
  { key: 'touched', label: '感动', emoji: '🥹', color: '#D08770' },
  { key: 'excited', label: '期待', emoji: '🤩', color: '#6B9E85' },
  { key: 'down',    label: '低落', emoji: '😞', color: '#BF616A' },
]

const STORAGE_KEY = 'cd_mood_history'

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function readHistory(): MoodRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(records: MoodRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch { /* 存储失败忽略 */ }
}

/** 全部心情记录（按日期倒序） */
export function getMoodHistory(): MoodRecord[] {
  return readHistory().sort((a, b) => b.date.localeCompare(a.date))
}

/** 今日心情 */
export function getTodayMood(): MoodRecord | null {
  const today = getToday()
  return readHistory().find((r) => r.date === today) ?? null
}

/** 保存（或更新）今日心情 */
export function saveTodayMood(key: string, note: string): MoodRecord {
  const option = MOODS.find((o) => o.key === key) ?? MOODS[0]
  const today = getToday()
  const record: MoodRecord = {
    date: today,
    key: option.key,
    label: option.label,
    emoji: option.emoji,
    note: note.trim(),
    updated_at: Date.now(),
  }
  const rest = readHistory().filter((r) => r.date !== today)
  writeHistory([record, ...rest])
  return record
}

/** 删除今日心情 */
export function removeTodayMood(): void {
  const today = getToday()
  writeHistory(readHistory().filter((r) => r.date !== today))
}
