<script setup lang="ts">
import type { SearchResult } from '@/utils/search'
import { NCard } from 'naive-ui'

defineProps<{ result: SearchResult }>()

const emit = defineEmits<{ click: [result: SearchResult] }>()

const typeIcons: Record<string, string> = { diary: '📖', work: '📋' }
const typeLabels: Record<string, string> = { diary: '日记', work: '工作' }
const periodLabels: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '晚上' }
</script>

<template>
  <NCard class="result-card" hoverable @click="emit('click', result)">
    <div class="result-card__inner">
      <span class="result-card__icon">{{ typeIcons[result.type] || '📄' }}</span>
      <div class="result-card__body">
        <div class="result-card__header">
          <span class="result-card__type-label">{{ typeLabels[result.type] || result.type }}</span>
          <span class="result-card__date">{{ result.date }}</span>
        </div>
        <span class="result-card__title">{{ result.title }}</span>
        <span v-if="result.type === 'work' && result.extra" class="result-card__extra">{{ periodLabels[result.extra] || result.extra }}</span>
        <span v-if="result.description" class="result-card__desc">{{ result.description }}</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.result-card { border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
.result-card :deep(.n-card__content) { padding: 14px 16px; }
.result-card__inner { display: flex; gap: 12px; align-items: flex-start; }
.result-card__icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.result-card__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.result-card__header { display: flex; align-items: center; gap: 10px; }
.result-card__type-label { font-size: 10px; color: var(--color-primary); background: var(--color-primary-bg); padding: 1px 7px; border-radius: 4px; }
.result-card__date { font-size: var(--font-caption); color: var(--color-text-secondary); }
.result-card__title { font-size: var(--font-content); color: var(--color-text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-card__desc { font-size: var(--font-caption); color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-card__extra { font-size: var(--font-caption); color: var(--color-text-secondary); }
</style>
