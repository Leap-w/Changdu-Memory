<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkStore } from '@/stores/work'
import WorkEditor from '@/components/work/WorkEditor.vue'
import { AppIcon } from '@/components/ui'
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

/** 删除（编辑页底部危险操作） */
async function handleDelete() {
  if (!editId.value) return
  if (!confirm('确定删除该安排？此操作将移入回收站。')) return
  try {
    await workStore.removeWork(editId.value)
    message.success('已删除')
    router.push('/work?tab=行政安排')
  } catch {
    message.error('删除失败')
  }
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

    <!-- 危险操作区：删除仅在编辑模式显示，与保存操作明确区分 -->
    <div v-if="isEdit" class="work-edit-page__danger">
      <button
        class="work-edit-page__delete"
        @click="handleDelete"
      >
        <AppIcon name="trash" size="14" /> 删除该安排
      </button>
    </div>
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

/* ---- 危险操作区（删除） ---- */
.work-edit-page__danger {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

.work-edit-page__delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 28px;
  border: 1px solid rgba(194, 103, 106, 0.35);
  border-radius: var(--radius-button);
  background: transparent;
  color: var(--color-error);
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.work-edit-page__delete:hover {
  background: var(--color-error);
  border-color: var(--color-error);
  color: #fff;
}
</style>
