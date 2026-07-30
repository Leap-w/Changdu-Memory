<script setup lang="ts">
import { getDailyQuote } from '@/utils/quotes'

const today = new Date()
const dailyQuote = getDailyQuote(today)
</script>

<template>
  <div class="qc">
    <div class="qc__inner">
      <span class="qc__icon">💭</span>
      <p class="qc__text">{{ dailyQuote }}</p>
      <span class="qc__hint">每日寄语</span>
    </div>
  </div>
</template>

<style scoped>
.qc { background:#fff;border-radius:var(--radius-card);border:1px solid var(--color-border-light);overflow:hidden; }
.qc__inner { padding:24px 20px;text-align:center; }
.qc__icon { font-size:24px;display:block;margin-bottom:10px;opacity:.6; }
.qc__text { font-size:17px;line-height:1.8;color:var(--color-text-primary);margin:0 0 14px;font-weight:500; }
.qc__hint { font-size:11px;color:var(--color-text-tertiary);opacity:.5;letter-spacing:1px;text-transform:uppercase; }
</style>
