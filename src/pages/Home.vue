<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeStore } from '@/stores/time'
import { useAuthStore } from '@/stores/auth'
import { useWorkStore } from '@/stores/work'
import { useTodoStore } from '@/stores/todo'
import { useDiaryStore } from '@/stores/diary'
import { useExpenseStore } from '@/stores/expense'
import { usePhotoStore } from '@/stores/photo'
import HeroSection from '@/components/dashboard/HeroSection.vue'

const router = useRouter()
const timeStore = useTimeStore()
const authStore = useAuthStore()
const workStore = useWorkStore()
const todoStore = useTodoStore()
const diaryStore = useDiaryStore()
const expenseStore = useExpenseStore()
const photoStore = usePhotoStore()

const ready = ref(false)

// ==========================================
// Data loading
// ==========================================
onMounted(async () => {
  if (authStore.isLoggedIn && !timeStore.profile) {
    try { await timeStore.loadTimeProfile() } catch { /* ignore */ }
  }

  if (authStore.isLoggedIn) {
    const stores = [
      { load: () => workStore.works.length ? Promise.resolve() : workStore.loadWorks() },
      { load: () => todoStore.todos.length ? Promise.resolve() : todoStore.loadTodos() },
      { load: () => diaryStore.diaries.length ? Promise.resolve() : diaryStore.loadDiaries() },
      { load: () => expenseStore.expenses.length ? Promise.resolve() : expenseStore.loadExpenses() },
      { load: () => photoStore.photos.length ? Promise.resolve() : photoStore.loadPhotos() },
    ]
    await Promise.allSettled(stores.map((s) => s.load()))
  }

  ready.value = true
})

// ==========================================
// Today's data
// ==========================================
const today = computed(() => new Date().toISOString().split('T')[0])

const todayWorks = computed(() => workStore.todayWorks)

const todayTodos = computed(() => todoStore.todayTodos)
const pendingTodos = computed(() => todayTodos.value.filter((t) => !t.completed))
const doneTodos = computed(() => todayTodos.value.filter((t) => t.completed))

const todayDiaryCount = computed(() =>
  diaryStore.diaries.filter((d) => d.diary_date === today.value).length,
)

const todayExpenseTotal = computed(() => {
  const list = expenseStore.expenses.filter((e) => e.expense_date === today.value && e.type !== 'income')
  return Math.round(list.reduce((s, e) => s + (Number(e.amount) || 0), 0) * 100) / 100
})

const todayPhotoCount = computed(() =>
  photoStore.photos.filter((p) => p.photo_date === today.value).length,
)

// ==========================================
// Labels
// ==========================================
const periodLabels: Record<string, string> = {
  morning: '上午', afternoon: '下午', evening: '晚上',
}

const priorityDotColors: Record<string, string> = {
  high: '#BF616A', medium: '#E8B04C', low: '#6B9E85',
}

// ==========================================
// Quick actions
// ==========================================
const quickActions = [
  { id: 'diary',    label: '写日记',   icon: 'pen',       route: '/diary/new' },
  { id: 'schedule', label: '课程表',   icon: 'calendar',  route: '/work' },
  { id: 'todo',     label: '待办清单', icon: 'checklist', route: '/todo' },
  { id: 'students', label: '学生档案', icon: 'people',    route: '/location' },
  { id: 'expense',  label: '支出记录', icon: 'expense',   route: '/expense' },
  { id: 'income',   label: '收入记录', icon: 'income',    route: '/expense/new' },
  { id: 'events',   label: '大事记',   icon: 'star',      route: '/memory' },
  { id: 'time',     label: '时光中心', icon: 'clock',     route: '/time-center' },
]

function goTo(path: string) {
  router.push(path)
}

function getTodayDisplay() {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}
</script>

<template>
  <div class="home">
    <!-- ====== Hero ====== -->
    <HeroSection />

    <!-- ====== Content ====== -->
    <div class="home__content">
      <!-- Date badge -->
      <div class="home__section-header">
        <span class="home__date-badge">{{ getTodayDisplay() }}</span>
      </div>

      <!-- ====== Today Grid ====== -->
      <div class="home__today-grid">
        <!-- 今日课程 -->
        <div class="today-card">
          <div class="today-card__head" @click="goTo('/work')">
            <div class="today-card__icon today-card__icon--work">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span class="today-card__title">今日课程</span>
            <span v-if="todayWorks.length" class="today-card__count">{{ todayWorks.length }}</span>
            <svg class="today-card__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div v-if="ready && !todayWorks.length" class="today-card__empty">今天没有课程安排</div>
          <div v-else-if="todayWorks.length" class="today-card__list">
            <div v-for="w in todayWorks.slice(0, 3)" :key="w.id" class="today-card__item">
              <span class="today-card__item-meta">{{ periodLabels[w.period] || w.period }}</span>
              <span class="today-card__item-title">{{ w.title }}</span>
            </div>
          </div>
        </div>

        <!-- 今日待办 -->
        <div class="today-card">
          <div class="today-card__head" @click="goTo('/todo')">
            <div class="today-card__icon today-card__icon--todo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span class="today-card__title">今日待办</span>
            <span v-if="todayTodos.length" class="today-card__count">{{ doneTodos.length }}/{{ todayTodos.length }}</span>
            <svg class="today-card__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div v-if="ready && !todayTodos.length" class="today-card__empty">今天没有待办事项</div>
          <div v-else-if="todayTodos.length" class="today-card__list">
            <div v-for="t in todayTodos.slice(0, 4)" :key="t.id" class="today-card__item">
              <span
                class="today-card__item-dot"
                :class="{ done: t.completed }"
                :style="{ background: t.completed ? '#6B9E85' : (priorityDotColors[t.priority] || '#6B7B8D') }"
              ></span>
              <span class="today-card__item-title" :class="{ done: t.completed }">{{ t.title }}</span>
            </div>
          </div>
        </div>

        <!-- 今日概览 -->
        <div class="today-card today-card--overview">
          <div class="today-card__head">
            <div class="today-card__icon today-card__icon--overview">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span class="today-card__title">今日概览</span>
          </div>
          <div v-if="ready" class="today-card__stats">
            <div class="today-card__stat"><span class="today-card__stat-num">{{ todayDiaryCount }}</span><span class="today-card__stat-label">日记</span></div>
            <div class="today-card__stat"><span class="today-card__stat-num">{{ todayPhotoCount }}</span><span class="today-card__stat-label">照片</span></div>
            <div class="today-card__stat"><span class="today-card__stat-num">{{ pendingTodos.length }}</span><span class="today-card__stat-label">待办</span></div>
            <div class="today-card__stat"><span class="today-card__stat-num">¥{{ todayExpenseTotal }}</span><span class="today-card__stat-label">花费</span></div>
          </div>
        </div>
      </div>

      <!-- ====== Quick Actions ====== -->
      <div class="home__section-header">
        <span class="home__section-label">快捷入口</span>
      </div>

      <div class="home__quick-actions">
        <button
          v-for="act in quickActions"
          :key="act.id"
          class="quick-btn"
          @click="goTo(act.route)"
        >
          <div class="quick-btn__icon" :class="`quick-btn__icon--${act.id}`">
            <svg v-if="act.icon==='pen'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
            <svg v-else-if="act.icon==='calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <svg v-else-if="act.icon==='checklist'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 6 5 6"/><circle cx="4" cy="12" r="1.5"/><polyline points="2 18 4 16 6 18"/>
            </svg>
            <svg v-else-if="act.icon==='people'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <svg v-else-if="act.icon==='expense'||act.icon==='income'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <svg v-else-if="act.icon==='star'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <svg v-else-if="act.icon==='clock'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span class="quick-btn__label">{{ act.label }}</span>
        </button>
      </div>

      <div class="home__footer-space"></div>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   Home Page — v5.1 设计
   ================================================ */
.home {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
}

.home__content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--spacing-page) var(--spacing-3xl);
  position: relative;
  z-index: 1;
  margin-top: -16px;
}

.home__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-top: var(--spacing-sm);
}

.home__date-badge {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.home__section-label {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* ---- Today Cards ---- */
.home__today-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.today-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.today-card__head {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-card) var(--spacing-card) var(--spacing-sm);
  cursor: pointer;
  user-select: none;
}

.today-card__icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.today-card__icon--work     { background: #EDF2F8; color: var(--color-primary); }
.today-card__icon--todo     { background: #F5F0EB; color: var(--color-accent-soft); }
.today-card__icon--overview { background: #EBF0ED; color: var(--color-secondary); }

.today-card__title {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.today-card__count {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.today-card__arrow {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.today-card__list {
  padding: 0 var(--spacing-card) var(--spacing-card);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.today-card__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 7px var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.today-card__item-meta {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  min-width: 32px;
  flex-shrink: 0;
}

.today-card__item-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.today-card__item-dot.done { opacity: 0.6; }

.today-card__item-title {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today-card__item-title.done {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
  opacity: 0.7;
}

.today-card__empty {
  padding: var(--spacing-lg) var(--spacing-card);
  text-align: center;
  font-size: var(--font-secondary);
  color: var(--color-text-tertiary);
}

.today-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  padding: 0 var(--spacing-card) var(--spacing-card);
}

.today-card__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  margin: 1px;
}

.today-card__stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.today-card__stat-label {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

/* ---- Quick Actions ---- */
.home__quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.quick-btn:hover {
  box-shadow: var(--shadow-card);
  border-color: transparent;
  transform: translateY(-1px);
}

.quick-btn:active {
  transform: translateY(0);
  background: var(--color-bg);
}

.quick-btn__icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-btn__icon--diary    { background: #EDF2F8; color: var(--color-primary); }
.quick-btn__icon--schedule { background: #EDF2F8; color: var(--color-primary); }
.quick-btn__icon--todo     { background: #F5F0EB; color: var(--color-accent-soft); }
.quick-btn__icon--students { background: #EBF0ED; color: var(--color-secondary); }
.quick-btn__icon--expense  { background: #FDF0ED; color: var(--color-error); }
.quick-btn__icon--income   { background: #EBF0ED; color: var(--color-secondary); }
.quick-btn__icon--events   { background: #F3EEF8; color: #8E7CB5; }
.quick-btn__icon--time     { background: #EDF2F8; color: var(--color-primary); }

.quick-btn__label {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.home__footer-space {
  height: var(--spacing-xl);
}

/* ---- Responsive ---- */
@media (max-width: 599px) {
  .home__quick-actions { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 600px) and (max-width: 899px) {
  .home__today-grid { display: grid; grid-template-columns: 1fr 1fr; }
}

@media (min-width: 900px) {
  .home__content {
    max-width: 860px;
    margin-top: -20px;
  }

  .home__today-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .today-card--overview {
    grid-column: 1 / -1;
  }

  .today-card--overview .today-card__stats {
    grid-template-columns: repeat(4, 1fr);
  }

  .home__quick-actions { gap: var(--spacing-card); }

  .quick-btn__icon { width: 44px; height: 44px; }
}

@media (max-width: 400px) {
  .home__content {
    padding: 0 var(--spacing-md) var(--spacing-2xl);
    margin-top: -12px;
  }
}
</style>
