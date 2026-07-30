<script setup lang="ts">
import { ref } from 'vue'
import type { Student } from '@/repositories/StudentRepository'

const props = defineProps<{
  student: Student
}>()

const emit = defineEmits<{
  save: [id: string, data: { name: string; class_name: string; role: string; notes: string }]
  remove: [id: string]
}>()

const editing = ref(false)
const form = ref({ name: '', class_name: '', role: '', notes: '' })

function startEdit() {
  form.value = {
    name: props.student.name,
    class_name: props.student.class_name || '',
    role: props.student.role || '',
    notes: props.student.notes || '',
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', props.student.id, {
    name: form.value.name.trim(),
    class_name: form.value.class_name.trim(),
    role: form.value.role.trim(),
    notes: form.value.notes.trim(),
  })
  editing.value = false
}
</script>

<template>
  <div class="sc">
    <!-- View mode -->
    <div v-if="!editing" class="sc__view" @dblclick="startEdit">
      <div class="sc__avatar">{{ student.name[0] }}</div>
      <div class="sc__body">
        <div class="sc__top">
          <span class="sc__name">{{ student.name }}</span>
          <span v-if="student.role" class="sc__role">{{ student.role }}</span>
          <span v-if="student.class_name" class="sc__class">{{ student.class_name }}</span>
        </div>
        <span v-if="student.notes" class="sc__notes">{{ student.notes }}</span>
      </div>
      <div class="sc__actions">
        <button class="sc__act" title="编辑" @click="startEdit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
        <button class="sc__act sc__act--del" title="删除" @click="emit('remove', student.id)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="sc__edit">
      <input v-model="form.name" class="sc__input" placeholder="姓名" />
      <input v-model="form.class_name" class="sc__input" placeholder="班级" />
      <input v-model="form.role" class="sc__input" placeholder="职务" />
      <input v-model="form.notes" class="sc__input" placeholder="备注" />
      <div class="sc__edit-actions">
        <button class="sc__act" @click="cancelEdit">取消</button>
        <button class="sc__act sc__act--save" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sc { background:#fff;border:1px solid var(--color-border-light);border-radius:var(--radius-md);overflow:hidden; }
.sc__view { display:flex;align-items:center;gap:12px;padding:12px;cursor:default; }
.sc__avatar { width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5E81AC,#81A1C1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0; }
.sc__body { flex:1;min-width:0; }
.sc__top { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }
.sc__name { font-size:15px;font-weight:600;color:var(--color-text-primary); }
.sc__role { font-size:11px;color:var(--color-accent-soft);background:#F5F0EB;padding:1px 6px;border-radius:4px; }
.sc__class { font-size:11px;color:var(--color-text-tertiary); }
.sc__notes { display:block;font-size:12px;color:var(--color-text-tertiary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.sc__actions { display:flex;gap:4px;flex-shrink:0; }
.sc__act { padding:6px 8px;border:none;border-radius:6px;background:transparent;color:var(--color-text-tertiary);cursor:pointer;font-family:inherit;font-size:13px;transition:all .15s; }
.sc__act:hover { background:var(--color-bg);color:var(--color-primary); }
.sc__act--del:hover { color:var(--color-error);background:#FDF0ED; }
.sc__act--save { color:var(--color-primary);font-weight:600; }
.sc__edit { display:flex;flex-direction:column;gap:8px;padding:12px; }
.sc__input { padding:8px 10px;border:1px solid var(--color-border);border-radius:6px;font-size:14px;font-family:inherit;outline:none; }
.sc__input:focus { border-color:var(--color-primary); }
.sc__edit-actions { display:flex;gap:8px;justify-content:flex-end; }
</style>
