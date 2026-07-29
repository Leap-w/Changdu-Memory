<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDiaryStore } from '@/stores/diary'
import { useWorkStore } from '@/stores/work'
import { useLocationStore } from '@/stores/location'
import { usePhotoStore } from '@/stores/photo'
import { useAuthStore } from '@/stores/auth'
import { NCard, NTag, NSpin } from 'naive-ui'

const diaryStore = useDiaryStore()
const workStore = useWorkStore()
const locationStore = useLocationStore()
const photoStore = usePhotoStore()
const authStore = useAuthStore()

const ready = ref(false)

const today = new Date().toISOString().split('T')[0]

/** 今日日记 */
const todayDiaries = computed(() =>
  diaryStore.diaries.filter((d) => d.diary_date === today),
)

/** 今日工作 */
const todayWorks = computed(() => workStore.todayWorks)

/** 今日地点 */
const todayLocations = computed(() =>
  locationStore.locations.filter((l) => l.visit_date === today),
)

/** 今日照片数 */
const todayPhotoCount = computed(() =>
  photoStore.photos.filter((p) => p.photo_date === today).length,
)

/** 今日是否有任何记录 */
const hasTodayData = computed(
  () =>
    todayDiaries.value.length > 0 ||
    todayWorks.value.length > 0 ||
    todayLocations.value.length > 0 ||
    todayPhotoCount.value > 0,
)

/** 本周日期格式化 */
const todayDisplay = computed(() => {
  const d = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
})

const periodLabels: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}

onMounted(async () => {
  // 游客模式：不加载数据，直接显示空状态
  if (!authStore.isLoggedIn) {
    ready.value = true
    return
  }

  // 只在未加载时拉取
  const promises: Promise<unknown>[] = []
  if (diaryStore.diaries.length === 0) promises.push(diaryStore.loadDiaries())
  if (workStore.works.length === 0) promises.push(workStore.loadWorks())
  if (locationStore.locations.length === 0) promises.push(locationStore.loadLocations())
  if (photoStore.photos.length === 0) promises.push(photoStore.loadPhotos())

  if (promises.length > 0) {
    await Promise.allSettled(promises)
  }
  ready.value = true
})
</script>

<template>
  <NCard class="memory-card">
    <NSpin :show="!ready">
      <div class="memory-card__inner">
        <!-- 日期标题 -->
        <div class="memory-card__date-row">
          <span class="memory-card__date-icon">📅</span>
          <span class="memory-card__date-text">{{ todayDisplay }}</span>
        </div>

        <!-- 今日地点 -->
        <div
          v-if="todayLocations.length > 0"
          class="memory-card__section"
        >
          <span class="memory-card__section-label">📍 今天在</span>
          <span class="memory-card__section-value">
            {{ todayLocations.map((l) => l.name).join('、') }}
          </span>
        </div>

        <!-- 今日工作 -->
        <div
          v-if="todayWorks.length > 0"
          class="memory-card__section"
        >
          <span class="memory-card__section-label">今天的工作</span>
          <div class="memory-card__work-list">
            <div
              v-for="w in todayWorks"
              :key="w.id"
              class="memory-card__work-item"
            >
              <NTag
                :bordered="false"
                size="tiny"
                :type="w.period === 'morning' ? 'info' : w.period === 'afternoon' ? 'warning' : 'default'"
              >
                {{ periodLabels[w.period] || w.period }}
              </NTag>
              <span class="memory-card__work-title">{{ w.title }}</span>
            </div>
          </div>
        </div>

        <!-- 今日日记 -->
        <div
          v-if="todayDiaries.length > 0"
          class="memory-card__section"
        >
          <span class="memory-card__section-label">今日记录</span>
          <div
            v-for="d in todayDiaries.slice(0, 2)"
            :key="d.id"
            class="memory-card__diary-item"
          >
            📖
            <span class="memory-card__diary-title">
              {{ d.title || '无标题' }}
            </span>
          </div>
        </div>

        <!-- 今日照片 -->
        <div
          v-if="todayPhotoCount > 0"
          class="memory-card__section"
        >
          <span class="memory-card__section-label">📷 照片</span>
          <span class="memory-card__section-value">
            {{ todayPhotoCount }} 张
          </span>
        </div>

        <!-- 无记录时 -->
        <div
          v-if="!hasTodayData && ready"
          class="memory-card__empty"
        >
          <span class="memory-card__empty-icon">📝</span>
          <span class="memory-card__empty-text">今天还没有记录，去写点什么吧</span>
        </div>
      </div>
    </NSpin>
  </NCard>
</template>

<style scoped>
.memory-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  background: linear-gradient(170deg, #fdfdff 0%, var(--color-bg) 100%);
  border: 1px solid rgba(79, 142, 247, 0.08);
}

.memory-card :deep(.n-card__content) {
  padding: 0;
}

.memory-card__inner {
  padding: 20px 20px 16px;
}

/* 日期行 */
.memory-card__date-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(79, 142, 247, 0.15);
}

.memory-card__date-icon {
  font-size: 20px;
}

.memory-card__date-text {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 每个 section */
.memory-card__section {
  margin-bottom: 12px;
}

.memory-card__section:last-child {
  margin-bottom: 0;
}

.memory-card__section-label {
  display: block;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.memory-card__section-value {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  font-weight: 500;
}

/* 工作列表 */
.memory-card__work-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memory-card__work-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.memory-card__work-title {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
}

/* 日记条目 */
.memory-card__diary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
}

.memory-card__diary-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.memory-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0 8px;
}

.memory-card__empty-icon {
  font-size: 28px;
  opacity: 0.4;
}

.memory-card__empty-text {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
}
</style>
