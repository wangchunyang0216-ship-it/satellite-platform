<template>
  <div class="scenario-panel">
    <div class="sp-header">应用场景</div>
    <div class="sp-list">
      <div
        v-for="sc in scenarios"
        :key="sc.key"
        class="sp-item"
        :class="{ active: activeKey === sc.key }"
        @click="$emit('select', sc.key, sc.filterPreset)"
        @mouseenter="onItemEnter(sc, $event)"
        @mouseleave="onItemLeave"
      >
        <el-icon :size="18"><component :is="sc.icon" /></el-icon>
        <span class="sp-label">{{ sc.label }}</span>
        <el-icon :size="12" class="sp-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- Hover fly-out -->
    <Teleport to="body">
      <div
        v-if="flyout.visible"
        class="sp-flyout"
        :style="{ top: flyout.top + 'px', left: flyout.left + 'px' }"
        @mouseenter="clearHideTimer"
        @mouseleave="scheduleHide"
      >
        <div class="flyout-title">{{ flyout.scenario?.label }}</div>
        <div class="flyout-subs">
          <div
            v-for="sub in flyout.scenario?.children"
            :key="sub.key"
            class="flyout-sub"
            @click="onSubClick(sub)"
          >
            <span class="sub-dot"></span>
            {{ sub.label }}
          </div>
        </div>
        <div class="flyout-divider"></div>
        <div class="flyout-sats">
          <span class="flyout-sats-label">关联卫星</span>
          <div class="flyout-sat-tags">
            <span v-for="sid in flyout.scenario?.relatedSatellites" :key="sid" class="sat-chip">
              {{ getSatName(sid) }}
            </span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { debounce } from '@/utils/rs-utils'
import type { ScenarioConfig, ScenarioFilterPreset } from '@/config/scenarioFilters'

const props = defineProps<{
  scenarios: ScenarioConfig[]
  activeKey: string
  getSatName: (id: string) => string
}>()

const emit = defineEmits<{
  select: [key: string, preset: ScenarioFilterPreset]
}>()

// ── Fly-out state ──
const flyout = reactive({
  visible: false,
  top: 0,
  left: 0,
  scenario: null as ScenarioConfig | null,
})

let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function clearShowTimer() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null }
}

function clearHideTimer() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

function onItemEnter(sc: ScenarioConfig, e: MouseEvent) {
  clearHideTimer()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  showTimer = setTimeout(() => {
    flyout.scenario = sc
    flyout.top = rect.top
    flyout.left = rect.right + 6
    flyout.visible = true
  }, 200)
}

function onItemLeave() {
  clearShowTimer()
  scheduleHide()
}

function scheduleHide() {
  clearHideTimer()
  hideTimer = setTimeout(() => {
    flyout.visible = false
    flyout.scenario = null
  }, 180)
}

function onSubClick(sub: { key: string; label: string }) {
  if (flyout.scenario) {
    emit('select', flyout.scenario.key, flyout.scenario.filterPreset)
  }
  flyout.visible = false
  flyout.scenario = null
}
</script>

<style scoped>
.scenario-panel {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #F0F1F3;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.sp-header {
  font-size: 15px;
  font-weight: 700;
  color: #1F2937;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #F3F4F6;
  flex-shrink: 0;
}
.sp-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.sp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all .12s;
  font-size: 15px;
  color: #374151;
  border-left: 3px solid transparent;
}
.sp-item:hover {
  background: #F9FAFB;
}
.sp-item.active {
  background: rgba(37,99,235,0.05);
  border-left-color: #2563EB;
  color: #2563EB;
  font-weight: 600;
}
.sp-label {
  flex: 1;
  white-space: nowrap;
}
.sp-arrow {
  color: #D1D5DB;
  transition: transform .12s;
}
.sp-item:hover .sp-arrow {
  color: #2563EB;
  transform: translateX(2px);
}
</style>

<style>
/* 非 scoped — fly-out 在 Teleport 中需要全局样式 */
.sp-flyout {
  position: fixed;
  z-index: 3000;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #E5E7EB;
  padding: 16px 20px;
  min-width: 210px;
  max-width: 260px;
  animation: spFlyIn .15s ease-out;
}
@keyframes spFlyIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
.flyout-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 10px;
}
.flyout-subs {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.flyout-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 15px;
  color: #374151;
  cursor: pointer;
  border-radius: 6px;
  transition: background .1s;
}
.flyout-sub:hover {
  background: #F3F4F6;
  color: #2563EB;
}
.sub-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #D1D5DB; flex-shrink: 0;
}
.flyout-sub:hover .sub-dot {
  background: #2563EB;
}
.flyout-divider {
  height: 1px;
  background: #F0F1F3;
  margin: 10px 0;
}
.flyout-sats-label {
  font-size: 13px;
  color: #9CA3AF;
  display: block;
  margin-bottom: 6px;
}
.flyout-sat-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.sat-chip {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #F3F4F6;
  color: #6B7280;
}
</style>
