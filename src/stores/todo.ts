import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchTodos,
  fetchTodayTodos,
  createTodo,
  updateTodo,
  toggleCompleteTodo,
  softDeleteTodo,
} from '@/repositories/TodoRepository'
import type { Todo } from '@/repositories/TodoRepository'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 今日待办 */
  const todayTodos = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return todos.value.filter((t) => t.todo_date === today)
  })

  /** 未来待办 */
  const futureTodos = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return todos.value.filter((t) => t.todo_date > today)
  })

  /** 已完成 */
  const completedTodos = computed(() => {
    return todos.value.filter((t) => t.completed)
  })

  /** 今日待办中未完成数量 */
  const todayPendingCount = computed(() => {
    return todayTodos.value.filter((t) => !t.completed).length
  })

  /** 今日已完成数量 */
  const todayCompletedCount = computed(() => {
    return todayTodos.value.filter((t) => t.completed).length
  })

  /** 加载全部 */
  async function loadTodos() {
    loading.value = true
    error.value = null
    try {
      todos.value = await fetchTodos()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 加载今日待办（首页使用，轻量） */
  async function loadTodayTodos() {
    loading.value = true
    error.value = null
    try {
      return await fetchTodayTodos()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
      return []
    } finally {
      loading.value = false
    }
  }

  /** 创建 */
  async function addTodo(
    fields: { title: string; description: string; todo_date: string; priority: string; category: string },
  ): Promise<Todo> {
    loading.value = true
    error.value = null
    try {
      const todo = await createTodo(fields)
      todos.value.unshift(todo)
      return todo
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 编辑 */
  async function editTodo(
    id: string,
    fields: { title: string; description: string; todo_date: string; priority: string; category: string },
  ): Promise<Todo> {
    loading.value = true
    error.value = null
    try {
      const todo = await updateTodo(id, fields)
      const idx = todos.value.findIndex((t) => t.id === id)
      if (idx !== -1) todos.value[idx] = todo
      return todo
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 切换完成 */
  async function toggleTodo(id: string) {
    const todo = todos.value.find((t) => t.id === id)
    if (!todo) return

    const previous = todo.completed
    // Optimistic update
    todo.completed = !previous

    try {
      const updated = await toggleCompleteTodo(id, previous)
      todo.completed = updated.completed
    } catch (err: unknown) {
      // Rollback
      todo.completed = previous
      error.value = err instanceof Error ? err.message : '操作失败'
    }
  }

  /** 删除 */
  async function removeTodo(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await softDeleteTodo(id)
      todos.value = todos.value.filter((t) => t.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    todos,
    loading,
    error,
    todayTodos,
    futureTodos,
    completedTodos,
    todayPendingCount,
    todayCompletedCount,
    loadTodos,
    loadTodayTodos,
    addTodo,
    editTodo,
    toggleTodo,
    removeTodo,
  }
})
