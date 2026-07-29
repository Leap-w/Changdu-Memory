<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const router = useRouter()

function goCreate() {
  router.push('/todo/new')
}
</script>

<template>
  <div class="todo-empty">
    <div class="todo-empty__icon">
      ✅
    </div>
    <h3 class="todo-empty__title">
      暂无待办
    </h3>
    <p class="todo-empty__desc">
      添加待办事项，让支教生活更有条理。
    </p>
    <NButton type="primary" @click="goCreate">
      创建待办
    </NButton>
  </div>
</template>

<style scoped>
.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.todo-empty__icon {
  font-size: 56px;
  margin-bottom: var(--spacing-card);
  opacity: 0.6;
}

.todo-empty__title {
  font-size: var(--font-card-title);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.todo-empty__desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
</style>
