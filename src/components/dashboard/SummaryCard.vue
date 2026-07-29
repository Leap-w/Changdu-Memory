<script setup lang="ts">
import { NCard, NGrid, NGi } from 'naive-ui'

interface SummaryItem {
  label: string
  icon: string
  route: string
  value: string
}

const items: SummaryItem[] = [
  {
    label: '今日待办',
    icon: '✅',
    route: '/todo',
    value: '—',
  },
  {
    label: '今日花费',
    icon: '💰',
    route: '/expense',
    value: '—',
  },
  {
    label: '今日日记',
    icon: '📖',
    route: '/diary',
    value: '—',
  },
]
</script>

<template>
  <NCard class="summary-card" title="今日概览">
    <NGrid :cols="3" :x-gap="12">
      <NGi v-for="item in items" :key="item.label">
        <div class="summary-item">
          <span class="summary-item__icon">{{ item.icon }}</span>
          <span class="summary-item__label">{{ item.label }}</span>
          <span class="summary-item__value">{{ item.value }}</span>
        </div>
      </NGi>
    </NGrid>
  </NCard>
</template>

<style scoped>
.summary-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
}

.summary-item__icon {
  font-size: 24px;
}

.summary-item__label {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.summary-item__value {
  font-size: var(--font-card-title);
  font-weight: 700;
  color: var(--color-text-primary);
}
</style>
