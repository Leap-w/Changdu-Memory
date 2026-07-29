<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

function goCreate() {
  router.push('/expense/new')
}
</script>

<template>
  <div class="expense-empty">
    <div class="expense-empty__icon">
      💰
    </div>
    <h3 class="expense-empty__title">
      还没有消费记录
    </h3>
    <p class="expense-empty__desc">
      记录支教期间的每一笔开销。
    </p>
    <NButton type="primary" @click="goCreate">
      记录花费
    </NButton>
  </div>
</template>

<style scoped>
.expense-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.expense-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.expense-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.expense-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
