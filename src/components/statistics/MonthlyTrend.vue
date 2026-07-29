<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import type { MonthlyCount } from '@/utils/statistics'

const props = defineProps<{
  title: string
  icon: string
  data: MonthlyCount[]
  maxBars?: number
}>()

const maxCount = computed(() => Math.max(1, ...props.data.map((d) => d.count)))
const displayBars = computed(() => props.data.slice(0, props.maxBars ?? 6))

function formatMonth(month: string): string {
  const [, m] = month.split('-')
  return `${parseInt(m)}月`
}
</script>

<template>
  <NCard class="trend-card" :title="`${icon} ${title}`">
    <div v-if="data.length === 0" class="trend-card__empty">
      暂无数据
    </div>
    <div v-else class="trend-card__bars">
      <div
        v-for="d in displayBars"
        :key="d.month"
        class="trend-bar-row"
      >
        <span class="trend-bar-row__label">{{ formatMonth(d.month) }}</span>
        <div class="trend-bar-row__track">
          <div
            class="trend-bar-row__fill"
            :style="{ width: `${(d.count / maxCount) * 100}%` }"
          />
        </div>
        <span class="trend-bar-row__value">{{ d.count }}</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.trend-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.trend-card__empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.trend-card__bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trend-bar-row__label {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}

.trend-bar-row__track {
  flex: 1;
  height: 18px;
  background: rgba(79, 142, 247, 0.08);
  border-radius: 9px;
  overflow: hidden;
}

.trend-bar-row__fill {
  height: 100%;
  background: linear-gradient(90deg, #4F8EF7, #7AADFF);
  border-radius: 9px;
  min-width: 4px;
  transition: width 0.4s ease;
}

.trend-bar-row__value {
  font-size: var(--font-caption);
  color: var(--color-text-primary);
  font-weight: 600;
  width: 28px;
  flex-shrink: 0;
}
</style>
