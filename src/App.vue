<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NMessageProvider } from 'naive-ui'
import AppLayout from './layouts/AppLayout.vue'

const route = useRoute()

/** 登录页和注册相关页面不显示 App 外壳 */
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

    <!-- 其他页面：统一 App 外壳（顶部导航 + 内容区 + 移动端底部导航） -->
    <template v-else>
      <AppLayout />
    </template>
  </NMessageProvider>
</template>
