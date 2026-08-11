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
  /** 支出 / 收入（默认支出） */
  type: string
  category: string
  amount: number
  description: string
  /** 具体时间 'HH:mm'，可空 */
  expense_time: string | null
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

/**
 * 归一化账本类型：'支出'/'expense' → expense，'收入'/'income' → income。
 * 空值默认支出；无法识别返回空串（由调用方报错）。
 */
function normalizeType(val: string): string {
  const v = val.trim().toLowerCase()
  if (!v) return 'expense'
  if (v === '支出' || v === 'expense') return 'expense'
  if (v === '收入' || v === 'income') return 'income'
  return ''
}

/** 支出分类：中文标签 或 英文 key → 标准英文 key（与数据库 category CHECK 一致） */
const EXPENSE_CATEGORY_ALIASES: Record<string, string> = {
  food: 'food', 餐饮: 'food',
  transport: 'transport', 交通: 'transport',
  shopping: 'shopping', 零食: 'shopping',
  accommodation: 'accommodation', 住宿: 'accommodation',
  work: 'work', 工作: 'work',
  entertainment: 'entertainment', 娱乐: 'entertainment',
  medical: 'medical', 医疗: 'medical',
  other: 'other', 其他: 'other',
}

/** 收入分类：中文标签 或 英文 key → 标准英文 key */
const INCOME_CATEGORY_ALIASES: Record<string, string> = {
  salary: 'salary', 工资: 'salary',
  subsidy: 'subsidy', 补贴: 'subsidy',
  bonus: 'bonus', 奖金: 'bonus',
  part_time: 'part_time', 兼职: 'part_time',
  red_packet: 'red_packet', 红包: 'red_packet',
  second_hand: 'second_hand', 出二手: 'second_hand',
  other: 'other', 其他: 'other',
}

/** 通用归一化：中文标签或英文 key → 标准英文 key（大小写不敏感） */
function normalizeVal(raw: string, map: Record<string, string>): string {
  const t = raw.trim()
  return map[t] ?? map[t.toLowerCase()] ?? t.toLowerCase()
}

/** 归一化分类：中文标签或英文 key → 标准英文 key（大小写不敏感） */
function normalizeCategory(raw: string, type: string): string {
  const map = type === 'income' ? INCOME_CATEGORY_ALIASES : EXPENSE_CATEGORY_ALIASES
  return normalizeVal(raw, map)
}

/** 工作时间段：上午/下午/晚上 或 morning/afternoon/evening → 标准英文 */
const PERIOD_ALIASES: Record<string, string> = {
  morning: 'morning', 上午: 'morning',
  afternoon: 'afternoon', 下午: 'afternoon',
  evening: 'evening', 晚上: 'evening',
}

/** 工作分类：会议/监考/培训/活动/其他 或 英文 key → 标准英文（与 DB 约束一致） */
const WORK_CATEGORY_ALIASES: Record<string, string> = {
  meeting: 'meeting', 会议: 'meeting',
  exam_supervision: 'exam_supervision', 监考: 'exam_supervision',
  training: 'training', 培训: 'training',
  activity: 'activity', 活动: 'activity',
  other: 'other', 其他: 'other',
}

/** 待办分类：教学/生活/成长 或 teaching/life/growth → 标准英文 */
const TODO_CATEGORY_ALIASES: Record<string, string> = {
  teaching: 'teaching', 教学: 'teaching',
  life: 'life', 生活: 'life',
  growth: 'growth', 成长: 'growth',
}

/** 优先级：高/中/低 或 high/medium/low → 标准英文 */
const PRIORITY_ALIASES: Record<string, string> = {
  high: 'high', 高: 'high',
  medium: 'medium', 中: 'medium',
  low: 'low', 低: 'low',
}

// ====== 各模块验证器 ======

const VALID_PERIODS = ['morning', 'afternoon', 'evening']
// 与数据库 work_plans.category CHECK 约束保持一致（v5.1 起 teaching 迁移到 other，新增 exam_supervision/activity）
const VALID_WORK_CATEGORIES = ['meeting', 'exam_supervision', 'training', 'activity', 'other']
// 与数据库 expenses.category CHECK 约束保持一致（支出分类：学习→工作；收入分类独立校验）
const VALID_EXPENSE_CATEGORIES = ['food', 'transport', 'shopping', 'accommodation', 'work', 'entertainment', 'medical', 'other']
const VALID_INCOME_CATEGORIES = ['salary', 'subsidy', 'bonus', 'part_time', 'red_packet', 'second_hand', 'other']
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
    const period = normalizeVal(cellStr(r, 1), PERIOD_ALIASES)
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
      errors.push({ row: rowNum, message: `时间段无效: "${cellStr(r, 1)}"，应为 上午/下午/晚上（或 morning/afternoon/evening）` })
      continue
    }
    if (!title) {
      errors.push({ row: rowNum, message: '标题不能为空' })
      continue
    }

    const category = normalizeVal(cellStr(r, 3), WORK_CATEGORY_ALIASES) || 'other'
    if (!VALID_WORK_CATEGORIES.includes(category)) {
      errors.push({ row: rowNum, message: `工作分类无效: "${cellStr(r, 3)}"，应为 会议/监考/培训/活动/其他（或对应英文）` })
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

  // 列位：0=日期 1=类型(支出/收入) 2=分类 3=金额 4=备注 5=时间(HH:mm)
  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2
    const r = dataRows[i]
    if (!r || r.every((c) => !c)) continue

    const date = cellStr(r, 0)
    const typeRaw = cellStr(r, 1)
    const type = normalizeType(typeRaw)
    const category = normalizeCategory(cellStr(r, 2), type)
    const amountStr = cellStr(r, 3)
    const timeRaw = cellStr(r, 5)

    if (!date) {
      errors.push({ row: rowNum, message: '日期不能为空' })
      continue
    }
    if (!isValidDate(date)) {
      errors.push({ row: rowNum, message: `日期格式错误: "${date}"` })
      continue
    }
    if (typeRaw && !type) {
      errors.push({ row: rowNum, message: `类型无效: "${typeRaw}"，应为 支出/收入 或 expense/income` })
      continue
    }
    const allowedCats = type === 'income' ? VALID_INCOME_CATEGORIES : VALID_EXPENSE_CATEGORIES
    if (!allowedCats.includes(category)) {
      const catNames = type === 'income'
        ? ['工资', '补贴', '奖金', '兼职', '红包', '出二手', '其他']
        : ['餐饮', '交通', '零食', '住宿', '工作', '娱乐', '医疗', '其他']
      errors.push({
        row: rowNum,
        message: `分类无效: "${cellStr(r, 2)}"，${type === 'income' ? '收入' : '支出'}分类应为 ${catNames.join('/')}（或对应英文）`,
      })
      continue
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNum, message: `金额无效: "${amountStr}"，必须为正数` })
      continue
    }
    if (timeRaw && !/^\d{1,2}:\d{2}$/.test(timeRaw)) {
      errors.push({ row: rowNum, message: `时间格式错误: "${timeRaw}"，应为 HH:mm（如 14:30）` })
      continue
    }

    validRows.push({
      expense_date: date,
      type,
      category,
      amount: Math.round(amount * 100) / 100,
      description: cellStr(r, 4),
      expense_time: timeRaw || null,
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

    const category = normalizeVal(cellStr(r, 2), TODO_CATEGORY_ALIASES) || 'teaching'
    if (!VALID_TODO_CATEGORIES.includes(category)) {
      errors.push({ row: rowNum, message: `分类无效: "${cellStr(r, 2)}"，应为 教学/生活/成长（或 teaching/life/growth）` })
      continue
    }

    const priority = normalizeVal(cellStr(r, 3), PRIORITY_ALIASES) || 'medium'
    if (!VALID_PRIORITIES.includes(priority)) {
      errors.push({ row: rowNum, message: `优先级无效: "${cellStr(r, 3)}"，应为 高/中/低（或 high/medium/low）` })
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
