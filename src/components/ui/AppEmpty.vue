<script setup lang="ts">
/**
 * AppEmpty — 统一空状态组件
 *
 * 替代 6 个几乎完全相同的 *Empty 组件。
 *
 * 用法：
 *   <AppEmpty icon="📖" title="还没有日记" desc="写下你的第一篇日记" action-label="写日记" @action="goCreate" />
 */

withDefaults(
  defineProps<{
    /** 显示图标（emoji 或 AppIcon name） */
    icon?: string
    /** 主标题 */
    title?: string
    /** 描述文字 */
    desc?: string
    /** 操作按钮文字（不传则隐藏按钮） */
    actionLabel?: string
    /** 是否加载中 */
    loading?: boolean
  }>(),
  {
    icon: '📝',
    title: '暂无数据',
    desc: undefined,
    actionLabel: undefined,
    loading: false,
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="app-empty">
    <div v-if="icon" class="app-empty__icon">
      {{ icon }}
    </div>

    <h3 class="app-empty__title">
      {{ title }}
    </h3>

    <p v-if="desc" class="app-empty__desc">
      {{ desc }}
    </p>

    <button
      v-if="actionLabel"
      class="app-empty__action"
      :disabled="loading"
      @click="emit('action')"
    >
      {{ loading ? '加载中…' : actionLabel }}
    </button>

    <slot />
  </div>
</template>

<style scoped>
.app-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl, 64px) 24px;
  text-align: center;
}

.app-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.5;
  line-height: 1;
}

.app-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
  font-weight: var(--font-weight-semibold);
}

.app-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  max-width: 280px;
  line-height: var(--leading-relaxed);
}

.app-empty__action {
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-button);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.app-empty__action:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.app-empty__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
