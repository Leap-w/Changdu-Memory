<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { AppIcon } from '@/components/ui'
import { getMonthlyExpenseTotal, getExpenseCategoryTotal, getTotalExpense, CATEGORY_LABELS } from '@/utils/statistics'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ expenses: any[] }>()

const monthlyData = computed(() => getMonthlyExpenseTotal(props.expenses).slice(0, 6))
const categoryData = computed(() => getExpenseCategoryTotal(props.expenses))
const total = computed(() => getTotalExpense(props.expenses))
const maxMonthly = computed(() => Math.max(1, ...monthlyData.value.map((d) => d.total)))

function formatMonth(month: string): string {
  const [, m] = month.split('-')
  return `${parseInt(m)}月`
}
</script>

<template>
  <NCard class="expense-card">
    <template #header>
      <div class="expense-card__header">
        <AppIcon name="wallet" size="16" color="var(--color-primary)" />
        <span>花费统计</span>
      </div>
    </template>
    <div v-if="expenses.length === 0" class="expense-card__empty">
      暂无数据
    </div>
    <div v-else class="expense-card__inner">
      <div class="expense-card__total">
        总支出 <strong>¥{{ total.toFixed(2) }}</strong>
      </div>

      <!-- 月度趋势 -->
      <div class="expense-card__section">
        <span class="expense-card__section-title">月度趋势</span>
        <div class="expense-bars">
          <div
            v-for="d in monthlyData"
            :key="d.month"
            class="expense-bar-row"
          >
            <span class="expense-bar-row__label">{{ formatMonth(d.month) }}</span>
            <div class="expense-bar-row__track">
              <div
                class="expense-bar-row__fill"
                :style="{ width: `${(d.total / maxMonthly) * 100}%` }"
              />
            </div>
            <span class="expense-bar-row__value">¥{{ d.total }}</span>
          </div>
        </div>
      </div>

      <!-- 分类 -->
      <div class="expense-card__section">
        <span class="expense-card__section-title">分类</span>
        <div class="expense-chips">
          <span
            v-for="d in categoryData"
            :key="d.key"
            class="expense-chip"
          >
            {{ CATEGORY_LABELS[d.key] || d.key }}
            ¥{{ d.total }}
          </span>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.expense-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.expense-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.expense-card__empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.expense-card__inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.expense-card__total {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}

.expense-card__total strong {
  color: var(--color-secondary);
  font-size: var(--font-content);
}

.expense-card__section-title {
  display: block;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.expense-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expense-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expense-bar-row__label {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}

.expense-bar-row__track {
  flex: 1;
  height: 14px;
  background: rgba(87, 184, 148, 0.1);
  border-radius: 7px;
  overflow: hidden;
}

.expense-bar-row__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-secondary), #7DCFA8);
  border-radius: 7px;
  min-width: 3px;
}

.expense-bar-row__value {
  font-size: 10px;
  color: var(--color-text-secondary);
  font-weight: 600;
  width: 52px;
  text-align: right;
  flex-shrink: 0;
}

.expense-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.expense-chip {
  padding: 3px 10px;
  border-radius: 12px;
  background: rgba(87, 184, 148, 0.08);
  font-size: var(--font-caption);
  color: var(--color-text-primary);
}
</style>
