<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoCard from '@/components/todo/TodoCard.vue'
import TodoEmpty from '@/components/todo/TodoEmpty.vue'
import { AppIcon } from '@/components/ui'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const todoStore = useTodoStore()
const message = useMessage()

onMounted(() => {
  todoStore.loadTodos()
})

function goEdit(id: string) {
  router.push(`/todo/${id}/edit`)
}

function goCreate() {
  router.push('/todo/new')
}

async function handleDeleteTodo(id: string) {
  if (!confirm('确定删除该待办？')) return
  try {
    await todoStore.removeTodo(id)
    message.success('已删除')
  } catch { message.error('删除失败') }
}

// ==========================================
// 今日进度
// ==========================================
const todayTotal = computed(() => todoStore.todayTodos.length)
const todayDone = computed(() => todoStore.todayCompletedCount)
const todayProgress = computed(() =>
  todayTotal.value > 0 ? Math.round((todayDone.value / todayTotal.value) * 100) : 0,
)

function getTodayDisplay() {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}
</script>

<template>
  <div class="todo-page">
    <!-- ====== 页头 ====== -->
    <div class="todo-page__header">
      <div class="todo-page__header-left">
        <h1 class="todo-page__title">
          待办
        </h1>
        <p class="todo-page__subtitle">
          {{ getTodayDisplay() }}
        </p>
      </div>
      <button class="todo-page__new" @click="goCreate">
        <AppIcon name="plus" size="15" /> 新建
      </button>
    </div>

    <NSpin :show="todoStore.loading">
      <!-- 全空状态 -->
      <TodoEmpty
        v-if="!todoStore.loading && todoStore.todos.length === 0"
      />

      <template v-else>
        <!-- ====== 今日进度总览 ====== -->
        <div v-if="todayTotal > 0" class="todo-overview">
          <div class="todo-overview__head">
            <div class="todo-overview__label">
              <AppIcon name="check-circle" size="16" color="var(--color-primary)" />
              <span>今日进度</span>
            </div>
            <span class="todo-overview__ratio">
              {{ todayDone }} / {{ todayTotal }} 已完成
            </span>
          </div>
          <div class="todo-overview__track">
            <div
              class="todo-overview__bar"
              :style="{ width: todayProgress + '%' }"
            />
          </div>
          <div class="todo-overview__foot">
            <span v-if="todoStore.todayPendingCount > 0">
              还有 {{ todoStore.todayPendingCount }} 项待完成
            </span>
            <span v-else class="todo-overview__done">
              今日全部完成 🎉
            </span>
          </div>
        </div>

        <!-- ====== 已过期 ====== -->
        <section v-if="todoStore.overdueTodos.length" class="todo-section">
          <h2 class="todo-section__title todo-section__title--overdue">
            已过期
            <span class="todo-section__count">{{ todoStore.overdueTodos.length }} 项</span>
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.overdueTodos"
              :key="todo.id"
              :todo="todo"
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
              @delete="handleDeleteTodo"
            />
          </div>
        </section>

        <!-- ====== 今日 ====== -->
        <section v-if="todoStore.todayTodos.length" class="todo-section">
          <h2 class="todo-section__title">
            今日
            <span class="todo-section__count">
              {{ todoStore.todayPendingCount }} 项待完成
            </span>
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.todayTodos"
              :key="todo.id"
              :todo="todo"
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
              @delete="handleDeleteTodo"
            />
          </div>
        </section>

        <!-- ====== 未来 ====== -->
        <section v-if="todoStore.futureTodos.length" class="todo-section">
          <h2 class="todo-section__title">
            未来
            <span class="todo-section__count">{{ todoStore.futureTodos.length }} 项</span>
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.futureTodos"
              :key="todo.id"
              :todo="todo"
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
              @delete="handleDeleteTodo"
            />
          </div>
        </section>

        <!-- ====== 已完成 ====== -->
        <section v-if="todoStore.completedTodos.length" class="todo-section">
          <h2 class="todo-section__title todo-section__title--muted">
            已完成
            <span class="todo-section__count">{{ todoStore.completedTodos.length }} 项</span>
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.completedTodos"
              :key="todo.id"
              :todo="todo"
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
              @delete="handleDeleteTodo"
            />
          </div>
        </section>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
/* ================================================
   Todo Page — v5.1.4 待办界面重写
   ================================================ */
.todo-page {
  max-width: 640px;
  margin: 0 auto;
}

/* ---- 页头 ---- */
.todo-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.todo-page__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-page__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.todo-page__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.todo-page__new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.todo-page__new:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* ---- 今日进度总览 ---- */
.todo-overview {
  background: var(--glass-bg-card, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: 16px 20px;
  margin-bottom: var(--spacing-lg);
}

.todo-overview__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.todo-overview__label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.todo-overview__ratio {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.todo-overview__track {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg);
  overflow: hidden;
}

.todo-overview__bar {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-primary), var(--color-sky));
  transition: width var(--transition-spring);
}

.todo-overview__foot {
  margin-top: 10px;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.todo-overview__done {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

/* ---- 分组 ---- */
.todo-section {
  margin-bottom: var(--spacing-xl);
}

.todo-section__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--font-card-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 12px;
  padding-left: 4px;
}

.todo-section__title--overdue {
  color: var(--color-error);
}

.todo-section__title--muted {
  color: var(--color-text-secondary);
}

.todo-section__count {
  font-size: var(--font-caption);
  font-weight: 400;
  color: var(--color-text-tertiary);
}

.todo-section__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
