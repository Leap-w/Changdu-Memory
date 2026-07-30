<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import TodoEditor from '@/components/todo/TodoEditor.vue'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const todoStore = useTodoStore()
const message = useMessage()

const todoId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!todoId.value)

const loading = ref(false)
const existingTodo = ref<{
  title: string
  description: string
  todo_date: string
  priority: string
  category: string
} | null>(null)

onMounted(async () => {
  if (todoId.value) {
    loading.value = true
    try {
      // 尝试从 store 中查找
      const cached = todoStore.todos.find((t) => t.id === todoId.value)
      if (cached) {
        existingTodo.value = {
          title: cached.title,
          description: cached.description ?? '',
          todo_date: cached.todo_date,
          priority: cached.priority,
          category: cached.category,
        }
      } else {
        message.warning('待办不存在')
        router.push('/todo')
      }
    } catch {
      message.error('加载失败')
      router.push('/todo')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit(data: {
  title: string; description: string; todo_date: string; due_date?: string; priority: string; category: string
}) {
  try {
    if (isEdit.value && todoId.value) {
      await todoStore.editTodo(todoId.value, data)
      message.success('已更新')
      router.push('/todo')
    } else {
      await todoStore.addTodo(data)
      message.success('待办已创建')
      router.push('/todo')
    }
  } catch {
    message.error('保存失败')
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="todo-edit-page">
    <h1 class="todo-edit-page__title">
      {{ isEdit ? '编辑待办' : '新建待办' }}
    </h1>

    <NSpin :show="loading">
      <TodoEditor
        v-if="!loading"
        :title="existingTodo?.title"
        :description="existingTodo?.description"
        :todo-date="existingTodo?.todo_date"
        :priority="existingTodo?.priority"
        :category="existingTodo?.category"
        :loading="todoStore.loading"
        :submit-label="isEdit ? '保存' : '创建'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.todo-edit-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.todo-edit-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}
</style>
