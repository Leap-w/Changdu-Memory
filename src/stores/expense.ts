import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchExpenses, fetchTodayExpenses, createExpense, updateExpense, softDeleteExpense,
} from '@/repositories/ExpenseRepository'
import type { Expense } from '@/repositories/ExpenseRepository'

export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentMonth = computed(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })

  // 支出
  const expenseList = computed(() => expenses.value.filter((e) => e.type !== 'income'))
  const incomeList = computed(() => expenses.value.filter((e) => e.type === 'income'))

  const monthlyExpenseTotal = computed(() => {
    const t = expenseList.value.filter((e) => e.expense_date.startsWith(currentMonth.value)).reduce((s, e) => s + Number(e.amount), 0)
    return Math.round(t * 100) / 100
  })

  const monthlyIncomeTotal = computed(() => {
    const t = incomeList.value.filter((e) => e.expense_date.startsWith(currentMonth.value)).reduce((s, e) => s + Number(e.amount), 0)
    return Math.round(t * 100) / 100
  })

  const todayExpenseTotal = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    const t = expenseList.value.filter((e) => e.expense_date === today).reduce((s, e) => s + Number(e.amount), 0)
    return Math.round(t * 100) / 100
  })

  const groupedByDate = computed(() => {
    const groups: { date: string; items: Expense[]; total: number }[] = []
    for (const e of expenseList.value) {
      const last = groups[groups.length - 1]
      if (last && last.date === e.expense_date) { last.items.push(e); last.total += Number(e.amount) }
      else groups.push({ date: e.expense_date, items: [e], total: Number(e.amount) })
    }
    for (const g of groups) g.total = Math.round(g.total * 100) / 100
    return groups
  })

  const incomeGroupedByDate = computed(() => {
    const groups: { date: string; items: Expense[]; total: number }[] = []
    for (const e of incomeList.value) {
      const last = groups[groups.length - 1]
      if (last && last.date === e.expense_date) { last.items.push(e); last.total += Number(e.amount) }
      else groups.push({ date: e.expense_date, items: [e], total: Number(e.amount) })
    }
    for (const g of groups) g.total = Math.round(g.total * 100) / 100
    return groups
  })

  async function loadExpenses() {
    loading.value = true; error.value = null
    try { expenses.value = await fetchExpenses() }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '加载失败' }
    finally { loading.value = false }
  }

  async function addExpense(fields: { amount: number; type: string; category: string; description: string; expense_date: string }) {
    loading.value = true; error.value = null
    try { const e = await createExpense({ amount: Math.round(fields.amount * 100) / 100, type: fields.type, category: fields.category, description: fields.description, expense_date: fields.expense_date }); expenses.value.unshift(e); return e }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '创建失败'; throw err }
    finally { loading.value = false }
  }

  async function editExpense(id: string, fields: { amount: number; type: string; category: string; description: string; expense_date: string }) {
    loading.value = true; error.value = null
    try { const e = await updateExpense(id, { amount: Math.round(fields.amount * 100) / 100, type: fields.type, category: fields.category, description: fields.description, expense_date: fields.expense_date }); const i = expenses.value.findIndex((x) => x.id === id); if (i >= 0) expenses.value[i] = e; return e }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '更新失败'; throw err }
    finally { loading.value = false }
  }

  async function removeExpense(id: string) {
    loading.value = true; error.value = null
    try { await softDeleteExpense(id); expenses.value = expenses.value.filter((x) => x.id !== id) }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '删除失败'; throw err }
    finally { loading.value = false }
  }

  async function loadTodayExpenses() {
    loading.value = true; error.value = null
    try { return await fetchTodayExpenses() }
    catch (err: unknown) { error.value = err instanceof Error ? err.message : '加载失败'; return [] }
    finally { loading.value = false }
  }

  return { expenses, loading, error, currentMonth, expenseList, incomeList, monthlyExpenseTotal, monthlyIncomeTotal, todayExpenseTotal, groupedByDate, incomeGroupedByDate, loadExpenses, addExpense, editExpense, removeExpense, loadTodayExpenses }
})
