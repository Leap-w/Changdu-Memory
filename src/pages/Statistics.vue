<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { usePhotoStore } from '@/stores/photo'
import { useLocationStore } from '@/stores/location'
import { useExpenseStore } from '@/stores/expense'
import { useWorkStore } from '@/stores/work'
import { useTodoStore } from '@/stores/todo'
import { useTagStore } from '@/stores/tag'
import OverviewCard from '@/components/statistics/OverviewCard.vue'
import MonthlyTrend from '@/components/statistics/MonthlyTrend.vue'
import CategoryPie from '@/components/statistics/CategoryPie.vue'
import WorkSummary from '@/components/statistics/WorkSummary.vue'
import ExpenseSummary from '@/components/statistics/ExpenseSummary.vue'
import LocationSummary from '@/components/statistics/LocationSummary.vue'
import TagRanking from '@/components/statistics/TagRanking.vue'
import { NSpin } from 'naive-ui'
import {
  getMonthlyDiaryCount,
  getMonthlyPhotoCount,
  getPhotoCategoryCount,
  getWorkPeriodCount,
  getWorkCategoryCount,
  getTotalExpense,
  getLocationTypeCount,
  getTagUsageCount,
} from '@/utils/statistics'
import { fetchAllDiaryTags, fetchAllPhotoTags, fetchAllLocationTags } from '@/repositories/TagRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const diaryTags = ref<any[]>([])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const photoTags = ref<any[]>([])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const locationTags = ref<any[]>([])

const loading = ref(true)

const diaryStore = useDiaryStore()
const photoStore = usePhotoStore()
const locationStore = useLocationStore()
const expenseStore = useExpenseStore()
const workStore = useWorkStore()
const todoStore = useTodoStore()
const tagStore = useTagStore()

onMounted(async () => {
  const stores = [
    { load: () => diaryStore.diaries.length > 0 ? Promise.resolve() : diaryStore.loadDiaries() },
    { load: () => photoStore.photos.length > 0 ? Promise.resolve() : photoStore.loadPhotos() },
    { load: () => locationStore.locations.length > 0 ? Promise.resolve() : locationStore.loadLocations() },
    { load: () => expenseStore.expenses.length > 0 ? Promise.resolve() : expenseStore.loadExpenses() },
    { load: () => workStore.works.length > 0 ? Promise.resolve() : workStore.loadWorks() },
    { load: () => todoStore.todos.length > 0 ? Promise.resolve() : todoStore.loadTodos() },
    { load: () => tagStore.tags.length > 0 ? Promise.resolve() : tagStore.loadTags() },
  ]

  await Promise.allSettled(stores.map((s) => s.load()))

  // 加载标签关联数据
  try {
    if (diaryStore.diaries.length > 0) {
      diaryTags.value = await fetchAllDiaryTags()
    }
    if (photoStore.photos.length > 0) {
      photoTags.value = await fetchAllPhotoTags()
    }
    if (locationStore.locations.length > 0) {
      locationTags.value = await fetchAllLocationTags()
    }
  } catch {
    // ignore tag fetch failures
  }

  loading.value = false
})
</script>

<template>
  <div class="stats-page">
    <h1 class="stats-page__title">
      年度记忆统计
    </h1>

    <NSpin :show="loading">
      <div class="stats-grid">
        <!-- 总览 -->
        <OverviewCard
          class="stats-item stats-item--overview"
          :diary-count="diaryStore.diaries.length"
          :photo-count="photoStore.photos.length"
          :location-count="locationStore.locations.length"
          :expense-total="getTotalExpense(expenseStore.expenses)"
          :work-count="workStore.works.length"
        />

        <!-- 日记月度趋势 -->
        <MonthlyTrend
          class="stats-item"
          title="日记月度趋势"
          icon="📖"
          :data="getMonthlyDiaryCount(diaryStore.diaries)"
        />

        <!-- 照片月度趋势 -->
        <MonthlyTrend
          class="stats-item"
          title="照片月度趋势"
          icon="📷"
          :data="getMonthlyPhotoCount(photoStore.photos)"
        />

        <!-- 照片分类占比 -->
        <CategoryPie
          class="stats-item"
          title="照片分类占比"
          icon="📷"
          :data="getPhotoCategoryCount(photoStore.photos)"
        />

        <!-- 工作统计 -->
        <WorkSummary
          class="stats-item"
          :period-data="getWorkPeriodCount(workStore.works)"
          :category-data="getWorkCategoryCount(workStore.works)"
          :total="workStore.works.length"
        />

        <!-- 花费统计 -->
        <ExpenseSummary
          class="stats-item"
          :expenses="expenseStore.expenses"
        />

        <!-- 地点足迹 -->
        <LocationSummary
          class="stats-item"
          :data="getLocationTypeCount(locationStore.locations)"
          :total="locationStore.locations.length"
        />

        <!-- 标签排行榜 -->
        <TagRanking
          class="stats-item"
          :data="getTagUsageCount(tagStore.tags, diaryTags, photoTags, locationTags)"
        />
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.stats-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-card);
}

.stats-item--overview {
  order: -1;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-card);
  }

  .stats-item--overview {
    grid-column: 1 / 3;
  }
}

/* Desktop: wider max */
@media (min-width: 1200px) {
  .stats-page {
    max-width: 1200px;
  }
}
</style>
