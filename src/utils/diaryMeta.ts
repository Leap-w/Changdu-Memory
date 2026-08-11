/**
 * 昌都记忆 — 日记天气 / 心情选项定义与展示辅助
 *
 * 天气与心情均为用户手动选择（非自动获取），存储稳定 key，
 * 展示时渲染为「emoji + 文案」。
 */

interface WeatherOption {
  key: string
  emoji: string
  label: string
}

interface MoodOption {
  key: string
  emoji: string
  label: string
}

export const WEATHER_OPTIONS: WeatherOption[] = [
  { key: 'sunny',    emoji: '☀️', label: '晴' },
  { key: 'cloudy',   emoji: '⛅', label: '多云' },
  { key: 'overcast', emoji: '☁️', label: '阴' },
  { key: 'rain',     emoji: '🌧', label: '雨' },
  { key: 'snow',     emoji: '❄️', label: '雪' },
  { key: 'fog',      emoji: '🌫', label: '雾 / 阴冷' },
]

export const MOOD_OPTIONS: MoodOption[] = [
  { key: 'happy',     emoji: '😊', label: '开心' },
  { key: 'calm',      emoji: '🙂', label: '平静' },
  { key: 'content',   emoji: '😌', label: '满足' },
  { key: 'down',      emoji: '😔', label: '低落' },
  { key: 'tired',     emoji: '😫', label: '疲惫' },
  { key: 'motivated', emoji: '🔥', label: '充满动力' },
]

/** 天气展示：key → '☀️ 晴'；未知值原样返回，兼容历史数据 */
export function weatherDisplay(key?: string | null): string {
  if (!key) return ''
  const found = WEATHER_OPTIONS.find((o) => o.key === key)
  return found ? `${found.emoji} ${found.label}` : key
}

/** 心情展示：key → '😊 开心'；未知值原样返回，兼容历史数据 */
export function moodDisplay(key?: string | null): string {
  if (!key) return ''
  const found = MOOD_OPTIONS.find((o) => o.key === key)
  return found ? `${found.emoji} ${found.label}` : key
}
