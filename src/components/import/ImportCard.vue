<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NButton, NUpload, NSpace, useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { downloadTemplate, TEMPLATES } from '@/utils/templates'
import { parseAndValidate } from '@/utils/import'
import type { ImportPreview } from '@/utils/import'
import ImportPreviewTable from './ImportPreview.vue'

const props = defineProps<{
  moduleKey: string
  moduleLabel: string
}>()

const emit = defineEmits<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import: [data: { moduleKey: string; validRows: any[] }]
}>()

const message = useMessage()
const def = TEMPLATES[props.moduleKey]

const fileList = ref<UploadFileInfo[]>([])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const preview = ref<ImportPreview<any> | null>(null)
const parsing = ref(false)

function handleDownloadTemplate() {
  downloadTemplate(props.moduleKey)
  message.success('模板已下载')
}

async function handleFileChange(options: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  fileList.value = options.fileList
  const rawFile = options.file.file
  if (!rawFile) return

  parsing.value = true
  try {
    const result = await parseAndValidate(rawFile, props.moduleKey)
    preview.value = result
    if (result.errors.length > 0) {
      message.warning(`${result.errors.length} 行数据存在问题，请检查`)
    } else if (result.validRows.length > 0) {
      message.success(`解析成功，${result.validRows.length} 条数据待导入`)
    } else {
      message.warning('未解析到有效数据')
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '解析失败'
    message.error(msg)
    preview.value = null
  } finally {
    parsing.value = false
  }
}

function handleConfirmImport() {
  if (!preview.value || preview.value.validRows.length === 0) {
    message.warning('没有可导入的数据')
    return
  }
  emit('import', {
    moduleKey: props.moduleKey,
    validRows: preview.value.validRows,
  })
}

function handleClear() {
  fileList.value = []
  preview.value = null
}
</script>

<template>
  <NCard class="import-card" :title="moduleLabel">
    <!-- 模板下载 -->
    <div v-if="def" class="import-card__template">
      <span class="import-card__hint">
        下载模板，按格式填写数据后上传。
      </span>
      <NButton size="small" secondary @click="handleDownloadTemplate">
        下载模板
      </NButton>
    </div>

    <!-- 上传区 -->
    <div class="import-card__upload">
      <NUpload
        :file-list="fileList"
        :max="1"
        accept=".xlsx,.xls"
        :on-update:file-list="(list: UploadFileInfo[]) => { fileList = list }"
        @change="handleFileChange"
      >
        <NButton size="small">
          选择 Excel 文件
        </NButton>
      </NUpload>
    </div>

    <!-- 预览表 -->
    <div v-if="preview" class="import-card__preview">
      <ImportPreviewTable
        :headers="def?.headers ?? []"
        :row-keys="def?.rowKeys ?? []"
        :valid-rows="preview.validRows"
        :errors="preview.errors"
        :total-rows="preview.totalRows"
      />

      <!-- 操作按钮 -->
      <NSpace v-if="preview.validRows.length > 0" class="import-card__actions">
        <NButton size="small" @click="handleClear">
          取消
        </NButton>
        <NButton
          type="primary"
          size="small"
          :loading="parsing"
          @click="handleConfirmImport"
        >
          确认导入 ({{ preview.validRows.length }} 条)
        </NButton>
      </NSpace>
    </div>
  </NCard>
</template>

<style scoped>
.import-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-card);
}

.import-card__template {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.import-card__hint {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.import-card__upload {
  margin-bottom: 12px;
}

.import-card__preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.import-card__actions {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
