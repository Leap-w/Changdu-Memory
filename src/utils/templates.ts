/**
 * 昌都记忆 Changdu Memory V5.0
 * Excel 模板生成工具 — 用 SheetJS (xlsx) 生成空白模板
 */
import * as XLSX from 'xlsx'

/** 所有模板定义 */
export interface TemplateDef {
  label: string
  fileName: string
  headers: string[]
  exampleRow: (string | number)[]
}

export const TEMPLATES: Record<string, TemplateDef> = {
  diaries: {
    label: '日记模板',
    fileName: '日记导入模板.xlsx',
    headers: ['date', 'title', 'content'],
    exampleRow: ['2026-07-29', '昌都的第一堂课', '今天第一次站上讲台...'],
  },
  work_plans: {
    label: '工作模板',
    fileName: '工作导入模板.xlsx',
    headers: ['date', 'period', 'title', 'category', 'content'],
    exampleRow: ['2026-07-29', 'morning', '英语教学', 'teaching', '三年级英语课'],
  },
  expenses: {
    label: '花费模板',
    fileName: '花费导入模板.xlsx',
    headers: ['date', 'category', 'amount', 'description'],
    exampleRow: ['2026-07-29', 'food', 42.5, '午餐'],
  },
  locations: {
    label: '地点模板',
    fileName: '地点导入模板.xlsx',
    headers: ['name', 'type', 'date', 'address', 'description'],
    exampleRow: ['昌都第一中学', 'school', '2026-07-20', '西藏昌都市卡若区', '支教学校'],
  },
  todos: {
    label: '待办模板',
    fileName: '待办导入模板.xlsx',
    headers: ['date', 'title', 'category', 'priority'],
    exampleRow: ['2026-07-29', '准备教案', 'teaching', 'high'],
  },
}

/** 下载单个模板 Excel */
export function downloadTemplate(key: string): void {
  const def = TEMPLATES[key]
  if (!def) return

  const wb = XLSX.utils.book_new()

  // 表头行
  const rows: (string | number)[][] = [def.headers]
  // 示例数据行
  rows.push(def.exampleRow)
  // 留两行空行
  rows.push(def.headers.map(() => ''))

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // 设置列宽
  ws['!cols'] = def.headers.map(() => ({ wch: 25 }))

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, def.fileName)
}
