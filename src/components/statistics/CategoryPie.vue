<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/utils/statistics'

const props = defineProps<{
  title: string
  icon: string
  data: { key: string; count: number }[]
}>()

const total = computed(() => props.data.reduce((s, d) => s + d.count, 0))

function pct(count: number): string {
  if (total.value === 0) return '0'
  return Math.round((count / total.value) * 100) + '%'
}
</script>

<template>
  <NCard class="pie-card" :title="`${icon} ${title}`">
    <div v-if="data.length === 0" class="pie-card__empty">
      暂无数据
    </div>
    <div v-else class="pie-card__list">
      <div
        v-for="d in data"
        :key="d.key"
        class="pie-item"
      >
        <span class="pie-item__icon">
          {{ CATEGORY_ICONS[d.key] || '📦' }}
        </span>
        <span class="pie-item__label">
          {{ CATEGORY_LABELS[d.key] || d.key }}
        </span>
        <div class="pie-item__bar">
          <div
            class="pie-item__bar-fill"
            :style="{ width: pct(d.count) }"
          />
        </div>
        <span class="pie-item__value">{{ pct(d.count) }}</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.pie-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.pie-card__empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.pie-card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pie-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pie-item__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.pie-item__label {
  font-size: var(--font-caption);
  color: var(--color-text-primary);
  width: 48px;
  flex-shrink: 0;
}

.pie-item__bar {
  flex: 1;
  height: 14px;
  background: rgba(79, 142, 247, 0.08);
  border-radius: 7px;
  overflow: hidden;
}

.pie-item__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-secondary), #7DCFA8);
  border-radius: 7px;
  min-width: 3px;
}

.pie-item__value {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: 600;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
}
</style>
