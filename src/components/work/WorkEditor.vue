<script setup lang="ts">
import { ref } from 'vue'
import { NDatePicker, NTimePicker, useMessage } from 'naive-ui'
import { tsToDateStr, formatLocalDate, timeStrToTs, tsToTimeStr } from '@/utils/date'

interface Props {
  title?: string | null; content?: string | null; workDate?: string
  startTime?: string | null; endTime?: string | null
  loading?: boolean; submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '', content: '', workDate: '',
  startTime: null, endTime: null,
  loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; content: string; work_date: string; start_time: string | null; end_time: string | null }]
  cancel: []
}>()

const message = useMessage()

const localTitle = ref(props.title ?? '')
const localContent = ref(props.content ?? '')
const localDate = ref<number | null>(
  props.workDate ? new Date(props.workDate + 'T00:00:00').getTime() : Date.now(),
)

// 开始/结束时间（选填）：NTimePicker 绑定时间戳，与 'HH:mm' 字符串桥接
const startTimeTs = ref<number | null>(props.startTime ? timeStrToTs(props.startTime) : null)
const endTimeTs = ref<number | null>(props.endTime ? timeStrToTs(props.endTime) : null)

function handleSubmit() {
  if (!localTitle.value.trim()) { message.warning('请输入标题'); return }
  emit('submit', {
    title: localTitle.value.trim(),
    content: localContent.value.trim(),
    work_date: localDate.value ? tsToDateStr(localDate.value) : formatLocalDate(),
    start_time: startTimeTs.value ? tsToTimeStr(startTimeTs.value) : null,
    end_time: endTimeTs.value ? tsToTimeStr(endTimeTs.value) : null,
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
      <label class="we__label">时间（选填）</label>
      <div class="we__time-row">
        <NTimePicker
          v-model:value="startTimeTs"
          format="HH:mm"
          placeholder="开始时间"
          size="large"
          clearable
          style="flex:1"
        />
        <span class="we__time-sep">—</span>
        <NTimePicker
          v-model:value="endTimeTs"
          format="HH:mm"
          placeholder="结束时间"
          size="large"
          clearable
          style="flex:1"
        />
      </div>
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

.we__time-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.we__time-sep {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
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
