<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import { useLocationStore } from '@/stores/location'
import { useTagStore } from '@/stores/tag'
import { fetchPhotoTagIds } from '@/repositories/TagRepository'
import { NCard, NButton, NSpace, NPopconfirm, NImage, NTag, NSpin, useMessage } from 'naive-ui'
import type { PhotoRecord } from '@/repositories/PhotoRepository'

const router = useRouter()
const route = useRoute()
const photoStore = usePhotoStore()
const locationStore = useLocationStore()
const tagStore = useTagStore()
const message = useMessage()

const photoId = route.params.id as string
const photo = ref<PhotoRecord | null>(null)
const tagIds = ref<string[]>([])
const loading = ref(true)

const categoryLabels: Record<string, string> = {
  school: '学校',
  life: '生活',
  travel: '旅行',
  people: '人物',
  other: '其他',
}

/** 当前照片在列表中的索引 */
const currentIndex = computed(() => {
  return photoStore.photos.findIndex((p) => p.id === photoId)
})

/** 上一张 */
const prevPhoto = computed(() => {
  if (currentIndex.value <= 0) return null
  return photoStore.photos[currentIndex.value - 1]
})

/** 下一张 */
const nextPhoto = computed(() => {
  if (currentIndex.value >= photoStore.photos.length - 1) return null
  return photoStore.photos[currentIndex.value + 1]
})

/** 关联地点 */
const linkedLocation = computed(() => {
  if (!photo.value?.location_id) return null
  return locationStore.locations.find((l) => l.id === photo.value!.location_id)
})

onMounted(async () => {
  // 确保列表已加载
  if (photoStore.photos.length === 0) {
    await photoStore.loadPhotos()
  }
  if (locationStore.locations.length === 0) {
    locationStore.loadLocations().catch(() => {})
  }
  if (tagStore.tags.length === 0) {
    tagStore.loadTags().catch(() => {})
  }

  const found = photoStore.getPhotoById(photoId)
  if (found) {
    photo.value = found
    try {
      tagIds.value = await fetchPhotoTagIds(photoId)
    } catch {
      // ignore
    }
  } else {
    message.error('照片不存在')
    router.push('/photo')
  }
  loading.value = false
})

function goEdit() {
  router.push(`/photo/${photoId}/edit`)
}

function goPrev() {
  if (prevPhoto.value) {
    router.push(`/photo/${prevPhoto.value.id}`)
  }
}

function goNext() {
  if (nextPhoto.value) {
    router.push(`/photo/${nextPhoto.value.id}`)
  }
}

async function handleDelete() {
  try {
    await photoStore.removePhoto(photoId)
    message.success('已删除')
    router.push('/photo')
  } catch {
    message.error('删除失败')
  }
}

function goLocation(id: string) {
  router.push(`/location/${id}`)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const imageUrl = photo.value ? photoStore.getPhotoDisplayUrl(photo.value) : ''

/** 键盘导航 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') goPrev()
  else if (e.key === 'ArrowRight') goNext()
  else if (e.key === 'Escape') router.push('/photo')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="photo-detail-page">
    <NSpin :show="loading">
      <template v-if="photo">
        <!-- 顶栏 -->
        <div class="photo-detail__header">
          <NButton text size="small" @click="router.push('/photo')">
            ← 返回
          </NButton>
          <NSpace>
            <span class="photo-detail__counter">
              {{ currentIndex + 1 }} / {{ photoStore.photos.length }}
            </span>
            <NButton size="small" @click="goEdit">
              编辑
            </NButton>
            <NPopconfirm @positive-click="handleDelete">
              <template #trigger>
                <NButton size="small" type="error" secondary>
                  删除
                </NButton>
              </template>
              确定删除这张照片？
            </NPopconfirm>
          </NSpace>
        </div>

        <!-- 图片 + 导航按钮 -->
        <div class="photo-detail__viewer">
          <button
            class="nav-arrow nav-arrow--left"
            :class="{ hidden: !prevPhoto }"
            :disabled="!prevPhoto"
            @click="goPrev"
          >
            ‹
          </button>

          <NImage
            :src="imageUrl"
            :alt="photo.title || '照片'"
            style="width: 100%; border-radius: var(--radius-card)"
          />

          <button
            class="nav-arrow nav-arrow--right"
            :class="{ hidden: !nextPhoto }"
            :disabled="!nextPhoto"
            @click="goNext"
          >
            ›
          </button>
        </div>

        <!-- 信息卡片 -->
        <NCard class="photo-detail__card">
          <h1 class="photo-detail__title">
            {{ photo.title || '未命名' }}
          </h1>

          <div class="photo-detail__meta">
            <NTag
              :bordered="false"
              type="info"
              size="small"
              round
            >
              {{ categoryLabels[photo.category] || photo.category }}
            </NTag>
            <span class="photo-detail__date">
              {{ formatDate(photo.photo_date) }}
            </span>
          </div>

          <!-- 标签 -->
          <div v-if="tagIds.length > 0" class="photo-detail__tags">
            <NTag
              v-for="tid in tagIds"
              :key="tid"
              :bordered="false"
              :color="{
                color: tagStore.tags.find((t) => t.id === tid)?.color || '#5E81AC',
                textColor: '#fff',
              }"
              size="small"
              round
            >
              {{ tagStore.tags.find((t) => t.id === tid)?.name || tid }}
            </NTag>
          </div>

          <!-- 关联地点 -->
          <div
            v-if="linkedLocation"
            class="photo-detail__location"
            @click="goLocation(linkedLocation.id)"
          >
            <span class="location-link-icon">📍</span>
            <span class="location-link-name">{{ linkedLocation.name }}</span>
            <span v-if="linkedLocation.address" class="location-link-addr">
              {{ linkedLocation.address }}
            </span>
            <span class="location-link-arrow">→</span>
          </div>

          <p
            v-if="photo.description"
            class="photo-detail__desc"
          >
            {{ photo.description }}
          </p>
        </NCard>

        <!-- 键盘提示 -->
        <p class="photo-detail__hint">
          ← → 切换图片 &nbsp; ESC 返回列表
        </p>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.photo-detail-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.photo-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-card);
}

.photo-detail__counter {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

/* 图片查看器 */
.photo-detail__viewer {
  position: relative;
  margin-bottom: var(--spacing-card);
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-text-primary);
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.nav-arrow:hover:not(:disabled) {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.nav-arrow.hidden {
  opacity: 0;
  pointer-events: none;
}

.nav-arrow--left {
  left: -8px;
}

.nav-arrow--right {
  right: -8px;
}

/* 信息卡片 */
.photo-detail__card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.photo-detail__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.photo-detail__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.photo-detail__date {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}

.photo-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

/* 地点关联 */
.photo-detail__location {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: var(--radius-button);
  background: rgba(79, 142, 247, 0.06);
  cursor: pointer;
  transition: background 0.2s;
}

.photo-detail__location:hover {
  background: rgba(79, 142, 247, 0.12);
}

.location-link-icon {
  font-size: 16px;
}

.location-link-name {
  font-size: var(--font-secondary);
  font-weight: 600;
  color: var(--color-primary);
}

.location-link-addr {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-link-arrow {
  color: var(--color-text-secondary);
  opacity: 0.4;
}

.photo-detail__desc {
  font-size: var(--font-content);
  line-height: 1.8;
  color: var(--color-text-primary);
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.photo-detail__hint {
  text-align: center;
  margin-top: 16px;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  opacity: 0.4;
}

/* 移动端箭头调整 */
@media (max-width: 768px) {
  .nav-arrow {
    width: 36px;
    height: 36px;
    font-size: 22px;
  }
  .nav-arrow--left {
    left: 4px;
  }
  .nav-arrow--right {
    right: 4px;
  }
}
</style>
