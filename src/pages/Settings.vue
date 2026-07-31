<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { NCard, NButton, NDivider, NSpin, useMessage } from 'naive-ui'
import { exportAllData, downloadJson } from '@/utils/export'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

const exporting = ref(false)

async function handleExport() {
  exporting.value = true
  try {
    const data = await exportAllData()
    downloadJson(data)
    message.success('数据导出成功')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '导出失败'
    message.error(msg)
  } finally {
    exporting.value = false
  }
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch {
    message.error('退出失败')
  }
}

function goTagManage() {
  router.push('/settings/tags')
}

function goImport() {
  router.push('/import')
}

function goStatistics() {
  router.push('/statistics')
}

function goSearch() {
  router.push('/search')
}

function goRecycleBin() {
  router.push('/settings/recycle-bin')
}
</script>

<template>
  <div class="page-settings">
    <h1 class="page-settings__title">
      设置
    </h1>

    <NSpin :show="exporting">
      <!-- 数据管理 -->
      <NCard class="settings-card" title="数据管理">
        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">导出数据</span>
            <span class="settings-item__desc">
              导出全部个人数据到 JSON 文件。照片仅导出 metadata（不含图片文件）。
            </span>
          </div>
          <NButton
            type="primary"
            :loading="exporting"
            @click="handleExport"
          >
            导出 JSON
          </NButton>
        </div>

        <NDivider />

        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">数据导入</span>
            <span class="settings-item__desc">
              通过 Excel 模板批量导入历史数据。支持日记、工作、花费、地点、待办。
            </span>
          </div>
          <NButton secondary @click="goImport">
            导入
          </NButton>
        </div>

        <NDivider />

        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">年度统计</span>
            <span class="settings-item__desc">
              查看支教一年的数据统计，包括日记、照片、花费、标签等。
            </span>
          </div>
          <NButton secondary @click="goStatistics">
            查看
          </NButton>
        </div>

        <NDivider />

        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">全局搜索</span>
            <span class="settings-item__desc">
              按关键词搜索日记、照片、地点、工作记录。
            </span>
          </div>
          <NButton secondary @click="goSearch">
            搜索
          </NButton>
        </div>
      </NCard>

      <!-- 回收站 -->
      <NCard class="settings-card" title="安全">
        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">回收站</span>
            <span class="settings-item__desc">
              查看和恢复已删除的数据。删除操作现在会先进入回收站。
            </span>
          </div>
          <NButton secondary @click="goRecycleBin">
            查看
          </NButton>
        </div>
      </NCard>

      <!-- 自定义 -->
      <NCard class="settings-card" title="自定义">
        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">标签管理</span>
            <span class="settings-item__desc">管理日记、照片、地点共用的标签。</span>
          </div>
          <NButton secondary @click="goTagManage">
            管理
          </NButton>
        </div>
      </NCard>

      <!-- 账户 -->
      <NCard class="settings-card" title="账户">
        <div v-if="authStore.user" class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">当前账号</span>
            <span class="settings-item__desc">{{ authStore.user.email }}</span>
          </div>
        </div>

        <NDivider />

        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">退出登录</span>
            <span class="settings-item__desc">退出后需要重新登录才能使用。</span>
          </div>
          <NButton type="error" secondary @click="handleLogout">
            退出
          </NButton>
        </div>
      </NCard>

      <!-- 关于 -->
      <NCard class="settings-card" title="关于">
        <div class="settings-item">
          <div class="settings-item__info">
            <span class="settings-item__label">昌都记忆 Changdu Memory</span>
            <span class="settings-item__desc">V5.4 — 个人数字记录平台</span>
          </div>
        </div>
      </NCard>
    </NSpin>
  </div>
</template>

<style scoped>
.page-settings {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.page-settings__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0 0 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.settings-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-card);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.settings-item__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.settings-item__label {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: 500;
}

.settings-item__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}
</style>
