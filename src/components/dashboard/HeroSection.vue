<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '@/stores/time'
import { useAuthStore } from '@/stores/auth'

const timeStore = useTimeStore()
const authStore = useAuthStore()

const userName = computed(() => {
  const name = authStore.displayName
  return name.length > 12 ? name.slice(0, 12) + '…' : name
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const subtitle = computed(() => {
  if (timeStore.profile?.location) {
    return `支教一年的高原记录 · ${timeStore.profile.location}`
  }
  return '支教一年的高原记录'
})

const hasProfile = computed(() => !!timeStore.profile?.start_date)

const dateRange = computed(() => {
  const fmt = (d: string | null | undefined) => (d ? d.replace(/-/g, '.') : '')
  return `${fmt(timeStore.profile?.start_date)} — ${fmt(timeStore.profile?.end_date)}`
})
</script>

<template>
  <section class="hero">
    <!-- Sky gradient -->
    <div class="hero__sky" />

    <!-- Mountain layers -->
    <div class="hero__mountains">
      <div class="hero__mountain hero__mountain--far" />
      <div class="hero__mountain hero__mountain--mid" />
      <div class="hero__mountain hero__mountain--near" />
      <div class="hero__snow hero__snow--1" />
      <div class="hero__snow hero__snow--2" />
      <div class="hero__snow hero__snow--3" />
    </div>

    <!-- Ground -->
    <div class="hero__ground" />

    <!-- Greeting -->
    <div class="hero__greeting">
      <span class="hero__greeting-text">{{ greeting }}，{{ userName }}</span>
    </div>

    <!-- Hero content area -->
    <div class="hero__content">
      <div class="hero__text">
        <h1 class="hero__title">
          昌都记忆
        </h1>
        <p class="hero__subtitle">
          {{ subtitle }}
        </p>
        <div class="hero__day-block">
          <span class="hero__day-label">第</span>
          <span class="hero__day-number">{{ hasProfile ? timeStore.daysPassed : '—' }}</span>
          <span class="hero__day-label">天</span>
        </div>
      </div>

      <!-- Countdown capsule -->
      <div v-if="hasProfile" class="hero__countdown">
        <div class="hero__countdown-head">
          <span>距离返程</span>
          <span class="hero__countdown-target">目标 {{ timeStore.totalDays }} 天</span>
        </div>
        <div class="hero__countdown-body">
          <span class="hero__countdown-num">{{ timeStore.daysRemaining }}</span>
          <span class="hero__countdown-unit">天</span>
        </div>
        <div class="hero__progress-track">
          <div
            class="hero__progress-fill"
            :style="{ width: timeStore.progress + '%' }"
          />
        </div>
        <div class="hero__countdown-foot">
          <span class="hero__progress-pct">{{ timeStore.progress }}% 已完成</span>
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

    <!-- Date range -->
    <p v-if="hasProfile" class="hero__dates">
      {{ dateRange }}
    </p>
  </section>
</template>

<style scoped>
/* ================================================
   Hero Section — V5.4 高原雪山摄影风
   ================================================ */
.hero {
  position: relative;
  width: 100%;
  min-height: 440px;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--radius-2xl, 32px);
}

/* ---- Sky gradient (V5.4 palette) ---- */
.hero__sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    175deg,
    #BCCCDC 0%,
    #C4D2DE 15%,
    #CDD8E2 30%,
    #DAE1E8 45%,
    #E3E7ED 60%,
    #EBEBEB 78%,
    #F0EDE8 100%
  );
}

/* ---- Mountains container ---- */
.hero__mountains {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 58%;
}

.hero__mountain {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Far mountains */
.hero__mountain--far {
  height: 44%;
  background: linear-gradient(
    to bottom,
    rgba(188, 199, 210, 0.55) 0%,
    rgba(168, 182, 196, 0.42) 12%,
    rgba(152, 168, 184, 0.30) 30%,
    rgba(144, 160, 176, 0.18) 100%
  );
  clip-path: polygon(
    0% 100%, 0% 68%, 6% 56%, 12% 62%, 18% 50%, 25% 58%,
    32% 44%, 38% 52%, 44% 40%, 50% 48%, 56% 36%, 62% 45%,
    68% 38%, 75% 46%, 82% 40%, 88% 50%, 94% 44%, 100% 52%,
    100% 100%
  );
}

/* Mid mountains */
.hero__mountain--mid {
  height: 52%;
  background: linear-gradient(
    to bottom,
    rgba(208, 216, 226, 0.52) 0%,
    rgba(166, 180, 196, 0.42) 14%,
    rgba(138, 154, 172, 0.32) 28%,
    rgba(120, 136, 154, 0.22) 100%
  );
  clip-path: polygon(
    0% 100%, 0% 78%, 8% 68%, 15% 75%, 24% 58%, 32% 66%,
    40% 50%, 48% 60%, 55% 48%, 62% 58%, 70% 46%, 78% 56%,
    85% 44%, 92% 55%, 96% 50%, 100% 58%, 100% 100%
  );
}

/* Near mountains */
.hero__mountain--near {
  height: 58%;
  background: linear-gradient(
    to bottom,
    rgba(230, 234, 240, 0.65) 0%,
    rgba(200, 208, 220, 0.48) 10%,
    rgba(148, 162, 180, 0.36) 22%,
    rgba(110, 128, 148, 0.26) 40%,
    rgba(94, 112, 132, 0.16) 100%
  );
  clip-path: polygon(
    0% 100%, 0% 85%, 10% 72%, 18% 80%, 28% 65%, 36% 75%,
    46% 58%, 54% 68%, 64% 52%, 72% 65%, 82% 56%, 88% 66%,
    94% 60%, 100% 58%, 100% 100%
  );
}

/* Snow highlights */
.hero__snow {
  position: absolute;
  background: rgba(240, 244, 248, 0.5);
}
.hero__snow--1 {
  bottom: 48%;
  left: 26%;
  width: 12%;
  height: 4%;
  clip-path: polygon(0% 100%, 20% 0%, 40% 50%, 60% 0%, 80% 60%, 100% 40%, 100% 100%);
}
.hero__snow--2 {
  bottom: 38%;
  left: 50%;
  width: 10%;
  height: 3.5%;
  clip-path: polygon(0% 80%, 25% 0%, 50% 50%, 75% 0%, 100% 70%, 100% 100%, 0% 100%);
}
.hero__snow--3 {
  bottom: 41%;
  left: 62%;
  width: 14%;
  height: 3%;
  clip-path: polygon(0% 100%, 15% 20%, 30% 60%, 45% 0%, 60% 50%, 80% 30%, 100% 100%);
}

/* Ground */
.hero__ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6%;
  background: linear-gradient(
    to bottom,
    rgba(220, 210, 195, 0.2),
    rgba(210, 198, 180, 0.35)
  );
}

/* ---- Greeting ---- */
.hero__greeting {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 18px 24px;
  z-index: 2;
}
.hero__greeting-text {
  font-size: var(--font-secondary);
  color: rgba(255, 255, 255, 0.7);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ---- Main content: title + day + countdown ---- */
.hero__content {
  position: absolute;
  bottom: 44px;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .hero__content {
    flex-direction: row;
    justify-content: center;
    align-items: flex-end;
    gap: 48px;
    bottom: 48px;
  }
}

/* ---- Left: title + day ---- */
.hero__text {
  text-align: center;
}

.hero__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold, 800);
  color: #fff;
  letter-spacing: 3px;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  line-height: 1.1;
}

.hero__subtitle {
  font-size: var(--font-caption, 12px);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 1px;
  margin: 4px 0 16px;
}

.hero__day-block {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.hero__day-label {
  font-size: 24px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.65);
}

.hero__day-number {
  font-size: var(--font-hero-num, clamp(56px, 7vw, 72px));
  font-weight: var(--font-weight-extrabold, 800);
  line-height: 1;
  color: var(--color-gold, #D6A84F);
  text-shadow: 0 2px 12px rgba(214, 168, 79, 0.25);
}

/* ---- Right: countdown card ---- */
.hero__countdown {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 16px 20px;
  min-width: 220px;
  max-width: 260px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.hero__countdown--empty {
  text-align: center;
  padding: 20px;
}

.hero__countdown-empty-text {
  margin: 0 0 4px;
  font-size: var(--font-secondary);
  color: rgba(255, 255, 255, 0.7);
  font-weight: var(--font-weight-medium);
}

.hero__countdown-empty-hint {
  margin: 0;
  font-size: var(--font-caption);
  color: rgba(255, 255, 255, 0.45);
}

.hero__countdown-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-caption);
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.hero__countdown-target {
  color: rgba(255, 255, 255, 0.8);
  font-weight: var(--font-weight-medium);
}

.hero__countdown-body {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.hero__countdown-num {
  font-size: 36px;
  font-weight: var(--font-weight-extrabold);
  color: #fff;
  line-height: 1;
}

.hero__countdown-unit {
  font-size: var(--font-caption);
  color: rgba(255, 255, 255, 0.6);
}

/* Progress bar */
.hero__progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  margin-bottom: 8px;
  overflow: hidden;
}

.hero__progress-fill {
  height: 100%;
  background: var(--color-gold, #D6A84F);
  border-radius: 2px;
  transition: width 800ms ease;
}

.hero__countdown-foot {
  text-align: right;
}

.hero__progress-pct {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* ---- Date range ---- */
.hero__dates {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  text-align: center;
  margin: 0;
  font-size: var(--font-caption);
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.5px;
  z-index: 2;
}

/* ================================================
   Responsive
   ================================================ */
@media (max-width: 767px) {
  .hero {
    min-height: 400px;
    border-radius: var(--radius-xl, 24px);
  }

  .hero__content {
    bottom: 52px;
    gap: 16px;
  }

  .hero__title {
    font-size: 24px;
    letter-spacing: 2px;
  }

  .hero__day-label {
    font-size: 20px;
  }

  .hero__day-number {
    font-size: 48px;
  }

  .hero__countdown {
    min-width: 0;
    max-width: 100%;
    padding: 14px 18px;
  }

  .hero__countdown-num {
    font-size: 30px;
  }

  .hero__mountains {
    height: 52%;
  }

  .hero__mountain--far  { height: 38%; }
  .hero__mountain--mid  { height: 46%; }
  .hero__mountain--near { height: 52%; }
}

@media (min-width: 1024px) {
  .hero {
    min-height: 480px;
  }

  .hero__content {
    bottom: 52px;
    gap: 64px;
  }

  .hero__title {
    font-size: 34px;
    letter-spacing: 4px;
  }

  .hero__countdown {
    min-width: 240px;
    padding: 20px 24px;
  }
}
</style>
