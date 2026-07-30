<script setup lang="ts">
import type { Expense } from '@/repositories/ExpenseRepository'
import { AppCard } from '@/components/ui'

defineProps<{ expense: Expense }>()
const emit = defineEmits<{ click: [id: string] }>()

const labels: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '购物', accommodation: '住宿',
  study: '学习', entertainment: '娱乐', medical: '医疗',
  salary: '工资', subsidy: '补贴', bonus: '奖金', part_time: '兼职',
  other: '其他',
}

const icons: Record<string, string> = {
  food:'🍜', transport:'🚌', shopping:'🛒', accommodation:'🏠', study:'📚', entertainment:'🎮', medical:'💊',
  salary:'💰', subsidy:'🎁', bonus:'🏆', part_time:'💼',
  other:'📦',
}

function fmt(n: number) { return `¥${Number(n).toFixed(2)}` }
</script>

<template>
  <AppCard hoverable class="ec" @click="emit('click', expense.id)">
    <div class="ec__inner">
      <span class="ec__icon">{{ icons[expense.category] || '📦' }}</span>
      <div class="ec__body">
        <span class="ec__label">{{ labels[expense.category] || expense.category }}</span>
        <span v-if="expense.description" class="ec__desc">{{ expense.description }}</span>
      </div>
      <span class="ec__amt" :class="{ 'ec__amt--in': expense.type === 'income' }">
        {{ expense.type === 'income' ? '+' : '-' }}{{ fmt(expense.amount) }}
      </span>
    </div>
  </AppCard>
</template>

<style scoped>
.ec__inner { display:flex;align-items:center;gap:12px; }
.ec__icon { font-size:26px;flex-shrink:0; }
.ec__body { flex:1;min-width:0;display:flex;flex-direction:column;gap:2px; }
.ec__label { font-size:15px;color:var(--color-text-primary);font-weight:500; }
.ec__desc { font-size:12px;color:var(--color-text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.ec__amt { font-size:17px;font-weight:700;color:var(--color-text-primary);flex-shrink:0; }
.ec__amt--in { color:var(--color-secondary); }
</style>
