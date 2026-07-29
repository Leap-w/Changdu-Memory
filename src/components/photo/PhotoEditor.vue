<script setup lang="ts">
import { ref } from 'vue'
import {
  NCard,
  NInput,
  NDatePicker,
  NSelect,
  NUpload,
  NButton,
  NSpace,
  NImage,
  useMessage,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { validateImageFile, compressImage } from '@/utils/image'
import { useLocationStore } from '@/stores/location'
import TagSelector from '@/components/tag/TagSelector.vue'

interface Props {
  title?: string
  description?: string
  photoDate?: string
  locationId?: string | null
  category?: string
  tagIds?: string[]
  loading?: boolean
  submitLabel?: string
  existingImageUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  photoDate: '',
  locationId: null,
  category: 'life',
  tagIds: () => [],
  loading: false,
  submitLabel: '上传',
  existingImageUrl: '',
})

const emit = defineEmits<{
  submit: [data: { file?: Blob; fileName?: string; title: string; description: string; photo_date: string; location_id: string | null; category: string; tag_ids: string[] }]
  cancel: []
}>()

const message = useMessage()
const locationStore = useLocationStore()

const localTitle = ref(props.title)
const localDesc = ref(props.description)
const localDate = ref<number | null>(
  props.photoDate ? new Date(props.photoDate + 'T00:00:00').getTime() : Date.now(),
)
const localCategory = ref(props.category)
const localLocationId = ref<string | null>(props.locationId)
const localTagIds = ref<string[]>([...props.tagIds])

const fileList = ref<UploadFileInfo[]>([])
const uploading = ref(false)

const categoryOptions = [
  { label: '🏫 学校', value: 'school' },
  { label: '🏠 生活', value: 'life' },
  { label: '🏔️ 旅行', value: 'travel' },
  { label: '👤 人物', value: 'people' },
  { label: '📦 其他', value: 'other' },
]

const locationOptions = computedLocationOptions()

function computedLocationOptions(): { label: string; value: string }[] {
  if (locationStore.locations.length === 0) {
    locationStore.loadLocations().catch(() => {})
  }
  return [
    { label: '不关联地点', value: '' },
    ...locationStore.locations.map((l) => ({
      label: `${l.name}`,
      value: l.id,
    })),
  ]
}

async function handleSubmit() {
  if (!localTitle.value.trim()) {
    message.warning('请输入标题')
    return
  }

  const isEdit = !!props.existingImageUrl
  if (!isEdit && fileList.value.length === 0) {
    message.warning('请选择照片')
    return
  }

  uploading.value = true
  const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]

  try {
    let file: Blob | undefined
    let fileName: string | undefined

    if (fileList.value.length > 0) {
      const rawFile = fileList.value[0].file
      if (rawFile) {
        const validationError = validateImageFile(rawFile)
        if (validationError) {
          message.warning(validationError)
          uploading.value = false
          return
        }
        file = await compressImage(rawFile)
        fileName = rawFile.name
      }
    }

    emit('submit', {
      file,
      fileName,
      title: localTitle.value.trim(),
      description: localDesc.value,
      photo_date: localDate.value ? toDateStr(localDate.value) : new Date().toISOString().split('T')[0],
      location_id: localLocationId.value || null,
      category: localCategory.value,
      tag_ids: [...localTagIds.value],
    })
  } catch {
    message.error('图片处理失败')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="photo-editor">
    <NCard>
      <div v-if="existingImageUrl" class="editor-field">
        <label class="editor-label">照片</label>
        <NImage
          :src="existingImageUrl"
          width="100%"
          style="border-radius: var(--radius-card); max-height: 400px; object-fit: contain"
        />
      </div>

      <div v-if="!existingImageUrl" class="editor-field">
        <label class="editor-label">选择照片</label>
        <NUpload
          v-model:file-list="fileList"
          :max="1"
          accept="image/jpeg,image/png,image/webp"
          list-type="image-card"
        >
          <NButton>选择文件</NButton>
        </NUpload>
      </div>

      <div class="editor-field">
        <label class="editor-label">标题</label>
        <NInput
          v-model:value="localTitle"
          placeholder="照片标题..."
          size="large"
          maxlength="100"
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
          <label class="editor-label">分类</label>
          <NSelect
            v-model:value="localCategory"
            :options="categoryOptions"
            size="large"
          />
        </div>
      </div>

      <div class="editor-field">
        <label class="editor-label">关联地点（选填）</label>
        <NSelect
          v-model:value="localLocationId"
          :options="locationOptions"
          size="large"
          placeholder="选择地点..."
          clearable
        />
      </div>

      <div class="editor-field">
        <label class="editor-label">标签（选填）</label>
        <TagSelector v-model="localTagIds" />
      </div>

      <div class="editor-field">
        <label class="editor-label">描述（选填）</label>
        <NInput
          v-model:value="localDesc"
          type="textarea"
          placeholder="描述这张照片..."
          :autosize="{ minRows: 3, maxRows: 8 }"
          maxlength="500"
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
            :loading="loading || uploading"
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
.photo-editor {
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
