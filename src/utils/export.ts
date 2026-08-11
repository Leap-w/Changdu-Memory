/**
 * 昌都记忆 Changdu Memory V5.1.6
 * 数据导出工具 — JSON 格式
 *
 * 导出内容：用户基本信息、时间配置、日记、待办、工作、花费、标签，
 * 以及 学生/课程表/资产/福利/大事记/心情/地点/照片metadata/倒计时/旅程节点/心情选项。
 * 不导出：照片文件（仅导出 storage_path）。
 * 注：未建表或读取失败的表会安全跳过（返回 []/null），不阻塞其他模块。
 */

import { supabase } from '@/services/supabase'
import { formatLocalDate } from '@/utils/date'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any

export interface ExportData {
  exported_at: string
  version: string
  profile: JsonValue | null
  time_profile: JsonValue | null
  diaries: JsonValue[]
  todos: JsonValue[]
  works: JsonValue[]
  expenses: JsonValue[]
  tags: JsonValue[]
  diary_tags: JsonValue[]
  students: JsonValue[]
  schedules: JsonValue[]
  assets: JsonValue[]
  welfare_items: JsonValue[]
  memories: JsonValue[]
  moods: JsonValue[]
  locations: JsonValue[]
  photo_records: JsonValue[]
  countdowns: JsonValue[]
  diary_photos: JsonValue[]
  memory_photos: JsonValue[]
  mood_options: JsonValue[]
  journey_milestones: JsonValue[]
}

/**
 * 导出全部用户数据为 JSON 对象
 * 各模块数据获取失败时单独忽略，不影响其他模块
 */
export async function exportAllData(): Promise<ExportData> {
  const data: ExportData = {
    exported_at: new Date().toISOString(),
    version: '5.1.6',
    profile: null,
    time_profile: null,
    diaries: [],
    todos: [],
    works: [],
    expenses: [],
    tags: [],
    diary_tags: [],
    students: [],
    schedules: [],
    assets: [],
    welfare_items: [],
    memories: [],
    moods: [],
    locations: [],
    photo_records: [],
    countdowns: [],
    diary_photos: [],
    memory_photos: [],
    mood_options: [],
    journey_milestones: [],
  }

  // 安全获取，单模块失败不影响其他
  const safeFetch = async (table: string): Promise<JsonValue[]> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn(`导出 ${table} 失败:`, error.message)
        return []
      }
      return (data ?? []) as JsonValue[]
    } catch (err) {
      console.warn(`导出 ${table} 异常:`, err)
      return []
    }
  }

  const safeSingle = async (table: string): Promise<JsonValue | null> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*')
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        console.warn(`导出 ${table} 失败:`, error.message)
        return null
      }
      return data as JsonValue
    } catch (err) {
      console.warn(`导出 ${table} 异常:`, err)
      return null
    }
  }

  // 并行导出所有模块（未建表/失败的表返回 []/null，安全跳过）
  const [
    profile, timeProfile, diaries, todos, works, expenses, tags,
    students, schedules, assets, welfareItems, memories, moods,
    locations, photoRecords, countdowns, diaryPhotos, memoryPhotos, moodOptions, journeyMilestones,
  ] = await Promise.all([
    safeSingle('profiles'),
    safeSingle('time_profile'),
    safeFetch('diaries'),
    safeFetch('todos'),
    safeFetch('work_plans'),
    safeFetch('expenses'),
    safeFetch('tags'),
    safeFetch('students'),
    safeFetch('schedules'),
    safeFetch('assets'),
    safeFetch('welfare_items'),
    safeFetch('memories'),
    safeFetch('moods'),
    safeFetch('locations'),
    safeFetch('photo_records'),
    safeFetch('countdowns'),
    safeFetch('diary_photos'),
    safeFetch('memory_photos'),
    safeFetch('mood_options'),
    safeFetch('journey_milestones'),
  ])

  data.profile = profile
  data.time_profile = timeProfile
  data.diaries = diaries
  data.todos = todos
  data.works = works
  data.expenses = expenses
  data.tags = tags
  data.students = students
  data.schedules = schedules
  data.assets = assets
  data.welfare_items = welfareItems
  data.memories = memories
  data.moods = moods
  data.locations = locations
  data.photo_records = photoRecords
  data.countdowns = countdowns
  data.diary_photos = diaryPhotos
  data.memory_photos = memoryPhotos
  data.mood_options = moodOptions
  data.journey_milestones = journeyMilestones

  // 标签关联数据
  if (diaries.length > 0) {
    data.diary_tags = await safeFetch('diary_tags')
  }

  return data
}

/**
 * 触发浏览器下载 JSON 文件
 */
export function downloadJson(data: ExportData, filename?: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `昌都记忆_数据导出_${formatLocalDate()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
