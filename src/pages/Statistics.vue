<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useExpenseStore } from '@/stores/expense'
import { useWorkStore } from '@/stores/work'
import { useTodoStore } from '@/stores/todo'
import { useTagStore } from '@/stores/tag'
import OverviewCard from '@/components/statistics/OverviewCard.vue'
import MonthlyTrend from '@/components/statistics/MonthlyTrend.vue'
import WorkSummary from '@/components/statistics/WorkSummary.vue'
import ExpenseSummary from '@/components/statistics/ExpenseSummary.vue'
import TagRanking from '@/components/statistics/TagRanking.vue'
import { NSpin } from 'naive-ui'
import {
  getMonthlyDiaryCount,
  getWorkPeriodCount,
  getWorkCategoryCount,
  getTotalExpense,
  getTagUsageCount,
} from '@/utils/statistics'
import { fetchAllDiaryTags } from '@/repositories/TagRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const diaryTags = ref<any[]>([])

const loading = ref(true)

const diaryStore = useDiaryStore()
const expenseStore = useExpenseStore()
const workStore = useWorkStore()
const todoStore = useTodoStore()
const tagStore = useTagStore()

onMounted(async () => {
  const stores = [
    { load: () => diaryStore.diaries.length > 0 ? Promise.resolve() : diaryStore.loadDiaries() },
    { load: () => expenseStore.expenses.length > 0 ? Promise.resolve() : expenseStore.loadExpenses() },
    { load: () => workStore.works.length > 0 ? Promise.resolve() : workStore.loadWorks() },
    { load: () => todoStore.todos.length > 0 ? Promise.resolve() : todoStore.loadTodos() },
    { load: () => tagStore.tags.length > 0 ? Promise.resolve() : tagStore.loadTags() },
  ]

  await Promise.allSettled(stores.map((s) => s.load()))

  try {
    if (diaryStore.diaries.length > 0) {
      diaryTags.value = await fetchAllDiaryTags()
    }
  } catch { /* ignore */ }

  loading.value = false
})
</script>

<template>
  <div class="stats-page">
    <h1 class="stats-page__title">年度记忆统计</h1>

    <NSpin :show="loading">
      <div class="stats-grid">
        <OverviewCard
          class="stats-item stats-item--overview"
          :diary-count="diaryStore.diaries.length"
          :expense-total="getTotalExpense(expenseStore.expenses)"
          :work-count="workStore.works.length"
        />

        <MonthlyTrend
          class="stats-item"
          title="日记月度趋势"
          icon="📖"
          :data="getMonthlyDiaryCount(diaryStore.diaries)"
        />

        <WorkSummary
          class="stats-item"
          :period-data="getWorkPeriodCount(workStore.works)"
          :category-data="getWorkCategoryCount(workStore.works)"
          :total="workStore.works.length"
        />

        <ExpenseSummary class="stats-item" :expenses="expenseStore.expenses" />

        <TagRanking
          class="stats-item"
          :data="getTagUsageCount(tagStore.tags, diaryTags)"
        />
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.stats-page { max-width: 1200px; margin: 0 auto; padding: var(--spacing-page); }
.stats-page__title { font-size: var(--font-title); font-weight: 700; color: var(--color-text-primary); margin: 0 0 24px; }
.stats-grid { display: flex; flex-direction: column; gap: var(--spacing-card); }
.stats-item--overview { order: -1; }

@media (min-width: 768px) {
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-card); }
  .stats-item--overview { grid-column: 1 / 3; }
}

@media (min-width: 1200px) {
  .stats-page { max-width: 1200px; }
}
</style>
