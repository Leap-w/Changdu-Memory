<script setup lang="ts">
import { ref } from 'vue'
import type { Schedule } from '@/repositories/ScheduleRepository'

interface Props {
  schedule?: Schedule | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  schedule: null,
  loading: false,
})

const emit = defineEmits<{
  submit: [data: {
    course_name: string; class_name: string; day_of_week: number
    start_time: string; end_time: string; location: string; notes: string
  }]
  cancel: []
}>()

const isEdit = !!props.schedule

const courseName = ref(props.schedule?.course_name || '')
const className = ref(props.schedule?.class_name || '')
const dayOfWeek = ref(props.schedule?.day_of_week || 1)
const startTime = ref(props.schedule?.start_time || '08:30')
const endTime = ref(props.schedule?.end_time || '10:00')
const location = ref(props.schedule?.location || '')
const notes = ref(props.schedule?.notes || '')
const errorMsg = ref('')

const dayOptions = [
  { value: 1, label: '周一' }, { value: 2, label: '周二' },
  { value: 3, label: '周三' }, { value: 4, label: '周四' },
  { value: 5, label: '周五' }, { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

function handleSubmit() {
  errorMsg.value = ''
  if (!courseName.value.trim()) { errorMsg.value = '请输入课程名称'; return }
  if (!startTime.value) { errorMsg.value = '请选择开始时间'; return }
  if (!endTime.value) { errorMsg.value = '请选择结束时间'; return }
  emit('submit', {
    course_name: courseName.value.trim(),
    class_name: className.value.trim(),
    day_of_week: dayOfWeek.value,
    start_time: startTime.value,
    end_time: endTime.value,
    location: location.value.trim(),
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <div class="se">
    <div class="se__field">
      <label class="se__label">课程名称 <span style="color:#BF616A">*</span></label>
      <input v-model="courseName" class="se__input" placeholder="例：语文" maxlength="20" />
    </div>
    <div class="se__field">
      <label class="se__label">班级</label>
      <input v-model="className" class="se__input" placeholder="例：三年三班" maxlength="30" />
    </div>
    <div class="se__field">
      <label class="se__label">星期</label>
      <div class="se__day-row">
        <button
          v-for="d in dayOptions" :key="d.value"
          class="se__day-btn" :class="{ active: dayOfWeek === d.value }"
          @click="dayOfWeek = d.value"
        >{{ d.label }}</button>
      </div>
    </div>
    <div class="se__row">
      <div class="se__field se__field--half">
        <label class="se__label">开始</label>
        <input v-model="startTime" type="time" class="se__input" />
      </div>
      <div class="se__field se__field--half">
        <label class="se__label">结束</label>
        <input v-model="endTime" type="time" class="se__input" />
      </div>
    </div>
    <div class="se__field">
      <label class="se__label">地点</label>
      <input v-model="location" class="se__input" placeholder="例：301教室" maxlength="30" />
    </div>
    <div class="se__field">
      <label class="se__label">备注</label>
      <textarea v-model="notes" class="se__textarea" placeholder="教材、教具等..." rows="2" maxlength="200"></textarea>
    </div>

    <p v-if="errorMsg" class="se__error">{{ errorMsg }}</p>

    <div class="se__actions">
      <button class="se__btn se__btn--cancel" @click="emit('cancel')">取消</button>
      <button class="se__btn se__btn--save" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中…' : (isEdit ? '保存' : '添加') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.se { display:flex;flex-direction:column;gap:16px; }
.se__field { display:flex;flex-direction:column;gap:4px; }
.se__label { font-size:13px;font-weight:600;color:var(--color-text-primary); }
.se__input { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:15px;font-family:inherit;color:var(--color-text-primary);background:var(--color-bg);outline:none;transition:border-color .15s; }
.se__input:focus { border-color:var(--color-primary);background:#fff; }
.se__textarea { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;color:var(--color-text-primary);background:var(--color-bg);outline:none;resize:vertical; }
.se__textarea:focus { border-color:var(--color-primary);background:#fff; }
.se__row { display:flex;gap:12px; }
.se__field--half { flex:1; }
.se__day-row { display:flex;gap:4px; }
.se__day-btn { padding:6px 0;flex:1;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:#fff;font-size:12px;font-family:inherit;cursor:pointer;color:var(--color-text-secondary);transition:all .15s; }
.se__day-btn:hover { border-color:var(--color-primary);color:var(--color-primary); }
.se__day-btn.active { background:var(--color-primary);border-color:var(--color-primary);color:#fff;font-weight:600; }
.se__error { color:var(--color-error);font-size:13px;margin:0; }
.se__actions { display:flex;gap:12px;justify-content:flex-end;padding-top:4px; }
.se__btn { padding:10px 24px;border:none;border-radius:var(--radius-button);font-size:15px;font-family:inherit;cursor:pointer;transition:all .15s; }
.se__btn--cancel { background:var(--color-bg);color:var(--color-text-secondary); }
.se__btn--cancel:hover { background:var(--color-border); }
.se__btn--save { background:var(--color-primary);color:#fff;font-weight:600; }
.se__btn--save:hover { background:var(--color-primary-dark); }
.se__btn--save:disabled { opacity:.6;cursor:not-allowed; }
</style>
