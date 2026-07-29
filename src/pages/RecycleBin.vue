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
import {
  fetchDeletedLocations, restoreLocation, permanentDeleteLocation,
} from '@/repositories/LocationRepository'
import {
  fetchDeletedPhotos, restorePhoto, permanentDeletePhoto,
} from '@/repositories/PhotoRepository'
import type { Diary } from '@/repositories/DiaryRepository'
import type { Todo } from '@/repositories/TodoRepository'
import type { Expense } from '@/repositories/ExpenseRepository'
import type { WorkPlan } from '@/repositories/WorkRepository'
import type { Location } from '@/repositories/LocationRepository'
import type { PhotoRecord } from '@/repositories/PhotoRepository'

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
    fetchDeletedLocations(),
    fetchDeletedPhotos(),
  ])

  const [diaries, todos, expenses, works, locations, photos] = results.map((r) =>
    r.status === 'fulfilled' ? r.value : [],
  )

  const groups: { type: string; icon: string; label: string; items: unknown[] }[] = []
  if (diaries.length > 0) groups.push({ type: 'diary', icon: '📖', label: '日记', items: diaries as Diary[] })
  if (photos.length > 0) groups.push({ type: 'photo', icon: '📷', label: '照片', items: photos as PhotoRecord[] })
  if (works.length > 0) groups.push({ type: 'work', icon: '📋', label: '工作', items: works as WorkPlan[] })
  if (todos.length > 0) groups.push({ type: 'todo', icon: '✅', label: '待办', items: todos as Todo[] })
  if (expenses.length > 0) groups.push({ type: 'expense', icon: '💰', label: '花费', items: expenses as Expense[] })
  if (locations.length > 0) groups.push({ type: 'location', icon: '📍', label: '地点', items: locations as Location[] })
  trash.value = groups
  loading.value = false
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemDate(item: any, type: string): string {
  const map: Record<string, string> = {
    diary: 'diary_date', todo: 'todo_date', expense: 'expense_date',
    work: 'work_date', location: 'visit_date', photo: 'photo_date',
  }
  return item[map[type] || 'created_at'] || ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemTitle(item: any, type: string): string {
  if (type === 'location' || type === 'photo') return item.title || item.name || '未命名'
  return item.title || '未命名'
}

const restoreHandlers: Record<string, (id: string) => Promise<void>> = {
  diary: restoreDiary, todo: restoreTodo, expense: restoreExpense,
  work: restoreWork, location: restoreLocation, photo: restorePhoto,
}
const deleteHandlers: Record<string, (id: string, extra?: string) => Promise<void>> = {
  diary: (id) => permanentDeleteDiary(id),
  todo: (id) => permanentDeleteTodo(id),
  expense: (id) => permanentDeleteExpense(id),
  work: (id) => permanentDeleteWork(id),
  location: (id) => permanentDeleteLocation(id),
  photo: async (id) => {
    const item = trash.value.flatMap((g) => g.items).find((i) => i.id === id)
    await permanentDeletePhoto(id, item?.storage_path || '')
  },
}

async function handleRestore(type: string, id: string) {
  try {
    await restoreHandlers[type](id)
    message.success('已恢复')
    removeFromList(type, id)
  } catch { message.error('恢复失败') }
}

async function handlePermanentDelete(type: string, id: string) {
  try {
    await deleteHandlers[type](id)
    message.success('已永久删除')
    removeFromList(type, id)
  } catch { message.error('删除失败') }
}

function removeFromList(type: string, id: string) {
  const group = trash.value.find((g) => g.type === type)
  if (group) {
    group.items = group.items.filter((i) => i.id !== id)
    if (group.items.length === 0) {
      trash.value = trash.value.filter((g) => g.type !== type)
    }
  }
}
</script>

<template>
  <div class="recycle-page">
    <div class="recycle-page__header">
      <NButton text size="small" @click="router.push('/settings')">
        ← 返回设置
      </NButton>
    </div>

    <h1 class="recycle-page__title">
      🗑️ 回收站
    </h1>
    <p class="recycle-page__desc">
      已删除的数据会在这里保留。你可以恢复或永久删除。
    </p>

    <NSpin :show="loading">
      <div v-if="!loading && trash.length === 0" class="recycle-page__empty">
        回收站为空
      </div>

      <div
        v-for="group in trash"
        :key="group.type"
        class="trash-group"
      >
        <h2 class="trash-group__type">
          {{ group.icon }} {{ group.label }}
          <span class="trash-group__count">{{ group.items.length }} 条</span>
        </h2>

        <NCard
          v-for="item in group.items"
          :key="item.id"
          class="trash-item"
        >
          <div class="trash-item__info">
            <span class="trash-item__title">
              {{ getItemTitle(item, group.type) }}
            </span>
            <span class="trash-item__date">
              {{ getItemDate(item, group.type) }}
            </span>
          </div>
          <div class="trash-item__actions">
            <NButton
              size="tiny"
              type="primary"
              secondary
              @click="handleRestore(group.type, item.id)"
            >
              恢复
            </NButton>
            <NPopconfirm @positive-click="handlePermanentDelete(group.type, item.id)">
              <template #trigger>
                <NButton size="tiny" type="error" secondary>
                  永久删除
                </NButton>
              </template>
              确定永久删除？此操作不可逆。
            </NPopconfirm>
          </div>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.recycle-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}
.recycle-page__header { margin-bottom: 8px; }
.recycle-page__title { font-size: var(--font-title); font-weight: 700; margin: 0 0 8px; color: var(--color-text-primary); }
.recycle-page__desc { font-size: var(--font-secondary); color: var(--color-text-secondary); margin: 0 0 24px; }
.recycle-page__empty { text-align: center; padding: 48px; color: var(--color-text-secondary); font-size: var(--font-secondary); }

.trash-group { margin-bottom: 24px; }
.trash-group__type { font-size: var(--font-content); font-weight: 600; color: var(--color-text-primary); margin: 0 0 10px; }
.trash-group__count { font-size: var(--font-caption); font-weight: 400; color: var(--color-text-secondary); margin-left: 8px; }

.trash-item {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: 8px;
}
.trash-item :deep(.n-card__content) {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.trash-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.trash-item__title { font-size: var(--font-secondary); color: var(--color-text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trash-item__date { font-size: var(--font-caption); color: var(--color-text-secondary); }
.trash-item__actions { display: flex; gap: 6px; flex-shrink: 0; }
</style>
