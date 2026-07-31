<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemoryStore } from '@/stores/memory'
import { useAuthStore } from '@/stores/auth'
import { uploadMemoryPhoto, deleteMemoryPhoto } from '@/repositories/MemoryPhotoRepository'
import type { MemoryPhoto } from '@/repositories/MemoryPhotoRepository'
import { AppCard, AppIcon } from '@/components/ui'
import {
  NButton, NModal, NForm, NFormItem, NInput,
  NDatePicker, NSelect, NSpin, useMessage,
} from 'naive-ui'
import type { Memory } from '@/repositories/MemoryRepository'

const memoryStore = useMemoryStore()
const authStore = useAuthStore()
const message = useMessage()

const ready = ref(false)
const activeType = ref<string>('all')

// ==========================================
// Category mapping (no emoji)
// ==========================================
const typeMap: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  school:    { label: '教学', icon: 'book', color: '#4B8F8C', bgColor: 'rgba(75,143,140,0.1)' },
  activity:  { label: '活动', icon: 'star', color: '#D08770', bgColor: 'rgba(208,135,112,0.1)' },
  travel:    { label: '旅行', icon: 'pin', color: '#6B9E85', bgColor: 'rgba(107,158,133,0.1)' },
  life:      { label: '生活', icon: 'check', color: '#8E7CB5', bgColor: 'rgba(142,124,181,0.1)' },
  important: { label: '重要', icon: 'heart', color: '#C2676A', bgColor: 'rgba(194,103,106,0.1)' },
}

const typeKeys = Object.keys(typeMap)

// ==========================================
// Data loading
// ==========================================
onMounted(async () => {
  if (!authStore.isLoggedIn) { ready.value = true; return }
  if (memoryStore.memories.length === 0) {
    try { await memoryStore.loadMemories() } catch { /* ignore */ }
  }
  ready.value = true
})

// ==========================================
// Filtered & grouped
// ==========================================
const filtered = computed(() => {
  if (activeType.value === 'all') return memoryStore.memories
  return memoryStore.memories.filter((m) => m.category === activeType.value)
})

const groupedByMonth = computed(() => {
  const groups: { month: string; items: Memory[] }[] = []
  for (const m of filtered.value) {
    const month = (m.event_date || '').substring(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.month === month) last.items.push(m)
    else groups.push({ month, items: [m] })
  }
  return groups
})

// ==========================================
// Modal (create / edit)
// ==========================================
const showModal = ref(false)
const editId = ref<string | null>(null)
const modalTitle = computed(() => editId.value ? '编辑大事记' : '添加大事记')
const saveLabel = computed(() => editId.value ? '保存修改' : '添加')
const modalLoading = ref(false)

const form = ref({
  title: '',
  content: '',
  event_date: null as number | null,
  category: 'life',
})

const existingPhotos = ref<MemoryPhoto[]>([])
const pendingFiles = ref<{ file: File; previewUrl: string }[]>([])
const photoUploading = ref(false)

// Fullscreen image viewer
const viewerIndex = ref(-1)
const viewerPhotos = ref<{ url: string }[]>([])
const viewerOpen = computed(() => viewerIndex.value >= 0)

function openViewer(photos: { url: string }[], index: number) {
  viewerPhotos.value = photos
  viewerIndex.value = index
}

function closeViewer() {
  viewerIndex.value = -1
}

function openCreate() {
  editId.value = null
  form.value = { title: '', content: '', event_date: Date.now(), category: 'life' }
  existingPhotos.value = []
  pendingFiles.value = []
  showModal.value = true
}

function openEdit(m: Memory) {
  editId.value = m.id
  form.value = {
    title: m.title,
    content: m.content || '',
    event_date: m.event_date ? new Date(m.event_date + 'T00:00:00').getTime() : Date.now(),
    category: m.category,
  }
  existingPhotos.value = [...memoryStore.getPhotosForMemory(m.id)]
  pendingFiles.value = []
  showModal.value = true
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input?.files
  if (!files) return
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.startsWith('image/')) continue
    pendingFiles.value.push({ file, previewUrl: URL.createObjectURL(file) })
  }
  input.value = ''
}

function removePendingFile(index: number) {
  const removed = pendingFiles.value.splice(index, 1)[0]
  if (removed) URL.revokeObjectURL(removed.previewUrl)
}

async function removeExistingPhoto(photo: MemoryPhoto) {
  try {
    await deleteMemoryPhoto(photo.id, photo.storage_path)
    memoryStore.removePhotoFromMemory(photo.memory_id, photo.id)
    existingPhotos.value = existingPhotos.value.filter((p) => p.id !== photo.id)
    message.success('图片已删除')
  } catch { message.error('删除图片失败') }
}

async function handleSave() {
  if (!form.value.title.trim()) { message.warning('请输入标题'); return }
  if (!form.value.event_date) { message.warning('请选择日期'); return }
  modalLoading.value = true
  try {
    const dateStr = new Date(form.value.event_date).toISOString().split('T')[0]
    const existingUrls = existingPhotos.value.map((p) => p.url)

    let memoryId: string
    if (editId.value) {
      await memoryStore.editMemory(editId.value, {
        title: form.value.title.trim(),
        content: form.value.content,
        event_date: dateStr,
        category: form.value.category,
        image_urls: existingUrls,
      })
      memoryId = editId.value
      message.success('已更新')
    } else {
      const memory = await memoryStore.addMemory({
        title: form.value.title.trim(),
        content: form.value.content,
        event_date: dateStr,
        category: form.value.category,
        image_urls: existingUrls,
      })
      memoryId = memory.id
      message.success('已添加')
    }

    if (pendingFiles.value.length > 0) {
      photoUploading.value = true
      const uploaded: MemoryPhoto[] = []
      for (const pf of pendingFiles.value) {
        try {
          const photo = await uploadMemoryPhoto(memoryId, pf.file, pf.file.name)
          uploaded.push(photo)
        } catch { /* skip failed uploads */ }
      }
      if (uploaded.length > 0) {
        memoryStore.addPhotosToMemory(memoryId, uploaded)
      }
      photoUploading.value = false
    }
    showModal.value = false
  } catch (err: unknown) {
    message.error(err instanceof Error ? err.message : '操作失败')
  } finally {
    modalLoading.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('确定删除这条大事记？')) return
  try { await memoryStore.removeMemory(id); message.success('已删除') }
  catch { message.error('删除失败') }
}

// ==========================================
// Helpers
// ==========================================
function formatMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${y}年${parseInt(mo)}月`
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}

function getType(category: string) {
  return typeMap[category] || { label: category, icon: 'grid', color: '#6B7B8D', bgColor: 'rgba(107,123,141,0.1)' }
}

</script>

<template>
  <div class="tl">
    <!-- ====== Page header ====== -->
    <div class="tl__header">
      <div class="tl__header-left">
        <h1 class="tl__title">
          大事记
        </h1>
        <p class="tl__subtitle">
          记录在昌都的每一个重要时刻
        </p>
      </div>
      <button class="tl__create-btn" @click="openCreate">
        <AppIcon name="plus" size="16" /> 记录新瞬间
      </button>
    </div>

    <!-- ====== Category filter ====== -->
    <div class="tl__filters">
      <button
        class="tl__filter-btn"
        :class="{ 'tl__filter-btn--active': activeType === 'all' }"
        @click="activeType = 'all'"
      >
        全部
      </button>
      <button
        v-for="key in typeKeys"
        :key="key"
        class="tl__filter-btn"
        :class="{ 'tl__filter-btn--active': activeType === key }"
        @click="activeType = key"
      >
        {{ typeMap[key].label }}
      </button>
    </div>

    <!-- Loading -->
    <NSpin :show="!ready">
      <!-- Empty state -->
      <div v-if="ready && memoryStore.memories.length === 0" class="tl__empty">
        <div class="tl__empty-icon">
          <AppIcon name="star" size="48" color="var(--color-text-tertiary)" />
        </div>
        <p class="tl__empty-title">
          还没有大事记
        </p>
        <p class="tl__empty-desc">
          点击上方按钮，记录支教旅程中的第一次
        </p>
        <button class="tl__empty-btn" @click="openCreate">
          <AppIcon name="plus" size="16" /> 添加大事记
        </button>
      </div>

      <!-- No results after filter -->
      <div v-else-if="ready && filtered.length === 0" class="tl__empty">
        <p class="tl__empty-title">
          该分类下暂无事件
        </p>
      </div>

      <!-- Timeline -->
      <div v-else class="tl__timeline">
        <div v-for="group in groupedByMonth" :key="group.month" class="tl__group">
          <h2 class="tl__g-month">
            {{ formatMonth(group.month) }}
          </h2>

          <div class="tl__events">
            <div
              v-for="event in group.items"
              :key="event.id"
              class="tl__event"
            >
              <!-- Gutter dot -->
              <div class="tl__event-gutter">
                <div
                  class="tl__event-dot"
                  :style="{ background: getType(event.category).color }"
                />
                <div class="tl__event-line" />
              </div>

              <!-- Card -->
              <AppCard hoverable class="tl__card">
                <div class="tl__card-head">
                  <span class="tl__card-day">{{ formatDay(event.event_date) }}</span>
                  <span class="tl__card-wd">{{ formatWeekday(event.event_date) }}</span>
                  <span
                    class="tl__card-cat"
                    :style="{
                      color: getType(event.category).color,
                      background: getType(event.category).bgColor,
                    }"
                  >
                    <AppIcon :name="getType(event.category).icon" size="11" />
                    {{ getType(event.category).label }}
                  </span>
                </div>

                <h3 class="tl__card-title">
                  {{ event.title }}
                </h3>

                <p v-if="event.content" class="tl__card-desc">
                  {{ event.content.length > 140 ? event.content.slice(0, 140) + '…' : event.content }}
                </p>

                <!-- Photos -->
                <div
                  v-if="memoryStore.getPhotosForMemory(event.id).length"
                  class="tl__card-photos"
                >
                  <img
                    v-for="(photo, pi) in memoryStore.getPhotosForMemory(event.id).slice(0, 4)"
                    :key="pi"
                    :src="photo.url"
                    class="tl__card-photo"
                    :class="{
                      'tl__card-photo--more': pi === 3 && memoryStore.getPhotosForMemory(event.id).length > 4,
                    }"
                    loading="lazy"
                    alt=""
                    @click.stop="openViewer(memoryStore.getPhotosForMemory(event.id).map(p => ({ url: p.url })), pi)"
                  />
                </div>
                <div v-else-if="event.image_urls && event.image_urls.length" class="tl__card-photos">
                  <img
                    v-for="(url, pi) in event.image_urls.slice(0, 4)"
                    :key="pi"
                    :src="url"
                    class="tl__card-photo"
                    :class="{
                      'tl__card-photo--more': pi === 3 && event.image_urls.length > 4,
                    }"
                    loading="lazy"
                    alt=""
                    @click.stop="openViewer(event.image_urls.map((u: string) => ({ url: u })), pi)"
                  />
                </div>

                <!-- Actions -->
                <div class="tl__card-actions">
                  <button class="tl__card-act" @click.stop="openEdit(event)">
                    <AppIcon name="pen" size="12" /> 编辑
                  </button>
                  <button
                    class="tl__card-act tl__card-act--del"
                    @click.stop="handleDelete(event.id)"
                  >
                    <AppIcon name="trash" size="12" /> 删除
                  </button>
                </div>
              </AppCard>
            </div>
          </div>
        </div>
      </div>
    </NSpin>

    <!-- ====== Add/Edit Modal ====== -->
    <NModal
      v-model:show="showModal"
      preset="card"
      :title="modalTitle"
      style="max-width: 480px"
    >
      <NForm label-placement="top">
        <NFormItem label="标题" required>
          <NInput v-model:value="form.title" placeholder="事件标题" maxlength="100" />
        </NFormItem>
        <NFormItem label="日期" required>
          <NDatePicker v-model:value="form.event_date" type="date" style="width: 100%" />
        </NFormItem>
        <NFormItem label="分类">
          <NSelect
            v-model:value="form.category"
            :options="typeKeys.map((k) => ({
              label: typeMap[k].label,
              value: k,
            }))"
          />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="form.content"
            type="textarea"
            placeholder="描述这个事件…"
            :autosize="{ minRows: 3, maxRows: 8 }"
            maxlength="5000"
          />
        </NFormItem>
        <!-- Image upload -->
        <NFormItem label="图片">
          <div class="tl__photo-section">
            <div v-if="existingPhotos.length" class="tl__photo-grid">
              <div v-for="photo in existingPhotos" :key="photo.id" class="tl__photo-item">
                <img :src="photo.url" alt="" class="tl__photo-thumb" />
                <button
                  class="tl__photo-remove"
                  title="删除图片"
                  @click="removeExistingPhoto(photo)"
                >
                  ×
                </button>
              </div>
            </div>
            <div v-if="pendingFiles.length" class="tl__photo-grid">
              <div v-for="(pf, pi) in pendingFiles" :key="'p' + pi" class="tl__photo-item">
                <img :src="pf.previewUrl" alt="" class="tl__photo-thumb" />
                <button
                  class="tl__photo-remove"
                  title="取消"
                  @click="removePendingFile(pi)"
                >
                  ×
                </button>
              </div>
            </div>
            <label class="tl__upload-btn" :class="{ loading: photoUploading }">
              <AppIcon name="plus" size="14" />
              <span>上传图片</span>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                @change="handleFileSelect"
              />
            </label>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="tl__modal-footer">
          <NButton @click="showModal = false">
            取消
          </NButton>
          <NButton type="primary" :loading="modalLoading" @click="handleSave">
            {{ saveLabel }}
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Fullscreen image viewer -->
    <Teleport to="body">
      <Transition name="viewer">
        <div v-if="viewerOpen" class="img-viewer" @click="closeViewer">
          <img
            :src="viewerPhotos[viewerIndex]?.url"
            class="img-viewer__img"
            alt=""
            @click.stop
          />
          <button class="img-viewer__close" aria-label="关闭" @click="closeViewer">
            <AppIcon name="close" size="24" color="#fff" />
          </button>
          <div class="img-viewer__counter">
            {{ viewerIndex + 1 }} / {{ viewerPhotos.length }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tl {
  max-width: 800px;
  margin: 0 auto;
}

/* ---- Header ---- */
.tl__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tl__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tl__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.tl__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.tl__create-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.tl__create-btn:hover {
  background: var(--color-primary-dark);
}

/* ---- Filter pills ---- */
.tl__filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
}

.tl__filter-btn {
  padding: 6px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  background: var(--color-bg-white);
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.tl__filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tl__filter-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

/* ---- Empty state ---- */
.tl__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 72px 20px;
  text-align: center;
}

.tl__empty-icon {
  opacity: 0.25;
  margin-bottom: 4px;
}

.tl__empty-title {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0;
}

.tl__empty-desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.tl__empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 9px 22px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.tl__empty-btn:hover {
  background: var(--color-primary-dark);
}

/* ---- Timeline ---- */
.tl__group {
  margin-bottom: var(--spacing-xl);
}

.tl__g-month {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0 0 14px;
  padding-left: 36px;
  position: relative;
}

.tl__g-month::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid var(--color-bg);
}

.tl__events {
  position: relative;
  padding-left: 28px;
}

.tl__events::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    var(--color-primary) 0%,
    rgba(75, 143, 140, 0.08) 100%
  );
}

.tl__event {
  position: relative;
  margin-bottom: 16px;
  display: flex;
}

.tl__event-gutter {
  position: absolute;
  left: -18px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tl__event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-white);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  margin-top: 14px;
}

.tl__event-line {
  flex: 1;
  width: 2px;
  background: transparent;
}

.tl__card {
  width: 100%;
}

/* ---- Card content ---- */
.tl__card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.tl__card-day {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.tl__card-wd {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.tl__card-cat {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  margin-left: auto;
}

.tl__card-title {
  font-size: 17px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.tl__card-desc {
  font-size: var(--font-secondary);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0 0 10px;
}

.tl__card-photos {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tl__card-photo {
  width: 76px;
  height: 76px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.tl__card-photo:hover {
  opacity: 0.85;
}

.tl__card-photo--more {
  filter: brightness(0.6);
}

.tl__card-actions {
  display: flex;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-light);
}

.tl__card-act {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: var(--font-caption);
  font-family: inherit;
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.tl__card-act:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.tl__card-act--del:hover {
  color: var(--color-error);
  background: rgba(194, 103, 106, 0.08);
}

/* ---- Modal photo section ---- */
.tl__photo-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tl__photo-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tl__photo-item {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.tl__photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tl__photo-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}

.tl__photo-remove:hover {
  background: var(--color-error);
}

.tl__upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  width: fit-content;
}

.tl__upload-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tl__upload-btn.loading {
  opacity: 0.5;
  pointer-events: none;
}

.tl__modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 500px) {
  .tl__card-photo {
    width: 56px;
    height: 56px;
  }

  .tl__photo-item {
    width: 56px;
    height: 56px;
  }
}

/* Fullscreen image viewer */
.img-viewer {
  position: fixed;
  inset: 0;
  z-index: var(--z-image-viewer, 300);
  background: rgba(0, 0, 0, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: pointer;
  backdrop-filter: blur(12px);
}

.img-viewer__img {
  max-width: 90vw;
  max-height: 85vh;
  border-radius: var(--radius-lg, 20px);
  object-fit: contain;
  cursor: default;
}

.img-viewer__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.img-viewer__close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.img-viewer__counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-medium);
}

.viewer-enter-active,
.viewer-leave-active {
  transition: opacity 0.2s;
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}
</style>
