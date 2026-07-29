<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import { useLocationStore } from '@/stores/location'
import { NButton, NImage, NSpin, NCard } from 'naive-ui'

const router = useRouter()
const photoStore = usePhotoStore()
const locationStore = useLocationStore()

onMounted(async () => {
  if (photoStore.photos.length === 0) await photoStore.loadPhotos()
  if (locationStore.locations.length === 0) {
    locationStore.loadLocations().catch(() => {})
  }
})

/** 按日期分组（倒序） */
const groupedByDate = computed(() => {
  const map = new Map<string, typeof photoStore.photos>()
  for (const p of photoStore.photos) {
    const key = p.photo_date
    const list = map.get(key) || []
    list.push(p)
    map.set(key, list)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
})

function getLocationName(locationId: string | null): string | null {
  if (!locationId) return null
  return locationStore.locations.find((l) => l.id === locationId)?.name ?? null
}

function goDetail(id: string) {
  router.push(`/photo/${id}`)
}

function goLocation(id: string) {
  router.push(`/location/${id}`)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
}
</script>

<template>
  <div class="timeline-page">
    <div class="timeline-page__header">
      <NButton text size="small" @click="router.push('/photo')">
        ← 照片
      </NButton>
    </div>

    <h1 class="timeline-page__title">
      时间轴
    </h1>

    <NSpin :show="photoStore.loading">
      <!-- 时间线 -->
      <div class="timeline">
        <div
          v-for="[date, photos] in groupedByDate"
          :key="date"
          class="timeline-day"
        >
          <!-- 日期标题 -->
          <div class="timeline-day__header">
            <div class="timeline-dot" />
            <span class="timeline-date">{{ formatDate(date) }}</span>
            <span class="timeline-count">{{ photos.length }} 张</span>
          </div>

          <!-- 该日照片列表 -->
          <div class="timeline-day__photos">
            <NCard
              v-for="photo in photos"
              :key="photo.id"
              class="timeline-card"
              hoverable
              @click="goDetail(photo.id)"
            >
              <div class="timeline-card__inner">
                <NImage
                  :src="photoStore.getPhotoDisplayUrl(photo)"
                  :alt="photo.title || '照片'"
                  width="120"
                  height="120"
                  object-fit="cover"
                  style="border-radius: 12px; flex-shrink: 0"
                />
                <div class="timeline-card__info">
                  <span class="timeline-card__title">
                    {{ photo.title || '未命名' }}
                  </span>
                  <span
                    v-if="photo.description"
                    class="timeline-card__desc"
                  >
                    {{ photo.description }}
                  </span>
                  <span
                    v-if="getLocationName(photo.location_id)"
                    class="timeline-card__location"
                    @click.stop="goLocation(photo.location_id!)"
                  >
                    📍 {{ getLocationName(photo.location_id) }}
                  </span>
                </div>
              </div>
            </NCard>
          </div>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.timeline-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.timeline-page__header {
  margin-bottom: 8px;
}

.timeline-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}

/* 时间线 */
.timeline {
  position: relative;
  padding-left: 28px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(79, 142, 247, 0.15);
}

.timeline-day {
  margin-bottom: 28px;
}

.timeline-day__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.timeline-dot {
  position: absolute;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(79, 142, 247, 0.15);
}

.timeline-date {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
}

.timeline-count {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.timeline-day__photos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.timeline-card :deep(.n-card__content) {
  padding: 12px;
}

.timeline-card__inner {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.timeline-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-card__title {
  font-size: var(--font-content);
  font-weight: 500;
  color: var(--color-text-primary);
}

.timeline-card__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.timeline-card__location {
  font-size: var(--font-caption);
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 500;
}

.timeline-card__location:hover {
  text-decoration: underline;
}
</style>
