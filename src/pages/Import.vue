<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NTabs, NTabPane, NButton, useMessage } from 'naive-ui'
import { useDiaryStore } from '@/stores/diary'
import { useWorkStore } from '@/stores/work'
import { useExpenseStore } from '@/stores/expense'
import { useTodoStore } from '@/stores/todo'
import { useStudentStore } from '@/stores/student'
import { useScheduleStore } from '@/stores/schedule'
import { useAssetStore } from '@/stores/asset'
import { useWelfareStore } from '@/stores/welfare'
import { useMemoryStore } from '@/stores/memory'
import { useMoodStore } from '@/stores/mood'
import ImportCard from '@/components/import/ImportCard.vue'

const router = useRouter()
const message = useMessage()

const diaryStore = useDiaryStore()
const workStore = useWorkStore()
const expenseStore = useExpenseStore()
const todoStore = useTodoStore()
const studentStore = useStudentStore()
const scheduleStore = useScheduleStore()
const assetStore = useAssetStore()
const welfareStore = useWelfareStore()
const memoryStore = useMemoryStore()
const moodStore = useMoodStore()

const importingModule = ref<string | null>(null)
const jsonImporting = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleImport(moduleKey: string, validRows: any[]) {
  importingModule.value = moduleKey
  try {
    let count = 0
    for (const row of validRows) {
      try {
        if (moduleKey === 'diaries') {
          await diaryStore.addDiary({ title: row.title || '', content: row.content || '', diary_date: row.diary_date || row.date || '' })
        } else if (moduleKey === 'work_plans') {
          await workStore.addWork({ title: row.title || '', content: row.content || '', work_date: row.work_date || row.date || '', period: row.period || 'morning', category: row.category || 'other' })
        } else if (moduleKey === 'expenses') {
          await expenseStore.addExpense({ amount: Number(row.amount) || 0, type: row.type || 'expense', category: row.category || 'other', description: row.description || '', expense_date: row.expense_date || row.date || '', expense_time: row.expense_time || null })
        } else if (moduleKey === 'todos') {
          await todoStore.addTodo({ title: row.title || '', description: row.description || '', todo_date: row.todo_date || row.date || '', priority: row.priority || 'medium', category: row.category || 'life' })
        } else if (moduleKey === 'students') {
          await studentStore.addStudent({ name: row.name, class_name: row.class_name || '', role: row.role || '', notes: row.notes || '' })
        } else if (moduleKey === 'schedules') {
          await scheduleStore.addSchedule({ course_name: row.course_name, class_name: row.class_name || '', day_of_week: row.day_of_week || 1, start_time: row.start_time || '08:00', end_time: row.end_time || '09:00', location: row.location || '', notes: row.notes || '' })
        } else if (moduleKey === 'assets') {
          await assetStore.addAsset({ name: row.name || '现金', amount: Number(row.amount) || 0 })
        } else if (moduleKey === 'welfare_items') {
          await welfareStore.addItem({ title: row.title || '', category: row.category || 'material', description: row.description || '', value_estimate: Number(row.value_estimate) || 0, received_date: row.received_date || row.date || '' })
        } else if (moduleKey === 'memories') {
          await memoryStore.addMemory({ title: row.title || '', content: row.content || '', event_date: row.event_date || row.date || '', category: row.category || 'life', location: row.location || '', image_urls: row.image_urls || [] })
        } else if (moduleKey === 'moods') {
          await moodStore.addRecord(row.label || '心情', row.emoji || '😊', row.note || '', row.mood_date)
        }
        count++
      } catch { /* skip */ }
    }
    message.success(`成功导入 ${count} 条记录`)
  } catch {
    message.error('导入失败')
  } finally {
    importingModule.value = null
  }
}

async function handleJsonRestore(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  jsonImporting.value = true
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    // 可恢复模块（与导出范围对齐）：日记/工作/花费/待办/学生/课程表/资产/福利/大事记/心情
    // 关联关系复杂或尚未建表的模块（地点+照片、标签关联、倒计时、旅程节点、心情自定义选项）暂不支持恢复
    const modules = [
      { key: 'diaries', store: diaryStore },
      { key: 'work_plans', store: workStore },
      { key: 'expenses', store: expenseStore },
      { key: 'todos', store: todoStore },
      { key: 'students', store: studentStore },
      { key: 'schedules', store: scheduleStore },
      { key: 'assets', store: assetStore },
      { key: 'welfare_items', store: welfareStore },
      { key: 'memories', store: memoryStore },
      { key: 'moods', store: moodStore },
    ]
    let total = 0
    for (const mod of modules) {
      if (data[mod.key] && Array.isArray(data[mod.key])) {
        await handleImport(mod.key, data[mod.key])
        total += data[mod.key].length
      }
    }
    message.success(`json 导入完成，共 ${total} 条`)
  } catch {
    message.error('JSON 格式错误')
  } finally {
    jsonImporting.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="import-page">
    <div class="import-page__head">
      <h1 class="import-page__title">
        数据导入
      </h1>
      <NButton text @click="router.push('/profile')">
        ← 返回
      </NButton>
    </div>

    <NTabs type="line" animated>
      <NTabPane name="excel" tab="Excel 导入">
        <div class="import-page__cards">
          <ImportCard
            module-key="diaries"
            module-label="日记"
            @import="(d: any) => handleImport(d.moduleKey, d.validRows)"
          />
          <ImportCard
            module-key="work_plans"
            module-label="工作"
            @import="(d: any) => handleImport(d.moduleKey, d.validRows)"
          />
          <ImportCard
            module-key="expenses"
            module-label="花费"
            @import="(d: any) => handleImport(d.moduleKey, d.validRows)"
          />
          <ImportCard
            module-key="todos"
            module-label="待办"
            @import="(d: any) => handleImport(d.moduleKey, d.validRows)"
          />
          <ImportCard
            module-key="students"
            module-label="学生档案"
            @import="(d: any) => handleImport(d.moduleKey, d.validRows)"
          />
          <ImportCard
            module-key="schedules"
            module-label="课程表"
            @import="(d: any) => handleImport(d.moduleKey, d.validRows)"
          />
        </div>
      </NTabPane>
      <NTabPane name="json" tab="JSON 恢复">
        <div style="text-align: center; padding: 32px;">
          <p style="color: var(--color-text-secondary); margin-bottom: 16px;">
            选择之前导出的 JSON 备份文件进行恢复
          </p>
          <label>
            <NButton :loading="jsonImporting">
              {{ jsonImporting ? '导入中…' : '选择 JSON 文件' }}
            </NButton>
            <input
              type="file"
              accept=".json"
              hidden
              @change="handleJsonRestore"
            />
          </label>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.import-page { max-width: 720px; margin: 0 auto; }
.import-page__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.import-page__title { font-size: var(--font-page-title, 32px); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); margin: 0; padding-bottom: 14px; border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.import-page__cards { display: flex; flex-direction: column; gap: 12px; }
</style>
