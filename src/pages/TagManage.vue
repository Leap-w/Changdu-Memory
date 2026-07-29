<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTagStore } from '@/stores/tag'
import {
  NCard,
  NButton,
  NInput,
  NColorPicker,
  NTag,
  NSpace,
  NSpin,
  NPopconfirm,
  useMessage,
} from 'naive-ui'

const router = useRouter()
const tagStore = useTagStore()
const message = useMessage()

const newTagName = ref('')
const newTagColor = ref('#4F8EF7')

onMounted(() => {
  tagStore.loadTags()
})

async function handleCreate() {
  const name = newTagName.value.trim()
  if (!name) {
    message.warning('请输入标签名称')
    return
  }
  try {
    await tagStore.addTag(name, newTagColor.value)
    newTagName.value = ''
    newTagColor.value = '#4F8EF7'
    message.success('标签已创建')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '创建失败'
    message.warning(msg)
  }
}

async function handleDelete(id: string) {
  try {
    await tagStore.removeTag(id)
    message.success('已删除')
  } catch {
    message.error('删除失败')
  }
}
</script>

<template>
  <div class="tag-manage">
    <div class="tag-manage__header">
      <NButton text size="small" @click="router.back()">
        ← 返回
      </NButton>
    </div>

    <h1 class="tag-manage__title">
      标签管理
    </h1>
    <p class="tag-manage__desc">
      创建标签用于分类日记、照片和地点。所有标签统一管理，手动维护。
    </p>

    <!-- 新建标签 -->
    <NCard class="tag-manage__card" title="新建标签">
      <NSpace align="center">
        <NInput
          v-model:value="newTagName"
          placeholder="标签名称"
          maxlength="20"
          style="width: 200px"
          @keyup.enter="handleCreate"
        />
        <NColorPicker
          v-model:value="newTagColor"
          :show-alpha="false"
          :modes="['hex']"
          size="medium"
        />
        <NButton type="primary" @click="handleCreate">
          添加
        </NButton>
      </NSpace>
    </NCard>

    <!-- 已有标签列表 -->
    <NCard class="tag-manage__card" title="已有标签">
      <NSpin :show="tagStore.loading">
        <div v-if="tagStore.tags.length === 0 && !tagStore.loading" class="tag-manage__empty">
          还没有标签，创建一个吧。
        </div>
        <div v-else class="tag-manage__list">
          <div
            v-for="tag in tagStore.sortedTags"
            :key="tag.id"
            class="tag-manage__item"
          >
            <NTag
              :bordered="false"
              :color="{ color: tag.color, textColor: '#fff' }"
              size="medium"
              round
            >
              {{ tag.name }}
            </NTag>
            <span class="tag-manage__item-color">{{ tag.color }}</span>
            <NPopconfirm @positive-click="handleDelete(tag.id)">
              <template #trigger>
                <NButton text type="error" size="small">
                  删除
                </NButton>
              </template>
              确定删除标签「{{ tag.name }}」？关联数据不受影响。
            </NPopconfirm>
          </div>
        </div>
      </NSpin>
    </NCard>
  </div>
</template>

<style scoped>
.tag-manage {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.tag-manage__header {
  margin-bottom: 8px;
}

.tag-manage__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.tag-manage__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}

.tag-manage__card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-card);
}

.tag-manage__empty {
  text-align: center;
  padding: 24px;
  color: var(--color-text-secondary);
  font-size: var(--font-secondary);
}

.tag-manage__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-manage__item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-manage__item-color {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-family: monospace;
  flex: 1;
}
</style>
