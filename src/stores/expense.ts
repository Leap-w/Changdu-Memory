import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchExpenses,
  fetchTodayExpenses,
  createExpense,
  updateExpense,
  deleteExpenseById,
} from '@/repositories/ExpenseRepository'
import type { Expense } from '@/repositories/ExpenseRepository'

export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 当前月份（YYYY-MM 格式） */
  const currentMonth = computed(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  /** 当月所有记录 */
  const currentMonthExpenses = computed(() => {
    return expenses.value.filter((e) => e.expense_date.startsWith(currentMonth.value))
  })

  /** 当月总支出（使用 toFixed 保持精度） */
  const monthlyTotal = computed(() => {
    const total = currentMonthExpenses.value.reduce((sum, e) => sum + e.amount, 0)
    return Math.round(total * 100) / 100
  })

  /** 按日期分组 */
  const groupedByDate = computed(() => {
    const groups: { date: string; items: Expense[]; dailyTotal: number }[] = []
    for (const e of expenses.value) {
      const last = groups[groups.length - 1]
      if (last && last.date === e.expense_date) {
        last.items.push(e)
        last.dailyTotal += e.amount
      } else {
        groups.push({
          date: e.expense_date,
          items: [e],
          dailyTotal: e.amount,
        })
      }
    }
    // 精确每日总计
    for (const g of groups) {
      g.dailyTotal = Math.round(g.dailyTotal * 100) / 100
    }
    return groups
  })

  /** 加载全部 */
  async function loadExpenses() {
    loading.value = true
    error.value = null
    try {
      expenses.value = await fetchExpenses()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  /** 加载今日花费（首页使用） */
  async function loadTodayExpenses(): Promise<Expense[]> {
    loading.value = true
    error.value = null
    try {
      return await fetchTodayExpenses()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
      return []
    } finally {
      loading.value = false
    }
  }

  /** 创建 */
  async function addExpense(
    fields: { amount: number; category: string; description: string; expense_date: string },
  ): Promise<Expense> {
    loading.value = true
    error.value = null
    try {
      const expense = await createExpense({
        amount: Math.round(fields.amount * 100) / 100,
        category: fields.category,
        description: fields.description,
        expense_date: fields.expense_date,
      })
      expenses.value.unshift(expense)
      return expense
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 编辑 */
  async function editExpense(
    id: string,
    fields: { amount: number; category: string; description: string; expense_date: string },
  ): Promise<Expense> {
    loading.value = true
    error.value = null
    try {
      const expense = await updateExpense(id, {
        amount: Math.round(fields.amount * 100) / 100,
        category: fields.category,
        description: fields.description,
        expense_date: fields.expense_date,
      })
      const idx = expenses.value.findIndex((e) => e.id === id)
      if (idx !== -1) expenses.value[idx] = expense
      return expense
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 删除 */
  async function removeExpense(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await deleteExpenseById(id)
      expenses.value = expenses.value.filter((e) => e.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    expenses,
    loading,
    error,
    currentMonth,
    currentMonthExpenses,
    monthlyTotal,
    groupedByDate,
    loadExpenses,
    loadTodayExpenses,
    addExpense,
    editExpense,
    removeExpense,
  }
})
