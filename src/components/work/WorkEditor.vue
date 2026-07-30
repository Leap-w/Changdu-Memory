<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NInput, NDatePicker, NSelect, NButton, NSpace, NTimePicker, useMessage } from 'naive-ui'

interface Props {
  title?: string; content?: string; workDate?: string; period?: string; category?: string
  startTime?: string; endTime?: string; loading?: boolean; submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '', content: '', workDate: '', period: 'morning', category: 'other',
  startTime: '', endTime: '', loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; content: string; work_date: string; period: string; category: string; start_time?: string; end_time?: string }]
  cancel: []
}>()

const message = useMessage()

const localTitle = ref(props.title)
const localContent = ref(props.content)
const localDate = ref<number | null>(props.workDate ? new Date(props.workDate + 'T00:00:00').getTime() : Date.now())
const localPeriod = ref(props.period)
const localCategory = ref(props.category)
const localStartTime = ref<number | null>(props.startTime ? parseTime(props.startTime) : null)
const localEndTime = ref<number | null>(props.endTime ? parseTime(props.endTime) : null)

function parseTime(t: string): number { const [h, m] = t.split(':'); return new Date(2024, 0, 1, +h || 0, +m || 0).getTime() }
function formatTime(ts: number): string { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

const periodOptions = [
  { label: '☀️ 上午', value: 'morning' }, { label: '🌤️ 下午', value: 'afternoon' }, { label: '🌙 晚上', value: 'evening' },
]
const categoryOptions = [
  { label: '💬 会议', value: 'meeting' }, { label: '📝 监考', value: 'exam_supervision' },
  { label: '📚 培训', value: 'training' }, { label: '🎉 活动', value: 'activity' }, { label: '📦 其他', value: 'other' },
]

function handleSubmit() {
  if (!localTitle.value.trim()) { message.warning('请输入工作内容'); return }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    title: localTitle.value.trim(), content: localContent.value,
    work_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
    period: localPeriod.value, category: localCategory.value,
    start_time: localStartTime.value ? formatTime(localStartTime.value) : undefined,
    end_time: localEndTime.value ? formatTime(localEndTime.value) : undefined,
  })
}
</script>

<template>
  <div class="work-editor">
    <NCard>
      <div class="editor-field"><label class="editor-label">工作内容</label><NInput v-model:value="localTitle" placeholder="记录工作内容..." size="large" maxlength="100" /></div>
      <div class="editor-row">
        <div class="editor-field editor-field--half"><label class="editor-label">日期</label><NDatePicker v-model:value="localDate" type="date" size="large" style="width:100%" /></div>
        <div class="editor-field editor-field--half"><label class="editor-label">时间段</label><NSelect v-model:value="localPeriod" :options="periodOptions" size="large" /></div>
      </div>
      <div class="editor-row">
        <div class="editor-field editor-field--half"><label class="editor-label">开始时间（可选）</label><NTimePicker v-model:value="localStartTime" format="HH:mm" size="large" style="width:100%" /></div>
        <div class="editor-field editor-field--half"><label class="editor-label">结束时间（可选）</label><NTimePicker v-model:value="localEndTime" format="HH:mm" size="large" style="width:100%" /></div>
      </div>
      <div class="editor-field"><label class="editor-label">分类</label><NSelect v-model:value="localCategory" :options="categoryOptions" size="large" /></div>
      <div class="editor-field"><label class="editor-label">详细记录（选填）</label><NInput v-model:value="localContent" type="textarea" placeholder="记录更多细节..." :autosize="{ minRows: 4, maxRows: 12 }" maxlength="2000" /></div>
      <div class="editor-actions"><NSpace><NButton size="large" @click="emit('cancel')">取消</NButton><NButton type="primary" size="large" :loading="loading" @click="handleSubmit">{{ submitLabel }}</NButton></NSpace></div>
    </NCard>
  </div>
</template>

<style scoped>
.work-editor { border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
.editor-field { margin-bottom: 20px; }
.editor-label { display: block; font-size: var(--font-secondary); font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.editor-row { display: flex; gap: 16px; }
.editor-field--half { flex: 1; }
.editor-actions { padding-top: var(--spacing-card); border-top: 1px solid rgba(0,0,0,.06); }
</style>
