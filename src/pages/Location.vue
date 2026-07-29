<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '@/stores/location'
import LocationCard from '@/components/location/LocationCard.vue'
import LocationEmpty from '@/components/location/LocationEmpty.vue'
import { NButton, NSpin } from 'naive-ui'

const router = useRouter()
const locationStore = useLocationStore()

onMounted(() => {
  locationStore.loadLocations()
})

function goEdit(id: string) {
  router.push(`/location/${id}/edit`)
}

function goCreate() {
  router.push('/location/new')
}

const typeLabels: Record<string, string> = {
  school: '📚 支教学校',
  city: '🏙️ 城市生活',
  travel: '🏔️ 旅行探索',
  life: '🏠 日常生活',
  other: '📍 其他',
}
</script>

<template>
  <div class="location-page">
    <div class="location-page__header">
      <h1 class="location-page__title">
        地点
      </h1>
      <NButton type="primary" size="medium" @click="goCreate">
        添加
      </NButton>
    </div>

    <NSpin :show="locationStore.loading">
      <LocationEmpty
        v-if="!locationStore.loading && locationStore.locations.length === 0"
      />

      <!-- 按类型分组 -->
      <div
        v-for="group in locationStore.groupedByType"
        v-else
        :key="group.type"
        class="location-group"
      >
        <h2 class="location-group__type">
          {{ typeLabels[group.type] || group.type }}
        </h2>
        <div class="location-group__list">
          <LocationCard
            v-for="loc in group.items"
            :key="loc.id"
            :location="loc"
            @click="goEdit"
          />
        </div>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.location-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.location-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.location-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.location-group {
  margin-bottom: 28px;
}

.location-group__type {
  font-size: var(--font-content);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
  padding-left: 4px;
}

.location-group__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
