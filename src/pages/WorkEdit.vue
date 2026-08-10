<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkStore } from '@/stores/work'
import WorkEditor from '@/components/work/WorkEditor.vue'
import { useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const workStore = useWorkStore()
const message = useMessage()

/** 编辑模式：路由 /work/:id/edit */
const editId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const isEdit = computed(() => !!editId.value)

/** 编辑时预填的数据 */
const editWork = computed(() =>
  workStore.works.find((w) => w.id === editId.value),
)

/** 数据未加载时尝试加载 */
onMounted(async () => {
  if (isEdit.value && workStore.works.length === 0) {
    try { await workStore.loadWorks() } catch { /* ignore */ }
  }
})

async function handleSubmit(data: {
  title: string
  content: string
  work_date: string
  start_time: string | null
  end_time: string | null
}) {
  try {
    if (isEdit.value) {
      await workStore.updateWork(editId.value, data)
      message.success('已保存')
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

    <WorkEditor
      v-if="!isEdit || editWork"
      :title="editWork?.title"
      :content="editWork?.content"
      :work-date="editWork?.work_date"
      :start-time="editWork?.start_time"
      :end-time="editWork?.end_time"
      :loading="workStore.loading"
      :submit-label="isEdit ? '保存' : '添加'"
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
