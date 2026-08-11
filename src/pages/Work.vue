<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import { useScheduleStore } from '@/stores/schedule'
import { useWorkStore } from '@/stores/work'
import { useStudentStore } from '@/stores/student'
import WorkCard from '@/components/work/WorkCard.vue'
import ScheduleWeekView from '@/components/schedule/ScheduleWeekView.vue'
import ScheduleEditor from '@/components/schedule/ScheduleEditor.vue'
import StudentCard from '@/components/student/StudentCard.vue'
import { AppCard, AppSection, AppIcon } from '@/components/ui'
import type { Schedule } from '@/repositories/ScheduleRepository'
import type { Student } from '@/repositories/StudentRepository'
import { formatTimeHM } from '@/utils/date'
import { useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const todoStore = useTodoStore()
const scheduleStore = useScheduleStore()
const workStore = useWorkStore()
const studentStore = useStudentStore()
const message = useMessage()

// ==========================================
// Tab state — synced with route query
// ==========================================
const tabs = ['课程表', '行政安排', '学生档案'] as const
const activeTab = ref((route.query.tab as string) || '课程表')

watch(() => route.query.tab, (val) => {
  if (val && tabs.includes(val as typeof tabs[number])) {
    activeTab.value = val as string
  }
})

/**
 * 切换 Tab：同步写入 URL query（用 replace，不污染历史栈）。
 * 这样进入行政安排编辑页再返回时，router.back() 能恢复到原来的 Tab，
 * 不会因为组件重建而重置回默认的「课程表」。
 */
function switchTab(t: string) {
  activeTab.value = t
  if (route.query.tab !== t) {
    router.replace({ query: { tab: t } })
  }
}

// ==========================================
// Data loading
// ==========================================
const ready = ref(false)

onMounted(async () => {
  const jobs = [
    todoStore.todos.length ? Promise.resolve() : todoStore.loadTodos(),
    scheduleStore.schedules.length ? Promise.resolve() : scheduleStore.loadSchedules(),
    workStore.works.length ? Promise.resolve() : workStore.loadWorks(),
    studentStore.students.length ? Promise.resolve() : studentStore.loadStudents(),
  ]
  await Promise.allSettled(jobs)
  ready.value = true
})

// ==========================================
// Date
// ==========================================
function getTodayDisplay() {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}

function getWeekdayNum(): number {
  // Returns 1-7 (Mon-Sun)
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

// ==========================================
// Today overview
// ==========================================
const todayTodos = computed(() => todoStore.todayTodos)
const todaySchedules = computed(() =>
  scheduleStore.schedules.filter((s) => s.day_of_week === getWeekdayNum()),
)
const todayWorks = computed(() => workStore.todayWorks)

const todayTimeline = computed(() => {
  const items: { type: 'schedule' | 'todo' | 'work'; time: string; title: string; sub?: string; id: string }[] = []

  for (const s of todaySchedules.value) {
    items.push({
      type: 'schedule',
      time: s.start_time,
      title: `${s.course_name} · ${s.class_name || '未设置班级'}`,
      sub: `${s.start_time}-${s.end_time}${s.notes ? ' · ' + s.notes : ''}`,
      id: s.id,
    })
  }

  for (const t of todayTodos.value.filter((t) => !t.completed)) {
    const deadlineTime = (t as unknown as { deadline_time?: string }).deadline_time
    const deadlineDate = (t as unknown as { deadline_date?: string }).deadline_date
    items.push({
      type: 'todo',
      time: deadlineTime || '',
      title: t.title,
      sub: deadlineDate ? `截止: ${deadlineDate}` : undefined,
      id: t.id,
    })
  }

  for (const w of todayWorks.value) {
    items.push({
      type: 'work',
      time: formatTimeHM(w.start_time),
      title: w.title,
      sub: w.start_time && w.end_time
        ? `${formatTimeHM(w.start_time)} - ${formatTimeHM(w.end_time)}`
        : (w.content?.slice(0, 60) || undefined),
      id: w.id,
    })
  }

  // Sort by time
  items.sort((a, b) => a.time.localeCompare(b.time))
  return items
})

const todayHasAny = computed(() => todaySchedules.value.length > 0 || todayTodos.value.length > 0 || todayWorks.value.length > 0)

// ==========================================
// Schedule tab
// ==========================================
const showScheduleModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const scheduleLoading = ref(false)
const defaultScheduleDay = ref(1)

function openAddSchedule(dayOfWeek: number) {
  editingSchedule.value = null
  defaultScheduleDay.value = dayOfWeek
  showScheduleModal.value = true
}

function openEditSchedule(s: Schedule) {
  editingSchedule.value = s
  defaultScheduleDay.value = s.day_of_week
  showScheduleModal.value = true
}

async function handleScheduleSubmit(data: {
  course_name: string; class_name: string; day_of_week: number
  start_time: string; end_time: string; location: string; notes: string
}) {
  scheduleLoading.value = true
  try {
    if (editingSchedule.value) {
      await scheduleStore.editSchedule(editingSchedule.value.id, data)
    } else {
      await scheduleStore.addSchedule(data)
    }
    showScheduleModal.value = false
    editingSchedule.value = null
  } catch { /* ignore */ }
  finally { scheduleLoading.value = false }
}

async function handleDeleteSchedule(id: string) {
  if (!confirm('删除该课程？')) return
  await scheduleStore.removeSchedule(id)
}

// ==========================================
// Work tab (行政安排) — 列表页仅编辑，删除移至编辑页
// ==========================================
function goWorkCreate() { router.push('/work/new') }
function goWorkEdit(id: string) { router.push(`/work/${id}/edit`) }

// ---- 批量编辑模式 ----
const workBatchMode = ref(false)
const selectedWorkIds = ref<string[]>([])

function enterWorkBatch() {
  workBatchMode.value = true
  selectedWorkIds.value = []
}

function exitWorkBatch() {
  workBatchMode.value = false
  selectedWorkIds.value = []
}

function toggleSelectWork(id: string) {
  const idx = selectedWorkIds.value.indexOf(id)
  if (idx >= 0) selectedWorkIds.value.splice(idx, 1)
  else selectedWorkIds.value.push(id)
}

const allWorksSelected = computed(() =>
  workStore.works.length > 0 && selectedWorkIds.value.length === workStore.works.length,
)

function toggleSelectAll() {
  selectedWorkIds.value = allWorksSelected.value ? [] : workStore.works.map((w) => w.id)
}

/** 单选：可编辑或删除；多选：仅删除 */
const canEditSelected = computed(() => selectedWorkIds.value.length === 1)

async function handleBatchEditSelected() {
  if (selectedWorkIds.value.length !== 1) return
  goWorkEdit(selectedWorkIds.value[0])
}

async function handleBatchDeleteSelected() {
  if (selectedWorkIds.value.length === 0) { message.warning('请先选择要删除的安排'); return }
  if (!confirm(`确定删除选中的 ${selectedWorkIds.value.length} 项安排？`)) return
  try {
    await workStore.batchRemove([...selectedWorkIds.value])
    message.success('已删除')
    exitWorkBatch()
  } catch { message.error('删除失败') }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
}

// ==========================================
// Student tab
// ==========================================
const showStudentModal = ref(false)
const editingStudent = ref<Student | null>(null)
const studentLoading = ref(false)
const showBatchModal = ref(false)
const batchText = ref('')
const studentForm = ref({ name: '', class_name: '', role: '', notes: '' })

function openAddStudent() {
  editingStudent.value = null
  studentForm.value = { name: '', class_name: '', role: '', notes: '' }
  showStudentModal.value = true
}

async function handleStudentSubmit() {
  if (!studentForm.value.name.trim()) return
  studentLoading.value = true
  try {
    if (editingStudent.value) {
      await studentStore.editStudent(editingStudent.value.id, studentForm.value)
    } else {
      await studentStore.addStudent(studentForm.value)
    }
    showStudentModal.value = false
    editingStudent.value = null
  } catch { /* ignore */ }
  finally { studentLoading.value = false }
}

async function handleDeleteStudent(id: string) {
  if (!confirm('删除该学生？')) return
  await studentStore.removeStudent(id)
}

async function handleBatchAdd() {
  if (!batchText.value.trim()) return
  const lines = batchText.value.trim().split('\n').filter((l) => l.trim())
  const students = lines.map((line) => {
    const parts = line.split(/[,，\s]+/)
    return {
      name: parts[0] || '',
      class_name: parts[1] || '',
      role: parts[2] || '',
      notes: parts.slice(3).join(' ') || '',
    }
  }).filter((s) => s.name)

  if (!students.length) return
  studentLoading.value = true
  try {
    await studentStore.batchAdd(students)
    showBatchModal.value = false
    batchText.value = ''
  } catch { /* ignore */ }
  finally { studentLoading.value = false }
}

// ==========================================
// 待办统一在 /todo 页面管理，这里仅展示今日时间轴
// ==========================================
</script>

<template>
  <div class="work-page">
    <!-- ====== Page header ====== -->
    <div class="work-page__header">
      <div class="work-page__header-left">
        <h1 class="work-page__title">
          工作
        </h1>
        <p class="work-page__subtitle">
          教学与陪伴档案
        </p>
      </div>
      <span class="work-page__date-badge">{{ getTodayDisplay() }}</span>
    </div>

    <!-- ====== Today overview ====== -->
    <AppSection title="今日总览" class="work-page__section">
      <AppCard v-if="ready && todayHasAny" padding="sm">
        <div class="today-timeline">
          <div
            v-for="item in todayTimeline"
            :key="`${item.type}-${item.id}`"
            class="today-timeline__item"
            :class="`today-timeline__item--${item.type}`"
            @click="item.type === 'todo' ? router.push(`/todo/${item.id}/edit`) : null"
          >
            <div class="today-timeline__dot" />
            <div class="today-timeline__time">
              {{ item.time || '全天' }}
            </div>
            <div class="today-timeline__body">
              <span class="today-timeline__title">{{ item.title }}</span>
              <span v-if="item.sub" class="today-timeline__sub">{{ item.sub }}</span>
            </div>
          </div>
        </div>
      </AppCard>
      <div v-else-if="ready" class="work-empty">
        <div class="work-empty__icon">
          <AppIcon name="calendar" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="work-empty__text">
          今日暂无安排
        </p>
        <p class="work-empty__hint">
          加点课程或待办，让今天充实起来
        </p>
      </div>
    </AppSection>

    <!-- ====== Tabs + 顶部右侧添加操作 ====== -->
    <div class="work-tabs-row">
      <div class="work-tabs">
        <button
          v-for="t in tabs"
          :key="t"
          class="work-tabs__btn"
          :class="{ 'work-tabs__btn--active': activeTab === t }"
          @click="switchTab(t)"
        >
          {{ t }}
        </button>
      </div>

      <!-- 当前 Tab 的添加操作，与导航栏同一行右上角 -->
      <div class="work-tabs-actions">
        <button
          v-if="activeTab === '课程表'"
          class="work-tabs-action"
          @click="openAddSchedule(1)"
        >
          <AppIcon name="plus" size="14" /> 添加课程
        </button>
        <template v-else-if="activeTab === '行政安排'">
          <!-- 批量编辑模式：取消批量编辑 + 全选 -->
          <template v-if="workBatchMode">
            <button
              class="work-tabs-action work-tabs-action--secondary"
              @click="exitWorkBatch"
            >
              取消批量编辑
            </button>
            <button class="work-tabs-action" @click="toggleSelectAll">
              <AppIcon name="check" size="14" /> {{ allWorksSelected ? '取消全选' : '全选' }}
            </button>
          </template>
          <!-- 普通模式：批量编辑 + 添加安排 -->
          <template v-else>
            <button
              class="work-tabs-action work-tabs-action--secondary"
              @click="enterWorkBatch"
            >
              <AppIcon name="check-circle" size="14" /> 批量编辑
            </button>
            <button class="work-tabs-action" @click="goWorkCreate()">
              <AppIcon name="plus" size="14" /> 添加安排
            </button>
          </template>
        </template>
        <template v-else-if="activeTab === '学生档案'">
          <button
            class="work-tabs-action work-tabs-action--secondary"
            @click="showBatchModal = true"
          >
            批量添加
          </button>
          <button class="work-tabs-action" @click="openAddStudent()">
            <AppIcon name="plus" size="14" /> 添加学生
          </button>
        </template>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- TAB 1: 课程表 -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '课程表'" class="work-tab">
      <div v-if="ready && scheduleStore.schedules.length === 0" class="work-empty">
        <div class="work-empty__icon">
          <AppIcon name="calendar" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="work-empty__text">
          还没有课程安排
        </p>
        <button class="work-empty__btn" @click="openAddSchedule(1)">
          添加课程
        </button>
      </div>

      <ScheduleWeekView
        v-else
        :schedules="scheduleStore.schedules"
        :today-day-of-week="getWeekdayNum()"
        @edit="openEditSchedule"
        @add="openAddSchedule"
      />
    </div>

    <!-- ================================================================ -->
    <!-- TAB 2: 行政安排（列表页仅编辑，删除在编辑页） -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '行政安排'" class="work-tab">
      <div v-if="ready && workStore.works.length === 0" class="work-empty">
        <div class="work-empty__icon">
          <AppIcon name="briefcase" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="work-empty__text">
          没有行政安排
        </p>
        <button class="work-empty__btn" @click="goWorkCreate()">
          添加安排
        </button>
      </div>

      <div v-else>
        <div v-for="group in workStore.groupedByDate" :key="group.date" class="work-group">
          <div class="work-group__head">
            <span class="work-group__date">{{ formatDate(group.date) }}</span>
            <span class="work-group__count">{{ group.items.length }} 项</span>
          </div>
          <div class="work-group__list">
            <div v-for="w in group.items" :key="w.id" class="work-item-row">
              <!-- 批量编辑模式：左侧多选圆圈 -->
              <button
                v-if="workBatchMode"
                class="work-item-row__select"
                :class="{ 'work-item-row__select--checked': selectedWorkIds.includes(w.id) }"
                :aria-pressed="selectedWorkIds.includes(w.id)"
                @click.stop="toggleSelectWork(w.id)"
              >
                <AppIcon v-if="selectedWorkIds.includes(w.id)" name="check" size="11" />
              </button>
              <WorkCard
                :work="w"
                class="work-item-row__card"
              />
              <!-- 普通模式：单个编辑按钮 -->
              <button
                v-if="!workBatchMode"
                class="work-item-row__edit"
                title="编辑"
                @click.stop="goWorkEdit(w.id)"
              >
                <AppIcon name="edit" size="13" />
              </button>
            </div>
          </div>
        </div>

        <!-- 批量编辑底部操作条：单选可编辑/删除，多选仅删除 -->
        <div v-if="workBatchMode && selectedWorkIds.length > 0" class="work-batch-bar">
          <span class="work-batch-bar__count">
            已选 {{ selectedWorkIds.length }} 项
          </span>
          <div class="work-batch-bar__actions">
            <button
              v-if="canEditSelected"
              class="work-batch-bar__btn"
              @click="handleBatchEditSelected"
            >
              <AppIcon name="edit" size="13" /> 编辑
            </button>
            <button
              class="work-batch-bar__btn work-batch-bar__btn--danger"
              @click="handleBatchDeleteSelected"
            >
              <AppIcon name="trash" size="13" /> 删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- TAB 3: 学生档案 -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '学生档案'" class="work-tab">
      <div v-if="ready && studentStore.students.length === 0" class="work-empty">
        <div class="work-empty__icon">
          <AppIcon name="people" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="work-empty__text">
          还没有学生档案
        </p>
        <button class="work-empty__btn" @click="openAddStudent()">
          添加学生
        </button>
      </div>

      <div v-else>
        <div v-for="[className, items] in studentStore.groupedByClass" :key="className" class="student-group">
          <h3 class="student-group__title">
            {{ className }}
          </h3>
          <div class="student-group__grid">
            <StudentCard
              v-for="s in items"
              :key="s.id"
              :student="s"
              @save="(id, data) => studentStore.editStudent(id, data)"
              @remove="handleDeleteStudent"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- MODALS -->
    <!-- ================================================================ -->

    <!-- Schedule modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">
              {{ editingSchedule ? '编辑课程' : '添加课程' }}
            </h3>
            <ScheduleEditor
              :schedule="editingSchedule"
              :loading="scheduleLoading"
              @submit="handleScheduleSubmit"
              @cancel="showScheduleModal = false"
            />
            <button
              v-if="editingSchedule"
              class="modal-sheet__del"
              @click="handleDeleteSchedule(editingSchedule.id); showScheduleModal = false"
            >
              删除此课程
            </button>
          </div>
        </div>
      </Transition>

      <!-- Student modal -->
      <Transition name="modal">
        <div v-if="showStudentModal" class="modal-overlay" @click.self="showStudentModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">
              {{ editingStudent ? '编辑学生' : '添加学生' }}
            </h3>
            <div class="modal-form">
              <input v-model="studentForm.name" class="modal-input" placeholder="姓名 *" />
              <input v-model="studentForm.class_name" class="modal-input" placeholder="班级" />
              <input v-model="studentForm.role" class="modal-input" placeholder="职务" />
              <input v-model="studentForm.notes" class="modal-input" placeholder="备注" />
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showStudentModal = false">
                  取消
                </button>
                <button class="modal-btn modal-btn--save" :disabled="studentLoading" @click="handleStudentSubmit">
                  {{ studentLoading ? '…' : '保存' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Batch add modal -->
      <Transition name="modal">
        <div v-if="showBatchModal" class="modal-overlay" @click.self="showBatchModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">
              批量添加学生
            </h3>
            <p class="modal-sheet__hint">
              每行一个学生，格式：姓名 班级 职务 备注（用空格或逗号分隔）
            </p>
            <textarea
              v-model="batchText"
              class="modal-textarea"
              rows="8"
              placeholder="张三 三年三班 班长 喜欢画画&#10;李四 三年三班 学习委员"
            />
            <div class="modal-form__actions">
              <button class="modal-btn modal-btn--cancel" @click="showBatchModal = false">
                取消
              </button>
              <button
                class="modal-btn modal-btn--save"
                :disabled="studentLoading || !batchText.trim()"
                @click="handleBatchAdd"
              >
                {{ studentLoading ? '导入中…' : `导入 ${batchText.trim().split('\n').filter(l => l.trim()).length} 人` }}
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
   Work Page — v5.1.4
   ================================================ */
.work-page {
  max-width: 960px;
  margin: 0 auto;
}

/* ---- Header ---- */
.work-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.work-page__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.work-page__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.work-page__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.work-page__date-badge {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  background: rgba(0, 0, 0, 0.03);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.work-page__section {
  margin-bottom: var(--spacing-lg);
}

/* ---- Tabs + 顶部操作 ---- */
.work-tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--spacing-lg);
}

.work-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.work-tabs::-webkit-scrollbar { display: none; }

.work-tabs__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-secondary, 14px);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.work-tabs__btn:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.work-tabs__btn--active {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

/* ---- 顶部右侧添加按钮（与导航栏同一行） ---- */
.work-tabs-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.work-tabs-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-caption, 12px);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.work-tabs-action:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.work-tabs-action--secondary {
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}

.work-tabs-action--secondary:hover {
  background: var(--color-bg);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.work-tab {
  min-height: 300px;
}

/* ---- Today Timeline ---- */
.today-timeline {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.today-timeline__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
  cursor: default;
}

.today-timeline__item--todo {
  cursor: pointer;
}

.today-timeline__item:hover {
  background: var(--color-bg);
}

.today-timeline__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.today-timeline__item--schedule .today-timeline__dot { background: var(--color-primary); }
.today-timeline__item--todo .today-timeline__dot     { background: var(--color-sky); }
.today-timeline__item--work .today-timeline__dot     { background: var(--color-gold); }

.today-timeline__time {
  min-width: 40px;
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
  padding-top: 2px;
}

.today-timeline__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.today-timeline__title {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.today-timeline__sub {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

/* ---- Empty State ---- */
.work-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 20px;
  text-align: center;
}

.work-empty__icon {
  opacity: 0.3;
  margin-bottom: 4px;
}

.work-empty__text {
  font-size: var(--font-content, 16px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0;
}

.work-empty__hint {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.work-empty__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 9px 22px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.work-empty__btn:hover {
  background: var(--color-primary-dark);
}

/* ---- Work Groups ---- */
.work-group {
  margin-bottom: var(--spacing-xl);
}

.work-group__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 0 4px;
}

.work-group__date {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.work-group__count {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.work-group__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-item-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.work-item-row__card {
  flex: 1;
  min-width: 0;
}

/* 批量编辑：左侧多选圆圈 */
.work-item-row__select {
  width: 22px;
  height: 22px;
  margin-top: 14px;
  margin-left: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1.8px solid var(--color-border-medium);
  background: var(--color-bg-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  padding: 0;
  transition: all var(--transition-fast);
}

.work-item-row__select:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.work-item-row__select--checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.work-item-row__edit {
  flex-shrink: 0;
  padding: 8px;
  margin-top: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all var(--transition-fast);
}

.work-item-row:hover .work-item-row__edit {
  opacity: 1;
}

.work-item-row__edit:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

/* ---- 批量编辑底部操作条 ---- */
.work-batch-bar {
  position: sticky;
  bottom: calc(var(--bottom-nav-height, 72px) + 16px);
  z-index: var(--z-sticky, 150);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  margin-top: var(--spacing-lg);
  border-radius: var(--radius-xl);
  background: var(--glass-bg-card, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  box-shadow: var(--shadow-lg);
}

@media (min-width: 768px) {
  .work-batch-bar {
    bottom: 16px;
  }
}

.work-batch-bar__count {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

.work-batch-bar__actions {
  display: flex;
  gap: 8px;
}

.work-batch-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 18px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-caption);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.work-batch-bar__btn:hover {
  background: var(--color-primary-dark);
}

.work-batch-bar__btn--danger {
  background: rgba(194, 103, 106, 0.12);
  color: var(--color-error);
}

.work-batch-bar__btn--danger:hover {
  background: var(--color-error);
  color: #fff;
}

/* ---- Student Groups ---- */
.student-group {
  margin-bottom: var(--spacing-xl);
}

.student-group__title {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 10px;
  padding-left: 4px;
}

.student-group__grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---- Modal ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: var(--z-modal-backdrop, 200);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.modal-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  padding: 28px 24px 24px;
  box-shadow: var(--shadow-xl);
}

.modal-sheet__title {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 20px;
  text-align: center;
}

.modal-sheet__hint {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0 0 14px;
  line-height: var(--leading-relaxed);
}

.modal-sheet__del {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 20px;
  border: none;
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-caption);
  font-family: inherit;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.modal-sheet__del:hover {
  background: rgba(194, 103, 106, 0.06);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-input {
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  outline: none;
  background: var(--color-bg);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.modal-input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.modal-textarea {
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-caption);
  font-family: monospace;
  outline: none;
  resize: vertical;
  line-height: 1.6;
  background: var(--color-bg);
  transition: border-color var(--transition-fast);
}

.modal-textarea:focus {
  border-color: var(--color-primary);
}

.modal-form__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.modal-btn--cancel:hover {
  background: var(--color-border-light);
}

.modal-btn--save {
  background: var(--color-primary);
  color: #fff;
}

.modal-btn--save:hover {
  background: var(--color-primary-dark);
}

.modal-btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---- Transitions ---- */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s;
}

.modal-enter-active .modal-sheet,
.modal-leave-active .modal-sheet {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-sheet {
  transform: translateY(40px);
}

.modal-leave-to .modal-sheet {
  transform: translateY(40px);
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 40px;
  }
}

/* 移动端：导航与添加按钮同行可能过挤，允许换行 */
@media (max-width: 560px) {
  .work-tabs-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  .work-tabs-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
