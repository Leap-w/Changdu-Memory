<script setup lang="ts">
interface Props {
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** 按钮尺寸 */
  size?: 'small' | 'normal' | 'large'
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 是否块级按钮 */
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'normal',
  disabled: false,
  loading: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(event: MouseEvent) {
  emit('click', event)
}
</script>

<template>
  <button
    class="base-button"
    :class="[`variant-${variant}`, `size-${size}`, { block, loading }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="base-button__spinner" />
    <span class="base-button__content" :class="{ invisible: loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius-button);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  white-space: nowrap;
}

/* Sizes */
.base-button.size-small {
  padding: 6px 14px;
  font-size: var(--font-secondary);
}

.base-button.size-normal {
  padding: 10px 20px;
  font-size: var(--font-content);
}

.base-button.size-large {
  padding: 14px 28px;
  font-size: var(--font-content);
}

/* Variants */
.base-button.variant-primary {
  background: var(--color-primary);
  color: #fff;
}

.base-button.variant-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.base-button.variant-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
}

.base-button.variant-secondary:hover:not(:disabled) {
  background: rgba(79, 142, 247, 0.08);
}

.base-button.variant-danger {
  background: var(--color-error);
  color: #fff;
}

.base-button.variant-danger:hover:not(:disabled) {
  background: #dc2626;
}

.base-button.variant-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.base-button.variant-ghost:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-text-primary);
}

/* Block */
.base-button.block {
  display: flex;
  width: 100%;
}

/* Disabled */
.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading */
.base-button__spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.base-button.variant-secondary .base-button__spinner,
.base-button.variant-ghost .base-button__spinner {
  border-color: rgba(79, 142, 247, 0.2);
  border-top-color: var(--color-primary);
}

.base-button__content.invisible {
  visibility: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
