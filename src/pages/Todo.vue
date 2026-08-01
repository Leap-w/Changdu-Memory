<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoCard from '@/components/todo/TodoCard.vue'
import TodoEmpty from '@/components/todo/TodoEmpty.vue'
import { NButton, NSpin } from 'naive-ui'

const router = useRouter()
const todoStore = useTodoStore()

onMounted(() => {
  todoStore.loadTodos()
})

function goEdit(id: string) {
  router.push(`/todo/${id}/edit`)
}

function goCreate() {
  router.push('/todo/new')
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
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
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
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
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
              @toggle="todoStore.toggleTodo"
              @click="goEdit"
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
