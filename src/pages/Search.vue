<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useWorkStore } from '@/stores/work'
import { useTagStore } from '@/stores/tag'
import { useAuthStore } from '@/stores/auth'
import { fetchAllDiaryTags } from '@/repositories/TagRepository'
import SearchInput from '@/components/search/SearchInput.vue'
import SearchFilter from '@/components/search/SearchFilter.vue'
import SearchResultCard from '@/components/search/SearchResultCard.vue'
import { globalSearch, type SearchResult } from '@/utils/search'
import { NSpin } from 'naive-ui'

const router = useRouter()
const diaryStore = useDiaryStore()
const workStore = useWorkStore()
const tagStore = useTagStore()
const authStore = useAuthStore()

const loading = ref(true)
const keyword = ref('')
const activeType = ref('all')
const activeMonth = ref('all')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const diaryTags = ref<any[]>([])

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    loading.value = false
    return
  }

  const stores = [
    { load: () => diaryStore.diaries.length > 0 ? Promise.resolve() : diaryStore.loadDiaries() },
    { load: () => workStore.works.length > 0 ? Promise.resolve() : workStore.loadWorks() },
    { load: () => tagStore.tags.length > 0 ? Promise.resolve() : tagStore.loadTags() },
  ]
  await Promise.allSettled(stores.map((s) => s.load()))

  try {
    diaryTags.value = await fetchAllDiaryTags()
  } catch { /* ignore */ }

  loading.value = false
})

const availableMonths = computed(() => {
  const months = new Set<string>()
  for (const d of diaryStore.diaries) months.add(d.diary_date.substring(0, 7))
  for (const w of workStore.works) months.add(w.work_date.substring(0, 7))
  return Array.from(months).sort().reverse()
})

const results = computed<SearchResult[]>(() => {
  if (!keyword.value) return []
  return globalSearch({
    keyword: keyword.value,
    type: activeType.value,
    month: activeMonth.value,
    diaries: diaryStore.diaries,
    works: workStore.works,
    tags: tagStore.tags,
    diaryTags: diaryTags.value,
  })
})

function handleResultClick(result: SearchResult) {
  const routes: Record<string, string> = {
    diary: '/diary/',
    work: '/work/',
  }
  const base = routes[result.type]
  if (base) {
    const suffix = result.type === 'work' ? '/edit' : ''
    router.push(`${base}${result.id}${suffix}`)
  }
}
</script>

<template>
  <div class="search-page">
    <h1 class="search-page__title">
      搜索昌都记忆
    </h1>

    <div class="search-page__input">
      <SearchInput v-model="keyword" />
    </div>

    <div class="search-page__filters">
      <SearchFilter
        :active-type="activeType"
        :active-month="activeMonth"
        :available-months="availableMonths"
        @update:active-type="activeType = $event"
        @update:active-month="activeMonth = $event"
      />
    </div>

    <NSpin :show="loading">
      <div v-if="!keyword" class="search-page__hint">
        输入关键词搜索日记和工作记录
      </div>
      <div v-else-if="!loading && results.length > 0" class="search-page__results">
        <div class="search-page__count">
          找到 {{ results.length }} 条结果
        </div>
        <SearchResultCard
          v-for="r in results"
          :key="`${r.type}-${r.id}`"
          :result="r"
          @click="handleResultClick"
        />
      </div>
      <div v-else-if="!loading && keyword && results.length === 0" class="search-page__empty">
        未找到相关结果
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.search-page { max-width: 720px; margin: 0 auto; }
.search-page__title { font-size: var(--font-page-title, 32px); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); margin: 0 0 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
.search-page__input { margin-bottom: 14px; }
.search-page__filters { margin-bottom: 20px; }
.search-page__hint { text-align: center; padding: 48px 24px; color: var(--color-text-secondary); font-size: var(--font-secondary); }
.search-page__count { font-size: var(--font-caption); color: var(--color-text-secondary); margin-bottom: 12px; padding-left: 4px; }
.search-page__results { display: flex; flex-direction: column; gap: 10px; }
.search-page__empty { text-align: center; padding: 48px 24px; color: var(--color-text-secondary); font-size: var(--font-secondary); }
</style>
