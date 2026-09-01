<template>
  <router-view />
  <AIAssistant v-if="showRemoteSensingAssistant" />
</template>

<script setup>
import { computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AIAssistant from '@/components/ai/AIAssistant.vue'
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'

const route = useRoute()
const showRemoteSensingAssistant = computed(() =>
  route.path.startsWith('/console') || route.path.startsWith('/rs-admin')
)

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme)
  })
})
</script>
