<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import PhotoEditor from '@/components/photo/PhotoEditor.vue'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const photoStore = usePhotoStore()
const message = useMessage()

const photoId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!photoId.value)

const loading = ref(false)
const existingPhoto = ref<{
  title: string
  description: string
  photo_date: string
  location_id: string | null
  category: string
  imageUrl: string
} | null>(null)

onMounted(async () => {
  if (photoId.value) {
    loading.value = true
    try {
      if (photoStore.photos.length === 0) {
        await photoStore.loadPhotos()
      }
      const found = photoStore.getPhotoById(photoId.value)
      if (found) {
        existingPhoto.value = {
          title: found.title || '',
          description: found.description || '',
          photo_date: found.photo_date,
          location_id: found.location_id,
          category: found.category,
          imageUrl: photoStore.getPhotoDisplayUrl(found),
        }
      } else {
        message.warning('照片不存在')
        router.push('/photo')
      }
    } catch {
      message.error('加载失败')
      router.push('/photo')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit(data: {
  file?: Blob
  fileName?: string
  title: string
  description: string
  photo_date: string
  location_id: string | null
  category: string
}) {
  try {
    if (isEdit.value && photoId.value) {
      await photoStore.editPhoto(photoId.value, {
        title: data.title,
        description: data.description,
        photo_date: data.photo_date,
        location_id: data.location_id,
        category: data.category,
      })
      message.success('已更新')
      router.push(`/photo/${photoId.value}`)
    } else if (data.file && data.fileName) {
      const photo = await photoStore.addPhoto(data.file, data.fileName, {
        title: data.title,
        description: data.description,
        photo_date: data.photo_date,
        location_id: data.location_id,
        category: data.category,
      })
      message.success('上传成功')
      router.push(`/photo/${photo.id}`)
    }
  } catch {
    message.error('保存失败')
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="photo-edit-page">
    <h1 class="photo-edit-page__title">
      {{ isEdit ? '编辑照片' : '上传照片' }}
    </h1>

    <NSpin :show="loading">
      <PhotoEditor
        v-if="!loading"
        :title="existingPhoto?.title"
        :description="existingPhoto?.description"
        :photo-date="existingPhoto?.photo_date"
        :location-id="existingPhoto?.location_id"
        :category="existingPhoto?.category"
        :existing-image-url="existingPhoto?.imageUrl"
        :loading="photoStore.loading"
        :submit-label="isEdit ? '保存' : '上传'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.photo-edit-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.photo-edit-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}
</style>
