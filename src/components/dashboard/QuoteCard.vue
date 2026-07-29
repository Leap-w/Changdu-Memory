<script setup lang="ts">
import { NCard } from 'naive-ui'

/** 静态寄语（未来可替换为 AI 生成的每日寄语） */
const quotes = [
  '愿这一年的每一天，\n都值得被记录。',
  '高原的每一天，\n都在悄悄改变着什么。',
  '教育是一棵树摇动另一棵树，\n一朵云推动另一朵云。',
  '最好的时光，\n就是现在。',
  '记录，\n是给未来的自己最好的礼物。',
]

const today = new Date()
const dayOfYear = Math.floor(
  (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
    (1000 * 60 * 60 * 24),
)
const dailyQuote = quotes[dayOfYear % quotes.length]
</script>

<template>
  <NCard class="quote-card">
    <div class="quote-card__inner">
      <div class="quote-card__icon">
        💭
      </div>
      <p class="quote-card__text">
        {{ dailyQuote }}
      </p>
      <p class="quote-card__hint">
        每日寄语 · AI 版即将上线
      </p>
    </div>
  </NCard>
</template>

<style scoped>
.quote-card {
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  background: linear-gradient(135deg, #fff 0%, #f8fafd 100%);
}

.quote-card :deep(.n-card__content) {
  padding: 0;
}

.quote-card__inner {
  padding: 24px;
  text-align: center;
}

.quote-card__icon {
  font-size: 28px;
  margin-bottom: 12px;
}

.quote-card__text {
  font-size: 18px;
  line-height: 1.8;
  color: var(--color-text-primary);
  white-space: pre-line;
  margin: 0 0 16px;
  font-weight: 500;
}

.quote-card__hint {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin: 0;
  opacity: 0.5;
}
</style>
