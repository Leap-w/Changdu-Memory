<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemoryStore } from '@/stores/memory'
import { useAuthStore } from '@/stores/auth'
import { uploadMemoryPhoto, deleteMemoryPhoto } from '@/repositories/MemoryPhotoRepository'
import type { MemoryPhoto } from '@/repositories/MemoryPhotoRepository'
import {
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NDatePicker,
  NSelect,
  NPopconfirm,
  NSpin,
  useMessage,
} from 'naive-ui'
import type { Memory } from '@/repositories/MemoryRepository'

const memoryStore = useMemoryStore()
const authStore = useAuthStore()
const message = useMessage()

const ready = ref(false)
const activeType = ref<string>('all')

// ==========================================
// Category mapping
// ==========================================
const typeMap: Record<string, { label: string; icon: string; color: string }> = {
  school:    { label: '教学',     icon: '📚', color: '#4A8C94' },
  activity:  { label: '活动',     icon: '🎉', color: '#D08770' },
  travel:    { label: '旅行',     icon: '🏔️', color: '#6B9E85' },
  life:      { label: '生活',     icon: '☕', color: '#8E7CB5' },
  important: { label: '重要事件', icon: '⭐', color: '#C2676A' },
}

const typeKeys = Object.keys(typeMap)

// ==========================================
// Data loading
// ==========================================
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    ready.value = true
    return
  }
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
const modalTitle = computed(() => (editId.value ? '编辑大事记' : '添加大事记'))
const saveLabel = computed(() => (editId.value ? '保存修改' : '添加'))
const modalLoading = ref(false)

const form = ref({
  title: '',
  content: '',
  event_date: null as number | null,
  category: 'life',
})

// 编辑时已有照片
const existingPhotos = ref<MemoryPhoto[]>([])
// 新上传的文件列表（预览用）
const pendingFiles = ref<{ file: File; previewUrl: string }[]>([])
// 上传中状态
const photoUploading = ref(false)

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
    pendingFiles.value.push({
      file,
      previewUrl: URL.createObjectURL(file),
    })
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
  } catch {
    message.error('删除图片失败')
  }
}

async function handleSave() {
  if (!form.value.title.trim()) {
    message.warning('请输入标题')
    return
  }
  if (!form.value.event_date) {
    message.warning('请选择日期')
    return
  }
  modalLoading.value = true
  try {
    const dateStr = new Date(form.value.event_date).toISOString().split('T')[0]
    // 收集现有照片的 URL
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

    // 上传新图片
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
  try {
    await memoryStore.removeMemory(id)
    message.success('已删除')
  } catch {
    message.error('删除失败')
  }
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
  return typeMap[category] || { label: category, icon: '📍', color: '#6B7B8D' }
}
</script>

<template>
  <div class="tl">
    <!-- Header -->
    <div class="tl__hero">
      <h1 class="tl__title">大事记</h1>
      <p class="tl__sub">记录在昌都的每一个重要时刻</p>
      <NButton type="primary" size="small" @click="openCreate">+ 添加大事记</NButton>
    </div>

    <!-- Type filter -->
    <div class="tl__types">
      <button
        class="tl__type-btn"
        :class="{ active: activeType === 'all' }"
        @click="activeType = 'all'"
      >
        全部
      </button>
      <button
        v-for="key in typeKeys"
        :key="key"
        class="tl__type-btn"
        :class="{ active: activeType === key }"
        :style="activeType === key ? { background: typeMap[key].color, borderColor: typeMap[key].color, color: '#fff' } : {}"
        @click="activeType = key"
      >
        {{ typeMap[key].label }}
      </button>
    </div>

    <!-- Loading -->
    <NSpin :show="!ready">
      <!-- Empty -->
      <div v-if="ready && memoryStore.memories.length === 0" class="tl__empty">
        <div class="tl__empty-icon">📜</div>
        <p>还没有大事记，点击上方按钮添加第一件事</p>
      </div>

      <!-- No results after filter -->
      <div v-else-if="ready && filtered.length === 0" class="tl__empty">
        <div class="tl__empty-icon">🔍</div>
        <p>该分类下暂无事件</p>
      </div>

      <!-- Timeline -->
      <div v-else class="tl__timeline">
        <div v-for="group in groupedByMonth" :key="group.month" class="tl__group">
          <h2 class="tl__g-mo">{{ formatMonth(group.month) }}</h2>

          <div class="tl__events">
            <div
              v-for="(event, ei) in group.items"
              :key="event.id"
              class="tl__event"
              :class="{ 'tl__event--alt': ei % 2 === 1 }"
            >
              <!-- Dot -->
              <div class="tl__event-gutter">
                <div class="tl__event-dot" :style="{ background: getType(event.category).color }" />
              </div>

              <!-- Card -->
              <div class="tl__card" :class="{ 'tl__card--alt': ei % 2 === 1 }">
                <div class="tl__card-date">
                  <span class="tl__card-day">{{ formatDay(event.event_date) }}</span>
                  <span class="tl__card-wd">{{ formatWeekday(event.event_date) }}</span>
                  <span
                    class="tl__card-type"
                    :style="{ color: getType(event.category).color, background: getType(event.category).color + '14' }"
                  >
                    {{ getType(event.category).icon }} {{ getType(event.category).label }}
                  </span>
                </div>

                <h3 class="tl__card-title">{{ event.title }}</h3>

                <p v-if="event.content" class="tl__card-desc">
                  {{ event.content.length > 120 ? event.content.slice(0, 120) + '…' : event.content }}
                </p>

                <!-- Photos from memory_photos table -->
                <div v-if="memoryStore.getPhotosForMemory(event.id).length" class="tl__card-photos">
                  <img
                    v-for="(photo, pi) in memoryStore.getPhotosForMemory(event.id).slice(0, 4)"
                    :key="pi"
                    :src="photo.url"
                    class="tl__card-photo"
                    :class="{ 'tl__card-photo--more': pi === 3 && memoryStore.getPhotosForMemory(event.id).length > 4 }"
                    loading="lazy"
                    alt=""
                  />
                </div>
                <!-- Fallback: URL photos from legacy data -->
                <div v-else-if="event.image_urls && event.image_urls.length" class="tl__card-photos">
                  <img
                    v-for="(url, pi) in event.image_urls.slice(0, 4)"
                    :key="pi"
                    :src="url"
                    class="tl__card-photo"
                    :class="{ 'tl__card-photo--more': pi === 3 && event.image_urls.length > 4 }"
                    loading="lazy"
                    alt=""
                  />
                </div>

                <!-- Actions -->
                <div class="tl__card-actions">
                  <NButton text size="tiny" @click.stop="openEdit(event)">编辑</NButton>
                  <NPopconfirm @positive-click="handleDelete(event.id)">
                    <template #trigger>
                      <NButton text size="tiny" type="error" @click.stop>删除</NButton>
                    </template>
                    确定删除「{{ event.title }}」？
                  </NPopconfirm>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NSpin>

    <!-- Footer -->
    <p class="tl__footer">昌都记忆 · 大事记</p>

    <!-- ====== Add/Edit Modal ====== -->
    <NModal v-model:show="showModal" preset="card" :title="modalTitle" style="max-width: 480px">
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
            :options="typeKeys.map((k) => ({ label: typeMap[k].icon + ' ' + typeMap[k].label, value: k }))"
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
            <!-- Existing photos -->
            <div v-if="existingPhotos.length" class="tl__photo-grid">
              <div v-for="photo in existingPhotos" :key="photo.id" class="tl__photo-item">
                <img :src="photo.url" alt="" class="tl__photo-thumb" />
                <button class="tl__photo-remove" title="删除图片" @click="removeExistingPhoto(photo)">×</button>
              </div>
            </div>
            <!-- Pending uploads -->
            <div v-if="pendingFiles.length" class="tl__photo-grid">
              <div v-for="(pf, pi) in pendingFiles" :key="'p' + pi" class="tl__photo-item">
                <img :src="pf.previewUrl" alt="" class="tl__photo-thumb" />
                <button class="tl__photo-remove" title="取消" @click="removePendingFile(pi)">×</button>
              </div>
            </div>
            <!-- Upload button -->
            <label class="tl__upload-btn" :class="{ loading: photoUploading }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>上传图片</span>
              <input type="file" accept="image/*" multiple hidden @change="handleFileSelect" />
            </label>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="modalLoading" @click="handleSave">
            {{ saveLabel }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.tl { max-width: 720px; margin: 0 auto; padding: var(--spacing-page); padding-bottom: 80px; }

/* Hero */
.tl__hero { margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.tl__title { font-size: 32px; font-weight: 700; color: var(--color-text-primary); margin: 0; letter-spacing: 1px; }
.tl__sub { font-size: 14px; color: var(--color-text-tertiary); margin: 0; flex: 1; min-width: 200px; }

/* Filter */
.tl__types { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 24px; }
.tl__type-btn {
  padding: 5px 14px; border: 1px solid var(--color-border-light); border-radius: var(--radius-full);
  background: #fff; color: var(--color-text-secondary); font-size: 12px; cursor: pointer;
  font-family: inherit; transition: all .15s;
}
.tl__type-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.tl__type-btn.active { background: var(--color-primary); color: #fff; font-weight: 600; border-color: var(--color-primary); }

/* Empty */
.tl__empty { text-align: center; padding: 80px 20px; }
.tl__empty-icon { font-size: 56px; opacity: .3; margin-bottom: 12px; }
.tl__empty p { font-size: 15px; color: var(--color-text-tertiary); margin: 0; }

/* Timeline */
.tl__group { margin-bottom: 20px; }
.tl__g-mo {
  font-size: 16px; font-weight: 700; color: var(--color-primary); margin: 0 0 16px;
  padding-left: 32px; position: relative;
}
.tl__g-mo::before {
  content: ''; position: absolute; left: 4px; top: 4px; width: 10px; height: 10px;
  border-radius: 50%; background: var(--color-primary); border: 3px solid var(--color-bg);
}

.tl__events { position: relative; padding-left: 28px; }
.tl__events::before {
  content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px;
  background: linear-gradient(180deg, var(--color-primary) 0%, rgba(74, 140, 148, 0.12) 100%);
}

/* Event card */
.tl__event { position: relative; margin-bottom: 20px; display: flex; }
.tl__event-gutter { position: absolute; left: -18px; top: 14px; }
.tl__event-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06); }

.tl__card {
  padding: 18px 20px; background: #fff; border-radius: var(--radius-card);
  border: 1px solid var(--color-border-light); transition: all .15s;
  box-shadow: var(--shadow-sm); width: 100%;
}
.tl__card:hover { box-shadow: var(--shadow-md); border-color: transparent; }

.tl__card-date { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.tl__card-day { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
.tl__card-wd { font-size: 12px; color: var(--color-text-tertiary); }
.tl__card-type { font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 4px; margin-left: auto; }

.tl__card-title { font-size: 17px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 6px; }
.tl__card-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.6; margin: 0 0 8px; }

.tl__card-photos { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.tl__card-photo { width: 72px; height: 72px; border-radius: var(--radius-sm); object-fit: cover; }
.tl__card-photo--more { filter: brightness(.6); }

.tl__card-actions { display: flex; gap: 4px; padding-top: 8px; border-top: 1px solid var(--color-border-light); }

/* Photo upload section in modal */
.tl__photo-section { display: flex; flex-direction: column; gap: 8px; }
.tl__photo-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.tl__photo-item { position: relative; width: 72px; height: 72px; border-radius: var(--radius-sm); overflow: hidden; }
.tl__photo-thumb { width: 100%; height: 100%; object-fit: cover; }
.tl__photo-remove {
  position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%;
  border: none; background: rgba(0,0,0,.5); color: #fff; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0;
}
.tl__photo-remove:hover { background: var(--color-error); }
.tl__upload-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--color-text-secondary);
  transition: all .15s; width: fit-content;
}
.tl__upload-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.tl__upload-btn.loading { opacity: .5; pointer-events: none; }

/* Footer */
.tl__footer { text-align: center; font-size: 12px; color: var(--color-text-tertiary); opacity: .4; margin-top: 24px; }

@media (max-width: 500px) {
  .tl__title { font-size: 26px; }
  .tl__card { padding: 14px 16px; }
  .tl__card-photo { width: 56px; height: 56px; }
  .tl__photo-item { width: 56px; height: 56px; }
}
</style>
