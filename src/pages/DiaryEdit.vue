<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { fetchDiaryTagIds, setDiaryTags } from '@/repositories/TagRepository'
import DiaryEditor from '@/components/diary/DiaryEditor.vue'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const diaryStore = useDiaryStore()
const message = useMessage()

const diaryId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!diaryId.value)

const loading = ref(false)
const existingDiary = ref<{
  title: string
  content: string
  diary_date: string
  tag_ids: string[]
} | null>(null)

onMounted(async () => {
  if (diaryId.value) {
    loading.value = true
    try {
      const diary = await diaryStore.getDiaryById(diaryId.value)
      if (diary) {
        let tagIds: string[] = []
        try {
          tagIds = await fetchDiaryTagIds(diaryId.value)
        } catch { /* ignore */ }
        existingDiary.value = {
          title: diary.title ?? '',
          content: diary.content ?? '',
          diary_date: diary.diary_date,
          tag_ids: tagIds,
        }
      } else {
        message.error('日记不存在')
        router.push('/diary')
      }
    } catch {
      message.error('加载失败')
      router.push('/diary')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit(data: { title: string; content: string; diary_date: string; tag_ids: string[] }) {
  try {
    if (isEdit.value && diaryId.value) {
      await diaryStore.editDiary(diaryId.value, { title: data.title, content: data.content, diary_date: data.diary_date })
      await setDiaryTags(diaryId.value, data.tag_ids)
      message.success('已更新')
      router.push(`/diary/${diaryId.value}`)
    } else {
      const diary = await diaryStore.addDiary({ title: data.title, content: data.content, diary_date: data.diary_date })
      await setDiaryTags(diary.id, data.tag_ids)
      message.success('日记已创建')
      router.push(`/diary/${diary.id}`)
    }
  } catch {
    message.error('保存失败')
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="diary-edit-page">
    <h1 class="diary-edit-page__title">
      {{ isEdit ? '编辑日记' : '写日记' }}
    </h1>

    <NSpin :show="loading">
      <DiaryEditor
        v-if="!loading"
        :title="existingDiary?.title"
        :content="existingDiary?.content"
        :diary-date="existingDiary?.diary_date"
        :tag-ids="existingDiary?.tag_ids"
        :loading="diaryStore.loading"
        :submit-label="isEdit ? '保存' : '创建'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.diary-edit-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.diary-edit-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}
</style>
