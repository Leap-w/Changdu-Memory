<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Schedule } from '@/repositories/ScheduleRepository'
import { NTimePicker } from 'naive-ui'
import { timeStrToTs, tsToTimeStr } from '@/utils/date'

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

const courseName = ref(props.schedule?.course_name || '数学')
const className = ref(props.schedule?.class_name || '')
const dayOfWeek = ref(props.schedule?.day_of_week || 1)
const startTime = ref(props.schedule?.start_time || '08:00')
const endTime = ref(props.schedule?.end_time || '08:45')
const notes = ref(props.schedule?.notes || '')
const errorMsg = ref('')

const dayOptions = [
  { value: 1, label: '周一' }, { value: 2, label: '周二' },
  { value: 3, label: '周三' }, { value: 4, label: '周四' },
  { value: 5, label: '周五' }, { value: 6, label: '周六' },
  { value: 7, label: '周日' },
]

const timeSlots = [
  { label: '早读', start: '07:30', end: '08:00' },
  { label: '第一节', start: '08:00', end: '08:45' },
  { label: '第二节', start: '08:55', end: '09:40' },
  { label: '第三节', start: '10:00', end: '10:45' },
  { label: '第四节', start: '10:50', end: '11:35' },
  { label: '第五节', start: '14:30', end: '15:15' },
  { label: '第六节', start: '15:25', end: '16:10' },
  { label: '第七节', start: '16:20', end: '17:05' },
  { label: '晚自习', start: '19:00', end: '21:00' },
]

function selectTimeSlot(slot: typeof timeSlots[number]) {
  startTime.value = slot.start
  endTime.value = slot.end
}

// NTimePicker 绑定时间戳，与 'HH:mm' 字符串之间桥接
const startTimeTs = computed({
  get: () => timeStrToTs(startTime.value),
  set: (v: number | null) => { startTime.value = v ? tsToTimeStr(v) : '' },
})
const endTimeTs = computed({
  get: () => timeStrToTs(endTime.value),
  set: (v: number | null) => { endTime.value = v ? tsToTimeStr(v) : '' },
})

function handleSubmit() {
  errorMsg.value = ''
  if (!startTime.value) { errorMsg.value = '请选择开始时间'; return }
  if (!endTime.value) { errorMsg.value = '请选择结束时间'; return }
  emit('submit', {
    course_name: courseName.value.trim() || '数学',
    class_name: className.value.trim(),
    day_of_week: dayOfWeek.value,
    start_time: startTime.value,
    end_time: endTime.value,
    location: '',
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <div class="se">
    <!-- 班级 -->
    <div class="se__field">
      <label class="se__label">班级</label>
      <input
        v-model="className"
        class="se__input"
        placeholder="例：高一(3)班"
        maxlength="30"
      />
    </div>

    <!-- 星期 -->
    <div class="se__field">
      <label class="se__label">星期</label>
      <div class="se__day-row">
        <button
          v-for="d in dayOptions"
          :key="d.value"
          class="se__day-btn"
          :class="{ 'se__day-btn--active': dayOfWeek === d.value }"
          @click="dayOfWeek = d.value"
        >
          {{ d.label }}
        </button>
      </div>
    </div>

    <!-- 时间段快捷选择 -->
    <div class="se__field">
      <label class="se__label">上课时间 / 节次</label>
      <div class="se__slot-row">
        <button
          v-for="slot in timeSlots"
          :key="slot.label"
          class="se__slot-btn"
          :class="{ 'se__slot-btn--active': startTime === slot.start && endTime === slot.end }"
          @click="selectTimeSlot(slot)"
        >
          <span class="se__slot-label">{{ slot.label }}</span>
          <span class="se__slot-time">{{ slot.start }}-{{ slot.end }}</span>
        </button>
      </div>
    </div>

    <div class="se__row">
      <div class="se__field se__field--half">
        <label class="se__label">开始</label>
        <NTimePicker
          v-model:value="startTimeTs"
          format="HH:mm"
          size="large"
          style="width:100%"
        />
      </div>
      <div class="se__field se__field--half">
        <label class="se__label">结束</label>
        <NTimePicker
          v-model:value="endTimeTs"
          format="HH:mm"
          size="large"
          style="width:100%"
        />
      </div>
    </div>

    <!-- 课程名称 -->
    <div class="se__field">
      <label class="se__label">课程名称</label>
      <input
        v-model="courseName"
        class="se__input"
        placeholder="数学"
        maxlength="20"
      />
    </div>

    <!-- 备注 -->
    <div class="se__field">
      <label class="se__label">备注</label>
      <textarea
        v-model="notes"
        class="se__textarea"
        placeholder="教材、教具等..."
        rows="2"
        maxlength="200"
      />
    </div>

    <p v-if="errorMsg" class="se__error">
      {{ errorMsg }}
    </p>

    <div class="se__actions">
      <button class="se__btn se__btn--cancel" @click="emit('cancel')">
        取消
      </button>
      <button class="se__btn se__btn--save" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中…' : (isEdit ? '保存' : '添加') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.se {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.se__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.se__label {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.se__input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast);
}

.se__input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.se__textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-secondary);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.se__textarea:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.se__row {
  display: flex;
  gap: 12px;
}

.se__field--half {
  flex: 1;
}

/* Day buttons */
.se__day-row {
  display: flex;
  gap: 4px;
}

.se__day-btn {
  padding: 6px 0;
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-white);
  font-size: var(--font-caption);
  font-family: inherit;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.se__day-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.se__day-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

/* Time slots */
.se__slot-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.se__slot-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-white);
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.se__slot-btn:hover {
  border-color: var(--color-primary);
}

.se__slot-btn--active {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
}

.se__slot-label {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.se__slot-time {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

/* Actions */
.se__error {
  color: var(--color-error);
  font-size: var(--font-caption);
  margin: 0;
}

.se__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 4px;
}

.se__btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-content);
  font-family: inherit;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
}

.se__btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.se__btn--cancel:hover {
  background: var(--color-border-light);
}

.se__btn--save {
  background: var(--color-primary);
  color: #fff;
}

.se__btn--save:hover {
  background: var(--color-primary-dark);
}

.se__btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
