import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const windowWidth = ref(window.innerWidth)
  const sidebarCollapsed = ref(false)
  const theme = ref<'light' | 'dark'>('light')

  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(
    () => windowWidth.value >= 768 && windowWidth.value < 1200,
  )
  const isDesktop = computed(() => windowWidth.value >= 1200)

  function updateWindowWidth(width: number) {
    windowWidth.value = width
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
  }

  return {
    windowWidth,
    sidebarCollapsed,
    theme,
    isMobile,
    isTablet,
    isDesktop,
    updateWindowWidth,
    toggleSidebar,
    setTheme,
  }
})
