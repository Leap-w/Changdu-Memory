<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useTagStore } from '@/stores/tag'
import { fetchDiaryTagIds } from '@/repositories/TagRepository'
import { fetchDiaryPhotos, getDiaryPhotoUrl } from '@/repositories/DiaryPhotoRepository'
import DiaryCard from '@/components/diary/DiaryCard.vue'
import { AppSection, AppIcon } from '@/components/ui'

const router = useRouter()
const diaryStore = useDiaryStore()
const tagStore = useTagStore()

const ready = ref(false)
const activeMonth = ref<string | null>(null) // null = all

// meta cache: diary_id → { thumbnail, photoUrls, tags }
const meta = ref<Record<string, { thumbnail?: string; photoUrls?: string[]; tags: { id: string; name: string; color: string }[] }>>({})

onMounted(async () => {
  await diaryStore.loadDiaries()

  if (diaryStore.diaries.length && tagStore.tags.length === 0) {
    try { await tagStore.loadTags() } catch { /* ignore */ }
  }

  if (diaryStore.diaries.length) {
    const batch = diaryStore.diaries.slice(0, 200).map(async (d) => {
      const [photos, tagIds] = await Promise.allSettled([
        fetchDiaryPhotos(d.id),
        fetchDiaryTagIds(d.id),
      ])
      const result: { thumbnail?: string; photoUrls?: string[]; tags: { id: string; name: string; color: string }[] } = { tags: [] }

      if (photos.status === 'fulfilled' && photos.value.length) {
        const urls = photos.value.map((p) => getDiaryPhotoUrl(p))
        result.thumbnail = urls[0]
        result.photoUrls = urls
      }

      if (tagIds.status === 'fulfilled') {
        result.tags = tagIds.value
          .map((tid) => tagStore.tags.find((t) => t.id === tid))
          .filter(Boolean)
          .map((t) => ({ id: t!.id, name: t!.name, color: t!.color }))
      }

      meta.value[d.id] = result
    })
    await Promise.allSettled(batch)
  }

  ready.value = true
})

// ==========================================
// Months with data
// ==========================================
const availableMonths = computed(() => {
  const set = new Set<string>()
  for (const d of diaryStore.diaries) {
    set.add(d.diary_date.substring(0, 7))
  }
  return Array.from(set).sort().reverse()
})

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}

// ==========================================
// Filtered diaries
// ==========================================
const filteredDiaries = computed(() => {
  if (!activeMonth.value) return diaryStore.diaries
  return diaryStore.diaries.filter((d) => d.diary_date.startsWith(activeMonth.value!))
})

const groupedByMonth = computed(() => {
  const groups: { month: string; items: typeof filteredDiaries.value }[] = []
  for (const d of filteredDiaries.value) {
    const month = d.diary_date.substring(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === month) {
      last.items.push(d)
    } else {
      groups.push({ month, items: [d] })
    }
  }
  return groups
})

// ==========================================
// Counts
// ==========================================
const totalCount = computed(() => diaryStore.diaries.length)

function goDetail(id: string) { router.push(`/diary/${id}`) }
function goCreate() { router.push('/diary/new') }
</script>

<template>
  <div class="diary-list">
    <!-- ====== Page header ====== -->
    <div class="diary-list__header">
      <div class="diary-list__header-left">
        <h1 class="diary-list__title">
          日记
        </h1>
        <span v-if="ready" class="diary-list__count">已记录 {{ totalCount }} 天</span>
      </div>
      <button class="diary-list__write-btn" @click="goCreate">
        <AppIcon name="pen" size="16" />
        <span class="diary-list__write-label">撰写新日记</span>
      </button>
    </div>

    <!-- ====== Month filter + mobile write FAB trigger ====== -->
    <div v-if="ready && availableMonths.length > 1" class="diary-list__filter-bar">
      <div class="diary-list__filter-pills">
        <button
          class="diary-list__filter-pill"
          :class="{ 'diary-list__filter-pill--active': activeMonth === null }"
          @click="activeMonth = null"
        >
          全部
        </button>
        <button
          v-for="m in availableMonths"
          :key="m"
          class="diary-list__filter-pill"
          :class="{ 'diary-list__filter-pill--active': activeMonth === m }"
          @click="activeMonth = m"
        >
          {{ formatMonthLabel(m) }}
        </button>
      </div>
    </div>

    <!-- ====== Empty state ====== -->
    <div v-if="ready && totalCount === 0" class="diary-list__empty">
      <div class="diary-list__empty-icon">
        <AppIcon name="book" size="48" color="var(--color-text-tertiary)" />
      </div>
      <p class="diary-list__empty-title">
        还没有日记
      </p>
      <p class="diary-list__empty-desc">
        写下你支教的第一天，记录高原上的每一个瞬间
      </p>
      <button class="diary-list__empty-btn" @click="goCreate">
        <AppIcon name="pen" size="16" /> 开始写日记
      </button>
    </div>

    <!-- ====== Card list by month ====== -->
    <div v-for="group in groupedByMonth" :key="group.month" class="diary-list__group">
      <AppSection
        :title="formatMonthLabel(group.month)"
        :action-label="`${group.items.length} 篇`"
        title-size="section"
        class="diary-list__group-head"
      >
        <div class="diary-list__cards">
          <DiaryCard
            v-for="d in group.items"
            :key="d.id"
            :diary="d"
            :tags="meta[d.id]?.tags"
            :thumbnail="meta[d.id]?.thumbnail"
            :photos="meta[d.id]?.photoUrls"
            @click="goDetail"
          />
        </div>
      </AppSection>
    </div>

    <div class="diary-list__footer-space" />
  </div>
</template>

<style scoped>
.diary-list {
  max-width: 840px;
  margin: 0 auto;
}

/* ---- Header ---- */
.diary-list__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.diary-list__header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.diary-list__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.diary-list__count {
  font-size: var(--font-caption, 12px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-secondary);
  background: rgba(107, 158, 133, 0.1);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.diary-list__write-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary, 14px);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.diary-list__write-btn:hover {
  background: var(--color-primary-dark);
}

.diary-list__write-label {
  display: none;
}

@media (min-width: 600px) {
  .diary-list__write-label {
    display: inline;
  }
}

/* ---- Filter bar ---- */
.diary-list__filter-bar {
  margin-bottom: var(--spacing-lg);
}

.diary-list__filter-pills {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.diary-list__filter-pills::-webkit-scrollbar {
  display: none;
}

.diary-list__filter-pill {
  padding: 6px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-caption, 12px);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.diary-list__filter-pill:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.diary-list__filter-pill--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

/* ---- Groups ---- */
.diary-list__group {
  margin-bottom: var(--spacing-sm);
}

.diary-list__group-head:deep(.app-section__title) {
  font-size: var(--font-content);
}

.diary-list__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* ---- Empty ---- */
.diary-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 20px;
  text-align: center;
}

.diary-list__empty-icon {
  opacity: 0.3;
  margin-bottom: 4px;
}

.diary-list__empty-title {
  font-size: var(--font-content, 16px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0;
}

.diary-list__empty-desc {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
  margin: 0;
}

.diary-list__empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary, 14px);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.diary-list__empty-btn:hover {
  background: var(--color-primary-dark);
}

/* ---- Footer ---- */
.diary-list__footer-space {
  height: var(--spacing-2xl, 40px);
}
</style>
