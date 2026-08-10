/**
 * 昌都记忆 Changdu Memory V5.0
 * 年度统计纯函数 — 所有计算不依赖 Supabase
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

// ====== 通用工具 ======

/** 按 YYYY-MM 分组计数 */
function groupByMonth<T extends Row>(
  items: T[],
  dateField: string,
): { month: string; count: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const val = item[dateField]
    if (!val) continue
    const month = String(val).substring(0, 7)
    map.set(month, (map.get(month) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

/** 按某字段分组计数 */
function groupByField<T extends Row>(
  items: T[],
  field: string,
): { key: string; count: number }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const val = String(item[field] ?? 'other')
    map.set(val, (map.get(val) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
}

// ====== 日记统计 ======

export interface MonthlyCount {
  month: string
  count: number
}

export function getMonthlyDiaryCount(diaries: Row[]): MonthlyCount[] {
  return groupByMonth(diaries, 'diary_date')
}

// ====== 工作统计 ======

export function getWorkPeriodCount(works: Row[]): { key: string; count: number }[] {
  return groupByField(works, 'period')
}

export function getWorkCategoryCount(works: Row[]): { key: string; count: number }[] {
  return groupByField(works, 'category')
}

// ====== 花费统计 ======

export function getMonthlyExpenseTotal(expenses: Row[]): { month: string; total: number }[] {
  const map = new Map<string, number>()
  for (const e of expenses) {
    const month = String(e.expense_date ?? '').substring(0, 7)
    if (!month) continue
    map.set(month, (map.get(month) || 0) + (Number(e.amount) || 0))
  }
  return Array.from(map.entries())
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

export function getExpenseCategoryTotal(expenses: Row[]): { key: string; total: number }[] {
  const map = new Map<string, number>()
  for (const e of expenses) {
    const cat = String(e.category ?? 'other')
    map.set(cat, (map.get(cat) || 0) + (Number(e.amount) || 0))
  }
  return Array.from(map.entries())
    .map(([key, total]) => ({ key, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
}

export function getTotalExpense(expenses: Row[]): number {
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  return Math.round(total * 100) / 100
}

// ====== 标签统计 ======

export function getTagUsageCount(
  tags: Row[],
  diaryTags: Row[],
): { name: string; color: string; count: number }[] {
  const countMap = new Map<string, number>()
  for (const dt of diaryTags) {
    const tid = String(dt.tag_id)
    countMap.set(tid, (countMap.get(tid) || 0) + 1)
  }

  return tags
    .map((t) => ({
      name: String(t.name),
      color: String(t.color || '#4A8C94'),
      count: countMap.get(String(t.id)) || 0,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// ====== 常量：分类标签映射 ======

export const CATEGORY_LABELS: Record<string, string> = {
  // photo
  school: '学校',
  life: '生活',
  travel: '旅行',
  people: '人物',
  other: '其他',
  // expense
  food: '饮食',
  transport: '交通',
  daily: '日用品',
  study: '学习',
  medical: '医疗',
  // work
  teaching: '教学',
  meeting: '会议',
  training: '培训',
  // location
  city: '城市',
  // period
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}
