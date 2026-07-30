<script setup lang="ts">
import type { Schedule } from '@/repositories/ScheduleRepository'

defineProps<{
  schedules: Schedule[]
}>()

const emit = defineEmits<{
  edit: [schedule: Schedule]
  add: [dayOfWeek: number]
}>()

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
</script>

<template>
  <div class="swv">
    <div class="swv__grid">
      <div v-for="(name, i) in dayNames" :key="i" class="swv__col">
        <div class="swv__col-head">
          <span>{{ name }}</span>
        </div>
        <div class="swv__col-body">
          <div
            v-for="s in schedules.filter(x => x.day_of_week === i + 1)"
            :key="s.id"
            class="swv__card"
            @click="emit('edit', s)"
          >
            <span class="swv__card-name">{{ s.course_name }}</span>
            <span class="swv__card-time">{{ s.start_time }}-{{ s.end_time }}</span>
            <span v-if="s.class_name" class="swv__card-class">{{ s.class_name }}</span>
            <span v-if="s.location" class="swv__card-loc">📍 {{ s.location }}</span>
          </div>
          <button class="swv__add-btn" @click="emit('add', i + 1)">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swv { overflow-x:auto;-webkit-overflow-scrolling:touch; }
.swv__grid { display:grid;grid-template-columns:repeat(7,1fr);gap:4px;min-width:700px; }
.swv__col { display:flex;flex-direction:column;min-height:120px; }
.swv__col-head { padding:8px 4px;text-align:center;font-size:12px;font-weight:600;color:var(--color-text-secondary);background:var(--color-bg);border-radius:var(--radius-sm); }
.swv__col-body { flex:1;display:flex;flex-direction:column;gap:4px;padding:2px 0; }
.swv__card { padding:10px 8px;background:#fff;border:1px solid var(--color-border-light);border-radius:var(--radius-sm);cursor:pointer;transition:all .15s;display:flex;flex-direction:column;gap:2px; }
.swv__card:hover { border-color:var(--color-primary);box-shadow:var(--shadow-sm); }
.swv__card-name { font-size:14px;font-weight:600;color:var(--color-text-primary); }
.swv__card-time { font-size:11px;color:var(--color-primary);font-weight:500; }
.swv__card-class { font-size:11px;color:var(--color-text-secondary); }
.swv__card-loc { font-size:11px;color:var(--color-text-tertiary); }
.swv__add-btn { padding:6px;border:1px dashed var(--color-border);border-radius:var(--radius-sm);background:transparent;color:var(--color-text-tertiary);font-size:18px;cursor:pointer;transition:all .15s;font-family:inherit; }
.swv__add-btn:hover { border-color:var(--color-primary);color:var(--color-primary); }
</style>
