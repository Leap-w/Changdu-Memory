<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard,
  NInputNumber,
  NInput,
  NDatePicker,
  NSelect,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'

interface Props {
  amount?: number
  category?: string
  description?: string
  expenseDate?: string
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  amount: 0,
  category: 'food',
  description: '',
  expenseDate: '',
  loading: false,
  submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { amount: number; category: string; description: string; expense_date: string }]
  cancel: []
}>()

const message = useMessage()

const localAmount = ref<number | null>(props.amount || null)
const localCategory = ref(props.category)
const localDesc = ref(props.description)
const localDate = ref<number | null>(
  props.expenseDate ? new Date(props.expenseDate + 'T00:00:00').getTime() : Date.now(),
)

const categoryOptions = [
  { label: '🍜 饮食', value: 'food' },
  { label: '🚌 交通', value: 'transport' },
  { label: '🛒 日用品', value: 'daily' },
  { label: '📚 学习', value: 'study' },
  { label: '💊 医疗', value: 'medical' },
  { label: '📦 其他', value: 'other' },
]

function handleSubmit() {
  if (!localAmount.value || localAmount.value <= 0) {
    message.warning('请输入金额')
    return
  }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    amount: localAmount.value,
    category: localCategory.value,
    description: localDesc.value,
    expense_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
  })
}
</script>

<template>
  <div class="expense-editor">
    <NCard>
      <div class="editor-field">
        <label class="editor-label">金额</label>
        <NInputNumber
          v-model:value="localAmount"
          :min="0.01"
          :step="1"
          :precision="2"
          placeholder="0.00"
          size="large"
          style="width: 100%"
        >
          <template #prefix>
            ¥
          </template>
        </NInputNumber>
      </div>

      <div class="editor-field">
        <label class="editor-label">分类</label>
        <NSelect
          v-model:value="localCategory"
          :options="categoryOptions"
          size="large"
        />
      </div>

      <div class="editor-field">
        <label class="editor-label">日期</label>
        <NDatePicker
          v-model:value="localDate"
          type="date"
          size="large"
          style="width: 100%"
        />
      </div>

      <div class="editor-field">
        <label class="editor-label">备注（选填）</label>
        <NInput
          v-model:value="localDesc"
          placeholder="消费了什么..."
          size="large"
          maxlength="100"
        />
      </div>

      <div class="editor-actions">
        <NSpace>
          <NButton size="large" @click="emit('cancel')">
            取消
          </NButton>
          <NButton
            type="primary"
            size="large"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ submitLabel }}
          </NButton>
        </NSpace>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.expense-editor {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.editor-field {
  margin-bottom: 20px;
}

.editor-label {
  display: block;
  font-size: var(--font-secondary);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.editor-actions {
  padding-top: var(--spacing-card);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
