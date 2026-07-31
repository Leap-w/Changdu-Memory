<script setup lang="ts">
/**
 * AppCard — 统一卡片容器 (V5.4 毛玻璃风格)
 *
 * 默认样式：24px 圆角 + 毛玻璃背景 + 轻阴影 + 微边框
 * 支持 hover 上浮、多档内边距、class 透传。
 *
 * 用法：
 *   <AppCard hoverable padding="lg">内容</AppCard>
 *   <AppCard :hoverable="false" noPadding>无内边距内容</AppCard>
 */

const props = withDefaults(
  defineProps<{
    /** 是否使用 hover 上浮动效 */
    hoverable?: boolean
    /** 内边距档位: 'sm' | 'md' | 'lg' | 'xl'，默认 'lg'(24px) */
    padding?: 'sm' | 'md' | 'lg' | 'xl'
    /** 自定义背景色 */
    background?: string
    /** 是否无内边距 */
    noPadding?: boolean
    /** 是否无边框 */
    borderless?: boolean
    /** 是否禁用毛玻璃效果（使用纯白背景） */
    solid?: boolean
  }>(),
  {
    hoverable: false,
    padding: undefined,
    background: undefined,
    noPadding: false,
    borderless: false,
    solid: false,
  },
)

const paddingMap: Record<string, string> = {
  sm: 'var(--spacing-md)',
  md: 'var(--spacing-card)',
  lg: 'var(--spacing-page)',
  xl: 'var(--spacing-xl)',
}

function cardPadding(): string | undefined {
  if (props.noPadding) return '0'
  if (props.padding) return paddingMap[props.padding] || paddingMap.lg
  return undefined
}
</script>

<template>
  <div
    class="app-card"
    :class="{
      'app-card--hoverable': hoverable,
      'app-card--no-pad': noPadding,
      'app-card--borderless': borderless,
      'app-card--solid': solid,
    }"
    :style="{
      padding: cardPadding() ?? undefined,
      background: background ?? undefined,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background: var(--glass-bg-card, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-card, 24px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  box-shadow: var(--shadow-card);
  padding: var(--spacing-page, 24px);
  transition:
    box-shadow var(--transition-spring),
    transform var(--transition-spring),
    border-color var(--transition-spring);
}

.app-card--solid {
  background: var(--color-bg-white);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
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
  box-shadow: var(--shadow-hover);
  transform: translateY(-3px);
}
</style>
