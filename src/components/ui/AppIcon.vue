<script setup lang="ts">
/**
 * AppIcon — 统一图标组件
 *
 * 消除项目中 50+ 处内联 SVG 的重复。
 * 常用图标只需通过 name 引用，新增图标在此文件追加即可。
 *
 * 用法：
 *   <AppIcon name="pen" size="20" />
 *   <AppIcon name="search" />
 */

const props = withDefaults(
  defineProps<{
    /** 图标名称 */
    name: string
    /** 尺寸（px） */
    size?: number | string
    /** 颜色 */
    color?: string
    /** 线条粗细 */
    strokeWidth?: number | string
  }>(),
  {
    size: 20,
    strokeWidth: 1.8,
    color: undefined,
  },
)

function iconSize(): string {
  if (typeof props.size === 'number') return `${props.size}px`
  if (typeof props.size === 'string') return props.size
  return '20px'
}
</script>

<template>
  <svg
    class="app-icon"
    :width="iconSize()"
    :height="iconSize()"
    :color="color ?? undefined"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color ? undefined : 'currentColor'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- pen / edit -->
    <template v-if="name === 'pen' || name === 'edit'">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </template>

    <!-- calendar -->
    <template v-else-if="name === 'calendar'">
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
      />
      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
      />
    </template>

    <!-- checklist / todo -->
    <template v-else-if="name === 'checklist' || name === 'todo'">
      <line
        x1="8"
        y1="6"
        x2="21"
        y2="6"
      />
      <line
        x1="8"
        y1="12"
        x2="21"
        y2="12"
      />
      <line
        x1="8"
        y1="18"
        x2="21"
        y2="18"
      />
      <circle cx="4" cy="12" r="1.5" />
      <polyline points="2 18 4 16 6 18" />
    </template>

    <!-- people / students -->
    <template v-else-if="name === 'people' || name === 'students'">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </template>

    <!-- dollar / money / expense -->
    <template v-else-if="name === 'dollar' || name === 'money' || name === 'expense'">
      <line
        x1="12"
        y1="1"
        x2="12"
        y2="23"
      />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </template>

    <!-- star -->
    <template v-else-if="name === 'star'">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </template>

    <!-- clock / time -->
    <template v-else-if="name === 'clock' || name === 'time'">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </template>

    <!-- photo / image -->
    <template v-else-if="name === 'photo' || name === 'image'">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        ry="2"
      />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </template>

    <!-- search -->
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="8" />
      <line
        x1="21"
        y1="21"
        x2="16.65"
        y2="16.65"
      />
    </template>

    <!-- chart / bar-chart -->
    <template v-else-if="name === 'chart' || name === 'bar-chart'">
      <line
        x1="18"
        y1="20"
        x2="18"
        y2="10"
      />
      <line
        x1="12"
        y1="20"
        x2="12"
        y2="4"
      />
      <line
        x1="6"
        y1="20"
        x2="6"
        y2="14"
      />
    </template>

    <!-- tag -->
    <template v-else-if="name === 'tag'">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line
        x1="7"
        y1="7"
        x2="7.01"
        y2="7"
      />
    </template>

    <!-- trash / delete -->
    <template v-else-if="name === 'trash' || name === 'delete'">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </template>

    <!-- moon / dark -->
    <template v-else-if="name === 'moon' || name === 'dark'">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </template>

    <!-- download -->
    <template v-else-if="name === 'download'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line
        x1="12"
        y1="15"
        x2="12"
        y2="3"
      />
    </template>

    <!-- upload -->
    <template v-else-if="name === 'upload'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="15"
      />
    </template>

    <!-- info -->
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="10" />
      <line
        x1="12"
        y1="16"
        x2="12"
        y2="12"
      />
      <line
        x1="12"
        y1="8"
        x2="12.01"
        y2="8"
      />
    </template>

    <!-- logout -->
    <template v-else-if="name === 'logout'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
      />
    </template>

    <!-- chevron-right / arrow -->
    <template v-else-if="name === 'chevron-right' || name === 'arrow-right' || name === 'arrow'">
      <polyline points="9 18 15 12 9 6" />
    </template>

    <!-- chevron-down / arrow-down -->
    <template v-else-if="name === 'chevron-down' || name === 'arrow-down'">
      <polyline points="6 9 12 15 18 9" />
    </template>

    <!-- plus / add -->
    <template v-else-if="name === 'plus' || name === 'add'">
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
      />
      <line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
      />
    </template>

    <!-- map / route -->
    <template v-else-if="name === 'map'">
      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
    </template>

    <!-- pin / location -->
    <template v-else-if="name === 'pin' || name === 'location'">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </template>

    <!-- book / diary -->
    <template v-else-if="name === 'book' || name === 'diary'">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </template>

    <!-- check-circle -->
    <template v-else-if="name === 'check' || name === 'check-circle'">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </template>

    <!-- close / x -->
    <template v-else-if="name === 'close' || name === 'x'">
      <line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
      />
      <line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
      />
    </template>

    <!-- briefcase / work -->
    <template v-else-if="name === 'briefcase' || name === 'work'">
      <rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="2"
        ry="2"
      />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </template>

    <!-- menu / hamburger -->
    <template v-else-if="name === 'menu'">
      <line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
      />
      <line
        x1="3"
        y1="12"
        x2="21"
        y2="12"
      />
      <line
        x1="3"
        y1="18"
        x2="21"
        y2="18"
      />
    </template>

    <!-- filter -->
    <template v-else-if="name === 'filter'">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </template>

    <!-- home -->
    <template v-else-if="name === 'home'">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </template>

    <!-- home-filled -->
    <template v-else-if="name === 'home-filled'">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" stroke="none" />
    </template>

    <!-- book-filled / diary-filled -->
    <template v-else-if="name === 'book-filled' || name === 'diary-filled'">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v-15H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="currentColor" stroke="none" />
      <path d="M20 2v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20z" fill="currentColor" stroke="none" />
    </template>

    <!-- work-filled / briefcase-filled -->
    <template v-else-if="name === 'work-filled' || name === 'briefcase-filled'">
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16h8z" fill="currentColor" stroke="none" />
      <rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="2"
        ry="2"
        fill="currentColor"
        stroke="none"
      />
    </template>

    <!-- expense-filled / wallet-filled -->
    <template v-else-if="name === 'expense-filled' || name === 'wallet-filled'">
      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor" stroke="none" />
    </template>

    <!-- people-filled / profile-filled -->
    <template v-else-if="name === 'people-filled' || name === 'profile-filled'">
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" fill="currentColor" stroke="none" />
      <path d="M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" fill="currentColor" stroke="none" />
    </template>

    <!-- wallet -->
    <template v-else-if="name === 'wallet'">
      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
    </template>

    <!-- smile / mood -->
    <template v-else-if="name === 'smile' || name === 'mood'">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line
        x1="9"
        y1="9"
        x2="9.01"
        y2="9"
      />
      <line
        x1="15"
        y1="9"
        x2="15.01"
        y2="9"
      />
    </template>

    <!-- camera -->
    <template v-else-if="name === 'camera'">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </template>

    <!-- gift -->
    <template v-else-if="name === 'gift'">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect
        x="2"
        y="7"
        width="20"
        height="5"
      />
      <line
        x1="12"
        y1="22"
        x2="12"
        y2="7"
      />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </template>

    <!-- grid / more -->
    <template v-else-if="name === 'grid' || name === 'more'">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
    </template>

    <!-- settings -->
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </template>

    <!-- heart -->
    <template v-else-if="name === 'heart'">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </template>

    <!-- lock -->
    <template v-else-if="name === 'lock'">
      <rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        ry="2"
      />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </template>

    <!-- mail -->
    <template v-else-if="name === 'mail'">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </template>

    <!-- 未知图标：显示圆圈占位 -->
    <template v-else>
      <circle cx="12" cy="12" r="10" />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
      />
      <line
        x1="12"
        y1="16"
        x2="12.01"
        y2="16"
      />
    </template>
  </svg>
</template>

<style scoped>
.app-icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
</style>
