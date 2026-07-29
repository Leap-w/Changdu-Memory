<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpace, useMessage } from 'naive-ui'
import { useDiaryStore } from '@/stores/diary'
import { useWorkStore } from '@/stores/work'
import { useExpenseStore } from '@/stores/expense'
import { useLocationStore } from '@/stores/location'
import { useTodoStore } from '@/stores/todo'
import ImportCard from '@/components/import/ImportCard.vue'
import type { DiaryImportRow, WorkImportRow, ExpenseImportRow, LocationImportRow, TodoImportRow } from '@/utils/import'

const router = useRouter()
const message = useMessage()

const diaryStore = useDiaryStore()
const workStore = useWorkStore()
const expenseStore = useExpenseStore()
const locationStore = useLocationStore()
const todoStore = useTodoStore()

const importingModule = ref<string | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importHandlers: Record<string, (rows: any[]) => Promise<number>> = {
  diaries: async (rows) => {
    const r = rows as unknown as DiaryImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await diaryStore.addDiary({
          title: row.title,
          content: row.content || '',
          diary_date: row.diary_date,
        })
        count++
      } catch {
        // continue
      }
    }
    return count
  },
  work_plans: async (rows) => {
    const r = rows as unknown as WorkImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await workStore.addWork({
          title: row.title,
          content: row.content || '',
          work_date: row.work_date,
          period: row.period,
          category: row.category,
        })
        count++
      } catch {
        // continue
      }
    }
    return count
  },
  expenses: async (rows) => {
    const r = rows as unknown as ExpenseImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await expenseStore.addExpense({
          amount: row.amount,
          category: row.category,
          description: row.description || '',
          expense_date: row.expense_date,
        })
        count++
      } catch {
        // continue
      }
    }
    return count
  },
  locations: async (rows) => {
    const r = rows as unknown as LocationImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await locationStore.addLocation({
          name: row.name,
          location_type: row.location_type,
          description: row.description || '',
          address: row.address || '',
          visit_date: row.visit_date,
        })
        count++
      } catch {
        // continue
      }
    }
    return count
  },
  todos: async (rows) => {
    const r = rows as unknown as TodoImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await todoStore.addTodo({
          title: row.title,
          description: '',
          todo_date: row.todo_date,
          priority: row.priority,
          category: row.category,
        })
        count++
      } catch {
        // continue
      }
    }
    return count
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleImport(data: { moduleKey: string; validRows: any[] }) {
  importingModule.value = data.moduleKey
  try {
    const handler = importHandlers[data.moduleKey]
    if (!handler) {
      message.error('不支持的模块类型')
      return
    }
    const count = await handler(data.validRows)
    message.success(`成功导入 ${count} 条数据`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '导入失败'
    message.error(msg)
  } finally {
    importingModule.value = null
  }
}
</script>

<template>
  <div class="import-page">
    <div class="import-page__header">
      <NButton text size="small" @click="router.push('/settings')">
        ← 返回设置
      </NButton>
    </div>

    <h1 class="import-page__title">
      数据导入
    </h1>
    <p class="import-page__desc">
      下载模板 → 填写数据 → 上传 Excel → 预览确认 → 批量导入。
    </p>

    <!-- 各模块导入卡片 -->
    <ImportCard
      module-key="diaries"
      module-label="📖 日记导入"
      :loading="importingModule === 'diaries'"
      @import="handleImport"
    />

    <ImportCard
      module-key="work_plans"
      module-label="📋 工作导入"
      :loading="importingModule === 'work_plans'"
      @import="handleImport"
    />

    <ImportCard
      module-key="expenses"
      module-label="💰 花费导入"
      :loading="importingModule === 'expenses'"
      @import="handleImport"
    />

    <ImportCard
      module-key="locations"
      module-label="📍 地点导入"
      :loading="importingModule === 'locations'"
      @import="handleImport"
    />

    <ImportCard
      module-key="todos"
      module-label="✅ 待办导入"
      :loading="importingModule === 'todos'"
      @import="handleImport"
    />

    <div class="import-page__footer">
      <NSpace justify="center">
        <NButton @click="router.push('/settings')">
          完成
        </NButton>
      </NSpace>
    </div>
  </div>
</template>

<style scoped>
.import-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.import-page__header {
  margin-bottom: 8px;
}

.import-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.import-page__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}

.import-page__footer {
  margin-top: 8px;
  padding-top: var(--spacing-card);
}
</style>
