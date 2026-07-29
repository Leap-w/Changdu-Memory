<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NInput, NDatePicker, NButton, NSpace, useMessage } from 'naive-ui'

interface Props {
  title?: string
  content?: string
  diaryDate?: string
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  content: '',
  diaryDate: '',
  loading: false,
  submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; content: string; diary_date: string }]
  cancel: []
}>()

const message = useMessage()

const localTitle = ref(props.title)
const localContent = ref(props.content)
const localDate = ref(
  props.diaryDate ? new Date(props.diaryDate).getTime() : Date.now(),
)

function handleSubmit() {
  if (!localTitle.value.trim()) {
    message.warning('请输入标题')
    return
  }
  if (!localDate.value) {
    message.warning('请选择日期')
    return
  }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    title: localTitle.value.trim(),
    content: localContent.value,
    diary_date: toDateStr(localDate.value),
  })
}
</script>

<template>
  <div class="diary-editor">
    <NCard>
      <div class="editor-field">
        <label class="editor-label">标题</label>
        <NInput
          v-model:value="localTitle"
          placeholder="写下日记标题..."
          size="large"
          maxlength="100"
          show-count
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
        <label class="editor-label">正文</label>
        <NInput
          v-model:value="localContent"
          type="textarea"
          placeholder="记录今天的点滴..."
          :autosize="{ minRows: 8, maxRows: 20 }"
          maxlength="10000"
          show-count
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
.diary-editor {
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
