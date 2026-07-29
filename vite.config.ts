import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    // PWA 暂时禁用 — SW 会缓存旧 JS 导致部署后仍加载旧代码
    // TODO: 等环境稳定后再重新启用
  ],
})
