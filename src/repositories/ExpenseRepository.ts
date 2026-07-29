import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Expense = Database['public']['Tables']['expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

/** 获取所有花费（按日期倒序） */
export async function fetchExpenses(): Promise<Expense[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Expense[]
}

/** 获取当月花费 */
export async function fetchMonthExpenses(year: number, month: number): Promise<Expense[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-31`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .select('*')
    .gte('expense_date', start)
    .lte('expense_date', end)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as Expense[]
}

/** 获取今日花费 */
export async function fetchTodayExpenses(): Promise<Expense[]> {
  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .select('*')
    .eq('expense_date', today)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Expense[]
}

/** 创建花费 */
export async function createExpense(
  fields: Pick<ExpenseInsert, 'amount' | 'category' | 'description' | 'expense_date'>,
): Promise<Expense> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()

  if (error) throw error
  return data as Expense
}

/** 更新花费 */
export async function updateExpense(
  id: string,
  fields: Pick<ExpenseUpdate, 'amount' | 'category' | 'description' | 'expense_date'>,
): Promise<Expense> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('expenses')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Expense
}

/** 删除花费 */
export async function deleteExpenseById(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
}
