<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeStore, getCountdownStats } from '@/stores/time'
import { useMemoryStore } from '@/stores/memory'
import type { Countdown } from '@/repositories/TimeRepository'
import type { Memory } from '@/repositories/MemoryRepository'
import { AppCard, AppSection, AppIcon } from '@/components/ui'
import { tsToDateStr, dateStrToTs } from '@/utils/date'
import {
  NButton, NInput, NDatePicker, NForm, NFormItem,
  NModal, NSpace, NSpin,
  useMessage,
} from 'naive-ui'

const timeStore = useTimeStore()
const memoryStore = useMemoryStore()
const message = useMessage()

// ====== Data loading ======
onMounted(() => {
  timeStore.loadTimeProfile()
  timeStore.loadCountdowns()
  if (memoryStore.memories.length === 0) memoryStore.loadMemories()
})

// ====== 大事记（仅展示，修改入口仍在设置里） ======
const memoryGroups = computed(() => {
  const groups: { month: string; items: Memory[] }[] = []
  for (const m of memoryStore.memories) {
    const month = (m.event_date || '').substring(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === month) last.items.push(m)
    else groups.push({ month, items: [m] })
  }
  return groups
})

function formatMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${y}年${parseInt(mo)}月`
}

function formatMemoryDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// ====== Main project edit modal ======
const showEditModal = ref(false)
const editForm = ref({
  project_name: '', location: '',
  start_date: null as number | null, end_date: null as number | null,
})
const editLoading = ref(false)

function openEditModal() {
  if (!timeStore.profile) return
  const p = timeStore.profile
  editForm.value = {
    project_name: p.project_name ?? '',
    location: p.location ?? '',
    start_date: p.start_date ? dateStrToTs(p.start_date) : null,
    end_date: p.end_date ? dateStrToTs(p.end_date) : null,
  }
  showEditModal.value = true
}

async function handleSave() {
  if (!editForm.value.start_date || !editForm.value.end_date) {
    message.warning('请选择开始和结束日期'); return
  }
  editLoading.value = true
  try {
    const toDateStr = (ts: number) => tsToDateStr(ts)
    await timeStore.updateProfile({
      project_name: editForm.value.project_name,
      location: editForm.value.location,
      start_date: toDateStr(editForm.value.start_date),
      end_date: toDateStr(editForm.value.end_date),
    })
    message.success('已更新')
    showEditModal.value = false
  } catch { message.error('更新失败') }
  finally { editLoading.value = false }
}

// ====== Countdown modal ======
const showCountdownModal = ref(false)
const editingCountdown = ref<Countdown | null>(null)
const cdForm = ref({ title: '', target_date: null as number | null })
const cdLoading = ref(false)

function openCreateCountdown() {
  editingCountdown.value = null
  cdForm.value = { title: '', target_date: Date.now() + 86400000 * 30 }
  showCountdownModal.value = true
}

function openEditCountdown(cd: Countdown) {
  editingCountdown.value = cd
  cdForm.value = {
    title: cd.title,
    target_date: new Date(cd.end_date + 'T00:00:00').getTime(),
  }
  showCountdownModal.value = true
}

async function handleCdSave() {
  if (!cdForm.value.title.trim()) { message.warning('请输入标题'); return }
  if (!cdForm.value.target_date) { message.warning('请选择目标日'); return }
  cdLoading.value = true
  try {
    const dateStr = tsToDateStr(cdForm.value.target_date)
    if (editingCountdown.value) {
      await timeStore.editCountdown(editingCountdown.value.id, {
        title: cdForm.value.title.trim(), end_date: dateStr,
      })
      message.success('已更新')
    } else {
      await timeStore.addCountdown({
        title: cdForm.value.title.trim(), end_date: dateStr,
      })
      message.success('已添加')
    }
    showCountdownModal.value = false
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '操作失败')
  }
  finally { cdLoading.value = false }
}

async function handleCdDelete(id: string) {
  try { await timeStore.removeCountdown(id); message.success('已删除') }
  catch { message.error('删除失败') }
}
</script>

<template>
  <NSpin :show="timeStore.loading">
    <div v-if="timeStore.profile" class="tc">
      <!-- ====== Page header ====== -->
      <div class="tc__header">
        <div class="tc__header-left">
          <h1 class="tc__title">
            时光中心
          </h1>
          <p class="tc__subtitle">
            旅程进度与值得收藏的瞬间
          </p>
        </div>
        <span class="tc__header-badge">{{ timeStore.profile.project_name }}</span>
      </div>

      <!-- ====== Time Hero ====== -->
      <div class="tc-hero">
        <div class="tc-hero__bg" />
        <div class="tc-hero__glow" />
        <div class="tc-hero__content">
          <div class="tc-hero__head">
            <span class="tc-hero__phase">{{ timeStore.phase }}</span>
            <span v-if="timeStore.profile.location" class="tc-hero__loc">
              <AppIcon name="pin" size="12" /> {{ timeStore.profile.location }}
            </span>
          </div>

          <div class="tc-hero__days-row">
            <div class="tc-hero__day-block">
              <span class="tc-hero__day-num">{{ timeStore.daysPassed }}</span>
              <span class="tc-hero__day-label">已过天数</span>
            </div>
            <div class="tc-hero__divider" />
            <div class="tc-hero__day-block">
              <span class="tc-hero__day-num">{{ timeStore.daysRemaining }}</span>
              <span class="tc-hero__day-label">剩余天数</span>
            </div>
            <div class="tc-hero__divider" />
            <div class="tc-hero__day-block">
              <span class="tc-hero__day-num">{{ timeStore.totalDays }}</span>
              <span class="tc-hero__day-label">总天数</span>
            </div>
          </div>

          <div class="tc-hero__progress">
            <div class="tc-hero__progress-track">
              <div
                class="tc-hero__progress-fill"
                :style="{ width: timeStore.progress + '%' }"
              />
            </div>
            <span class="tc-hero__progress-pct">{{ timeStore.progress }}%</span>
          </div>

          <button class="tc-hero__edit-btn" @click="openEditModal">
            <AppIcon name="settings" size="14" /> 调整时间
          </button>
        </div>
      </div>

      <!-- ====== 大事记（仅展示，修改入口仍在设置里） ====== -->
      <AppSection title="大事记" subtitle="珍藏的每一个重要瞬间" class="tc__section">
        <div v-if="memoryStore.memories.length === 0" class="tc-empty-text">
          还没有大事记，前往「记忆时间轴」记录
        </div>
        <div v-else class="tc-memories">
          <div v-for="group in memoryGroups" :key="group.month" class="tc-memories__group">
            <h3 class="tc-memories__month">
              {{ formatMonth(group.month) }}
            </h3>

            <div v-for="m in group.items" :key="m.id" class="tc-memory">
              <div class="tc-memory__gutter">
                <div class="tc-memory__dot" />
                <div class="tc-memory__line" />
              </div>

              <div class="tc-memory__body">
                <div class="tc-memory__head">
                  <h4 class="tc-memory__title">
                    {{ m.title }}
                  </h4>
                  <span class="tc-memory__date">{{ formatMemoryDay(m.event_date) }}</span>
                </div>
                <div v-if="m.location" class="tc-memory__loc">
                  <AppIcon name="pin" size="11" />
                  {{ m.location }}
                </div>
                <p v-if="m.content" class="tc-memory__desc">
                  {{ m.content.length > 120 ? m.content.slice(0, 120) + '…' : m.content }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppSection>

      <!-- ====== Custom Countdowns ====== -->
      <AppSection title="自定义倒计时" class="tc__section">
        <div class="tc__section-actions">
          <button class="tc__add-btn" @click="openCreateCountdown">
            <AppIcon name="plus" size="16" /> 添加
          </button>
        </div>

        <div v-if="timeStore.countdowns.length === 0" class="tc-empty-text">
          还没有自定义倒计时
        </div>

        <div v-else class="tc-cd-list">
          <AppCard
            v-for="cd in timeStore.countdowns"
            :key="cd.id"
            padding="md"
            class="tc-cd-card"
            :class="{ 'tc-cd-card--pinned': cd.pinned }"
          >
            <div class="tc-cd-card__inner">
              <div class="tc-cd-card__body">
                <div class="tc-cd-card__top">
                  <span v-if="cd.pinned" class="tc-cd-card__pin">
                    <AppIcon name="star" size="13" />
                  </span>
                  <span class="tc-cd-card__title">{{ cd.title }}</span>
                </div>
                <span class="tc-cd-card__date">目标日：{{ cd.end_date }}</span>
              </div>
              <div class="tc-cd-card__right">
                <span
                  class="tc-cd-card__count"
                  :class="{ 'is-past': getCountdownStats(cd).isPast }"
                >
                  {{ getCountdownStats(cd).label }}
                </span>
                <div class="tc-cd-card__actions">
                  <button
                    class="tc-cd-card__act"
                    @click="timeStore.togglePin(cd.id)"
                  >
                    {{ cd.pinned ? '取消置顶' : '置顶' }}
                  </button>
                  <button class="tc-cd-card__act" @click="openEditCountdown(cd)">
                    编辑
                  </button>
                  <button
                    class="tc-cd-card__act tc-cd-card__act--del"
                    @click="handleCdDelete(cd.id)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </AppSection>

      <!-- ====== MODALS ====== -->
      <!-- Main project edit modal -->
      <NModal
        v-model:show="showEditModal"
        preset="card"
        title="调整时间"
        :mask-closable="false"
        style="max-width:480px"
      >
        <NForm>
          <NFormItem label="项目名称">
            <NInput v-model:value="editForm.project_name" />
          </NFormItem>
          <NFormItem label="地点">
            <NInput v-model:value="editForm.location" />
          </NFormItem>
          <NFormItem label="开始日期">
            <NDatePicker
              v-model:value="editForm.start_date"
              type="date"
              :is-date-disabled="(ts: number) => editForm.end_date ? ts > editForm.end_date : false"
              style="width:100%"
            />
          </NFormItem>
          <NFormItem label="结束日期">
            <NDatePicker
              v-model:value="editForm.end_date"
              type="date"
              :is-date-disabled="(ts: number) => editForm.start_date ? ts < editForm.start_date : false"
              style="width:100%"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showEditModal = false">
              取消
            </NButton>
            <NButton type="primary" :loading="editLoading" @click="handleSave">
              保存
            </NButton>
          </NSpace>
        </template>
      </NModal>

      <!-- Countdown modal -->
      <NModal
        v-model:show="showCountdownModal"
        preset="card"
        :title="editingCountdown ? '编辑倒计时' : '添加倒计时'"
        style="max-width:480px"
      >
        <NForm>
          <NFormItem label="事件名称" required>
            <NInput
              v-model:value="cdForm.title"
              placeholder="例如：寒假、生日、考试..."
              maxlength="50"
            />
          </NFormItem>
          <NFormItem label="目标日" required>
            <NDatePicker
              v-model:value="cdForm.target_date"
              type="date"
              style="width:100%"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showCountdownModal = false">
              取消
            </NButton>
            <NButton type="primary" :loading="cdLoading" @click="handleCdSave">
              保存
            </NButton>
          </NSpace>
        </template>
      </NModal>
    </div>
  </NSpin>
</template>

<style scoped>
.tc {
  max-width: 800px;
  margin: 0 auto;
}

/* ---- Header ---- */
.tc__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tc__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tc__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.tc__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.tc__header-badge {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ==========================================
   Time Hero
   ========================================== */
.tc-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-2xl, 32px);
  margin-bottom: var(--spacing-2xl);
}

.tc-hero__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #101820 0%, #1a3c3a 35%, var(--color-primary-dark) 70%, var(--color-primary) 100%);
  z-index: 0;
}

.tc-hero__glow {
  position: absolute;
  top: -30%;
  right: -15%;
  width: 55%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(111, 168, 220, 0.2) 0%, transparent 70%);
  z-index: 1;
}

.tc-hero__content {
  position: relative;
  z-index: 2;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #fff;
}

.tc-hero__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tc-hero__phase {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.tc-hero__loc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-caption);
  opacity: 0.6;
}

.tc-hero__days-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.tc-hero__day-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tc-hero__day-num {
  font-size: 38px;
  font-weight: var(--font-weight-extrabold);
  line-height: 1;
  letter-spacing: -1px;
}

.tc-hero__day-label {
  font-size: 11px;
  opacity: 0.65;
}

.tc-hero__divider {
  width: 1px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
}

.tc-hero__progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tc-hero__progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.tc-hero__progress-fill {
  height: 100%;
  background: var(--color-gold);
  border-radius: 3px;
  transition: width 800ms ease;
}

.tc-hero__progress-pct {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  min-width: 40px;
  text-align: right;
}

.tc-hero__edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  font-family: inherit;
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  align-self: center;
}

.tc-hero__edit-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* ==========================================
   大事记列表（仅展示）
   ========================================== */
.tc__section {
  margin-bottom: var(--spacing-2xl);
}

.tc-memories__group {
  margin-bottom: 18px;
}

.tc-memories__month {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0 0 6px;
}

.tc-memory {
  display: flex;
  gap: 16px;
  padding: 2px 0;
}

.tc-memory__gutter {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
  padding-top: 6px;
}

.tc-memory__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-bg-white);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.tc-memory__line {
  flex: 1;
  width: 2px;
  min-height: 24px;
  background: var(--color-border-light);
  margin-top: 4px;
}

.tc-memory__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px 0 14px;
  padding-left: 4px;
  flex: 1;
  min-width: 0;
}

.tc-memory__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.tc-memory__title {
  flex: 1;
  min-width: 0;
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-memory__date {
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  flex-shrink: 0;
}

.tc-memory__loc {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-bg);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  width: fit-content;
  max-width: 100%;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-memory__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ---- Section actions ---- */
.tc__section-actions {
  margin-bottom: var(--spacing-md);
}

.tc__add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-caption);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tc__add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* ---- Empty text ---- */
.tc-empty-text {
  text-align: center;
  padding: 24px 16px;
  color: var(--color-text-tertiary);
  font-size: var(--font-secondary);
}

/* ==========================================
   Countdown Cards
   ========================================== */
.tc-cd-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tc-cd-card--pinned {
  border: 1px solid var(--color-primary);
}

.tc-cd-card__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tc-cd-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tc-cd-card__top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tc-cd-card__pin {
  color: var(--color-gold);
  flex-shrink: 0;
}

.tc-cd-card__title {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.tc-cd-card__date {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.tc-cd-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.tc-cd-card__count {
  font-size: 22px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
  white-space: nowrap;
}

.tc-cd-card__count.is-past {
  color: var(--color-text-tertiary);
}

.tc-cd-card__actions {
  display: flex;
  gap: 4px;
}

.tc-cd-card__act {
  padding: 3px 8px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.tc-cd-card__act:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.tc-cd-card__act--del:hover {
  color: var(--color-error);
  background: rgba(194, 103, 106, 0.08);
}

@media (max-width: 500px) {
  .tc-hero__content {
    padding: 22px 18px;
  }

  .tc-hero__day-num {
    font-size: 30px;
  }

  .tc-cd-card__inner {
    flex-direction: column;
    gap: 12px;
  }

  .tc-cd-card__right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
