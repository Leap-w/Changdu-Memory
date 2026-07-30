import { supabase } from '@/services/supabase'
import type { Database } from '@/types/database'

export type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await db
    .from('students')
    .select('*')
    .order('class_name', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Student[]
}

export async function createStudent(
  fields: Pick<StudentInsert, 'name' | 'class_name' | 'role' | 'notes'>,
): Promise<Student> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')
  const { data, error } = await db
    .from('students')
    .insert({ user_id: user.id, ...fields })
    .select('*')
    .single()
  if (error) throw error
  return data as Student
}

export async function updateStudent(
  id: string,
  fields: Pick<StudentUpdate, 'name' | 'class_name' | 'role' | 'notes'>,
): Promise<Student> {
  const { data, error } = await db
    .from('students')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Student
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await db.from('students').delete().eq('id', id)
  if (error) throw error
}

/** 批量添加学生 */
export async function batchCreateStudents(
  students: { name: string; class_name: string; role: string; notes: string }[],
): Promise<Student[]> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('未登录')

  const results: Student[] = []
  for (const s of students) {
    const { data, error } = await db
      .from('students')
      .insert({ user_id: user.id, name: s.name, class_name: s.class_name, role: s.role, notes: s.notes })
      .select('*')
      .single()
    if (error) throw error
    results.push(data as Student)
  }
  return results
}
