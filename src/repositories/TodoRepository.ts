import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'
import { formatLocalDate } from '@/utils/date'

export type Todo = Database['public']['Tables']['todos']['Row']
type TodoInsert = Database['public']['Tables']['todos']['Insert']
type TodoUpdate = Database['public']['Tables']['todos']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await db.from('todos').select('*').is('deleted_at', null)
    .order('todo_date', { ascending: true }).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Todo[]
}

export async function fetchTodayTodos(): Promise<Todo[]> {
  const today = formatLocalDate()
  const { data, error } = await db.from('todos').select('*').is('deleted_at', null)
    .eq('todo_date', today).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Todo[]
}

export async function createTodo(
  fields: Pick<TodoInsert, 'title' | 'description' | 'todo_date' | 'deadline_date' | 'deadline_time' | 'priority' | 'category'>,
): Promise<Todo> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const insertData = {
    user_id: user.id,
    title: fields.title,
    description: fields.description ?? null,
    todo_date: fields.todo_date ?? formatLocalDate(),
    deadline_date: fields.deadline_date ?? null,
    deadline_time: fields.deadline_time ?? null,
    priority: fields.priority ?? 'medium',
    category: fields.category ?? 'life',
  }
  const { data, error } = await db.from('todos')
    .insert(insertData).select('*').single()
  if (error) throw error
  return data as Todo
}

export async function updateTodo(
  id: string, fields: Pick<TodoUpdate, 'title' | 'description' | 'todo_date' | 'deadline_date' | 'deadline_time' | 'priority' | 'category'>,
): Promise<Todo> {
  const { data, error } = await db.from('todos')
    .update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
  if (error) throw error
  return data as Todo
}

export async function toggleCompleteTodo(id: string, currentCompleted: boolean): Promise<Todo> {
  const { data, error } = await db.from('todos').update({
    completed: !currentCompleted, updated_at: new Date().toISOString(),
  }).eq('id', id).select('*').single()
  if (error) throw error
  return data as Todo
}

/** 软删除 */
export async function softDeleteTodo(id: string): Promise<void> {
  const { error } = await db.from('todos')
    .update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function fetchDeletedTodos(): Promise<Todo[]> {
  const { data, error } = await db.from('todos').select('*')
    .not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Todo[]
}

export async function restoreTodo(id: string): Promise<void> {
  const { error } = await db.from('todos')
    .update({ deleted_at: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function permanentDeleteTodo(id: string): Promise<void> {
  const { error } = await db.from('todos').delete().eq('id', id)
  if (error) throw error
}
