import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/auth'
import App from './App.vue'
import './styles/variables.css'
import './styles/global.css'

async function bootstrap() {
  const app = createApp(App)

  const pinia = createPinia()
  app.use(pinia)
  app.use(router)

  // 初始化认证状态（必须在 app mount 之前完成）
  const authStore = useAuthStore()
  await authStore.initialize()

  app.mount('#app')
}

bootstrap()
