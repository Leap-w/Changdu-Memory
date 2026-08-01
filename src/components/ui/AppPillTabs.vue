<script setup lang="ts">
/**
 * AppPillTabs — 胶囊切换组件 (V5.5.2)
 *
 * 用于「支出 | 补贴」等双态或多态切换。
 * 选中：白底 + 轻阴影；未选中：透明 + 次级色。
 * 支持 v-model 双向绑定当前选中项。
 *
 * 用法：
 *   <AppPillTabs v-model="activeTab" :options="[
 *     { value: 'expense', label: '生活支出' },
 *     { value: 'income', label: '生活补贴' },
 *   ]" />
 */

defineProps<{
  /** 选项卡列表 */
  options: { value: string; label: string }[]
  /** 当前选中值 */
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="pill-tabs">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="pill-tabs__item"
      :class="{ 'pill-tabs__item--active': modelValue === opt.value }"
      :aria-pressed="modelValue === opt.value"
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.pill-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-medium);
}

.pill-tabs__item {
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  white-space: nowrap;
  user-select: none;
}

.pill-tabs__item:hover:not(.pill-tabs__item--active) {
  color: var(--color-text-primary);
  background: rgba(0, 0, 0, 0.03);
}

.pill-tabs__item--active {
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-xs);
  font-weight: var(--font-weight-semibold);
}

.pill-tabs__item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
