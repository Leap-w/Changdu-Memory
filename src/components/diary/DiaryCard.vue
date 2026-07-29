<script setup lang="ts">
import type { Diary } from '@/repositories/DiaryRepository'
import { NCard } from 'naive-ui'

defineProps<{
  diary: Diary
}>()

const emit = defineEmits<{
  click: [id: string]
}>()

/** 截取正文预览 */
function excerpt(content: string | null, maxLen = 80): string {
  if (!content) return ''
  const plain = content.replace(/\s+/g, ' ').trim()
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 星期 */
function dayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
}
</script>

<template>
  <NCard class="diary-card" hoverable @click="emit('click', diary.id)">
    <div class="diary-card__inner">
      <div class="diary-card__date">
        <span class="date-day">{{ formatDate(diary.diary_date) }}</span>
        <span class="date-week">{{ dayOfWeek(diary.diary_date) }}</span>
      </div>
      <div class="diary-card__body">
        <h3 class="diary-card__title">
          {{ diary.title || '无标题' }}
        </h3>
        <p class="diary-card__excerpt">
          {{ excerpt(diary.content) || '暂无内容' }}
        </p>
      </div>
      <div class="diary-card__arrow">
        ›
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.diary-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.diary-card:hover {
  transform: translateX(4px);
}

.diary-card :deep(.n-card__content) {
  padding: 0;
}

.diary-card__inner {
  display: flex;
  align-items: center;
  gap: var(--spacing-card);
  padding: var(--spacing-card);
}

.diary-card__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 56px;
  background: rgba(79, 142, 247, 0.08);
  border-radius: 12px;
}

.date-day {
  font-size: var(--font-content);
  font-weight: 700;
  color: var(--color-primary);
}

.date-week {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.diary-card__body {
  flex: 1;
  min-width: 0;
}

.diary-card__title {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diary-card__excerpt {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diary-card__arrow {
  font-size: 24px;
  color: var(--color-text-secondary);
  opacity: 0.3;
  flex-shrink: 0;
}
</style>
