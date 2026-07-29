<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NCard } from 'naive-ui'

interface Action {
  label: string
  icon: string
  route: string
}

const router = useRouter()

const actions: Action[] = [
  { label: '写日记', icon: '📝', route: '/diary' },
  { label: '今日待办', icon: '✅', route: '/todo' },
  { label: '记录花费', icon: '💰', route: '/expense' },
  { label: '时光中心', icon: '⏰', route: '/time-center' },
  { label: '年度统计', icon: '📊', route: '/statistics' },
]

function navigateTo(route: string) {
  router.push(route)
}
</script>

<template>
  <NCard class="quick-action-card" title="快速入口">
    <div class="quick-action__grid">
      <button
        v-for="action in actions"
        :key="action.route"
        class="quick-action__item"
        @click="navigateTo(action.route)"
      >
        <span class="quick-action__icon">{{ action.icon }}</span>
        <span class="quick-action__label">{{ action.label }}</span>
      </button>
    </div>
  </NCard>
</template>

<style scoped>
.quick-action-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.quick-action__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

@media (max-width: 400px) {
  .quick-action__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.quick-action__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 8px;
  border: none;
  border-radius: var(--radius-button);
  background: rgba(79, 142, 247, 0.04);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-family: inherit;
  min-height: 80px;
}

.quick-action__item:hover {
  background: rgba(79, 142, 247, 0.1);
  transform: translateY(-1px);
}

.quick-action__item:active {
  transform: translateY(0);
}

.quick-action__icon {
  font-size: 28px;
}

.quick-action__label {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  font-weight: 500;
}
</style>
