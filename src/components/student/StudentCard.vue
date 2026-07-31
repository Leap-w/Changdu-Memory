<script setup lang="ts">
import { ref } from 'vue'
import type { Student } from '@/repositories/StudentRepository'
import { AppCard, AppAvatar, AppIcon } from '@/components/ui'

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
  <AppCard class="sc">
    <!-- View mode -->
    <div v-if="!editing" class="sc__view" @dblclick="startEdit">
      <AppAvatar :name="student.name" size="sm" />

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
          <AppIcon name="pen" :size="14" />
        </button>
        <button class="sc__act sc__act--del" title="删除" @click="emit('remove', student.id)">
          <AppIcon name="trash" :size="14" />
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
        <button class="sc__act" @click="cancelEdit">
          取消
        </button>
        <button class="sc__act sc__act--save" @click="handleSave">
          保存
        </button>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.sc {
  /* AppCard provides base styling */
}

.sc__view {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: default;
}

.sc__body {
  flex: 1;
  min-width: 0;
}

.sc__top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.sc__name {
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.sc__role {
  font-size: 11px;
  color: var(--color-accent-soft);
  background: rgba(208, 135, 112, 0.12);
  padding: 1px 6px;
  border-radius: 4px;
}

.sc__class {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.sc__notes {
  display: block;
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.sc__act {
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
}

.sc__act:hover {
  background: var(--color-bg-subtle);
  color: var(--color-primary);
}

.sc__act--del:hover {
  color: var(--color-error);
  background: rgba(194, 103, 106, 0.08);
}

.sc__act--save {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.sc__edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.sc__input {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.sc__input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-white);
}

.sc__edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
