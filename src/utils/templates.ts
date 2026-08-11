/**
 * 昌都记忆 Changdu Memory V5.1.6
 * Excel 导入模板元数据 + 下载
 *
 * 模板文件（带样式：表头蓝底、示例行标红、独立的「填写说明」工作表）由
 * `scripts/gen_templates.py` 预生成到 `public/templates/`，构建时随 public 复制到 dist。
 * 下载时直接触发浏览器下载静态文件。
 *
 * 注意：修改模板内容时，需同步修改 `scripts/gen_templates.py` 中对应定义，
 * 并运行 `py scripts/gen_templates.py` 重新生成。
 */

interface TemplateDef {
  label: string
  fileName: string
  /** 数据工作表头（中文，与模板文件一致） */
  headers: string[]
  /** 表头对应的对象字段 key（导入预览表取值用） */
  rowKeys: string[]
}

export const TEMPLATES: Record<string, TemplateDef> = {
  diaries: {
    label: '日记',
    fileName: '日记导入模板.xlsx',
    headers: ['日期', '标题', '内容'],
    rowKeys: ['diary_date', 'title', 'content'],
  },
  work_plans: {
    label: '工作',
    fileName: '工作导入模板.xlsx',
    headers: ['日期', '时间段', '标题', '分类', '内容'],
    rowKeys: ['work_date', 'period', 'title', 'category', 'content'],
  },
  expenses: {
    label: '花费',
    fileName: '花费导入模板.xlsx',
    headers: ['日期', '类型', '分类', '金额', '备注', '时间'],
    rowKeys: ['expense_date', 'type', 'category', 'amount', 'description', 'expense_time'],
  },
  students: {
    label: '学生档案',
    fileName: '学生导入模板.xlsx',
    headers: ['姓名', '班级', '职务', '备注'],
    rowKeys: ['name', 'class_name', 'role', 'notes'],
  },
  schedules: {
    label: '课程表',
    fileName: '课程表导入模板.xlsx',
    headers: ['课程', '班级', '星期', '开始时间', '结束时间', '地点', '备注'],
    rowKeys: ['course_name', 'class_name', 'day_of_week', 'start_time', 'end_time', 'location', 'notes'],
  },
  todos: {
    label: '待办',
    fileName: '待办导入模板.xlsx',
    headers: ['日期', '标题', '分类', '优先级'],
    rowKeys: ['todo_date', 'title', 'category', 'priority'],
  },
}

/** 下载模板：直接触发浏览器下载 public/templates/ 下的静态文件 */
export function downloadTemplate(key: string): void {
  const def = TEMPLATES[key]
  if (!def) return
  const a = document.createElement('a')
  a.href = `/templates/${encodeURIComponent(def.fileName)}`
  a.download = def.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
