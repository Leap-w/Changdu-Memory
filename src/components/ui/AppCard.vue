<script setup lang="ts">
/**
 * AppCard — 统一卡片容器 (V5.2 标准)
 *
 * 默认样式：20px 圆角 + 24px 内边距 + 浅阴影 + 微边框
 * 替代各处重复的卡片样式。
 */

withDefaults(
  defineProps<{
    /** 是否使用 hover 动效 */
    hoverable?: boolean
    /** 内容内边距 (默认 24px) */
    padding?: string | number
    /** 自定义背景色 */
    background?: string
    /** 是否无内边距 */
    noPadding?: boolean
    /** 是否无边框 */
    borderless?: boolean
  }>(),
  {
    hoverable: false,
    padding: undefined,
    background: undefined,
    noPadding: false,
    borderless: false,
  },
)
</script>

<template>
  <div
    class="app-card"
    :class="{
      'app-card--hoverable': hoverable,
      'app-card--no-pad': noPadding,
      'app-card--borderless': borderless,
    }"
    :style="{
      padding: noPadding ? '0' : padding !== undefined ? `${padding}px` : undefined,
      background: background ?? undefined,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background: var(--color-bg-card);
  border-radius: 20px;
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
  padding: 24px;
  transition:
    box-shadow var(--transition-fast),
    transform var(--transition-fast),
    border-color var(--transition-fast);
}

.app-card--no-pad {
  padding: 0;
}

.app-card--borderless {
  border: none;
  box-shadow: none;
}

.app-card--hoverable {
  cursor: pointer;
}

.app-card--hoverable:hover {
  border-color: transparent;
  box-shadow: var(--shadow-card);
  transform: translateY(-1px);
}
</style>
