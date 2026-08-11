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
  deadline_date: string | null
  deadline_time: string | null
} | null>(null)

onMounted(async () => {
  if (todoId.value) {
    loading.value = true
    try {
      // 优先用 store 缓存；未命中则直接从数据库拉取（编辑页刷新 / 直接进入也能正常编辑）
      const cached = await todoStore.getTodoById(todoId.value)
      if (cached) {
        existingTodo.value = {
          title: cached.title,
          description: cached.description ?? '',
          todo_date: cached.todo_date,
          deadline_date: (cached as any).deadline_date ?? null,
          deadline_time: (cached as any).deadline_time ?? null,
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
  title: string; description: string; todo_date: string; deadline_date?: string | null; deadline_time?: string | null
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
        :deadline-date="existingTodo?.deadline_date"
        :deadline-time="existingTodo?.deadline_time"
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
