<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpenseStore } from '@/stores/expense'
import { useAssetStore } from '@/stores/asset'
import { useWelfareStore } from '@/stores/welfare'
import ExpenseCard from '@/components/expense/ExpenseCard.vue'

const router = useRouter()
const expenseStore = useExpenseStore()
const assetStore = useAssetStore()
const welfareStore = useWelfareStore()
const ready = ref(false)

const tabs = ['支出', '收入', '资产', '福利'] as const
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
// Helpers
// ==========================================
function goCreate(_type: string) { router.push('/expense/new') }
function goEdit(id: string) { router.push(`/expense/${id}/edit`) }

function formatDate(ds: string) {
  const d = new Date(ds + 'T00:00:00')
  const dd = ['周日','周一','周二','周三','周四','周五','周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${dd[d.getDay()]}`
}

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return `${y}年${parseInt(mo)}月`
}

// Asset / Welfare labels
const assetIcons: Record<string, string> = { '现金':'💵','银行卡':'💳','微信':'💚','支付宝':'💙','其他':'💎' }
const welfareLabels: Record<string, string> = {
  school_welfare:'学校福利', material:'物资补助', coupon:'优惠券', gift:'礼品', other:'其他',
}
const welfareIcons: Record<string, string> = {
  school_welfare:'🏫', material:'📦', coupon:'🎫', gift:'🎁', other:'✨',
}

// ==========================================
// Modals
// ==========================================
const showAssetModal = ref(false)
const editingAssetId = ref('')
const assetForm = ref({ name: '现金', amount: '' })

function openAddAsset() { editingAssetId.value = ''; assetForm.value = { name: '现金', amount: '' }; showAssetModal.value = true }
function openEditAsset(id: string, a: { name: string; amount: number }) {
  editingAssetId.value = id; assetForm.value = { name: a.name, amount: String(a.amount) }; showAssetModal.value = true
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

const showWelfareModal = ref(false)
const editingWelfareId = ref('')
const welfareForm = ref({ title: '', category: 'material', description: '', value_estimate: '', received_date: new Date().toISOString().split('T')[0] })

function openAddWelfare() { editingWelfareId.value = ''; welfareForm.value = { title: '', category: 'material', description: '', value_estimate: '', received_date: new Date().toISOString().split('T')[0] }; showWelfareModal.value = true }
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
  <div class="lp">
    <!-- Header -->
    <h1 class="lp__title">账本</h1>

    <!-- === Summary Cards === -->
    <div class="lp__summary">
      <div class="lp__sum-card">
        <span class="lp__sum-label">今日支出</span>
        <span class="lp__sum-val">¥{{ expenseStore.todayExpenseTotal }}</span>
      </div>
      <div class="lp__sum-card lp__sum-card--month">
        <span class="lp__sum-label">{{ formatMonth(expenseStore.currentMonth) }}支出</span>
        <span class="lp__sum-val">¥{{ expenseStore.monthlyExpenseTotal }}</span>
      </div>
      <div class="lp__sum-card lp__sum-card--asset">
        <span class="lp__sum-label">总资产</span>
        <span class="lp__sum-val">¥{{ assetStore.totalAssets }}</span>
      </div>
    </div>

    <!-- === Tabs === -->
    <div class="lp__tabs">
      <button v-for="t in tabs" :key="t" class="lp__tab-btn" :class="{ active: activeTab === t }" @click="activeTab = t">{{ t }}</button>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 支出 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '支出'" class="lp__tab">
      <div v-if="ready && expenseStore.expenseList.length === 0" class="lp__empty">
        <p>还没有支出记录</p>
        <button @click="goCreate('expense')">记一笔支出</button>
      </div>
      <div v-else v-for="g in expenseStore.groupedByDate" :key="g.date" class="lp__group">
        <div class="lp__g-head">
          <span class="lp__g-date">{{ formatDate(g.date) }}</span>
          <span class="lp__g-sub">支出 ¥{{ g.total }}</span>
        </div>
        <div class="lp__g-list">
          <ExpenseCard v-for="e in g.items" :key="e.id" :expense="e" @click="goEdit" />
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 收入 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '收入'" class="lp__tab">
      <div v-if="ready && expenseStore.incomeList.length === 0" class="lp__empty">
        <p>还没有收入记录</p>
        <button @click="goCreate('income')">记一笔收入</button>
      </div>
      <div v-else v-for="g in expenseStore.incomeGroupedByDate" :key="g.date" class="lp__group">
        <div class="lp__g-head">
          <span class="lp__g-date">{{ formatDate(g.date) }}</span>
          <span class="lp__g-sub lp__g-sub--in">收入 ¥{{ g.total }}</span>
        </div>
        <div class="lp__g-list">
          <ExpenseCard v-for="e in g.items" :key="e.id" :expense="e" @click="goEdit" />
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 资产 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '资产'" class="lp__tab">
      <div v-if="ready && assetStore.assets.length === 0" class="lp__empty">
        <p>还没有资产记录</p>
        <button @click="openAddAsset()">添加资产</button>
      </div>
      <div v-else class="lp__asset-list">
        <div v-for="a in assetStore.assets" :key="a.id" class="lp__asset-item" @click="openEditAsset(a.id, { name: a.name, amount: a.amount })">
          <span class="lp__asset-icon">{{ assetIcons[a.name] || '💎' }}</span>
          <span class="lp__asset-name">{{ a.name }}</span>
          <span class="lp__asset-amt">¥{{ Number(a.amount).toFixed(2) }}</span>
        </div>
        <div class="lp__asset-total">
          <span>资产合计</span>
          <span class="lp__asset-total-amt">¥{{ assetStore.totalAssets }}</span>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB: 福利 -->
    <!-- ======================================================== -->
    <div v-if="activeTab === '福利'" class="lp__tab">
      <div v-if="ready && welfareStore.items.length === 0" class="lp__empty">
        <p>还没有福利记录</p>
        <button @click="openAddWelfare()">添加福利</button>
      </div>
      <div v-else class="lp__welfare-list">
        <div v-for="w in welfareStore.items" :key="w.id" class="lp__welfare-item">
          <span class="lp__welfare-icon">{{ welfareIcons[w.category] || '✨' }}</span>
          <div class="lp__welfare-body">
            <span class="lp__welfare-title">{{ w.title }}</span>
            <span class="lp__welfare-meta">{{ welfareLabels[w.category] }} · {{ w.received_date }}</span>
            <span v-if="w.description" class="lp__welfare-desc">{{ w.description }}</span>
          </div>
          <span v-if="w.value_estimate" class="lp__welfare-val">¥{{ Number(w.value_estimate).toFixed(2) }}</span>
          <button class="lp__welfare-del" @click.stop="welfareStore.removeItem(w.id)">×</button>
        </div>
        <div class="lp__asset-total">
          <span>福利估值合计</span>
          <span class="lp__asset-total-amt">¥{{ welfareStore.totalValue }}</span>
        </div>
      </div>
    </div>

    <!-- === FAB === -->
    <div class="lp__fab">
      <button v-if="activeTab === '支出' || activeTab === '收入'" @click="goCreate(activeTab === '收入' ? 'income' : 'expense')">
        + 记一笔
      </button>
      <button v-else-if="activeTab === '资产'" @click="openAddAsset()">+ 添加资产</button>
      <button v-else-if="activeTab === '福利'" @click="openAddWelfare()">+ 添加福利</button>
    </div>

    <!-- ======================================================== -->
    <!-- Asset Modal -->
    <!-- ======================================================== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAssetModal" class="modal-overlay" @click.self="showAssetModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">{{ editingAssetId ? '编辑资产' : '添加资产' }}</h3>
            <div class="modal-form">
              <select v-model="assetForm.name" class="modal-select">
                <option value="现金">💵 现金</option>
                <option value="银行卡">💳 银行卡</option>
                <option value="微信">💚 微信</option>
                <option value="支付宝">💙 支付宝</option>
                <option value="其他">💎 其他</option>
              </select>
              <input v-model="assetForm.amount" class="modal-input" type="number" step="0.01" min="0" placeholder="金额" />
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showAssetModal = false">取消</button>
                <button class="modal-btn modal-btn--save" @click="handleAssetSave">保存</button>
                <button v-if="editingAssetId" class="modal-btn modal-btn--del" @click="assetStore.removeAsset(editingAssetId); showAssetModal = false">删除</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Welfare Modal -->
      <Transition name="modal">
        <div v-if="showWelfareModal" class="modal-overlay" @click.self="showWelfareModal = false">
          <div class="modal-sheet">
            <h3 class="modal-sheet__title">{{ editingWelfareId ? '编辑福利' : '添加福利' }}</h3>
            <div class="modal-form">
              <input v-model="welfareForm.title" class="modal-input" placeholder="名称" />
              <select v-model="welfareForm.category" class="modal-select">
                <option value="school_welfare">🏫 学校福利</option>
                <option value="material">📦 物资补助</option>
                <option value="coupon">🎫 优惠券</option>
                <option value="gift">🎁 礼品</option>
                <option value="other">✨ 其他</option>
              </select>
              <input v-model="welfareForm.value_estimate" class="modal-input" type="number" step="0.01" min="0" placeholder="估值（¥）" />
              <input v-model="welfareForm.description" class="modal-input" placeholder="备注" />
              <input v-model="welfareForm.received_date" type="date" class="modal-input" />
              <div class="modal-form__actions">
                <button class="modal-btn modal-btn--cancel" @click="showWelfareModal = false">取消</button>
                <button class="modal-btn modal-btn--save" @click="handleWelfareSave">保存</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lp { max-width:720px;margin:0 auto;padding:var(--spacing-page);padding-bottom:80px; }

/* Title */
.lp__title { font-size:var(--font-title);font-weight:700;color:var(--color-text-primary);margin:0 0 20px; }

/* Summary Cards */
.lp__summary { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px; }
.lp__sum-card { padding:16px;border-radius:var(--radius-md);background:#fff;border:1px solid var(--color-border-light);display:flex;flex-direction:column;gap:4px; }
.lp__sum-label { font-size:12px;color:var(--color-text-tertiary); }
.lp__sum-val { font-size:20px;font-weight:700;color:var(--color-text-primary); }
.lp__sum-card--month { border-left:3px solid #5E81AC; }
.lp__sum-card--asset { border-left:3px solid #6B9E85; }

/* Tabs */
.lp__tabs { display:flex;gap:4px;margin-bottom:18px;overflow-x:auto; }
.lp__tab-btn { padding:7px 18px;border:none;border-radius:var(--radius-full);background:transparent;color:var(--color-text-secondary);font-size:14px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:all .15s; }
.lp__tab-btn:hover { background:var(--color-primary-bg);color:var(--color-primary); }
.lp__tab-btn.active { background:var(--color-primary);color:#fff;font-weight:600; }
.lp__tab { min-height:200px; }

/* Empty */
.lp__empty { display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px 20px; }
.lp__empty p { font-size:15px;color:var(--color-text-tertiary);margin:0; }
.lp__empty button { padding:10px 24px;border:none;border-radius:var(--radius-button);background:var(--color-primary);color:#fff;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600; }

/* Groups */
.lp__group { margin-bottom:20px; }
.lp__g-head { display:flex;align-items:baseline;justify-content:space-between;padding:0 4px;margin-bottom:8px; }
.lp__g-date { font-size:15px;font-weight:600;color:var(--color-text-primary); }
.lp__g-sub { font-size:13px;color:var(--color-text-tertiary); }
.lp__g-sub--in { color:#6B9E85;font-weight:600; }
.lp__g-list { display:flex;flex-direction:column;gap:6px; }

/* Assets */
.lp__asset-list { display:flex;flex-direction:column;gap:2px; }
.lp__asset-item { display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-radius:var(--radius-md);cursor:pointer;transition:all .15s; }
.lp__asset-item:hover { background:var(--color-bg); }
.lp__asset-icon { font-size:24px; }
.lp__asset-name { flex:1;font-size:15px;color:var(--color-text-primary);font-weight:500; }
.lp__asset-amt { font-size:18px;font-weight:700;color:var(--color-text-primary); }
.lp__asset-total { display:flex;justify-content:space-between;align-items:center;padding:14px 16px;margin-top:8px;background:var(--color-primary-bg);border-radius:var(--radius-md);font-size:14px;color:var(--color-primary);font-weight:600; }
.lp__asset-total-amt { font-size:18px;font-weight:700; }

/* Welfare */
.lp__welfare-list { display:flex;flex-direction:column;gap:6px; }
.lp__welfare-item { display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#fff;border-radius:var(--radius-md);border:1px solid var(--color-border-light);transition:all .15s; }
.lp__welfare-item:hover { box-shadow:var(--shadow-sm); }
.lp__welfare-icon { font-size:24px;flex-shrink:0;margin-top:2px; }
.lp__welfare-body { flex:1;min-width:0;display:flex;flex-direction:column;gap:3px; }
.lp__welfare-title { font-size:15px;font-weight:600;color:var(--color-text-primary); }
.lp__welfare-meta { font-size:12px;color:var(--color-text-tertiary); }
.lp__welfare-desc { font-size:13px;color:var(--color-text-secondary);margin-top:2px; }
.lp__welfare-val { font-size:16px;font-weight:700;color:var(--color-primary);flex-shrink:0;margin-top:2px; }
.lp__welfare-del { padding:2px 6px;border:none;background:transparent;color:var(--color-text-tertiary);font-size:18px;cursor:pointer;opacity:0;transition:opacity .15s; }
.lp__welfare-item:hover .lp__welfare-del { opacity:1; }

/* FAB */
.lp__fab { position:fixed;bottom:80px;right:24px;z-index:50; }
.lp__fab button { padding:12px 20px;border:none;border-radius:var(--radius-full);background:var(--color-primary);color:#fff;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600;box-shadow:var(--shadow-md);transition:all .15s; }
.lp__fab button:hover { transform:translateY(-1px); }

/* Modals */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.25);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:16px; }
.modal-sheet { width:100%;max-width:440px;max-height:85vh;overflow-y:auto;background:#fff;border-radius:var(--radius-xl);padding:24px 20px;box-shadow:var(--shadow-lg); }
.modal-sheet__title { font-size:18px;font-weight:700;color:var(--color-text-primary);margin:0 0 18px; }
.modal-form { display:flex;flex-direction:column;gap:12px; }
.modal-input { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none; }
.modal-input:focus { border-color:var(--color-primary); }
.modal-select { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none;background:#fff; }
.modal-select:focus { border-color:var(--color-primary); }
.modal-form__actions { display:flex;gap:10px;justify-content:flex-end; }
.modal-btn { padding:10px 24px;border:none;border-radius:var(--radius-button);font-size:14px;font-family:inherit;cursor:pointer; }
.modal-btn--cancel { background:var(--color-bg);color:var(--color-text-secondary); }
.modal-btn--save { background:var(--color-primary);color:#fff;font-weight:600; }
.modal-btn--del { background:transparent;color:var(--color-error); }
.modal-enter-active,.modal-leave-active { transition:opacity .2s; }
.modal-enter-active .modal-sheet,.modal-leave-active .modal-sheet { transition:transform .25s; }
.modal-enter-from,.modal-leave-to { opacity:0; }
.modal-enter-from .modal-sheet { transform:translateY(30px); }
.modal-leave-to .modal-sheet { transform:translateY(30px); }

@media (max-width:500px) {
  .lp__summary { grid-template-columns:1fr 1fr; }
  .lp__summary .lp__sum-card:last-child { grid-column:1/-1; }
  .lp__fab { right:16px;bottom:88px; }
}
@media (min-width:768px) { .modal-overlay { align-items:center;padding:40px; } }
</style>
