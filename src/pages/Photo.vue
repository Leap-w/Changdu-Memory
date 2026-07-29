<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import PhotoCard from '@/components/photo/PhotoCard.vue'
import PhotoEmpty from '@/components/photo/PhotoEmpty.vue'
import { NButton, NSpin, NSpace } from 'naive-ui'

const router = useRouter()
const photoStore = usePhotoStore()

const activeCategory = ref<string>('all')
const selectedMonth = ref<string>('all')

onMounted(() => {
  photoStore.loadPhotos()
})

/** 可用月份列表 */
const availableMonths = computed(() => {
  const months = new Set<string>()
  for (const p of photoStore.photos) {
    months.add(p.photo_date.substring(0, 7))
  }
  return Array.from(months).sort().reverse()
})

/** 筛选后的照片 */
const filteredPhotos = computed(() => {
  let list = photoStore.photos
  if (activeCategory.value !== 'all') {
    list = list.filter((p) => p.category === activeCategory.value)
  }
  if (selectedMonth.value !== 'all') {
    list = list.filter((p) => p.photo_date.startsWith(selectedMonth.value))
  }
  return list
})

/** 按月份分组 */
const groupedByMonth = computed(() => {
  const groups: { month: string; items: typeof filteredPhotos.value }[] = []
  for (const p of filteredPhotos.value) {
    const month = p.photo_date.substring(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === month) {
      last.items.push(p)
    } else {
      groups.push({ month, items: [p] })
    }
  }
  return groups
})

function goDetail(id: string) {
  router.push(`/photo/${id}`)
}

function goUpload() {
  router.push('/photo/new')
}

function goTimeline() {
  router.push('/photo/timeline')
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}

const categoryFilters = [
  { label: '全部', value: 'all' },
  { label: '🏫 学校', value: 'school' },
  { label: '🏠 生活', value: 'life' },
  { label: '🏔️ 旅行', value: 'travel' },
  { label: '👤 人物', value: 'people' },
  { label: '📦 其他', value: 'other' },
]
</script>

<template>
  <div class="photo-page">
    <div class="photo-page__header">
      <h1 class="photo-page__title">
        照片
      </h1>
      <NSpace>
        <NButton size="small" secondary @click="goTimeline">
          时间轴
        </NButton>
        <NButton type="primary" size="small" @click="goUpload">
          上传
        </NButton>
      </NSpace>
    </div>

    <!-- 分类筛选 -->
    <div class="photo-page__filters">
      <div class="filter-segment">
        <button
          v-for="f in categoryFilters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeCategory === f.value }"
          @click="activeCategory = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <select
        v-if="availableMonths.length > 1"
        v-model="selectedMonth"
        class="filter-month"
      >
        <option value="all">
          全部月份
        </option>
        <option
          v-for="m in availableMonths"
          :key="m"
          :value="m"
        >
          {{ formatMonth(m) }}
        </option>
      </select>
    </div>

    <NSpin :show="photoStore.loading">
      <PhotoEmpty
        v-if="!photoStore.loading && photoStore.photos.length === 0"
      />

      <!-- 按月份分组 -->
      <div
        v-for="group in groupedByMonth"
        v-else-if="filteredPhotos.length > 0"
        :key="group.month"
        class="photo-group"
      >
        <h2 class="photo-group__month">
          {{ formatMonth(group.month) }}
          <span class="photo-group__count">{{ group.items.length }} 张</span>
        </h2>
        <div class="photo-grid">
          <PhotoCard
            v-for="photo in group.items"
            :key="photo.id"
            :photo="photo"
            @click="goDetail"
          />
        </div>
      </div>

      <!-- 筛选无结果 -->
      <div
        v-if="!photoStore.loading && photoStore.photos.length > 0 && filteredPhotos.length === 0"
        class="photo-page__no-result"
      >
        该筛选条件下没有照片
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
  margin-bottom: 16px;
}

.photo-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

/* 筛选区 */
.photo-page__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-segment {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  background: var(--color-bg);
  border-radius: var(--radius-button);
  padding: 3px;
}

.filter-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.filter-btn.active {
  background: var(--color-bg-white);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-month {
  padding: 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: var(--font-caption);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg-white);
}

/* 月份分组 */
.photo-group {
  margin-bottom: 28px;
}

.photo-group__month {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
  padding-left: 4px;
}

.photo-group__count {
  font-size: var(--font-caption);
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: 8px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.photo-page__no-result {
  text-align: center;
  padding: 48px;
  color: var(--color-text-secondary);
  font-size: var(--font-secondary);
}

/* Tablet */
@media (min-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* Desktop */
@media (min-width: 1200px) {
  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}
</style>
