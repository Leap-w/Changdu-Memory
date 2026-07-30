<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'
import { useTagStore } from '@/stores/tag'
import { fetchDiaryTagIds } from '@/repositories/TagRepository'
import { fetchDiaryPhotos, getDiaryPhotoUrl, deleteAllDiaryPhotos } from '@/repositories/DiaryPhotoRepository'
import type { DiaryPhoto } from '@/repositories/DiaryPhotoRepository'

const router = useRouter()
const route = useRoute()
const diaryStore = useDiaryStore()
const tagStore = useTagStore()

const diaryId = computed(() => route.params.id as string)
const diary = ref<{ id: string; title: string | null; content: string | null; diary_date: string; created_at: string } | null>(null)
const tagIds = ref<string[]>([])
const photos = ref<DiaryPhoto[]>([])
const loading = ref(true)

// Image viewer
const viewerIndex = ref(-1)
const viewerOpen = computed(() => viewerIndex.value >= 0)

onMounted(async () => {
  try {
    const data = await diaryStore.getDiaryById(diaryId.value)
    if (!data) { router.push('/diary'); return }
    diary.value = data

    // Parallel: tags + photos
    const [tids, imgs] = await Promise.allSettled([
      fetchDiaryTagIds(diaryId.value),
      fetchDiaryPhotos(diaryId.value),
    ])
    if (tids.status === 'fulfilled') tagIds.value = tids.value
    if (imgs.status === 'fulfilled') photos.value = imgs.value

    // Load tag names
    if (tagIds.value.length && tagStore.tags.length === 0) {
      try { await tagStore.loadTags() } catch { /* ignore */ }
    }
  } catch { router.push('/diary') }
  finally { loading.value = false }
})

function goEdit() { router.push(`/diary/${diaryId.value}/edit`) }

async function handleDelete() {
  try {
    await deleteAllDiaryPhotos(diaryId.value)
    await diaryStore.removeDiary(diaryId.value)
    router.push('/diary')
  } catch { /* ignore */ }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${days[d.getDay()]}`
}

function getImgUrl(p: DiaryPhoto) { return getDiaryPhotoUrl(p) }
function getTagName(id: string) { return tagStore.tags.find((t) => t.id === id)?.name || '' }
function getTagColor(id: string) { return tagStore.tags.find((t) => t.id === id)?.color || '#4A8C94' }

function openViewer(i: number) { viewerIndex.value = i }
function closeViewer() { viewerIndex.value = -1 }
</script>

<template>
  <div class="dd">
    <div v-if="loading" class="dd__loading">加载中…</div>

    <template v-if="diary">
      <!-- Top bar -->
      <div class="dd__bar">
        <button class="dd__back" @click="router.push('/diary')">← 日记</button>
        <div class="dd__bar-actions">
          <button class="dd__act" @click="goEdit">编辑</button>
          <button class="dd__act dd__act--del" @click="handleDelete">删除</button>
        </div>
      </div>

      <!-- Article -->
      <article class="dd__article">
        <h1 class="dd__title">{{ diary.title || '无标题' }}</h1>
        <p class="dd__date">{{ formatDate(diary.diary_date) }}</p>

        <!-- Tags -->
        <div v-if="tagIds.length" class="dd__tags">
          <span v-for="tid in tagIds" :key="tid" class="dd__tag" :style="{ background: getTagColor(tid) }">
            {{ getTagName(tid) }}
          </span>
        </div>

        <!-- Photos -->
        <div v-if="photos.length" class="dd__photos">
          <img
            v-for="(p, i) in photos" :key="p.id"
            :src="getImgUrl(p)" class="dd__photo"
            :alt="`图片 ${i + 1}`"
            loading="lazy"
            @click="openViewer(i)"
          />
        </div>

        <!-- Content -->
        <div class="dd__content">{{ diary.content || '暂无内容' }}</div>
      </article>
    </template>

    <!-- Fullscreen viewer -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="viewerOpen" class="img-viewer" @click="closeViewer">
          <img :src="getImgUrl(photos[viewerIndex])" class="img-viewer__img" @click.stop alt="" />
          <button class="img-viewer__close" @click="closeViewer">×</button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dd { max-width:720px;margin:0 auto;padding:var(--spacing-page);padding-bottom:80px; }
.dd__loading { text-align:center;padding:80px;color:var(--color-text-tertiary); }

/* Top bar */
.dd__bar { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px; }
.dd__back { padding:0;border:none;background:none;color:var(--color-text-secondary);font-size:14px;cursor:pointer;font-family:inherit; }
.dd__back:hover { color:var(--color-primary); }
.dd__bar-actions { display:flex;gap:8px; }
.dd__act { padding:6px 14px;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:#fff;color:var(--color-text-secondary);font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s; }
.dd__act:hover { border-color:var(--color-primary);color:var(--color-primary); }
.dd__act--del { color:var(--color-error);border-color:transparent;background:transparent; }
.dd__act--del:hover { background:#FDF0ED; }

/* Article */
.dd__article { }
.dd__title { font-size:28px;font-weight:700;color:var(--color-text-primary);margin:0 0 8px;line-height:1.3; }
.dd__date { font-size:14px;color:var(--color-text-tertiary);margin:0 0 16px; }

/* Tags */
.dd__tags { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px; }
.dd__tag { padding:3px 10px;border-radius:var(--radius-full);color:#fff;font-size:11px;font-weight:600; }

/* Photos */
.dd__photos { display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:24px; }
.dd__photo { width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius-sm);cursor:pointer;transition:opacity .15s; }
.dd__photo:hover { opacity:.85; }

/* Content */
.dd__content { font-size:16px;line-height:2;color:var(--color-text-primary);white-space:pre-wrap;word-break:break-word; }

/* Viewer */
.img-viewer { position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer;backdrop-filter:blur(8px); }
.img-viewer__img { max-width:90vw;max-height:90vh;border-radius:var(--radius-md);object-fit:contain;cursor:default; }
.img-viewer__close { position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center; }
.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-from,.modal-leave-to { opacity:0; }

@media (max-width:500px) { .dd__photos { grid-template-columns:repeat(2,1fr); } }
</style>
