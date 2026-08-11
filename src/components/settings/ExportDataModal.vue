<script setup lang="ts">
/**
 * 导出数据弹窗
 *
 * 数据管理入口点击「导出数据」后弹出，可选：
 *   - 导出所有数据：完整 JSON 备份（用于数据恢复）
 *   - 账本数据：账本 4 类账目（支出/收入/资产/福利）导出为一个 Excel 文件
 */
import { ref } from 'vue'
import { NSpin, useMessage } from 'naive-ui'
import { AppIcon } from '@/components/ui'
import { exportAllData, downloadJson } from '@/utils/export'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>()

const message = useMessage()

const exportingJson = ref(false)
const exportingExcel = ref(false)

function close() {
  if (exportingJson.value || exportingExcel.value) return
  emit('update:show', false)
}

async function handleExportAll() {
  exportingJson.value = true
  try {
    const data = await exportAllData()
    downloadJson(data)
    message.success('数据导出成功')
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '导出失败')
  } finally {
    exportingJson.value = false
  }
}

async function handleExportLedger() {
  exportingExcel.value = true
  try {
    // 动态引入，xlsx 库仅在点击导出时按需加载，避免拖大入口包
    const { exportLedgerToExcel } = await import('@/utils/exportExcel')
    await exportLedgerToExcel()
    message.success('账本导出成功')
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '导出失败')
  } finally {
    exportingExcel.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-overlay"
        @click.self="close"
      >
        <div class="modal-sheet">
          <h3 class="modal-sheet__title">
            导出数据
          </h3>

          <div class="export-options">
            <button
              class="export-option"
              :disabled="exportingJson || exportingExcel"
              @click="handleExportAll"
            >
              <div class="export-option__icon">
                <AppIcon name="download" size="20" />
              </div>
              <div class="export-option__info">
                <span class="export-option__label">导出所有数据</span>
                <span class="export-option__desc">
                  {{ exportingJson ? '导出中…' : '完整 JSON 备份，包含日记、工作、待办等全部数据' }}
                </span>
              </div>
            </button>

            <button
              class="export-option"
              :disabled="exportingJson || exportingExcel"
              @click="handleExportLedger"
            >
              <div class="export-option__icon export-option__icon--excel">
                <AppIcon name="wallet" size="20" />
              </div>
              <div class="export-option__info">
                <span class="export-option__label">账本数据</span>
                <span class="export-option__desc">
                  {{ exportingExcel ? '导出中…' : '支出 / 收入 / 资产 / 福利导出为 Excel 文件' }}
                </span>
              </div>
            </button>
          </div>

          <div v-if="exportingJson || exportingExcel" class="export-loading">
            <NSpin size="small" />
            <span>正在导出，请稍候…</span>
          </div>

          <div class="modal-sheet__footer">
            <button
              class="modal-btn modal-btn--cancel"
              :disabled="exportingJson || exportingExcel"
              @click="close"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: var(--z-modal-backdrop, 200);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.modal-sheet {
  width: 100%;
  max-width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-bg-white);
  border-radius: var(--radius-xl);
  padding: 28px 24px 24px;
  box-shadow: var(--shadow-xl);
}

.modal-sheet__title {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 20px;
  text-align: center;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all var(--transition-fast);
}

@media (hover: hover) {
  .export-option:not(:disabled):hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }
}

.export-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-option__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(75, 143, 140, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-option__icon--excel {
  background: rgba(75, 143, 140, 0.1);
  color: var(--color-primary);
}

.export-option__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.export-option__label {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.export-option__desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.export-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.modal-sheet__footer {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

@media (hover: hover) {
  .modal-btn--cancel:not(:disabled):hover {
    background: var(--color-border-light);
  }
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s;
}

.modal-enter-active .modal-sheet,
.modal-leave-active .modal-sheet {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-sheet {
  transform: translateY(40px);
}

.modal-leave-to .modal-sheet {
  transform: translateY(40px);
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 40px;
  }
}
</style>
