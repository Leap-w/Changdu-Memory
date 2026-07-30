<script setup lang="ts">
import type { Diary } from '@/repositories/DiaryRepository'
import { AppCard } from '@/components/ui'

defineProps<{
  diary: Diary
  tags?: { id: string; name: string; color: string }[]
  thumbnail?: string
}>()

const emit = defineEmits<{ click: [id: string] }>()

function excerpt(content: string | null, maxLen = 100): string {
  if (!content) return ''
  return content.replace(/\s+/g, ' ').trim().slice(0, maxLen) + (content.length > maxLen ? '…' : '')
}

function formatDate(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00')
  return { day: String(d.getDate()).padStart(2, '0'), month: `${d.getMonth() + 1}月` }
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}
</script>

<template>
  <AppCard hoverable class="dc" @click="emit('click', diary.id)">
    <div class="dc__inner">
      <!-- Date block -->
      <div class="dc__date">
        <span class="dc__date-month">{{ formatDate(diary.diary_date).month }}</span>
        <span class="dc__date-day">{{ formatDate(diary.diary_date).day }}</span>
        <span class="dc__date-week">{{ formatWeekday(diary.diary_date) }}</span>
      </div>

      <!-- Body -->
      <div class="dc__body">
        <h3 class="dc__title">{{ diary.title || '无标题' }}</h3>
        <p v-if="diary.content" class="dc__excerpt">{{ excerpt(diary.content) }}</p>

        <!-- Tags -->
        <div v-if="tags && tags.length" class="dc__tags">
          <span v-for="t in tags.slice(0, 3)" :key="t.id" class="dc__tag" :style="{ color: t.color, background: t.color + '14' }">
            {{ t.name }}
          </span>
          <span v-if="tags.length > 3" class="dc__tag-more">+{{ tags.length - 3 }}</span>
        </div>
      </div>

      <!-- Thumbnail -->
      <img v-if="thumbnail" :src="thumbnail" class="dc__thumb" alt="" loading="lazy" />

      <!-- Arrow -->
      <svg class="dc__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </AppCard>
</template>

<style scoped>
.dc__inner { display:flex;align-items:center;gap:14px; }

/* Date block */
.dc__date { display:flex;flex-direction:column;align-items:center;min-width:52px;flex-shrink:0; }
.dc__date-month { font-size:11px;color:var(--color-text-tertiary);text-transform:uppercase; }
.dc__date-day { font-size:24px;font-weight:700;color:var(--color-text-primary);line-height:1; }
.dc__date-week { font-size:10px;color:var(--color-text-tertiary);margin-top:2px; }

/* Body */
.dc__body { flex:1;min-width:0; }
.dc__title { font-size:16px;font-weight:600;color:var(--color-text-primary);margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.dc__excerpt { font-size:13px;color:var(--color-text-secondary);margin:0 0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.dc__tags { display:flex;gap:4px;flex-wrap:wrap; }
.dc__tag { font-size:10px;padding:1px 7px;border-radius:4px;font-weight:600;white-space:nowrap; }
.dc__tag-more { font-size:10px;color:var(--color-text-tertiary);padding:1px 4px; }

/* Thumbnail */
.dc__thumb { width:56px;height:56px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0; }
.dc__arrow { color:var(--color-text-tertiary);flex-shrink:0;opacity:.3; }

@media (max-width:500px) {
  .dc__inner { gap:10px; }
  .dc__date { min-width:44px; }
  .dc__date-day { font-size:20px; }
  .dc__thumb { width:44px;height:44px; }
}
</style>
