<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTimeStore } from '@/stores/time'
import { useDiaryStore } from '@/stores/diary'
import { useWorkStore } from '@/stores/work'
import { useMemoryStore } from '@/stores/memory'
import { useExpenseStore } from '@/stores/expense'
import { supabase } from '@/services/supabase'
import { exportAllData, downloadJson } from '@/utils/export'
import { AppCard, AppSection, AppAvatar, AppIcon } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const timeStore = useTimeStore()
const diaryStore = useDiaryStore()
const workStore = useWorkStore()
const memoryStore = useMemoryStore()
const expenseStore = useExpenseStore()

// ====== Data loading ======
const ready = ref(false)

onMounted(async () => {
  const tasks = [
    timeStore.profile ? Promise.resolve() : timeStore.loadTimeProfile(),
    diaryStore.diaries.length ? Promise.resolve() : diaryStore.loadDiaries(),
    workStore.works.length ? Promise.resolve() : workStore.loadWorks(),
    memoryStore.memories.length ? Promise.resolve() : memoryStore.loadMemories(),
    expenseStore.expenses.length ? Promise.resolve() : expenseStore.loadExpenses(),
  ]
  await Promise.allSettled(tasks)
  ready.value = true
})

// ====== Dark mode ======
const darkMode = ref(localStorage.getItem('theme') === 'dark')
function toggleDarkMode() {
  darkMode.value = !darkMode.value
  localStorage.setItem('theme', darkMode.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', darkMode.value)
  appStore.setTheme(darkMode.value ? 'dark' : 'light')
}

// ====== Time profile ======
const hasTimeProfile = computed(() => !!timeStore.profile?.start_date)
const dateRangeText = computed(() => {
  if (!timeStore.profile?.start_date || !timeStore.profile?.end_date) return ''
  const s = timeStore.profile.start_date
  const e = timeStore.profile.end_date
  return `${s.substring(0, 7).replace('-', '年')}月 — ${e.substring(0, 7).replace('-', '年')}月`
})

// ====== Profile hero card (按 我的1.1.html 原型) ======
const projectName = computed(() => timeStore.profile?.project_name || '')
const heroLocation = computed(() => timeStore.profile?.location || '')
/** 顶部徽标文案：优先项目名，其次位置 */
const heroBadge = computed(() => projectName.value || heroLocation.value || '支教志愿者')
/** 姓名下方的支教团信息：项目名 · 位置 */
const heroSub = computed(() => {
  if (projectName.value && heroLocation.value) return `${projectName.value} · ${heroLocation.value}`
  return projectName.value || heroLocation.value
})
/** 服务学校 / 教学科目（数据库新增列后填充，未设置显示提示） */
const heroSchool = computed(() => authStore.profile.school || '待设置')
const heroSubject = computed(() => authStore.profile.subject || '待设置')

// ====== Stats ======
const statCards = computed(() => [
  { key: 'diary', label: '日记篇数', value: diaryStore.diaries.length, icon: 'book', color: 'rgba(75,143,140,0.1)', iconColor: 'var(--color-primary)' },
  { key: 'work', label: '工作记录', value: workStore.works.length, icon: 'briefcase', color: 'rgba(111,168,220,0.12)', iconColor: 'var(--color-sky)' },
  { key: 'memory', label: '大事记', value: memoryStore.memories.length, icon: 'star', color: 'rgba(214,168,79,0.12)', iconColor: 'var(--color-gold)' },
  { key: 'expense', label: '消费记录', value: expenseStore.expenses.length, icon: 'wallet', color: 'rgba(194,103,106,0.1)', iconColor: 'var(--color-accent)' },
])

// ====== Account modal (keep existing logic) ======
const showAccount = ref(false)
const accForm = ref({ nickname: '', bio: '', school: '', subject: '' })
const accLoading = ref(false)
const avatarUploading = ref(false)

function openAccount() {
  accForm.value = {
    nickname: authStore.profile.nickname ?? '',
    bio: authStore.profile.bio ?? '',
    school: authStore.profile.school ?? '',
    subject: authStore.profile.subject ?? '',
  }
  showAccount.value = true
}

async function saveAccount() {
  accLoading.value = true
  try {
    await authStore.updateProfile({
      nickname: accForm.value.nickname || null,
      bio: accForm.value.bio || null,
      school: accForm.value.school || null,
      subject: accForm.value.subject || null,
    })
    showAccount.value = false
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
    const timestamp = Date.now()
    const path = `${userId}/avatars/${userId}_${timestamp}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) throw uploadErr
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
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
interface MenuItem { id: string; label: string; icon: string; route?: string; action?: () => void; desc?: string }

const groupFeatures: MenuItem[] = [
  { id: 'mood',   label: '今日心情', icon: 'smile',  route: '/mood',                desc: '记录此刻心情' },
  { id: 'search', label: '全局搜索', icon: 'search', route: '/search',              desc: '搜索全部记录' },
  { id: 'memory', label: '大事记',   icon: 'star',   route: '/memory',              desc: '记忆时间轴' },
  { id: 'stats',  label: '年度统计', icon: 'chart',  route: '/statistics',          desc: '数据统计' },
]

const groupData: MenuItem[] = [
  { id: 'data',    label: '数据管理', icon: 'upload', action: () => { showDataMgmt.value = true }, desc: '导入 / 导出全部数据' },
  { id: 'recycle', label: '回收站',   icon: 'trash',  route: '/settings/recycle-bin',              desc: '恢复已删除数据' },
]

const settingsMenu = computed<MenuItem[]>(() => [
  { id: 'theme', label: '深色模式', icon: 'moon', action: toggleDarkMode, desc: darkMode.value ? '已开启' : '已关闭' },
  { id: 'about', label: '关于昌都记忆', icon: 'info', action: () => { showAbout.value = true }, desc: 'V5.5.1' },
  { id: 'logout', label: '退出登录', icon: 'logout', action: () => { handleLogout() }, desc: '退出当前账号' },
])

function handleMenuClick(item: MenuItem) {
  if (item.route) router.push(item.route)
  if (item.action) item.action()
}

// ====== Navigation ======
function goTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="profile">
    <!-- ====== Page header ====== -->
    <div class="profile__header">
      <div class="profile__header-titles">
        <h1 class="profile__header-title">
          我的档案
        </h1>
        <p class="profile__header-sub">
          志愿者的数字时光归档
        </p>
      </div>
      <span v-if="dateRangeText" class="profile__header-badge">{{ dateRangeText }}</span>
    </div>

    <!-- ====== Desktop: 2-column | Mobile: single ====== -->
    <div class="profile__grid">
      <!-- ==========================================
           LEFT COLUMN
           ========================================== -->
      <div class="profile__left">
        <!-- Personal Hero Card (按 我的1.1.html 原型) -->
        <div class="profile-hero" @click="openAccount">
          <!-- 背景雪山线稿纹理 -->
          <svg
            class="profile-hero__texture"
            viewBox="0 0 500 150"
            fill="none"
            aria-hidden="true"
          >
            <path d="M0 150L120 40L200 110L320 10L500 150H0Z" fill="currentColor" />
          </svg>

          <div class="profile-hero__content">
            <!-- 顶部状态标签 -->
            <div class="profile-hero__top">
              <span class="profile-hero__badge">
                {{ heroBadge }}
              </span>
              <span v-if="heroLocation" class="profile-hero__top-location">
                {{ heroLocation }}
              </span>
            </div>

            <!-- 头像与姓名信息 -->
            <div class="profile-hero__profile">
              <div class="profile-hero__avatar-wrap">
                <div class="profile-hero__avatar-ring">
                  <AppAvatar
                    :name="authStore.displayName"
                    :src="authStore.profile.avatar_url || undefined"
                    :size="88"
                  />
                </div>
                <!-- 右下角绿色勾选 -->
                <div class="profile-hero__verified">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ><path d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              <div class="profile-hero__name-wrap">
                <h2 class="profile-hero__name">
                  {{ authStore.displayName }}
                </h2>
                <p v-if="heroSub" class="profile-hero__sub">
                  {{ heroSub }}
                </p>
              </div>

              <p class="profile-hero__bio">
                {{ authStore.displayBio || '记录在昌都的一年 · 山海有期，青春不负。' }}
              </p>
            </div>

            <!-- 个人属性简徽 -->
            <div class="profile-hero__attrs">
              <div class="profile-hero__attr">
                <span class="profile-hero__attr-label">服务学校</span>
                <span class="profile-hero__attr-value">{{ heroSchool }}</span>
              </div>
              <div class="profile-hero__attr">
                <span class="profile-hero__attr-label">教学科目</span>
                <span class="profile-hero__attr-value">{{ heroSubject }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- About / version (desktop only: light block) -->
        <div class="profile__about-block">
          <div class="profile__about-icon">
            <AppIcon name="info" size="16" />
          </div>
          <div class="profile__about-text">
            <span class="profile__about-name">昌都记忆</span>
            <span class="profile__about-version">V5.5.1</span>
          </div>
        </div>
      </div>

      <!-- ==========================================
           RIGHT COLUMN
           ========================================== -->
      <div class="profile__right">
        <!-- Time capsule -->
        <template v-if="hasTimeProfile">
          <AppCard class="profile__time-capsule">
            <div class="time-capsule__head">
              <AppIcon name="clock" size="18" color="var(--color-primary)" />
              <span class="time-capsule__head-label">支教时光</span>
              <span class="time-capsule__phase">{{ timeStore.phase }}</span>
            </div>

            <div class="time-capsule__grid">
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-num">{{ timeStore.daysPassed }}</span>
                <span class="time-capsule__stat-label">已过天数</span>
              </div>
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-num">{{ timeStore.daysRemaining }}</span>
                <span class="time-capsule__stat-label">剩余天数</span>
              </div>
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-num">{{ timeStore.totalDays }}</span>
                <span class="time-capsule__stat-label">总天数</span>
              </div>
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-num">{{ timeStore.progress }}%</span>
                <span class="time-capsule__stat-label">完成度</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="time-capsule__progress">
              <div class="time-capsule__progress-track">
                <div
                  class="time-capsule__progress-fill"
                  :style="{ width: timeStore.progress + '%' }"
                />
              </div>
            </div>

            <div class="time-capsule__dates">
              {{ timeStore.profile?.start_date?.replace(/-/g, '.') }}
              —
              {{ timeStore.profile?.end_date?.replace(/-/g, '.') }}
            </div>
          </AppCard>
        </template>
        <AppCard v-else class="profile__time-capsule profile__time-capsule--empty">
          <div class="time-capsule__empty">
            <p class="time-capsule__empty-text">
              尚未设置支教时间
            </p>
            <button class="time-capsule__empty-btn" @click="goTo('/time-center')">
              前往时光中心配置
            </button>
          </div>
        </AppCard>

        <!-- Stats: 在昌都的印记 -->
        <AppSection title="在昌都的印记" class="profile__section profile__section--stats">
          <div class="profile__stats-grid">
            <div
              v-for="stat in statCards"
              :key="stat.key"
              class="profile__stat-card"
            >
              <div
                class="profile__stat-icon"
                :style="{ background: stat.color, color: stat.iconColor }"
              >
                <AppIcon :name="stat.icon" size="18" />
              </div>
              <span class="profile__stat-value">{{ ready ? stat.value : '—' }}</span>
              <span class="profile__stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </AppSection>

        <!-- ==========================================
             Menus: 常用功能 + 数据管理 + 系统
             电脑端两列（左:常用功能+系统 | 右:数据管理），手机端单列
             ========================================== -->
        <div class="profile__menus">
          <!-- Menu: Features -->
          <AppSection title="常用功能" class="profile__section profile__menus-item profile__menus-item--features">
            <AppCard no-padding>
              <button
                v-for="item in groupFeatures"
                :key="item.id"
                class="profile__menu-row"
                @click="handleMenuClick(item)"
              >
                <div
                  class="profile__menu-icon"
                  :class="`profile__menu-icon--${item.id}`"
                >
                  <AppIcon :name="item.icon" size="18" />
                </div>
                <span class="profile__menu-label">{{ item.label }}</span>
                <span class="profile__menu-desc">{{ item.desc }}</span>
                <AppIcon name="chevron-right" size="14" class="profile__menu-arrow" />
              </button>
            </AppCard>
          </AppSection>

          <!-- Menu: Data -->
          <AppSection title="数据管理" class="profile__section profile__menus-item profile__menus-item--data">
            <AppCard no-padding>
              <button
                v-for="item in groupData"
                :key="item.id"
                class="profile__menu-row"
                @click="handleMenuClick(item)"
              >
                <div
                  class="profile__menu-icon"
                  :class="`profile__menu-icon--${item.id}`"
                >
                  <AppIcon :name="item.icon" size="18" />
                </div>
                <span class="profile__menu-label">{{ item.label }}</span>
                <span class="profile__menu-desc">{{ item.desc }}</span>
                <AppIcon name="chevron-right" size="14" class="profile__menu-arrow" />
              </button>
            </AppCard>
          </AppSection>

          <!-- Menu: Settings -->
          <AppSection title="系统" class="profile__section profile__menus-item profile__menus-item--system">
            <AppCard no-padding>
              <button
                v-for="item in settingsMenu"
                :key="item.id"
                class="profile__menu-row"
                @click="handleMenuClick(item)"
              >
                <div
                  class="profile__menu-icon"
                  :class="`profile__menu-icon--${item.id}`"
                >
                  <AppIcon :name="item.icon" size="18" />
                </div>
                <span class="profile__menu-label">{{ item.label }}</span>
                <span class="profile__menu-desc">{{ item.desc }}</span>
                <template v-if="item.id === 'theme'">
                  <label class="profile__toggle" @click.stop>
                    <input type="checkbox" :checked="darkMode" @change="toggleDarkMode" />
                    <span class="profile__toggle-slider" />
                  </label>
                </template>
                <AppIcon
                  v-else
                  name="chevron-right"
                  size="14"
                  class="profile__menu-arrow"
                />
              </button>
            </AppCard>
          </AppSection>
        </div>
      </div>
    </div>

    <!-- ====== Account Modal ====== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAccount" class="modal-overlay" @click.self="showAccount = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">
              账号管理
            </h3>

            <div class="modal-avatar-section">
              <AppAvatar
                :name="authStore.displayName"
                :src="authStore.profile.avatar_url || undefined"
                size="lg"
              />
              <label class="modal-avatar-btn" :class="{ loading: avatarUploading }">
                {{ avatarUploading ? '上传中…' : '更换头像' }}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  @change="handleAvatarUpload"
                />
              </label>
            </div>

            <div class="modal-form">
              <label class="modal-label">昵称</label>
              <input
                v-model="accForm.nickname"
                class="modal-input"
                placeholder="输入昵称"
                maxlength="20"
              />
              <label class="modal-label">个性签名</label>
              <input
                v-model="accForm.bio"
                class="modal-input"
                placeholder="写一句话介绍自己…"
                maxlength="50"
              />
              <label class="modal-label">服务学校</label>
              <input
                v-model="accForm.school"
                class="modal-input"
                placeholder="如：昌都市第一高级中学"
                maxlength="30"
              />
              <label class="modal-label">教学科目</label>
              <input
                v-model="accForm.subject"
                class="modal-input"
                placeholder="如：高一思想政治"
                maxlength="20"
              />
              <p class="modal-email">
                {{ authStore.user?.email }}
              </p>
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showAccount = false">
                  取消
                </button>
                <button class="modal-btn modal-btn--save" :disabled="accLoading" @click="saveAccount">
                  {{ accLoading ? '保存中…' : '保存' }}
                </button>
              </div>
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
            <h3 class="modal-sheet__title">
              数据管理
            </h3>
            <div class="data-mgmt">
              <button class="data-mgmt__btn" :disabled="exporting" @click="doExport">
                <div class="data-mgmt__icon-wrap">
                  <AppIcon name="download" size="22" />
                </div>
                <div class="data-mgmt__info">
                  <span class="data-mgmt__label">导出数据</span>
                  <span class="data-mgmt__desc">{{ exporting ? '导出中…' : '导出全部数据到 JSON 文件' }}</span>
                </div>
              </button>
              <button class="data-mgmt__btn" @click="showDataMgmt = false; router.push('/import')">
                <div class="data-mgmt__icon-wrap">
                  <AppIcon name="upload" size="22" />
                </div>
                <div class="data-mgmt__info">
                  <span class="data-mgmt__label">导入数据</span>
                  <span class="data-mgmt__desc">Excel / JSON 批量导入</span>
                </div>
              </button>
            </div>
            <div class="modal-sheet__footer">
              <button class="modal-btn modal-btn--cancel" @click="showDataMgmt = false">
                关闭
              </button>
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
            <div class="about-logo-circle">
              昌
            </div>
            <h2 class="about-title">
              昌都记忆
            </h2>
            <p class="about-subtitle">
              Changdu Memory
            </p>
            <p class="about-version">
              V5.5.1 — 个人数字记录平台
            </p>
            <p class="about-desc">
              记录在西藏昌都的一年支教生活
            </p>
            <div class="modal-sheet__footer">
              <button class="modal-btn modal-btn--cancel" @click="showAbout = false">
                关闭
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ================================================
   Profile — V5.5.1
   ================================================ */
.profile {
  max-width: 1200px;
  margin: 0 auto;
}

/* ---- Page header ---- */
.profile__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.profile__header-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile__header-title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.profile__header-sub {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.profile__header-badge {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 5px 14px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ==========================================
   Layout grid
   ========================================== */
.profile__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xl);
}

@media (min-width: 1024px) {
  .profile__grid {
    grid-template-columns: 5fr 7fr;
    align-items: start;
  }
}

.profile__section {
  margin-bottom: var(--spacing-2xl);
}

/* 手机端：隐藏页面标题与「在昌都的印记」卡片（电脑端保持不变） */
@media (max-width: 767px) {
  .profile__header {
    display: none;
  }

  .profile__section--stats {
    display: none;
  }
}

/* ==========================================
   Menus — 电脑端两列 / 手机端单列
   左列：常用功能 + 系统 | 右列：数据管理
   ========================================== */
.profile__menus {
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .profile__menus {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'features data'
      'system   data';
    column-gap: var(--spacing-xl);
    row-gap: var(--spacing-2xl);
    align-items: start;
  }

  .profile__menus .profile__section {
    margin-bottom: 0;
  }

  .profile__menus-item--features { grid-area: features; }
  .profile__menus-item--data     { grid-area: data; }
  .profile__menus-item--system   { grid-area: system; }
}

/* ==========================================
   LEFT — Personal Hero Card
   ========================================== */
.profile__left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-2xl, 32px);
  background: linear-gradient(145deg, #101820 0%, #1f343a 40%, var(--color-primary) 100%);
  box-shadow: 0 20px 40px -15px rgba(16, 24, 32, 0.3);
  color: #fff;
  cursor: pointer;
}

/* 背景雪山线稿纹理 */
.profile-hero__texture {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 160px;
  opacity: 0.1;
  color: currentColor;
  pointer-events: none;
}

.profile-hero__content {
  position: relative;
  z-index: 2;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 768px) {
  .profile-hero__content {
    padding: 32px;
  }
}

/* ---- 顶部状态标签 ---- */
.profile-hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.profile-hero__badge {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(178, 232, 226, 0.9);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 72%;
}

.profile-hero__top-location {
  font-size: 12px;
  color: rgba(203, 213, 225, 0.8);
  flex-shrink: 0;
}

/* ---- 头像与姓名信息 ---- */
.profile-hero__profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.profile-hero__avatar-wrap {
  position: relative;
}

.profile-hero__avatar-ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, var(--color-gold, #D6A84F), var(--color-sky, #6FA8DC), var(--color-primary));
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.profile-hero__avatar-ring .app-avatar {
  border-radius: 50%;
}

/* 右下角绿色勾选 */
.profile-hero__verified {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid #101820;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.profile-hero__name-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-hero__name {
  margin: 0;
  font-size: 32px;
  line-height: 1.2;
  font-weight: var(--font-weight-extrabold, 800);
  letter-spacing: -0.02em;
  color: #fff;
}

.profile-hero__sub {
  margin: 0;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  color: rgba(204, 255, 250, 0.9);
}

.profile-hero__bio {
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(203, 213, 225, 0.7);
  max-width: 280px;
  line-height: 1.6;
  font-style: italic;
}

/* ---- 个人属性简徽 ---- */
.profile-hero__attrs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.profile-hero__attr {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.profile-hero__attr-label {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
}

.profile-hero__attr-value {
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  color: rgba(226, 232, 240, 0.95);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* About block */
.profile__about-block {
  display: none;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
}

@media (min-width: 1024px) {
  .profile__about-block {
    display: flex;
  }
}

.profile__about-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(75, 143, 140, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile__about-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.profile__about-name {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.profile__about-version {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

/* ==========================================
   RIGHT — Time capsule
   ========================================== */
.profile__time-capsule {
  margin-bottom: var(--spacing-2xl);
}

.profile__time-capsule--empty {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-page);
}

.time-capsule__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.time-capsule__head-label {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1;
}

.time-capsule__phase {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.time-capsule__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.time-capsule__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 4px;
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

.time-capsule__stat-num {
  font-size: 22px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  line-height: 1;
}

.time-capsule__stat-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.time-capsule__progress {
  margin-bottom: 10px;
}

.time-capsule__progress-track {
  height: 5px;
  background: var(--color-border-light);
  border-radius: 3px;
  overflow: hidden;
}

.time-capsule__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-gold));
  border-radius: 3px;
  transition: width 800ms ease;
}

.time-capsule__dates {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  text-align: center;
}

.time-capsule__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.time-capsule__empty-text {
  font-size: var(--font-secondary);
  color: var(--color-text-tertiary);
  margin: 0;
}

.time-capsule__empty-btn {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.time-capsule__empty-btn:hover {
  background: var(--color-primary-dark);
}

/* ==========================================
   Stats grid (2×2)
   ========================================== */
.profile__stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

@media (max-width: 399px) {
  .profile__stats-grid {
    grid-template-columns: 1fr;
  }
}

.profile__stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-xs);
}

.profile__stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile__stat-value {
  font-size: 26px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  line-height: 1;
}

.profile__stat-label {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

/* ==========================================
   Menu rows
   ========================================== */
.profile__menu-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  background: transparent;
  cursor: pointer;
  transition: background var(--transition-fast);
  font-family: inherit;
  text-align: left;
}

.profile__menu-row:last-child {
  border-bottom: none;
}

.profile__menu-row:hover {
  background: var(--color-bg);
}

.profile__menu-row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.profile__menu-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile__menu-icon--mood    { background: rgba(107, 158, 133, 0.12);  color: #6B9E85; }
.profile__menu-icon--search  { background: rgba(107, 158, 133, 0.1);  color: var(--color-secondary); }
.profile__menu-icon--memory  { background: rgba(142, 124, 181, 0.12);  color: #8E7CB5; }
.profile__menu-icon--stats   { background: rgba(208, 135, 112, 0.1);  color: var(--color-accent-soft); }
.profile__menu-icon--recycle { background: rgba(194, 103, 106, 0.1);  color: var(--color-error); }
.profile__menu-icon--data    { background: rgba(75, 143, 140, 0.1);   color: var(--color-primary); }
.profile__menu-icon--theme   { background: rgba(142, 124, 181, 0.12);  color: #8E7CB5; }
.profile__menu-icon--about   { background: rgba(75, 143, 140, 0.1);   color: var(--color-primary); }
.profile__menu-icon--logout  { background: rgba(194, 103, 106, 0.1);  color: var(--color-error); }

.profile__menu-label {
  flex: 1;
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  min-width: 0;
}

.profile__menu-desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile__menu-arrow {
  color: var(--color-text-tertiary);
  opacity: 0.4;
  flex-shrink: 0;
}

/* Toggle switch */
.profile__toggle {
  position: relative;
  width: 46px;
  height: 27px;
  flex-shrink: 0;
}
.profile__toggle input { display: none; }
.profile__toggle-slider {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: var(--color-border);
  cursor: pointer;
  transition: background 0.25s;
}
.profile__toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.25s;
}
.profile__toggle input:checked + .profile__toggle-slider {
  background: var(--color-primary);
}
.profile__toggle input:checked + .profile__toggle-slider::after {
  transform: translateX(19px);
}

/* ==========================================
   Modals (restructured)
   ========================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.modal-sheet {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-white);
  border-radius: var(--radius-2xl);
  padding: 28px 24px;
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sheet__title {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 24px;
  text-align: center;
}

.modal-sheet__footer {
  text-align: center;
  margin-top: 20px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-label {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.modal-input {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast);
}

.modal-input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.modal-email {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  text-align: center;
  margin: 4px 0;
}

.modal-form__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

.modal-btn {
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-secondary);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.modal-btn--cancel:hover {
  background: var(--color-border-light);
}

.modal-btn--save {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

.modal-btn--save:hover {
  background: var(--color-primary-dark);
}

.modal-btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Avatar section in account modal */
.modal-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border-light);
}

.modal-avatar-btn {
  font-size: var(--font-caption);
  color: var(--color-primary);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: opacity var(--transition-fast);
}

.modal-avatar-btn:hover { opacity: 0.8; }
.modal-avatar-btn.loading { opacity: 0.4; pointer-events: none; }

/* Data management modal */
.data-mgmt {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-mgmt__btn {
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

.data-mgmt__btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.data-mgmt__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.data-mgmt__icon-wrap {
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

.data-mgmt__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.data-mgmt__label {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.data-mgmt__desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

/* About modal */
.modal-sheet--about {
  text-align: center;
}

.about-logo-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 24px;
  font-weight: var(--font-weight-extrabold);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.about-title {
  font-size: 26px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0 0 2px;
  letter-spacing: 2px;
}

.about-subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  letter-spacing: 1px;
  margin: 0 0 20px;
}

.about-version {
  font-size: var(--font-secondary);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 4px;
}

.about-desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
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
