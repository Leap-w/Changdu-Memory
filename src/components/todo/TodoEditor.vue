<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard,
  NInput,
  NDatePicker,
  NSelect,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui'

interface Props {
  title?: string
  description?: string
  todoDate?: string
  priority?: string
  category?: string
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  todoDate: '',
  priority: 'medium',
  category: 'teaching',
  loading: false,
  submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; description: string; todo_date: string; priority: string; category: string }]
  cancel: []
}>()

const message = useMessage()

const localTitle = ref(props.title)
const localDesc = ref(props.description)
const localDate = ref<number | null>(
  props.todoDate ? new Date(props.todoDate + 'T00:00:00').getTime() : Date.now(),
)
const localPriority = ref(props.priority)
const localCategory = ref(props.category)

const priorityOptions = [
  { label: '🔴 高优先级', value: 'high' },
  { label: '🟡 中优先级', value: 'medium' },
  { label: '🟢 低优先级', value: 'low' },
]

const categoryOptions = [
  { label: '📚 教学', value: 'teaching' },
  { label: '🏠 生活', value: 'life' },
  { label: '🌱 成长', value: 'growth' },
]

function handleSubmit() {
  if (!localTitle.value.trim()) {
    message.warning('请输入待办内容')
    return
  }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    title: localTitle.value.trim(),
    description: localDesc.value,
    todo_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
    priority: localPriority.value,
    category: localCategory.value,
  })
}
</script>

<template>
  <div class="todo-editor">
    <NCard>
      <div class="editor-field">
        <label class="editor-label">待办内容</label>
        <NInput
          v-model:value="localTitle"
          placeholder="记录要做的事..."
          size="large"
          maxlength="100"
        />
      </div>

      <div class="editor-field">
        <label class="editor-label">备注（选填）</label>
        <NInput
          v-model:value="localDesc"
          type="textarea"
          placeholder="补充说明..."
          :autosize="{ minRows: 3, maxRows: 8 }"
          maxlength="500"
        />
      </div>

      <div class="editor-row">
        <div class="editor-field editor-field--half">
          <label class="editor-label">日期</label>
          <NDatePicker
            v-model:value="localDate"
            type="date"
            size="large"
            style="width: 100%"
          />
        </div>
        <div class="editor-field editor-field--half">
          <label class="editor-label">优先级</label>
          <NSelect
            v-model:value="localPriority"
            :options="priorityOptions"
            size="large"
          />
        </div>
      </div>

      <div class="editor-field">
        <label class="editor-label">分类</label>
        <NSelect
          v-model:value="localCategory"
          :options="categoryOptions"
          size="large"
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
.todo-editor {
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

.editor-row {
  display: flex;
  gap: 16px;
}

.editor-field--half {
  flex: 1;
}

.editor-actions {
  padding-top: var(--spacing-card);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
