<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTodoStore } from '@/stores/todo'
import { useScheduleStore } from '@/stores/schedule'
import { useWorkStore } from '@/stores/work'
import { useStudentStore } from '@/stores/student'
import { useMessage } from 'naive-ui'
import WorkCard from '@/components/work/WorkCard.vue'
import ScheduleWeekView from '@/components/schedule/ScheduleWeekView.vue'
import ScheduleEditor from '@/components/schedule/ScheduleEditor.vue'
import StudentCard from '@/components/student/StudentCard.vue'
import type { Schedule } from '@/repositories/ScheduleRepository'
import type { Student } from '@/repositories/StudentRepository'

const router = useRouter()
const route = useRoute()
const todoStore = useTodoStore()
const scheduleStore = useScheduleStore()
const workStore = useWorkStore()
const studentStore = useStudentStore()
const message = useMessage()

// ==========================================
// Tab state
// ==========================================
const tabs = ['待办', '课程表', '行政安排', '学生档案'] as const
const activeTab = ref((route.query.tab as string) || '待办')

// 监听路由 query 变化更新 tab
watch(() => route.query.tab, (val) => {
  if (val && tabs.includes(val as any)) {
    activeTab.value = val as string
  }
})

// ==========================================
// Data loading
// ==========================================
onMounted(async () => {
  const jobs = [
    { load: () => todoStore.todos.length ? null : todoStore.loadTodos() },
    { load: () => scheduleStore.schedules.length ? null : scheduleStore.loadSchedules() },
    { load: () => workStore.works.length ? null : workStore.loadWorks() },
    { load: () => studentStore.students.length ? null : studentStore.loadStudents() },
  ]
  await Promise.allSettled(jobs.map((j) => j.load()))
})

// ==========================================
// Todo tab
// ==========================================
const today = computed(() => new Date().toISOString().split('T')[0])
const todayTodos = computed(() => todoStore.todayTodos)

// ==========================================
// Schedule tab
// ==========================================
const showScheduleModal = ref(false)
const editingSchedule = ref<Schedule | null>(null)
const scheduleLoading = ref(false)

function openAddSchedule(dayOfWeek: number) {
  editingSchedule.value = null
  showScheduleModal.value = true
  // store target dayOfWeek for the editor
  defaultScheduleDay.value = dayOfWeek
}
const defaultScheduleDay = ref(1)

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
// Work tab (行政安排)
// ==========================================
function goWorkEdit(id: string) { router.push(`/work/${id}/edit`) }
function goWorkCreate() { router.push('/work/new') }
async function handleDeleteWork(id: string) {
  if (!confirm('确定删除该安排？')) return
  try {
    await workStore.removeWork(id)
    message.success('已删除')
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
// Todo batch actions
// ==========================================
async function doBatch(action: 'complete' | 'delete') {
  if (action === 'complete') await todoStore.batchComplete()
  else {
    if (!confirm(`确定删除选中的 ${todoStore.selectedIds.size} 项？`)) return
    await todoStore.batchDelete()
  }
}
</script>

<template>
  <div class="work-page">
    <!-- ====== Header ====== -->
    <div class="work-page__header">
      <h1 class="work-page__title">工作</h1>
    </div>

    <!-- ====== Tabs ====== -->
    <div class="work-tabs">
      <button
        v-for="t in tabs" :key="t"
        class="work-tabs__btn"
        :class="{ active: activeTab === t }"
        @click="activeTab = t"
      >{{ t }}</button>
    </div>

    <!-- ================================================================ -->
    <!-- TAB 1: 待办 -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '待办'" class="work-tab">
      <!-- Batch toolbar -->
      <Transition name="fade">
        <div v-if="todoStore.selectionMode" class="todo-batch-bar">
          <span class="todo-batch-bar__count">已选 {{ todoStore.selectedIds.size }} 项</span>
          <button class="todo-batch-bar__btn" @click="todoStore.toggleSelectAll()">
            {{ todoStore.selectedIds.size === todayTodos.length ? '取消全选' : '全选' }}
          </button>
          <button class="todo-batch-bar__btn todo-batch-bar__btn--complete" @click="doBatch('complete')">批量完成</button>
          <button class="todo-batch-bar__btn todo-batch-bar__btn--delete" @click="doBatch('delete')">批量删除</button>
          <button class="todo-batch-bar__btn" @click="todoStore.clearSelection()">取消</button>
        </div>
      </Transition>

      <div v-if="todayTodos.length === 0" class="work-empty">
        <div class="work-empty__icon">☀️</div>
        <p class="work-empty__text">今日没有待办</p>
        <button class="work-empty__btn" @click="router.push('/todo/new')">新建待办</button>
      </div>

      <div v-else class="todo-list">
        <div class="todo-list__header">
          <span class="todo-list__date">{{ today }}</span>
          <span class="todo-list__stats">
            {{ todoStore.todayCompletedCount }}/{{ todayTodos.length }} 完成
          </span>
        </div>
        <div
          v-for="t in todayTodos" :key="t.id"
          class="todo-row"
          :class="{ 'todo-row--done': t.completed, 'todo-row--selected': todoStore.isSelected(t.id) }"
        >
          <span
            class="todo-row__check"
            :class="{ checked: t.completed }"
            @click.stop="todoStore.selectionMode ? todoStore.toggleSelect(t.id) : todoStore.toggleTodo(t.id)"
          >
            <svg v-if="t.completed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <div class="todo-row__body" @click="todoStore.selectionMode ? todoStore.toggleSelect(t.id) : router.push(`/todo/${t.id}/edit`)">
            <span class="todo-row__title">{{ t.title }}</span>
            <span v-if="(t as any).deadline_date" class="todo-row__deadline">📅 {{ (t as any).deadline_date }}{{ (t as any).deadline_time ? ' ' + (t as any).deadline_time : '' }}</span>
          </div>
          <button
            v-if="!todoStore.selectionMode"
            class="todo-row__del"
            title="删除"
            @click.stop="todoStore.removeTodo(t.id)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <!-- New todo button -->
      <div class="work-fab">
        <button class="fab-btn fab-btn--todo" @click="router.push('/todo/new')">+ 新建待办</button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- TAB 2: 课程表 -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '课程表'" class="work-tab">
      <div v-if="scheduleStore.schedules.length === 0" class="work-empty">
        <div class="work-empty__icon">📖</div>
        <p class="work-empty__text">还没有课程安排</p>
        <button class="work-empty__btn" @click="openAddSchedule(1)">添加课程</button>
      </div>

      <ScheduleWeekView
        v-else
        :schedules="scheduleStore.schedules"
        @edit="openEditSchedule"
        @add="openAddSchedule"
      />

      <!-- Course context menu (edit/delete on click) -->
      <div v-if="scheduleStore.schedules.length > 0" class="work-fab">
        <button class="fab-btn" @click="openAddSchedule(1)">+ 添加课程</button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- TAB 3: 行政安排 -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '行政安排'" class="work-tab">
      <div v-if="workStore.works.length === 0" class="work-empty">
        <div class="work-empty__icon">📋</div>
        <p class="work-empty__text">没有行政安排</p>
        <button class="work-empty__btn" @click="goWorkCreate()">添加安排</button>
      </div>

      <div v-else>
        <div v-for="group in workStore.groupedByDate" :key="group.date" class="work-group">
          <div class="work-group__head">
            <span class="work-group__date">{{ formatDate(group.date) }}</span>
            <span class="work-group__count">{{ group.items.length }} 项</span>
          </div>
          <div class="work-group__list">
            <div v-for="w in group.items" :key="w.id" class="work-item-row">
              <WorkCard
                :work="w"
                @click="goWorkEdit"
              />
              <button class="work-item-row__del" title="删除" @click.stop="handleDeleteWork(w.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="work-fab">
        <button class="fab-btn" @click="goWorkCreate()">+ 添加安排</button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- TAB 4: 学生档案 -->
    <!-- ================================================================ -->
    <div v-if="activeTab === '学生档案'" class="work-tab">
      <div v-if="studentStore.students.length === 0" class="work-empty">
        <div class="work-empty__icon">👤</div>
        <p class="work-empty__text">还没有学生档案</p>
        <button class="work-empty__btn" @click="openAddStudent()">添加学生</button>
      </div>

      <div v-else>
        <div v-for="[className, items] in studentStore.groupedByClass" :key="className" class="student-group">
          <h3 class="student-group__title">{{ className }}</h3>
          <div class="student-group__grid">
            <StudentCard
              v-for="s in items" :key="s.id"
              :student="s"
              @save="(id, data) => studentStore.editStudent(id, data)"
              @remove="handleDeleteStudent"
            />
          </div>
        </div>
      </div>

      <div class="work-fab work-fab--row">
        <button class="fab-btn" @click="openAddStudent()">+ 添加学生</button>
        <button class="fab-btn fab-btn--secondary" @click="showBatchModal = true">+ 批量添加</button>
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
            <h3 class="modal-sheet__title">{{ editingSchedule ? '编辑课程' : '添加课程' }}</h3>
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
            >删除此课程</button>
          </div>
        </div>
      </Transition>

      <!-- Student modal -->
      <Transition name="modal">
        <div v-if="showStudentModal" class="modal-overlay" @click.self="showStudentModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">{{ editingStudent ? '编辑学生' : '添加学生' }}</h3>
            <div class="modal-form">
              <input v-model="studentForm.name" class="modal-input" placeholder="姓名 *" />
              <input v-model="studentForm.class_name" class="modal-input" placeholder="班级" />
              <input v-model="studentForm.role" class="modal-input" placeholder="职务" />
              <input v-model="studentForm.notes" class="modal-input" placeholder="备注" />
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showStudentModal = false">取消</button>
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
            <h3 class="modal-sheet__title">批量添加学生</h3>
            <p class="modal-sheet__hint">每行一个学生，格式：姓名 班级 职务 备注（用空格或逗号分隔）</p>
            <textarea v-model="batchText" class="modal-textarea" rows="8" placeholder="张三 三年三班 班长 喜欢画画&#10;李四 三年三班 学习委员"></textarea>
            <div class="modal-form__actions">
              <button class="modal-btn modal-btn--cancel" @click="showBatchModal = false">取消</button>
              <button class="modal-btn modal-btn--save" :disabled="studentLoading || !batchText.trim()" @click="handleBatchAdd">
                {{ studentLoading ? '导入中…' : `导入 ${batchText.trim().split('\n').filter(l=>l.trim()).length} 人` }}
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
   Work Page — v5.1 教师工作中心
   ================================================ */
.work-page { max-width:860px;margin:0 auto;padding:var(--spacing-page);padding-bottom:calc(var(--spacing-3xl) + 60px); }
.work-page__header { margin-bottom:var(--spacing-lg); }
.work-page__title { font-size:var(--font-title);font-weight:700;color:var(--color-text-primary);margin:0; }

/* ---- Tabs ---- */
.work-tabs { display:flex;gap:4px;margin-bottom:var(--spacing-lg);overflow-x:auto;-webkit-overflow-scrolling:touch; }
.work-tabs__btn { padding:8px 18px;border:none;border-radius:var(--radius-full);background:transparent;color:var(--color-text-secondary);font-size:14px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:all .15s; }
.work-tabs__btn:hover { background:var(--color-primary-bg);color:var(--color-primary); }
.work-tabs__btn.active { background:var(--color-primary);color:#fff;font-weight:600; }
.work-tab { min-height:300px; }

/* ---- Empty State ---- */
.work-empty { display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 20px; }
.work-empty__icon { font-size:48px;opacity:.4; }
.work-empty__text { font-size:15px;color:var(--color-text-tertiary);margin:0; }
.work-empty__btn { padding:10px 24px;border:none;border-radius:var(--radius-button);background:var(--color-primary);color:#fff;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600; }

/* ---- FAB ---- */
.work-fab { position:fixed;bottom:80px;right:24px;z-index:50; }
.work-fab--row { display:flex;gap:8px; }
.fab-btn { padding:12px 20px;border:none;border-radius:var(--radius-full);background:var(--color-primary);color:#fff;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600;box-shadow:var(--shadow-md);transition:all .15s; }
.fab-btn:hover { transform:translateY(-1px);box-shadow:var(--shadow-lg); }
.fab-btn:active { transform:translateY(0); }
.fab-btn--todo { background:var(--color-accent-soft); }
.fab-btn--secondary { background:var(--color-bg-card);color:var(--color-text-primary);border:1px solid var(--color-border-light); }

/* ---- Todo Batch Bar ---- */
.todo-batch-bar { display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--color-primary-bg);border-radius:var(--radius-md);margin-bottom:12px;flex-wrap:wrap; }
.todo-batch-bar__count { font-size:13px;font-weight:600;color:var(--color-primary);margin-right:auto; }
.todo-batch-bar__btn { padding:5px 12px;border:1px solid var(--color-border);border-radius:6px;background:#fff;font-size:12px;font-family:inherit;cursor:pointer;color:var(--color-text-secondary);transition:all .15s; }
.todo-batch-bar__btn:hover { background:var(--color-bg); }
.todo-batch-bar__btn--complete { color:var(--color-secondary);border-color:rgba(107,158,133,.3); }
.todo-batch-bar__btn--delete { color:var(--color-error);border-color:rgba(191,97,106,.3); }

/* ---- Todo List ---- */
.todo-list { display:flex;flex-direction:column; }
.todo-list__header { display:flex;justify-content:space-between;align-items:center;padding:0 4px 8px; }
.todo-list__date { font-size:13px;font-weight:600;color:var(--color-text-secondary); }
.todo-list__stats { font-size:12px;color:var(--color-text-tertiary); }
.todo-row { display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius-sm);transition:background .1s; }
.todo-row:hover { background:var(--color-bg); }
.todo-row--done { opacity:.55; }
.todo-row--selected { background:var(--color-primary-bg); }
.todo-row__check { width:22px;height:22px;border-radius:50%;border:2px solid var(--color-border);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .15s; }
.todo-row__check.checked { background:var(--color-secondary);border-color:var(--color-secondary); }
.todo-row__body { flex:1;min-width:0;cursor:pointer; }
.todo-row__title { display:block;font-size:15px;color:var(--color-text-primary); }
.todo-row__meta { font-size:12px;color:var(--color-text-tertiary); }
.todo-row__deadline { font-size:11px;color:var(--color-accent-soft);font-weight:500; }
.todo-row__title.done { text-decoration:line-through;color:var(--color-text-tertiary); }
.todo-row__del { padding:4px;border:none;background:transparent;color:var(--color-text-tertiary);cursor:pointer;opacity:0;transition:all .15s; }
.todo-row:hover .todo-row__del { opacity:1; }
.todo-row__del:hover { color:var(--color-error); }

/* ---- Work Groups (行政安排) ---- */
.work-group { margin-bottom:24px; }
.work-group__head { display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;padding:0 4px; }
.work-group__date { font-size:15px;font-weight:600;color:var(--color-text-primary); }
.work-group__count { font-size:12px;color:var(--color-text-secondary); }
.work-group__list { display:flex;flex-direction:column;gap:8px; }
.work-item-row { display:flex;align-items:flex-start;gap:4px; }
.work-item-row .work-card { flex:1;min-width:0; }
.work-item-row__del { flex-shrink:0;padding:6px;margin-top:8px;border:none;background:transparent;color:var(--color-text-tertiary);cursor:pointer;border-radius:6px;opacity:0;transition:all .15s; }
.work-item-row:hover .work-item-row__del { opacity:1; }
.work-item-row__del:hover { color:var(--color-error);background:rgba(191,97,106,.08); }

/* ---- Student Groups ---- */
.student-group { margin-bottom:24px; }
.student-group__title { font-size:15px;font-weight:600;color:var(--color-text-primary);margin:0 0 10px;padding-left:4px; }
.student-group__grid { display:flex;flex-direction:column;gap:8px; }

/* ---- Modal ---- */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.25);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:16px; }
.modal-sheet { width:100%;max-width:480px;max-height:85vh;overflow-y:auto;background:#fff;border-radius:var(--radius-xl);padding:24px 20px 20px;box-shadow:var(--shadow-lg); }
.modal-sheet__title { font-size:18px;font-weight:700;color:var(--color-text-primary);margin:0 0 20px; }
.modal-sheet__hint { font-size:12px;color:var(--color-text-tertiary);margin:0 0 12px;line-height:1.5; }
.modal-sheet__del { display:block;width:100%;padding:10px;margin-top:16px;border:none;background:transparent;color:var(--color-error);font-size:13px;font-family:inherit;cursor:pointer;border-radius:var(--radius-sm); }
.modal-sheet__del:hover { background:#FDF0ED; }
.modal-form { display:flex;flex-direction:column;gap:12px; }
.modal-input { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none; }
.modal-input:focus { border-color:var(--color-primary); }
.modal-textarea { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:13px;font-family:monospace;outline:none;resize:vertical;line-height:1.6; }
.modal-textarea:focus { border-color:var(--color-primary); }
.modal-form__actions { display:flex;gap:10px;justify-content:flex-end; }
.modal-btn { padding:10px 24px;border:none;border-radius:var(--radius-button);font-size:14px;font-family:inherit;cursor:pointer;transition:all .15s; }
.modal-btn--cancel { background:var(--color-bg);color:var(--color-text-secondary); }
.modal-btn--cancel:hover { background:var(--color-border); }
.modal-btn--save { background:var(--color-primary);color:#fff;font-weight:600; }
.modal-btn--save:hover { background:var(--color-primary-dark); }
.modal-btn--save:disabled { opacity:.6;cursor:not-allowed; }

/* ---- Transitions ---- */
.fade-enter-active,.fade-leave-active { transition:opacity .2s; }
.fade-enter-from,.fade-leave-to { opacity:0; }
.modal-enter-active,.modal-leave-active { transition:all .25s ease; }
.modal-enter-active .modal-sheet,.modal-leave-active .modal-sheet { transition:transform .25s ease; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-sheet { transform:translateY(30px); }
.modal-leave-to .modal-sheet { transform:translateY(30px); }

@media (min-width:768px) {
  .modal-overlay { align-items:center;padding:40px; }
}
@media (max-width:767px) {
  .work-fab { bottom:88px;right:16px; }
}
</style>
