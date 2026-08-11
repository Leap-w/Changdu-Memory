<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '@/repositories/TodoRepository'
import { formatLocalDate } from '@/utils/date'

const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: string]
  click: [id: string]      // 点击卡片 → 编辑（无独立编辑按钮）
  delete: [id: string]
}>()

function onCheck() {
  emit('toggle', props.todo.id)
}

/** 相对日期标签：今天 / 明天 / 已过期 / X月X日 */
const dateTag = computed(() => {
  const today = formatLocalDate()
  const date = props.todo.todo_date
  if (date === today) return { label: '今天', cls: 'today' }
  const tomorrow = formatLocalDate(new Date(Date.now() + 86400000))
  if (date === tomorrow) return { label: '明天', cls: '' }
  if (date < today) {
    if (props.todo.completed) {
      const d = new Date(date + 'T00:00:00')
      return { label: `${d.getMonth() + 1}月${d.getDate()}日`, cls: '' }
    }
    return { label: '已过期', cls: 'overdue' }
  }
  const d = new Date(date + 'T00:00:00')
  return { label: `${d.getMonth() + 1}月${d.getDate()}日`, cls: '' }
})

const CATEGORY_TAGS: Record<string, { label: string; cls: string }> = {
  teaching: { label: '教学', cls: 'teaching' },
  life: { label: '生活', cls: 'life' },
  growth: { label: '成长', cls: 'growth' },
}
const categoryTag = computed(() => CATEGORY_TAGS[props.todo.category] ?? null)

const deadlineText = computed(() => {
  const dd = props.todo.deadline_date
  const dt = props.todo.deadline_time
  if (!dd) return ''
  return dt ? `${dd} ${dt}` : dd
})
</script>

<template>
  <div
    class="todo-item"
    :class="{ completed: todo.completed }"
    @click="emit('click', todo.id)"
  >
    <!-- 圆形勾选 -->
    <div
      class="todo-check"
      :class="{ checked: todo.completed }"
      role="checkbox"
      :aria-checked="todo.completed"
      tabindex="0"
      @click.stop="onCheck"
      @keydown.enter.prevent="onCheck"
      @keydown.space.prevent="onCheck"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><polyline points="20 6 9 17 4 12" /></svg>
    </div>

    <!-- 内容区：点击进入编辑 -->
    <div class="todo-content">
      <div class="todo-text" :class="{ done: todo.completed }">
        {{ todo.title }}
      </div>
      <div class="todo-meta">
        <span class="todo-tag" :class="dateTag.cls ? `tag-${dateTag.cls}` : ''">
          {{ dateTag.label }}
        </span>
        <span
          v-if="categoryTag"
          class="todo-tag"
          :class="`tag-${categoryTag.cls}`"
        >
          {{ categoryTag.label }}
        </span>
        <span v-if="deadlineText" class="todo-deadline">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          {{ deadlineText }}
        </span>
      </div>
      <div v-if="todo.description" class="todo-desc">
        {{ todo.description }}
      </div>
    </div>

    <!-- 操作区：仅删除（编辑通过点击条目进入） -->
    <div class="todo-actions">
      <button
        class="action-btn action-btn--delete"
        title="删除"
        aria-label="删除"
        @click.stop="emit('delete', todo.id)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ================================================
   TodoCard — 参照 待办1.1.html 重构
   无编辑按钮：点击整条进入编辑；圆形勾选 + 标签 + 删除
   ================================================ */
.todo-item {
  background: var(--color-bg-white);
  border-radius: 16px;
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--color-border-light);
  padding: 14px 14px 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  cursor: pointer;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
  animation: cardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.todo-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}

.todo-item.completed {
  opacity: 0.55;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
  text-decoration-thickness: 1px;
}

.todo-item.completed .todo-tag {
  opacity: 0.7;
}

/* ---- 圆形勾选 ---- */
.todo-check {
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 50%;
  border: 1.8px solid var(--color-border-medium);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.22s ease;
  background: transparent;
  position: relative;
  color: #fff;
}

.todo-check:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.todo-item.completed .todo-check {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.todo-check svg {
  width: 11px;
  height: 11px;
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.18s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.todo-item.completed .todo-check svg {
  opacity: 1;
  transform: scale(1);
}

/* ---- 内容区 ---- */
.todo-content {
  flex: 1;
  min-width: 0;
  padding-top: 1px;
}

.todo-text {
  font-size: 15.5px;
  font-weight: 450;
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.todo-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.todo-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.todo-tag.tag-today { color: var(--color-primary); background: var(--color-primary-bg); }
.todo-tag.tag-overdue { color: var(--color-error); background: rgba(194, 103, 106, 0.1); }
.todo-tag.tag-teaching { color: var(--color-sky); background: rgba(111, 168, 220, 0.12); }
.todo-tag.tag-life { color: var(--color-gold); background: rgba(214, 168, 79, 0.12); }
.todo-tag.tag-growth { color: var(--color-secondary); background: rgba(107, 158, 133, 0.12); }

.todo-deadline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--color-text-tertiary);
}

.todo-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 操作区：删除（常显但弱化，hover 加强） ---- */
.todo-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  margin-top: -2px;
  opacity: 0.35;
  transition: opacity var(--transition-fast);
}

.todo-item:hover .todo-actions,
.todo-item:focus-within .todo-actions {
  opacity: 1;
}

@media (hover: none) {
  .todo-actions {
    opacity: 0.55;
  }
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-primary);
}

.action-btn--delete:hover,
.action-btn--delete:active {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn:active {
  transform: scale(0.92);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 420px) {
  .todo-item {
    padding: 13px 12px 13px 14px;
    gap: 12px;
  }

  .todo-text {
    font-size: 15px;
  }
}
</style>
