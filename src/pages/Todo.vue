<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoCard from '@/components/todo/TodoCard.vue'
import { AppIcon } from '@/components/ui'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const todoStore = useTodoStore()
const message = useMessage()

onMounted(() => {
  todoStore.loadTodos()
})

// ==========================================
// 搜索：搜索所有待办（标题 / 备注）
// ==========================================
const searchKeyword = ref('')

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

/** 倒序展示：最新添加的在上方；已完成同样按添加时间晚的在上 */
const filteredTodos = computed(() => {
  let list = todoStore.todos

  // 搜索
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((t) =>
      (t.title || '').toLowerCase().includes(kw) ||
      (t.description || '').toLowerCase().includes(kw),
    )
  }

  // 筛选
  if (activeFilter.value === 'active') list = list.filter((t) => !t.completed)
  else if (activeFilter.value === 'completed') list = list.filter((t) => t.completed)

  // 按创建时间倒序（最新在上）
  return [...list].sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || ''),
  )
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

/** 添加：进入原来的添加界面（/todo/new） */
function goCreate() {
  router.push('/todo/new')
}

async function handleDelete(id: string) {
  if (!confirm('确定删除该待办？')) return
  try {
    await todoStore.removeTodo(id)
    message.success('已删除')
  } catch { message.error('删除失败') }
}

// ==========================================
// 批量编辑（与行政安排一致）
// ==========================================
const todoBatchMode = ref(false)
const selectedTodoIds = ref<string[]>([])

function enterTodoBatch() {
  todoBatchMode.value = true
  selectedTodoIds.value = []
}

function exitTodoBatch() {
  todoBatchMode.value = false
  selectedTodoIds.value = []
}

function toggleSelectTodo(id: string) {
  const idx = selectedTodoIds.value.indexOf(id)
  if (idx >= 0) selectedTodoIds.value.splice(idx, 1)
  else selectedTodoIds.value.push(id)
}

const allVisibleSelected = computed(() =>
  filteredTodos.value.length > 0 && selectedTodoIds.value.length === filteredTodos.value.length,
)

function toggleSelectAllVisible() {
  selectedTodoIds.value = allVisibleSelected.value ? [] : filteredTodos.value.map((t) => t.id)
}

/** 单选：可编辑或删除；多选：仅删除 */
const canEditSelectedTodo = computed(() => selectedTodoIds.value.length === 1)

function handleBatchEditSelectedTodo() {
  if (selectedTodoIds.value.length !== 1) return
  goEdit(selectedTodoIds.value[0])
}

async function handleBatchDeleteSelectedTodo() {
  if (selectedTodoIds.value.length === 0) { message.warning('请先选择要删除的待办'); return }
  if (!confirm(`确定删除选中的 ${selectedTodoIds.value.length} 项待办？`)) return
  try {
    await todoStore.batchRemove([...selectedTodoIds.value])
    message.success('已删除')
    exitTodoBatch()
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

    <!-- ====== 搜索 + 添加 ====== -->
    <div class="todo-search">
      <AppIcon name="search" size="16" class="todo-search__icon" />
      <input
        v-model="searchKeyword"
        class="todo-search__input"
        placeholder="搜索所有待办…"
        maxlength="120"
        autocomplete="off"
      />
      <button class="todo-search__add" @click="goCreate">
        <AppIcon name="plus" size="15" /> 添加
      </button>
    </div>

    <!-- ====== 筛选 + 批量编辑 ====== -->
    <div class="todo-filter-row">
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

      <!-- 批量编辑操作（与行政安排一致） -->
      <div class="todo-filter-actions">
        <template v-if="todoBatchMode">
          <button
            class="todo-fa-btn todo-fa-btn--secondary"
            @click="exitTodoBatch"
          >
            取消批量编辑
          </button>
          <button class="todo-fa-btn" @click="toggleSelectAllVisible">
            <AppIcon name="check" size="13" /> {{ allVisibleSelected ? '取消全选' : '全选' }}
          </button>
        </template>
        <button
          v-else
          class="todo-fa-btn todo-fa-btn--secondary"
          @click="enterTodoBatch"
        >
          <AppIcon name="check-circle" size="14" /> 批量编辑
        </button>
      </div>
    </div>

    <!-- ====== 列表 ====== -->
    <NSpin :show="todoStore.loading">
      <div v-if="!todoStore.loading && filteredTodos.length === 0" class="todo-empty">
        <div class="todo-empty__icon">
          <AppIcon name="pen" size="30" />
        </div>
        <h3 class="todo-empty__title">
          {{ searchKeyword.trim() ? '未找到待办' : '暂无待办' }}
        </h3>
        <p class="todo-empty__desc">
          {{ searchKeyword.trim() ? '换个关键词试试' : '把今天想完成的事写下来吧' }}
        </p>
      </div>
      <div v-else class="todo-list">
        <div
          v-for="t in filteredTodos"
          :key="t.id"
          class="todo-item-row"
          :class="{ 'todo-item-row--batch': todoBatchMode }"
        >
          <!-- 批量编辑模式：左侧多选圆圈 -->
          <button
            v-if="todoBatchMode"
            class="todo-item-row__select"
            :class="{ 'todo-item-row__select--checked': selectedTodoIds.includes(t.id) }"
            :aria-pressed="selectedTodoIds.includes(t.id)"
            @click.stop="toggleSelectTodo(t.id)"
          >
            <AppIcon v-if="selectedTodoIds.includes(t.id)" name="check" size="12" />
          </button>
          <TodoCard
            :todo="t"
            class="todo-item-row__card"
            @toggle="todoStore.toggleTodo"
            @click="todoBatchMode ? toggleSelectTodo(t.id) : goEdit(t.id)"
            @delete="handleDelete"
          />
        </div>
      </div>
    </NSpin>

    <!-- 批量编辑底部操作条：单选可编辑/删除，多选仅删除 -->
    <div v-if="todoBatchMode && selectedTodoIds.length > 0" class="todo-batch-bar">
      <span class="todo-batch-bar__count">
        已选 {{ selectedTodoIds.length }} 项
      </span>
      <div class="todo-batch-bar__actions">
        <button
          v-if="canEditSelectedTodo"
          class="todo-batch-bar__btn"
          @click="handleBatchEditSelectedTodo"
        >
          <AppIcon name="edit" size="13" /> 编辑
        </button>
        <button
          class="todo-batch-bar__btn todo-batch-bar__btn--danger"
          @click="handleBatchDeleteSelectedTodo"
        >
          <AppIcon name="trash" size="13" /> 删除
        </button>
      </div>
    </div>

    <!-- ====== 页脚：统计 + 清除已完成 ====== -->
    <div v-if="!todoBatchMode && todoStore.todos.length > 0" class="todo-footer">
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

/* ---- 搜索 + 添加 ---- */
.todo-search {
  background: var(--color-bg-white);
  border-radius: 22px;
  box-shadow: var(--shadow-md);
  padding: 6px 8px 6px 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border-light);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.todo-search:focus-within {
  box-shadow: var(--shadow-lg);
  border-color: rgba(75, 143, 140, 0.3);
}

.todo-search__icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.todo-search__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  padding: 8px 0;
  color: var(--color-text-primary);
  font-weight: 400;
  min-width: 0;
  font-family: inherit;
}

.todo-search__input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.todo-search__add {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 16px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-caption, 12px);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.todo-search__add:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* ---- 筛选 + 批量编辑行 ---- */
.todo-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}

.todo-filters {
  display: flex;
  gap: 6px;
  padding: 3px;
  background: rgba(0, 0, 0, 0.035);
  border-radius: var(--radius-full);
  width: fit-content;
  overflow-x: auto;
  scrollbar-width: none;
}

.todo-filters::-webkit-scrollbar { display: none; }

.todo-filter-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.todo-fa-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-caption, 12px);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.todo-fa-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.todo-fa-btn--secondary {
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}

.todo-fa-btn--secondary:hover {
  background: var(--color-bg);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
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

.todo-item-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.todo-item-row--batch {
  align-items: center;
}

.todo-item-row__card {
  flex: 1;
  min-width: 0;
}

/* 批量编辑：左侧多选圆圈（放大、下移、垂直居中，与行政安排一致） */
.todo-item-row__select {
  width: 26px;
  height: 26px;
  margin-left: 8px;
  align-self: center;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--color-border-medium);
  background: var(--color-bg-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: 0;
  transition: all var(--transition-fast);
}

.todo-item-row__select:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.todo-item-row__select--checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

/* ---- 批量编辑底部操作条 ---- */
.todo-batch-bar {
  position: sticky;
  bottom: calc(var(--bottom-nav-height, 72px) + 16px);
  z-index: var(--z-sticky, 150);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  margin-top: var(--spacing-lg);
  border-radius: var(--radius-xl);
  background: var(--glass-bg-card, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  box-shadow: var(--shadow-lg);
}

@media (min-width: 768px) {
  .todo-batch-bar {
    bottom: 16px;
  }
}

.todo-batch-bar__count {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.todo-batch-bar__actions {
  display: flex;
  gap: 8px;
}

.todo-batch-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-caption);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.todo-batch-bar__btn:hover {
  background: var(--color-primary-dark);
}

.todo-batch-bar__btn--danger {
  background: rgba(194, 103, 106, 0.12);
  color: var(--color-error);
}

.todo-batch-bar__btn--danger:hover {
  background: var(--color-error);
  color: #fff;
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

  .todo-search__input {
    font-size: 15px;
  }

  .todo-filter-row {
    flex-wrap: wrap;
    gap: 8px;
  }
}

@media (max-width: 360px) {
  .todo-filters {
    flex: 1;
    justify-content: space-between;
  }

  .todo-filters__btn {
    flex: 1;
    text-align: center;
    padding: 7px 8px;
  }
}
</style>
