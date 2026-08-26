<template>
  <div class="stat-card">
    <div class="stat-icon" :style="{ color: color }"><el-icon :size="22"><component :is="icon" /></el-icon></div>
    <div class="stat-body">
      <div class="stat-value">
        <span class="value-num">{{ displayValue }}</span>
        <span v-if="unit" class="value-unit">{{ unit }}</span>
      </div>
      <div class="stat-title">{{ title }}</div>
    </div>
    <div v-if="trend" class="stat-trend" :class="trend > 0 ? 'up' : 'down'">
      {{ trend > 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: number | string
  unit?: string
  icon?: string
  color?: string
  trend?: number
}>()

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  gap: 16px;
}
.stat-icon { font-size: 32px; }
.stat-body { flex: 1; }
.value-num { font-size: 28px; font-weight: 700; color: #303133; }
.value-unit { font-size: 15px; color: #909399; margin-left: 4px; }
.stat-title { font-size: 15px; color: #909399; margin-top: 4px; }
.stat-trend { font-size: 15px; font-weight: 600; }
.stat-trend.up { color: #67c23a; }
.stat-trend.down { color: #f56c6c; }
</style>
