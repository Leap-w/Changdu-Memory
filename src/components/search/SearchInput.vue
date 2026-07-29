<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput } from 'naive-ui'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localValue = ref(props.modelValue)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val
  },
)

function onInput(val: string) {
  localValue.value = val
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    emit('update:modelValue', val)
  }, 300)
}
</script>

<template>
  <NInput
    :value="localValue"
    type="text"
    placeholder="搜索关键词..."
    size="large"
    clearable
    round
    @input="onInput"
  >
    <template #prefix>
      🔍
    </template>
  </NInput>
</template>
