<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TimeCard from '@/components/dashboard/TimeCard.vue'
import TodayMemoryCard from '@/components/dashboard/TodayMemoryCard.vue'
import QuoteCard from '@/components/dashboard/QuoteCard.vue'
import SummaryCard from '@/components/dashboard/SummaryCard.vue'
import QuickAction from '@/components/dashboard/QuickAction.vue'
import { NTag } from 'naive-ui'

const online = ref(navigator.onLine)
const showSyncStatus = ref(false)

function updateOnline() {
  online.value = navigator.onLine
  showSyncStatus.value = true
  setTimeout(() => { showSyncStatus.value = false }, 3000)
}

onMounted(() => {
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
})
</script>

<template>
  <div class="page-home">
    <!-- 同步状态指示器 -->
    <Transition name="fade">
      <div v-if="showSyncStatus" class="sync-bar">
        <NTag
          :bordered="false"
          size="small"
          round
          :type="online ? 'success' : 'warning'"
        >
          {{ online ? '☁️ 已同步' : '📡 当前离线' }}
        </NTag>
      </div>
    </Transition>

    <div class="dashboard-grid">
      <TimeCard class="grid-item grid-item--time" />
      <TodayMemoryCard class="grid-item grid-item--today" />
      <QuoteCard class="grid-item grid-item--quote" />
      <SummaryCard class="grid-item grid-item--summary" />
      <QuickAction class="grid-item grid-item--actions" />
    </div>
  </div>
</template>

<style scoped>
.page-home {
  padding: var(--spacing-page);
}

.sync-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-card);
}

@media (min-width: 768px) and (max-width: 1199px) {
  .page-home { max-width: 720px; margin: 0 auto; }
  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-card); }
  .grid-item--time { grid-column: 1 / 3; }
  .grid-item--today { grid-column: 1 / 3; }
  .grid-item--quote { grid-column: 1; }
  .grid-item--summary { grid-column: 2; }
  .grid-item--actions { grid-column: 1 / 3; }
}

@media (min-width: 1200px) {
  .page-home { max-width: 1200px; margin: 0 auto; }
  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto auto; gap: var(--spacing-card); }
  .grid-item--time { grid-column: 1 / 3; grid-row: 1; }
  .grid-item--today { grid-column: 1 / 3; grid-row: 2; }
  .grid-item--quote { grid-column: 1; grid-row: 3; }
  .grid-item--summary { grid-column: 2; grid-row: 3; }
  .grid-item--actions { grid-column: 1 / 3; grid-row: 4; }
}
</style>
