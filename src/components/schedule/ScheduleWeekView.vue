<script setup lang="ts">
import { computed } from 'vue'
import type { Schedule } from '@/repositories/ScheduleRepository'

const props = withDefaults(defineProps<{
  schedules: Schedule[]
  todayDayOfWeek?: number // 1-7, Mon-Sun
}>(), {
  todayDayOfWeek: undefined,
})

const emit = defineEmits<{
  edit: [schedule: Schedule]
  add: [dayOfWeek: number]
}>()

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

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

const SLOT_HEIGHT = 68

const byDayOfWeek = computed(() => {
  const map = new Map<number, Schedule[]>()
  for (let i = 1; i <= 7; i++) map.set(i, [])
  for (const s of props.schedules) {
    const list = map.get(s.day_of_week) || []
    list.push(s)
    map.set(s.day_of_week, list)
  }
  return map
})

function getSlotIndex(schedule: Schedule): number {
  const sTime = schedule.start_time
  for (let i = 0; i < timeSlots.length; i++) {
    const slot = timeSlots[i]
    if (sTime >= slot.start && sTime < slot.end) return i
    if (i < timeSlots.length - 1 && sTime >= slot.start && sTime < timeSlots[i + 1].start) return i
  }
  for (let i = 0; i < timeSlots.length; i++) {
    if (timeSlots[i].start === sTime) return i
  }
  return -1
}
</script>

<template>
  <div class="swv">
    <!-- Header row -->
    <div class="swv__header">
      <div class="swv__time-col-head" />
      <div
        v-for="(name, i) in dayNames"
        :key="i"
        class="swv__day-head"
        :class="{ 'swv__day-head--today': todayDayOfWeek === i + 1 }"
      >
        <span class="swv__day-name">{{ name }}</span>
      </div>
    </div>

    <!-- Time slots -->
    <div class="swv__body">
      <div
        v-for="(slot, si) in timeSlots"
        :key="si"
        class="swv__row"
        :style="{ minHeight: SLOT_HEIGHT + 'px' }"
      >
        <!-- Time label -->
        <div class="swv__time-cell">
          <span class="swv__time-label">{{ slot.label }}</span>
          <span class="swv__time-range">{{ slot.start }}-{{ slot.end }}</span>
        </div>

        <!-- Day columns -->
        <div
          v-for="dayIdx in 7"
          :key="dayIdx"
          class="swv__day-cell"
          :class="{ 'swv__day-cell--today': todayDayOfWeek === dayIdx }"
        >
          <template v-for="s in byDayOfWeek.get(dayIdx) || []" :key="s.id">
            <div
              v-if="getSlotIndex(s) === si"
              class="swv__course-card"
              @click="emit('edit', s)"
            >
              <span class="swv__course-class">{{ s.class_name || '' }}</span>
              <span class="swv__course-name">{{ s.course_name }}</span>
              <span class="swv__course-time">{{ s.start_time }}-{{ s.end_time }}</span>
              <span v-if="s.notes" class="swv__course-notes">{{ s.notes }}</span>
            </div>
          </template>
          <button
            class="swv__add-mini"
            title="添加课程"
            @click="emit('add', dayIdx)"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swv {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-xl);
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
}

/* Header */
.swv__header {
  display: grid;
  grid-template-columns: 72px repeat(7, 1fr);
  border-bottom: 1px solid var(--color-border-light);
  min-width: 800px;
}

.swv__time-col-head {
  padding: 10px 6px;
  border-right: 1px solid var(--color-border-light);
}

.swv__day-head {
  padding: 10px 4px;
  text-align: center;
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  border-right: 1px solid var(--color-border-light);
  transition: background var(--transition-fast);
}

.swv__day-head:last-child {
  border-right: none;
}

.swv__day-head--today {
  background: var(--color-primary-light);
}

.swv__day-name {
  position: relative;
}

/* Body */
.swv__body {
  display: flex;
  flex-direction: column;
}

.swv__row {
  display: grid;
  grid-template-columns: 72px repeat(7, 1fr);
  border-bottom: 1px solid var(--color-border-light);
  min-width: 800px;
}

.swv__row:last-child {
  border-bottom: none;
}

/* Time cell */
.swv__time-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  border-right: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.swv__time-label {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.swv__time-range {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

/* Day cell */
.swv__day-cell {
  padding: 2px;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 1px;
  position: relative;
  transition: background var(--transition-fast);
}

.swv__day-cell:last-child {
  border-right: none;
}

.swv__day-cell--today {
  background: rgba(75, 143, 140, 0.03);
}

/* Course card */
.swv__course-card {
  padding: 4px 6px;
  background: var(--color-primary-bg);
  border: 1px solid rgba(75, 143, 140, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 1px;
  position: absolute;
  inset: 2px;
  z-index: 1;
  overflow: hidden;
}

.swv__course-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  z-index: 2;
  transform: scale(1.03);
}

.swv__course-class {
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.swv__course-name {
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.3;
}

.swv__course-time {
  font-size: 10px;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.swv__course-notes {
  font-size: 10px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Add mini button */
.swv__add-mini {
  width: 100%;
  padding: 2px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
  opacity: 0;
  font-family: inherit;
}

.swv__day-cell:hover .swv__add-mini {
  opacity: 0.4;
}

.swv__add-mini:hover {
  opacity: 1 !important;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

@media (max-width: 767px) {
  .swv__header {
    grid-template-columns: 56px repeat(7, 1fr);
    min-width: 680px;
  }

  .swv__row {
    grid-template-columns: 56px repeat(7, 1fr);
    min-width: 680px;
  }

  .swv__time-label { font-size: 9px; }
  .swv__time-range { font-size: 8px; }
  .swv__course-class { font-size: 10px; }
  .swv__course-name { font-size: 11px; }
  .swv__course-time { font-size: 9px; }
}
</style>
