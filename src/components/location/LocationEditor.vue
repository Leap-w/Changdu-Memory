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
  name?: string
  locationType?: string
  description?: string
  address?: string
  visitDate?: string
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  locationType: 'school',
  description: '',
  address: '',
  visitDate: '',
  loading: false,
  submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { name: string; location_type: string; description: string; address: string; visit_date: string }]
  cancel: []
}>()

const message = useMessage()

const localName = ref(props.name)
const localType = ref(props.locationType)
const localDesc = ref(props.description)
const localAddress = ref(props.address)
const localDate = ref<number | null>(
  props.visitDate ? new Date(props.visitDate + 'T00:00:00').getTime() : Date.now(),
)

const typeOptions = [
  { label: '📚 支教学校', value: 'school' },
  { label: '🏙️ 城市生活', value: 'city' },
  { label: '🏔️ 旅行探索', value: 'travel' },
  { label: '🏠 日常生活', value: 'life' },
  { label: '📍 其他', value: 'other' },
]

function handleSubmit() {
  if (!localName.value.trim()) {
    message.warning('请输入地点名称')
    return
  }
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
  emit('submit', {
    name: localName.value.trim(),
    location_type: localType.value,
    description: localDesc.value,
    address: localAddress.value,
    visit_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
  })
}
</script>

<template>
  <div class="location-editor">
    <NCard>
      <div class="editor-field">
        <label class="editor-label">地点名称</label>
        <NInput
          v-model:value="localName"
          placeholder="地点名称..."
          size="large"
          maxlength="100"
        />
      </div>

      <div class="editor-row">
        <div class="editor-field editor-field--half">
          <label class="editor-label">类型</label>
          <NSelect
            v-model:value="localType"
            :options="typeOptions"
            size="large"
          />
        </div>
        <div class="editor-field editor-field--half">
          <label class="editor-label">到访日期</label>
          <NDatePicker
            v-model:value="localDate"
            type="date"
            size="large"
            style="width: 100%"
          />
        </div>
      </div>

      <div class="editor-field">
        <label class="editor-label">地址（选填）</label>
        <NInput
          v-model:value="localAddress"
          placeholder="详细地址..."
          size="large"
          maxlength="200"
        />
      </div>

      <div class="editor-field">
        <label class="editor-label">描述（选填）</label>
        <NInput
          v-model:value="localDesc"
          type="textarea"
          placeholder="在这里发生了什么..."
          :autosize="{ minRows: 3, maxRows: 10 }"
          maxlength="1000"
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
.location-editor {
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
