import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/repositories/StudentRepository'
import type { Student } from '@/repositories/StudentRepository'

export const useStudentStore = defineStore('student', () => {
  const students = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** 按班级分组 */
  const groupedByClass = computed(() => {
    const map = new Map<string, Student[]>()
    for (const s of students.value) {
      const key = s.class_name || '未分班'
      const list = map.get(key) || []
      list.push(s)
      map.set(key, list)
    }
    return map
  })

  async function loadStudents() {
    loading.value = true
    error.value = null
    try {
      students.value = await fetchStudents()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function addStudent(fields: {
    name: string; class_name: string; role: string; notes: string
  }): Promise<Student> {
    loading.value = true
    error.value = null
    try {
      const s = await createStudent(fields)
      students.value.push(s)
      return s
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '添加失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function editStudent(id: string, fields: {
    name: string; class_name: string; role: string; notes: string
  }): Promise<Student> {
    loading.value = true
    error.value = null
    try {
      const s = await updateStudent(id, fields)
      const idx = students.value.findIndex((x) => x.id === id)
      if (idx !== -1) students.value[idx] = s
      return s
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '更新失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeStudent(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await deleteStudent(id)
      students.value = students.value.filter((x) => x.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '删除失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { students, loading, error, groupedByClass, loadStudents, addStudent, editStudent, removeStudent }
})
