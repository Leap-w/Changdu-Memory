<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

function goCreate() {
  router.push('/location/new')
}
</script>

<template>
  <div class="location-empty">
    <div class="location-empty__icon">
      🗺️
    </div>
    <h3 class="location-empty__title">
      还没有地点记录
    </h3>
    <p class="location-empty__desc">
      记录你在昌都生活过的每个地方。
    </p>
    <NButton type="primary" @click="goCreate">
      添加地点
    </NButton>
  </div>
</template>

<style scoped>
.location-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.location-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.location-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.location-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
