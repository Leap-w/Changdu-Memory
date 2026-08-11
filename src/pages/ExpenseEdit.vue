<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExpenseStore } from '@/stores/expense'
import ExpenseEditor from '@/components/expense/ExpenseEditor.vue'
import { NSpin, useMessage } from 'naive-ui'
import { AppIcon } from '@/components/ui'

const router = useRouter()
const route = useRoute()
const expenseStore = useExpenseStore()
const message = useMessage()

const expenseId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!expenseId.value)
// 编辑页直接以加载态开始，避免先用空表单渲染一帧再被 NSpin 盖住
const loading = ref(isEdit.value)

const existing = ref<{
  amount: number; type: string; category: string; description: string; expense_date: string; expense_time: string | null
} | null>(null)

/** 新建时默认类型：优先取路由 query（从收入 Tab 进入则默认收入），否则支出 */
const formType = computed(() => {
  if (existing.value) return existing.value.type || 'expense'
  return route.query.type === 'income' ? 'income' : 'expense'
})

/** 记录类型对应的账本 Tab（返回时定位用） */
function tabForType(t: string | undefined | null): string {
  return t === 'income' ? 'income' : 'expense'
}

/** 返回账本页并定位到对应 Tab（支出/收入） */
function goBackToLedger(type: string | undefined | null) {
  router.push({ path: '/expense', query: { type: tabForType(type) } })
}

onMounted(async () => {
  if (expenseId.value) {
    loading.value = true
    try {
      // 优先用 store 缓存；未命中则直接从数据库拉取（编辑页刷新 / 直达也能正常编辑）
      const cached = await expenseStore.getExpenseById(expenseId.value)
      if (cached) {
        existing.value = {
          amount: cached.amount, type: cached.type || 'expense', category: cached.category,
          description: cached.description || '', expense_date: cached.expense_date,
          expense_time: cached.expense_time ?? null,
        }
      } else { message.warning('记录不存在'); goBackToLedger(route.query.type as string | undefined) }
    } catch { message.error('加载失败'); goBackToLedger(route.query.type as string | undefined) }
    finally { loading.value = false }
  }
})

async function handleSubmit(data: {
  amount: number; type: string; category: string; description: string; expense_date: string; expense_time: string | null
}) {
  try {
    if (isEdit.value && expenseId.value) {
      await expenseStore.editExpense(expenseId.value, data)
      message.success('已更新')
    } else {
      await expenseStore.addExpense(data)
      message.success('已记录')
    }
    goBackToLedger(data.type)
  } catch { message.error('保存失败') }
}

function handleCancel() {
  goBackToLedger((route.query.type as string | undefined) ?? existing.value?.type)
}

/** 删除（编辑页底部危险操作） */
async function handleDelete() {
  if (!expenseId.value) return
  if (!confirm('确定删除这条记录？删除后可到回收站恢复。')) return
  try {
    await expenseStore.removeExpense(expenseId.value)
    message.success('已删除')
    goBackToLedger(existing.value?.type)
  } catch { message.error('删除失败') }
}
</script>

<template>
  <div class="eep">
    <h1 class="eep__title">
      {{ isEdit ? '编辑记录' : '记一笔' }}
    </h1>
    <NSpin :show="loading">
      <ExpenseEditor
        v-if="!loading"
        :amount="existing?.amount"
        :type="formType"
        :category="existing?.category"
        :description="existing?.description"
        :expense-date="existing?.expense_date"
        :expense-time="existing?.expense_time"
        :is-edit="isEdit"
        :loading="expenseStore.loading"
        :submit-label="isEdit ? '保存' : '记录'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>

    <!-- 危险操作区：删除仅在编辑模式显示，与保存操作明确区分 -->
    <div v-if="isEdit" class="eep__danger">
      <button class="eep__delete" @click="handleDelete">
        <AppIcon name="trash" size="14" /> 删除这条记录
      </button>
    </div>
  </div>
</template>

<style scoped>
.eep {
  max-width: 640px;
  margin: 0 auto;
}

.eep__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0 0 28px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* ---- 危险操作区（删除） ---- */
.eep__danger {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

.eep__delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 28px;
  border: 1px solid rgba(194, 103, 106, 0.35);
  border-radius: var(--radius-button);
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.eep__delete:hover {
  background: var(--color-error);
  border-color: var(--color-error);
  color: #fff;
}
</style>
