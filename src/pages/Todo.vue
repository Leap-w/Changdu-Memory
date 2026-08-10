<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoCard from '@/components/todo/TodoCard.vue'
import TodoEmpty from '@/components/todo/TodoEmpty.vue'
import { NButton, NSpin, useMessage } from 'naive-ui'

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

/** 是否全选 */
const allSelected = computed(() =>
  todoStore.todos.length > 0 && todoStore.selectedIds.size === todoStore.todos.length,
)

function onToggleSelectAll() {
  todoStore.toggleSelectAll()
}

async function handleBatchDelete() {
  if (todoStore.selectedIds.size === 0) { message.warning('请先选择要删除的待办'); return }
  if (!confirm(`确定删除选中的 ${todoStore.selectedIds.size} 项待办？`)) return
  try {
    await todoStore.batchDelete()
    message.success('已批量删除')
  } catch { message.error('批量删除失败') }
}
</script>

<template>
  <div class="todo-page">
    <div class="todo-page__header">
      <h1 class="todo-page__title">
        待办
      </h1>
      <NButton type="primary" size="medium" @click="goCreate">
        新建
      </NButton>
    </div>

    <NSpin :show="todoStore.loading">
      <!-- 全空状态 -->
      <TodoEmpty
        v-if="!todoStore.loading && todoStore.todos.length === 0"
      />

      <template v-else>
        <!-- 批量操作栏 -->
        <div v-if="todoStore.todos.length > 0" class="todo-batch-bar">
          <label class="todo-batch-bar__select-all">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="onToggleSelectAll"
            />
            <span>全选</span>
          </label>
          <span v-if="todoStore.selectedIds.size > 0" class="todo-batch-bar__count">
            已选 {{ todoStore.selectedIds.size }} 项
          </span>
          <button
            class="todo-batch-bar__del"
            :disabled="todoStore.selectedIds.size === 0"
            @click="handleBatchDelete"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="display:inline-block;vertical-align:-2px;margin-right:4px"
            ><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            批量删除
          </button>
        </div>

        <!-- ====== 已过期 ====== -->
        <section v-if="todoStore.overdueTodos.length" class="todo-section">
          <h2 class="todo-section__title">
            已过期
            <span class="todo-section__count">
              {{ todoStore.overdueTodos.length }} 项待补
            </span>
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.overdueTodos"
              :key="todo.id"
              :todo="todo"
              selectable
              :selected="todoStore.isSelected(todo.id)"
              @toggle="todoStore.toggleTodo"
              @select="todoStore.toggleSelect"
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
              selectable
              :selected="todoStore.isSelected(todo.id)"
              @toggle="todoStore.toggleTodo"
              @select="todoStore.toggleSelect"
              @click="goEdit"
              @delete="handleDeleteTodo"
            />
          </div>
        </section>

        <!-- ====== 未来 ====== -->
        <section v-if="todoStore.futureTodos.length" class="todo-section">
          <h2 class="todo-section__title">
            未来
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.futureTodos"
              :key="todo.id"
              :todo="todo"
              selectable
              :selected="todoStore.isSelected(todo.id)"
              @toggle="todoStore.toggleTodo"
              @select="todoStore.toggleSelect"
              @click="goEdit"
              @delete="handleDeleteTodo"
            />
          </div>
        </section>

        <!-- ====== 已完成 ====== -->
        <section v-if="todoStore.completedTodos.length" class="todo-section">
          <h2 class="todo-section__title">
            已完成
          </h2>
          <div class="todo-section__list">
            <TodoCard
              v-for="todo in todoStore.completedTodos"
              :key="todo.id"
              :todo="todo"
              selectable
              :selected="todoStore.isSelected(todo.id)"
              @toggle="todoStore.toggleTodo"
              @select="todoStore.toggleSelect"
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
.todo-page {
  max-width: 640px;
  margin: 0 auto;
}

.todo-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.todo-page__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
}

/* ---- 批量操作栏 ---- */
.todo-batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 20px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
}

.todo-batch-bar__select-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}

.todo-batch-bar__select-all input {
  accent-color: var(--color-primary);
  cursor: pointer;
}

.todo-batch-bar__count {
  font-size: var(--font-caption);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  flex: 1;
}

.todo-batch-bar__del {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-full);
  background: rgba(194, 103, 106, 0.12);
  color: var(--color-error);
  font-size: var(--font-caption);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.todo-batch-bar__del:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.todo-batch-bar__del:not(:disabled):hover {
  background: var(--color-error);
  color: #fff;
}

/* ---- 分组 ---- */
.todo-section {
  margin-bottom: 28px;
}

.todo-section__title {
  font-size: var(--font-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.todo-section__count {
  font-size: var(--font-secondary);
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: 8px;
}

.todo-section__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
