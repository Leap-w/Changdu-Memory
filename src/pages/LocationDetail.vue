<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocationStore } from '@/stores/location'
import { usePhotoStore } from '@/stores/photo'
import { NCard, NButton, NImage, NSpin, useMessage } from 'naive-ui'
import type { Location } from '@/repositories/LocationRepository'

const router = useRouter()
const route = useRoute()
const locationStore = useLocationStore()
const photoStore = usePhotoStore()
const message = useMessage()

const locationId = route.params.id as string
const location = ref<Location | null>(null)
const loading = ref(true)

const typeLabels: Record<string, string> = {
  school: '📚 支教学校',
  city: '🏙️ 城市生活',
  travel: '🏔️ 旅行探索',
  life: '🏠 日常生活',
  other: '📍 其他',
}

/** 在该地点拍摄的照片 */
const locationPhotos = computed(() => {
  return photoStore.photos.filter((p) => p.location_id === locationId)
})

onMounted(async () => {
  if (locationStore.locations.length === 0) {
    await locationStore.loadLocations()
  }
  if (photoStore.photos.length === 0) {
    photoStore.loadPhotos().catch(() => {})
  }

  const found = locationStore.locations.find((l) => l.id === locationId)
  if (found) {
    location.value = found
  } else {
    message.error('地点不存在')
    router.push('/location')
  }
  loading.value = false
})

function goEdit() {
  router.push(`/location/${locationId}/edit`)
}

function goPhoto(photoId: string) {
  router.push(`/photo/${photoId}`)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <div class="location-detail-page">
    <NSpin :show="loading">
      <template v-if="location">
        <div class="location-detail__header">
          <NButton text size="small" @click="router.push('/location')">
            ← 地点
          </NButton>
          <NButton size="small" @click="goEdit">
            编辑
          </NButton>
        </div>

        <!-- 地点信息 -->
        <NCard class="location-detail__card">
          <div class="location-detail__type">
            {{ typeLabels[location.location_type] || location.location_type }}
          </div>
          <h1 class="location-detail__name">
            {{ location.name }}
          </h1>
          <div v-if="location.address" class="location-detail__address">
            {{ location.address }}
          </div>
          <div class="location-detail__date">
            到访日期：{{ formatDate(location.visit_date) }}
          </div>
          <p
            v-if="location.description"
            class="location-detail__desc"
          >
            {{ location.description }}
          </p>
        </NCard>

        <!-- 关联照片 -->
        <div v-if="locationPhotos.length > 0" class="location-detail__photos">
          <h2 class="location-detail__section-title">
            在这里的照片
            <span class="photo-count">{{ locationPhotos.length }} 张</span>
          </h2>
          <div class="location-photo-grid">
            <div
              v-for="photo in locationPhotos"
              :key="photo.id"
              class="location-photo-item"
              @click="goPhoto(photo.id)"
            >
              <NImage
                :src="photoStore.getPhotoDisplayUrl(photo)"
                :alt="photo.title || '照片'"
                width="100%"
                height="100%"
                object-fit="cover"
                style="border-radius: 12px"
              />
              <div class="location-photo-item__label">
                {{ photo.title || '未命名' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 无照片 -->
        <div v-else-if="!loading" class="location-detail__no-photos">
          还没有在这里拍过照片
        </div>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.location-detail-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.location-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-card);
}

.location-detail__card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: 24px;
}

.location-detail__type {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.location-detail__name {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.location-detail__address {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.location-detail__date {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.location-detail__desc {
  font-size: var(--font-content);
  line-height: 1.8;
  color: var(--color-text-primary);
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* 照片区域 */
.location-detail__photos {
  margin-top: 8px;
}

.location-detail__section-title {
  font-size: var(--font-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.photo-count {
  font-size: var(--font-caption);
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: 8px;
}

.location-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.location-photo-item {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.location-photo-item:hover {
  transform: scale(1.03);
}

.location-photo-item__label {
  font-size: 10px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-detail__no-photos {
  text-align: center;
  padding: 32px;
  color: var(--color-text-secondary);
  font-size: var(--font-secondary);
}
</style>
