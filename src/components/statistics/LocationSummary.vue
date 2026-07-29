<script setup lang="ts">
import { NCard } from 'naive-ui'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/utils/statistics'

defineProps<{
  data: { key: string; count: number }[]
  total: number
}>()
</script>

<template>
  <NCard class="location-card" title="📍 地点足迹">
    <div v-if="total === 0" class="location-card__empty">
      暂无数据
    </div>
    <div v-else class="location-card__inner">
      <div class="location-card__total">
        共去过 <strong>{{ total }}</strong> 个地点
      </div>
      <div class="location-card__list">
        <div
          v-for="d in data"
          :key="d.key"
          class="location-item"
        >
          <span class="location-item__icon">
            {{ CATEGORY_ICONS[d.key] || '📍' }}
          </span>
          <span class="location-item__label">
            {{ CATEGORY_LABELS[d.key] || d.key }}
          </span>
          <span class="location-item__count">{{ d.count }}</span>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.location-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.location-card__empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.location-card__inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-card__total {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}

.location-card__total strong {
  color: var(--color-primary);
  font-size: var(--font-content);
}

.location-card__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-item__icon {
  font-size: 16px;
}

.location-item__label {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  flex: 1;
}

.location-item__count {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: 600;
}
</style>
