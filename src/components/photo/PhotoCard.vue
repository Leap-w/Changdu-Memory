<script setup lang="ts">
import type { PhotoRecord } from '@/repositories/PhotoRepository'
import { usePhotoStore } from '@/stores/photo'
import { NCard, NTag } from 'naive-ui'

const photoStore = usePhotoStore()

const props = defineProps<{
  photo: PhotoRecord
}>()

const emit = defineEmits<{
  click: [id: string]
}>()

const categoryLabels: Record<string, string> = {
  school: '学校',
  life: '生活',
  travel: '旅行',
  people: '人物',
  other: '其他',
}

const imageUrl = photoStore.getPhotoDisplayUrl(props.photo)
</script>

<template>
  <NCard class="photo-card" hoverable @click="emit('click', photo.id)">
    <div class="photo-card__image-wrapper">
      <img
        :src="imageUrl"
        :alt="photo.title || '照片'"
        class="photo-card__image"
        loading="lazy"
      />
    </div>
    <div class="photo-card__info">
      <span class="photo-card__title">
        {{ photo.title || '未命名' }}
      </span>
      <div class="photo-card__meta">
        <NTag :bordered="false" size="tiny">
          {{ categoryLabels[photo.category] || photo.category }}
        </NTag>
        <span class="photo-card__date">{{ photo.photo_date }}</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.photo-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.photo-card :deep(.n-card__content) {
  padding: 0;
}

.photo-card__image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0f2f5;
}

.photo-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-card__info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.photo-card__title {
  font-size: var(--font-secondary);
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.photo-card__date {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}
</style>
