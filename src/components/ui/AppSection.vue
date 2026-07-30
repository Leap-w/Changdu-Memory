<script setup lang="ts">
/**
 * AppSection — 统一内容区块组件
 *
 * 提供一致的标题 + 副标题 + 内容区域的布局。
 *
 * 用法：
 *   <AppSection title="今日概览" subtitle="7月30日">
 *     <SomeContent />
 *   </AppSection>
 */

withDefaults(
  defineProps<{
    /** 区块标题 */
    title?: string
    /** 副标题（可选） */
    subtitle?: string
    /** 是否可折叠 */
    collapsible?: boolean
    /** 默认折叠状态 */
    defaultCollapsed?: boolean
    /** 移除内边距 */
    noPadding?: boolean
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    collapsible: false,
    defaultCollapsed: false,
    noPadding: false,
  },
)

// TODO: collapsible 功能在需要时实现
</script>

<template>
  <section class="app-section" :class="{ 'app-section--no-pad': noPadding }">
    <div v-if="title || subtitle || $slots.header" class="app-section__header">
      <div class="app-section__titles">
        <h2 v-if="title" class="app-section__title">{{ title }}</h2>
        <span v-if="subtitle" class="app-section__subtitle">{{ subtitle }}</span>
      </div>
      <div v-if="$slots.header" class="app-section__header-slot">
        <slot name="header" />
      </div>
    </div>

    <div class="app-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.app-section {
  margin-bottom: var(--spacing-xl);
}

.app-section--no-pad {
  margin-bottom: 0;
}

.app-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

.app-section__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-section__title {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0;
  letter-spacing: 0.5px;
}

.app-section__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.app-section__header-slot {
  flex-shrink: 0;
}

.app-section__body {
  /* slot 内容自行决定布局 */
}
</style>
