<script setup lang="ts">
import type { Todo } from '@/repositories/TodoRepository'
import { NCard, NCheckbox } from 'naive-ui'

const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: string]
  click: [id: string]
}>()

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const priorityColors: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#6B7280',
}

const categoryLabels: Record<string, string> = {
  teaching: '教学',
  life: '生活',
  growth: '成长',
}

function onCheck() {
  emit('toggle', props.todo.id)
}
</script>

<template>
  <NCard
    class="todo-card"
    :class="{ 'todo-card--done': todo.completed }"
    hoverable
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
        <div class="todo-card__meta">
          <span class="todo-card__category">
            {{ categoryLabels[todo.category] || todo.category }}
          </span>
          <span
            class="todo-card__priority"
            :style="{ color: priorityColors[todo.priority] }"
          >
            {{ priorityLabels[todo.priority] || todo.priority }}
          </span>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.todo-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition: opacity 0.2s ease;
}

.todo-card--done {
  opacity: 0.55;
}

.todo-card :deep(.n-card__content) {
  padding: 12px 16px;
}

.todo-card__inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.todo-card__body {
  flex: 1;
  min-width: 0;
}

.todo-card__title {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 4px;
}

.todo-card__title.line-through {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.todo-card__meta {
  display: flex;
  gap: 8px;
  font-size: var(--font-caption);
}

.todo-card__category {
  color: var(--color-text-secondary);
  background: rgba(79, 142, 247, 0.08);
  padding: 1px 8px;
  border-radius: 4px;
}

.todo-card__priority {
  font-weight: 600;
}
</style>
