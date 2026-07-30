<script setup lang="ts">
import type { WorkPlan } from '@/repositories/WorkRepository'
import { NCard } from 'naive-ui'

defineProps<{
  work: WorkPlan
}>()

const emit = defineEmits<{
  click: [id: string]
}>()

const periodLabels: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}

const periodColors: Record<string, string> = {
  morning: '#5E81AC',
  afternoon: '#F59E0B',
  evening: '#8B5CF6',
}

const categoryLabels: Record<string, string> = {
  meeting: '会议',
  exam_supervision: '监考',
  training: '培训',
  activity: '活动',
  other: '其他',
}
</script>

<template>
  <NCard class="work-card" hoverable @click="emit('click', work.id)">
    <div class="work-card__inner">
      <div
        class="work-card__period"
        :style="{ background: periodColors[work.period] || '#6B7280' }"
      >
        {{ periodLabels[work.period] || work.period }}
      </div>
      <div class="work-card__body">
        <span class="work-card__title">{{ work.title }}</span>
        <div class="work-card__meta">
          <span class="work-card__category">
            {{ categoryLabels[work.category] || work.category }}
          </span>
          <span
            v-if="work.content"
            class="work-card__content"
          >
            {{ work.content.length > 40 ? work.content.slice(0, 40) + '…' : work.content }}
          </span>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.work-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.work-card :deep(.n-card__content) {
  padding: 12px 16px;
}

.work-card__inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.work-card__period {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 8px;
  color: #fff;
  font-size: var(--font-caption);
  font-weight: 600;
  white-space: nowrap;
}

.work-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.work-card__title {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: 500;
}

.work-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.work-card__category {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.work-card__content {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
