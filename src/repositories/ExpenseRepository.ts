import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Expense = Database['public']['Tables']['expenses']['Row']
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await db.from('expenses').select('*').is('deleted_at', null)
    .order('expense_date', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function fetchMonthExpenses(year: number, month: number): Promise<Expense[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-31`
  const { data, error } = await db.from('expenses').select('*').is('deleted_at', null)
    .gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function fetchTodayExpenses(): Promise<Expense[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await db.from('expenses').select('*').is('deleted_at', null)
    .eq('expense_date', today).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function createExpense(
  fields: Pick<ExpenseInsert, 'amount' | 'type' | 'category' | 'description' | 'expense_date'>,
): Promise<Expense> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db.from('expenses')
    .insert({ user_id: user.id, type: fields.type || 'expense', ...fields }).select('*').single()
  if (error) throw error
  return data as Expense
}

export async function updateExpense(
  id: string, fields: Pick<ExpenseUpdate, 'amount' | 'type' | 'category' | 'description' | 'expense_date'>,
): Promise<Expense> {
  const { data, error } = await db.from('expenses')
    .update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as Expense
}

export async function softDeleteExpense(id: string): Promise<void> {
  const { error } = await db.from('expenses')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function fetchDeletedExpenses(): Promise<Expense[]> {
  const { data, error } = await db.from('expenses').select('*')
    .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

export async function restoreExpense(id: string): Promise<void> {
  const { error } = await db.from('expenses')
    .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function permanentDeleteExpense(id: string): Promise<void> {
  const { error } = await db.from('expenses').delete().eq('id', id)
  if (error) throw error
}
