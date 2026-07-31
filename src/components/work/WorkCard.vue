<script setup lang="ts">
import type { WorkPlan } from '@/repositories/WorkRepository'
import { AppCard } from '@/components/ui'

defineProps<{
  work: WorkPlan
}>()

const emit = defineEmits<{
  click: [id: string]
}>()
</script>

<template>
  <AppCard hoverable class="work-card" @click="emit('click', work.id)">
    <div class="work-card__inner">
      <div class="work-card__body">
        <span class="work-card__title">{{ work.title }}</span>
        <span
          v-if="work.content"
          class="work-card__content"
        >
          {{ work.content.length > 60 ? work.content.slice(0, 60) + '…' : work.content }}
        </span>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.work-card__inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.work-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.work-card__title {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: 500;
}
.work-card__content {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
