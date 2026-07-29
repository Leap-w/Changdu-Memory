<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocationStore } from '@/stores/location'
import LocationEditor from '@/components/location/LocationEditor.vue'
import { NSpin, useMessage } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const locationStore = useLocationStore()
const message = useMessage()

const locationId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!locationId.value)

const loading = ref(false)
const existingLocation = ref<{
  name: string
  location_type: string
  description: string
  address: string
  visit_date: string
} | null>(null)

onMounted(async () => {
  if (locationId.value) {
    loading.value = true
    try {
      const cached = locationStore.locations.find((l) => l.id === locationId.value)
      if (cached) {
        existingLocation.value = {
          name: cached.name,
          location_type: cached.location_type,
          description: cached.description || '',
          address: cached.address || '',
          visit_date: cached.visit_date,
        }
      } else {
        message.warning('记录不存在')
        router.push('/location')
      }
    } catch {
      message.error('加载失败')
      router.push('/location')
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit(data: {
  name: string
  location_type: string
  description: string
  address: string
  visit_date: string
}) {
  try {
    if (isEdit.value && locationId.value) {
      await locationStore.editLocation(locationId.value, data)
      message.success('已更新')
    } else {
      await locationStore.addLocation(data)
      message.success('已添加')
    }
    router.push('/location')
  } catch {
    message.error('保存失败')
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="location-edit-page">
    <h1 class="location-edit-page__title">
      {{ isEdit ? '编辑地点' : '添加地点' }}
    </h1>

    <NSpin :show="loading">
      <LocationEditor
        v-if="!loading"
        :name="existingLocation?.name"
        :location-type="existingLocation?.location_type"
        :description="existingLocation?.description"
        :address="existingLocation?.address"
        :visit-date="existingLocation?.visit_date"
        :loading="locationStore.loading"
        :submit-label="isEdit ? '保存' : '添加'"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </NSpin>
  </div>
</template>

<style scoped>
.location-edit-page {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-page);
}

.location-edit-page__title {
  font-size: var(--font-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 24px;
}
</style>
