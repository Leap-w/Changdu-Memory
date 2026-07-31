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
const localDate = ref<number | null>(
  props.workDate ? new Date(props.workDate + 'T00:00:00').getTime() : Date.now(),
)

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
  <div class="we">
    <div class="we__field">
      <label class="we__label">标题 <span class="we__required">*</span></label>
      <input
        v-model="localTitle"
        class="we__input"
        placeholder="安排事项..."
        maxlength="100"
      />
    </div>
    <div class="we__field">
      <label class="we__label">日期</label>
      <NDatePicker
        v-model:value="localDate"
        type="date"
        size="large"
        style="width:100%"
      />
    </div>
    <div class="we__field">
      <label class="we__label">详细内容（选填）</label>
      <textarea
        v-model="localContent"
        class="we__textarea"
        placeholder="记录更多细节..."
        rows="4"
        maxlength="2000"
      />
    </div>
    <div class="we__actions">
      <button class="we__btn we__btn--cancel" @click="emit('cancel')">
        取消
      </button>
      <button class="we__btn we__btn--save" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中…' : submitLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.we {
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-page);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border-light);
}

.we__field {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.we__label {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.we__required {
  color: var(--color-error);
}

.we__input {
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast);
}

.we__input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.we__textarea {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-secondary);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.we__textarea:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.we__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.we__btn {
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-content);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: var(--font-weight-semibold);
}

.we__btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.we__btn--cancel:hover {
  background: var(--color-border-light);
}

.we__btn--save {
  background: var(--color-primary);
  color: #fff;
}

.we__btn--save:hover {
  background: var(--color-primary-dark);
}

.we__btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
