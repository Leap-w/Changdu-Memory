<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { exportAllData, downloadJson } from '@/utils/export'

const router = useRouter()
const authStore = useAuthStore()

// ==========================================
// Profile edit modal
// ==========================================
const showEditModal = ref(false)
const editForm = ref({ nickname: '', bio: '' })
const editLoading = ref(false)

function openEdit() {
  editForm.value = {
    nickname: authStore.profile.nickname ?? '',
    bio: authStore.profile.bio ?? '',
  }
  showEditModal.value = true
}

async function saveProfile() {
  editLoading.value = true
  try {
    await authStore.updateProfile({
      nickname: editForm.value.nickname || null,
      bio: editForm.value.bio || null,
    })
    showEditModal.value = false
  } catch { /* ignore */ }
  finally { editLoading.value = false }
}

// ==========================================
// Dark mode (localStorage only)
// ==========================================
const darkMode = ref(localStorage.getItem('theme') === 'dark')

function toggleDarkMode() {
  darkMode.value = !darkMode.value
  localStorage.setItem('theme', darkMode.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', darkMode.value)
}

// ==========================================
// Export / Import
// ==========================================
const exporting = ref(false)

async function handleExport() {
  exporting.value = true
  try {
    const data = await exportAllData()
    downloadJson(data)
  } catch { /* ignore */ }
  finally { exporting.value = false }
}

function goImport() { router.push('/import') }

// ==========================================
// Sections
// ==========================================
interface MenuItem {
  id: string
  label: string
  icon: string
  route?: string
  action?: () => void
  desc?: string
  danger?: boolean
}

const mainMenu: MenuItem[] = [
  { id: 'photo',   label: '照片',       icon: 'photo',   route: '/photo',          desc: '浏览和上传照片' },
  { id: 'memory',  label: '大事记',     icon: 'star',    route: '/memory',         desc: '记忆时间轴' },
  { id: 'time',    label: '时光中心',   icon: 'clock',   route: '/time-center',    desc: '支教倒计时' },
  { id: 'ledger',  label: '账本',       icon: 'ledger',  route: '/expense',         desc: '收支与资产' },
]

const toolsMenu: MenuItem[] = [
  { id: 'search',  label: '全局搜索',   icon: 'search',  route: '/search',         desc: '搜索全部记录' },
  { id: 'stats',   label: '年度统计',   icon: 'chart',   route: '/statistics',     desc: '数据统计' },
  { id: 'tags',    label: '标签管理',   icon: 'tag',     route: '/settings/tags',  desc: '管理标签' },
  { id: 'recycle', label: '回收站',     icon: 'trash',   route: '/settings/recycle-bin', desc: '恢复已删除数据' },
]

const settingsMenu: MenuItem[] = [
  { id: 'theme',   label: '深色模式',   icon: 'moon',    action: toggleDarkMode,   desc: darkMode.value ? '已开启' : '已关闭' },
  { id: 'export',  label: '数据导出',   icon: 'download',action: handleExport,      desc: '导出全部数据到 JSON' },
  { id: 'import',  label: '数据导入',   icon: 'upload',  action: goImport,          desc: 'Excel / JSON 批量导入' },
  { id: 'about',   label: '关于昌都记忆', icon: 'info',  action: () => router.push('/settings'), desc: 'V5.1' },
]

const accountMenu: MenuItem[] = [
  { id: 'logout',  label: '退出登录',   icon: 'logout',  action: handleLogout,      danger: true },
]

function handleMenuClick(item: MenuItem) {
  if (item.route) router.push(item.route)
  if (item.action) item.action()
}

async function handleLogout() {
  try {
    await authStore.logout()
    router.push('/login')
  } catch { /* ignore */ }
}

// ==========================================
// Init dark mode on mount
// ==========================================
onMounted(() => {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <div class="pp">
    <!-- ====== User Card ====== -->
    <div class="pp__card" @click="openEdit">
      <div class="pp__avatar">
        {{ authStore.displayName[0]?.toUpperCase() || '?' }}
      </div>
      <div class="pp__user-info">
        <h2 class="pp__name">{{ authStore.displayName }}</h2>
        <p class="pp__bio">{{ authStore.displayBio || '点击编辑个人资料' }}</p>
      </div>
      <svg class="pp__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>

    <!-- ====== Main Menu ====== -->
    <div class="pp__group">
      <div
        v-for="item in mainMenu" :key="item.id"
        class="pp__row"
        @click="handleMenuClick(item)"
      >
        <div class="pp__row-icon" :class="`pp__row-icon--${item.id}`">
          <!-- photo -->
          <svg v-if="item.icon==='photo'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <!-- star -->
          <svg v-else-if="item.icon==='star'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <!-- clock -->
          <svg v-else-if="item.icon==='clock'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <!-- ledger -->
          <svg v-else-if="item.icon==='ledger'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <span class="pp__row-label">{{ item.label }}</span>
        <span class="pp__row-desc">{{ item.desc }}</span>
        <svg class="pp__row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- ====== Tools Menu ====== -->
    <div class="pp__group">
      <div
        v-for="item in toolsMenu" :key="item.id"
        class="pp__row"
        @click="handleMenuClick(item)"
      >
        <div class="pp__row-icon" :class="`pp__row-icon--${item.id}`">
          <svg v-if="item.icon==='search'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <svg v-else-if="item.icon==='chart'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <svg v-else-if="item.icon==='tag'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <svg v-else-if="item.icon==='trash'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </div>
        <span class="pp__row-label">{{ item.label }}</span>
        <span class="pp__row-desc">{{ item.desc }}</span>
        <svg class="pp__row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- ====== Settings Menu ====== -->
    <div class="pp__group">
      <div
        v-for="item in settingsMenu" :key="item.id"
        class="pp__row"
        @click="handleMenuClick(item)"
      >
        <div class="pp__row-icon" :class="`pp__row-icon--${item.id}`">
          <svg v-if="item.icon==='moon'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg v-else-if="item.icon==='download'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <svg v-else-if="item.icon==='upload'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <svg v-else-if="item.icon==='info'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <span class="pp__row-label">{{ item.label }}</span>
        <span class="pp__row-tag">{{ item.desc }}</span>
        <!-- Dark mode toggle -->
        <label v-if="item.id === 'theme'" class="pp__toggle" @click.stop>
          <input type="checkbox" :checked="darkMode" @change="toggleDarkMode" />
          <span class="pp__toggle-slider"></span>
        </label>
        <svg v-else class="pp__row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- ====== Account ====== -->
    <div class="pp__group">
      <div
        v-for="item in accountMenu" :key="item.id"
        class="pp__row pp__row--danger"
        @click="handleMenuClick(item)"
      >
        <div class="pp__row-icon pp__row-icon--logout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <span class="pp__row-label pp__row-label--danger">退出登录</span>
      </div>
    </div>

    <!-- ====== Version ====== -->
    <p class="pp__version">昌都记忆 V5.1</p>

    <!-- ======================================================== -->
    <!-- Edit Profile Modal -->
    <!-- ======================================================== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">编辑个人资料</h3>
            <div class="modal-form">
              <label class="modal-label">昵称</label>
              <input
                v-model="editForm.nickname"
                class="modal-input"
                placeholder="输入昵称"
                maxlength="20"
              />
              <label class="modal-label">个性签名</label>
              <input
                v-model="editForm.bio"
                class="modal-input"
                placeholder="写一句话介绍自己…"
                maxlength="50"
              />
              <p class="modal-hint">头像修改请通过 Gravatar 或联系开发者</p>
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showEditModal = false">取消</button>
                <button class="modal-btn modal-btn--save" :disabled="editLoading" @click="saveProfile">
                  {{ editLoading ? '保存中…' : '保存' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ================================================
   Profile — v5.1 微信风格个人中心
   ================================================ */
.pp { max-width:640px;margin:0 auto;padding:0 16px 80px; }

/* ---- User Card ---- */
.pp__card { display:flex;align-items:center;gap:16px;padding:28px 20px;margin:var(--spacing-page) 0 var(--spacing-lg);background:var(--color-bg-card);border-radius:var(--radius-xl);border:1px solid var(--color-border-light);cursor:pointer;transition:all .15s; }
.pp__card:hover { box-shadow:var(--shadow-md); }
.pp__avatar { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#5E81AC,#81A1C1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;flex-shrink:0; }
.pp__user-info { flex:1;min-width:0; }
.pp__name { font-size:20px;font-weight:600;color:var(--color-text-primary);margin:0 0 4px; }
.pp__bio { font-size:13px;color:var(--color-text-tertiary);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.pp__arrow { color:var(--color-text-tertiary);flex-shrink:0;opacity:.4; }

/* ---- Row Groups ---- */
.pp__group { background:var(--color-bg-card);border-radius:var(--radius-lg);border:1px solid var(--color-border-light);overflow:hidden;margin-bottom:16px; }
.pp__row { display:flex;align-items:center;gap:12px;padding:15px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--color-border-light); }
.pp__row:last-child { border-bottom:none; }
.pp__row:hover { background:var(--color-bg); }
.pp__row--danger:hover { background:#FDF0ED; }
.pp__row-icon { width:34px;height:34px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.pp__row-icon--photo  { background:#EDF2F8;color:var(--color-primary); }
.pp__row-icon--star   { background:#F3EEF8;color:#8E7CB5; }
.pp__row-icon--clock  { background:#EDF2F8;color:var(--color-primary); }
.pp__row-icon--ledger { background:#EBF0ED;color:var(--color-secondary); }
.pp__row-icon--search { background:#EBF0ED;color:var(--color-secondary); }
.pp__row-icon--chart  { background:#F5F0EB;color:var(--color-accent-soft); }
.pp__row-icon--tag    { background:#F5F0EB;color:var(--color-accent-soft); }
.pp__row-icon--trash  { background:#FDF0ED;color:var(--color-error); }
.pp__row-icon--moon   { background:#F3EEF8;color:#8E7CB5; }
.pp__row-icon--download{ background:#EDF2F8;color:var(--color-primary); }
.pp__row-icon--upload { background:#EBF0ED;color:var(--color-secondary); }
.pp__row-icon--info   { background:#EDF2F8;color:var(--color-primary); }
.pp__row-icon--logout { background:#FDF0ED;color:var(--color-error); }
.pp__row-label { flex:1;font-size:15px;color:var(--color-text-primary);font-weight:500; }
.pp__row-label--danger { color:var(--color-error); }
.pp__row-desc { font-size:12px;color:var(--color-text-tertiary);margin-right:4px; }
.pp__row-tag { font-size:12px;color:var(--color-text-tertiary); }
.pp__row-arrow { color:var(--color-text-tertiary);opacity:.4;flex-shrink:0; }

/* ---- Toggle ---- */
.pp__toggle { position:relative;width:44px;height:26px;flex-shrink:0; }
.pp__toggle input { display:none; }
.pp__toggle-slider { position:absolute;inset:0;border-radius:13px;background:var(--color-border);cursor:pointer;transition:background .25s; }
.pp__toggle-slider::after { content:'';position:absolute;top:2px;left:2px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.12);transition:transform .25s; }
.pp__toggle input:checked + .pp__toggle-slider { background:var(--color-primary); }
.pp__toggle input:checked + .pp__toggle-slider::after { transform:translateX(18px); }

/* ---- Version ---- */
.pp__version { text-align:center;font-size:12px;color:var(--color-text-tertiary);opacity:.5;margin-top:8px; }

/* ---- Modals ---- */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.25);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:16px; }
.modal-sheet { width:100%;max-width:420px;background:#fff;border-radius:var(--radius-xl);padding:24px 20px;box-shadow:var(--shadow-lg); }
.modal-sheet__title { font-size:17px;font-weight:700;color:var(--color-text-primary);margin:0 0 20px;text-align:center; }
.modal-form { display:flex;flex-direction:column;gap:12px; }
.modal-label { font-size:12px;font-weight:600;color:var(--color-text-secondary); }
.modal-input { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:15px;font-family:inherit;color:var(--color-text-primary);background:var(--color-bg);outline:none; }
.modal-input:focus { border-color:var(--color-primary);background:#fff; }
.modal-hint { font-size:11px;color:var(--color-text-tertiary);text-align:center;margin:4px 0; }
.modal-form__actions { display:flex;gap:10px;justify-content:center;margin-top:8px; }
.modal-btn { padding:10px 32px;border:none;border-radius:var(--radius-button);font-size:14px;font-family:inherit;cursor:pointer; }
.modal-btn--cancel { background:var(--color-bg);color:var(--color-text-secondary); }
.modal-btn--save { background:var(--color-primary);color:#fff;font-weight:600; }
.modal-btn--save:disabled { opacity:.6;cursor:not-allowed; }

.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-active .modal-sheet,.modal-leave-active .modal-sheet { transition:transform .25s; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-sheet { transform:translateY(30px); }
.modal-leave-to .modal-sheet { transform:translateY(30px); }

@media (min-width:768px) { .modal-overlay { align-items:center;padding:40px; } }
@media (max-width:400px) { .pp { padding:0 12px 80px; } }
</style>
