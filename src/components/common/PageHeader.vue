<template>
  <div class="page-header">
    <h2 class="ph-title">{{ title }}</h2>
    <p v-if="desc" class="ph-desc">{{ desc }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; desc?: string }>()
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}
.ph-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px;
}
.ph-desc {
  font-size: 15px;
  color: #909399;
  margin: 0;
}
</style>
