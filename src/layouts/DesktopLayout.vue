<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/time-center', label: '时光中心', icon: '⏰' },
  { path: '/todo', label: '待办', icon: '✅' },
  { path: '/work', label: '工作', icon: '📋' },
  { path: '/expense', label: '花费', icon: '💰' },
  { path: '/diary', label: '日记', icon: '📖' },
  { path: '/location', label: '地点', icon: '🗺️' },
  { path: '/photo', label: '照片', icon: '📷' },
  { path: '/profile', label: '我的', icon: '👤' },
  { path: '/settings', label: '设置', icon: '⚙️' },
]

function navigateTo(path: string) {
  router.push(path)
}

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
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
  <div class="desktop-layout">
    <aside class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 v-if="!appStore.sidebarCollapsed" class="sidebar-logo">
          昌都记忆
        </h1>
        <span v-else class="sidebar-logo-short">昌</span>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="sidebar-item"
          :class="{ active: isActive(item.path) }"
          :title="item.label"
          @click="navigateTo(item.path)"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span v-if="!appStore.sidebarCollapsed" class="sidebar-label">
            {{ item.label }}
          </span>
        </button>
      </nav>
      <button class="sidebar-toggle" @click="appStore.toggleSidebar()">
        {{ appStore.sidebarCollapsed ? '▶' : '◀' }}
      </button>
    </aside>
    <main class="desktop-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.desktop-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-white);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  transition: width var(--transition-normal);
  z-index: 100;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: var(--spacing-page);
  padding-bottom: var(--spacing-card);
}

.sidebar-logo {
  font-size: var(--font-card-title);
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-logo-short {
  font-size: var(--font-card-title);
  color: var(--color-primary);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: var(--radius-button);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-family: inherit;
  font-size: var(--font-content);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-item:hover {
  background: rgba(79, 142, 247, 0.08);
  color: var(--color-primary);
}

.sidebar-item.active {
  background: rgba(79, 142, 247, 0.12);
  color: var(--color-primary);
  font-weight: 600;
}

.sidebar-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.sidebar-label {
  overflow: hidden;
}

.sidebar-toggle {
  margin: 8px;
  padding: 12px;
  border: none;
  border-radius: var(--radius-button);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-content);
  transition: all var(--transition-normal);
}

.sidebar-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
}

.desktop-content {
  flex: 1;
  margin-left: 240px;
  padding: var(--spacing-page);
  transition: margin-left var(--transition-normal);
}

.sidebar.collapsed ~ .desktop-content {
  margin-left: 64px;
}
</style>
