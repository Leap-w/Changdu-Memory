<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExpenseStore } from '@/stores/expense'
import ExpenseEditor from '@/components/expense/ExpenseEditor.vue'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const expenseStore = useExpenseStore()
const message = useMessage()

const expenseId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!expenseId.value)
const loading = ref(false)

const existing = ref<{ amount: number; type: string; category: string; description: string; expense_date: string } | null>(null)

onMounted(async () => {
  if (expenseId.value) {
    loading.value = true
    try {
      const cached = expenseStore.expenses.find((e) => e.id === expenseId.value)
      if (cached) {
        existing.value = {
          amount: cached.amount, type: cached.type || 'expense', category: cached.category,
          description: cached.description || '', expense_date: cached.expense_date,
        }
      } else { message.warning('记录不存在'); router.push('/expense') }
    } catch { message.error('加载失败'); router.push('/expense') }
    finally { loading.value = false }
  }
})

async function handleSubmit(data: { amount: number; type: string; category: string; description: string; expense_date: string }) {
  try {
    if (isEdit.value && expenseId.value) {
      await expenseStore.editExpense(expenseId.value, data)
      message.success('已更新')
      router.push('/expense')
    } else {
      await expenseStore.addExpense(data)
      message.success('已记录')
      router.push('/expense')
    }
  } catch { message.error('保存失败') }
}
function handleCancel() { router.back() }
</script>

<template>
  <div class="eep">
    <h1 class="eep__title">{{ isEdit ? '编辑记录' : '记一笔' }}</h1>
    <NSpin :show="loading">
      <ExpenseEditor
        v-if="!loading"
        :amount="existing?.amount"
        :type="existing?.type"
        :category="existing?.category"
        :description="existing?.description"
        :expense-date="existing?.expense_date"
        :loading="expenseStore.loading"
        :submit-label="isEdit ? '保存' : '记录'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.eep { max-width:640px;margin:0 auto;padding:var(--spacing-page); }
.eep__title { font-size:var(--font-title);font-weight:700;color:var(--color-text-primary);margin:0 0 24px; }
</style>
