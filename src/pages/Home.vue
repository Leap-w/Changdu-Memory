<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeStore } from '@/stores/time'
import { useAuthStore } from '@/stores/auth'
import { useWorkStore } from '@/stores/work'
import { useTodoStore } from '@/stores/todo'
import { useDiaryStore } from '@/stores/diary'
import { useExpenseStore } from '@/stores/expense'
import { useMemoryStore } from '@/stores/memory'
import { AppCard, AppSection, AppIcon } from '@/components/ui'
import HeroSection from '@/components/dashboard/HeroSection.vue'

const router = useRouter()
const timeStore = useTimeStore()
const authStore = useAuthStore()
const workStore = useWorkStore()
const todoStore = useTodoStore()
const diaryStore = useDiaryStore()
const expenseStore = useExpenseStore()
const memoryStore = useMemoryStore()

const ready = ref(false)
const periodLabels: Record<string, string> = {
  morning: '上午', afternoon: '下午', evening: '晚上',
}

// ==========================================
// Data loading
// ==========================================
onMounted(async () => {
  if (authStore.isLoggedIn && !timeStore.profile) {
    try { await timeStore.loadTimeProfile() } catch { /* ignore */ }
  }

  if (authStore.isLoggedIn) {
    const tasks = [
      { load: () => workStore.works.length ? Promise.resolve() : workStore.loadWorks() },
      { load: () => todoStore.todos.length ? Promise.resolve() : todoStore.loadTodos() },
      { load: () => diaryStore.diaries.length ? Promise.resolve() : diaryStore.loadDiaries() },
      { load: () => expenseStore.expenses.length ? Promise.resolve() : expenseStore.loadExpenses() },
      { load: () => memoryStore.memories.length ? Promise.resolve() : memoryStore.loadMemories() },
    ]
    await Promise.allSettled(tasks.map((t) => t.load()))
  }

  ready.value = true
})

// ==========================================
// Today
// ==========================================
const today = computed(() => new Date().toISOString().split('T')[0])

const todayWorks = computed(() => workStore.todayWorks)
const todayTodos = computed(() => todoStore.todayTodos)
const doneTodos = computed(() => todayTodos.value.filter((t) => t.completed))
const pendingTodos = computed(() => todayTodos.value.filter((t) => !t.completed))
const todayExpenseTotal = computed(() => expenseStore.todayExpenseTotal)

const todayDiary = computed(() =>
  diaryStore.diaries.find((d) => d.diary_date === today.value) || null,
)

// ==========================================
// Recent memories (diaries + memories merged)
// ==========================================
const recentMemories = computed(() => {
  const items: { type: 'diary' | 'memory'; date: string; title: string; summary: string; id: string }[] = []

  for (const d of diaryStore.diaries.slice(0, 6)) {
    items.push({
      type: 'diary',
      date: d.diary_date,
      title: d.title || '无标题日记',
      summary: (d.content || '').replace(/<[^>]+>/g, '').slice(0, 120),
      id: d.id,
    })
  }

  for (const m of memoryStore.memories.slice(0, 4)) {
    items.push({
      type: 'memory',
      date: m.event_date,
      title: m.title,
      summary: (m.content || '').slice(0, 120),
      id: m.id,
    })
  }

  // Sort by date descending, take top 6
  items.sort((a, b) => b.date.localeCompare(a.date))
  return items.slice(0, 6)
})

// ==========================================
// Date display
// ==========================================
function getTodayDisplay() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getWeekday() {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[new Date().getDay()]
}

const currentTime = ref(getCurrentTimeStr())
let clockTimer: ReturnType<typeof setInterval> | null = null

function getCurrentTimeStr() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  clockTimer = setInterval(() => {
    currentTime.value = getCurrentTimeStr()
  }, 30000) // update every 30s
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

// ==========================================
// Navigation
// ==========================================
function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="home">
    <!-- ====== Hero ====== -->
    <HeroSection />

    <!-- ====== Date bar ====== -->
    <div class="home__date-bar">
      <div class="home__date-main">
        <span class="home__date-text">{{ getTodayDisplay() }}</span>
        <span class="home__date-weekday">{{ getWeekday() }}</span>
      </div>
      <span class="home__date-time">{{ currentTime }}</span>
    </div>

    <!-- ====== Today Status ====== -->
    <AppSection title="今日状态" class="home__section">
      <div class="home__today-grid">
        <!-- 今日课程 -->
        <AppCard hoverable class="home__today-card" @click="goTo('/work')">
          <div class="today-card__inner">
            <div class="today-card__head">
              <div class="today-card__icon today-card__icon--work">
                <AppIcon name="calendar" size="16" />
              </div>
              <span class="today-card__title">今日课程</span>
            </div>
            <template v-if="ready && todayWorks.length > 0">
              <div class="today-card__body">
                <div
                  v-for="w in todayWorks.slice(0, 2)"
                  :key="w.id"
                  class="today-card__item"
                >
                  <span class="today-card__item-meta">{{ periodLabels[w.period] || w.period }}</span>
                  <span class="today-card__item-text">{{ w.title }}</span>
                </div>
                <div v-if="todayWorks.length > 2" class="today-card__more">
                  还有 {{ todayWorks.length - 2 }} 项…
                </div>
              </div>
            </template>
            <div v-else class="today-card__empty">
              今天没有课程安排
            </div>
          </div>
        </AppCard>

        <!-- 今日待办 -->
        <AppCard hoverable class="home__today-card" @click="goTo('/todo')">
          <div class="today-card__inner">
            <div class="today-card__head">
              <div class="today-card__icon today-card__icon--todo">
                <AppIcon name="check" size="16" />
              </div>
              <span class="today-card__title">今日待办</span>
            </div>
            <template v-if="ready && todayTodos.length > 0">
              <div class="today-card__body">
                <div class="today-card__stat-row">
                  <span class="today-card__stat-num">{{ doneTodos.length }} / {{ todayTodos.length }}</span>
                  <span class="today-card__stat-label">已完成</span>
                </div>
                <div v-if="pendingTodos.length > 0" class="today-card__next">
                  下一项：{{ pendingTodos[0].title }}
                </div>
              </div>
            </template>
            <div v-else class="today-card__empty">
              今天没有待办事项
            </div>
          </div>
        </AppCard>

        <!-- 今日消费 -->
        <AppCard hoverable class="home__today-card" @click="goTo('/expense')">
          <div class="today-card__inner">
            <div class="today-card__head">
              <div class="today-card__icon today-card__icon--expense">
                <AppIcon name="expense" size="16" />
              </div>
              <span class="today-card__title">今日消费</span>
            </div>
            <template v-if="ready && todayExpenseTotal > 0">
              <div class="today-card__body">
                <div class="today-card__stat-row">
                  <span class="today-card__stat-num">¥ {{ todayExpenseTotal.toFixed(2) }}</span>
                </div>
              </div>
            </template>
            <div v-else class="today-card__empty">
              今天还没有消费记录
            </div>
          </div>
        </AppCard>

        <!-- 今日心情/日记 -->
        <AppCard hoverable class="home__today-card" @click="goTo(todayDiary ? `/diary/${todayDiary.id}` : '/diary/new')">
          <div class="today-card__inner">
            <div class="today-card__head">
              <div class="today-card__icon today-card__icon--mood">
                <AppIcon name="smile" size="16" />
              </div>
              <span class="today-card__title">今日心情</span>
            </div>
            <template v-if="ready && todayDiary">
              <div class="today-card__body">
                <div class="today-card__mood">
                  <template v-if="todayDiary.mood">
                    {{ todayDiary.mood }}
                  </template>
                  <template v-if="todayDiary.weather">
                    <span v-if="todayDiary.mood"> · </span>{{ todayDiary.weather }}
                  </template>
                </div>
                <div v-if="todayDiary.content" class="today-card__diary-excerpt">
                  {{ todayDiary.content.replace(/<[^>]+>/g, '').slice(0, 60) }}{{ (todayDiary.content || '').replace(/<[^>]+>/g, '').length > 60 ? '…' : '' }}
                </div>
              </div>
            </template>
            <div v-else class="today-card__empty">
              今天还没有记录心情
            </div>
          </div>
        </AppCard>
      </div>
    </AppSection>

    <!-- ====== Quick Actions ====== -->
    <AppSection title="快捷入口" class="home__section">
      <div class="home__quick-actions">
        <AppCard
          v-for="act in [
            { id: 'diary', label: '记录', sub: '日记', icon: 'pen', color: 'rgba(75, 143, 140, 0.1)', iconColor: 'var(--color-primary)', route: '/diary' },
            { id: 'work', label: '安排', sub: '工作', icon: 'calendar', color: 'rgba(111, 168, 220, 0.12)', iconColor: 'var(--color-sky)', route: '/work' },
            { id: 'expense', label: '财务', sub: '账本', icon: 'wallet', color: 'rgba(214, 168, 79, 0.12)', iconColor: 'var(--color-gold)', route: '/expense' },
            { id: 'memory', label: '回忆', sub: '大事记', icon: 'star', color: 'rgba(107, 158, 133, 0.12)', iconColor: '#6B9E85', route: '/memory' },
            { id: 'more', label: '更多', sub: '全部功能', icon: 'grid', color: 'rgba(140, 154, 155, 0.12)', iconColor: 'var(--color-text-tertiary)', route: '/profile' },
          ]"
          :key="act.id"
          hoverable
          padding="sm"
          class="home__quick-btn"
          @click="goTo(act.route)"
        >
          <div class="quick-btn__inner">
            <div class="quick-btn__icon" :style="{ background: act.color, color: act.iconColor }">
              <AppIcon :name="act.icon" size="22" />
            </div>
            <div class="quick-btn__text">
              <span class="quick-btn__label">{{ act.label }}</span>
              <span class="quick-btn__sub">{{ act.sub }}</span>
            </div>
          </div>
        </AppCard>
      </div>
    </AppSection>

    <!-- ====== Recent Memories ====== -->
    <AppSection
      title="最近记忆"
      :action-label="recentMemories.length > 0 ? `查看全部 (${diaryStore.diaries.length + memoryStore.memories.length})` : undefined"
      class="home__section"
      @action="goTo('/diary')"
    >
      <template v-if="ready && recentMemories.length > 0">
        <div class="home__memories-grid">
          <AppCard
            v-for="item in recentMemories.slice(0, 3)"
            :key="`${item.type}-${item.id}`"
            hoverable
            no-padding
            class="home__memory-card"
            @click="goTo(item.type === 'diary' ? `/diary/${item.id}` : `/memory`)"
          >
            <div
              class="memory-card__color-top"
              :class="{
                'memory-card__color-top--diary': item.type === 'diary',
                'memory-card__color-top--memory': item.type === 'memory',
              }"
            />
            <div class="memory-card__body">
              <div class="memory-card__date">
                {{ item.date }}
              </div>
              <h3 class="memory-card__title">
                {{ item.title }}
              </h3>
              <p v-if="item.summary" class="memory-card__summary">
                {{ item.summary }}
              </p>
            </div>
          </AppCard>
        </div>
      </template>
      <div v-else class="home__memories-empty">
        <p class="home__memories-empty-text">
          还没有记忆，写下第一篇日记吧
        </p>
        <button class="home__memories-empty-btn" @click="goTo('/diary/new')">
          去记录
        </button>
      </div>
    </AppSection>

    <div class="home__footer-space" />
  </div>
</template>

<style scoped>
/* ================================================
   Home Page — V5.4
   ================================================ */
.home {
  /* Hero handles its own background */
}

.home__section {
  margin-bottom: var(--spacing-2xl, 40px);
}

/* ---- Date bar ---- */
.home__date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px;
  margin-top: var(--spacing-lg, 20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.home__date-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.home__date-text {
  font-size: var(--font-section-title, 20px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
}

.home__date-weekday {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.home__date-time {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.03);
}

/* ---- Today Status Grid ---- */
.home__today-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md, 12px);
}

@media (min-width: 600px) {
  .home__today-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .home__today-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.home__today-card {
  /* AppCard handles glass/radius/shadow */
}

.today-card__inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.today-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.today-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.today-card__icon--work    { background: rgba(75, 143, 140, 0.1);  color: var(--color-primary); }
.today-card__icon--todo    { background: rgba(111, 168, 220, 0.12); color: var(--color-sky); }
.today-card__icon--expense { background: rgba(214, 168, 79, 0.12); color: var(--color-gold); }
.today-card__icon--mood    { background: rgba(107, 158, 133, 0.12); color: #6B9E85; }

.today-card__title {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.today-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.today-card__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.today-card__item-meta {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  min-width: 32px;
  flex-shrink: 0;
}

.today-card__item-text {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today-card__more {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  padding-top: 2px;
}

.today-card__stat-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.today-card__stat-num {
  font-size: 22px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.today-card__stat-label {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.today-card__next {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.today-card__mood {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.today-card__diary-excerpt {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.today-card__empty {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

/* ---- Quick Actions ---- */
.home__quick-actions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-md, 12px);
}

@media (max-width: 599px) {
  .home__quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 600px) and (max-width: 767px) {
  .home__quick-actions {
    grid-template-columns: repeat(3, 1fr);
  }
}

.home__quick-btn {
  cursor: pointer;
}

.quick-btn__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.quick-btn__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-btn__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.quick-btn__label {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.quick-btn__sub {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* ---- Recent Memories ---- */
.home__memories-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg, 20px);
}

@media (min-width: 600px) {
  .home__memories-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .home__memories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.home__memory-card {
  overflow: hidden;
  cursor: pointer;
}

.memory-card__color-top {
  height: 6px;
  border-radius: var(--radius-card, 24px) var(--radius-card, 24px) 0 0;
}
.memory-card__color-top--diary  { background: linear-gradient(90deg, var(--color-primary), var(--color-sky)); }
.memory-card__color-top--memory { background: linear-gradient(90deg, var(--color-gold), #6B9E85); }

.memory-card__body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memory-card__date {
  font-size: var(--font-caption);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.memory-card__title {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memory-card__summary {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home__memories-empty {
  text-align: center;
  padding: var(--spacing-3xl, 48px) 24px;
}

.home__memories-empty-text {
  font-size: var(--font-secondary);
  color: var(--color-text-tertiary);
  margin: 0 0 16px;
}

.home__memories-empty-btn {
  padding: 8px 24px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.home__memories-empty-btn:hover {
  background: var(--color-primary-dark);
}

/* ---- Footer space ---- */
.home__footer-space {
  height: var(--spacing-page, 24px);
}
</style>
