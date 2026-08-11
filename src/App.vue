<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, darkTheme, zhCN, dateZhCN } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import AppLayout from './layouts/AppLayout.vue'

const route = useRoute()

/** 跟随应用主题切换 Naive UI 明暗主题（深色模式下 Naive 组件同步变暗） */
const appStore = useAppStore()
const naiveTheme = computed(() =>
  appStore.theme === 'dark' ? darkTheme : null,
)

/** 登录页和注册相关页面不显示 App 外壳 */
const isFullPageRoute = computed(() => {
  return route.name === 'Login'
})
</script>

<template>
  <!-- 全局中文 locale + 明暗主题：让 NDatePicker / NTimePicker 等组件显示中文并跟随深色模式 -->
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme="naiveTheme">
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
  </NConfigProvider>
</template>
