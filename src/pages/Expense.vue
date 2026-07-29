<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpenseStore } from '@/stores/expense'
import ExpenseCard from '@/components/expense/ExpenseCard.vue'
import ExpenseEmpty from '@/components/expense/ExpenseEmpty.vue'
import { NButton, NSpin, NCard } from 'naive-ui'

const router = useRouter()
const expenseStore = useExpenseStore()

onMounted(() => {
  expenseStore.loadExpenses()
})

function goDetail(id: string) {
  router.push(`/expense/${id}/edit`)
}

function goCreate() {
  router.push('/expense/new')
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function weekDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
}
</script>

<template>
  <div class="expense-page">
    <div class="expense-page__header">
      <h1 class="expense-page__title">
        花费
      </h1>
      <NButton type="primary" size="medium" @click="goCreate">
        记一笔
      </NButton>
    </div>

    <!-- 当月总支出 -->
    <NCard v-if="!expenseStore.loading && expenseStore.expenses.length > 0" class="monthly-total-card">
      <div class="monthly-total">
        <span class="monthly-total__label">
          {{ formatMonth(expenseStore.currentMonth) }} 总支出
        </span>
        <span class="monthly-total__amount">
          ¥{{ expenseStore.monthlyTotal.toFixed(2) }}
        </span>
      </div>
    </NCard>

    <NSpin :show="expenseStore.loading">
      <!-- 空状态 -->
      <ExpenseEmpty
        v-if="!expenseStore.loading && expenseStore.expenses.length === 0"
      />

      <!-- 按日期分组 -->
      <div
        v-for="group in expenseStore.groupedByDate"
        v-else
        :key="group.date"
        class="expense-group"
      >
        <div class="expense-group__header">
          <div class="expense-group__date">
            <span class="date-main">{{ formatDate(group.date) }}</span>
            <span class="date-week">{{ weekDay(group.date) }}</span>
          </div>
          <span class="expense-group__subtotal">
            小计 ¥{{ group.dailyTotal.toFixed(2) }}
          </span>
        </div>
        <div class="expense-group__list">
          <ExpenseCard
            v-for="expense in group.items"
            :key="expense.id"
            :expense="expense"
            @click="goDetail"
          />
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.expense-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.expense-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.expense-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

/* 月度总计卡片 */
.monthly-total-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  background: linear-gradient(135deg, var(--color-secondary) 0%, #7DCFA8 100%);
  color: #fff;
  margin-bottom: var(--spacing-card);
}

.monthly-total-card :deep(.n-card__content) {
  padding: 20px 24px;
}

.monthly-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.monthly-total__label {
  font-size: var(--font-secondary);
  opacity: 0.9;
}

.monthly-total__amount {
  font-size: 28px;
  font-weight: 800;
}

/* 按日期分组 */
.expense-group {
  margin-bottom: 24px;
}

.expense-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.expense-group__date {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.date-main {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
}

.date-week {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.expense-group__subtotal {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.expense-group__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
