<script setup lang="ts">
import type { Expense } from '@/repositories/ExpenseRepository'
import { NCard } from 'naive-ui'

defineProps<{
  expense: Expense
}>()

const emit = defineEmits<{
  click: [id: string]
}>()

const categoryLabels: Record<string, string> = {
  food: '饮食',
  transport: '交通',
  daily: '日用品',
  study: '学习',
  medical: '医疗',
  other: '其他',
}

const categoryIcons: Record<string, string> = {
  food: '🍜',
  transport: '🚌',
  daily: '🛒',
  study: '📚',
  medical: '💊',
  other: '📦',
}

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}
</script>

<template>
  <NCard class="expense-card" hoverable @click="emit('click', expense.id)">
    <div class="expense-card__inner">
      <div class="expense-card__icon">
        {{ categoryIcons[expense.category] || '📦' }}
      </div>
      <div class="expense-card__body">
        <span class="expense-card__category">
          {{ categoryLabels[expense.category] || expense.category }}
        </span>
        <span
          v-if="expense.description"
          class="expense-card__desc"
        >
          {{ expense.description }}
        </span>
      </div>
      <div class="expense-card__amount">
        {{ formatAmount(expense.amount) }}
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.expense-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.expense-card :deep(.n-card__content) {
  padding: 12px 16px;
}

.expense-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expense-card__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.expense-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.expense-card__category {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: 500;
}

.expense-card__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expense-card__amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  flex-shrink: 0;
}
</style>
