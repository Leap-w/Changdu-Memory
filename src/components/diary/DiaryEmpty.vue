<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

function goCreate() {
  router.push('/diary/new')
}
</script>

<template>
  <div class="diary-empty">
    <div class="diary-empty__icon">
      📖
    </div>
    <h3 class="diary-empty__title">
      还没有日记
    </h3>
    <p class="diary-empty__desc">
      记录你的支教生活，从第一篇日记开始。
    </p>
    <NButton type="primary" @click="goCreate">
      写第一篇日记
    </NButton>
  </div>
</template>

<style scoped>
.diary-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.diary-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.diary-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.diary-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
