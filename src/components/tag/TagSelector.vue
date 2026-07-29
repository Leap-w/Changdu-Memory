<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useTagStore } from '@/stores/tag'
import { NSelect, NTag, useMessage } from 'naive-ui'

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const tagStore = useTagStore()
const message = useMessage()

const selectedIds = ref<string[]>([...props.modelValue])

watch(
  () => props.modelValue,
  (val) => {
    selectedIds.value = [...val]
  },
)

onMounted(async () => {
  if (tagStore.tags.length === 0) {
    try {
      await tagStore.loadTags()
    } catch {
      // ignore
    }
  }
})

function handleUpdate(val: string[]) {
  // 过滤掉临时占位值
  selectedIds.value = val.filter((id) => id !== '__pending__')
  emit('update:modelValue', selectedIds.value)
}

/** NSelect 选项 */
function selectOptions() {
  return tagStore.sortedTags.map((t) => ({
    label: t.name,
    value: t.id,
  }))
}

/** 创建新标签（sync 返回以兼容 NSelect on-create 类型） */
function handleCreate(label: string) {
  const trimmed = label.trim()
  if (!trimmed) return { label: '', value: '' }

  // 异步创建，成功后替换临时 ID
  tagStore.addTag(trimmed).then((tag) => {
    message.success(`标签「${tag.name}」已创建`)
    // 替换临时 ID 为真实 ID
    const cleaned = selectedIds.value
      .filter((id) => id !== '__pending__')
      .concat(tag.id)
    handleUpdate(cleaned)
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : '创建失败'
    message.warning(msg)
    // 移除临时占位
    handleUpdate(selectedIds.value.filter((id) => id !== '__pending__'))
  })

  return { label: trimmed, value: '__pending__' }
}
</script>

<template>
  <div class="tag-selector">
    <NSelect
      :value="selectedIds"
      :options="selectOptions()"
      multiple
      tag
      filterable
      placeholder="选择标签..."
      size="large"
      :on-create="handleCreate as never"
      @update:value="handleUpdate"
    />

    <!-- 已选标签预览 -->
    <div v-if="selectedIds.length > 0" class="tag-selector__preview">
      <NTag
        v-for="tagId in selectedIds"
        :key="tagId"
        :bordered="false"
        :color="{
          color: tagStore.tags.find((t) => t.id === tagId)?.color || '#4F8EF7',
          textColor: '#fff',
        }"
        closable
        size="small"
        @close="handleUpdate(selectedIds.filter((id) => id !== tagId))"
      >
        {{ tagStore.tags.find((t) => t.id === tagId)?.name || tagId }}
      </NTag>
    </div>
  </div>
</template>

<style scoped>
.tag-selector__preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
</style>
