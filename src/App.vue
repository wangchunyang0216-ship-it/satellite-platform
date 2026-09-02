<template>
  <router-view />
  <AIAssistant v-if="showRemoteSensingAssistant" />
</template>

<script setup>
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AIAssistant from '@/components/ai/AIAssistant.vue'
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'

const route = useRoute()
const AI_ASSISTANT_PROMPT_KEY = 'rs-ai-assistant-login-prompted'
const showRemoteSensingAssistant = computed(() =>
  route.path === '/index' || route.path.startsWith('/console') || route.path.startsWith('/rs-admin')
)

watch(
  () => route.path,
  (path) => {
    if (!showRemoteSensingAssistant.value || sessionStorage.getItem(AI_ASSISTANT_PROMPT_KEY)) return
    sessionStorage.setItem(AI_ASSISTANT_PROMPT_KEY, '1')
    nextTick(() => {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('rs-ai-assistant-open', { detail: { autoCloseMs: 30000 } }))
      }, 300)
    })
  },
  { immediate: true }
)

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme)
  })
})
</script>
