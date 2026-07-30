<script setup lang="ts">
import { NCard } from 'naive-ui'
import { useTimeStore } from '@/stores/time'

const timeStore = useTimeStore()

defineProps<{
  diaryCount: number
  photoCount: number
  locationCount: number
  expenseTotal: number
  workCount: number
}>()

const projectYear = timeStore.profile?.start_date?.substring(0, 4) || new Date().getFullYear()
</script>

<template>
  <NCard class="overview-card">
    <div class="overview-card__inner">
      <h2 class="overview-card__title">
        {{ projectYear }} 昌都一年
      </h2>
      <div class="overview-card__stats">
        <div class="stat-item">
          <span class="stat-item__icon">📖</span>
          <span class="stat-item__value">{{ diaryCount }}</span>
          <span class="stat-item__label">日记</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__icon">📷</span>
          <span class="stat-item__value">{{ photoCount }}</span>
          <span class="stat-item__label">照片</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__icon">📍</span>
          <span class="stat-item__value">{{ locationCount }}</span>
          <span class="stat-item__label">地点</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__icon">📋</span>
          <span class="stat-item__value">{{ workCount }}</span>
          <span class="stat-item__label">工作</span>
        </div>
        <div class="stat-item">
          <span class="stat-item__icon">💰</span>
          <span class="stat-item__value">¥{{ expenseTotal }}</span>
          <span class="stat-item__label">花费</span>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.overview-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  background: linear-gradient(135deg, #5E81AC 0%, #81A1C1 100%);
  color: #fff;
}

.overview-card :deep(.n-card__content) {
  padding: 0;
}

.overview-card__inner {
  padding: 24px;
}

.overview-card__title {
  font-size: var(--font-card-title);
  font-weight: 700;
  color: #fff;
  margin: 0 0 20px;
  text-align: center;
  opacity: 0.95;
}

.overview-card__stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
}

.stat-item__icon {
  font-size: 22px;
}

.stat-item__value {
  font-size: 20px;
  font-weight: 800;
  white-space: nowrap;
}

.stat-item__label {
  font-size: 11px;
  opacity: 0.75;
}
</style>
