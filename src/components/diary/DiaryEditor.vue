<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTagStore } from '@/stores/tag'
import {
  uploadDiaryPhoto,
  fetchDiaryPhotos,
  deleteDiaryPhoto,
  getDiaryPhotoUrl,
} from '@/repositories/DiaryPhotoRepository'
import type { DiaryPhoto } from '@/repositories/DiaryPhotoRepository'
import { AppIcon } from '@/components/ui'

// ==========================================
// Props / Emits
// ==========================================
interface Props {
  title?: string
  content?: string
  diaryDate?: string
  tagIds?: string[]
  diaryId?: string          // 编辑模式下的日记ID（用于图片上传）
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '', content: '', diaryDate: '', tagIds: () => [], diaryId: '', loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { title: string; content: string; diary_date: string; tag_ids: string[]; pendingImages?: File[] }]
  cancel: []
}>()

const tagStore = useTagStore()

// ==========================================
// Form state
// ==========================================
const localTitle = ref(props.title)
const localContent = ref(props.content)
const localDate = ref(props.diaryDate || new Date().toISOString().split('T')[0])
const localTagIds = ref<string[]>([...props.tagIds])
const errorMsg = ref('')

// ==========================================
// Templates
// ==========================================
const templates = [
  { key: 'teaching', label: '今日教学', icon: 'calendar', content: '## 今日教学内容\n\n### 课堂要点\n\n### 学生表现\n\n### 反思与改进\n\n' },
  { key: 'student', label: '学生故事', icon: 'people', content: '## 学生姓名\n\n### 今天发生了什么\n\n### 我的感受\n\n' },
  { key: 'feeling', label: '支教感悟', icon: 'heart', content: '## 今日感悟\n\n' },
  { key: 'training', label: '培训记录', icon: 'checklist', content: '## 培训主题\n\n### 要点\n-\n-\n\n### 行动计划\n-\n' },
  { key: 'life',   label: '生活随笔', icon: 'book', content: '今天在昌都的生活…\n\n' },
  { key: 'travel', label: '旅行记录', icon: 'pin', content: '## 目的地\n\n### 同行\n\n### 见闻\n\n' },
  { key: 'custom', label: '自定义', icon: 'edit', content: '' },
]

const activeTemplate = ref<string | null>(null)

function applyTemplate(key: string) {
  const t = templates.find((x) => x.key === key)
  if (!t) return
  // 允许随时切换模板：点击模板即应用对应内容
  activeTemplate.value = key
  localContent.value = t.content
}

// ==========================================
// Tags (preset + custom)
// ==========================================
const presetTags = ['教学', '学生', '生活', '培训', '活动', '旅行', '家访', '会议', '摄影', '美食']
const presetTagColors = ['#4A8C94', '#D08770', '#6B9E85', '#8E7CB5', '#BF616A', '#6B9E85', '#4A8C94', '#D08770', '#BF616A', '#E8B04C']

const customTagInput = ref('')
const showCustomTag = ref(false)

async function togglePresetTag(tagName: string) {
  if (tagStore.tags.length === 0) {
    try { await tagStore.loadTags() } catch { return }
  }
  let tag = tagStore.tags.find((t) => t.name === tagName)
  if (!tag) {
    try {
      tag = await tagStore.addTag(tagName, presetTagColors[presetTags.indexOf(tagName) % presetTagColors.length])
    } catch { return }
  }
  const idx = localTagIds.value.indexOf(tag.id)
  if (idx >= 0) localTagIds.value.splice(idx, 1)
  else localTagIds.value.push(tag.id)
}

async function addCustomTag() {
  const name = customTagInput.value.trim()
  if (!name) return
  if (tagStore.tags.length === 0) {
    try { await tagStore.loadTags() } catch { return }
  }
  try {
    const tag = await tagStore.addTag(name, '#4A8C94')
    localTagIds.value.push(tag.id)
    customTagInput.value = ''
    showCustomTag.value = false
  } catch { /* duplicate */ }
}

// ==========================================
// Images
// ==========================================
const images = ref<DiaryPhoto[]>([])
const uploading = ref(false)
const MAX_IMAGES = 9
const pendingImages = ref<File[]>([])
const previewUrls = ref<string[]>([])

// Load existing images in edit mode
watch(() => props.diaryId, async (id) => {
  if (id) {
    try { images.value = await fetchDiaryPhotos(id) } catch { /* ignore */ }
  }
}, { immediate: true })

async function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input?.files
  if (!files || !files.length) return

  uploading.value = true

  // If this is a new diary, we need a diary ID first — store images temporarily
  // For now, only support upload in edit mode
  if (!props.diaryId) {
      // 新建模式：缓存图片，稍后与日记一起创建
      for (let i = 0; i < files.length && pendingImages.value.length < MAX_IMAGES; i++) {
        pendingImages.value.push(files[i])
        previewUrls.value.push(URL.createObjectURL(files[i]))
      }
      uploading.value = false
      input.value = ''
      return
    }

  for (let i = 0; i < files.length && images.value.length < MAX_IMAGES; i++) {
    try {
      const photo = await uploadDiaryPhoto(props.diaryId, files[i], files[i].name, images.value.length)
      images.value.push(photo)
    } catch { /* ignore */ }
  }
  uploading.value = false
  input.value = ''
}

async function removeImage(photo: DiaryPhoto) {
  await deleteDiaryPhoto(photo.id, photo.storage_path)
  images.value = images.value.filter((p) => p.id !== photo.id)
}

function getImageUrl(p: DiaryPhoto): string {
  return getDiaryPhotoUrl(p)
}

// Fullscreen viewer
const viewerIndex = ref(-1)
const viewerOpen = computed(() => viewerIndex.value >= 0)
function openViewer(index: number) { viewerIndex.value = index }
function closeViewer() { viewerIndex.value = -1 }

// Image count display
const canUploadMore = computed(() => images.value.length < MAX_IMAGES)

// ==========================================
// Submit
// ==========================================
function handleSubmit() {
  errorMsg.value = ''
  if (!localTitle.value.trim()) { errorMsg.value = '请输入标题'; return }
  if (!localDate.value) { errorMsg.value = '请选择日期'; return }
  emit('submit', {
    title: localTitle.value.trim(),
    content: localContent.value,
    diary_date: localDate.value,
    tag_ids: [...localTagIds.value],
    pendingImages: pendingImages.value.length > 0 ? [...pendingImages.value] : undefined,
  })
}
</script>

<template>
  <div class="de">
    <!-- ====== Templates ====== -->
    <div class="de__section">
      <span class="de__section-label">选择模板</span>
      <div class="de__templates">
        <button
          v-for="t in templates"
          :key="t.key"
          class="de__tpl-btn"
          :class="{ 'de__tpl-btn--active': activeTemplate === t.key }"
          @click="applyTemplate(t.key)"
        >
          <div class="de__tpl-icon">
            <AppIcon :name="t.icon" size="18" />
          </div>
          <span class="de__tpl-label">{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- ====== Title ====== -->
    <div class="de__section">
      <label class="de__label">标题</label>
      <input
        v-model="localTitle"
        class="de__input"
        placeholder="日记标题…"
        maxlength="100"
      />
    </div>

    <!-- ====== Date ====== -->
    <div class="de__section">
      <label class="de__label">日期</label>
      <input v-model="localDate" type="date" class="de__input" />
    </div>

    <!-- ====== Content ====== -->
    <div class="de__section">
      <label class="de__label">正文</label>
      <textarea
        v-model="localContent"
        class="de__textarea"
        placeholder="记录今天的点滴…&#10;&#10;支持 Markdown 格式：# 标题 ## 小标题 - 列表"
        rows="12"
        maxlength="10000"
      />
    </div>

    <!-- ====== Images ====== -->
    <div class="de__section">
      <label class="de__label">图片（{{ images.length + previewUrls.length }}/{{ MAX_IMAGES }}）</label>
      <div class="de__images">
        <div
          v-for="(p, i) in images"
          :key="p.id"
          class="de__img-item"
          @click="openViewer(i)"
        >
          <img :src="getImageUrl(p)" class="de__img-thumb" alt="" />
          <button class="de__img-del" @click.stop="removeImage(p)">
            ×
          </button>
        </div>
        <!-- 预缓存图片预览 -->
        <div v-for="(url, i) in previewUrls" :key="'p'+i" class="de__img-item">
          <img :src="url" class="de__img-thumb" alt="" />
          <button class="de__img-del" @click.stop="pendingImages.splice(i,1); previewUrls.splice(i,1)">
            ×
          </button>
        </div>
        <label v-if="canUploadMore" class="de__img-add" :class="{ loading: uploading }">
          <AppIcon name="plus" size="22" />
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            @change="handleImageUpload"
          />
        </label>
      </div>
    </div>

    <!-- ====== Tags ====== -->
    <div class="de__section">
      <label class="de__label">标签</label>
      <!-- Preset tags -->
      <div class="de__tags">
        <button
          v-for="(name, i) in presetTags"
          :key="name"
          class="de__tag-btn"
          :class="{ active: tagStore.tags.some((t) => t.name === name && localTagIds.includes(t.id)) }"
          :style="{ '--tag-color': presetTagColors[i] }"
          @click="togglePresetTag(name)"
        >
          {{ name }}
        </button>
        <button class="de__tag-btn de__tag-btn--add" @click="showCustomTag = !showCustomTag">
          +
        </button>
      </div>
      <!-- Custom tag input -->
      <div v-if="showCustomTag" class="de__custom-tag">
        <input
          v-model="customTagInput"
          class="de__input de__input--sm"
          placeholder="输入标签名"
          maxlength="10"
          @keydown.enter.prevent="addCustomTag()"
        />
        <button class="de__tag-confirm" @click="addCustomTag()">
          添加
        </button>
      </div>
    </div>

    <!-- ====== Error ====== -->
    <p v-if="errorMsg" class="de__error">
      {{ errorMsg }}
    </p>

    <!-- ====== Actions ====== -->
    <div class="de__actions">
      <button class="de__btn de__btn--cancel" @click="emit('cancel')">
        取消
      </button>
      <button class="de__btn de__btn--save" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中…' : submitLabel }}
      </button>
    </div>

    <!-- ====== Image Viewer (fullscreen) ====== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="viewerOpen" class="img-viewer" @click="closeViewer">
          <img
            :src="getImageUrl(images[viewerIndex])"
            class="img-viewer__img"
            alt=""
            @click.stop
          />
          <button class="img-viewer__close" @click="closeViewer">
            ×
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.de { display:flex;flex-direction:column;gap:20px; }
.de__section { display:flex;flex-direction:column;gap:6px; }
.de__label { font-size:13px;font-weight:600;color:var(--color-text-primary); }
.de__section-label { font-size:12px;color:var(--color-text-tertiary);font-weight:500;text-transform:uppercase;letter-spacing:.5px; }

/* Templates */
.de__templates { display:flex;gap:6px;flex-wrap:wrap; }
.de__tpl-btn { display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border:1px solid var(--color-border-light);border-radius:var(--radius-lg);background:var(--color-bg-white);cursor:pointer;font-family:inherit;transition:all var(--transition-fast);min-width:72px; }
.de__tpl-btn:hover { border-color:var(--color-primary);background:var(--color-primary-bg); }
.de__tpl-btn--active { border-color:var(--color-primary);background:var(--color-primary-bg);box-shadow:0 0 0 1px var(--color-primary) inset; }
.de__tpl-btn--active .de__tpl-icon { color:var(--color-primary);background:var(--color-primary-light); }
.de__tpl-btn--active .de__tpl-label { color:var(--color-primary);font-weight:var(--font-weight-semibold); }
.de__tpl-icon { width:32px;height:32px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--color-bg);color:var(--color-text-secondary);transition:all var(--transition-fast); }
.de__tpl-btn:hover .de__tpl-icon { color:var(--color-primary);background:var(--color-primary-light); }
.de__tpl-label { font-size:11px;color:var(--color-text-secondary);white-space:nowrap;font-weight:var(--font-weight-medium); }

/* Inputs */
.de__input { padding:10px 14px;border:1px solid var(--color-border);border-radius:var(--radius-input);font-size:var(--font-content);font-family:inherit;color:var(--color-text-primary);background:var(--color-bg);outline:none;transition:border-color var(--transition-fast);width:100%; }
.de__input:focus { border-color:var(--color-primary);background:var(--color-bg-white); }
.de__input--sm { padding:7px 12px;font-size:var(--font-secondary); }
.de__textarea { padding:14px 16px;border:1px solid var(--color-border);border-radius:var(--radius-lg);font-size:var(--font-content);font-family:inherit;color:var(--color-text-primary);background:var(--color-bg);outline:none;resize:vertical;line-height:1.8;transition:border-color var(--transition-fast); }
.de__textarea:focus { border-color:var(--color-primary);background:var(--color-bg-white); }

/* Images */
.de__images { display:flex;gap:8px;flex-wrap:wrap;align-items:center; }
.de__img-item { position:relative;width:84px;height:84px;border-radius:var(--radius-md);overflow:hidden;cursor:pointer;flex-shrink:0; }
.de__img-thumb { width:100%;height:100%;object-fit:cover;transition:transform var(--transition-fast); }
.de__img-item:hover .de__img-thumb { transform:scale(1.05); }
.de__img-del { position:absolute;top:3px;right:3px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity var(--transition-fast); }
.de__img-item:hover .de__img-del { opacity:1; }
.de__img-add { width:84px;height:84px;border:2px dashed var(--color-border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text-tertiary);transition:all var(--transition-fast); }
.de__img-add:hover { border-color:var(--color-primary);color:var(--color-primary);background:var(--color-primary-bg); }
.de__img-add.loading { opacity:.5;pointer-events:none; }

/* Tags */
.de__tags { display:flex;gap:6px;flex-wrap:wrap;align-items:center; }
.de__tag-btn { padding:6px 14px;border:1px solid var(--color-border-light);border-radius:var(--radius-full);background:var(--color-bg-white);color:var(--color-text-secondary);font-size:var(--font-caption);cursor:pointer;font-family:inherit;transition:all var(--transition-fast);font-weight:var(--font-weight-medium); }
.de__tag-btn:hover { border-color:var(--tag-color,var(--color-primary));color:var(--tag-color,var(--color-primary)); }
.de__tag-btn.active { background:var(--tag-color,var(--color-primary));border-color:var(--tag-color,var(--color-primary));color:#fff;font-weight:var(--font-weight-semibold); }
.de__tag-btn--add { font-size:16px;padding:4px 12px; }
.de__custom-tag { display:flex;gap:6px;margin-top:4px; }
.de__tag-confirm { padding:7px 14px;border:none;border-radius:var(--radius-sm);background:var(--color-primary);color:#fff;font-size:var(--font-caption);cursor:pointer;font-family:inherit;font-weight:var(--font-weight-semibold); }

/* Actions */
.de__error { color:var(--color-error);font-size:var(--font-secondary);margin:0; }
.de__actions { display:flex;gap:12px;justify-content:flex-end;padding-top:8px; }
.de__btn { padding:10px 28px;border:none;border-radius:var(--radius-button);font-size:var(--font-content);font-family:inherit;cursor:pointer;transition:all var(--transition-fast);font-weight:var(--font-weight-semibold); }
.de__btn--cancel { background:var(--color-bg);color:var(--color-text-secondary); }
.de__btn--cancel:hover { background:var(--color-border-light); }
.de__btn--save { background:var(--color-primary);color:#fff; }
.de__btn--save:hover { background:var(--color-primary-dark); }
.de__btn--save:disabled { opacity:.5;cursor:not-allowed; }

/* Image Viewer */
.img-viewer { position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer;backdrop-filter:blur(8px); }
.img-viewer__img { max-width:90vw;max-height:90vh;border-radius:var(--radius-md);object-fit:contain;cursor:default; }
.img-viewer__close { position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity:0; }
</style>
