/**
 * 昌都记忆 Changdu Memory V5.2
 * 全局检索 — 纯内存搜索
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export interface SearchResult {
  type: 'diary' | 'work'
  id: string
  title: string
  description: string
  date: string
  extra?: string
}

/** 简单中文分词：按字符 2-gram + 全词 */
function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().trim()
  const tokens: string[] = [cleaned]
  if (/[一-鿿]/.test(cleaned)) {
    for (let i = 0; i < cleaned.length - 1; i++) {
      tokens.push(cleaned.substring(i, i + 2))
    }
  }
  tokens.push(...cleaned.split(/\s+/).filter(Boolean))
  return [...new Set(tokens)]
}

function matchesKeyword(text: string, keyword: string): boolean {
  if (!keyword) return true
  const k = keyword.toLowerCase().trim()
  const tokens = tokenize(text)
  return tokens.some((t) => t.includes(k))
}

function matchesDateRange(dateStr: string, month: string): boolean {
  if (month === 'all') return true
  return dateStr.startsWith(month)
}

function searchDiaries(diaries: Row[], keyword: string, month: string): SearchResult[] {
  return diaries
    .filter((d) => {
      const k = (d.title || '') + ' ' + (d.content || '')
      return matchesKeyword(k, keyword) && matchesDateRange(d.diary_date, month)
    })
    .map((d) => ({
      type: 'diary' as const,
      id: d.id,
      title: d.title || '无标题',
      description: (d.content || '').slice(0, 80),
      date: d.diary_date,
    }))
}

function searchWorks(works: Row[], keyword: string, month: string): SearchResult[] {
  return works
    .filter((w) => {
      const text = (w.title || '') + ' ' + (w.content || '') + ' ' + (w.category || '')
      return matchesKeyword(text, keyword) && matchesDateRange(w.work_date, month)
    })
    .map((w) => ({
      type: 'work' as const,
      id: w.id,
      title: w.title,
      description: (w.content || '').slice(0, 80),
      date: w.work_date,
      extra: w.period || '',
    }))
}

function searchByTag(
  tagName: string,
  tags: Row[],
  diaries: Row[],
  diaryTags: Row[],
): SearchResult[] {
  const tag = tags.find((t) => t.name === tagName)
  if (!tag) return []

  const results: SearchResult[] = []

  const diaryIds = diaryTags.filter((dt) => dt.tag_id === tag.id).map((dt: Row) => dt.diary_id)
  for (const d of diaries.filter((d) => diaryIds.includes(d.id))) {
    results.push({
      type: 'diary',
      id: d.id,
      title: d.title || '无标题',
      description: (d.content || '').slice(0, 80),
      date: d.diary_date,
    })
  }

  return results.sort((a, b) => b.date.localeCompare(a.date))
}

export function globalSearch(params: {
  keyword: string
  type: string
  month: string
  diaries: Row[]
  works: Row[]
  tags: Row[]
  diaryTags: Row[]
}): SearchResult[] {
  const { keyword, type, month } = params

  const matchedTag = params.tags.find((t) => t.name === keyword)
  if (matchedTag && (type === 'all' || type === 'tag')) {
    return searchByTag(keyword, params.tags, params.diaries, params.diaryTags)
  }

  let all: SearchResult[] = []

  if (type === 'all' || type === 'diary') {
    all = all.concat(searchDiaries(params.diaries, keyword, month))
  }
  if (type === 'all' || type === 'work') {
    all = all.concat(searchWorks(params.works, keyword, month))
  }

  return all.sort((a, b) => b.date.localeCompare(a.date))
}
