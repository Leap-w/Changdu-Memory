<script setup lang="ts">
import { useTimeStore } from '@/stores/time'
import { AppIcon } from '@/components/ui'

const timeStore = useTimeStore()

defineProps<{
  diaryCount: number
  expenseTotal: number
  workCount: number
}>()

const projectYear = timeStore.profile?.start_date?.substring(0, 4) || new Date().getFullYear()
</script>

<template>
  <div class="overview-hero">
    <div class="overview-hero__bg" />
    <div class="overview-hero__content">
      <h2 class="overview-hero__title">
        {{ projectYear }} 昌都一年
      </h2>
      <div class="overview-hero__stats">
        <div class="stat-item">
          <div class="stat-item__icon">
            <AppIcon name="book" size="20" />
          </div>
          <span class="stat-item__value">{{ diaryCount }}</span>
          <span class="stat-item__label">日记</span>
        </div>
        <div class="stat-item__divider" />
        <div class="stat-item">
          <div class="stat-item__icon">
            <AppIcon name="briefcase" size="20" />
          </div>
          <span class="stat-item__value">{{ workCount }}</span>
          <span class="stat-item__label">工作</span>
        </div>
        <div class="stat-item__divider" />
        <div class="stat-item">
          <div class="stat-item__icon">
            <AppIcon name="wallet" size="20" />
          </div>
          <span class="stat-item__value">¥{{ expenseTotal }}</span>
          <span class="stat-item__label">花费</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl, 24px);
}

.overview-hero__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  z-index: 0;
}

.overview-hero__content {
  position: relative;
  z-index: 1;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: #fff;
}

.overview-hero__title {
  font-size: var(--font-section-title, 20px);
  font-weight: var(--font-weight-bold);
  color: #fff;
  margin: 0;
  opacity: 0.95;
}

.overview-hero__stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 72px;
}

.stat-item__icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-item__value {
  font-size: 22px;
  font-weight: var(--font-weight-extrabold);
  white-space: nowrap;
  line-height: 1;
}

.stat-item__label {
  font-size: 11px;
  opacity: 0.7;
}

.stat-item__divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 500px) {
  .overview-hero__stats {
    gap: 12px;
  }

  .stat-item__divider {
    display: none;
  }
}
</style>
