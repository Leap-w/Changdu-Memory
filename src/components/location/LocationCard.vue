<script setup lang="ts">
import type { Location } from '@/repositories/LocationRepository'
import { NCard } from 'naive-ui'

defineProps<{
  location: Location
}>()

const emit = defineEmits<{
  click: [id: string]
}>()

const typeIcons: Record<string, string> = {
  school: '🏫',
  city: '🏙️',
  travel: '🏔️',
  life: '🏠',
  other: '📍',
}
</script>

<template>
  <NCard class="location-card" hoverable @click="emit('click', location.id)">
    <div class="location-card__inner">
      <div class="location-card__icon">
        {{ typeIcons[location.location_type] || '📍' }}
      </div>
      <div class="location-card__body">
        <span class="location-card__name">{{ location.name }}</span>
        <span class="location-card__address">{{ location.address || location.description || '暂无描述' }}</span>
      </div>
      <div class="location-card__date">
        {{ location.visit_date }}
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.location-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.location-card :deep(.n-card__content) {
  padding: 14px 16px;
}

.location-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-card__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.location-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.location-card__name {
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: 500;
}

.location-card__address {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-card__date {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
