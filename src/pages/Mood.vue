<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { PRESET_MOODS, EMOJI_CHOICES, todayStr, useMoodStore } from '@/stores/mood'
import { AppSection, AppCard, AppIcon } from '@/components/ui'

const moodStore = useMoodStore()
const message = useMessage()

const today = todayStr()

// ==========================================
// 今日展示
// ==========================================
const todayDisplay = computed(() => {
  const d = new Date(today + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
})

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ==========================================
// 选择的心情（预设 + 自定义）
// ==========================================
const selected = ref<{ label: string; emoji: string } | null>(null)
const note = ref('')

function selectMood(item: { label: string; emoji: string }) {
  selected.value = { label: item.label, emoji: item.emoji }
}

async function handleSave() {
  if (!selected.value) {
    message.warning('请先选择一个心情')
    return
  }
  try {
    await moodStore.addRecord(selected.value.label, selected.value.emoji, note.value)
    note.value = ''
    message.success('心情已记录')
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '保存失败')
  }
}

async function handleDeleteRecord(id: string) {
  if (!confirm('删除这条心情记录？')) return
  try {
    await moodStore.removeRecord(id)
    message.success('已删除')
  } catch { message.error('删除失败') }
}

// ==========================================
// 自定义心情选项
// ==========================================
const showAddModal = ref(false)
const addLabel = ref('')
const addEmoji = ref(EMOJI_CHOICES[0])
const adding = ref(false)

function openAddModal() {
  addLabel.value = ''
  addEmoji.value = EMOJI_CHOICES[0]
  showAddModal.value = true
}

async function handleAddOption() {
  if (!addLabel.value.trim()) {
    message.warning('请输入心情名称')
    return
  }
  adding.value = true
  try {
    await moodStore.addOption(addLabel.value.trim(), addEmoji.value)
    showAddModal.value = false
    message.success('自定义心情已添加')
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '添加失败')
  } finally {
    adding.value = false
  }
}

async function handleDeleteOption(id: string) {
  if (!confirm('删除这个自定义心情？')) return
  try {
    await moodStore.removeOption(id)
    message.success('已删除')
  } catch { message.error('删除失败') }
}

// ==========================================
// 加载
// ==========================================
onMounted(() => {
  moodStore.loadAll()
})
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
          一天可以记录多条心情，随时回顾与删除
        </p>
      </div>
      <span class="mood-page__date-badge">{{ todayDisplay }}</span>
    </div>

    <!-- ====== 今日心情 ====== -->
    <AppSection title="今日心情">
      <div v-if="moodStore.todayRecords.length === 0" class="mood-page__empty-today">
        <AppIcon name="smile" size="22" />
        <span>今天还没有记录，选择一种心情开始吧</span>
      </div>
      <AppCard v-else no-padding>
        <div class="mood-today-list">
          <div
            v-for="r in moodStore.todayRecords"
            :key="r.id"
            class="mood-today-row"
          >
            <span class="mood-today-row__emoji">{{ r.emoji }}</span>
            <div class="mood-today-row__body">
              <span class="mood-today-row__label">{{ r.label }}</span>
              <span v-if="r.note" class="mood-today-row__note">{{ r.note }}</span>
            </div>
            <span class="mood-today-row__time">{{ formatTime(r.created_at) }}</span>
            <button
              class="mood-today-row__del"
              title="删除"
              @click="handleDeleteRecord(r.id)"
            >
              ×
            </button>
          </div>
        </div>
      </AppCard>
    </AppSection>

    <!-- ====== 此刻的感受 ====== -->
    <AppSection title="此刻的感受">
      <div class="mood-grid">
        <button
          v-for="m in PRESET_MOODS"
          :key="'p-' + m.label"
          class="mood-option"
          :class="{ 'mood-option--active': selected?.label === m.label }"
          @click="selectMood(m)"
        >
          <span class="mood-option__emoji">{{ m.emoji }}</span>
          <span class="mood-option__label">{{ m.label }}</span>
        </button>

        <button
          v-for="o in moodStore.customOptions"
          :key="'c-' + o.id"
          class="mood-option mood-option--custom"
          :class="{ 'mood-option--active': selected?.label === o.label }"
          @click="selectMood(o)"
        >
          <span class="mood-option__emoji">{{ o.emoji }}</span>
          <span class="mood-option__label">{{ o.label }}</span>
          <span
            class="mood-option__remove"
            title="删除此自定义心情"
            @click.stop="handleDeleteOption(o.id)"
          >
            ×
          </span>
        </button>

        <!-- 自定义添加按钮 -->
        <button class="mood-option mood-option--add" @click="openAddModal">
          <span class="mood-option__emoji">
            <AppIcon name="plus" size="20" />
          </span>
          <span class="mood-option__label">自定义</span>
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
        :disabled="!selected"
        @click="handleSave"
      >
        记录这条心情
      </button>
    </div>

    <!-- ====== 全部记录 ====== -->
    <AppSection title="全部记录">
      <AppCard v-if="moodStore.records.length > 0" no-padding>
        <div class="mood-history">
          <div
            v-for="r in moodStore.records"
            :key="r.id"
            class="mood-history__row"
          >
            <span class="mood-history__emoji">{{ r.emoji }}</span>
            <div class="mood-history__body">
              <span class="mood-history__label">{{ r.label }}</span>
              <span v-if="r.note" class="mood-history__note">{{ r.note }}</span>
            </div>
            <span class="mood-history__date">
              {{ r.mood_date }} {{ formatTime(r.created_at) }}
            </span>
            <button
              class="mood-history__del"
              title="删除"
              @click="handleDeleteRecord(r.id)"
            >
              ×
            </button>
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

    <!-- ====== 自定义心情 Modal ====== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddModal" class="mood-modal" @click.self="showAddModal = false">
          <div class="mood-modal__sheet">
            <h3 class="mood-modal__title">
              自定义心情
            </h3>

            <label class="mood-modal__label">心情名称</label>
            <input
              v-model="addLabel"
              class="mood-modal__input"
              placeholder="如：想家、开心、备考…"
              maxlength="10"
            />

            <label class="mood-modal__label">选择一个 emoji</label>
            <div class="mood-modal__emojis">
              <button
                v-for="e in EMOJI_CHOICES"
                :key="e"
                class="mood-modal__emoji"
                :class="{ 'mood-modal__emoji--active': addEmoji === e }"
                @click="addEmoji = e"
              >
                {{ e }}
              </button>
            </div>

            <div class="mood-modal__actions">
              <button class="mood-modal__btn mood-modal__btn--cancel" @click="showAddModal = false">
                取消
              </button>
              <button
                class="mood-modal__btn mood-modal__btn--save"
                :disabled="adding"
                @click="handleAddOption"
              >
                {{ adding ? '添加中…' : '添加' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ================================================
   Mood — 今日心情（数据库多记录版）
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

/* ---- 今日空态 ---- */
.mood-page__empty-today {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 22px;
  border-radius: var(--radius-card, 24px);
  background: var(--color-bg);
  color: var(--color-text-tertiary);
  font-size: var(--font-secondary);
}

/* ---- 今日记录列表 ---- */
.mood-today-list {
  display: flex;
  flex-direction: column;
}

.mood-today-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

.mood-today-row:last-child {
  border-bottom: none;
}

.mood-today-row__emoji {
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
}

.mood-today-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mood-today-row__label {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.mood-today-row__note {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mood-today-row__time {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.mood-today-row__del {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(194, 103, 106, 0.08);
  color: var(--color-error);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.mood-today-row__del:hover {
  background: rgba(194, 103, 106, 0.18);
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
  position: relative;
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
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.mood-option--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 0 0 1px var(--color-primary) inset;
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

/* 自定义选项删除角标 */
.mood-option--custom .mood-option__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(194, 103, 106, 0.1);
  color: var(--color-error);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.mood-option--custom:hover .mood-option__remove {
  opacity: 1;
}

/* 添加按钮 */
.mood-option--add {
  border-style: dashed;
  border-color: var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-tertiary);
}

.mood-option--add:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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

/* ---- 全部记录 ---- */
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
  font-variant-numeric: tabular-nums;
}

.mood-history__del {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(194, 103, 106, 0.08);
  color: var(--color-error);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.mood-history__del:hover {
  background: rgba(194, 103, 106, 0.18);
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

/* ---- 自定义心情 Modal ---- */
.mood-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mood-modal__sheet {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-white);
  border-radius: var(--radius-2xl);
  padding: 28px 24px;
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.mood-modal__title {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 20px;
  text-align: center;
}

.mood-modal__label {
  display: block;
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.mood-modal__input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  margin-bottom: 18px;
  transition: border-color var(--transition-fast);
}

.mood-modal__input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.mood-modal__emojis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 24px;
}

.mood-modal__emoji {
  font-size: 22px;
  line-height: 1;
  padding: 8px 0;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mood-modal__emoji:hover {
  border-color: var(--color-primary);
}

.mood-modal__emoji--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 0 0 1px var(--color-primary) inset;
}

.mood-modal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.mood-modal__btn {
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mood-modal__btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.mood-modal__btn--cancel:hover {
  background: var(--color-border-light);
}

.mood-modal__btn--save {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

.mood-modal__btn--save:hover {
  background: var(--color-primary-dark);
}

.mood-modal__btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s;
}

.modal-enter-active .mood-modal__sheet,
.modal-leave-active .mood-modal__sheet {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .mood-modal__sheet {
  transform: translateY(40px);
}

.modal-leave-to .mood-modal__sheet {
  transform: translateY(40px);
}
</style>
