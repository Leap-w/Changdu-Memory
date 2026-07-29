<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activeType: string
  activeMonth: string
  availableMonths: string[]
}>()

const emit = defineEmits<{
  'update:activeType': [value: string]
  'update:activeMonth': [value: string]
}>()

const typeOptions = [
  { label: '全部', value: 'all' },
  { label: '📖 日记', value: 'diary' },
  { label: '📷 照片', value: 'photo' },
  { label: '📍 地点', value: 'location' },
  { label: '📋 工作', value: 'work' },
]

const monthOptions = computed(() => [
  { label: '全部时间', value: 'all' },
  ...props.availableMonths.map((m) => {
    const [, month] = m.split('-')
    return { label: `${parseInt(month)}月`, value: m }
  }),
])

</script>

<template>
  <div class="search-filter">
    <div class="filter-segment">
      <button
        v-for="opt in typeOptions"
        :key="opt.value"
        class="filter-btn"
        :class="{ active: activeType === opt.value }"
        @click="emit('update:activeType', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="monthOptions.length > 1" class="filter-month-row">
      <select
        class="filter-select"
        :value="activeMonth"
        @change="emit('update:activeMonth', ($event.target as HTMLSelectElement).value)"
      >
        <option
          v-for="opt in monthOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.search-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-segment {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  background: var(--color-bg);
  border-radius: 10px;
  padding: 3px;
}

.filter-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.filter-btn.active {
  background: var(--color-bg-white);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.filter-select {
  padding: 5px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: var(--font-caption);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg-white);
}
</style>
