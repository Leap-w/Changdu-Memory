<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoCard from '@/components/todo/TodoCard.vue'
import { AppIcon } from '@/components/ui'
import { NSpin, useMessage } from 'naive-ui'
import { formatLocalDate } from '@/utils/date'

const router = useRouter()
const todoStore = useTodoStore()
const message = useMessage()

onMounted(() => {
  todoStore.loadTodos()
})

// ==========================================
// 快速添加
// ==========================================
const quickTitle = ref('')

async function handleQuickAdd() {
  const title = quickTitle.value.trim()
  if (!title) return
  try {
    await todoStore.addTodo({ title, description: '', todo_date: formatLocalDate() })
    quickTitle.value = ''
    message.success('已添加')
  } catch { message.error('添加失败') }
}

// ==========================================
// 筛选：全部 / 进行中 / 已完成
// ==========================================
type FilterValue = 'all' | 'active' | 'completed'
const filters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
]
const activeFilter = ref<FilterValue>('all')

const filteredTodos = computed(() => {
  const list = todoStore.todos
  if (activeFilter.value === 'active') return list.filter((t) => !t.completed)
  if (activeFilter.value === 'completed') return list.filter((t) => t.completed)
  // 全部：未完成在前，已完成在后（各自保持日期序）
  return [...list].sort((a, b) => Number(a.completed) - Number(b.completed))
})

// ==========================================
// 进度环（今日完成度）
// ==========================================
const RING_RADIUS = 20
const RING_CIRC = 2 * Math.PI * RING_RADIUS
const todayTotal = computed(() => todoStore.todayTodos.length)
const todayDone = computed(() => todoStore.todayCompletedCount)
const todayPct = computed(() =>
  todayTotal.value > 0 ? Math.round((todayDone.value / todayTotal.value) * 100) : 0,
)
const ringOffset = computed(() => RING_CIRC * (1 - todayPct.value / 100))

// ==========================================
// 页头日期
// ==========================================
function getTodayDisplay() {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}

// ==========================================
// 操作
// ==========================================
function goEdit(id: string) {
  router.push(`/todo/${id}/edit`)
}

async function handleDelete(id: string) {
  if (!confirm('确定删除该待办？')) return
  try {
    await todoStore.removeTodo(id)
    message.success('已删除')
  } catch { message.error('删除失败') }
}

async function handleClearCompleted() {
  if (todoStore.completedTodos.length === 0) return
  if (!confirm(`清除全部 ${todoStore.completedTodos.length} 项已完成待办？`)) return
  try {
    await todoStore.clearCompleted()
    message.success('已清除')
  } catch { message.error('清除失败') }
}

// ==========================================
// 页脚统计
// ==========================================
const activeCount = computed(() => todoStore.todos.filter((t) => !t.completed).length)
const footerCountText = computed(() =>
  activeCount.value === 0 && todoStore.todos.length > 0
    ? '全部完成'
    : `${activeCount.value} 项待办`,
)
</script>

<template>
  <div class="todo-page">
    <!-- ====== Header：标题 + 进度环 ====== -->
    <header class="todo-header">
      <div class="todo-header__left">
        <h1 class="todo-header__title">
          待办
        </h1>
        <p class="todo-header__subtitle">
          今天的安排
          <span class="todo-header__date">· {{ getTodayDisplay() }}</span>
        </p>
      </div>
      <div class="todo-progress" title="今日完成进度">
        <div class="todo-progress__ring">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle
              class="todo-progress__bg"
              cx="24"
              cy="24"
              :r="RING_RADIUS"
            />
            <circle
              class="todo-progress__fg"
              cx="24"
              cy="24"
              :r="RING_RADIUS"
              :stroke-dasharray="RING_CIRC"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
          <span class="todo-progress__text">{{ todayPct }}%</span>
        </div>
        <span class="todo-progress__label">{{ todayDone }}/{{ todayTotal }}</span>
      </div>
    </header>

    <!-- ====== 快速添加 ====== -->
    <div class="todo-add">
      <input
        v-model="quickTitle"
        class="todo-add__input"
        placeholder="想做点什么…"
        maxlength="120"
        autocomplete="off"
        @keydown.enter.prevent="handleQuickAdd"
      />
      <button
        class="todo-add__btn"
        :disabled="todoStore.loading"
        aria-label="添加待办"
        title="添加"
        @click="handleQuickAdd"
      >
        <AppIcon name="plus" size="18" />
      </button>
    </div>

    <!-- ====== 筛选 ====== -->
    <div class="todo-filters" role="tablist">
      <button
        v-for="f in filters"
        :key="f.value"
        class="todo-filters__btn"
        :class="{ active: activeFilter === f.value }"
        role="tab"
        :aria-selected="activeFilter === f.value"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- ====== 列表 ====== -->
    <NSpin :show="todoStore.loading">
      <div v-if="!todoStore.loading && filteredTodos.length === 0" class="todo-empty">
        <div class="todo-empty__icon">
          <AppIcon name="pen" size="30" />
        </div>
        <h3 class="todo-empty__title">
          暂无待办
        </h3>
        <p class="todo-empty__desc">
          把今天想完成的事写下来吧
        </p>
      </div>
      <div v-else class="todo-list">
        <TodoCard
          v-for="t in filteredTodos"
          :key="t.id"
          :todo="t"
          @toggle="todoStore.toggleTodo"
          @click="goEdit"
          @delete="handleDelete"
        />
      </div>
    </NSpin>

    <!-- ====== 页脚：统计 + 清除已完成 ====== -->
    <div v-if="todoStore.todos.length > 0" class="todo-footer">
      <span class="todo-footer__count">{{ footerCountText }}</span>
      <button class="todo-footer__clear" @click="handleClearCompleted">
        清除已完成
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   Todo Page — 参照 待办1.1.html 重构
   ================================================ */
.todo-page {
  max-width: 600px;
  margin: 0 auto;
}

/* ---- Header ---- */
.todo-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 0 2px;
}

.todo-header__left {
  flex: 1;
  min-width: 0;
}

.todo-header__title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin: 0;
}

.todo-header__subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.todo-header__date {
  color: var(--color-text-tertiary);
}

/* ---- 进度环 ---- */
.todo-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.todo-progress__ring {
  position: relative;
  width: 48px;
  height: 48px;
}

.todo-progress__ring svg {
  transform: rotate(-90deg);
  display: block;
}

.todo-progress__ring circle {
  fill: none;
  stroke-width: 3.5;
}

.todo-progress__bg {
  stroke: rgba(0, 0, 0, 0.06);
}

.todo-progress__fg {
  stroke: var(--color-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.todo-progress__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 650;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.todo-progress__label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-weight: 500;
}

/* ---- 快速添加 ---- */
.todo-add {
  background: var(--color-bg-white);
  border-radius: 22px;
  box-shadow: var(--shadow-md);
  padding: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--color-border-light);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.todo-add:focus-within {
  box-shadow: var(--shadow-lg);
  border-color: rgba(75, 143, 140, 0.3);
}

.todo-add__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  padding: 12px 14px;
  color: var(--color-text-primary);
  font-weight: 400;
  min-width: 0;
  font-family: inherit;
}

.todo-add__input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.todo-add__btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition-fast), transform 0.15s ease, box-shadow var(--transition-fast);
  box-shadow: 0 1px 2px rgba(75, 143, 140, 0.3);
}

.todo-add__btn:hover {
  background: var(--color-primary-dark);
}

.todo-add__btn:active {
  background: var(--color-primary-pressed, #115e59);
  transform: scale(0.94);
}

.todo-add__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- 筛选 ---- */
.todo-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
  padding: 3px;
  background: rgba(0, 0, 0, 0.035);
  border-radius: var(--radius-full);
  width: fit-content;
}

.todo-filters__btn {
  padding: 7px 15px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: -0.01em;
  font-family: inherit;
}

.todo-filters__btn:hover:not(.active) {
  color: var(--color-text-primary);
}

.todo-filters__btn.active {
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.todo-filters__btn:active {
  transform: scale(0.97);
}

/* ---- 列表 ---- */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---- 空状态 ---- */
.todo-empty {
  text-align: center;
  padding: 64px 24px 40px;
  color: var(--color-text-tertiary);
}

.todo-empty__icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  background: linear-gradient(145deg, var(--color-primary-bg), rgba(75, 143, 140, 0.04));
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(75, 143, 140, 0.06);
  color: var(--color-primary);
  opacity: 0.9;
}

.todo-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.todo-empty__desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* ---- 页脚 ---- */
.todo-footer {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.todo-footer__clear {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.15s ease;
  font-weight: 450;
  font-family: inherit;
}

.todo-footer__clear:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.07);
}

.todo-footer__clear:active {
  transform: scale(0.97);
}

/* ---- 响应式 ---- */
@media (max-width: 420px) {
  .todo-page {
    padding: 0 2px;
  }

  .todo-header__title {
    font-size: 26px;
  }

  .todo-header__subtitle {
    font-size: 13px;
  }

  .todo-progress__ring {
    width: 44px;
    height: 44px;
  }

  .todo-progress__ring svg {
    width: 44px;
    height: 44px;
  }

  .todo-progress__text {
    font-size: 10px;
  }

  .todo-add__input {
    font-size: 16px;
    padding: 11px 12px;
  }
}

@media (max-width: 360px) {
  .todo-filters {
    width: 100%;
    justify-content: space-between;
  }

  .todo-filters__btn {
    flex: 1;
    text-align: center;
    padding: 7px 8px;
  }
}
</style>
