<script setup lang="ts">
/**
 * AppFab — 悬浮操作按钮 (V5.5.1)
 *
 * 主色圆形或胶囊按钮，固定定位在右下角。
 * 移动端自动避开底部导航，桌面端可更低。
 *
 * 用法：
 *   <AppFab icon="plus" label="记录" @click="handleClick" />
 *   <AppFab icon="pen" />  <!-- 仅图标 -->
 */

import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    /** 图标名称（AppIcon name） */
    icon?: string
    /** 按钮文字（不传则仅圆形图标） */
    label?: string
    /** 自定义颜色 */
    color?: string
  }>(),
  {
    icon: 'plus',
    label: undefined,
    color: undefined,
  },
)

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="app-fab"
    :class="{ 'app-fab--has-label': !!label }"
    :style="{ background: color || 'var(--color-primary)' }"
    :aria-label="label || icon || '操作'"
    @click="emit('click')"
  >
    <AppIcon
      v-if="icon"
      :name="icon"
      size="20"
      color="#fff"
      :stroke-width="2.5"
    />
    <span v-if="label" class="app-fab__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.app-fab {
  position: fixed;
  right: 24px;
  bottom: 32px;
  z-index: var(--z-fab, 180);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: var(--radius-full);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(75, 143, 140, 0.35);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.app-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(75, 143, 140, 0.45);
}

.app-fab:active {
  transform: scale(0.95);
}

.app-fab--has-label {
  width: auto;
  height: 48px;
  padding: 0 20px;
  border-radius: var(--radius-full);
}

.app-fab__label {
  white-space: nowrap;
}

.app-fab:focus-visible {
  outline: 2px solid var(--color-primary-dark);
  outline-offset: 3px;
}

/* 移动端：为底部导航留空间 */
@media (max-width: 767px) {
  .app-fab {
    bottom: calc(var(--bottom-nav-height, 72px) + 16px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
