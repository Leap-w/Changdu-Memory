<script setup lang="ts">
/**
 * AppAvatar — 统一头像组件
 *
 * 支持文字首字母、图片头像、自定义颜色。
 * 尺寸：sm(32) / md(44) / lg(64)
 */
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 显示文字（取首字） */
    name?: string
    /** 图片 URL（优先级高于文字） */
    src?: string
    /** 尺寸 */
    size?: 'sm' | 'md' | 'lg' | number
    /** 自定义背景色 */
    color?: string
  }>(),
  {
    name: '?',
    src: undefined,
    size: 'md',
    color: undefined,
  },
)

const imgError = ref(false)

const sizeMap: Record<string, string> = {
  sm: 'var(--app-avatar-size-sm, 32px)',
  md: 'var(--app-avatar-size-md, 44px)',
  lg: 'var(--app-avatar-size-lg, 64px)',
}

function avatarSize(): string {
  if (typeof props.size === 'number') return `${props.size}px`
  return sizeMap[props.size as string] || sizeMap.md
}

function initial(): string {
  if (!props.name) return '?'
  // 取第一个非空字符
  const trimmed = props.name.trim()
  if (!trimmed) return '?'
  return trimmed[0].toUpperCase()
}

function onImgError() {
  imgError.value = true
}
</script>

<template>
  <div
    class="app-avatar"
    :class="{
      'app-avatar--img': !!src && !imgError,
    }"
    :style="{
      width: avatarSize(),
      height: avatarSize(),
      background: src && !imgError ? undefined : color || 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
    }"
  >
    <img v-if="src && !imgError" :src="src" class="app-avatar__img" :alt="name" @error="onImgError" />
    <span v-else class="app-avatar__text">{{ initial() }}</span>
  </div>
</template>

<style scoped>
.app-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-avatar, 50%);
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}

.app-avatar__text {
  font-weight: var(--font-weight-bold);
  line-height: 1;
  user-select: none;
}

/* 尺寸对应字号 */
.app-avatar[style*="32px"] .app-avatar__text { font-size: 13px; }
.app-avatar[style*="44px"] .app-avatar__text { font-size: 17px; }
.app-avatar[style*="64px"] .app-avatar__text { font-size: 26px; }

/* fallback for numeric sizes */
.app-avatar:not([style*="32px"]):not([style*="44px"]):not([style*="64px"]) .app-avatar__text {
  font-size: 15px;
}

.app-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
