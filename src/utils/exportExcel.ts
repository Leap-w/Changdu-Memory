/**
 * 昌都记忆 Changdu Memory V5.1.5
 * 账本 Excel 导出工具 — 用 SheetJS (xlsx)
 *
 * 将账本系统的 4 类账目（支出 / 收入 / 资产 / 福利）导出至一个 Excel 文件，
 * 每类一个 sheet。分类英文值转中文标签，金额保留两位小数（数值型，便于 Excel 求和）。
 */

import * as XLSX from 'xlsx'
import { supabase } from '@/services/supabase'
import { formatLocalDate } from '@/utils/date'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any

/** 支出分类英文值 → 中文标签（与 Expense.vue / 导入校验保持一致） */
const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '零食', accommodation: '住宿',
  study: '学习', entertainment: '娱乐', medical: '医疗', other: '其他',
}

/** 收入分类英文值 → 中文标签 */
const INCOME_CATEGORY_LABELS: Record<string, string> = {
  salary: '工资', subsidy: '补贴', bonus: '奖金', part_time: '兼职',
  red_packet: '红包', second_hand: '出二手',
}

/** 福利分类英文值 → 中文标签 */
const WELFARE_CATEGORY_LABELS: Record<string, string> = {
  school_welfare: '学校福利', material: '物资补助', coupon: '优惠券', gift: '礼品', other: '其他',
}

/** 安全读取单张表，失败时返回空数组（不影响其他表导出） */
async function safeFetch(table: string): Promise<JsonValue[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table).select('*')
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

/** 构建一个带表头与列宽的 sheet，追加到 workbook */
function appendSheet(
  wb: XLSX.WorkBook,
  name: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map((h) => ({ wch: h.length > 2 ? 16 : 10 }))
  XLSX.utils.book_append_sheet(wb, ws, name)
}

/** 金额统一保留两位小数（返回数值，Excel 可求和） */
function money(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : Math.round(n * 100) / 100
}

/** 账本记录排序：日期正序 → 时间正序（无时间最后）→ 创建时间正序 */
function sortByDateTime(list: JsonValue[]): JsonValue[] {
  return list.sort((a, b) => {
    if (a.expense_date !== b.expense_date) return a.expense_date < b.expense_date ? -1 : 1
    const ta = a.expense_time ?? ''
    const tb = b.expense_time ?? ''
    if (ta && tb && ta !== tb) return ta < tb ? -1 : 1
    if (ta && !tb) return -1
    if (!ta && tb) return 1
    return (a.created_at ?? '') < (b.created_at ?? '') ? -1 : 1
  })
}

/** 触发浏览器下载 Excel 文件 */
function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename)
}

/**
 * 导出账本 4 类账目到一个 Excel 文件：
 *   - 支出 / 收入：来自 expenses 表（按 type 区分），仅导出未删除记录
 *   - 资产：assets 表
 *   - 福利：welfare_items 表
 */
export async function exportLedgerToExcel(): Promise<void> {
  const [expenses, assets, welfareItems] = await Promise.all([
    safeFetch('expenses'),
    safeFetch('assets'),
    safeFetch('welfare_items'),
  ])

  // 支出 / 收入：仅未删除记录，按日期正序
  const active = sortByDateTime(expenses.filter((e) => !e.deleted_at))
  const expenseRows = active
    .filter((e) => e.type !== 'income')
    .map((e) => [
      e.expense_date ?? '',
      e.expense_time ?? '',
      EXPENSE_CATEGORY_LABELS[e.category] ?? e.category ?? '',
      money(e.amount),
      e.description ?? '',
    ])
  const incomeRows = active
    .filter((e) => e.type === 'income')
    .map((e) => [
      e.expense_date ?? '',
      e.expense_time ?? '',
      INCOME_CATEGORY_LABELS[e.category] ?? e.category ?? '',
      money(e.amount),
      e.description ?? '',
    ])

  const assetRows = assets.map((a) => [a.name ?? '', money(a.amount)])
  const welfareRows = welfareItems.map((w) => [
    w.received_date ?? '',
    w.title ?? '',
    WELFARE_CATEGORY_LABELS[w.category] ?? w.category ?? '',
    money(w.value_estimate),
    w.description ?? '',
  ])

  const wb = XLSX.utils.book_new()
  appendSheet(wb, '支出', ['日期', '时间', '分类', '金额（¥）', '备注'], expenseRows)
  appendSheet(wb, '收入', ['日期', '时间', '分类', '金额（¥）', '备注'], incomeRows)
  appendSheet(wb, '资产', ['名称', '金额（¥）'], assetRows)
  appendSheet(wb, '福利', ['日期', '名称', '分类', '估值（¥）', '备注'], welfareRows)

  downloadWorkbook(wb, `昌都记忆_账本导出_${formatLocalDate()}.xlsx`)
}
