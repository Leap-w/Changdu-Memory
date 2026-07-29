<script setup lang="ts">
import { useAppStore } from './stores/app'
import MobileLayout from './layouts/MobileLayout.vue'
import DesktopLayout from './layouts/DesktopLayout.vue'

const appStore = useAppStore()
</script>

<template>
  <MobileLayout v-if="appStore.isMobile" />
  <DesktopLayout v-else />
</template>
