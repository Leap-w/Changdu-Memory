<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

function goUpload() {
  router.push('/photo/new')
}
</script>

<template>
  <div class="photo-empty">
    <div class="photo-empty__icon">
      📷
    </div>
    <h3 class="photo-empty__title">
      还没有照片
    </h3>
    <p class="photo-empty__desc">
      上传照片，记录支教生活的每一刻。
    </p>
    <NButton type="primary" @click="goUpload">
      上传照片
    </NButton>
  </div>
</template>

<style scoped>
.photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.photo-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.photo-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.photo-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
