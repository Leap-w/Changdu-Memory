<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NDatePicker, NTimePicker } from 'naive-ui'
import { AppIcon } from '@/components/ui'
import { dateStrToTs, tsToDateStr, timeStrToTs, tsToTimeStr } from '@/utils/date'

interface Props {
  amount?: number
  type?: string
  category?: string
  description?: string
  expenseDate?: string
  /** 具体时间 'HH:mm'，可空 */
  expenseTime?: string | null
  /** 编辑模式：编辑旧记录时时间默认留空，新建时默认当前时刻 */
  isEdit?: boolean
  loading?: boolean
  submitLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  amount: 0, type: 'expense', category: 'food', description: '', expenseDate: '',
  expenseTime: null, isEdit: false, loading: false, submitLabel: '保存',
})

const emit = defineEmits<{
  submit: [data: { amount: number; type: string; category: string; description: string; expense_date: string; expense_time: string | null }]
  cancel: []
}>()

const localType = ref(props.type || 'expense')
const localAmount = ref<string>(props.amount ? String(props.amount) : '')
const localCategory = ref(props.category || (props.type === 'income' ? 'salary' : 'food'))
const localDesc = ref(props.description)
const localDate = ref<number | null>(
  props.expenseDate ? dateStrToTs(props.expenseDate) : Date.now(),
)
const localTime = ref<number | null>(
  props.expenseTime ? timeStrToTs(props.expenseTime) : (props.isEdit ? null : Date.now()),
)
const errorMsg = ref('')

// 编辑页数据是异步加载后传入的（ExpenseEdit 从 store / 数据库读取），
// 首次挂载时 props 可能还是默认值；监听 props 变化同步本地状态，
// 否则会出现「编辑时原信息不显示」的问题。
watch(
  () => [props.type, props.category, props.amount, props.description, props.expenseDate, props.expenseTime],
  () => {
    localType.value = props.type || 'expense'
    localAmount.value = props.amount ? String(props.amount) : ''
    localCategory.value = props.category || (props.type === 'income' ? 'salary' : 'food')
    localDesc.value = props.description
    localDate.value = props.expenseDate ? dateStrToTs(props.expenseDate) : Date.now()
    if (props.expenseTime) {
      localTime.value = timeStrToTs(props.expenseTime)
    } else {
      localTime.value = props.isEdit ? null : Date.now()
    }
  },
  { immediate: true },
)

const expenseCategories = [
  { value: 'food', label: '餐饮', icon: 'check' },
  { value: 'transport', label: '交通', icon: 'chevron-right' },
  { value: 'shopping', label: '零食', icon: 'wallet' },
  { value: 'accommodation', label: '住宿', icon: 'home' },
  { value: 'work', label: '工作', icon: 'briefcase' },
  { value: 'entertainment', label: '娱乐', icon: 'star' },
  { value: 'medical', label: '医疗', icon: 'heart' },
  { value: 'other', label: '其他', icon: 'grid' },
]

const incomeCategories = [
  { value: 'salary', label: '工资', icon: 'wallet' },
  { value: 'subsidy', label: '补贴', icon: 'gift' },
  { value: 'bonus', label: '奖金', icon: 'star' },
  { value: 'part_time', label: '兼职', icon: 'briefcase' },
  { value: 'red_packet', label: '红包', icon: 'red-envelope' },
  { value: 'second_hand', label: '出二手', icon: 'swap' },
  { value: 'other', label: '其他', icon: 'grid' },
]

const currentCategories = computed(() => (
  localType.value === 'income' ? incomeCategories : expenseCategories
))

const catColors: Record<string, string> = {
  food: 'var(--color-accent-soft)', transport: 'var(--color-sky)',
  shopping: 'var(--color-gold)', accommodation: 'var(--color-primary)',
  work: 'var(--color-secondary)', entertainment: 'var(--color-accent)',
  medical: '#E8B04C', other: 'var(--color-text-tertiary)',
  salary: 'var(--color-secondary)', subsidy: 'var(--color-primary)',
  bonus: 'var(--color-gold)', part_time: 'var(--color-sky)',
  red_packet: 'var(--color-accent)', second_hand: 'var(--color-accent-soft)',
}

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
    expense_date: tsToDateStr(localDate.value),
    expense_time: localTime.value ? tsToTimeStr(localTime.value) : null,
  })
}
</script>

<template>
  <div class="ee">
    <!-- Type toggle -->
    <div class="ee__type-row">
      <button
        class="ee__type-btn"
        :class="{ 'ee__type-btn--active': localType === 'expense' }"
        @click="switchType('expense')"
      >
        支出
      </button>
      <button
        class="ee__type-btn"
        :class="{ 'ee__type-btn--active': localType === 'income' }"
        @click="switchType('income')"
      >
        收入
      </button>
    </div>

    <!-- Amount -->
    <div class="ee__field">
      <label class="ee__label">金额</label>
      <div class="ee__amount-wrap">
        <span class="ee__amount-prefix">¥</span>
        <input
          v-model="localAmount"
          class="ee__input ee__input--xl"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          inputmode="decimal"
        />
      </div>
    </div>

    <!-- Categories -->
    <div class="ee__field">
      <label class="ee__label">分类</label>
      <div class="ee__cats">
        <button
          v-for="c in currentCategories"
          :key="c.value"
          class="ee__cat-btn"
          :class="{ 'ee__cat-btn--active': localCategory === c.value }"
          @click="localCategory = c.value"
        >
          <div
            class="ee__cat-icon"
            :style="{
              background: localCategory === c.value ? catColors[c.value] + '22' : 'var(--color-bg)',
              color: catColors[c.value] || 'var(--color-text-secondary)',
            }"
          >
            <AppIcon :name="c.icon" size="18" />
          </div>
          <span class="ee__cat-label">{{ c.label }}</span>
        </button>
      </div>
    </div>

    <!-- Date -->
    <div class="ee__field">
      <label class="ee__label">日期</label>
      <NDatePicker
        v-model:value="localDate"
        type="date"
        size="large"
        style="width:100%"
      />
    </div>

    <!-- Time (optional) -->
    <div class="ee__field">
      <label class="ee__label">时间（选填）</label>
      <NTimePicker
        v-model:value="localTime"
        format="HH:mm"
        placeholder="选择几点几分"
        size="large"
        clearable
        style="width:100%"
      />
    </div>

    <!-- Note -->
    <div class="ee__field">
      <label class="ee__label">备注（选填）</label>
      <input
        v-model="localDesc"
        class="ee__input"
        placeholder="记录详情…"
        maxlength="100"
      />
    </div>

    <p v-if="errorMsg" class="ee__error">
      {{ errorMsg }}
    </p>

    <!-- Actions -->
    <div class="ee__actions">
      <button class="ee__btn ee__btn--cancel" @click="emit('cancel')">
        取消
      </button>
      <button class="ee__btn ee__btn--save" :disabled="loading" @click="handleSubmit">
        {{ loading ? '保存中…' : submitLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ee {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Type toggle */
.ee__type-row {
  display: flex;
  gap: 0;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 3px;
}

.ee__type-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-content);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.ee__type-btn--active {
  background: var(--color-bg-white);
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
}

.ee__type-btn:last-child.ee__type-btn--active {
  color: var(--color-secondary);
}

.ee__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ee__label {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Amount input */
.ee__amount-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.ee__amount-wrap:focus-within {
  border-color: var(--color-primary);
}

.ee__amount-prefix {
  padding: 0 16px;
  font-size: 22px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
}

.ee__input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-content);
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast);
  width: 100%;
}

.ee__input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.ee__input--xl {
  padding: 14px 16px;
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  border: none;
  background: var(--color-bg-white);
  border-radius: 0;
}

/* Categories */
.ee__cats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.ee__cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg-white);
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.ee__cat-btn:hover {
  border-color: var(--color-primary);
}

.ee__cat-btn--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.ee__cat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.ee__cat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-weight: var(--font-weight-medium);
}

/* Actions */
.ee__error {
  color: var(--color-error);
  font-size: var(--font-caption);
  margin: 0;
}

.ee__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.ee__btn {
  padding: 10px 28px;
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-content);
  font-family: inherit;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
}

.ee__btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.ee__btn--cancel:hover {
  background: var(--color-border-light);
}

.ee__btn--save {
  background: var(--color-primary);
  color: #fff;
}

.ee__btn--save:hover {
  background: var(--color-primary-dark);
}

.ee__btn--save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
