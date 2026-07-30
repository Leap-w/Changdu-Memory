<script setup lang="ts">
import { useRouter } from 'vue-router'
import { AppEmpty } from '@/components/ui'

const router = useRouter()
</script>

<template>
  <AppEmpty
    icon="✅"
    title="暂无待办"
    desc="添加待办事项，让支教生活更有条理。"
    action-label="创建待办"
    @action="router.push('/todo/new')"
  />
</template>
