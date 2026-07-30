import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useAppStore } from './stores/app'
import App from './App.vue'
import './styles/variables.css'
import './styles/global.css'

async function bootstrap() {
  // 暗色模式：页面渲染前恢复，防止闪烁
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  const app = createApp(App)

  const pinia = createPinia()
  app.use(pinia)
  app.use(router)

  // 同步 Pinia theme 状态
  const appStore = useAppStore()
  appStore.setTheme(savedTheme === 'dark' ? 'dark' : 'light')

  // 初始化认证状态——带超时保护，确保 app 一定会挂载
  const authStore = useAuthStore()
  const authInit = authStore.initialize()
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 6000))

  try {
    await Promise.race([authInit, timeout])
  } catch {
    // auth 初始化失败或超时不影响 app 挂载
  }

  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('启动失败:', err)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML =
      '<div style="padding:40px;color:#BF616A;font-family:monospace;"><h2>启动失败</h2><pre>' +
      String(err) +
      '</pre></div>'
  }
})
