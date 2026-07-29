<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { NCard, NButton, NDivider } from 'naive-ui'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="page-profile">
    <h1 class="page-profile__title">
      我的
    </h1>

    <NCard class="profile-card" title="用户信息">
      <div v-if="authStore.user" class="profile-info">
        <div class="profile-info__item">
          <span class="profile-info__label">邮箱</span>
          <span class="profile-info__value">{{ authStore.user.email }}</span>
        </div>
        <div class="profile-info__item">
          <span class="profile-info__label">注册时间</span>
          <span class="profile-info__value">
            {{ authStore.user.created_at?.split('T')[0] || '—' }}
          </span>
        </div>
      </div>

      <NDivider />

      <div class="profile-actions">
        <NButton type="error" secondary @click="handleLogout">
          退出登录
        </NButton>
      </div>
    </NCard>

    <NCard class="profile-card" title="快速入口">
      <div class="profile-links">
        <NButton text @click="router.push('/settings')">
          设置
        </NButton>
        <NButton text @click="router.push('/statistics')">
          年度统计
        </NButton>
        <NButton text @click="router.push('/memory')">
          记忆时间轴
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.page-profile {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.page-profile__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}

.profile-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-card);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profile-info__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-info__label {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}

.profile-info__value {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  font-weight: 500;
}

.profile-actions {
  display: flex;
  justify-content: center;
}

.profile-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
