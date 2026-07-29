<script setup lang="ts">
import TimeCard from '@/components/dashboard/TimeCard.vue'
import QuoteCard from '@/components/dashboard/QuoteCard.vue'
import SummaryCard from '@/components/dashboard/SummaryCard.vue'
import QuickAction from '@/components/dashboard/QuickAction.vue'
</script>

<template>
  <div class="page-home">
    <div class="dashboard-grid">
      <TimeCard class="grid-item grid-item--time" />
      <QuoteCard class="grid-item grid-item--quote" />
      <SummaryCard class="grid-item grid-item--summary" />
      <QuickAction class="grid-item grid-item--actions" />
    </div>
  </div>
</template>

<style scoped>
/* ====== Mobile (<768px) ====== */
.page-home {
  padding: var(--spacing-page);
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-card);
}

/* ====== Tablet (768~1199px) ====== */
@media (min-width: 768px) and (max-width: 1199px) {
  .page-home {
    max-width: 720px;
    margin: 0 auto;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-card);
  }

  .grid-item--time {
    grid-column: 1 / 3;
  }

  .grid-item--quote {
    grid-column: 1;
  }

  .grid-item--summary {
    grid-column: 2;
  }

  .grid-item--actions {
    grid-column: 1 / 3;
  }
}

/* ====== Desktop (≥1200px) ====== */
@media (min-width: 1200px) {
  .page-home {
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: var(--spacing-card);
  }

  .grid-item--time {
    grid-column: 1 / 3;
    grid-row: 1;
  }

  .grid-item--quote {
    grid-column: 1;
    grid-row: 2;
  }

  .grid-item--summary {
    grid-column: 2;
    grid-row: 2;
  }

  .grid-item--actions {
    grid-column: 1 / 3;
    grid-row: 3;
  }
}
</style>
