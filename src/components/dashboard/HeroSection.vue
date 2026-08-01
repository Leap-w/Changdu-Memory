<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '@/stores/time'

const timeStore = useTimeStore()

const hasProfile = computed(() => !!timeStore.profile?.start_date)

const subtitle = computed(() => {
  if (timeStore.profile?.location) {
    return `支教一年的高原记录 · ${timeStore.profile.location}`
  }
  return '支教一年的高原记录'
})
</script>

<template>
  <section class="hero">
    <!-- 高原雪山大图背景 -->
    <img
      class="hero__bg"
      src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80"
      alt="昌都高原雪山"
    />
    <!-- 天幕遮罩与底栏沉浸渐变 -->
    <div class="hero__overlay" />

    <!-- 底部主内容：左侧标题 + 大号天数，右侧倒计时卡片 -->
    <div class="hero__content">
      <div class="hero__text">
        <h1 class="hero__title">
          昌都记忆
        </h1>
        <p class="hero__subtitle">
          {{ subtitle }}
        </p>

        <!-- 视觉中心：第 X 天 -->
        <div class="hero__day-block">
          <span class="hero__day-label">第</span>
          <span class="hero__day-number">{{ hasProfile ? timeStore.daysPassed : '—' }}</span>
          <span class="hero__day-label">天</span>
        </div>
      </div>

      <!-- 右侧：倒计时半透明卡片 -->
      <div v-if="hasProfile" class="hero__countdown">
        <div class="hero__countdown-head">
          <span>距离返程</span>
          <span class="hero__countdown-target">目标 {{ timeStore.totalDays }} 天</span>
        </div>
        <div class="hero__countdown-body">
          <span class="hero__countdown-num">{{ timeStore.daysRemaining }}</span>
          <span class="hero__countdown-unit">天</span>
        </div>
        <!-- 柔和进度条 -->
        <div class="hero__progress-track">
          <div
            class="hero__progress-fill"
            :style="{ width: timeStore.progress + '%' }"
          />
        </div>
        <div class="hero__countdown-foot">
          <span class="hero__progress-pct">{{ timeStore.progress }}% Completed</span>
        </div>
      </div>
      <div v-else class="hero__countdown hero__countdown--empty">
        <p class="hero__countdown-empty-text">
          设置支教起止日期
        </p>
        <p class="hero__countdown-empty-hint">
          前往「时光中心」配置
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ================================================
   Hero Section — 按 首页1.1.html 原型还原
   高原雪山大图 + 沉浸渐变 + 大号「第 X 天」+ 倒计时卡片
   ================================================ */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  aspect-ratio: 3 / 4;
  min-height: 380px;
  background: #101820; /* 图片加载前底色 */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

@media (min-width: 640px) {
  .hero {
    aspect-ratio: auto;
  }
}

@media (min-width: 768px) {
  .hero {
    aspect-ratio: 16 / 6;
    min-height: 360px;
  }
}

/* ---- 背景大图 ---- */
.hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.65;
  transition: transform 1s ease-out;
}

.hero:hover .hero__bg {
  transform: scale(1.05);
}

/* ---- 天幕遮罩与底栏沉浸渐变 ---- */
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(16, 24, 32, 0.95) 0%,
    rgba(16, 24, 32, 0.30) 50%,
    rgba(0, 0, 0, 0.30) 100%
  );
}

/* ---- 底部主内容 ---- */
.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  gap: 24px;
  padding: 28px;
}

@media (min-width: 768px) {
  .hero__content {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding: 48px;
  }
}

/* ---- 左侧：标题 + 大号天数 ---- */
.hero__text {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero__title {
  margin: 0;
  font-size: clamp(36px, 4.5vw, 48px);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
}

.hero__subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(203, 213, 225, 0.9);
  letter-spacing: 0.02em;
}

@media (min-width: 768px) {
  .hero__subtitle {
    font-size: 16px;
  }
}

.hero__day-block {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-top: 4px;
}

.hero__day-label {
  font-size: 24px;
  font-weight: 300;
  color: rgba(226, 232, 240, 0.9);
}

@media (min-width: 768px) {
  .hero__day-label {
    font-size: 30px;
  }
}

.hero__day-number {
  font-size: clamp(56px, 7vw, 72px);
  line-height: 1;
  font-weight: 800;
  color: var(--color-gold, #D6A84F);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

/* ---- 右侧：倒计时半透明卡片 ---- */
.hero__countdown {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 16px;
  min-width: 220px;
  max-width: 100%;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .hero__countdown {
    min-width: 240px;
  }
}

.hero__countdown--empty {
  text-align: center;
  padding: 20px;
  gap: 4px;
}

.hero__countdown-empty-text {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.hero__countdown-empty-hint {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.hero__countdown-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.9);
}

.hero__countdown-target {
  color: #fff;
  font-weight: 500;
}

.hero__countdown-body {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.hero__countdown-num {
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 768px) {
  .hero__countdown-num {
    font-size: 36px;
  }
}

.hero__countdown-unit {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.9);
  font-weight: 500;
}

/* 柔和进度条 */
.hero__progress-track {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 999px;
  overflow: hidden;
}

.hero__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--color-gold, #D6A84F);
  transition: width 1000ms ease;
}

.hero__countdown-foot {
  text-align: right;
}

.hero__progress-pct {
  font-size: 11px;
  color: rgba(203, 213, 225, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
