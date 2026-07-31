<script setup lang="ts">
import type { WorkPlan } from '@/repositories/WorkRepository'
import { AppCard, AppIcon } from '@/components/ui'

const periodLabels: Record<string, string> = {
  morning: '上午', afternoon: '下午', evening: '晚上',
}

defineProps<{
  work: WorkPlan
}>()

const emit = defineEmits<{
  click: [id: string]
}>()
</script>

<template>
  <AppCard hoverable class="wc" @click="emit('click', work.id)">
    <div class="wc__inner">
      <div class="wc__body">
        <div class="wc__head">
          <span class="wc__period">{{ periodLabels[work.period] || work.period }}</span>
          <span class="wc__title">{{ work.title }}</span>
        </div>
        <span
          v-if="work.content"
          class="wc__content"
        >
          {{ work.content.length > 80 ? work.content.slice(0, 80) + '…' : work.content }}
        </span>
      </div>
      <AppIcon name="chevron-right" size="14" class="wc__arrow" />
    </div>
  </AppCard>
</template>

<style scoped>
.wc__inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wc__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wc__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wc__period {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.wc__title {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wc__content {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wc__arrow {
  color: var(--color-text-tertiary);
  opacity: 0.3;
  flex-shrink: 0;
}
</style>
