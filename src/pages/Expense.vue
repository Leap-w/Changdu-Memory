<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpenseStore } from '@/stores/expense'
import { useAssetStore } from '@/stores/asset'
import { useWelfareStore } from '@/stores/welfare'
import ExpenseCard from '@/components/expense/ExpenseCard.vue'
import { AppCard, AppPillTabs, AppIcon } from '@/components/ui'

const router = useRouter()
const expenseStore = useExpenseStore()
const assetStore = useAssetStore()
const welfareStore = useWelfareStore()
const ready = ref(false)

const activeTab = ref('支出')

onMounted(async () => {
  const jobs = [
    () => expenseStore.loadExpenses(),
    () => assetStore.loadAssets(),
    () => welfareStore.loadItems(),
  ]
  await Promise.allSettled(jobs.map((j) => j()))
  ready.value = true
})

// ==========================================
// Wallet Hero
// ==========================================
const heroAmount = computed(() => {
  if (activeTab.value === '支出') return expenseStore.monthlyExpenseTotal
  if (activeTab.value === '收入') return expenseStore.monthlyIncomeTotal
  if (activeTab.value === '资产') return assetStore.totalAssets
  if (activeTab.value === '福利') return welfareStore.totalValue
  return 0
})

const heroLabel = computed(() => {
  const m = expenseStore.currentMonth
  const [y, mo] = m.split('-')
  const label = `${y}年${parseInt(mo)}月`
  if (activeTab.value === '支出') return `${label} · 生活支出`
  if (activeTab.value === '收入') return `${label} · 生活补贴`
  if (activeTab.value === '资产') return '我的物品合计'
  if (activeTab.value === '福利') return '温情物资估值'
  return ''
})

const heroCount = computed(() => {
  if (activeTab.value === '支出') return expenseStore.expenseList.length
  if (activeTab.value === '收入') return expenseStore.incomeList.length
  if (activeTab.value === '资产') return assetStore.assets.length
  if (activeTab.value === '福利') return welfareStore.items.length
  return 0
})

const heroCountLabel = computed(() => {
  if (activeTab.value === '支出' || activeTab.value === '收入') return '笔记录'
  if (activeTab.value === '资产') return '件物品'
  if (activeTab.value === '福利') return '条温情'
  return ''
})

// Category breakdown (支出 tab only, current month)
const categoryBreakdown = computed(() => {
  if (activeTab.value !== '支出') return []
  const month = expenseStore.currentMonth
  const catMap = new Map<string, number>()
  for (const e of expenseStore.expenseList) {
    if (e.expense_date.startsWith(month)) {
      catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount))
    }
  }
  return Array.from(catMap.entries())
    .map(([cat, total]) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
})

// ==========================================
// Category helpers
// ==========================================
const categoryLabels: Record<string, string> = {
  food: '餐饮', transport: '交通', shopping: '购物', accommodation: '住宿',
  study: '学习', entertainment: '娱乐', medical: '医疗', other: '其他',
  salary: '工资', subsidy: '补贴', bonus: '奖金', part_time: '兼职',
}

// Asset / Welfare icon helpers
const assetIcons: Record<string, string> = {
  现金: 'wallet', 银行卡: 'wallet', 微信: 'check', 支付宝: 'wallet', 其他: 'grid',
}

const assetIconColors: Record<string, string> = {
  现金: 'var(--color-gold)', 银行卡: 'var(--color-primary)', 微信: 'var(--color-secondary)', 支付宝: 'var(--color-sky)', 其他: 'var(--color-text-tertiary)',
}

const welfareIcons: Record<string, string> = {
  school_welfare: 'gift', material: 'gift', coupon: 'gift', gift: 'gift', other: 'gift',
}

const welfareLabels: Record<string, string> = {
  school_welfare: '学校福利', material: '物资补助', coupon: '优惠券', gift: '礼品', other: '其他',
}

// ==========================================
// Navigation
// ==========================================
function goCreate() {
  if (activeTab.value === '资产') { openAddAsset(); return }
  if (activeTab.value === '福利') { openAddWelfare(); return }
  router.push('/expense/new')
}
function goEdit(id: string) { router.push(`/expense/${id}/edit`) }

function formatDate(ds: string) {
  const d = new Date(ds + 'T00:00:00')
  const dd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${dd[d.getDay()]}`
}

// ==========================================
// Modals: Asset
// ==========================================
const showAssetModal = ref(false)
const editingAssetId = ref('')
const assetForm = ref({ name: '现金', amount: '' })

function openAddAsset() {
  editingAssetId.value = ''
  assetForm.value = { name: '现金', amount: '' }
  showAssetModal.value = true
}

function openEditAsset(id: string, a: { name: string; amount: number }) {
  editingAssetId.value = id
  assetForm.value = { name: a.name, amount: String(a.amount) }
  showAssetModal.value = true
}

async function handleAssetSave() {
  const amt = parseFloat(assetForm.value.amount)
  if (!amt || amt < 0) return
  if (editingAssetId.value) {
    await assetStore.editAsset(editingAssetId.value, { name: assetForm.value.name, amount: amt })
  } else {
    await assetStore.addAsset({ name: assetForm.value.name, amount: amt })
  }
  showAssetModal.value = false
}

// ==========================================
// Modals: Welfare
// ==========================================
const showWelfareModal = ref(false)
const editingWelfareId = ref('')
const welfareForm = ref({
  title: '', category: 'material', description: '',
  value_estimate: '', received_date: new Date().toISOString().split('T')[0],
})

function openAddWelfare() {
  editingWelfareId.value = ''
  welfareForm.value = {
    title: '', category: 'material', description: '',
    value_estimate: '', received_date: new Date().toISOString().split('T')[0],
  }
  showWelfareModal.value = true
}

async function handleWelfareSave() {
  if (!welfareForm.value.title.trim()) return
  const ve = parseFloat(welfareForm.value.value_estimate) || 0
  if (editingWelfareId.value) {
    await welfareStore.editItem(editingWelfareId.value, { ...welfareForm.value, value_estimate: ve })
  } else {
    await welfareStore.addItem({ ...welfareForm.value, value_estimate: ve })
  }
  showWelfareModal.value = false
}
</script>

<template>
  <div class="expense-page">
    <!-- ====== Page header ====== -->
    <div class="expense-page__header">
      <div class="expense-page__header-left">
        <h1 class="expense-page__title">
          账本
        </h1>
        <p class="expense-page__subtitle">
          烟火与物件档案
        </p>
      </div>
      <AppPillTabs
        :options="[
          { value: '支出', label: '支出' },
          { value: '收入', label: '收入' },
          { value: '资产', label: '资产' },
          { value: '福利', label: '福利' },
        ]"
        :model-value="activeTab"
        class="expense-page__pills"
        @update:model-value="(v: string) => activeTab = v"
      />
    </div>

    <!-- ====== Wallet Hero ====== -->
    <div class="wallet-hero">
      <div class="wallet-hero__bg" />
      <div class="wallet-hero__glow" />
      <div class="wallet-hero__content">
        <div class="wallet-hero__head">
          <span>{{ heroLabel }}</span>
          <span class="wallet-hero__count">{{ heroCount }} {{ heroCountLabel }}</span>
        </div>
        <div class="wallet-hero__amount">
          <span class="wallet-hero__symbol">¥</span>
          <span class="wallet-hero__num">{{ heroAmount.toFixed(2) }}</span>
        </div>

        <!-- Category mini breakdown (支出 only) -->
        <div v-if="categoryBreakdown.length > 0" class="wallet-hero__cats">
          <div
            v-for="cat in categoryBreakdown"
            :key="cat.category"
            class="wallet-hero__cat"
          >
            <span class="wallet-hero__cat-label">{{ cat.label }}</span>
            <span class="wallet-hero__cat-amt">¥{{ cat.total.toFixed(0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 支出 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '支出'" class="expense-page__tab">
      <div v-if="ready && expenseStore.expenseList.length === 0" class="expense-empty">
        <div class="expense-empty__icon">
          <AppIcon name="wallet" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="expense-empty__text">
          还没有支出记录
        </p>
        <button class="expense-empty__btn" @click="goCreate()">
          <AppIcon name="plus" size="16" /> 记一笔支出
        </button>
      </div>
      <div
        v-for="g in expenseStore.groupedByDate"
        v-else
        :key="g.date"
        class="expense-group"
      >
        <div class="expense-group__head">
          <span class="expense-group__date">{{ formatDate(g.date) }}</span>
          <span class="expense-group__total">¥{{ g.total }}</span>
        </div>
        <div class="expense-group__list">
          <ExpenseCard
            v-for="e in g.items"
            :key="e.id"
            :expense="e"
            @click="goEdit"
          />
        </div>
      </div>

      <div v-if="expenseStore.expenseList.length > 0" class="expense-page__actions">
        <button class="expense-page__action-btn" @click="goCreate()">
          <AppIcon name="plus" size="16" /> 记一笔
        </button>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 收入 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '收入'" class="expense-page__tab">
      <div v-if="ready && expenseStore.incomeList.length === 0" class="expense-empty">
        <div class="expense-empty__icon">
          <AppIcon name="gift" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="expense-empty__text">
          还没有收入记录
        </p>
        <button class="expense-empty__btn" @click="goCreate()">
          <AppIcon name="plus" size="16" /> 记一笔收入
        </button>
      </div>
      <div
        v-for="g in expenseStore.incomeGroupedByDate"
        v-else
        :key="g.date"
        class="expense-group"
      >
        <div class="expense-group__head">
          <span class="expense-group__date">{{ formatDate(g.date) }}</span>
          <span class="expense-group__total expense-group__total--income">¥{{ g.total }}</span>
        </div>
        <div class="expense-group__list">
          <ExpenseCard
            v-for="e in g.items"
            :key="e.id"
            :expense="e"
            @click="goEdit"
          />
        </div>
      </div>

      <div v-if="expenseStore.incomeList.length > 0" class="expense-page__actions">
        <button class="expense-page__action-btn" @click="goCreate()">
          <AppIcon name="plus" size="16" /> 记一笔
        </button>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 资产 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '资产'" class="expense-page__tab">
      <div v-if="ready && assetStore.assets.length === 0" class="expense-empty">
        <div class="expense-empty__icon">
          <AppIcon name="wallet" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="expense-empty__text">
          还没有资产记录
        </p>
        <button class="expense-empty__btn" @click="openAddAsset()">
          <AppIcon name="plus" size="16" /> 添加资产
        </button>
      </div>
      <AppCard v-else no-padding>
        <div class="asset-total">
          <span class="asset-total__label">资产合计</span>
          <span class="asset-total__amt">¥{{ assetStore.totalAssets.toFixed(2) }}</span>
        </div>
        <div
          v-for="a in assetStore.assets"
          :key="a.id"
          class="asset-item"
          @click="openEditAsset(a.id, { name: a.name, amount: a.amount })"
        >
          <div
            class="asset-item__icon"
            :style="{ background: (assetIconColors[a.name] || 'var(--color-text-tertiary)') + '18', color: assetIconColors[a.name] || 'var(--color-text-tertiary)' }"
          >
            <AppIcon :name="assetIcons[a.name] || 'grid'" size="16" />
          </div>
          <span class="asset-item__name">{{ a.name }}</span>
          <span class="asset-item__amt">¥{{ Number(a.amount).toFixed(2) }}</span>
          <AppIcon name="chevron-right" size="14" class="asset-item__arrow" />
        </div>
      </AppCard>

      <div v-if="assetStore.assets.length > 0" class="expense-page__actions">
        <button class="expense-page__action-btn" @click="openAddAsset()">
          <AppIcon name="plus" size="16" /> 添加资产
        </button>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 福利 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '福利'" class="expense-page__tab">
      <div v-if="ready && welfareStore.items.length === 0" class="expense-empty">
        <div class="expense-empty__icon">
          <AppIcon name="gift" size="40" color="var(--color-text-tertiary)" />
        </div>
        <p class="expense-empty__text">
          还没有福利记录
        </p>
        <button class="expense-empty__btn" @click="openAddWelfare()">
          <AppIcon name="plus" size="16" /> 添加福利
        </button>
      </div>
      <div v-else>
        <div class="welfare-total">
          <span class="welfare-total__label">福利估值合计</span>
          <span class="welfare-total__amt">¥{{ welfareStore.totalValue.toFixed(2) }}</span>
        </div>
        <div class="welfare-list">
          <AppCard
            v-for="w in welfareStore.items"
            :key="w.id"
            padding="md"
            class="welfare-card"
          >
            <div class="welfare-card__inner">
              <div class="welfare-card__icon">
                <AppIcon :name="welfareIcons[w.category] || 'gift'" size="18" />
              </div>
              <div class="welfare-card__body">
                <div class="welfare-card__top">
                  <span class="welfare-card__title">{{ w.title }}</span>
                  <button
                    class="welfare-card__del"
                    title="删除"
                    @click.stop="welfareStore.removeItem(w.id)"
                  >
                    <AppIcon name="trash" size="13" />
                  </button>
                </div>
                <span class="welfare-card__meta">
                  {{ welfareLabels[w.category] || w.category }} · {{ w.received_date }}
                </span>
                <span v-if="w.description" class="welfare-card__desc">{{ w.description }}</span>
              </div>
              <span v-if="w.value_estimate" class="welfare-card__val">
                ¥{{ Number(w.value_estimate).toFixed(2) }}
              </span>
            </div>
          </AppCard>
        </div>
      </div>

      <div v-if="welfareStore.items.length > 0" class="expense-page__actions">
        <button class="expense-page__action-btn" @click="openAddWelfare()">
          <AppIcon name="plus" size="16" /> 添加福利
        </button>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- MODALS -->
    <!-- ======================================================== -->
    <Teleport to="body">
      <!-- Asset Modal -->
      <Transition name="modal">
        <div v-if="showAssetModal" class="modal-overlay" @click.self="showAssetModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">
              {{ editingAssetId ? '编辑资产' : '添加资产' }}
            </h3>
            <div class="modal-form">
              <select v-model="assetForm.name" class="modal-select">
                <option value="现金">
                  现金
                </option>
                <option value="银行卡">
                  银行卡
                </option>
                <option value="微信">
                  微信
                </option>
                <option value="支付宝">
                  支付宝
                </option>
                <option value="其他">
                  其他
                </option>
              </select>
              <input
                v-model="assetForm.amount"
                class="modal-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="金额"
              />
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showAssetModal = false">
                  取消
                </button>
                <button class="modal-btn modal-btn--save" @click="handleAssetSave">
                  保存
                </button>
                <button
                  v-if="editingAssetId"
                  class="modal-btn modal-btn--del"
                  @click="assetStore.removeAsset(editingAssetId); showAssetModal = false"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Welfare Modal -->
      <Transition name="modal">
        <div v-if="showWelfareModal" class="modal-overlay" @click.self="showWelfareModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">
              {{ editingWelfareId ? '编辑福利' : '添加福利' }}
            </h3>
            <div class="modal-form">
              <input
                v-model="welfareForm.title"
                class="modal-input"
                placeholder="名称"
              />
              <select v-model="welfareForm.category" class="modal-select">
                <option value="school_welfare">
                  学校福利
                </option>
                <option value="material">
                  物资补助
                </option>
                <option value="coupon">
                  优惠券
                </option>
                <option value="gift">
                  礼品
                </option>
                <option value="other">
                  其他
                </option>
              </select>
              <input
                v-model="welfareForm.value_estimate"
                class="modal-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="估值（¥）"
              />
              <input
                v-model="welfareForm.description"
                class="modal-input"
                placeholder="备注"
              />
              <input
                v-model="welfareForm.received_date"
                type="date"
                class="modal-input"
              />
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showWelfareModal = false">
                  取消
                </button>
                <button class="modal-btn modal-btn--save" @click="handleWelfareSave">
                  保存
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
   Expense Page — V5.5.2
   ================================================ */
.expense-page {
  max-width: 840px;
  margin: 0 auto;
}

/* ---- Header ---- */
.expense-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 14px;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.expense-page__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.expense-page__title {
  font-size: var(--font-page-title, 32px);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.expense-page__subtitle {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
  margin: 0;
}

.expense-page__pills {
  flex-shrink: 0;
}

/* ==========================================
   Wallet Hero
   ========================================== */
.wallet-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-2xl, 32px);
  margin-bottom: var(--spacing-xl);
}

.wallet-hero__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, #3B7572 50%, var(--color-sky) 100%);
  z-index: 0;
}

.wallet-hero__glow {
  position: absolute;
  top: -30%;
  right: -10%;
  width: 50%;
  height: 80%;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  z-index: 1;
}

.wallet-hero__content {
  position: relative;
  z-index: 2;
  padding: 24px 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #fff;
}

.wallet-hero__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-caption, 12px);
  opacity: 0.75;
  letter-spacing: 0.5px;
}

.wallet-hero__count {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.15);
  font-weight: var(--font-weight-medium);
}

.wallet-hero__amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.wallet-hero__symbol {
  font-size: 22px;
  font-weight: 300;
  opacity: 0.8;
}

.wallet-hero__num {
  font-size: 42px;
  font-weight: var(--font-weight-extrabold);
  line-height: 1;
  letter-spacing: -1px;
}

.wallet-hero__cats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.wallet-hero__cat {
  text-align: center;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wallet-hero__cat:not(:last-child) {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.wallet-hero__cat-label {
  font-size: 11px;
  opacity: 0.7;
}

.wallet-hero__cat-amt {
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-bold);
}

/* ---- Tab ---- */
.expense-page__tab {
  min-height: 200px;
}

/* ---- Groups ---- */
.expense-group {
  margin-bottom: var(--spacing-xl);
}

.expense-group__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 8px;
}

.expense-group__date {
  font-size: var(--font-secondary, 14px);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.expense-group__total {
  font-size: var(--font-caption, 12px);
  color: var(--color-text-tertiary);
}

.expense-group__total--income {
  color: var(--color-secondary);
  font-weight: var(--font-weight-semibold);
}

.expense-group__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ---- Action button row ---- */
.expense-page__actions {
  margin-top: var(--spacing-lg);
}

.expense-page__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-family: inherit;
  font-size: var(--font-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.expense-page__action-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* ---- Empty ---- */
.expense-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 64px 20px;
  text-align: center;
}

.expense-empty__icon {
  opacity: 0.3;
  margin-bottom: 4px;
}

.expense-empty__text {
  font-size: var(--font-content, 16px);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0;
}

.expense-empty__btn {
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
  transition: background var(--transition-fast);
}

.expense-empty__btn:hover {
  background: var(--color-primary-dark);
}

/* ==========================================
   Assets
   ========================================== */
.asset-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: var(--color-primary-bg);
  border-bottom: 1px solid var(--color-border-light);
}

.asset-total__label {
  font-size: var(--font-secondary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.asset-total__amt {
  font-size: 20px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-primary);
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--color-border-light);
}

.asset-item:last-child {
  border-bottom: none;
}

.asset-item:hover {
  background: var(--color-bg);
}

.asset-item__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.asset-item__name {
  flex: 1;
  font-size: var(--font-content);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.asset-item__amt {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.asset-item__arrow {
  color: var(--color-text-tertiary);
  opacity: 0.3;
  flex-shrink: 0;
}

/* ==========================================
   Welfare
   ========================================== */
.welfare-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: var(--spacing-md);
  border-radius: var(--radius-xl);
  background: rgba(214, 168, 79, 0.08);
}

.welfare-total__label {
  font-size: var(--font-secondary);
  color: var(--color-gold);
  font-weight: var(--font-weight-semibold);
}

.welfare-total__amt {
  font-size: 20px;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-gold);
}

.welfare-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.welfare-card__inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.welfare-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(214, 168, 79, 0.1);
  color: var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.welfare-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.welfare-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.welfare-card__title {
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1;
}

.welfare-card__meta {
  font-size: var(--font-caption);
  color: var(--color-text-tertiary);
}

.welfare-card__desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: var(--leading-relaxed);
}

.welfare-card__val {
  font-size: var(--font-content);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.welfare-card__del {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.welfare-card:hover .welfare-card__del {
  opacity: 1;
}

.welfare-card__del:hover {
  color: var(--color-error);
  background: rgba(194, 103, 106, 0.08);
}

/* ==========================================
   Modals
   ========================================== */
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

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-input {
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  outline: none;
  background: var(--color-bg);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.modal-input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.modal-select {
  padding: 11px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  outline: none;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.modal-select:focus {
  border-color: var(--color-primary);
}

.modal-form__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
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

.modal-btn--cancel:hover {
  background: var(--color-border-light);
}

.modal-btn--save {
  background: var(--color-primary);
  color: #fff;
}

.modal-btn--save:hover {
  background: var(--color-primary-dark);
}

.modal-btn--del {
  background: transparent;
  color: var(--color-error);
}

.modal-btn--del:hover {
  background: rgba(194, 103, 106, 0.06);
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

  .wallet-hero__content {
    padding: 32px 32px 28px;
  }

  .wallet-hero__num {
    font-size: 48px;
  }
}

@media (max-width: 500px) {
  .expense-page__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .wallet-hero__content {
    padding: 20px 18px 18px;
  }

  .wallet-hero__num {
    font-size: 36px;
  }
}
</style>
