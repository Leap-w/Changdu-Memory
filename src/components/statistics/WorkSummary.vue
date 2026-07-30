<script setup lang="ts">
import { NCard } from 'naive-ui'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/utils/statistics'

defineProps<{
  periodData: { key: string; count: number }[]
  categoryData: { key: string; count: number }[]
  total: number
}>()

const periodLabels: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}
</script>

<template>
  <NCard class="work-card" title="📋 工作统计">
    <div v-if="total === 0" class="work-card__empty">
      暂无数据
    </div>
    <div v-else class="work-card__inner">
      <div class="work-card__total">
        共 <strong>{{ total }}</strong> 项工作记录
      </div>

      <div class="work-card__section">
        <span class="work-card__section-title">按时间段</span>
        <div class="work-card__chips">
          <span
            v-for="d in periodData"
            :key="d.key"
            class="work-chip"
          >
            {{ periodLabels[d.key] || d.key }} {{ d.count }}次
          </span>
        </div>
      </div>

      <div class="work-card__section">
        <span class="work-card__section-title">按分类</span>
        <div class="work-card__chips">
          <span
            v-for="d in categoryData"
            :key="d.key"
            class="work-chip"
          >
            {{ CATEGORY_ICONS[d.key] || '' }}
            {{ CATEGORY_LABELS[d.key] || d.key }} {{ d.count }}
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

.work-card__empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.work-card__inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.work-card__total {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}

.work-card__total strong {
  color: var(--color-primary);
  font-size: var(--font-content);
}

.work-card__section-title {
  display: block;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.work-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.work-chip {
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--color-primary-bg);
  font-size: var(--font-caption);
  color: var(--color-text-primary);
}
</style>
