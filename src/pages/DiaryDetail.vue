<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useTagStore } from '@/stores/tag'
import { fetchDiaryTagIds } from '@/repositories/TagRepository'
import { fetchDiaryPhotos, getDiaryPhotoUrl, deleteAllDiaryPhotos } from '@/repositories/DiaryPhotoRepository'
import type { DiaryPhoto } from '@/repositories/DiaryPhotoRepository'
import { AppCard, AppIcon } from '@/components/ui'

const router = useRouter()
const route = useRoute()
const diaryStore = useDiaryStore()
const tagStore = useTagStore()

const diaryId = computed(() => route.params.id as string)
const diary = ref<{
  id: string
  title: string | null
  content: string | null
  diary_date: string
  weather: string | null
  mood: string | null
  created_at: string
} | null>(null)
const tagIds = ref<string[]>([])
const photos = ref<DiaryPhoto[]>([])
const loading = ref(true)

// Image viewer
const viewerIndex = ref(-1)
const viewerOpen = computed(() => viewerIndex.value >= 0)

// ==========================================
// Load
// ==========================================
onMounted(async () => {
  try {
    const data = await diaryStore.getDiaryById(diaryId.value)
    if (!data) { router.push('/diary'); return }
    diary.value = data

    const [tids, imgs] = await Promise.allSettled([
      fetchDiaryTagIds(diaryId.value),
      fetchDiaryPhotos(diaryId.value),
    ])
    if (tids.status === 'fulfilled') tagIds.value = tids.value
    if (imgs.status === 'fulfilled') photos.value = imgs.value

    if (tagIds.value.length && tagStore.tags.length === 0) {
      try { await tagStore.loadTags() } catch { /* ignore */ }
    }
  } catch { router.push('/diary') }
  finally { loading.value = false }
})

// ==========================================
// Previous / Next
// ==========================================
const prevDiary = computed(() => {
  if (!diary.value) return null
  const idx = diaryStore.diaries.findIndex((d) => d.id === diaryId.value)
  return idx < diaryStore.diaries.length - 1 ? diaryStore.diaries[idx + 1] : null
})

const nextDiary = computed(() => {
  if (!diary.value) return null
  const idx = diaryStore.diaries.findIndex((d) => d.id === diaryId.value)
  return idx > 0 ? diaryStore.diaries[idx - 1] : null
})

// ==========================================
// Actions
// ==========================================
function goEdit() { router.push(`/diary/${diaryId.value}/edit`) }

async function handleDelete() {
  if (!confirm('确定删除这篇日记？')) return
  try {
    await deleteAllDiaryPhotos(diaryId.value)
    await diaryStore.removeDiary(diaryId.value)
    router.push('/diary')
  } catch { /* ignore */ }
}

// ==========================================
// Formatters
// ==========================================
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}

function wordCount(content: string | null): number {
  if (!content) return 0
  return content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length
}

function formatShortDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}

function getImgUrl(p: DiaryPhoto) { return getDiaryPhotoUrl(p) }
function getTagName(id: string) { return tagStore.tags.find((t) => t.id === id)?.name || '' }
function getTagColor(id: string) { return tagStore.tags.find((t) => t.id === id)?.color || '#4B8F8C' }

function openViewer(i: number) { viewerIndex.value = i }
function closeViewer() { viewerIndex.value = -1 }

function goDiary(id: string) {
  router.push(`/diary/${id}`)
}
</script>

<template>
  <div class="detail">
    <!-- Loading -->
    <div v-if="loading" class="detail__loading">
      加载中…
    </div>

    <template v-if="diary">
      <!-- Back + Actions -->
      <div class="detail__bar">
        <button class="detail__back" @click="router.push('/diary')">
          <AppIcon name="chevron-right" size="16" class="detail__back-icon" />
          返回列表
        </button>
        <div class="detail__bar-actions">
          <button class="detail__action-btn" @click="goEdit">
            <AppIcon name="pen" size="14" /> 编辑
          </button>
          <button class="detail__action-btn detail__action-btn--danger" @click="handleDelete">
            <AppIcon name="trash" size="14" /> 删除
          </button>
        </div>
      </div>

      <!-- Article card -->
      <article class="detail__article">
        <!-- Meta row -->
        <div class="detail__meta">
          <span class="detail__meta-date">{{ formatDate(diary.diary_date) }}</span>
          <template v-if="diary.weather || diary.mood">
            <span class="detail__meta-sep">·</span>
            <span v-if="diary.weather" class="detail__meta-tag">
              <AppIcon name="camera" size="12" /> {{ diary.weather }}
            </span>
            <span v-if="diary.mood" class="detail__meta-tag">
              <AppIcon name="smile" size="12" /> {{ diary.mood }}
            </span>
          </template>
        </div>

        <h1 class="detail__title">
          {{ diary.title || '无标题' }}
        </h1>

        <div class="detail__byline">
          <span>{{ wordCount(diary.content) }} 字</span>
          <span class="detail__meta-sep">·</span>
          <span>阅读约 {{ Math.max(1, Math.ceil(wordCount(diary.content) / 400)) }} 分钟</span>
        </div>

        <!-- Tags -->
        <div v-if="tagIds.length" class="detail__tags">
          <span
            v-for="tid in tagIds"
            :key="tid"
            class="detail__tag"
            :style="{ background: getTagColor(tid) + '18', color: getTagColor(tid) }"
          >
            # {{ getTagName(tid) }}
          </span>
        </div>

        <!-- Photos -->
        <div v-if="photos.length" class="detail__photos">
          <div
            v-for="(p, i) in photos"
            :key="p.id"
            class="detail__photo-item"
            @click="openViewer(i)"
          >
            <img
              :src="getImgUrl(p)"
              class="detail__photo-img"
              :alt="`图片 ${i + 1}`"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Content body -->
        <div class="detail__content">
          <template v-if="diary.content">
            {{ diary.content }}
          </template>
          <p v-else class="detail__content-empty">
            暂无内容
          </p>
        </div>
      </article>

      <!-- Previous / Next -->
      <div v-if="prevDiary || nextDiary" class="detail__nav">
        <AppCard
          v-if="prevDiary"
          hoverable
          padding="md"
          class="detail__nav-card"
          @click="goDiary(prevDiary.id)"
        >
          <span class="detail__nav-label">← 上一篇</span>
          <span class="detail__nav-title">{{ prevDiary.title || '无标题' }}</span>
          <span class="detail__nav-date">{{ formatShortDate(prevDiary.diary_date) }}</span>
        </AppCard>

        <AppCard
          v-if="nextDiary"
          hoverable
          padding="md"
          class="detail__nav-card detail__nav-card--next"
          @click="goDiary(nextDiary.id)"
        >
          <span class="detail__nav-label">下一篇 →</span>
          <span class="detail__nav-title">{{ nextDiary.title || '无标题' }}</span>
          <span class="detail__nav-date">{{ formatShortDate(nextDiary.diary_date) }}</span>
        </AppCard>
      </div>
    </template>

    <!-- Fullscreen viewer -->
    <Teleport to="body">
      <Transition name="viewer">
        <div v-if="viewerOpen" class="img-viewer" @click="closeViewer">
          <img
            :src="getImgUrl(photos[viewerIndex])"
            class="img-viewer__img"
            alt=""
            @click.stop
          />
          <button class="img-viewer__close" aria-label="关闭" @click="closeViewer">
            <AppIcon name="close" size="24" color="#fff" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ==========================================
   Diary Detail — V5.5.2 Immersive Reading
   ========================================== */
.detail {
  max-width: 780px;
  margin: 0 auto;
}

.detail__loading {
  text-align: center;
  padding: 80px;
  color: var(--color-text-tertiary);
}

/* ---- Back bar ---- */
.detail__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.detail__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-secondary, 14px);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.detail__back:hover {
  color: var(--color-primary);
}

.detail__back-icon {
  transform: rotate(180deg);
}

.detail__bar-actions {
  display: flex;
  gap: 8px;
}

.detail__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  color: var(--color-text-secondary);
  font-size: var(--font-caption, 12px);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.detail__action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.detail__action-btn--danger:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(194, 103, 106, 0.05);
}

/* ---- Article card ---- */
.detail__article {
  background: var(--color-bg-white);
  border-radius: var(--radius-2xl, 32px);
  border: 1px solid var(--color-border-light);
  padding: 32px 28px;
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-card);
}

@media (min-width: 600px) {
  .detail__article {
    padding: 48px 56px;
  }
}

.detail__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.detail__meta-date {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary-light);
}

.detail__meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.detail__meta-sep {
  opacity: 0.4;
}

.detail__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0 0 10px;
  line-height: 1.25;
  letter-spacing: 0.5px;
}

.detail__byline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
  margin-bottom: 20px;
}

/* ---- Tags ---- */
.detail__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.detail__tag {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

/* ---- Photos ---- */
.detail__photos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 28px;
}

@media (min-width: 500px) {
  .detail__photos {
    grid-template-columns: repeat(3, 1fr);
  }
}

.detail__photo-item {
  aspect-ratio: 1;
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
  cursor: pointer;
  background: var(--color-bg-subtle);
}

.detail__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.detail__photo-item:hover .detail__photo-img {
  transform: scale(1.04);
}

/* ---- Content ---- */
.detail__content {
  font-size: var(--font-content, 16px);
  line-height: 2;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.detail__content-empty {
  color: var(--color-text-tertiary);
  font-style: italic;
  margin: 0;
}

/* ---- Prev / Next nav ---- */
.detail__nav {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md, 12px);
  margin-bottom: var(--spacing-2xl);
}

@media (min-width: 600px) {
  .detail__nav {
    grid-template-columns: 1fr 1fr;
  }
}

.detail__nav-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.detail__nav-card--next {
  text-align: right;
  align-items: flex-end;
}

@media (min-width: 600px) {
  .detail__nav-card--next {
    margin-left: auto;
  }
}

.detail__nav-label {
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail__nav-title {
  font-size: var(--font-secondary, 14px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.detail__nav-date {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
}

/* ---- Image viewer ---- */
.img-viewer {
  position: fixed;
  inset: 0;
  z-index: var(--z-image-viewer, 300);
  background: rgba(0, 0, 0, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: pointer;
  backdrop-filter: blur(12px);
}

.img-viewer__img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: var(--radius-lg, 20px);
  object-fit: contain;
  cursor: default;
}

.img-viewer__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.img-viewer__close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 0.2s;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

/* ---- Mobile ---- */
@media (max-width: 500px) {
  .detail__article {
    padding: 24px 18px;
    border-radius: var(--radius-xl, 24px);
  }

  .detail__title {
    font-size: 24px;
  }
}
</style>
