<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeStore } from '@/stores/time'
import { useAuthStore } from '@/stores/auth'
import { NCard, NProgress, NTag } from 'naive-ui'

const router = useRouter()
const timeStore = useTimeStore()
const authStore = useAuthStore()

onMounted(() => {
  if (!timeStore.profile && authStore.isLoggedIn) {
    timeStore.loadTimeProfile()
  }
})

function goToTimeCenter() {
  router.push('/time-center')
}
</script>

<template>
  <NCard class="time-card" hoverable @click="goToTimeCenter">
    <div class="time-card__inner">
      <div class="time-card__header">
        <h2 class="time-card__title">
          {{ timeStore.profile?.project_name || '昌都记忆' }}
        </h2>
        <NTag
          :bordered="false"
          type="info"
          size="small"
          round
        >
          {{ timeStore.phase }}
        </NTag>
      </div>

      <div class="time-card__days">
        <div class="days-block days-block--main">
          <span class="days-label">今天是支教第</span>
          <span class="days-number">{{ timeStore.daysPassed }}</span>
          <span class="days-label">天</span>
        </div>
      </div>

      <div class="time-card__progress">
        <NProgress
          type="line"
          :percentage="timeStore.progress"
          :height="8"
          :border-radius="4"
          :color="'#ffffff'"
          :rail-color="'rgba(255,255,255,0.2)'"
          :show-text="false"
        />
        <span class="progress-text">{{ timeStore.progress }}% · 剩余 {{ timeStore.daysRemaining }} 天</span>
      </div>

      <div class="time-card__footer">
        <span>📍 {{ timeStore.profile?.location || '西藏昌都' }}</span>
        <span class="time-card__arrow">→</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.time-card {
  border-radius: var(--radius-card);
  background: linear-gradient(135deg, #4F8EF7 0%, #6BA3FF 100%);
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.time-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 142, 247, 0.3);
}

.time-card :deep(.n-card__content) {
  padding: 0;
}

.time-card__inner {
  padding: 24px;
}

.time-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.time-card__title {
  font-size: var(--font-card-title);
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.time-card__days {
  text-align: center;
  margin-bottom: 20px;
}

.days-block--main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.days-number {
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}

.days-label {
  font-size: var(--font-secondary);
  opacity: 0.85;
}

.time-card__progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.time-card__progress :deep(.n-progress) {
  flex: 1;
}

.progress-text {
  font-size: var(--font-caption);
  opacity: 0.85;
  white-space: nowrap;
}

.time-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: var(--font-secondary);
  opacity: 0.8;
}

.time-card__arrow {
  font-size: var(--font-content);
}
</style>
