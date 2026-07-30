<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '@/stores/photo'
import PhotoCard from '@/components/photo/PhotoCard.vue'

const router = useRouter()
const photoStore = usePhotoStore()

const activeCategory = ref<string>('all')
const selectedMonth = ref<string>('all')
const viewMode = ref<'grid' | 'timeline'>('grid')

onMounted(() => { photoStore.loadPhotos() })

const availableMonths = computed(() => {
  const set = new Set(photoStore.photos.map((p) => p.photo_date.substring(0, 7)))
  return [...set].sort().reverse()
})

const filtered = computed(() => {
  let list = photoStore.photos
  if (activeCategory.value !== 'all') list = list.filter((p) => p.category === activeCategory.value)
  if (selectedMonth.value !== 'all') list = list.filter((p) => p.photo_date.startsWith(selectedMonth.value))
  return list
})

const groupedByMonth = computed(() => {
  const groups: { month: string; items: typeof filtered.value }[] = []
  for (const p of filtered.value) {
    const m = p.photo_date.substring(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === m) { last.items.push(p) } else { groups.push({ month: m, items: [p] }) }
  }
  return groups
})

const categories = [
  { value: 'all', label: '全部' },
  { value: 'school', label: '教学' },
  { value: 'people', label: '学生' },
  { value: 'life', label: '生活' },
  { value: 'travel', label: '旅行' },
  { value: 'other', label: '活动' },
]

function formatMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${y}年${parseInt(mo)}月`
}

function goDetail(id: string) { router.push(`/photo/${id}`) }
function goUpload() { router.push('/photo/new') }
</script>

<template>
  <div class="pp">
    <!-- Header -->
    <div class="pp__head">
      <h1 class="pp__title">照片</h1>
      <div class="pp__head-actions">
        <button
          class="pp__mode-btn" :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >◫</button>
        <button
          class="pp__mode-btn" :class="{ active: viewMode === 'timeline' }"
          @click="viewMode = 'timeline'"
        >☰</button>
        <button class="pp__upload-btn" @click="goUpload">+ 上传</button>
      </div>
    </div>

    <!-- Category filters -->
    <div class="pp__cats">
      <button
        v-for="c in categories" :key="c.value"
        class="pp__cat-btn" :class="{ active: activeCategory === c.value }"
        @click="activeCategory = c.value"
      >{{ c.label }}</button>
    </div>

    <!-- Month filter -->
    <select v-if="availableMonths.length > 1" v-model="selectedMonth" class="pp__month-sel">
      <option value="all">全部月份</option>
      <option v-for="m in availableMonths" :key="m" :value="m">{{ formatMonth(m) }}</option>
    </select>

    <!-- Grid / Waterfall view -->
    <div v-if="viewMode === 'grid'" class="pp__masonry">
      <PhotoCard
        v-for="p in filtered" :key="p.id"
        :photo="p"
        @click="goDetail"
      />
    </div>

    <!-- Timeline view -->
    <div v-else>
      <div v-for="group in groupedByMonth" :key="group.month" class="pp__group">
        <h2 class="pp__group-mo">{{ formatMonth(group.month) }} <span class="pp__group-count">{{ group.items.length }} 张</span></h2>
        <div class="pp__masonry">
          <PhotoCard
            v-for="p in group.items" :key="p.id"
            :photo="p"
            @click="goDetail"
          />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="photoStore.photos.length === 0" class="pp__empty">
      <div class="pp__empty-icon">📷</div>
      <p>还没有照片，上传你支教的第一张照片吧</p>
      <button class="pp__upload-btn" @click="goUpload">上传照片</button>
    </div>
    <div v-else-if="filtered.length === 0" class="pp__empty">
      <p>没有找到匹配的照片</p>
    </div>
  </div>
</template>

<style scoped>
.pp { max-width:1200px;margin:0 auto;padding:var(--spacing-page);padding-bottom:80px; }

/* Header */
.pp__head { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
.pp__title { font-size:var(--font-title);font-weight:700;color:var(--color-text-primary);margin:0; }
.pp__head-actions { display:flex;gap:6px;align-items:center; }
.pp__mode-btn { width:32px;height:32px;border:1px solid var(--color-border);border-radius:6px;background:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary); }
.pp__mode-btn.active { background:var(--color-primary);border-color:var(--color-primary);color:#fff; }
.pp__upload-btn { padding:8px 18px;border:none;border-radius:var(--radius-button);background:var(--color-primary);color:#fff;font-size:13px;font-family:inherit;font-weight:600;cursor:pointer; }

/* Categories */
.pp__cats { display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;background:var(--color-bg);padding:3px;border-radius:var(--radius-button); }
.pp__cat-btn { padding:5px 14px;border:none;border-radius:10px;background:transparent;color:var(--color-text-secondary);font-size:13px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:all .15s; }
.pp__cat-btn.active { background:#fff;color:var(--color-primary);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.06); }

/* Month select */
.pp__month-sel { padding:6px 10px;border:1px solid var(--color-border);border-radius:8px;font-size:12px;font-family:inherit;color:var(--color-text-primary);background:#fff;margin-bottom:14px; }

/* Waterfall / Masonry */
.pp__masonry { column-count:2;column-gap:12px; }
@media (min-width:600px) { .pp__masonry { column-count:3; } }
@media (min-width:900px) { .pp__masonry { column-count:4;column-gap:16px; } }

/* Timeline groups */
.pp__group { margin-bottom:28px; }
.pp__group-mo { font-size:15px;font-weight:600;color:var(--color-text-primary);margin:0 0 12px;padding-left:4px; }
.pp__group-count { font-size:12px;color:var(--color-text-tertiary);font-weight:400;margin-left:6px; }

/* Empty */
.pp__empty { display:flex;flex-direction:column;align-items:center;gap:12px;padding:80px 20px;text-align:center; }
.pp__empty-icon { font-size:56px;opacity:.3; }
.pp__empty p { font-size:15px;color:var(--color-text-tertiary);margin:0; }
</style>
