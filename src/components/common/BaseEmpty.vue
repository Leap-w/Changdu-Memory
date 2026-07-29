<script setup lang="ts">
interface Props {
  /** 空状态描述文字 */
  description?: string
  /** 图标类型 */
  icon?: 'empty' | 'search' | 'network'
}

withDefaults(defineProps<Props>(), {
  description: '暂无数据',
  icon: 'empty',
})
</script>

<template>
  <div class="base-empty">
    <div class="base-empty__icon">
      <span v-if="icon === 'search'">🔍</span>
      <span v-else-if="icon === 'network'">📡</span>
      <span v-else>📭</span>
    </div>
    <p class="base-empty__description">
      {{ description }}
    </p>
    <div v-if="$slots.extra" class="base-empty__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.base-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.base-empty__icon {
  font-size: 48px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.base-empty__description {
  font-size: var(--font-content);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-card);
}

.base-empty__extra {
  margin-top: 8px;
}
</style>
