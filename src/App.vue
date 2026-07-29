<script setup lang="ts">
import { NMessageProvider } from 'naive-ui'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
import MobileLayout from './layouts/MobileLayout.vue'
import DesktopLayout from './layouts/DesktopLayout.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
</script>

<template>
  <NMessageProvider>
    <!-- 登录页：不显示 App 外壳 -->
    <template v-if="!authStore.isLoggedIn">
      <router-view />
    </template>

    <!-- 已登录：显示响应式布局 -->
    <template v-else>
      <MobileLayout v-if="appStore.isMobile" />
      <DesktopLayout v-else />
    </template>
  </NMessageProvider>
</template>
