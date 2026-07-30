<script setup lang="ts">
import type { PhotoRecord } from '@/repositories/PhotoRepository'
import { usePhotoStore } from '@/stores/photo'

const photoStore = usePhotoStore()

const props = defineProps<{ photo: PhotoRecord }>()
const emit = defineEmits<{ click: [id: string] }>()

const labels: Record<string, string> = {
  school: '教学', people: '学生', life: '生活', travel: '旅行', other: '活动',
}

const imageUrl = photoStore.getPhotoDisplayUrl(props.photo)
</script>

<template>
  <div class="pc" @click="emit('click', photo.id)">
    <img :src="imageUrl" :alt="photo.title || ''" class="pc__img" loading="lazy" />
    <div class="pc__overlay">
      <span class="pc__label">{{ labels[photo.category] || photo.category }}</span>
      <span class="pc__date">{{ photo.photo_date }}</span>
    </div>
  </div>
</template>

<style scoped>
.pc { position:relative;border-radius:var(--radius-md);overflow:hidden;cursor:pointer;break-inside:avoid;margin-bottom:12px;transition:transform .15s; }
.pc:hover { transform:translateY(-2px); }
.pc__img { width:100%;display:block;border-radius:var(--radius-md); }
.pc__overlay { position:absolute;bottom:0;left:0;right:0;padding:10px 12px;background:linear-gradient(transparent,rgba(0,0,0,.45));display:flex;justify-content:space-between;align-items:flex-end; }
.pc__label { font-size:11px;color:#fff;font-weight:600;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:4px;backdrop-filter:blur(4px); }
.pc__date { font-size:11px;color:rgba(255,255,255,.7); }
</style>
