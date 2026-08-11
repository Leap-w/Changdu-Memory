// =============================================
// 本地时区安全的日期/时间工具
// =============================================
// 注意：不能用 `new Date(ts).toISOString().split('T')[0]` 取日期——
// toISOString() 返回 UTC，中国时区(UTC+8)下本地 31 日 00:00 会变成 UTC 30 日，
// 导致选 31 日保存后变成 30 日。统一改用本地 getFullYear/getMonth/getDate。

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 本地日期 → 'yyyy-MM-dd'（默认今天） */
export function formatLocalDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 时间戳 → 本地 'yyyy-MM-dd'（NDatePicker 时间戳提交时用） */
export function tsToDateStr(ts: number): string {
  return formatLocalDate(new Date(ts))
}

/** 'yyyy-MM-dd' → 本地当天 00:00 时间戳（用本地解析，避免 UTC 偏移） */
export function dateStrToTs(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/** 'HH:mm' → 1970-01-01 当天时间戳（NTimePicker 使用） */
export function timeStrToTs(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return new Date(1970, 0, 1, h || 0, m || 0).getTime()
}

/** 时间戳 → 'HH:mm'（本地） */
export function tsToTimeStr(ts: number): string {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * 时间字符串 → 只保留 'HH:mm'（去掉可能的 ':ss' 秒）。
 * 兼容历史数据中出现 'HH:mm:ss' 的情况。
 */
export function formatTimeHM(t: string | null | undefined): string {
  if (!t) return ''
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t).trim())
  if (!m) return String(t).trim()
  return `${m[1].padStart(2, '0')}:${m[2]}`
}
