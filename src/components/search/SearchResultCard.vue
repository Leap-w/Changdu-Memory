<script setup lang="ts">
import type { SearchResult } from '@/utils/search'
import { AppCard, AppIcon } from '@/components/ui'

defineProps<{ result: SearchResult }>()

const emit = defineEmits<{ click: [result: SearchResult] }>()

const typeIcons: Record<string, string> = { diary: 'book', work: 'briefcase' }
const typeLabels: Record<string, string> = { diary: '日记', work: '工作' }
const periodLabels: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '晚上' }
</script>

<template>
  <AppCard hoverable class="src" @click="emit('click', result)">
    <div class="src__inner">
      <div class="src__icon">
        <AppIcon :name="typeIcons[result.type] || 'grid'" size="16" />
      </div>
      <div class="src__body">
        <div class="src__header">
          <span class="src__type-label">{{ typeLabels[result.type] || result.type }}</span>
          <span class="src__date">{{ result.date }}</span>
        </div>
        <span class="src__title">{{ result.title }}</span>
        <span v-if="result.type === 'work' && result.extra" class="src__extra">
          {{ periodLabels[result.extra] || result.extra }}
        </span>
        <span v-if="result.description" class="src__desc">{{ result.description }}</span>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.src__inner {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.src__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-top: 2px;
}

.src__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.src__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.src__type-label {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-bg);
  padding: 1px 7px;
  border-radius: var(--radius-xs);
}

.src__date {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.src__title {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.src__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.src__extra {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}
</style>
