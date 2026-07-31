<script setup lang="ts">
import { ref } from 'vue'
import { NDatePicker, NTimePicker, useMessage } from 'naive-ui'

interface Props {
  title?: string; description?: string; todoDate?: string
  deadlineDate?: string | null; deadlineTime?: string | null
  loading?: boolean; submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '', description: '', todoDate: '', deadlineDate: null, deadlineTime: null,
  loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; description: string; todo_date: string; deadline_date?: string | null; deadline_time?: string | null }]
  cancel: []
}>()

const message = useMessage()

const localTitle = ref(props.title)
const localDesc = ref(props.description)
const localDate = ref<number | null>(props.todoDate ? new Date(props.todoDate + 'T00:00:00').getTime() : Date.now())
const localDeadlineDate = ref<number | null>(props.deadlineDate ? new Date(props.deadlineDate + 'T00:00:00').getTime() : null)
const localDeadlineTime = ref<number | null>(props.deadlineTime ? parseTimeToTs(props.deadlineTime) : null)

function parseTimeToTs(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return new Date(2024, 0, 1, h || 0, m || 0).getTime()
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handleSubmit() {
  if (!localTitle.value.trim()) { message.warning('请输入待办内容'); return }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    title: localTitle.value.trim(),
    description: localDesc.value.trim(),
    todo_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
    deadline_date: localDeadlineDate.value ? toDateStr(localDeadlineDate.value) : null,
    deadline_time: localDeadlineTime.value ? formatTime(localDeadlineTime.value) : null,
  })
}
</script>

<template>
  <div class="todo-editor">
    <div class="editor-field">
      <label class="editor-label">待办内容 <span class="required">*</span></label>
      <input v-model="localTitle" class="editor-input" placeholder="记录要做的事..." maxlength="100" />
    </div>
    <div class="editor-field">
      <label class="editor-label">备注（选填）</label>
      <textarea v-model="localDesc" class="editor-textarea" placeholder="补充说明..." rows="3" maxlength="500"></textarea>
    </div>
    <div class="editor-field">
      <label class="editor-label">日期</label>
      <NDatePicker v-model:value="localDate" type="date" size="large" style="width:100%" />
    </div>
    <div class="editor-row">
      <div class="editor-field editor-field--half">
        <label class="editor-label">截止日期（可选）</label>
        <NDatePicker v-model:value="localDeadlineDate" type="date" size="large" style="width:100%" />
      </div>
      <div class="editor-field editor-field--half">
        <label class="editor-label">截止时间（可选）</label>
        <NTimePicker v-model:value="localDeadlineTime" format="HH:mm" size="large" style="width:100%" />
      </div>
    </div>
    <div class="editor-actions">
      <button class="editor-btn editor-btn--cancel" @click="emit('cancel')">取消</button>
      <button class="editor-btn editor-btn--save" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中…' : submitLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.todo-editor {
  background: #fff;
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border-light);
}
.editor-field { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
.editor-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.required { color: var(--color-error); }
.editor-input {
  padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 15px; font-family: inherit; color: var(--color-text-primary); background: var(--color-bg);
  outline: none; transition: border-color .15s;
}
.editor-input:focus { border-color: var(--color-primary); background: #fff; }
.editor-textarea {
  padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: 14px; font-family: inherit; color: var(--color-text-primary); background: var(--color-bg);
  outline: none; resize: vertical; transition: border-color .15s;
}
.editor-textarea:focus { border-color: var(--color-primary); background: #fff; }
.editor-row { display: flex; gap: 16px; }
.editor-field--half { flex: 1; }
.editor-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px; border-top: 1px solid var(--color-border-light); }
.editor-btn {
  padding: 10px 28px; border: none; border-radius: var(--radius-button);
  font-size: 15px; font-family: inherit; cursor: pointer; transition: all .15s; font-weight: 600;
}
.editor-btn--cancel { background: var(--color-bg); color: var(--color-text-secondary); }
.editor-btn--cancel:hover { background: var(--color-border); }
.editor-btn--save { background: var(--color-primary); color: #fff; }
.editor-btn--save:hover { background: var(--color-primary-dark); }
.editor-btn--save:disabled { opacity: .6; cursor: not-allowed; }
</style>
