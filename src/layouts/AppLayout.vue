<script setup lang="ts">
/**
 * AppLayout — v5.1.4 统一应用外壳
 *
 * 包含：顶部悬浮胶囊导航 + 主内容区 + 移动端底部导航
 * PC（>=768px）：顶部导航含全部链接
 * Mobile（<768px）：顶部导航精简 + 底部五栏导航
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppAvatar from '@/components/ui/AppAvatar.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// ==========================================
// Navigation items
// ==========================================
interface NavItem {
  path: string
  label: string
  icon: string       // 图标名（选中/未选中共用同一图形，仅颜色变化）
}

const desktopNavItems: NavItem[] = [
  { path: '/',             label: '首页', icon: 'home' },
  { path: '/diary',        label: '日记', icon: 'book' },
  { path: '/work',         label: '工作', icon: 'briefcase' },
  { path: '/expense',      label: '账本', icon: 'wallet' },
  { path: '/time-center',  label: '时光', icon: 'clock' },
  { path: '/profile',      label: '我的', icon: 'people' },
]

/** 移动端底部导航：5项（无「时光」） */
const bottomNavItems: NavItem[] = [
  { path: '/',             label: '首页', icon: 'home' },
  { path: '/diary',        label: '日记', icon: 'book' },
  { path: '/work',         label: '工作', icon: 'briefcase' },
  { path: '/expense',      label: '账本', icon: 'wallet' },
  { path: '/profile',      label: '我的', icon: 'people' },
]

// ==========================================
// Route helpers
// ==========================================
function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigateTo(path: string) {
  if (isActive(path)) return
  router.push(path)
}

// ==========================================
// User info
// ==========================================
const userName = computed(() => authStore.displayName)
const userAvatar = computed(() => authStore.profile.avatar_url)

/** 桌面端导航项（响应式：仅 >=768px 显示） */
const isDesktop = computed(() => !appStore.isMobile)
</script>

<template>
  <div class="app-layout">
    <!-- ==========================================
         顶部悬浮胶囊导航
         ========================================== -->
    <header class="top-nav">
      <div class="top-nav__capsule">
        <!-- 左侧：品牌标识 -->
        <div
          class="top-nav__brand"
          role="link"
          tabindex="0"
          aria-label="回到首页"
          @click="navigateTo('/')"
        >
          <img
            class="top-nav__logo-circle"
            src="/icon-180.png"
            alt="昌都记忆"
          />
          <span class="top-nav__logo-text">昌都记忆</span>
        </div>

        <!-- 中间：桌面端导航链接 -->
        <nav v-if="isDesktop" class="top-nav__links" aria-label="主导航">
          <button
            v-for="item in desktopNavItems"
            :key="item.path"
            class="top-nav__link"
            :class="{ 'top-nav__link--active': isActive(item.path) }"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="navigateTo(item.path)"
          >
            {{ item.label }}
          </button>
        </nav>

        <!-- 右侧：用户信息 -->
        <div class="top-nav__user">
          <div v-if="isDesktop" class="top-nav__user-info">
            <span class="top-nav__user-name">{{ userName }}</span>
          </div>
          <AppAvatar
            :name="userName"
            :src="userAvatar || undefined"
            :size="36"
            :color="'linear-gradient(135deg, var(--color-primary), var(--color-sky))'"
            class="top-nav__avatar"
            @click="navigateTo('/profile')"
          />
        </div>
      </div>
    </header>

    <!-- ==========================================
         主内容区
         ========================================== -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- ==========================================
         移动端底部导航（仅 <768px 显示）
         ========================================== -->
    <nav v-if="!isDesktop" class="bottom-nav" aria-label="移动端导航">
      <button
        v-for="item in bottomNavItems"
        :key="item.path"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': isActive(item.path) }"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        :aria-label="item.label"
        @click="navigateTo(item.path)"
      >
        <BottomNavIcon :name="item.icon" />
        <span class="bottom-nav__label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<!-- ==========================================
     BottomNavIcon — 底部导航 SVG 图标
     同一导航项选中/未选中保持同一个图形，仅通过 color 变化区分
     ========================================== -->
<script lang="ts">
import { defineComponent, h } from 'vue'

/** 底部导航专用图标组件：根据 name 渲染对应 SVG（描边风格，无 filled 变体） */
export const BottomNavIcon = defineComponent({
  props: {
    name: { type: String, required: true },
  },
  setup(props) {
    return () => {
      const size = 24
      const common: Record<string, unknown> = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        class: 'bottom-nav__svg',
      }

      const outlined = (d: string[]) =>
        h('svg', common, d.map((p) => h('path', { d: p })))

      switch (props.name) {
        case 'home':
          return outlined([
            'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
            'M9 22V12h6v10',
          ])
        case 'book':
          return outlined([
            'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
            'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
          ])
        case 'briefcase':
          return outlined([
            'M2 7h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z',
            'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
          ])
        case 'wallet':
          return outlined([
            'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z',
          ])
        case 'people':
          // 单人像：避免双人图标在底部导航中呈图形重合感
          return outlined([
            'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
            'M20 21a8 8 0 0 0-16 0',
          ])
        case 'clock':
          return outlined([
            'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
            'M12 6v6l4 2',
          ])
        default:
          return outlined([
            'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
            'M12 6v6l4 2',
          ])
      }
    }
  },
})
</script>

<style scoped>
/* ==========================================
   AppLayout — 整体布局
   ========================================== */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

/* ==========================================
   顶部导航
   ========================================== */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav, 200);
  padding: 12px 16px;
  pointer-events: none; /* 允许点击穿透到下方，但胶囊内部恢复 */
}

@media (min-width: 768px) {
  .top-nav {
    padding: 12px 32px;
  }
}

.top-nav__capsule {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px;
  height: 48px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.75));
  backdrop-filter: blur(var(--nav-blur, 24px));
  -webkit-backdrop-filter: blur(var(--nav-blur, 24px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  pointer-events: auto;
}

/* ---- 品牌标识 ---- */
.top-nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.top-nav__logo-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: block;
  object-fit: cover;
  box-shadow: var(--shadow-xs);
  flex-shrink: 0;
}

.top-nav__logo-text {
  font-size: var(--font-content, 16px);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

/* ---- 桌面导航链接 ---- */
.top-nav__links {
  display: flex;
  align-items: center;
  gap: 2px;
}

.top-nav__link {
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-secondary, 14px);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.top-nav__link:hover {
  color: var(--color-text-primary);
  background: var(--color-primary-bg);
}

.top-nav__link--active {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-xs);
}

.top-nav__link--active:hover {
  background: var(--color-primary-dark);
  color: #fff;
}

.top-nav__link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ---- 用户信息 ---- */
.top-nav__user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.top-nav__user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.top-nav__user-name {
  font-size: var(--font-caption, 12px);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.top-nav__avatar {
  cursor: pointer;
  flex-shrink: 0;
}

/* ==========================================
   主内容区
   ========================================== */
.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  /* 顶部导航高度 + padding */
  padding: calc(48px + 24px + 12px) 16px 40px;

  /* 桌面端：移动端底部导航 padding 不生效 */
  @media (min-width: 768px) {
    padding: calc(48px + 24px + 12px) 32px 40px;
  }
}

/* 移动端：为底部导航留空间 */
@media (max-width: 767px) {
  .app-main {
    padding-bottom: calc(var(--bottom-nav-height, 72px) + 16px + env(safe-area-inset-bottom, 0px));
  }
}

/* ==========================================
   移动端底部导航
   ========================================== */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-nav, 200);
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--bottom-nav-height, 72px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--glass-bg, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid var(--color-border-light);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 48px;
  min-height: 48px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color var(--transition-fast);
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav__item--active {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

/* 触摸按压反馈：按下时高亮，松开自动结束 */
.bottom-nav__item:active {
  color: var(--color-text-secondary);
}

.bottom-nav__item--active:active {
  color: var(--color-primary);
}

/* 仅支持 hover 的设备（鼠标）才应用 hover，避免移动端点击后颜色残留 */
@media (hover: hover) {
  .bottom-nav__item:hover {
    color: var(--color-text-secondary);
  }

  .bottom-nav__item--active:hover {
    color: var(--color-primary);
  }
}

.bottom-nav__svg {
  flex-shrink: 0;
  display: block;
  transition: all var(--transition-fast);
}

.bottom-nav__label {
  font-size: 10px;
  font-weight: inherit;
}

.bottom-nav__item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  border-radius: var(--radius-sm);
}
</style>
