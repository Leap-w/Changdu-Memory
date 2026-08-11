<script setup lang="ts">
import type { Expense } from '@/repositories/ExpenseRepository'
import { AppCard, AppIcon } from '@/components/ui'
import { formatTimeHM } from '@/utils/date'

const props = defineProps<{ expense: Expense }>()
const emit = defineEmits<{ click: [id: string] }>()

const timeText = formatTimeHM(props.expense.expense_time)

const labels: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '零食', accommodation: '住宿',
  study: '学习', entertainment: '娱乐', medical: '医疗',
  salary: '工资', subsidy: '补贴', bonus: '奖金', part_time: '兼职',
  red_packet: '红包', second_hand: '出二手',
  other: '其他',
}

const categoryIcons: Record<string, string> = {
  food: 'check', transport: 'chevron-right', shopping: 'wallet', accommodation: 'home',
  study: 'book', entertainment: 'star', medical: 'heart',
  salary: 'wallet', subsidy: 'gift', bonus: 'star', part_time: 'briefcase',
  red_packet: 'red-envelope', second_hand: 'swap',
  other: 'grid',
}

const categoryBgColors: Record<string, string> = {
  food: 'rgba(208,135,112,0.12)', transport: 'rgba(111,168,220,0.12)',
  shopping: 'rgba(214,168,79,0.12)', accommodation: 'rgba(75,143,140,0.1)',
  study: 'rgba(107,158,133,0.12)', entertainment: 'rgba(194,103,106,0.1)',
  medical: 'rgba(232,176,76,0.12)',
  salary: 'rgba(107,158,133,0.12)', subsidy: 'rgba(75,143,140,0.1)',
  bonus: 'rgba(214,168,79,0.12)', part_time: 'rgba(111,168,220,0.12)',
  red_packet: 'rgba(194,103,106,0.1)', second_hand: 'rgba(208,135,112,0.12)',
  other: 'rgba(140,154,155,0.12)',
}

const categoryIconColors: Record<string, string> = {
  food: 'var(--color-accent-soft)', transport: 'var(--color-sky)',
  shopping: 'var(--color-gold)', accommodation: 'var(--color-primary)',
  study: 'var(--color-secondary)', entertainment: 'var(--color-accent)',
  medical: '#E8B04C',
  salary: 'var(--color-secondary)', subsidy: 'var(--color-primary)',
  bonus: 'var(--color-gold)', part_time: 'var(--color-sky)',
  red_packet: 'var(--color-accent)', second_hand: 'var(--color-accent-soft)',
  other: 'var(--color-text-tertiary)',
}

function fmt(n: number) {
  return `¥${Number(n).toFixed(2)}`
}
</script>

<template>
  <AppCard hoverable class="ec" @click="emit('click', expense.id)">
    <div class="ec__inner">
      <div
        class="ec__icon"
        :style="{
          background: categoryBgColors[expense.category] || categoryBgColors.other,
          color: categoryIconColors[expense.category] || categoryIconColors.other,
        }"
      >
        <AppIcon
          :name="categoryIcons[expense.category] || 'grid'"
          size="16"
        />
      </div>
      <div class="ec__body">
        <div class="ec__label-row">
          <span class="ec__label">{{ labels[expense.category] || expense.category }}</span>
          <span v-if="timeText" class="ec__time">{{ timeText }}</span>
        </div>
        <span v-if="expense.description" class="ec__desc">{{ expense.description }}</span>
      </div>
      <span class="ec__amt" :class="{ 'ec__amt--in': expense.type === 'income' }">
        {{ expense.type === 'income' ? '+' : '-' }}{{ fmt(expense.amount) }}
      </span>
    </div>
  </AppCard>
</template>

<style scoped>
.ec__inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ec__icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ec__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ec__label-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.ec__label {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.ec__time {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
}

.ec__desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ec__amt {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.ec__amt--in {
  color: var(--color-secondary);
}
</style>
