/**
 * 昌都记忆 Changdu Memory V5.0
 * Excel 导入解析 + 验证工具
 */
import * as XLSX from 'xlsx'

/** 单行验证错误 */
export interface ImportError {
  row: number
  message: string
}

/** 导入预览结果 */
export interface ImportPreview<T> {
  /** 有效行 */
  validRows: T[]
  /** 错误列表 */
  errors: ImportError[]
  /** 总行数（不含表头） */
  totalRows: number
}

// ====== 各模块字段类型 ======

interface DiaryImportRow {
  diary_date: string
  title: string
  content: string
}

interface WorkImportRow {
  work_date: string
  period: string
  title: string
  category: string
  content: string
}

interface ExpenseImportRow {
  expense_date: string
  category: string
  amount: number
  description: string
}

interface TodoImportRow {
  todo_date: string
  title: string
  category: string
  priority: string
}

interface StudentImportRow {
  name: string
  class_name: string
  role: string
  notes: string
}

interface ScheduleImportRow {
  course_name: string
  class_name: string
  day_of_week: number
  start_time: string
  end_time: string
  location: string
  notes: string
}

type ImportRow =
  | DiaryImportRow
  | WorkImportRow
  | ExpenseImportRow
  | TodoImportRow

// ====== 通用工具 ======

/** 解析 Excel 文件，返回二维数组（第一行为表头） */
function parseExcel(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
        resolve(rows as string[][])
      } catch {
        reject(new Error('无法解析 Excel 文件'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/** 验证日期格式 YYYY-MM-DD */
function isValidDate(val: unknown): boolean {
  if (!val) return false
  const s = String(val).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
}

/** 获取单元格字符串值 */
function cellStr(row: string[], col: number): string {
  return (row[col] ?? '').toString().trim()
}

// ====== 各模块验证器 ======

const VALID_PERIODS = ['morning', 'afternoon', 'evening']
const VALID_WORK_CATEGORIES = ['teaching', 'meeting', 'training', 'other']
// 与数据库 expenses.category CHECK 约束保持一致（含购物→零食、住宿、娱乐）
const VALID_EXPENSE_CATEGORIES = ['food', 'transport', 'shopping', 'accommodation', 'study', 'entertainment', 'medical', 'other']
const VALID_TODO_CATEGORIES = ['teaching', 'life', 'growth']
const VALID_PRIORITIES = ['high', 'medium', 'low']

function parseAndValidateDiaries(rows: string[][]): ImportPreview<DiaryImportRow> {
  const validRows: DiaryImportRow[] = []
  const errors: ImportError[] = []
  const dataRows = rows.slice(1) // 跳过表头

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2 // Excel 行号（1-based，表头占1）
    const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue // 跳过空行

    const date = cellStr(r, 0)
    const title = cellStr(r, 1)

    if (!date) {
      errors.push({ row: rowNum, message: '日期不能为空' })
      continue
    }
    if (!isValidDate(date)) {
      errors.push({ row: rowNum, message: `日期格式错误: "${date}"，应为 YYYY-MM-DD` })
      continue
    }
    if (!title) {
      errors.push({ row: rowNum, message: '标题不能为空' })
      continue
    }

    validRows.push({
      diary_date: date,
      title,
      content: cellStr(r, 2),
    })
  }

  return { validRows, errors, totalRows: dataRows.filter((r) => r && r.some((c) => c)).length }
}

function parseAndValidateWorks(rows: string[][]): ImportPreview<WorkImportRow> {
  const validRows: WorkImportRow[] = []
  const errors: ImportError[] = []
  const dataRows = rows.slice(1)

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2
    const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue

    const date = cellStr(r, 0)
    const period = cellStr(r, 1).toLowerCase()
    const title = cellStr(r, 2)

    if (!date) {
      errors.push({ row: rowNum, message: '日期不能为空' })
      continue
    }
    if (!isValidDate(date)) {
      errors.push({ row: rowNum, message: `日期格式错误: "${date}"` })
      continue
    }
    if (!VALID_PERIODS.includes(period)) {
      errors.push({ row: rowNum, message: `时间段无效: "${period}"，应为 morning/afternoon/evening` })
      continue
    }
    if (!title) {
      errors.push({ row: rowNum, message: '标题不能为空' })
      continue
    }

    const category = cellStr(r, 3).toLowerCase() || 'teaching'
    if (!VALID_WORK_CATEGORIES.includes(category)) {
      errors.push({ row: rowNum, message: `工作分类无效: "${cellStr(r, 3)}"，应为 teaching/meeting/training/other` })
      continue
    }

    validRows.push({
      work_date: date,
      period,
      title,
      category,
      content: cellStr(r, 4),
    })
  }

  return { validRows, errors, totalRows: dataRows.filter((r) => r && r.some((c) => c)).length }
}

function parseAndValidateExpenses(rows: string[][]): ImportPreview<ExpenseImportRow> {
  const validRows: ExpenseImportRow[] = []
  const errors: ImportError[] = []
  const dataRows = rows.slice(1)

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2
    const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue

    const date = cellStr(r, 0)
    const category = cellStr(r, 1).toLowerCase()
    const amountStr = cellStr(r, 2)

    if (!date) {
      errors.push({ row: rowNum, message: '日期不能为空' })
      continue
    }
    if (!isValidDate(date)) {
      errors.push({ row: rowNum, message: `日期格式错误: "${date}"` })
      continue
    }
    if (!VALID_EXPENSE_CATEGORIES.includes(category)) {
      errors.push({
        row: rowNum,
        message: `分类无效: "${cellStr(r, 1)}"，应为 food/transport/shopping/accommodation/study/entertainment/medical/other`,
      })
      continue
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNum, message: `金额无效: "${amountStr}"，必须为正数` })
      continue
    }

    validRows.push({
      expense_date: date,
      category,
      amount: Math.round(amount * 100) / 100,
      description: cellStr(r, 3),
    })
  }

  return { validRows, errors, totalRows: dataRows.filter((r) => r && r.some((c) => c)).length }
}

function parseAndValidateTodos(rows: string[][]): ImportPreview<TodoImportRow> {
  const validRows: TodoImportRow[] = []
  const errors: ImportError[] = []
  const dataRows = rows.slice(1)

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2
    const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue

    const date = cellStr(r, 0)
    const title = cellStr(r, 1)

    if (!date) {
      errors.push({ row: rowNum, message: '日期不能为空' })
      continue
    }
    if (!isValidDate(date)) {
      errors.push({ row: rowNum, message: `日期格式错误: "${date}"` })
      continue
    }
    if (!title) {
      errors.push({ row: rowNum, message: '标题不能为空' })
      continue
    }

    const category = cellStr(r, 2).toLowerCase() || 'teaching'
    if (!VALID_TODO_CATEGORIES.includes(category)) {
      errors.push({ row: rowNum, message: `分类无效: "${cellStr(r, 2)}"` })
      continue
    }

    const priority = cellStr(r, 3).toLowerCase() || 'medium'
    if (!VALID_PRIORITIES.includes(priority)) {
      errors.push({ row: rowNum, message: `优先级无效: "${cellStr(r, 3)}"` })
      continue
    }

    validRows.push({
      todo_date: date,
      title,
      category,
      priority,
    })
  }

  return { validRows, errors, totalRows: dataRows.filter((r) => r && r.some((c) => c)).length }
}

/** 解析学生 Excel */
function parseAndValidateStudents(rows: string[][]): ImportPreview<StudentImportRow> {
  const validRows: StudentImportRow[] = []
  const errors: ImportError[] = []
  const dataRows = rows.slice(1)
  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2; const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue
    const name = cellStr(r, 0)
    if (!name) { errors.push({ row: rowNum, message: '姓名不能为空' }); continue }
    validRows.push({ name, class_name: cellStr(r, 1), role: cellStr(r, 2), notes: cellStr(r, 3) })
  }
  return { validRows, errors, totalRows: dataRows.filter((r) => r && r.some((c) => c)).length }
}

/** 解析课程表 Excel */
function parseAndValidateSchedules(rows: string[][]): ImportPreview<ScheduleImportRow> {
  const validRows: ScheduleImportRow[] = []
  const errors: ImportError[] = []
  const dataRows = rows.slice(1)
  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2; const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue
    const name = cellStr(r, 0)
    if (!name) { errors.push({ row: rowNum, message: '课程名称不能为空' }); continue }
    const dow = parseInt(cellStr(r, 2)) || 1
    if (dow < 1 || dow > 7) { errors.push({ row: rowNum, message: '星期无效，应为1-7' }); continue }
    validRows.push({
      course_name: name, class_name: cellStr(r, 1), day_of_week: dow,
      start_time: cellStr(r, 3) || '08:00', end_time: cellStr(r, 4) || '09:00',
      location: cellStr(r, 5), notes: cellStr(r, 6),
    })
  }
  return { validRows, errors, totalRows: dataRows.filter((r) => r && r.some((c) => c)).length }
}

/** 解析 Excel 并验证（根据模块类型分派） */
export function parseAndValidate(
  file: File,
  moduleType: string,
): Promise<ImportPreview<ImportRow>> {
  return parseExcel(file).then((rows) => {
    switch (moduleType) {
      case 'diaries': return parseAndValidateDiaries(rows) as ImportPreview<ImportRow>
      case 'work_plans': return parseAndValidateWorks(rows) as ImportPreview<ImportRow>
      case 'expenses': return parseAndValidateExpenses(rows) as ImportPreview<ImportRow>
      case 'todos': return parseAndValidateTodos(rows) as ImportPreview<ImportRow>
      case 'students': return parseAndValidateStudents(rows) as unknown as ImportPreview<ImportRow>
      case 'schedules': return parseAndValidateSchedules(rows) as unknown as ImportPreview<ImportRow>
      default: throw new Error(`未知的模块类型: ${moduleType}`)
    }
  })
}
