<script setup lang="ts">
import { ref } from 'vue'
import { NDatePicker, useMessage } from 'naive-ui'

interface Props {
  title?: string; content?: string; workDate?: string
  loading?: boolean; submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '', content: '', workDate: '', loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; content: string; work_date: string }]
  cancel: []
}>()

const message = useMessage()

const localTitle = ref(props.title)
const localContent = ref(props.content)
const localDate = ref<number | null>(props.workDate ? new Date(props.workDate + 'T00:00:00').getTime() : Date.now())

function handleSubmit() {
  if (!localTitle.value.trim()) { message.warning('请输入标题'); return }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    title: localTitle.value.trim(),
    content: localContent.value.trim(),
    work_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
  })
}
</script>

<template>
  <div class="work-editor">
    <div class="editor-field">
      <label class="editor-label">标题 <span class="required">*</span></label>
      <input v-model="localTitle" class="editor-input" placeholder="安排事项..." maxlength="100" />
    </div>
    <div class="editor-field">
      <label class="editor-label">日期</label>
      <NDatePicker v-model:value="localDate" type="date" size="large" style="width:100%" />
    </div>
    <div class="editor-field">
      <label class="editor-label">详细内容（选填）</label>
      <textarea v-model="localContent" class="editor-textarea" placeholder="记录更多细节..." rows="4" maxlength="2000"></textarea>
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
.work-editor {
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
.editor-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  padding-top: 8px; border-top: 1px solid var(--color-border-light);
}
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
