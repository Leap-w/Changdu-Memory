<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTimeStore, getCountdownStats } from '@/stores/time'
import type { Countdown } from '@/repositories/TimeRepository'
import {
  NCard, NButton, NInput, NDatePicker, NForm, NFormItem,
  NGrid, NGi, NModal, NSpace, NSpin, NTag, NProgress, NPopconfirm,
  useMessage,
} from 'naive-ui'

const timeStore = useTimeStore()
const message = useMessage()

// ====== 主项目编辑弹窗 ======
const showEditModal = ref(false)
const editForm = ref({ project_name: '', location: '', start_date: null as number | null, end_date: null as number | null })
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
  if (!editForm.value.start_date || !editForm.value.end_date) { message.warning('请选择开始和结束日期'); return }
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

// ====== 倒计时弹窗 ======
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
  cdForm.value = { title: cd.title, target_date: new Date(cd.end_date + 'T00:00:00').getTime() }
  showCountdownModal.value = true
}

async function handleCdSave() {
  if (!cdForm.value.title.trim()) { message.warning('请输入标题'); return }
  if (!cdForm.value.target_date) { message.warning('请选择目标日'); return }
  cdLoading.value = true
  try {
    const dateStr = new Date(cdForm.value.target_date).toISOString().split('T')[0]
    if (editingCountdown.value) {
      await timeStore.editCountdown(editingCountdown.value.id, { title: cdForm.value.title.trim(), end_date: dateStr })
      message.success('已更新')
    } else {
      await timeStore.addCountdown({ title: cdForm.value.title.trim(), end_date: dateStr })
      message.success('已添加')
    }
    showCountdownModal.value = false
  } catch (err: unknown) { message.error(err instanceof Error ? err.message : '操作失败') }
  finally { cdLoading.value = false }
}

async function handleCdDelete(id: string) {
  try { await timeStore.removeCountdown(id); message.success('已删除') }
  catch { message.error('删除失败') }
}

onMounted(() => {
  timeStore.loadTimeProfile()
  timeStore.loadCountdowns()
})
</script>

<template>
  <NSpin :show="timeStore.loading">
    <div v-if="timeStore.profile" class="time-center">
      <!-- ====== 核心倒计时卡片 ====== -->
      <NCard class="countdown-card">
        <div class="countdown-card__inner">
          <div class="countdown-card__header">
            <h2 class="countdown-card__title">{{ timeStore.profile.project_name }}</h2>
            <NTag :bordered="false" type="info" size="small" round>{{ timeStore.phase }}</NTag>
          </div>

          <div class="countdown-card__days">
            <div class="days-block"><span class="days-number">{{ timeStore.daysPassed }}</span><span class="days-label">第几天</span></div>
            <div class="days-divider" />
            <div class="days-block"><span class="days-number">{{ timeStore.daysRemaining }}</span><span class="days-label">剩余</span></div>
            <div class="days-divider" />
            <div class="days-block"><span class="days-number">{{ timeStore.totalDays }}</span><span class="days-label">总计</span></div>
          </div>

          <div class="countdown-card__progress">
            <NProgress type="line" :percentage="timeStore.progress" :height="10" :border-radius="5" :color="'#4A8C94'" :rail-color="'rgba(74,140,148,0.12)'" :show-text="false" />
            <span class="progress-text">{{ timeStore.progress }}%</span>
          </div>
        </div>
      </NCard>

      <!-- ====== 时间信息卡片 ====== -->
      <NCard class="info-card" title="时间信息">
        <NGrid :cols="2" :x-gap="16" :y-gap="12">
          <NGi><div class="info-item"><span class="info-label">📍 地点</span><span class="info-value">{{ timeStore.profile.location }}</span></div></NGi>
          <NGi><div class="info-item"><span class="info-label">📅 开始</span><span class="info-value">{{ timeStore.profile.start_date }}</span></div></NGi>
          <NGi><div class="info-item"><span class="info-label">🏁 结束</span><span class="info-value">{{ timeStore.profile.end_date }}</span></div></NGi>
          <NGi><div class="info-item"><span class="info-label">⏳ 阶段</span><span class="info-value">{{ timeStore.phase }}</span></div></NGi>
        </NGrid>
      </NCard>

      <div class="time-center__actions">
        <NButton type="primary" size="large" block @click="openEditModal">调整时间</NButton>
      </div>

      <!-- ====== 自定义倒计时 ====== -->
      <div class="cd-section">
        <div class="cd-section__head">
          <h3 class="cd-section__title">自定义倒计时</h3>
          <NButton size="small" type="primary" @click="openCreateCountdown">+ 添加</NButton>
        </div>

        <div v-if="timeStore.countdowns.length === 0" class="cd-section__empty">
          还没有自定义倒计时，点击添加按钮创建一个
        </div>

        <NCard v-for="cd in timeStore.countdowns" :key="cd.id" class="cd-card" :class="{ 'cd-card--pinned': cd.pinned }">
          <div class="cd-card__header">
            <div>
              <h4 class="cd-card__title">
                <span v-if="cd.pinned" class="cd-card__pin-icon">📌</span>
                {{ cd.title }}
              </h4>
              <div class="cd-card__date">目标日：{{ cd.end_date }}</div>
            </div>
            <span class="cd-card__countdown" :class="{ 'is-past': getCountdownStats(cd).isPast }">
              {{ getCountdownStats(cd).label }}
            </span>
          </div>

          <div class="cd-card__actions">
            <NButton text size="tiny" @click="timeStore.togglePin(cd.id)">
              {{ cd.pinned ? '取消置顶' : '📌 置顶' }}
            </NButton>
            <NButton text size="small" @click="openEditCountdown(cd)">编辑</NButton>
            <NPopconfirm @positive-click="handleCdDelete(cd.id)">
              <template #trigger><NButton text size="small" type="error">删除</NButton></template>
              确定删除「{{ cd.title }}」？
            </NPopconfirm>
          </div>
        </NCard>
      </div>

      <!-- ====== 主项目编辑弹窗 ====== -->
      <NModal v-model:show="showEditModal" preset="card" title="调整时间" :mask-closable="false" style="max-width:480px">
        <NForm>
          <NFormItem label="项目名称"><NInput v-model:value="editForm.project_name" /></NFormItem>
          <NFormItem label="地点"><NInput v-model:value="editForm.location" /></NFormItem>
          <NFormItem label="开始日期"><NDatePicker v-model:value="editForm.start_date" type="date" :is-date-disabled="(ts: number) => editForm.end_date ? ts > editForm.end_date : false" style="width:100%" /></NFormItem>
          <NFormItem label="结束日期"><NDatePicker v-model:value="editForm.end_date" type="date" :is-date-disabled="(ts: number) => editForm.start_date ? ts < editForm.start_date : false" style="width:100%" /></NFormItem>
        </NForm>
        <template #footer><NSpace justify="end"><NButton @click="showEditModal = false">取消</NButton><NButton type="primary" :loading="editLoading" @click="handleSave">保存</NButton></NSpace></template>
      </NModal>

      <!-- ====== 倒计时弹窗 ====== -->
      <NModal v-model:show="showCountdownModal" preset="card" :title="editingCountdown ? '编辑倒计时' : '添加倒计时'" style="max-width:480px">
        <NForm>
          <NFormItem label="事件名称" required><NInput v-model:value="cdForm.title" placeholder="例如：寒假、生日、考试..." maxlength="50" /></NFormItem>
          <NFormItem label="目标日" required><NDatePicker v-model:value="cdForm.target_date" type="date" style="width:100%" /></NFormItem>
        </NForm>
        <template #footer><NSpace justify="end"><NButton @click="showCountdownModal = false">取消</NButton><NButton type="primary" :loading="cdLoading" @click="handleCdSave">保存</NButton></NSpace></template>
      </NModal>
    </div>
  </NSpin>
</template>

<style scoped>
.time-center { max-width: 640px; margin: 0 auto; padding: var(--spacing-page); display: flex; flex-direction: column; gap: var(--spacing-card); }

.countdown-card { border-radius: var(--radius-card); box-shadow: var(--shadow-card); background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: #fff; }
.countdown-card :deep(.n-card__content) { padding: 0; }
.countdown-card__inner { padding: 28px 24px 24px; }
.countdown-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.countdown-card__title { font-size: var(--font-card-title); font-weight: 700; color: #fff; margin: 0; }
.countdown-card__days { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px; }
.days-block { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.days-number { font-size: 40px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; }
.days-label { font-size: var(--font-caption); opacity: 0.8; }
.days-divider { width: 1px; height: 48px; background: rgba(255, 255, 255, 0.3); }
.countdown-card__progress { display: flex; align-items: center; gap: 12px; }
.countdown-card__progress :deep(.n-progress) { flex: 1; }
.progress-text { font-size: var(--font-secondary); font-weight: 600; white-space: nowrap; opacity: 0.9; }

.info-card { border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: var(--font-caption); color: var(--color-text-secondary); }
.info-value { font-size: var(--font-content); color: var(--color-text-primary); font-weight: 500; }
.time-center__actions { padding-top: 8px; }

/* Custom countdowns */
.cd-section { margin-top: var(--spacing-md); }
.cd-section__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); }
.cd-section__title { font-size: var(--font-content); font-weight: 600; color: var(--color-text-primary); margin: 0; }
.cd-section__empty { text-align: center; padding: 32px 16px; color: var(--color-text-tertiary); font-size: var(--font-secondary); }

.cd-card { border-radius: var(--radius-card); box-shadow: var(--shadow-card); margin-bottom: var(--spacing-md); }
.cd-card--pinned { border: 1px solid var(--color-primary); background: var(--color-primary-bg); }
.cd-card__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.cd-card__title { font-size: 17px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
.cd-card__pin-icon { margin-right: 2px; }
.cd-card__date { font-size: var(--font-caption); color: var(--color-text-tertiary); margin-top: 2px; }
.cd-card__countdown { font-size: 22px; font-weight: 800; color: var(--color-primary); white-space: nowrap; }
.cd-card__countdown.is-past { color: var(--color-text-tertiary); }
.cd-card__actions { display: flex; gap: 4px; padding-top: 8px; border-top: 1px solid var(--color-border-light); margin-top: 4px; }
</style>
