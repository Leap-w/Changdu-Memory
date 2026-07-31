<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimeStore, getCountdownStats } from '@/stores/time'
import type { Countdown } from '@/repositories/TimeRepository'
import { AppCard, AppSection, AppIcon } from '@/components/ui'
import {
  NButton, NInput, NDatePicker, NForm, NFormItem,
  NModal, NSpace, NSpin,
  useMessage,
} from 'naive-ui'

const timeStore = useTimeStore()
const message = useMessage()

// ====== Data loading ======
onMounted(() => {
  timeStore.loadTimeProfile()
  timeStore.loadCountdowns()
})

// ====== Journey milestones (derived from start/end dates) ======
const milestones = computed(() => {
  if (!timeStore.profile?.start_date || !timeStore.profile?.end_date) return []

  const start = new Date(timeStore.profile.start_date + 'T00:00:00')
  const end = new Date(timeStore.profile.end_date + 'T00:00:00')
  const totalMs = end.getTime() - start.getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nodes: { label: string; date: Date; isPassed: boolean; isCurrent: boolean; desc: string }[] = []

  const addNode = (ratio: number, label: string, desc: string) => {
    const date = new Date(start.getTime() + totalMs * ratio)
    const isPassed = date <= today
    const isCurrent = !isPassed && nodes.every((n) => n.isPassed)
    nodes.push({ label, date, isPassed, isCurrent, desc })
  }

  addNode(0, '启程', '抵达昌都，开始支教旅程')
  addNode(0.08, '适应', '适应高原环境与教学节奏')
  addNode(0.30, '深耕', '深入教学，融入校园生活')
  addNode(0.55, '过半', '支教旅程过半，收获与反思')
  addNode(0.78, '沉淀', '沉淀经验，留下更多印记')
  addNode(1, '归程', '圆满完成支教任务')

  // Mark the first un-passed node as current
  let foundCurrent = false
  for (const n of nodes) {
    if (!n.isPassed && !foundCurrent) {
      n.isCurrent = true
      foundCurrent = true
    } else {
      n.isCurrent = false
    }
  }

  return nodes
})

function fmtMilestoneDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
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
    start_date: p.start_date ? new Date(p.start_date).getTime() : null,
    end_date: p.end_date ? new Date(p.end_date).getTime() : null,
  }
  showEditModal.value = true
}

async function handleSave() {
  if (!editForm.value.start_date || !editForm.value.end_date) {
    message.warning('请选择开始和结束日期'); return
  }
  editLoading.value = true
  try {
    const toDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0]
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
    const dateStr = new Date(cdForm.value.target_date).toISOString().split('T')[0]
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

      <!-- ====== Journey Route ====== -->
      <AppSection title="一年旅程" subtitle="根据起止日期自动推算" class="tc__section">
        <div v-if="milestones.length" class="tc-journey">
          <div
            v-for="(node, i) in milestones"
            :key="i"
            class="tc-journey__node"
            :class="{
              'tc-journey__node--passed': node.isPassed,
              'tc-journey__node--current': node.isCurrent,
            }"
          >
            <div class="tc-journey__gutter">
              <div class="tc-journey__dot" />
              <div v-if="i < milestones.length - 1" class="tc-journey__line" />
            </div>
            <div class="tc-journey__body">
              <span class="tc-journey__date">{{ fmtMilestoneDate(node.date) }}</span>
              <span class="tc-journey__label">{{ node.label }}</span>
              <span class="tc-journey__desc">{{ node.desc }}</span>
            </div>
          </div>
        </div>
        <div v-else class="tc-empty-text">
          配置起止日期后显示旅程路线
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
   Journey Route
   ========================================== */
.tc__section {
  margin-bottom: var(--spacing-2xl);
}

.tc-journey {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tc-journey__node {
  display: flex;
  gap: 16px;
  padding: 4px 0;
}

.tc-journey__gutter {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
  padding-top: 6px;
}

.tc-journey__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid var(--color-bg);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.tc-journey__node--passed .tc-journey__dot {
  background: var(--color-primary);
}

.tc-journey__node--current .tc-journey__dot {
  background: var(--color-gold);
  box-shadow: 0 0 0 4px rgba(214, 168, 79, 0.15);
}

.tc-journey__line {
  flex: 1;
  width: 2px;
  min-height: 24px;
  background: var(--color-border-light);
  margin-top: 4px;
}

.tc-journey__node--passed .tc-journey__line {
  background: var(--color-primary);
}

.tc-journey__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0 12px;
  padding-left: 4px;
}

.tc-journey__date {
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
}

.tc-journey__node--current .tc-journey__date {
  color: var(--color-gold);
  font-weight: var(--font-weight-semibold);
}

.tc-journey__label {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.tc-journey__node--current .tc-journey__label {
  font-weight: var(--font-weight-bold);
}

.tc-journey__desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
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
