import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Todo = Database['public']['Tables']['todos']['Row']
type TodoInsert = Database['public']['Tables']['todos']['Insert']
type TodoUpdate = Database['public']['Tables']['todos']['Update']

/** 获取所有待办（按日期 + 创建时间排序） */
export async function fetchTodos(): Promise<Todo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('todos')
    .select('*')
    .order('todo_date', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Todo[]
}

/** 获取今日待办 */
export async function fetchTodayTodos(): Promise<Todo[]> {
  const today = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('todos')
    .select('*')
    .eq('todo_date', today)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Todo[]
}

/** 创建待办 */
export async function createTodo(
  fields: Pick<TodoInsert, 'title' | 'description' | 'todo_date' | 'priority' | 'category'>,
): Promise<Todo> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('todos')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()

  if (error) throw error
  return data as Todo
}

/** 更新待办 */
export async function updateTodo(
  id: string,
  fields: Pick<TodoUpdate, 'title' | 'description' | 'todo_date' | 'priority' | 'category'>,
): Promise<Todo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('todos')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Todo
}

/** 切换完成状态 */
export async function toggleCompleteTodo(id: string, currentCompleted: boolean): Promise<Todo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('todos')
    .update({
      completed: !currentCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Todo
}

/** 删除待办 */
export async function deleteTodoById(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw error
}
