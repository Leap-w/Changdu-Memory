<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { NCard, NButton, NSpace, NPopconfirm, NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const diaryStore = useDiaryStore()
const message = useMessage()

const diaryId = computed(() => route.params.id as string)
const diary = ref<{
  id: string
  title: string | null
  content: string | null
  diary_date: string
  created_at: string
} | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await diaryStore.getDiaryById(diaryId.value)
    if (!data) {
      message.error('日记不存在')
      router.push('/diary')
      return
    }
    diary.value = data
  } catch {
    message.error('加载失败')
    router.push('/diary')
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}

function goEdit() {
  router.push(`/diary/${diaryId.value}/edit`)
}

async function handleDelete() {
  try {
    await diaryStore.removeDiary(diaryId.value)
    message.success('已删除')
    router.push('/diary')
  } catch {
    message.error('删除失败')
  }
}
</script>

<template>
  <div class="diary-detail-page">
    <NSpin :show="loading">
      <template v-if="diary">
        <div class="diary-detail__header">
          <NButton text size="small" @click="router.push('/diary')">
            ← 返回列表
          </NButton>
          <NSpace>
            <NButton size="small" @click="goEdit">
              编辑
            </NButton>
            <NPopconfirm @positive-click="handleDelete">
              <template #trigger>
                <NButton size="small" type="error" secondary>
                  删除
                </NButton>
              </template>
              确定删除这篇日记？
            </NPopconfirm>
          </NSpace>
        </div>

        <NCard class="diary-detail__card">
          <h1 class="diary-detail__title">
            {{ diary.title || '无标题' }}
          </h1>
          <p class="diary-detail__date">
            {{ formatDate(diary.diary_date) }}
          </p>
          <div class="diary-detail__content">
            {{ diary.content || '暂无内容' }}
          </div>
        </NCard>
      </template>
    </NSpin>
  </div>
</template>

<style scoped>
.diary-detail-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.diary-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-card);
}

.diary-detail__card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.diary-detail__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.diary-detail__date {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.diary-detail__content {
  font-size: var(--font-content);
  line-height: 2;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
