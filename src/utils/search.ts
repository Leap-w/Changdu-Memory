/**
 * 昌都记忆 Changdu Memory V5.0
 * 全局档案检索 — 纯内存搜索，不访问 Supabase
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

/** 统一搜索结果 */
export interface SearchResult {
  type: 'diary' | 'photo' | 'location' | 'work'
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
  // 2-gram for CJK
  if (/[一-鿿]/.test(cleaned)) {
    for (let i = 0; i < cleaned.length - 1; i++) {
      tokens.push(cleaned.substring(i, i + 2))
    }
  }
  // space-split for non-CJK
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

// ====== 各模块搜索 ======

export function searchDiaries(diaries: Row[], keyword: string, month: string): SearchResult[] {
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

export function searchPhotos(
  photos: Row[],
  keyword: string,
  month: string,
  locations: Row[],
  tags: Row[],
  photoTags: Row[],
): SearchResult[] {
  return photos
    .filter((p) => {
      const locName = locations.find((l) => l.id === p.location_id)?.name || ''
      const tagIds = photoTags.filter((pt) => pt.photo_id === p.id).map((pt: Row) => pt.tag_id)
      const tagNames = tagIds.map((tid: string) => tags.find((t) => t.id === tid)?.name || '').join(' ')
      const text = (p.title || '') + ' ' + (p.description || '') + ' ' + locName + ' ' + tagNames
      return matchesKeyword(text, keyword) && matchesDateRange(p.photo_date, month)
    })
    .map((p) => ({
      type: 'photo' as const,
      id: p.id,
      title: p.title || '未命名',
      description: (p.description || '').slice(0, 80),
      date: p.photo_date,
      extra: locations.find((l) => l.id === p.location_id)?.name || '',
    }))
}

export function searchLocations(locations: Row[], keyword: string): SearchResult[] {
  return locations
    .filter((l) => {
      const text = (l.name || '') + ' ' + (l.address || '') + ' ' + (l.description || '')
      return matchesKeyword(text, keyword)
    })
    .map((l) => ({
      type: 'location' as const,
      id: l.id,
      title: l.name,
      description: (l.description || l.address || '').slice(0, 80),
      date: l.visit_date || '',
      extra: l.address || '',
    }))
}

export function searchWorks(works: Row[], keyword: string, month: string): SearchResult[] {
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

/** 按标签搜索：返回所有关联该标签的内容 */
export function searchByTag(
  tagName: string,
  tags: Row[],
  diaries: Row[],
  photos: Row[],
  locations: Row[],
  _works: Row[],
  diaryTags: Row[],
  photoTags: Row[],
  locationTags: Row[],
): SearchResult[] {
  const tag = tags.find((t) => t.name === tagName)
  if (!tag) return []

  const results: SearchResult[] = []

  // 关联的日记
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

  // 关联的照片
  const photoIds = photoTags.filter((pt) => pt.tag_id === tag.id).map((pt: Row) => pt.photo_id)
  for (const p of photos.filter((p) => photoIds.includes(p.id))) {
    results.push({
      type: 'photo',
      id: p.id,
      title: p.title || '未命名',
      description: (p.description || '').slice(0, 80),
      date: p.photo_date,
      extra: locations.find((l) => l.id === p.location_id)?.name || '',
    })
  }

  // 关联的地点
  const locIds = locationTags.filter((lt) => lt.tag_id === tag.id).map((lt: Row) => lt.location_id)
  for (const l of locations.filter((l) => locIds.includes(l.id))) {
    results.push({
      type: 'location',
      id: l.id,
      title: l.name,
      description: (l.description || l.address || '').slice(0, 80),
      date: l.visit_date || '',
      extra: l.address || '',
    })
  }

  // 工作也参与标签搜索（works 本身无标签，跳过）

  return results.sort((a, b) => b.date.localeCompare(a.date))
}

/** 全局搜索：合并所有模块结果 */
export function globalSearch(params: {
  keyword: string
  type: string
  month: string
  diaries: Row[]
  photos: Row[]
  locations: Row[]
  works: Row[]
  tags: Row[]
  diaryTags: Row[]
  photoTags: Row[]
  locationTags: Row[]
}): SearchResult[] {
  const { keyword, type, month } = params

  // 如果是标签搜索（keyword 命中了某个 tag 名称），用 searchByTag
  const matchedTag = params.tags.find((t) => t.name === keyword)
  if (matchedTag && (type === 'all' || type === 'tag')) {
    return searchByTag(
      keyword,
      params.tags,
      params.diaries,
      params.photos,
      params.locations,
      params.works,
      params.diaryTags,
      params.photoTags,
      params.locationTags,
    )
  }

  let all: SearchResult[] = []

  if (type === 'all' || type === 'diary') {
    all = all.concat(searchDiaries(params.diaries, keyword, month))
  }
  if (type === 'all' || type === 'photo') {
    all = all.concat(
      searchPhotos(params.photos, keyword, month, params.locations, params.tags, params.photoTags),
    )
  }
  if (type === 'all' || type === 'location') {
    all = all.concat(searchLocations(params.locations, keyword))
  }
  if (type === 'all' || type === 'work') {
    all = all.concat(searchWorks(params.works, keyword, month))
  }

  // Sort by date desc
  return all.sort((a, b) => b.date.localeCompare(a.date))
}
