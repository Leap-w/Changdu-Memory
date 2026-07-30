<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTimeStore } from '@/stores/time'
import {
  NCard,
  NButton,
  NInput,
  NDatePicker,
  NForm,
  NFormItem,
  NGrid,
  NGi,
  NModal,
  NSpace,
  NSpin,
  NTag,
  NProgress,
  useMessage,
} from 'naive-ui'

const timeStore = useTimeStore()
const message = useMessage()

// 编辑弹窗
const showEditModal = ref(false)
const editForm = ref({
  project_name: '',
  location: '',
  start_date: null as number | null,
  end_date: null as number | null,
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
    message.warning('请选择开始和结束日期')
    return
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
  } catch {
    message.error('更新失败')
  } finally {
    editLoading.value = false
  }
}

onMounted(() => {
  timeStore.loadTimeProfile()
})
</script>

<template>
  <NSpin :show="timeStore.loading">
    <div v-if="timeStore.profile" class="time-center">
      <!-- ====== 核心倒计时卡片 ====== -->
      <NCard class="countdown-card">
        <div class="countdown-card__inner">
          <div class="countdown-card__header">
            <h2 class="countdown-card__title">
              {{ timeStore.profile.project_name }}
            </h2>
            <NTag
              :bordered="false"
              type="info"
              size="small"
              round
            >
              {{ timeStore.phase }}
            </NTag>
          </div>

          <!-- 天数展示区 -->
          <div class="countdown-card__days">
            <div class="days-block">
              <span class="days-number">{{ timeStore.daysPassed }}</span>
              <span class="days-label">第几天</span>
            </div>
            <div class="days-divider" />
            <div class="days-block">
              <span class="days-number">{{ timeStore.daysRemaining }}</span>
              <span class="days-label">剩余</span>
            </div>
            <div class="days-divider" />
            <div class="days-block">
              <span class="days-number">{{ timeStore.totalDays }}</span>
              <span class="days-label">总计</span>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="countdown-card__progress">
            <NProgress
              type="line"
              :percentage="timeStore.progress"
              :height="10"
              :border-radius="5"
              :color="'#5E81AC'"
              :rail-color="'rgba(79, 142, 247, 0.12)'"
              :show-text="false"
            />
            <span class="progress-text">{{ timeStore.progress }}%</span>
          </div>
        </div>
      </NCard>

      <!-- ====== 时间信息卡片 ====== -->
      <NCard class="info-card" title="时间信息">
        <NGrid :cols="2" :x-gap="16" :y-gap="12">
          <NGi>
            <div class="info-item">
              <span class="info-label">📍 地点</span>
              <span class="info-value">{{ timeStore.profile.location }}</span>
            </div>
          </NGi>
          <NGi>
            <div class="info-item">
              <span class="info-label">📅 开始</span>
              <span class="info-value">{{ timeStore.profile.start_date }}</span>
            </div>
          </NGi>
          <NGi>
            <div class="info-item">
              <span class="info-label">🏁 结束</span>
              <span class="info-value">{{ timeStore.profile.end_date }}</span>
            </div>
          </NGi>
          <NGi>
            <div class="info-item">
              <span class="info-label">⏳ 阶段</span>
              <span class="info-value">{{ timeStore.phase }}</span>
            </div>
          </NGi>
        </NGrid>
      </NCard>

      <!-- ====== 调整按钮 ====== -->
      <div class="time-center__actions">
        <NButton
          type="primary"
          size="large"
          block
          @click="openEditModal"
        >
          调整时间
        </NButton>
      </div>

      <!-- ====== 编辑弹窗 ====== -->
      <NModal
        v-model:show="showEditModal"
        preset="card"
        title="调整时间"
        :mask-closable="false"
        style="max-width: 480px"
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
              :is-date-disabled="(ts: number) => {
                if (editForm.end_date) return ts > editForm.end_date
                return false
              }"
              clearable
              style="width: 100%"
            />
          </NFormItem>
          <NFormItem label="结束日期">
            <NDatePicker
              v-model:value="editForm.end_date"
              type="date"
              :is-date-disabled="(ts: number) => {
                if (editForm.start_date) return ts < editForm.start_date
                return false
              }"
              clearable
              style="width: 100%"
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
    </div>
  </NSpin>
</template>

<style scoped>
.time-center {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-card);
}

/* ====== 核心倒计时卡片 ====== */
.countdown-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  background: linear-gradient(135deg, #5E81AC 0%, #81A1C1 100%);
  color: #fff;
}

.countdown-card :deep(.n-card__content) {
  padding: 0;
}

.countdown-card__inner {
  padding: 28px 24px 24px;
}

.countdown-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.countdown-card__title {
  font-size: var(--font-card-title);
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.countdown-card__days {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.days-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.days-number {
  font-size: 40px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1px;
}

.days-label {
  font-size: var(--font-caption);
  opacity: 0.8;
}

.days-divider {
  width: 1px;
  height: 48px;
  background: rgba(255, 255, 255, 0.3);
}

.countdown-card__progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.countdown-card__progress :deep(.n-progress) {
  flex: 1;
}

.progress-text {
  font-size: var(--font-secondary);
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.9;
}

/* ====== 信息卡片 ====== */
.info-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.info-value {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: 500;
}

/* ====== 操作区 ====== */
.time-center__actions {
  padding-top: 8px;
}
</style>
