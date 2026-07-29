<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import { NCard, NButton, NSpace, NPopconfirm, NSpin, NTag, NImage, useMessage } from 'naive-ui'
import type { PhotoRecord } from '@/repositories/PhotoRepository'

const router = useRouter()
const route = useRoute()
const photoStore = usePhotoStore()
const message = useMessage()

const photoId = route.params.id as string
const photo = ref<PhotoRecord | null>(null)
const loading = ref(true)

const categoryLabels: Record<string, string> = {
  school: '学校',
  life: '生活',
  travel: '旅行',
  people: '人物',
  other: '其他',
}

onMounted(async () => {
  // 确保列表已加载
  if (photoStore.photos.length === 0) {
    await photoStore.loadPhotos()
  }
  const found = photoStore.getPhotoById(photoId)
  if (found) {
    photo.value = found
  } else {
    message.error('照片不存在')
    router.push('/photo')
  }
  loading.value = false
})

function goEdit() {
  router.push(`/photo/${photoId}/edit`)
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const imageUrl = photo.value ? photoStore.getPhotoDisplayUrl(photo.value) : ''
</script>

<template>
  <div class="photo-detail-page">
    <NSpin :show="loading">
      <template v-if="photo">
        <div class="photo-detail__header">
          <NButton text size="small" @click="router.push('/photo')">
            ← 返回
          </NButton>
          <NSpace>
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

        <NCard class="photo-detail__card">
          <NImage
            :src="imageUrl"
            :alt="photo.title || '照片'"
            style="width: 100%; border-radius: var(--radius-card); margin-bottom: 20px"
          />

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
            <span class="photo-detail__date">{{ formatDate(photo.photo_date) }}</span>
          </div>

          <p
            v-if="photo.description"
            class="photo-detail__desc"
          >
            {{ photo.description }}
          </p>
        </NCard>
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
  margin-bottom: 16px;
}

.photo-detail__date {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}

.photo-detail__desc {
  font-size: var(--font-content);
  line-height: 1.8;
  color: var(--color-text-primary);
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
