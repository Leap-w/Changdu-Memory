<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkStore } from '@/stores/work'
import WorkCard from '@/components/work/WorkCard.vue'
import WorkEmpty from '@/components/work/WorkEmpty.vue'
import { NButton, NSpin } from 'naive-ui'

const router = useRouter()
const workStore = useWorkStore()

onMounted(() => {
  workStore.loadWorks()
})

function goEdit(id: string) {
  router.push(`/work/${id}/edit`)
}

function goCreate() {
  router.push('/work/new')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
}

const periodLabels: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}
</script>

<template>
  <div class="work-page">
    <div class="work-page__header">
      <h1 class="work-page__title">
        工作
      </h1>
      <NButton type="primary" size="medium" @click="goCreate">
        添加
      </NButton>
    </div>

    <NSpin :show="workStore.loading">
      <WorkEmpty
        v-if="!workStore.loading && workStore.works.length === 0"
      />

      <!-- 按日期分组 → 按时间段分区 -->
      <div
        v-for="group in workStore.groupedByDate"
        v-else
        :key="group.date"
        class="work-group"
      >
        <div class="work-group__header">
          <span class="work-group__date">{{ formatDate(group.date) }}</span>
          <span class="work-group__count">{{ group.items.length }} 项</span>
        </div>

        <div class="work-group__sections">
          <!-- 按时间段分小区 -->
          <template
            v-for="period in ['morning', 'afternoon', 'evening']"
            :key="period"
          >
            <div
              v-if="group.items.some((w) => w.period === period)"
              class="period-section"
            >
              <span class="period-section__label">{{ periodLabels[period] }}</span>
              <div class="period-section__list">
                <WorkCard
                  v-for="work in group.items.filter((w) => w.period === period)"
                  :key="work.id"
                  :work="work"
                  @click="goEdit"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.work-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.work-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.work-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.work-group {
  margin-bottom: 28px;
}

.work-group__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.work-group__date {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
}

.work-group__count {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.work-group__sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.period-section__label {
  display: block;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: 600;
  margin-bottom: 6px;
  padding-left: 4px;
}

.period-section__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
