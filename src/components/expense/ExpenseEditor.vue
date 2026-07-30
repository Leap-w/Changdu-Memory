<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  amount?: number
  type?: string
  category?: string
  description?: string
  expenseDate?: string
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  amount: 0, type: 'expense', category: 'food', description: '', expenseDate: '', loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { amount: number; type: string; category: string; description: string; expense_date: string }]
  cancel: []
}>()

const localType = ref(props.type || 'expense')
const localAmount = ref<string>(props.amount ? String(props.amount) : '')
const localCategory = ref(props.category || 'food')
const localDesc = ref(props.description)
const localDate = ref(props.expenseDate || new Date().toISOString().split('T')[0])
const errorMsg = ref('')

const expenseCategories = [
  { value: 'food', label: '🍜 餐饮', icon: '🍜' },
  { value: 'transport', label: '🚌 交通', icon: '🚌' },
  { value: 'shopping', label: '🛒 购物', icon: '🛒' },
  { value: 'accommodation', label: '🏠 住宿', icon: '🏠' },
  { value: 'study', label: '📚 学习', icon: '📚' },
  { value: 'entertainment', label: '🎮 娱乐', icon: '🎮' },
  { value: 'medical', label: '💊 医疗', icon: '💊' },
  { value: 'other', label: '📦 其他', icon: '📦' },
]

const incomeCategories = [
  { value: 'salary', label: '💰 工资', icon: '💰' },
  { value: 'subsidy', label: '🎁 补贴', icon: '🎁' },
  { value: 'bonus', label: '🏆 奖金', icon: '🏆' },
  { value: 'part_time', label: '💼 兼职', icon: '💼' },
  { value: 'other', label: '📦 其他', icon: '📦' },
]

const currentCategories = computed(() => localType.value === 'income' ? incomeCategories : expenseCategories)

// Switch type resets category
function switchType(t: string) {
  localType.value = t
  localCategory.value = t === 'income' ? 'salary' : 'food'
}

function handleSubmit() {
  const amt = parseFloat(localAmount.value)
  if (!amt || amt <= 0) { errorMsg.value = '请输入金额'; return }
  if (!localDate.value) { errorMsg.value = '请选择日期'; return }
  errorMsg.value = ''
  emit('submit', {
    amount: Math.round(amt * 100) / 100,
    type: localType.value,
    category: localCategory.value,
    description: localDesc.value,
    expense_date: localDate.value,
  })
}
</script>

<template>
  <div class="ee">
    <!-- Type toggle -->
    <div class="ee__type-row">
      <button class="ee__type-btn" :class="{ active: localType === 'expense' }" @click="switchType('expense')">支出</button>
      <button class="ee__type-btn" :class="{ active: localType === 'income' }" @click="switchType('income')">收入</button>
    </div>

    <!-- Amount -->
    <div class="ee__field">
      <label class="ee__label">金额</label>
      <div class="ee__amount-wrap">
        <span class="ee__amount-prefix">¥</span>
        <input v-model="localAmount" class="ee__input ee__input--xl" type="number" step="0.01" min="0.01" placeholder="0.00" inputmode="decimal" />
      </div>
    </div>

    <!-- Categories -->
    <div class="ee__field">
      <label class="ee__label">分类</label>
      <div class="ee__cats">
        <button
          v-for="c in currentCategories" :key="c.value"
          class="ee__cat-btn" :class="{ active: localCategory === c.value }"
          @click="localCategory = c.value"
        >
          <span class="ee__cat-icon">{{ c.icon }}</span>
          <span class="ee__cat-label">{{ c.label.replace(/[^一-龥]/g, '') }}</span>
        </button>
      </div>
    </div>

    <!-- Date -->
    <div class="ee__field">
      <label class="ee__label">日期</label>
      <input v-model="localDate" type="date" class="ee__input" />
    </div>

    <!-- Note -->
    <div class="ee__field">
      <label class="ee__label">备注（选填）</label>
      <input v-model="localDesc" class="ee__input" placeholder="记录详情…" maxlength="100" />
    </div>

    <p v-if="errorMsg" class="ee__error">{{ errorMsg }}</p>

    <!-- Actions -->
    <div class="ee__actions">
      <button class="ee__btn ee__btn--cancel" @click="emit('cancel')">取消</button>
      <button class="ee__btn ee__btn--save" :disabled="loading" @click="handleSubmit">{{ loading ? '…' : submitLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.ee { display:flex;flex-direction:column;gap:20px; }
.ee__type-row { display:flex;gap:0;background:var(--color-bg);border-radius:var(--radius-md);padding:3px; }
.ee__type-btn { flex:1;padding:10px;border:none;border-radius:10px;background:transparent;color:var(--color-text-secondary);font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s; }
.ee__type-btn.active { background:#fff;color:var(--color-primary);box-shadow:0 1px 3px rgba(0,0,0,.08); }
.ee__type-btn:last-child.active { color:#6B9E85; }

.ee__field { display:flex;flex-direction:column;gap:6px; }
.ee__label { font-size:13px;font-weight:600;color:var(--color-text-primary); }
.ee__amount-wrap { display:flex;align-items:center;gap:0;border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;transition:border-color .15s; }
.ee__amount-wrap:focus-within { border-color:var(--color-primary); }
.ee__amount-prefix { padding:0 16px;font-size:22px;font-weight:700;color:var(--color-text-secondary);background:var(--color-bg);border-right:1px solid var(--color-border); }
.ee__input { padding:10px 12px;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-size:15px;font-family:inherit;color:var(--color-text-primary);background:var(--color-bg);outline:none;transition:border-color .15s;width:100%; }
.ee__input:focus { border-color:var(--color-primary);background:#fff; }
.ee__input--xl { padding:14px 16px;font-size:24px;font-weight:700;border:none;background:#fff;border-radius:0; }

.ee__cats { display:grid;grid-template-columns:repeat(4,1fr);gap:6px; }
.ee__cat-btn { display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 4px;border:1px solid var(--color-border-light);border-radius:var(--radius-md);background:#fff;cursor:pointer;font-family:inherit;transition:all .15s; }
.ee__cat-btn:hover { border-color:var(--color-primary); }
.ee__cat-btn.active { border-color:var(--color-primary);background:var(--color-primary-bg); }
.ee__cat-icon { font-size:22px; }
.ee__cat-label { font-size:11px;color:var(--color-text-secondary);white-space:nowrap; }

.ee__error { color:var(--color-error);font-size:13px;margin:0; }
.ee__actions { display:flex;gap:12px;justify-content:flex-end; }
.ee__btn { padding:10px 28px;border:none;border-radius:var(--radius-button);font-size:15px;font-family:inherit;cursor:pointer; }
.ee__btn--cancel { background:var(--color-bg);color:var(--color-text-secondary); }
.ee__btn--save { background:var(--color-primary);color:#fff;font-weight:600; }
.ee__btn--save:disabled { opacity:.6;cursor:not-allowed; }
</style>
