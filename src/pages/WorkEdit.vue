<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkStore } from '@/stores/work'
import WorkEditor from '@/components/work/WorkEditor.vue'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const workStore = useWorkStore()
const message = useMessage()

const workId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!workId.value)

const loading = ref(false)
const existingWork = ref<{
  title: string
  content: string
  work_date: string
} | null>(null)

onMounted(async () => {
  if (workId.value) {
    loading.value = true
    try {
      const cached = workStore.works.find((w) => w.id === workId.value)
      if (cached) {
        existingWork.value = {
          title: cached.title,
          content: cached.content || '',
          work_date: cached.work_date,
        }
      } else {
        message.warning('记录不存在')
        router.push('/work?tab=行政安排')
      }
    } catch {
      message.error('加载失败')
      router.push('/work?tab=行政安排')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit(data: {
  title: string
  content: string
  work_date: string
}) {
  try {
    if (isEdit.value && workId.value) {
      await workStore.editWork(workId.value, data)
      message.success('已更新')
    } else {
      await workStore.addWork(data)
      message.success('已添加')
    }
    router.push('/work?tab=行政安排')
  } catch {
    message.error('保存失败')
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="work-edit-page">
    <h1 class="work-edit-page__title">
      {{ isEdit ? '编辑安排' : '添加安排' }}
    </h1>

    <NSpin :show="loading">
      <WorkEditor
        v-if="!loading"
        :title="existingWork?.title"
        :content="existingWork?.content"
        :work-date="existingWork?.work_date"
        :loading="workStore.loading"
        :submit-label="isEdit ? '保存' : '添加'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.work-edit-page {
  max-width: 680px;
  margin: 0 auto;
}

.work-edit-page__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0 0 28px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
