<script setup lang="ts">
import type { WorkPlan } from '@/repositories/WorkRepository'
import { AppCard } from '@/components/ui'
import { formatTimeHM } from '@/utils/date'

defineProps<{
  work: WorkPlan
}>()
</script>

<template>
  <AppCard class="wc">
    <div class="wc__inner">
      <div class="wc__body">
        <div class="wc__head">
          <span v-if="work.start_time || work.end_time" class="wc__time">
            {{ formatTimeHM(work.start_time) }}{{ work.end_time ? ` – ${formatTimeHM(work.end_time)}` : '' }}
          </span>
          <span v-else class="wc__period">未设置时间</span>
          <span class="wc__title">{{ work.title }}</span>
        </div>
        <span
          v-if="work.content"
          class="wc__content"
        >
          {{ work.content.length > 80 ? work.content.slice(0, 80) + '…' : work.content }}
        </span>
      </div>
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

.wc__period,
.wc__time {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  flex-shrink: 0;
}

.wc__time {
  font-variant-numeric: tabular-nums;
  color: var(--color-primary);
  background: var(--color-primary-bg);
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
</style>
