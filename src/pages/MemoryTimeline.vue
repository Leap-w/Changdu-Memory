<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { usePhotoStore } from '@/stores/photo'
import { useLocationStore } from '@/stores/location'
import { useWorkStore } from '@/stores/work'
import { NSpin } from 'naive-ui'

const router = useRouter()
const diaryStore = useDiaryStore()
const photoStore = usePhotoStore()
const locationStore = useLocationStore()
const workStore = useWorkStore()
const ready = ref(false)

onMounted(async () => {
  const stores = [
    () => diaryStore.diaries.length > 0 ? Promise.resolve() : diaryStore.loadDiaries(),
    () => photoStore.photos.length > 0 ? Promise.resolve() : photoStore.loadPhotos(),
    () => locationStore.locations.length > 0 ? Promise.resolve() : locationStore.loadLocations(),
    () => workStore.works.length > 0 ? Promise.resolve() : workStore.loadWorks(),
  ]
  await Promise.allSettled(stores.map((s) => s()))
  ready.value = true
})

interface TimelineEvent {
  date: string
  type: 'diary' | 'photo' | 'location' | 'work'
  id: string
  title: string
  subtitle?: string
  icon: string
}

const events = computed<TimelineEvent[]>(() => {
  const all: TimelineEvent[] = []

  for (const d of diaryStore.diaries) {
    all.push({
      date: d.diary_date, type: 'diary', id: d.id,
      title: d.title || '无标题',
      subtitle: (d.content || '').slice(0, 60),
      icon: '📖',
    })
  }

  for (const p of photoStore.photos) {
    all.push({
      date: p.photo_date, type: 'photo', id: p.id,
      title: p.title || '未命名',
      subtitle: [p.description || '', locationStore.locations.find((l) => l.id === p.location_id)?.name || ''].filter(Boolean).join(' · '),
      icon: '📷',
    })
  }

  for (const l of locationStore.locations) {
    all.push({
      date: l.visit_date || '', type: 'location', id: l.id,
      title: l.name,
      subtitle: l.address || l.description || '',
      icon: '📍',
    })
  }

  for (const w of workStore.works) {
    const periodLabels: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '晚上' }
    all.push({
      date: w.work_date, type: 'work', id: w.id,
      title: w.title,
      subtitle: `${periodLabels[w.period] || w.period} · ${w.category}`,
      icon: '📋',
    })
  }

  return all.sort((a, b) => b.date.localeCompare(a.date))
})

const groupedEvents = computed(() => {
  const groups: { month: string; events: TimelineEvent[] }[] = []
  for (const e of events.value) {
    const month = e.date.substring(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === month) {
      last.events.push(e)
    } else {
      groups.push({ month, events: [e] })
    }
  }
  return groups
})

function handleClick(e: TimelineEvent) {
  const routes: Record<string, string> = {
    diary: '/diary/', photo: '/photo/', location: '/location/',
    work: '/work/',
  }
  const base = routes[e.type]
  const suffix = e.type === 'work' ? '/edit' : ''
  if (base) router.push(`${base}${e.id}${suffix}`)
}

function formatMonth(m: string): string {
  const [y, month] = m.split('-')
  return `${y}年${parseInt(month)}月`
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <div class="timeline-page">
    <h1 class="timeline-page__title">
      📜 记忆时间轴
    </h1>
    <p class="timeline-page__desc">
      按时间查看你在昌都留下的所有印记。
    </p>

    <NSpin :show="!ready">
      <div v-if="ready && events.length === 0" class="timeline-page__empty">
        还没有记录，开始写日记或上传照片吧。
      </div>

      <div v-else class="timeline">
        <div
          v-for="group in groupedEvents"
          :key="group.month"
          class="timeline-month"
        >
          <h2 class="timeline-month__title">
            {{ formatMonth(group.month) }}
          </h2>

          <div
            v-for="e in group.events"
            :key="`${e.type}-${e.id}`"
            class="timeline-event"
            @click="handleClick(e)"
          >
            <div class="timeline-event__dot" />
            <div class="timeline-event__card">
              <div class="timeline-event__header">
                <span class="timeline-event__icon">{{ e.icon }}</span>
                <span class="timeline-event__date">{{ formatDay(e.date) }}</span>
              </div>
              <span class="timeline-event__title">{{ e.title }}</span>
              <span
                v-if="e.subtitle"
                class="timeline-event__subtitle"
              >
                {{ e.subtitle }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.timeline-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.timeline-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.timeline-page__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}

.timeline-page__empty {
  text-align: center;
  padding: 64px 24px;
  color: var(--color-text-secondary);
  font-size: var(--font-secondary);
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--color-primary) 0%, rgba(79,142,247,0.15) 100%);
}

.timeline-month {
  margin-bottom: 24px;
}

.timeline-month__title {
  font-size: var(--font-content);
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 14px;
  position: relative;
}

.timeline-month__title::before {
  content: '';
  position: absolute;
  left: -21px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid var(--color-bg);
}

.timeline-event {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.timeline-event__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(79, 142, 247, 0.3);
  margin-top: 12px;
  flex-shrink: 0;
  position: relative;
  left: -21px;
}

.timeline-event__card {
  flex: 1;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition: transform 0.15s ease;
  min-width: 0;
}

.timeline-event__card:hover {
  transform: translateY(-1px);
}

.timeline-event__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeline-event__icon {
  font-size: 14px;
}

.timeline-event__date {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.timeline-event__title {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  font-weight: 500;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-event__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}
</style>
