<script setup lang="ts">
import { computed } from 'vue'
import { useTimeStore } from '@/stores/time'
import { useAuthStore } from '@/stores/auth'

const timeStore = useTimeStore()
const authStore = useAuthStore()

const userName = computed(() => {
  const email = authStore.user?.email
  if (!email) return '朋友'
  const name = email.split('@')[0]
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

const dateRange = computed(() => {
  const format = (d: string | null | undefined) => {
    if (!d) return ''
    return d.replace(/-/g, '.')
  }
  return `${format(timeStore.profile?.start_date)} — ${format(timeStore.profile?.end_date)}`
})
</script>

<template>
  <section class="hero">
    <!-- Sky gradient -->
    <div class="hero__sky"></div>

    <!-- Mountain layers -->
    <div class="hero__mountains">
      <!-- Far mountains: softest, lightest -->
      <div class="hero__mountain hero__mountain--far"></div>
      <!-- Mid mountains -->
      <div class="hero__mountain hero__mountain--mid"></div>
      <!-- Near mountains: darkest, most defined -->
      <div class="hero__mountain hero__mountain--near"></div>
      <!-- Snow highlights -->
      <div class="hero__snow hero__snow--1"></div>
      <div class="hero__snow hero__snow--2"></div>
      <div class="hero__snow hero__snow--3"></div>
    </div>

    <!-- Foreground ground -->
    <div class="hero__ground"></div>

    <!-- User greeting -->
    <div class="hero__greeting">
      <span class="hero__greeting-text">{{ greeting }}，{{ userName }}</span>
    </div>

    <!-- Central frosted glass card -->
    <div class="hero__card-wrapper">
      <div class="hero__card">
        <h1 class="hero__title">昌都记忆</h1>
        <p class="hero__subtitle">Changdu Memory</p>

        <div class="hero__day-block">
          <span class="hero__day-label">支教第</span>
          <span class="hero__day-number">{{ timeStore.daysPassed }}</span>
          <span class="hero__day-label">天</span>
        </div>

        <!-- Progress bar -->
        <div class="hero__progress">
          <div class="hero__progress-track">
            <div
              class="hero__progress-fill"
              :style="{ width: timeStore.progress + '%' }"
            ></div>
          </div>
          <div class="hero__progress-info">
            <span class="hero__progress-pct">{{ timeStore.progress }}%</span>
            <span class="hero__progress-remain">剩余 {{ timeStore.daysRemaining }} 天</span>
          </div>
        </div>

        <!-- Date range -->
        <p class="hero__dates">{{ dateRange }}</p>
      </div>
    </div>

    <!-- Scroll hint -->
    <div class="hero__scroll-hint">
      <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
        <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="8" cy="8" r="2" fill="currentColor" class="hero__scroll-dot"/>
      </svg>
    </div>
  </section>
</template>

<style scoped>
/* ================================================
   Hero Section — 高原雪山摄影风
   ================================================ */

.hero {
  position: relative;
  width: 100%;
  height: 480px;
  overflow: hidden;
  isolation: isolate;
}

/* ---- Sky ---- */
.hero__sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    175deg,
    #BCCCDC 0%,
    #C8D6E5 15%,
    #D3DDE9 30%,
    #DFE5ED 45%,
    #E8ECF1 60%,
    #EDE8E3 78%,
    #F0EBE5 100%
  );
}

/* ---- Mountains container ---- */
.hero__mountains {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65%;
}

/* ---- Mountain layers (shared) ---- */
.hero__mountain {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Far mountains — soft blue-gray, gentle ridges */
.hero__mountain--far {
  height: 48%;
  background: linear-gradient(
    to bottom,
    rgba(188, 199, 210, 0.65) 0%,
    rgba(168, 182, 196, 0.50) 12%,
    rgba(152, 168, 184, 0.38) 30%,
    rgba(144, 160, 176, 0.25) 100%
  );
  clip-path: polygon(
    0% 100%, 0% 68%, 6% 56%, 12% 62%, 18% 50%, 25% 58%,
    32% 44%, 38% 52%, 44% 40%, 50% 48%, 56% 36%, 62% 45%,
    68% 38%, 75% 46%, 82% 40%, 88% 50%, 94% 44%, 100% 52%,
    100% 100%
  );
}

/* Mid mountains — defined ridges */
.hero__mountain--mid {
  height: 56%;
  background: linear-gradient(
    to bottom,
    rgba(208, 216, 226, 0.60) 0%,
    rgba(166, 180, 196, 0.48) 14%,
    rgba(138, 154, 172, 0.38) 28%,
    rgba(120, 136, 154, 0.28) 100%
  );
  clip-path: polygon(
    0% 100%, 0% 78%, 8% 68%, 15% 75%, 24% 58%, 32% 66%,
    40% 50%, 48% 60%, 55% 48%, 62% 58%, 70% 46%, 78% 56%,
    85% 44%, 92% 55%, 96% 50%, 100% 58%, 100% 100%
  );
}

/* Near mountains — darkest, sharp peaks with snow caps */
.hero__mountain--near {
  height: 62%;
  background: linear-gradient(
    to bottom,
    rgba(230, 234, 240, 0.72) 0%,
    rgba(200, 208, 220, 0.55) 10%,
    rgba(148, 162, 180, 0.42) 22%,
    rgba(110, 128, 148, 0.32) 40%,
    rgba(94, 112, 132, 0.22) 100%
  );
  clip-path: polygon(
    0% 100%, 0% 85%, 10% 72%, 18% 80%, 28% 65%, 36% 75%,
    46% 58%, 54% 68%, 64% 52%, 72% 65%, 82% 56%, 88% 66%,
    94% 60%, 100% 58%, 100% 100%
  );
}

/* ---- Snow highlights (white caps on peaks) ---- */
.hero__snow {
  position: absolute;
  background: rgba(240, 244, 248, 0.55);
}

.hero__snow--1 {
  bottom: 52%;
  left: 26%;
  width: 12%;
  height: 4%;
  clip-path: polygon(0% 100%, 20% 0%, 40% 50%, 60% 0%, 80% 60%, 100% 40%, 100% 100%);
}

.hero__snow--2 {
  bottom: 42%;
  left: 50%;
  width: 10%;
  height: 3.5%;
  clip-path: polygon(0% 80%, 25% 0%, 50% 50%, 75% 0%, 100% 70%, 100% 100%, 0% 100%);
}

.hero__snow--3 {
  bottom: 45%;
  left: 62%;
  width: 14%;
  height: 3%;
  clip-path: polygon(0% 100%, 15% 20%, 30% 60%, 45% 0%, 60% 50%, 80% 30%, 100% 100%);
}

/* ---- Ground ---- */
.hero__ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8%;
  background: linear-gradient(
    to bottom,
    rgba(220, 210, 195, 0.25),
    rgba(210, 198, 180, 0.45)
  );
}

/* ---- Greeting ---- */
.hero__greeting {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px var(--spacing-page);
  z-index: 2;
}

.hero__greeting-text {
  font-size: var(--font-secondary);
  color: rgba(255, 255, 255, 0.75);
  font-weight: var(--font-weight-medium, 500);
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ---- Frosted glass card ---- */
.hero__card-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  width: min(340px, calc(100% - 48px));
}

.hero__card {
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius-xl);
  padding: 32px 28px 26px;
  text-align: center;
  color: #fff;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* ---- Title ---- */
.hero__title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 3px;
  margin: 0 0 2px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.hero__subtitle {
  font-size: 11px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0 0 22px;
}

/* ---- Day counter ---- */
.hero__day-block {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-bottom: 20px;
}

.hero__day-label {
  font-size: var(--font-secondary);
  color: rgba(255, 255, 255, 0.7);
}

.hero__day-number {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ---- Progress ---- */
.hero__progress {
  margin-bottom: 14px;
}

.hero__progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-bottom: 8px;
  overflow: hidden;
}

.hero__progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 2px;
  transition: width 600ms ease;
}

.hero__progress-info {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-caption);
}

.hero__progress-pct {
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
}

.hero__progress-remain {
  color: rgba(255, 255, 255, 0.5);
}

/* ---- Dates ---- */
.hero__dates {
  margin: 0;
  font-size: var(--font-caption);
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.5px;
}

/* ---- Scroll hint ---- */
.hero__scroll-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  color: rgba(255, 255, 255, 0.4);
  animation: hero-scroll-bounce 2.5s ease-in-out infinite;
}

.hero__scroll-dot {
  animation: hero-scroll-dot 2.5s ease-in-out infinite;
}

@keyframes hero-scroll-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(4px); }
}

@keyframes hero-scroll-dot {
  0%, 40%, 100% { opacity: 1; transform: translateY(0); }
  50%, 90% { opacity: 0.3; transform: translateY(6px); }
}

/* ================================================
   Responsive
   ================================================ */

@media (max-width: 767px) {
  .hero {
    height: 420px;
  }

  .hero__card {
    padding: 26px 22px 22px;
  }

  .hero__title {
    font-size: 22px;
    letter-spacing: 2px;
  }

  .hero__day-number {
    font-size: 40px;
  }

  .hero__mountains {
    height: 58%;
  }

  .hero__mountain--far  { height: 42%; }
  .hero__mountain--mid  { height: 50%; }
  .hero__mountain--near { height: 56%; }
}

@media (min-width: 1200px) {
  .hero {
    height: 520px;
  }

  .hero__card {
    padding: 36px 32px 28px;
  }

  .hero__title {
    font-size: 28px;
    letter-spacing: 4px;
  }

  .hero__day-number {
    font-size: 54px;
    letter-spacing: -2px;
  }
}
</style>
