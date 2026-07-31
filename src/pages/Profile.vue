<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { supabase } from '@/services/supabase'
import { exportAllData, downloadJson } from '@/utils/export'
import { AppAvatar, AppIcon } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// ====== Dark mode ======
const darkMode = ref(localStorage.getItem('theme') === 'dark')
function toggleDarkMode() {
  darkMode.value = !darkMode.value
  localStorage.setItem('theme', darkMode.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', darkMode.value)
  appStore.setTheme(darkMode.value ? 'dark' : 'light')
}

// ====== Account modal (avatar + nickname + bio + logout) ======
const showAccount = ref(false)
const accForm = ref({ nickname: '', bio: '' })
const accLoading = ref(false)
const avatarUploading = ref(false)

function openAccount() {
  accForm.value = { nickname: authStore.profile.nickname ?? '', bio: authStore.profile.bio ?? '' }
  showAccount.value = true
}

async function saveAccount() {
  accLoading.value = true
  try {
    await authStore.updateProfile({ nickname: accForm.value.nickname || null, bio: accForm.value.bio || null })
  } catch { /* ignore */ }
  finally { accLoading.value = false }
}

async function handleAvatarUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  avatarUploading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) return
    const ext = file.name.split('.').pop() || 'jpg'
    // 使用时间戳避免浏览器缓存旧头像
    const timestamp = Date.now()
    const path = `${userId}/avatars/${userId}_${timestamp}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) throw uploadErr
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    // 添加缓存破坏参数
    const cacheBustedUrl = `${publicUrl}?t=${timestamp}`
    await authStore.updateProfile({ avatar_url: cacheBustedUrl })
  } catch { /* ignore */ }
  finally { avatarUploading.value = false; input.value = '' }
}

async function handleLogout() {
  try { await authStore.logout(); router.push('/login') } catch { /* ignore */ }
}

// ====== Data management modal ======
const showDataMgmt = ref(false)
const exporting = ref(false)
async function doExport() {
  exporting.value = true
  try { const data = await exportAllData(); downloadJson(data) } catch { /* ignore */ }
  finally { exporting.value = false }
}

// ====== About modal ======
const showAbout = ref(false)

// ====== Menu groups ======
interface MenuItem { id: string; label: string; icon: string; route?: string; action?: () => void; desc?: string; danger?: boolean }

const groupSearch: MenuItem[] = [
  { id: 'search', label: '全局搜索', icon: 'search', route: '/search', desc: '搜索全部记录' },
]

const groupMain: MenuItem[] = [
  { id: 'memory',     label: '大事记',   icon: 'star',    route: '/memory',              desc: '记忆时间轴' },
  { id: 'timecenter', label: '时光中心', icon: 'clock',   route: '/time-center',         desc: '项目倒计时' },
  { id: 'expense',    label: '账本',     icon: 'expense', route: '/expense',             desc: '收支资产管理' },
  { id: 'stats',      label: '年度统计', icon: 'chart',   route: '/statistics',          desc: '数据统计' },
  { id: 'recycle',    label: '回收站',   icon: 'trash',   route: '/settings/recycle-bin', desc: '恢复已删除数据' },
]

const settingsMenu = computed<MenuItem[]>(() => [
  { id: 'theme',    label: '深色模式',   icon: 'moon',    action: toggleDarkMode, desc: darkMode.value ? '已开启' : '已关闭' },
  { id: 'data',     label: '数据管理',   icon: 'download', action: () => { showDataMgmt.value = true }, desc: '导入 / 导出' },
  { id: 'about',    label: '关于昌都记忆', icon: 'info',  action: () => { showAbout.value = true }, desc: 'V5.3' },
])

function handleMenuClick(item: MenuItem) {
  if (item.route) router.push(item.route)
  if (item.action) item.action()
}

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark')
    darkMode.value = true
  }
})
</script>

<template>
  <div class="pp">
    <!-- ====== User Card ====== -->
    <div class="pp__card" @click="openAccount">
      <div class="pp__avatar-wrap">
        <AppAvatar :name="authStore.displayName" :src="authStore.profile.avatar_url || undefined" size="lg" />
      </div>
      <div class="pp__user-info">
        <h2 class="pp__name">{{ authStore.displayName }}</h2>
        <p class="pp__bio">{{ authStore.displayBio || '点击编辑个人资料' }}</p>
      </div>
      <AppIcon name="chevron-right" :size="16" class="pp__arrow" />
    </div>

    <!-- Group A: 全局搜索 -->
    <div class="pp__group">
      <div v-for="item in groupSearch" :key="item.id" class="pp__row" @click="handleMenuClick(item)">
        <div class="pp__row-icon" :class="`pp__row-icon--${item.id}`"><AppIcon :name="item.icon" :size="20" /></div>
        <span class="pp__row-label">{{ item.label }}</span>
        <span class="pp__row-desc">{{ item.desc }}</span>
        <AppIcon name="chevron-right" :size="14" class="pp__row-arrow" />
      </div>
    </div>

    <!-- Group B: 大事记 | 时光中心 | 账本 | 年度统计 | 回收站 -->
    <div class="pp__group">
      <div v-for="item in groupMain" :key="item.id" class="pp__row" @click="handleMenuClick(item)">
        <div class="pp__row-icon" :class="`pp__row-icon--${item.id}`"><AppIcon :name="item.icon" :size="20" /></div>
        <span class="pp__row-label">{{ item.label }}</span>
        <span class="pp__row-desc">{{ item.desc }}</span>
        <AppIcon name="chevron-right" :size="14" class="pp__row-arrow" />
      </div>
    </div>

    <!-- Group C: 深色模式 | 数据管理 | 关于 -->
    <div class="pp__group">
      <div v-for="item in settingsMenu" :key="item.id" class="pp__row" @click="handleMenuClick(item)">
        <div class="pp__row-icon" :class="`pp__row-icon--${item.id}`"><AppIcon :name="item.icon" :size="20" /></div>
        <span class="pp__row-label">{{ item.label }}</span>
        <span class="pp__row-desc">{{ item.desc }}</span>
        <template v-if="item.id === 'theme'">
          <label class="pp__toggle" @click.stop>
            <input type="checkbox" :checked="darkMode" @change="toggleDarkMode" />
            <span class="pp__toggle-slider" />
          </label>
        </template>
        <AppIcon v-else name="chevron-right" :size="14" class="pp__row-arrow" />
      </div>
    </div>

    <!-- Version -->
    <p class="pp__version">昌都记忆 V5.3</p>

    <!-- ====== Account Modal ====== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAccount" class="modal-overlay" @click.self="showAccount = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">账号管理</h3>

            <!-- Avatar upload -->
            <div class="modal-avatar-section">
              <AppAvatar :name="authStore.displayName" :src="authStore.profile.avatar_url || undefined" size="lg" />
              <label class="modal-avatar-btn" :class="{ loading: avatarUploading }">
                {{ avatarUploading ? '上传中…' : '更换头像' }}
                <input type="file" accept="image/*" hidden @change="handleAvatarUpload" />
              </label>
            </div>

            <div class="modal-form">
              <label class="modal-label">昵称</label>
              <input v-model="accForm.nickname" class="modal-input" placeholder="输入昵称" maxlength="20" />
              <label class="modal-label">个性签名</label>
              <input v-model="accForm.bio" class="modal-input" placeholder="写一句话介绍自己…" maxlength="50" />
              <p class="modal-email">{{ authStore.user?.email }}</p>
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showAccount = false">关闭</button>
                <button class="modal-btn modal-btn--save" :disabled="accLoading" @click="saveAccount">
                  {{ accLoading ? '保存中…' : '保存' }}
                </button>
              </div>
              <button class="modal-logout" @click="handleLogout">
                <AppIcon name="logout" :size="16" /> 退出登录
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ====== Data Management Modal ====== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDataMgmt" class="modal-overlay" @click.self="showDataMgmt = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">数据管理</h3>
            <div class="data-mgmt">
              <button class="data-mgmt__btn" :disabled="exporting" @click="doExport">
                <span class="data-mgmt__icon">📤</span>
                <span class="data-mgmt__label">导出数据</span>
                <span class="data-mgmt__desc">{{ exporting ? '导出中…' : '导出全部数据到 JSON 文件' }}</span>
              </button>
              <button class="data-mgmt__btn" @click="showDataMgmt = false; router.push('/import')">
                <span class="data-mgmt__icon">📥</span>
                <span class="data-mgmt__label">导入数据</span>
                <span class="data-mgmt__desc">Excel / JSON 批量导入</span>
              </button>
            </div>
            <div style="text-align:center;margin-top:16px">
              <button class="modal-btn modal-btn--cancel" @click="showDataMgmt = false">关闭</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ====== About Modal ====== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAbout" class="modal-overlay" @click.self="showAbout = false">
          <div class="modal-sheet modal-sheet--about">
            <div class="about-logo">🏔️</div>
            <h2 class="about-title">昌都记忆</h2>
            <p class="about-subtitle">Changdu Memory</p>
            <p class="about-version">V5.3 — 个人数字记录平台</p>
            <p class="about-desc">记录在西藏昌都的一年支教生活</p>
            <div style="text-align:center;margin-top:20px">
              <button class="modal-btn modal-btn--cancel" @click="showAbout = false">关闭</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pp { max-width: 640px; margin: 0 auto; padding: 0 16px 80px; }

/* User card */
.pp__card { display: flex; align-items: center; gap: 16px; padding: 28px 20px; margin: var(--spacing-page) 0 var(--spacing-lg); background: var(--color-bg-card); border-radius: var(--radius-xl); border: 1px solid var(--color-border-light); cursor: pointer; transition: all .15s; }
.pp__card:hover { box-shadow: var(--shadow-md); }
.pp__user-info { flex: 1; min-width: 0; }
.pp__name { font-size: 20px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 4px; }
.pp__bio { font-size: 13px; color: var(--color-text-tertiary); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp__arrow { color: var(--color-text-tertiary); flex-shrink: 0; opacity: .4; }

/* Menu groups */
.pp__group { background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); overflow: hidden; margin-bottom: 16px; }
.pp__row { display: flex; align-items: center; gap: 12px; padding: 15px 16px; cursor: pointer; transition: background .1s; border-bottom: 1px solid var(--color-border-light); }
.pp__row:last-child { border-bottom: none; }
.pp__row:hover { background: var(--color-bg); }
.pp__row-icon { width: 34px; height: 34px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pp__row-icon--search  { background: #EBF0ED; color: var(--color-secondary); }
.pp__row-icon--memory  { background: #F3EEF8; color: #8E7CB5; }
.pp__row-icon--stats   { background: #F5F0EB; color: var(--color-accent-soft); }
.pp__row-icon--recycle { background: #FDF0ED; color: var(--color-error); }
.pp__row-icon--theme   { background: #F3EEF8; color: #8E7CB5; }
.pp__row-icon--data    { background: #EDF2F8; color: var(--color-primary); }
.pp__row-icon--about   { background: #EDF2F8; color: var(--color-primary); }
.pp__row-icon--download{ background: #EDF2F8; color: var(--color-primary); }
.pp__row-icon--star    { background: #F3EEF8; color: #8E7CB5; }
.pp__row-icon--chart   { background: #F5F0EB; color: var(--color-accent-soft); }
.pp__row-icon--trash   { background: #FDF0ED; color: var(--color-error); }
.pp__row-icon--tag     { background: #F5F0EB; color: var(--color-accent-soft); }
.pp__row-icon--timecenter { background: #EDF2F8; color: var(--color-primary); }
.pp__row-icon--expense { background: #FDF0ED; color: var(--color-error); }
.pp__row-label { flex: 1; font-size: 15px; color: var(--color-text-primary); font-weight: 500; }
.pp__row-desc { font-size: 12px; color: var(--color-text-tertiary); margin-right: 4px; }
.pp__row-arrow { color: var(--color-text-tertiary); opacity: .4; flex-shrink: 0; }

/* Toggle */
.pp__toggle { position: relative; width: 44px; height: 26px; flex-shrink: 0; }
.pp__toggle input { display: none; }
.pp__toggle-slider { position: absolute; inset: 0; border-radius: 13px; background: var(--color-border); cursor: pointer; transition: background .25s; }
.pp__toggle-slider::after { content: ''; position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.12); transition: transform .25s; }
.pp__toggle input:checked + .pp__toggle-slider { background: var(--color-primary); }
.pp__toggle input:checked + .pp__toggle-slider::after { transform: translateX(18px); }

.pp__version { text-align: center; font-size: 12px; color: var(--color-text-tertiary); opacity: .5; margin-top: 8px; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.25); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: flex-end; justify-content: center; padding: 16px; }
.modal-sheet { width: 100%; max-width: 420px; background: #fff; border-radius: var(--radius-xl); padding: 24px 20px; box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto; }
.modal-sheet__title { font-size: 17px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 20px; text-align: center; }
.modal-form { display: flex; flex-direction: column; gap: 12px; }
.modal-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.modal-input { padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 15px; font-family: inherit; color: var(--color-text-primary); background: var(--color-bg); outline: none; }
.modal-input:focus { border-color: var(--color-primary); background: #fff; }
.modal-email { font-size: 12px; color: var(--color-text-tertiary); text-align: center; margin: 0; }
.modal-form__actions { display: flex; gap: 10px; justify-content: center; margin-top: 4px; }
.modal-btn { padding: 10px 28px; border: none; border-radius: var(--radius-button); font-size: 14px; font-family: inherit; cursor: pointer; }
.modal-btn--cancel { background: var(--color-bg); color: var(--color-text-secondary); }
.modal-btn--save { background: var(--color-primary); color: #fff; font-weight: 600; }
.modal-btn--save:disabled { opacity: .6; cursor: not-allowed; }

/* Avatar section in account modal */
.modal-avatar-section { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border-light); }
.modal-avatar-btn { font-size: 12px; color: var(--color-primary); cursor: pointer; font-weight: 500; }
.modal-avatar-btn:hover { text-decoration: underline; }
.modal-avatar-btn.loading { opacity: .5; pointer-events: none; }

/* Logout in account modal */
.modal-logout { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 16px; padding: 12px; border: 1px solid var(--color-error); border-radius: var(--radius-button); background: transparent; color: var(--color-error); font-size: 14px; font-family: inherit; cursor: pointer; transition: all .15s; }
.modal-logout:hover { background: rgba(194, 103, 106, 0.06); }

/* Data management */
.data-mgmt { display: flex; flex-direction: column; gap: 12px; }
.data-mgmt__btn { display: flex; flex-direction: column; gap: 4px; padding: 16px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg); cursor: pointer; font-family: inherit; text-align: left; transition: all .15s; }
.data-mgmt__btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.data-mgmt__btn:disabled { opacity: .5; cursor: not-allowed; }
.data-mgmt__icon { font-size: 24px; }
.data-mgmt__label { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.data-mgmt__desc { font-size: 12px; color: var(--color-text-tertiary); }

/* About */
.modal-sheet--about { text-align: center; }
.about-logo { font-size: 48px; margin-bottom: 8px; }
.about-title { font-size: 24px; font-weight: 700; color: var(--color-primary); margin: 0 0 4px; letter-spacing: 2px; }
.about-subtitle { font-size: 13px; color: var(--color-text-secondary); letter-spacing: 1px; margin: 0 0 16px; }
.about-version { font-size: 14px; color: var(--color-text-primary); font-weight: 500; margin: 0 0 4px; }
.about-desc { font-size: 13px; color: var(--color-text-tertiary); margin: 0; }

.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-active .modal-sheet, .modal-leave-active .modal-sheet { transition: transform .25s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-sheet { transform: translateY(30px); }
.modal-leave-to .modal-sheet { transform: translateY(30px); }

@media (min-width: 768px) { .modal-overlay { align-items: center; padding: 40px; } }
@media (max-width: 400px) { .pp { padding: 0 12px 80px; } }
</style>
