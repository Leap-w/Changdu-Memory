<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useTodoStore } from '@/stores/todo'
import { NCard, NGrid, NGi } from 'naive-ui'
import type { Diary } from '@/repositories/DiaryRepository'
import type { Todo } from '@/repositories/TodoRepository'

const router = useRouter()
const diaryStore = useDiaryStore()
const todoStore = useTodoStore()

const latestDiary = ref<Diary | null>(null)
const todayTodos = ref<Todo[]>([])

interface SummaryItem {
  label: string
  icon: string
  route: string
  value: string
  subtitle?: string
  clickable: boolean
}

onMounted(async () => {
  // 并行加载
  const [diary, todos] = await Promise.allSettled([
    diaryStore.getLatestDiary(),
    todoStore.loadTodayTodos(),
  ])

  if (diary.status === 'fulfilled') {
    latestDiary.value = diary.value
  }
  if (todos.status === 'fulfilled') {
    todayTodos.value = todos.value
  }
})

function getItems(): SummaryItem[] {
  const pendingCount = todayTodos.value.filter((t) => !t.completed).length
  const completedCount = todayTodos.value.filter((t) => t.completed).length

  // 待办
  const todoItem: SummaryItem = {
    label: '今日待办',
    icon: '✅',
    route: '/todo',
    value: todayTodos.value.length > 0 ? `${pendingCount}` : '—',
    subtitle: todayTodos.value.length > 0 ? `已完成 ${completedCount}` : undefined,
    clickable: true,
  }

  // 花费
  const expenseItem: SummaryItem = {
    label: '今日花费',
    icon: '💰',
    route: '/expense',
    value: '—',
    clickable: false,
  }

  // 最近日记
  const diaryItem: SummaryItem = latestDiary.value
    ? {
        label: '最近日记',
        icon: '📖',
        route: `/diary/${latestDiary.value.id}`,
        value:
          (latestDiary.value.title || '无标题').length > 8
            ? (latestDiary.value.title || '').slice(0, 8) + '…'
            : (latestDiary.value.title || '无标题'),
        subtitle: latestDiary.value.diary_date,
        clickable: true,
      }
    : {
        label: '最近日记',
        icon: '📖',
        route: '/diary',
        value: '—',
        clickable: false,
      }

  return [todoItem, expenseItem, diaryItem]
}

function handleClick(item: SummaryItem) {
  if (item.clickable && item.route) {
    router.push(item.route)
  }
}
</script>

<template>
  <NCard class="summary-card" title="今日概览">
    <NGrid :cols="3" :x-gap="12">
      <NGi
        v-for="item in getItems()"
        :key="item.label"
      >
        <div
          class="summary-item"
          :class="{ 'summary-item--clickable': item.clickable }"
          @click="handleClick(item)"
        >
          <span class="summary-item__icon">{{ item.icon }}</span>
          <span class="summary-item__label">{{ item.label }}</span>
          <span class="summary-item__value">{{ item.value }}</span>
          <span
            v-if="item.subtitle"
            class="summary-item__subtitle"
          >
            {{ item.subtitle }}
          </span>
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

.summary-item--clickable {
  cursor: pointer;
  border-radius: var(--radius-button);
  transition: background 0.2s ease;
}

.summary-item--clickable:hover {
  background: rgba(79, 142, 247, 0.06);
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
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.summary-item__subtitle {
  font-size: 10px;
  color: var(--color-text-secondary);
  opacity: 0.7;
}
</style>
