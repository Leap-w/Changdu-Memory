<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useTagStore } from '@/stores/tag'
import { fetchDiaryTagIds } from '@/repositories/TagRepository'
import { fetchDiaryPhotos, getDiaryPhotoUrl } from '@/repositories/DiaryPhotoRepository'
import DiaryCard from '@/components/diary/DiaryCard.vue'

const router = useRouter()
const diaryStore = useDiaryStore()
const tagStore = useTagStore()

const ready = ref(false)

// Cached: diary_id → { thumbnail, tags }
const meta = ref<Record<string, { thumbnail?: string; tags: { id: string; name: string; color: string }[] }>>({})

onMounted(async () => {
  // Load diaries
  await diaryStore.loadDiaries()

  // Load tags if needed
  if (diaryStore.diaries.length && tagStore.tags.length === 0) {
    try { await tagStore.loadTags() } catch { /* ignore */ }
  }

  // Batch load photos + tags for each diary (parallel per diary)
  if (diaryStore.diaries.length) {
    const batch = diaryStore.diaries.slice(0, 30).map(async (d) => {
      const [photos, tagIds] = await Promise.allSettled([
        fetchDiaryPhotos(d.id),
        fetchDiaryTagIds(d.id),
      ])
      const result: { thumbnail?: string; tags: { id: string; name: string; color: string }[] } = { tags: [] }
      if (photos.status === 'fulfilled' && photos.value.length) {
        result.thumbnail = getDiaryPhotoUrl(photos.value[0])
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

const groupedByMonth = computed(() => diaryStore.groupedByMonth)

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}

function goDetail(id: string) { router.push(`/diary/${id}`) }
function goCreate() { router.push('/diary/new') }
</script>

<template>
  <div class="diary-page">
    <div class="diary-page__head">
      <h1 class="diary-page__title">日记</h1>
      <button class="diary-page__new-btn" @click="goCreate">+ 写日记</button>
    </div>

    <!-- Empty -->
    <div v-if="ready && diaryStore.diaries.length === 0" class="diary-page__empty">
      <div class="diary-page__empty-icon">📖</div>
      <p>还没有日记，写下你支教的第一天吧</p>
      <button class="diary-page__empty-btn" @click="goCreate">开始写日记</button>
    </div>

    <!-- List by month -->
    <div v-for="group in groupedByMonth" :key="group.month" class="diary-group">
      <h2 class="diary-group__month">{{ formatMonth(group.month) }}</h2>
      <div class="diary-group__list">
        <DiaryCard
          v-for="d in group.items" :key="d.id"
          :diary="d"
          :tags="meta[d.id]?.tags"
          :thumbnail="meta[d.id]?.thumbnail"
          @click="goDetail"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.diary-page { max-width:720px;margin:0 auto;padding:var(--spacing-page);padding-bottom:80px; }
.diary-page__head { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px; }
.diary-page__title { font-size:var(--font-title);font-weight:700;color:var(--color-text-primary);margin:0; }
.diary-page__new-btn { padding:10px 20px;border:none;border-radius:var(--radius-button);background:var(--color-primary);color:#fff;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600;transition:all .15s; }
.diary-page__new-btn:hover { background:var(--color-primary-dark); }

/* Empty */
.diary-page__empty { display:flex;flex-direction:column;align-items:center;gap:12px;padding:80px 20px;text-align:center; }
.diary-page__empty-icon { font-size:56px;opacity:.3; }
.diary-page__empty p { font-size:15px;color:var(--color-text-tertiary);margin:0; }
.diary-page__empty-btn { padding:10px 24px;border:none;border-radius:var(--radius-button);background:var(--color-primary);color:#fff;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600; }

/* Groups */
.diary-group { margin-bottom:28px; }
.diary-group__month { font-size:15px;font-weight:600;color:var(--color-text-secondary);margin:0 0 12px;padding-left:4px; }
.diary-group__list { display:flex;flex-direction:column;gap:10px; }
</style>
