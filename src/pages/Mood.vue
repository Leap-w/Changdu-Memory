<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import {
  MOODS,
  getToday,
  getTodayMood,
  getMoodHistory,
  saveTodayMood,
  removeTodayMood,
} from '@/utils/mood'
import type { MoodRecord } from '@/utils/mood'
import { AppSection, AppCard, AppIcon } from '@/components/ui'

const message = useMessage()

// ==========================================
// 今日心情
// ==========================================
const today = getToday()
const selectedKey = ref(getTodayMood()?.key ?? '')
const note = ref(getTodayMood()?.note ?? '')
const todayRecord = ref<MoodRecord | null>(getTodayMood())

const todayDisplay = computed(() => {
  const d = new Date(today + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
})

function selectMood(key: string) {
  selectedKey.value = key
}

function handleSave() {
  if (!selectedKey.value) {
    message.warning('请先选择一个心情')
    return
  }
  todayRecord.value = saveTodayMood(selectedKey.value, note.value)
  history.value = getMoodHistory()
  message.success('今日心情已保存')
}

function handleClear() {
  if (!todayRecord.value) return
  removeTodayMood()
  todayRecord.value = null
  selectedKey.value = ''
  note.value = ''
  history.value = getMoodHistory()
  message.success('已清除今日心情')
}

// ==========================================
// 最近记录（localStorage 历史）
// ==========================================
const history = ref<MoodRecord[]>(getMoodHistory().slice(0, 14))
</script>

<template>
  <div class="mood-page">
    <!-- ====== Page header ====== -->
    <div class="mood-page__header">
      <div class="mood-page__header-titles">
        <h1 class="mood-page__title">
          今日心情
        </h1>
        <p class="mood-page__sub">
          一个不需要存进档案的轻量记录 · 仅保存在本机
        </p>
      </div>
      <span class="mood-page__date-badge">{{ todayDisplay }}</span>
    </div>

    <!-- ====== 今日心情状态 ====== -->
    <AppSection title="今日心情">
      <AppCard v-if="todayRecord" class="mood-page__summary" padding="md">
        <div class="mood-summary">
          <span class="mood-summary__emoji">{{ todayRecord.emoji }}</span>
          <div class="mood-summary__info">
            <span class="mood-summary__label">{{ todayRecord.label }}</span>
            <span v-if="todayRecord.note" class="mood-summary__note">{{ todayRecord.note }}</span>
          </div>
          <button class="mood-summary__clear" @click="handleClear">
            清除
          </button>
        </div>
      </AppCard>
      <AppCard v-else class="mood-page__summary" padding="md">
        <div class="mood-summary mood-summary--empty">
          <AppIcon name="smile" size="22" />
          <span class="mood-summary__hint">今天还没有记录，选择一种心情开始吧</span>
        </div>
      </AppCard>
    </AppSection>

    <!-- ====== 心情选择 ====== -->
    <AppSection title="此刻的感受">
      <div class="mood-grid">
        <button
          v-for="m in MOODS"
          :key="m.key"
          class="mood-option"
          :class="{ 'mood-option--active': selectedKey === m.key }"
          :style="{ '--mood-color': m.color }"
          @click="selectMood(m.key)"
        >
          <span class="mood-option__emoji">{{ m.emoji }}</span>
          <span class="mood-option__label">{{ m.label }}</span>
        </button>
      </div>
    </AppSection>

    <!-- ====== 备注 ====== -->
    <AppSection title="想说点什么（选填）">
      <textarea
        v-model="note"
        class="mood-page__textarea"
        placeholder="记录此刻的心情，比如：孩子们今天朗读很积极…"
        rows="4"
        maxlength="500"
      />
    </AppSection>

    <!-- ====== Actions ====== -->
    <div class="mood-actions">
      <button
        class="mood-btn mood-btn--save"
        :disabled="!selectedKey"
        @click="handleSave"
      >
        {{ todayRecord ? '更新今日心情' : '保存今日心情' }}
      </button>
    </div>

    <!-- ====== 最近记录 ====== -->
    <AppSection title="最近记录">
      <AppCard v-if="history.length > 0" no-padding>
        <div class="mood-history">
          <div
            v-for="r in history"
            :key="r.date"
            class="mood-history__row"
          >
            <span class="mood-history__emoji">{{ r.emoji }}</span>
            <div class="mood-history__body">
              <span class="mood-history__label">{{ r.label }}</span>
              <span v-if="r.note" class="mood-history__note">{{ r.note }}</span>
            </div>
            <span class="mood-history__date">{{ r.date }}</span>
          </div>
        </div>
      </AppCard>
      <div v-else class="mood-empty">
        <p class="mood-empty__text">
          还没有心情记录，从今天开始吧
        </p>
      </div>
    </AppSection>

    <div class="mood-page__footer-space" />
  </div>
</template>

<style scoped>
/* ================================================
   Mood — 今日心情
   ================================================ */
.mood-page {
  max-width: 720px;
  margin: 0 auto;
}

/* ---- Header ---- */
.mood-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.mood-page__header-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mood-page__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.mood-page__sub {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.mood-page__date-badge {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ---- Summary ---- */
.mood-summary {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mood-summary__emoji {
  font-size: 34px;
  line-height: 1;
  flex-shrink: 0;
}

.mood-summary__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mood-summary__label {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.mood-summary__note {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.mood-summary__clear {
  padding: 6px 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: var(--font-caption);
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.mood-summary__clear:hover {
  color: var(--color-error);
  border-color: var(--color-error);
  background: rgba(194, 103, 106, 0.06);
}

.mood-summary--empty {
  justify-content: center;
  color: var(--color-text-tertiary);
  padding: 12px;
}

.mood-summary--empty .mood-summary__hint {
  font-size: var(--font-secondary);
}

/* ---- Mood grid ---- */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 480px) {
  .mood-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg-white);
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.mood-option:hover {
  border-color: var(--mood-color);
  background: var(--color-primary-bg);
}

.mood-option--active {
  border-color: var(--mood-color);
  background: var(--color-primary-bg);
  box-shadow: 0 0 0 1px var(--mood-color) inset;
}

.mood-option__emoji {
  font-size: 26px;
  line-height: 1;
}

.mood-option__label {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* ---- Textarea ---- */
.mood-page__textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-content);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  resize: vertical;
  line-height: 1.7;
  transition: border-color var(--transition-fast);
}

.mood-page__textarea:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

/* ---- Actions ---- */
.mood-actions {
  display: flex;
  justify-content: center;
  margin: 4px 0 var(--spacing-xl);
}

.mood-btn--save {
  padding: 11px 32px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-content);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.mood-btn--save:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.mood-btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ---- History ---- */
.mood-history__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

.mood-history__row:last-child {
  border-bottom: none;
}

.mood-history__emoji {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.mood-history__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mood-history__label {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.mood-history__note {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mood-history__date {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.mood-empty {
  text-align: center;
  padding: 24px;
}

.mood-empty__text {
  font-size: var(--font-secondary);
  color: var(--color-text-tertiary);
  margin: 0;
}

.mood-page__footer-space {
  height: var(--spacing-page, 24px);
}
</style>
