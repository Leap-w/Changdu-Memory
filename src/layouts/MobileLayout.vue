<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/todo', label: '待办', icon: '✅' },
  { path: '/work', label: '工作', icon: '📋' },
  { path: '/diary', label: '日记', icon: '📖' },
  { path: '/profile', label: '我的', icon: '👤' },
]

function navigateTo(path: string) {
  router.push(path)
}

function isActive(path: string): boolean {
  return route.path === path
}

function handleResize() {
  appStore.updateWindowWidth(window.innerWidth)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="mobile-layout">
    <main class="mobile-content">
      <router-view />
    </main>
    <nav class="bottom-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="navigateTo(item.path)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.mobile-content {
  flex: 1;
  padding-bottom: 80px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 72px;
  background: var(--color-bg-white);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 48px;
  min-height: 48px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-normal);
  font-family: inherit;
}

.nav-item.active {
  color: var(--color-primary);
}

.nav-icon {
  font-size: 14px;
}

.nav-label {
  font-size: var(--font-caption);
}
</style>
