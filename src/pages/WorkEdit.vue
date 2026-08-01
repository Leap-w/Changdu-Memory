<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkStore } from '@/stores/work'
import WorkEditor from '@/components/work/WorkEditor.vue'
import { useMessage } from 'naive-ui'

const router = useRouter()
const workStore = useWorkStore()
const message = useMessage()

async function handleSubmit(data: {
  title: string
  content: string
  work_date: string
}) {
  try {
    await workStore.addWork(data)
    message.success('已添加')
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
      添加安排
    </h1>

    <WorkEditor
      :loading="workStore.loading"
      submit-label="添加"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
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
