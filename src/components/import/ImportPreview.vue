<script setup lang="ts">
import type { ImportError } from '@/utils/import'

defineProps<{
  headers: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validRows: any[]
  errors: ImportError[]
  totalRows: number
}>()
</script>

<template>
  <div class="import-preview">
    <!-- 统计 -->
    <div class="import-preview__stats">
      <span class="stat-item">
        总计 <strong>{{ totalRows }}</strong> 行
      </span>
      <span class="stat-item stat-item--ok">
        有效 <strong>{{ validRows.length }}</strong> 条
      </span>
      <span
        v-if="errors.length > 0"
        class="stat-item stat-item--err"
      >
        错误 <strong>{{ errors.length }}</strong> 条
      </span>
    </div>

    <!-- 错误列表 -->
    <div v-if="errors.length > 0" class="import-preview__errors">
      <div
        v-for="(err, idx) in errors"
        :key="idx"
        class="error-item"
      >
        <span class="error-item__row">第 {{ err.row }} 行</span>
        <span class="error-item__msg">{{ err.message }}</span>
      </div>
    </div>

    <!-- 有效数据预览（最多显示5行） -->
    <div v-if="validRows.length > 0" class="import-preview__table-wrap">
      <table class="import-preview__table">
        <thead>
          <tr>
            <th v-for="h in headers" :key="h">
              {{ h }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in validRows.slice(0, 5)" :key="idx">
            <td v-for="h in headers" :key="h">
              {{ row[h] ?? '' }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="validRows.length > 5" class="import-preview__more">
        还有 {{ validRows.length - 5 }} 条未显示...
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-preview__stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: var(--font-caption);
}

.stat-item {
  color: var(--color-text-secondary);
}

.stat-item strong {
  font-weight: 700;
}

.stat-item--ok {
  color: var(--color-secondary);
}

.stat-item--err {
  color: var(--color-error);
}

.import-preview__errors {
  margin-bottom: 12px;
}

.error-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: var(--font-caption);
}

.error-item__row {
  color: var(--color-error);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.error-item__msg {
  color: var(--color-text-secondary);
}

.import-preview__table-wrap {
  overflow-x: auto;
}

.import-preview__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-caption);
}

.import-preview__table th,
.import-preview__table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.import-preview__table th {
  font-weight: 600;
  color: var(--color-text-primary);
  background: rgba(79, 142, 247, 0.04);
}

.import-preview__more {
  text-align: center;
  padding: 8px;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}
</style>
