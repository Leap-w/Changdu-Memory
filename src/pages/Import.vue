<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NTabs, NTabPane, NButton, NUpload, NSpace, useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
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
const jsonImporting = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const importHandlers: Record<string, (rows: any[]) => Promise<number>> = {
  diaries: async (rows) => {
    const r = rows as unknown as DiaryImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await diaryStore.addDiary({ title: row.title, content: row.content || '', diary_date: row.diary_date })
        count++
      } catch { /* skip */ }
    }
    return count
  },
  work_plans: async (rows) => {
    const r = rows as unknown as WorkImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await workStore.addWork({ title: row.title, content: row.content || '', work_date: row.work_date, period: row.period, category: row.category })
        count++
      } catch { /* skip */ }
    }
    return count
  },
  expenses: async (rows) => {
    const r = rows as unknown as ExpenseImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await expenseStore.addExpense({ amount: row.amount, category: row.category, description: row.description || '', expense_date: row.expense_date })
        count++
      } catch { /* skip */ }
    }
    return count
  },
  locations: async (rows) => {
    const r = rows as unknown as LocationImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await locationStore.addLocation({ name: row.name, location_type: row.location_type, description: row.description || '', address: row.address || '', visit_date: row.visit_date })
        count++
      } catch { /* skip */ }
    }
    return count
  },
  todos: async (rows) => {
    const r = rows as unknown as TodoImportRow[]
    let count = 0
    for (const row of r) {
      try {
        await todoStore.addTodo({ title: row.title, description: '', todo_date: row.todo_date, priority: row.priority, category: row.category })
        count++
      } catch { /* skip */ }
    }
    return count
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleImport(data: { moduleKey: string; validRows: any[] }) {
  importingModule.value = data.moduleKey
  try {
    const handler = importHandlers[data.moduleKey]
    if (!handler) { message.error('不支持的模块类型'); return }
    const count = await handler(data.validRows)
    message.success(`成功导入 ${count} 条数据`)
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '导入失败')
  } finally { importingModule.value = null }
}

/** JSON 备份恢复 */
async function handleJsonRestore(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  const rawFile = options.file.file
  if (!rawFile) return

  jsonImporting.value = true
  try {
    const text = await rawFile.text()
    const data = JSON.parse(text)

    let count = 0
    const modules: { key: string; items: unknown[]; handler: typeof importHandlers[string] }[] = [
      { key: 'diaries', items: data.diaries || [], handler: importHandlers.diaries },
      { key: 'todos', items: data.todos || [], handler: importHandlers.todos },
      { key: 'expenses', items: data.expenses || [], handler: importHandlers.expenses },
      { key: 'works', items: data.works || [], handler: importHandlers.work_plans },
      { key: 'locations', items: data.locations || [], handler: importHandlers.locations },
    ]

    for (const mod of modules) {
      if (mod.items.length > 0) {
        try { count += await mod.handler(mod.items) } catch { /* continue */ }
      }
    }

    message.success(`JSON 恢复完成，共导入 ${count} 条数据`)
  } catch {
    message.error('JSON 文件格式无效')
  } finally {
    jsonImporting.value = false
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
      支持 Excel 批量导入和 JSON 备份恢复。
    </p>

    <NTabs type="segment" animated>
      <!-- Tab 1: Excel 导入 -->
      <NTabPane name="excel" tab="📊 Excel 批量导入">
        <div class="import-tab-content">
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
        </div>
      </NTabPane>

      <!-- Tab 2: JSON 恢复 -->
      <NTabPane name="json" tab="🔄 JSON 备份恢复">
        <div class="import-tab-content">
          <div class="json-restore-hint">
            <p>
              选择之前导出的昌都记忆 JSON 备份文件，恢复全部数据。
            </p>
            <p class="hint-sub">
              支持恢复：日记、待办、花费、工作、地点。
              照片仅恢复 metadata（storage_path），不含图片文件。
            </p>
            <NUpload
              :max="1"
              accept=".json"
              :show-file-list="true"
              @change="handleJsonRestore"
            >
              <NButton :loading="jsonImporting" type="primary">
                选择 JSON 文件恢复
              </NButton>
            </NUpload>
          </div>
        </div>
      </NTabPane>
    </NTabs>

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

.import-page__header { margin-bottom: 8px; }

.import-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.import-page__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 20px;
}

.import-tab-content {
  padding-top: 16px;
}

.json-restore-hint {
  padding: 24px;
  text-align: center;
}

.json-restore-hint p {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.hint-sub {
  font-size: var(--font-caption) !important;
  color: var(--color-text-secondary) !important;
  margin-bottom: 20px !important;
}

.import-page__footer {
  margin-top: 8px;
  padding-top: var(--spacing-card);
}
</style>
