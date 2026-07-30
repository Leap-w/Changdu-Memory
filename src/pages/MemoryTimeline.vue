<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '@/stores/location'
import { usePhotoStore } from '@/stores/photo'
import { fetchLocationTagIds } from '@/repositories/TagRepository'
import type { Location } from '@/repositories/LocationRepository'
import type { PhotoRecord } from '@/repositories/PhotoRepository'

const router = useRouter()
const locationStore = useLocationStore()
const photoStore = usePhotoStore()

const ready = ref(false)
const activeType = ref<string>('all')

// ==========================================
// Type mapping: location_type → event type
// ==========================================
const typeMap: Record<string, { label: string; icon: string; color: string }> = {
  school: { label: '教学',    icon: '📚', color: '#5E81AC' },
  city:   { label: '活动',    icon: '🎉', color: '#D08770' },
  travel: { label: '旅行',    icon: '🏔️', color: '#6B9E85' },
  life:   { label: '生活',    icon: '☕', color: '#8E7CB5' },
  other:  { label: '重要事件',icon: '⭐', color: '#BF616A' },
}

const types = computed(() => {
  const set = new Set(locationStore.locations.map((l) => l.location_type))
  return ['all', ...set]
})

// ==========================================
// Data loading
// ==========================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tagCache = ref<Record<string, any[]>>({})

onMounted(async () => {
  if (locationStore.locations.length === 0) await locationStore.loadLocations()
  if (photoStore.photos.length === 0) {
    try { await photoStore.loadPhotos() } catch { /* ignore */ }
  }

  // Load tags for each location (limited to 20 for performance)
  const batch = locationStore.locations.slice(0, 20).map(async (l) => {
    try { tagCache.value[l.id] = await fetchLocationTagIds(l.id) } catch { tagCache.value[l.id] = [] }
  })
  await Promise.allSettled(batch)
  ready.value = true
})

// ==========================================
// Events = locations sorted by visit_date DESC
// ==========================================
const filteredLocations = computed(() => {
  let list = locationStore.locations
  if (activeType.value !== 'all') list = list.filter((l) => l.location_type === activeType.value)
  return list
})

const groupedByMonth = computed(() => {
  const groups: { month: string; items: (Location & { photos: PhotoRecord[] })[] }[] = []
  for (const l of filteredLocations.value) {
    const month = (l.visit_date || '').substring(0, 7)
    const relatedPhotos = photoStore.photos.filter((p) => p.location_id === l.id)
    const item = { ...l, photos: relatedPhotos }
    const last = groups[groups.length - 1]
    if (last && last.month === month) last.items.push(item)
    else groups.push({ month, items: [item] })
  }
  return groups
})

// ==========================================
// Helpers
// ==========================================
function formatMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${y}年${parseInt(mo)}月`
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}

function getType(loc: Location) {
  return typeMap[loc.location_type] || { label: loc.location_type, icon: '📍', color: '#6B7B8D' }
}

function getPhotoUrl(p: PhotoRecord) {
  return photoStore.getPhotoDisplayUrl(p)
}

function goDetail(id: string) {
  router.push(`/location/${id}`)
}

function getTypeLabel(key: string): string {
  return typeMap[key]?.label || key
}
</script>

<template>
  <div class="tl">
    <!-- Header -->
    <div class="tl__hero">
      <h1 class="tl__title">大事记</h1>
      <p class="tl__sub">在昌都的一年，每一个重要时刻</p>
    </div>

    <!-- Type filter -->
    <div class="tl__types">
      <button
        v-for="t in types" :key="t"
        class="tl__type-btn" :class="{ active: activeType === t }"
        @click="activeType = t"
      >{{ t === 'all' ? '全部' : getTypeLabel(t) }}</button>
    </div>

    <!-- Empty -->
    <div v-if="ready && filteredLocations.length === 0" class="tl__empty">
      <div class="tl__empty-icon">📜</div>
      <p>还没有记录，从「地点」添加你的足迹吧</p>
    </div>

    <!-- Timeline -->
    <div v-else class="tl__timeline">
      <div v-for="group in groupedByMonth" :key="group.month" class="tl__group">
        <!-- Month header -->
        <h2 class="tl__g-mo">{{ formatMonth(group.month) }}</h2>

        <div class="tl__events">
          <div
            v-for="(event, ei) in group.items" :key="event.id"
            class="tl__event"
            :class="{ 'tl__event--alt': ei % 2 === 1 }"
            @click="goDetail(event.id)"
          >
            <!-- Dot + line -->
            <div class="tl__event-gutter">
              <div class="tl__event-dot" :style="{ background: getType(event).color }"></div>
            </div>

            <!-- Card -->
            <div class="tl__card" :class="{ 'tl__card--alt': ei % 2 === 1 }">
              <!-- Date row -->
              <div class="tl__card-date">
                <span class="tl__card-day">{{ formatDay(event.visit_date || '') }}</span>
                <span class="tl__card-wd">{{ formatWeekday(event.visit_date || '') }}</span>
                <span class="tl__card-type" :style="{ color: getType(event).color, background: getType(event).color + '14' }">
                  {{ getType(event).icon }} {{ getType(event).label }}
                </span>
              </div>

              <h3 class="tl__card-title">{{ event.name }}</h3>

              <!-- Address -->
              <p v-if="event.address" class="tl__card-addr">📍 {{ event.address }}</p>

              <!-- Description -->
              <p v-if="event.description" class="tl__card-desc">{{ event.description.slice(0, 120) }}{{ event.description.length > 120 ? '…' : '' }}</p>

              <!-- Photos -->
              <div v-if="event.photos.length" class="tl__card-photos">
                <img
                  v-for="(p, pi) in event.photos.slice(0, 4)" :key="p.id"
                  :src="getPhotoUrl(p)"
                  class="tl__card-photo" :class="{ 'tl__card-photo--more': pi === 3 && event.photos.length > 4 }"
                  loading="lazy" alt=""
                />
                <span v-if="event.photos.length > 4" class="tl__card-photo-count">+{{ event.photos.length - 4 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom -->
    <p class="tl__footer">昌都记忆 · 大事记</p>
  </div>
</template>

<style scoped>
.tl { max-width:720px;margin:0 auto;padding:var(--spacing-page);padding-bottom:80px; }

/* Hero */
.tl__hero { margin-bottom:28px; }
.tl__title { font-size:32px;font-weight:700;color:var(--color-text-primary);margin:0 0 6px;letter-spacing:1px; }
.tl__sub { font-size:14px;color:var(--color-text-tertiary);margin:0; }

/* Type filter */
.tl__types { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px; }
.tl__type-btn { padding:5px 14px;border:1px solid var(--color-border-light);border-radius:var(--radius-full);background:#fff;color:var(--color-text-secondary);font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s; }
.tl__type-btn:hover { border-color:var(--color-primary);color:var(--color-primary); }
.tl__type-btn.active { background:var(--color-primary);color:#fff;font-weight:600;border-color:var(--color-primary); }

/* Empty */
.tl__empty { text-align:center;padding:80px 20px; }
.tl__empty-icon { font-size:56px;opacity:.3;margin-bottom:12px; }
.tl__empty p { font-size:15px;color:var(--color-text-tertiary);margin:0; }

/* Timeline */
.tl__timeline { }
.tl__group { margin-bottom:20px; }
.tl__g-mo { font-size:16px;font-weight:700;color:var(--color-primary);margin:0 0 16px;padding-left:32px;position:relative; }
.tl__g-mo::before { content:'';position:absolute;left:4px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--color-primary);border:3px solid var(--color-bg); }

.tl__events { position:relative;padding-left:28px; }
.tl__events::before { content:'';position:absolute;left:8px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,var(--color-primary) 0%,rgba(94,129,172,.12) 100%); }

/* Event */
.tl__event { position:relative;margin-bottom:20px;display:flex; }
.tl__event-gutter { position:absolute;left:-18px;top:14px; }
.tl__event-dot { width:10px;height:10px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.06); }

/* Card */
.tl__card { padding:18px 20px;background:#fff;border-radius:var(--radius-lg);border:1px solid var(--color-border-light);transition:all .15s;cursor:pointer;box-shadow:var(--shadow-sm); }
.tl__card:hover { box-shadow:var(--shadow-md);border-color:transparent;transform:translateY(-1px); }

.tl__card-date { display:flex;align-items:center;gap:8px;margin-bottom:8px; }
.tl__card-day { font-size:18px;font-weight:700;color:var(--color-text-primary); }
.tl__card-wd { font-size:12px;color:var(--color-text-tertiary); }
.tl__card-type { font-size:11px;font-weight:600;padding:1px 8px;border-radius:4px;margin-left:auto; }

.tl__card-title { font-size:17px;font-weight:600;color:var(--color-text-primary);margin:0 0 6px; }
.tl__card-addr { font-size:13px;color:var(--color-text-secondary);margin:0 0 6px; }
.tl__card-desc { font-size:14px;color:var(--color-text-secondary);line-height:1.6;margin:0; }

/* Photos in card */
.tl__card-photos { display:flex;gap:6px;margin-top:12px;position:relative; }
.tl__card-photo { width:72px;height:72px;border-radius:var(--radius-sm);object-fit:cover; }
.tl__card-photo--more { filter:brightness(.6); }
.tl__card-photo-count { position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px; }

/* Footer */
.tl__footer { text-align:center;font-size:12px;color:var(--color-text-tertiary);opacity:.4;margin-top:24px; }

@media (max-width:500px) {
  .tl__title { font-size:26px; }
  .tl__card { padding:14px 16px; }
  .tl__card-photo { width:56px;height:56px; }
}
</style>
