<script setup lang="ts">
import { computed } from 'vue'
import type { Diary } from '@/repositories/DiaryRepository'
import { AppCard, AppIcon } from '@/components/ui'

const props = defineProps<{
  diary: Diary
  tags?: { id: string; name: string; color: string }[]
  thumbnail?: string
  photos?: string[]
}>()

const emit = defineEmits<{ click: [id: string] }>()

function excerpt(content: string | null, maxLen = 140): string {
  if (!content) return ''
  const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}

const hasSinglePhoto = computed(() => !!props.thumbnail && (!props.photos || props.photos.length <= 1))
const hasMultiPhotos = computed(() => props.photos && props.photos.length >= 2)
const displayPhotos = computed(() => (props.photos || []).slice(0, 3))
const extraPhotoCount = computed(() => props.photos ? Math.max(0, props.photos.length - 3) : 0)
</script>

<template>
  <!-- A: Single photo card (large visual) -->
  <AppCard
    v-if="hasSinglePhoto"
    hoverable
    no-padding
    class="dc dc--photo"
    @click="emit('click', diary.id)"
  >
    <div class="dc-photo__layout">
      <div class="dc-photo__image-wrap">
        <img
          :src="thumbnail"
          class="dc-photo__image"
          alt=""
          loading="lazy"
        />
        <div v-if="tags && tags.length" class="dc-photo__badge">
          {{ tags[0].name }}
        </div>
      </div>
      <div class="dc-photo__body">
        <div class="dc-photo__meta">
          <span class="dc-photo__date">{{ formatDate(diary.diary_date) }}</span>
          <span class="dc-photo__weekday">{{ formatWeekday(diary.diary_date) }}</span>
        </div>
        <h3 class="dc-photo__title">
          {{ diary.title || '无标题' }}
        </h3>
        <p v-if="diary.content" class="dc-photo__excerpt">
          {{ excerpt(diary.content, 100) }}
        </p>
        <div class="dc-photo__footer">
          <div v-if="tags && tags.length > 1" class="dc__tags">
            <span
              v-for="t in tags.slice(1, 4)"
              :key="t.id"
              class="dc__tag"
              :style="{ color: t.color, background: t.color + '14' }"
            >
              {{ t.name }}
            </span>
          </div>
          <span class="dc-photo__read-more">
            阅读全文
            <AppIcon name="chevron-right" size="12" />
          </span>
        </div>
      </div>
    </div>
  </AppCard>

  <!-- B: Multi-photo card -->
  <AppCard
    v-else-if="hasMultiPhotos"
    hoverable
    class="dc dc--multi"
    @click="emit('click', diary.id)"
  >
    <div class="dc__header-row">
      <div class="dc__meta">
        <span class="dc-multi__date">{{ formatDate(diary.diary_date) }}</span>
        <span class="dc-multi__weekday">{{ formatWeekday(diary.diary_date) }}</span>
        <span v-if="diary.weather" class="dc-multi__weather">{{ diary.weather }}</span>
        <span v-if="diary.mood" class="dc-multi__mood">{{ diary.mood }}</span>
      </div>
    </div>
    <h3 class="dc-multi__title">
      {{ diary.title || '无标题' }}
    </h3>
    <p v-if="diary.content" class="dc-multi__excerpt">
      {{ excerpt(diary.content, 160) }}
    </p>
    <div class="dc-multi__photos">
      <div
        v-for="(url, i) in displayPhotos"
        :key="i"
        class="dc-multi__photo-item"
      >
        <img
          :src="url"
          class="dc-multi__photo-img"
          alt=""
          loading="lazy"
        />
        <div v-if="i === 2 && extraPhotoCount > 0" class="dc-multi__photo-overlay">
          +{{ extraPhotoCount }}
        </div>
      </div>
    </div>
    <div class="dc__footer-row">
      <div v-if="tags && tags.length" class="dc__tags">
        <span
          v-for="t in tags.slice(0, 3)"
          :key="t.id"
          class="dc__tag"
          :style="{ color: t.color, background: t.color + '14' }"
        >
          {{ t.name }}
        </span>
        <span v-if="tags.length > 3" class="dc__tag-more">+{{ tags.length - 3 }}</span>
      </div>
    </div>
  </AppCard>

  <!-- C: Text-only card -->
  <AppCard
    v-else
    hoverable
    class="dc dc--text"
    @click="emit('click', diary.id)"
  >
    <div class="dc-text__layout">
      <div class="dc-text__date-col">
        <span class="dc-text__date-num">{{ String(new Date(diary.diary_date + 'T00:00:00').getDate()).padStart(2, '0') }}</span>
        <span class="dc-text__date-mon">{{ new Date(diary.diary_date + 'T00:00:00').getMonth() + 1 }}月</span>
      </div>
      <div class="dc-text__body">
        <div class="dc-text__meta">
          <span>{{ formatWeekday(diary.diary_date) }}</span>
          <template v-if="diary.weather || diary.mood">
            <span class="dc-text__meta-sep">·</span>
            <span>{{ [diary.weather, diary.mood].filter(Boolean).join(' · ') }}</span>
          </template>
        </div>
        <h3 class="dc-text__title">
          {{ diary.title || '无标题' }}
        </h3>
        <p v-if="diary.content" class="dc-text__excerpt">
          {{ excerpt(diary.content, 120) }}
        </p>
        <div v-if="tags && tags.length" class="dc__tags">
          <span
            v-for="t in tags.slice(0, 3)"
            :key="t.id"
            class="dc__tag"
            :style="{ color: t.color, background: t.color + '14' }"
          >
            {{ t.name }}
          </span>
        </div>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
/* ==========================================
   Shared
   ========================================== */
.dc { cursor: pointer; }

.dc__tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.dc__tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-xs, 4px);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.dc__tag-more {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* ==========================================
   A: Single Photo Card
   ========================================== */
.dc--photo {
  overflow: hidden;
}

.dc-photo__layout {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .dc-photo__layout {
    grid-template-columns: 5fr 7fr;
  }
}

.dc-photo__image-wrap {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--color-bg-subtle);
}

@media (min-width: 600px) {
  .dc-photo__image-wrap {
    aspect-ratio: auto;
    min-height: 200px;
  }
}

.dc-photo__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.dc--photo:hover .dc-photo__image {
  transform: scale(1.03);
}

.dc-photo__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dc-photo__body {
  padding: 20px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dc-photo__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dc-photo__date {
  font-size: var(--font-caption, 12px);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.dc-photo__weekday {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
}

.dc-photo__title {
  font-size: var(--font-section-title, 20px);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dc-photo__excerpt {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dc-photo__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.dc-photo__read-more {
  font-size: var(--font-caption, 12px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* ==========================================
   B: Multi-photo Card
   ========================================== */
.dc--multi {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dc__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dc__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dc-multi__date {
  font-size: var(--font-caption, 12px);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.dc-multi__weekday,
.dc-multi__weather,
.dc-multi__mood {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
}

.dc-multi__title {
  font-size: var(--font-section-title, 20px);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.dc-multi__excerpt {
  font-size: var(--font-secondary, 14px);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dc-multi__photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.dc-multi__photo-item {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
  background: var(--color-bg-subtle);
}

.dc-multi__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.dc--multi:hover .dc-multi__photo-img {
  transform: scale(1.05);
}

.dc-multi__photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: var(--font-content, 16px);
  font-weight: var(--font-weight-bold);
}

.dc__footer-row {
  padding-top: 4px;
}

/* ==========================================
   C: Text-only Card
   ========================================== */
.dc-text__layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.dc-text__date-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  flex-shrink: 0;
  padding-top: 2px;
}

.dc-text__date-num {
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.dc-text__date-mon {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.dc-text__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dc-text__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
}

.dc-text__meta-sep {
  opacity: 0.4;
}

.dc-text__title {
  font-size: var(--font-content, 16px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dc-text__excerpt {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: var(--leading-relaxed);
}

@media (max-width: 400px) {
  .dc-text__date-col {
    min-width: 40px;
  }

  .dc-text__date-num {
    font-size: 20px;
  }
}
</style>
