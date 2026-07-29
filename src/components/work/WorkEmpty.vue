<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

function goCreate() {
  router.push('/work/new')
}
</script>

<template>
  <div class="work-empty">
    <div class="work-empty__icon">
      📋
    </div>
    <h3 class="work-empty__title">
      还没有工作安排
    </h3>
    <p class="work-empty__desc">
      记录支教期间的教学、会议、培训等工作。
    </p>
    <NButton type="primary" @click="goCreate">
      添加工作
    </NButton>
  </div>
</template>

<style scoped>
.work-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.work-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.work-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.work-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
