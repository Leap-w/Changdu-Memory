<script setup lang="ts">
import type { Todo } from '@/repositories/TodoRepository'
import { NCheckbox } from 'naive-ui'

const props = defineProps<{
  todo: Todo
  /** 批量选择模式：显示左侧选择框 */
  selectable?: boolean
  /** 是否已选中 */
  selected?: boolean
}>()

const emit = defineEmits<{
  toggle: [id: string]
  click: [id: string]      // 点击卡片 → 编辑
  delete: [id: string]
  select: [id: string]
}>()

function onCheck() {
  emit('toggle', props.todo.id)
}

function onSelect() {
  emit('select', props.todo.id)
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
    :class="{ 'todo-card--done': todo.completed, 'todo-card--selected': selected }"
    @click="emit('click', todo.id)"
  >
    <div class="todo-card__inner">
      <!-- 批量选择框 -->
      <NCheckbox
        v-if="selectable"
        :checked="selected"
        :on-update:checked="onSelect"
        class="todo-card__select"
        @click.stop
      />

      <!-- 完成勾选 -->
      <NCheckbox
        :checked="todo.completed"
        :on-update:checked="onCheck"
        class="todo-card__check"
        @click.stop
      />

      <div class="todo-card__body">
        <span class="todo-card__title" :class="{ 'line-through': todo.completed }">
          {{ todo.title }}
        </span>
        <div v-if="todo.description" class="todo-card__desc">
          {{ todo.description }}
        </div>
        <div v-if="formatDeadline(todo)" class="todo-card__deadline">
          <svg
            class="todo-card__deadline-icon"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="2"
              ry="2"
            /><line
              x1="16"
              y1="2"
              x2="16"
              y2="6"
            /><line
              x1="8"
              y1="2"
              x2="8"
              y2="6"
            /><line
              x1="3"
              y1="10"
              x2="21"
              y2="10"
            />
          </svg>
          <span>{{ formatDeadline(todo) }}</span>
        </div>
      </div>

      <!-- 操作区：编辑 / 删除（hover 显示） -->
      <div class="todo-card__actions">
        <button
          class="todo-card__action"
          title="编辑"
          @click.stop="emit('click', todo.id)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
        </button>
        <button
          class="todo-card__action todo-card__action--danger"
          title="删除"
          @click.stop="emit('delete', todo.id)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   TodoCard — 与系统毛玻璃卡片(AppCard)风格统一
   ================================================ */
.todo-card {
  background: var(--glass-bg-card, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
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
.todo-card--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.todo-card__inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.todo-card__select,
.todo-card__check {
  flex-shrink: 0;
  margin-top: 2px;
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
  overflow-wrap: break-word;
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

/* 截止时间：flex 布局让图标与文字垂直居中（修复图标偏上） */
.todo-card__deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-accent-soft);
  font-weight: 500;
  line-height: 1.2;
}

.todo-card__deadline-icon {
  flex-shrink: 0;
  display: block;
}

/* 操作区：hover 显示 */
.todo-card__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.todo-card:hover .todo-card__actions {
  opacity: 1;
}

.todo-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.todo-card__action:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.todo-card__action--danger:hover {
  color: var(--color-error);
  background: rgba(194, 103, 106, 0.08);
}
</style>
