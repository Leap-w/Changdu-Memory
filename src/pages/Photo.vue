<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import PhotoCard from '@/components/photo/PhotoCard.vue'
import PhotoEmpty from '@/components/photo/PhotoEmpty.vue'
import { NButton, NSpin } from 'naive-ui'

const router = useRouter()
const photoStore = usePhotoStore()

onMounted(() => {
  photoStore.loadPhotos()
})

function goDetail(id: string) {
  router.push(`/photo/${id}`)
}

function goUpload() {
  router.push('/photo/new')
}
</script>

<template>
  <div class="photo-page">
    <div class="photo-page__header">
      <h1 class="photo-page__title">
        照片
      </h1>
      <NButton type="primary" size="medium" @click="goUpload">
        上传
      </NButton>
    </div>

    <NSpin :show="photoStore.loading">
      <PhotoEmpty
        v-if="!photoStore.loading && photoStore.photos.length === 0"
      />

      <div v-else class="photo-grid">
        <PhotoCard
          v-for="photo in photoStore.photos"
          :key="photo.id"
          :photo="photo"
          @click="goDetail"
        />
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.photo-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.photo-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.photo-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* Tablet: 3列 */
@media (min-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* Desktop: 4列 */
@media (min-width: 1200px) {
  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}
</style>
