<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NMessageProvider } from 'naive-ui'
import { useAppStore } from './stores/app'
import MobileLayout from './layouts/MobileLayout.vue'
import DesktopLayout from './layouts/DesktopLayout.vue'

const route = useRoute()
const appStore = useAppStore()

/** 登录页和注册相关页面不显示 App 外壳（侧边栏/底部导航） */
const isFullPageRoute = computed(() => {
  return route.name === 'Login'
})
</script>

<template>
  <NMessageProvider>
    <!-- 全屏页面（登录等）：不显示 App 外壳 -->
    <template v-if="isFullPageRoute">
      <router-view />
    </template>

    <!-- 其他页面：显示响应式布局 -->
    <template v-else>
      <MobileLayout v-if="appStore.isMobile" />
      <DesktopLayout v-else />
    </template>
  </NMessageProvider>
</template>
