<script setup lang="ts">
import { NCard, NTag } from 'naive-ui'

defineProps<{
  data: { name: string; color: string; count: number }[]
}>()
</script>

<template>
  <NCard class="tag-card" title="🏷️ 常用标签 Top 10">
    <div v-if="data.length === 0" class="tag-card__empty">
      暂无数据
    </div>
    <div v-else class="tag-card__list">
      <div
        v-for="(t, idx) in data"
        :key="t.name"
        class="tag-item"
      >
        <span class="tag-item__rank">{{ idx + 1 }}</span>
        <NTag
          :bordered="false"
          :color="{ color: t.color, textColor: '#fff' }"
          size="small"
          round
        >
          {{ t.name }}
        </NTag>
        <span class="tag-item__count">{{ t.count }}次</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.tag-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.tag-card__empty {
  text-align: center;
  padding: 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
}

.tag-card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tag-item__rank {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: 700;
  width: 20px;
  text-align: center;
}

.tag-item__count {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-left: auto;
}
</style>
