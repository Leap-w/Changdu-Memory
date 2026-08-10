<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTimeStore, getCountdownStats } from '@/stores/time'

const timeStore = useTimeStore()

const hasProfile = computed(() => !!timeStore.profile?.start_date)

const subtitle = computed(() => {
  if (timeStore.profile?.location) {
    return `支教一年的高原记录 · ${timeStore.profile.location}`
  }
  return '支教一年的高原记录'
})

// ==========================================
// 倒计时卡片：可自定义选择展示的倒计时
// 默认显示「距离返程」，其余选项来自「时光」模块的自定义倒计时
// ==========================================
interface CountdownOption {
  id: string
  label: string
}

interface ActiveCountdown {
  title: string
  endDate: string
  remaining: number
  totalDays: number
  progress: number
  isPast: boolean
}

const DAY_IN_MS = 1000 * 60 * 60 * 24

/** 用户选择的倒计时 id（'return' = 距离返程，否则为 countdowns 表记录 id），持久化到 localStorage */
const selectedId = ref<string>(localStorage.getItem('hero.countdownId') || 'return')
const pickerOpen = ref(false)

/** 可选倒计时列表：距离返程 + 自定义倒计时 */
const countdownOptions = computed<CountdownOption[]>(() => {
  const options: CountdownOption[] = []
  if (hasProfile.value) options.push({ id: 'return', label: '距离返程' })
  for (const cd of timeStore.countdowns) {
    options.push({ id: cd.id, label: cd.title })
  }
  return options
})

/** 距离返程（基于旅程起止日期） */
function returnCountdown(): ActiveCountdown {
  return {
    title: '距离返程',
    endDate: timeStore.profile?.end_date ?? '',
    remaining: timeStore.daysRemaining,
    totalDays: timeStore.totalDays,
    progress: timeStore.progress,
    isPast: timeStore.totalDays > 0 && timeStore.daysRemaining <= 0,
  }
}

/** 自定义倒计时（来自「时光」模块） */
function customCountdown(cd: { id: string; title: string; start_date: string | null; end_date: string }): ActiveCountdown {
  const stats = getCountdownStats(cd)

  // 进度参考起点：优先自定义 start_date，其次旅程开始日
  const startRef = cd.start_date ?? timeStore.profile?.start_date ?? null
  let totalDays = 0
  let progress = 0
  if (startRef) {
    const start = new Date(startRef + 'T00:00:00').getTime()
    const end = new Date(cd.end_date + 'T00:00:00').getTime()
    totalDays = Math.max(1, Math.ceil((end - start) / DAY_IN_MS))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const passed = Math.max(0, today.getTime() - start) / DAY_IN_MS
    progress = Math.min(100, Math.max(0, Math.round((passed / totalDays) * 100)))
  }

  return {
    title: cd.title,
    endDate: cd.end_date,
    remaining: stats.diff,
    totalDays,
    progress,
    isPast: stats.isPast,
  }
}

/** 当前展示的倒计时（选中的自定义倒计时不存在时回退到「距离返程」） */
const activeCountdown = computed<ActiveCountdown | null>(() => {
  if (selectedId.value !== 'return') {
    const cd = timeStore.countdowns.find((c) => c.id === selectedId.value)
    if (cd) return customCountdown(cd)
  }
  if (hasProfile.value) return returnCountdown()
  return null
})

const targetText = computed(() => {
  const c = activeCountdown.value
  if (!c) return ''
  if (c.isPast) return '已完成'
  if (c.totalDays > 0) return `目标 ${c.totalDays} 天`
  return `截止 ${c.endDate}`
})

const footText = computed(() => {
  const c = activeCountdown.value
  if (!c) return ''
  if (c.isPast) return '已结束'
  return `${c.progress}% Completed`
})

function selectOption(id: string) {
  selectedId.value = id
  localStorage.setItem('hero.countdownId', id)
  pickerOpen.value = false
}
</script>

<template>
  <section class="hero" @click="pickerOpen = false">
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

      <!-- 右侧：可自定义选择的倒计时半透明卡片 -->
      <div v-if="activeCountdown" class="hero__countdown" @click.stop>
        <div class="hero__countdown-head">
          <button
            class="hero__countdown-picker"
            :aria-expanded="pickerOpen"
            @click.stop="pickerOpen = !pickerOpen"
          >
            <span class="hero__countdown-picker-label">{{ activeCountdown.title }}</span>
            <svg
              class="hero__countdown-caret"
              :class="{ 'hero__countdown-caret--open': pickerOpen }"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <span class="hero__countdown-target">{{ targetText }}</span>
        </div>

        <div class="hero__countdown-body">
          <span class="hero__countdown-num">{{ Math.abs(activeCountdown.remaining) }}</span>
          <span class="hero__countdown-unit">天</span>
        </div>

        <!-- 柔和进度条 -->
        <div class="hero__progress-track">
          <div
            class="hero__progress-fill"
            :style="{ width: activeCountdown.progress + '%' }"
          />
        </div>
        <div class="hero__countdown-foot">
          <span class="hero__progress-pct">{{ footText }}</span>
        </div>

        <!-- 倒计时选择下拉 -->
        <Transition name="picker">
          <div v-if="pickerOpen" class="hero__countdown-list">
            <button
              v-for="opt in countdownOptions"
              :key="opt.id"
              class="hero__countdown-opt"
              :class="{ 'hero__countdown-opt--active': opt.id === selectedId }"
              @click.stop="selectOption(opt.id)"
            >
              <span class="hero__countdown-opt-text">{{ opt.label }}</span>
              <svg
                v-if="opt.id === selectedId"
                class="hero__countdown-opt-check"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><polyline points="20 6 9 17 4 12" /></svg>
            </button>
            <div v-if="countdownOptions.length === 0" class="hero__countdown-list-empty">
              暂无其他倒计时
            </div>
          </div>
        </Transition>
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
   高原雪山大图 + 沉浸渐变 + 大号「第 X 天」+ 可自定义倒计时卡片
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
  /* 标题保持一行不换行 */
  white-space: nowrap;
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

/* ---- 右侧：可自定义选择的倒计时半透明卡片 ---- */
/* 参照 首页1.1.html 原型：min-w + shrink-0，固定紧凑宽度，不随 flex 拉满 */
.hero__countdown {
  position: relative;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 16px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

/* 桌面端（左右布局）：右侧卡片固定宽度 240px，不拉伸 */
@media (min-width: 768px) {
  .hero__countdown {
    width: 240px;
    max-width: 240px;
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

/* 倒计时选择按钮 */
.hero__countdown-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 68%;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(226, 232, 240, 0.9);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.hero__countdown-picker:hover {
  color: #fff;
}

.hero__countdown-picker-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero__countdown-caret {
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.hero__countdown-caret--open {
  transform: rotate(180deg);
}

.hero__countdown-target {
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
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

/* ---- 倒计时选择下拉（向上展开，避免被 hero 圆角裁剪） ---- */
.hero__countdown-list {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: rgba(16, 24, 32, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
  max-height: 200px;
  overflow-y: auto;
}

.hero__countdown-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: rgba(226, 232, 240, 0.9);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.hero__countdown-opt:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.hero__countdown-opt--active {
  color: var(--color-gold, #D6A84F);
  font-weight: 600;
}

.hero__countdown-opt-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero__countdown-opt-check {
  flex-shrink: 0;
}

.hero__countdown-list-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.45);
  text-align: center;
}

/* 下拉过渡 */
.picker-enter-active,
.picker-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
