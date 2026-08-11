<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useTimeStore } from '@/stores/time'
import { useDiaryStore } from '@/stores/diary'
import { useWorkStore } from '@/stores/work'
import { useMemoryStore } from '@/stores/memory'
import { useStudentStore } from '@/stores/student'
import { useJourneyStore } from '@/stores/journey'
import { supabase } from '@/services/supabase'
import { AppCard, AppAvatar, AppIcon } from '@/components/ui'
import ExportDataModal from '@/components/settings/ExportDataModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const timeStore = useTimeStore()
const diaryStore = useDiaryStore()
const workStore = useWorkStore()
const memoryStore = useMemoryStore()
const studentStore = useStudentStore()
const journeyStore = useJourneyStore()

// ====== Data loading ======
const ready = ref(false)

onMounted(async () => {
  const tasks = [
    timeStore.profile ? Promise.resolve() : timeStore.loadTimeProfile(),
    diaryStore.diaries.length ? Promise.resolve() : diaryStore.loadDiaries(),
    workStore.works.length ? Promise.resolve() : workStore.loadWorks(),
    memoryStore.memories.length ? Promise.resolve() : memoryStore.loadMemories(),
    studentStore.students.length ? Promise.resolve() : studentStore.loadStudents(),
  ]
  await Promise.allSettled(tasks)
  // 旅程节点依赖旅程起止日期，需在 profile 加载后再拉取
  if (journeyStore.milestones.length === 0) {
    await journeyStore.loadMilestones(timeStore.profile?.start_date, timeStore.profile?.end_date)
  }
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

// ====== Profile hero card (按 我的1.3.html 原型) ======
const projectName = computed(() => timeStore.profile?.project_name || '')
const heroLocation = computed(() => timeStore.profile?.location || '')
/** 姓名下方的支教团信息：项目名 · 位置 */
const heroSub = computed(() => {
  if (projectName.value && heroLocation.value) return `${projectName.value} · ${heroLocation.value}`
  return projectName.value || heroLocation.value
})
/** 服务学校 / 教学科目（数据库新增列后填充，未设置显示提示） */
const heroSchool = computed(() => authStore.profile.school || '待设置')
const heroSubject = computed(() => authStore.profile.subject || '待设置')

// ====== 时间胶囊（按 我的1.3.html 原型：支教第X天 / 已经过X月 / 剩余X天） ======
/** 已经过的整月数（按天折算，约 30.44 天/月） */
const monthsPassed = computed(() => {
  if (!timeStore.profile?.start_date) return 0
  return Math.floor(timeStore.daysPassed / 30.44)
})

/** 时间胶囊底部三行：出发 / 陪伴中 / 告别 */
const capsuleDates = computed(() => {
  const s = timeStore.profile?.start_date
  const e = timeStore.profile?.end_date
  if (!s || !e) return { start: '', end: '' }
  const fmt = (d: string) => `${d.substring(0, 4)}.${d.substring(5, 7)}`
  return { start: fmt(s), end: fmt(e) }
})

/** 阶段徽标：按「一年旅程」时间节点匹配今天日期（开始日期 ≤ 今天的最后一个节点） */
const currentJourneyStage = computed(() => {
  const ms = journeyStore.milestones
  if (ms.length === 0) return timeStore.phase // 未配置一年旅程时回退到自动阶段
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sorted = [...ms].sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))
  let current = sorted[0]
  for (const m of sorted) {
    if (m.start_date) {
      const d = new Date(m.start_date + 'T00:00:00')
      if (d <= today) current = m
      else break
    }
  }
  return current.label
})

// ====== Stats（按 我的1.3.html 原型：4 个数据勋章） ======
const statCards = computed(() => [
  { key: 'diary',    label: '篇藏东日记', sub: 'Diary',    value: diaryStore.diaries.length,    icon: 'book',   iconColor: 'var(--color-primary)',           card: 'stat-card--diary' },
  { key: 'work',     label: '个工作记录', sub: 'Works',    value: workStore.works.length,       icon: 'grid',   iconColor: 'var(--color-sky)',             card: 'stat-card--work' },
  { key: 'memory',   label: '次时光记录', sub: 'Events',   value: memoryStore.memories.length,  icon: 'photo',  iconColor: 'var(--color-gold)',           card: 'stat-card--memory' },
  { key: 'student',  label: '名支教学生', sub: 'Students', value: studentStore.students.length, icon: 'star',   iconColor: 'var(--color-text-secondary)', card: 'stat-card--student' },
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
const showExportModal = ref(false)

// ====== 版本检查（当前为本地离线检查，预留未来接入真实版本服务） ======
const APP_VERSION = '5.1.5'
const showUpdateCheck = ref(false)

function openUpdateCheck() {
  showUpdateCheck.value = true
}

// ====== Menu groups ======
interface MenuItem { id: string; label: string; icon: string; route?: string; action?: () => void; desc?: string }

/** 常用功能（单列卡片，放右侧下方） */
const groupFeatures: MenuItem[] = [
  { id: 'mood',   label: '今日心情', icon: 'smile',  route: '/mood',                desc: '记录此刻心情' },
  { id: 'search', label: '全局搜索', icon: 'search', route: '/search',              desc: '搜索全部记录' },
  { id: 'memory', label: '大事记',   icon: 'star',   route: '/memory',              desc: '记忆时间轴' },
  { id: 'stats',  label: '年度统计', icon: 'chart',  route: '/statistics',          desc: '数据统计' },
]

/** 系统管理（单列卡片，放左侧关于卡片下方） */
const groupSystem: MenuItem[] = [
  { id: 'theme',   label: '深色模式', icon: 'moon',   action: toggleDarkMode, desc: darkMode.value ? '已开启' : '已关闭' },
  { id: 'data',    label: '数据管理', icon: 'upload', action: () => { showDataMgmt.value = true }, desc: '导入 / 导出全部数据' },
  { id: 'recycle', label: '回收站',   icon: 'trash',  route: '/settings/recycle-bin',              desc: '恢复已删除数据' },
]

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
          志愿者的数字时光归档 · 记录在昌都的每一天
        </p>
      </div>
    </div>

    <!-- ====== Desktop: 2-column | Mobile: single ====== -->
    <div class="profile__grid">
      <!-- ==========================================
           LEFT COLUMN
           ========================================== -->
      <div class="profile__left">
        <!-- Personal Hero Card (按 我的1.3.html 原型) -->
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
            <!-- 顶部状态标签区（按原型留白占位） -->
            <div class="profile-hero__top" />

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

        <!-- ==========================================
             系统管理（左侧，单列卡片，标题在卡内）
             ========================================== -->
        <div class="profile__menu-card profile__menu-card--push">
          <h2 class="profile__menu-card-title">
            系统管理
          </h2>
          <button
            v-for="item in groupSystem"
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
        </div>

        <!-- About / 昌都记忆品牌卡片 (按 我的1.3.html 原型) -->
        <div class="profile__about-card">
          <img class="profile__about-logo" src="/icon-180.png" alt="昌都记忆" />
          <div class="profile__about-info">
            <h3 class="profile__about-name">
              Changdu Memory
            </h3>
            <p class="profile__about-desc">
              记录 2026 昌都支教岁月 · 志愿者的数字时光档案
            </p>
          </div>
          <div class="profile__about-foot">
            <span class="profile__about-version">当前版本 v{{ APP_VERSION }}</span>
            <span
              class="profile__about-update"
              role="button"
              tabindex="0"
              @click="openUpdateCheck"
            >检查更新</span>
          </div>
        </div>
      </div>

      <!-- ==========================================
           RIGHT COLUMN
           ========================================== -->
      <div class="profile__right">
        <!-- Time capsule (按 我的1.3.html 原型：支教第X天 / 已经过X月 / 剩余X天) -->
        <template v-if="hasTimeProfile">
          <div class="profile__time-capsule">
            <div class="time-capsule__head">
              <span class="time-capsule__head-label">支教时光</span>
              <span class="time-capsule__phase">{{ currentJourneyStage }}</span>
            </div>

            <div class="time-capsule__grid">
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-label">支教第</span>
                <span class="time-capsule__stat-num time-capsule__stat-num--primary">{{ timeStore.daysPassed }}</span>
                <span class="time-capsule__stat-sub">天</span>
              </div>
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-label">已经过</span>
                <span class="time-capsule__stat-num">{{ monthsPassed }}</span>
                <span class="time-capsule__stat-sub">个月</span>
              </div>
              <div class="time-capsule__stat">
                <span class="time-capsule__stat-label">剩余</span>
                <span class="time-capsule__stat-num time-capsule__stat-num--gold">{{ timeStore.daysRemaining }}</span>
                <span class="time-capsule__stat-sub">天返程</span>
              </div>
            </div>

            <!-- 柔和进度条 -->
            <div class="time-capsule__progress">
              <div class="time-capsule__progress-track">
                <div
                  class="time-capsule__progress-fill"
                  :style="{ width: timeStore.progress + '%' }"
                />
              </div>
            </div>

            <div class="time-capsule__dates">
              <span>{{ capsuleDates.start }} 出发</span>
              <span>昌都三高 陪伴中</span>
              <span>{{ capsuleDates.end }} 告别</span>
            </div>
          </div>
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

        <!-- Stats: 在昌都的印记 (按 我的1.3.html 原型：外层圆角卡片 + 4 个数据勋章) -->
        <AppCard class="profile__stats-card">
          <div class="profile__stats-head">
            <h2 class="profile__stats-title">
              在昌都的印记
            </h2>
            <span class="profile__stats-sub">数字档案汇总</span>
          </div>

          <div class="profile__stats-grid">
            <div
              v-for="stat in statCards"
              :key="stat.key"
              class="profile__stat-card"
              :class="stat.card"
            >
              <div class="profile__stat-head" :style="{ color: stat.iconColor }">
                <AppIcon :name="stat.icon" size="16" />
                <span class="profile__stat-sub">{{ stat.sub }}</span>
              </div>
              <span class="profile__stat-value">{{ ready ? stat.value : '—' }}</span>
              <span class="profile__stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </AppCard>

        <!-- ==========================================
             常用功能（右侧下方，单列卡片，标题在卡内）
             ========================================== -->
        <div class="profile__menu-card">
          <h2 class="profile__menu-card-title">
            常用功能
          </h2>
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

              <!-- 退出登录（从「我的」页移入账号管理弹窗底部） -->
              <div class="modal-logout">
                <button class="modal-btn modal-btn--logout" @click="handleLogout">
                  <AppIcon name="logout" size="14" /> 退出登录
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
              <button class="data-mgmt__btn" @click="showExportModal = true">
                <div class="data-mgmt__icon-wrap">
                  <AppIcon name="download" size="22" />
                </div>
                <div class="data-mgmt__info">
                  <span class="data-mgmt__label">导出数据</span>
                  <span class="data-mgmt__desc">导出所有数据 / 账本 Excel</span>
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

      <!-- 检查更新弹窗 -->
      <Transition name="modal">
        <div v-if="showUpdateCheck" class="modal-overlay" @click.self="showUpdateCheck = false">
          <div class="modal-sheet modal-sheet--update">
            <div class="update-check">
              <div class="update-check__badge">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                ><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 class="update-check__title">
                已是最新版本
              </h3>
              <p class="update-check__version">
                当前版本 V{{ APP_VERSION }}
              </p>
              <p class="update-check__desc">
                您的“昌都记忆”已经是最新版本，<br />
                暂时不需要更新。
              </p>
              <button class="update-check__btn" @click="showUpdateCheck = false">
                好的
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 导出数据子弹窗（组件自带 Teleport，放外层 Teleport 之外） -->
    <ExportDataModal v-model:show="showExportModal" />
  </div>
</template>

<style scoped>
/* ================================================
   Profile — v5.1.5
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
    /* 左侧含个人卡片+系统管理+关于，右侧含时间胶囊+印记+常用功能，4/8 保持均衡；
       默认 stretch 让左右两列等高，右侧卡片 flex-grow 使「常用功能」底部与左侧「关于」底部对齐 */
    grid-template-columns: 4fr 8fr;
    align-items: stretch;
  }
}

/* ==========================================
   Mobile reorder — 仅移动端卡片顺序重排（PC 端保持不变）
   移动端顺序：Hero → 支教时光 → 在昌都的印记 → 常用功能 → 系统管理 → 品牌卡片
   通过 display:contents 把左右两列的子卡片提升为 grid item，再用 order 排序
   ========================================== */
@media (max-width: 1023px) {
  .profile__left,
  .profile__right {
    display: contents;
  }

  .profile-hero { order: 1; }
  .profile__time-capsule { order: 2; }
  .profile__stats-card { order: 3; }
  .profile__menu-card:not(.profile__menu-card--push) { order: 4; }
  .profile__menu-card.profile__menu-card--push { order: 5; }
  .profile__about-card { order: 6; }

  /* 取消桌面端 flex 对齐用属性，间距统一交给 grid gap */
  .profile__menu-card.profile__menu-card--push { margin-top: 0; }
  .profile__time-capsule,
  .profile__stats-card {
    flex-grow: 0;
    margin-bottom: 0;
  }
}

.profile__section {
  margin-bottom: var(--spacing-2xl);
}

/* ==========================================
   Menu cards — 功能分组圆角卡片（标题在卡内，单列）
   常用功能：右侧下方 | 系统管理：左侧关于卡片下方
   ========================================== */
.profile__menu-card {
  background: var(--glass-bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card, 24px);
  box-shadow: var(--shadow-card, 0 10px 30px -8px rgba(16, 24, 32, 0.04));
  overflow: hidden;
}

.profile__menu-card-title {
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  padding: 20px 24px 4px;
}

.profile__menu-card + .profile__menu-card {
  margin-top: var(--spacing-2xl);
}

/* 需要靠底对齐的菜单卡片（左侧「系统管理」）：左侧列被拉伸时吸附到底部 */
.profile__menu-card--push {
  margin-top: auto;
}

/* ==========================================
   LEFT — Personal Hero Card
   ========================================== */
.profile__left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ==========================================
   RIGHT — 纵向 flex，中间卡片 grow 使底部对齐
   ========================================== */
.profile__right {
  display: flex;
  flex-direction: column;
}

.profile-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-card, 24px);
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
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 768px) {
  .profile-hero__content {
    padding: 32px;
  }
}

/* ---- 顶部状态标签区（按原型留白占位） ---- */
.profile-hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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

/* 关于 / 昌都记忆品牌卡片 (按 我的1.3.html 原型：居中布局) */
.profile__about-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px;
  border-radius: var(--radius-card, 24px);
  background: var(--glass-bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-card, 0 10px 30px -8px rgba(16, 24, 32, 0.04));
  text-align: center;
}

.profile__about-logo {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: block;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.profile__about-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile__about-name {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.profile__about-desc {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.profile__about-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: 14px;
  border-top: 1px solid var(--color-border-light);
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.profile__about-version {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-semibold);
}

.profile__about-update {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

@media (hover: hover) {
  .profile__about-update:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
}

/* ==========================================
   RIGHT — Time capsule
   ========================================== */
.profile__time-capsule {
  flex-grow: 1;
  margin-bottom: var(--spacing-2xl);
  padding: 24px;
  border-radius: var(--radius-card, 24px);
  /* 与「在昌都的印记」(AppCard) 保持一致的毛玻璃背景，浅色白 / 深色自适应 */
  background: var(--glass-bg-card, rgba(255, 255, 255, 0.85));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.75));
  box-shadow: var(--shadow-card, 0 10px 30px -8px rgba(16, 24, 32, 0.04));
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
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
}

.time-capsule__phase {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(75, 143, 140, 0.12);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-family: inherit;
  flex-shrink: 0;
}

.time-capsule__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.time-capsule__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 4px;
  border-radius: 16px;
  background: var(--color-bg-white);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 1px 2px rgba(16, 24, 32, 0.03);
}

.time-capsule__stat-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.time-capsule__stat-num {
  font-size: 26px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.time-capsule__stat-num--primary {
  color: var(--color-primary);
}

.time-capsule__stat-num--gold {
  color: var(--color-gold);
}

.time-capsule__stat-sub {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.time-capsule__progress {
  margin-bottom: 10px;
  padding: 2px;
}

.time-capsule__progress-track {
  height: 10px;
  background: var(--color-border-light);
  border-radius: 999px;
  overflow: hidden;
}

.time-capsule__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-sky), var(--color-gold));
  border-radius: 999px;
  transition: width 800ms ease;
}

.time-capsule__dates {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--color-text-tertiary);
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

@media (hover: hover) {
  .time-capsule__empty-btn:hover {
    background: var(--color-primary-dark);
  }
}

/* ==========================================
   Stats card (按 我的1.3.html 原型：外层圆角卡片 + 4 个数据勋章)
   ========================================== */
.profile__stats-card {
  flex-grow: 1;
  margin-bottom: var(--spacing-2xl);
  /* AppCard 提供毛玻璃背景 + 24px 圆角 */
}

.profile__stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.profile__stats-title {
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.profile__stats-sub {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.profile__stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 640px) {
  .profile__stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.profile__stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--color-border-light);
}

.profile__stat-card--diary   { background: rgba(240, 253, 250, 0.55); border-color: rgba(75, 143, 140, 0.25); }
.profile__stat-card--work    { background: rgba(240, 249, 255, 0.55); border-color: rgba(111, 168, 220, 0.3); }
.profile__stat-card--memory  { background: rgba(255, 251, 235, 0.55); border-color: rgba(214, 168, 79, 0.3); }
.profile__stat-card--student { background: rgba(241, 245, 249, 0.6);  border-color: rgba(107, 123, 141, 0.25); }

.profile__stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.profile__stat-sub {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: inherit;
}

.profile__stat-value {
  font-size: 38px;
  line-height: 1.1;
  font-weight: 800;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.profile__stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
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

/* 触摸按压反馈：按下时高亮，松开自动结束 */
.profile__menu-row:active {
  background: var(--color-bg);
}

/* 仅支持 hover 的设备（鼠标）才应用 hover，避免移动端点击后背景残留 */
@media (hover: hover) {
  .profile__menu-row:hover {
    background: var(--color-bg);
  }
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

@media (hover: hover) {
  .modal-btn--cancel:hover {
    background: var(--color-border-light);
  }
}

.modal-btn--save {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
}

@media (hover: hover) {
  .modal-btn--save:hover {
    background: var(--color-primary-dark);
  }
}

.modal-btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 退出登录按钮（账号管理弹窗底部） */
.modal-logout {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  margin-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.modal-btn--logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 32px;
  border: none;
  border-radius: var(--radius-button);
  background: rgba(194, 103, 106, 0.08);
  color: var(--color-error);
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

@media (hover: hover) {
  .modal-btn--logout:hover {
    background: var(--color-error);
    color: #fff;
  }
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

@media (hover: hover) {
  .modal-avatar-btn:hover { opacity: 0.8; }
}
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

@media (hover: hover) {
  .data-mgmt__btn:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
  }
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

/* ==========================================
   检查更新弹窗
   ========================================== */
.modal-sheet--update {
  max-width: 360px;
  text-align: center;
}

.update-check {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.update-check__badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-sky));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  margin-bottom: 16px;
  animation: fade-in var(--transition-normal);
}

.update-check__title {
  font-size: var(--font-card-title, 18px);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.update-check__version {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: 0 0 12px;
}

.update-check__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin: 0 0 22px;
}

.update-check__btn {
  padding: 10px 48px;
  border: none;
  border-radius: var(--radius-button);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-content);
  font-family: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (hover: hover) {
  .update-check__btn:hover {
    background: var(--color-primary-dark);
  }
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
