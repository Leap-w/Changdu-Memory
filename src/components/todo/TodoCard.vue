<script setup lang="ts">
import type { Todo } from '@/repositories/TodoRepository'
import { NCheckbox } from 'naive-ui'

const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: string]
  click: [id: string]
}>()

function onCheck() {
  emit('toggle', props.todo.id)
}

function formatDeadline(todo: Todo): string {
  const dd = (todo as any).deadline_date as string | null
  const dt = (todo as any).deadline_time as string | null
  if (!dd) return ''
  if (dt) return `${dd} ${dt}`
  return dd
}
</script>

<template>
  <div
    class="todo-card"
    :class="{ 'todo-card--done': todo.completed }"
    @click="emit('click', todo.id)"
  >
    <div class="todo-card__inner">
      <NCheckbox
        :checked="todo.completed"
        :on-update:checked="onCheck"
        @click.stop
      />
      <div class="todo-card__body">
        <span class="todo-card__title" :class="{ 'line-through': todo.completed }">
          {{ todo.title }}
        </span>
        <div v-if="todo.description" class="todo-card__desc">{{ todo.description }}</div>
        <div v-if="formatDeadline(todo)" class="todo-card__deadline">📅 {{ formatDeadline(todo) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-card {
  background: #fff;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  transition: all 0.15s ease;
  cursor: pointer;
  padding: 14px 16px;
}
.todo-card:hover {
  box-shadow: var(--shadow-card);
  border-color: transparent;
}
.todo-card--done {
  opacity: 0.55;
}
.todo-card__inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.todo-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.todo-card__title {
  font-size: 15px;
  color: var(--color-text-primary);
  font-weight: 500;
}
.todo-card__title.line-through {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}
.todo-card__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.todo-card__deadline {
  font-size: 12px;
  color: var(--color-accent-soft);
  font-weight: 500;
}
</style>
