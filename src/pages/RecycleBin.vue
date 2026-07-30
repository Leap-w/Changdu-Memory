<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NSpin, NPopconfirm, useMessage } from 'naive-ui'
import {
  fetchDeletedDiaries, restoreDiary, permanentDeleteDiary,
} from '@/repositories/DiaryRepository'
import {
  fetchDeletedTodos, restoreTodo, permanentDeleteTodo,
} from '@/repositories/TodoRepository'
import {
  fetchDeletedExpenses, restoreExpense, permanentDeleteExpense,
} from '@/repositories/ExpenseRepository'
import {
  fetchDeletedWorks, restoreWork, permanentDeleteWork,
} from '@/repositories/WorkRepository'
import type { Diary } from '@/repositories/DiaryRepository'
import type { Todo } from '@/repositories/TodoRepository'
import type { Expense } from '@/repositories/ExpenseRepository'
import type { WorkPlan } from '@/repositories/WorkRepository'

const router = useRouter()
const message = useMessage()
const loading = ref(true)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trash = ref<{ type: string; icon: string; label: string; items: any[] }[]>([])

onMounted(async () => {
  const results = await Promise.allSettled([
    fetchDeletedDiaries(),
    fetchDeletedTodos(),
    fetchDeletedExpenses(),
    fetchDeletedWorks(),
  ])

  const [diaries, todos, expenses, works] = results.map((r) =>
    r.status === 'fulfilled' ? r.value : [],
  )

  const groups: { type: string; icon: string; label: string; items: unknown[] }[] = []
  if (diaries.length > 0) groups.push({ type: 'diary', icon: '📖', label: '日记', items: diaries as Diary[] })
  if (works.length > 0) groups.push({ type: 'work', icon: '📋', label: '工作', items: works as WorkPlan[] })
  if (todos.length > 0) groups.push({ type: 'todo', icon: '✅', label: '待办', items: todos as Todo[] })
  if (expenses.length > 0) groups.push({ type: 'expense', icon: '💰', label: '花费', items: expenses as Expense[] })
  trash.value = groups
  loading.value = false
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemDate(item: any, type: string): string {
  const map: Record<string, string> = {
    diary: 'diary_date', todo: 'todo_date', expense: 'expense_date', work: 'work_date',
  }
  return item[map[type] || 'created_at'] || ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemTitle(item: any): string {
  return item.title || '未命名'
}

const restoreHandlers: Record<string, (id: string) => Promise<void>> = {
  diary: restoreDiary, todo: restoreTodo, expense: restoreExpense, work: restoreWork,
}
const deleteHandlers: Record<string, (id: string) => Promise<void>> = {
  diary: (id) => permanentDeleteDiary(id),
  todo: (id) => permanentDeleteTodo(id),
  expense: (id) => permanentDeleteExpense(id),
  work: (id) => permanentDeleteWork(id),
}

async function handleRestore(type: string, id: string) {
  try { await restoreHandlers[type](id); message.success('已恢复'); removeFromList(type, id) }
  catch { message.error('恢复失败') }
}

async function handlePermanentDelete(type: string, id: string) {
  try { await deleteHandlers[type](id); message.success('已永久删除'); removeFromList(type, id) }
  catch { message.error('删除失败') }
}

function removeFromList(type: string, id: string) {
  for (const g of trash.value) {
    if (g.type === type) { g.items = g.items.filter((i) => i.id !== id); if (g.items.length === 0) trash.value = trash.value.filter((x) => x !== g); return }
  }
}
</script>

<template>
  <div class="recycle-page">
    <div class="recycle-page__head">
      <NButton text size="small" @click="router.back()">← 返回</NButton>
      <h1 class="recycle-page__title">回收站</h1>
    </div>

    <NSpin :show="loading">
      <div v-if="trash.length === 0 && !loading" class="recycle-page__empty">
        <div style="font-size: 48px; opacity: .3; margin-bottom: 12px;">🗑️</div>
        <p style="color: var(--color-text-tertiary);">回收站是空的</p>
      </div>

      <div v-for="g in trash" :key="g.type" class="recycle-group">
        <h2 class="recycle-group__title">{{ g.icon }} {{ g.label }}</h2>
        <NCard v-for="item in g.items" :key="item.id" class="recycle-item">
          <div class="recycle-item__info">
            <span class="recycle-item__title">{{ getItemTitle(item) }}</span>
            <span class="recycle-item__date">{{ getItemDate(item, g.type) }}</span>
          </div>
          <div class="recycle-item__actions">
            <NButton size="small" @click="handleRestore(g.type, item.id)">恢复</NButton>
            <NPopconfirm @positive-click="handlePermanentDelete(g.type, item.id)">
              <template #trigger><NButton size="small" type="error">永久删除</NButton></template>
              确定永久删除？此操作不可撤销。
            </NPopconfirm>
          </div>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.recycle-page { max-width: 720px; margin: 0 auto; padding: var(--spacing-page); padding-bottom: 80px; }
.recycle-page__head { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.recycle-page__title { font-size: var(--font-title); font-weight: 700; color: var(--color-text-primary); margin: 0; }
.recycle-page__empty { text-align: center; padding: 64px 20px; }
.recycle-group { margin-bottom: 24px; }
.recycle-group__title { font-size: 16px; font-weight: 600; color: var(--color-text-secondary); margin: 0 0 10px; }
.recycle-item { border-radius: var(--radius-card); box-shadow: var(--shadow-card); margin-bottom: 8px; }
.recycle-item :deep(.n-card__content) { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; }
.recycle-item__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.recycle-item__title { font-size: 15px; color: var(--color-text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recycle-item__date { font-size: 12px; color: var(--color-text-tertiary); }
.recycle-item__actions { display: flex; gap: 6px; flex-shrink: 0; }
</style>
