<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import DiaryCard from '@/components/diary/DiaryCard.vue'
import DiaryEmpty from '@/components/diary/DiaryEmpty.vue'
import { NButton, NSpin } from 'naive-ui'

const router = useRouter()
const diaryStore = useDiaryStore()

onMounted(() => {
  diaryStore.loadDiaries()
})

function goDetail(id: string) {
  router.push(`/diary/${id}`)
}

function goCreate() {
  router.push('/diary/new')
}

/** 月份格式化 */
function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}
</script>

<template>
  <div class="diary-page">
    <div class="diary-page__header">
      <h1 class="diary-page__title">
        日记
      </h1>
      <NButton type="primary" size="medium" @click="goCreate">
        写日记
      </NButton>
    </div>

    <NSpin :show="diaryStore.loading">
      <!-- 空状态 -->
      <DiaryEmpty
        v-if="!diaryStore.loading && diaryStore.diaries.length === 0"
      />

      <!-- 按月份分组列表 -->
      <div
        v-for="group in diaryStore.groupedByMonth"
        :key="group.month"
        class="diary-group"
      >
        <h3 class="diary-group__month">
          {{ formatMonth(group.month) }}
        </h3>
        <div class="diary-group__list">
          <DiaryCard
            v-for="diary in group.items"
            :key="diary.id"
            :diary="diary"
            @click="goDetail"
          />
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.diary-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.diary-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.diary-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.diary-group {
  margin-bottom: 24px;
}

.diary-group__month {
  font-size: var(--font-secondary);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 12px;
  padding-left: 4px;
}

.diary-group__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
