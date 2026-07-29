<script setup lang="ts">
interface Props {
  /** 卡片标题 */
  title?: string
  /** 是否显示边框 */
  bordered?: boolean
  /** 内边距大小 */
  padding?: 'small' | 'normal' | 'large'
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  bordered: true,
  padding: 'normal',
})
</script>

<template>
  <div class="base-card" :class="[`padding-${padding}`, { bordered }]">
    <div v-if="title || $slots.header" class="base-card__header">
      <slot name="header">
        <h3 v-if="title" class="base-card__title">
          {{ title }}
        </h3>
      </slot>
    </div>
    <div class="base-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.base-card {
  background: var(--color-bg-white);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.base-card.bordered {
  box-shadow: var(--shadow-card);
}

.base-card.padding-small {
  padding: 12px;
}

.base-card.padding-normal {
  padding: var(--spacing-card);
}

.base-card.padding-large {
  padding: var(--spacing-page);
}

.base-card__header {
  margin-bottom: var(--spacing-card);
}

.base-card__title {
  font-size: var(--font-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}

.base-card__footer {
  margin-top: var(--spacing-card);
  padding-top: var(--spacing-card);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
