import { onUnmounted, ref } from 'vue'

/** 封装 AbortController，组件卸载时自动取消请求 */
export function useAbortController() {
  const controller = ref(new AbortController())

  function renew() {
    controller.value.abort()
    controller.value = new AbortController()
  }

  onUnmounted(() => {
    controller.value.abort()
  })

  return { signal: controller.value.signal, renew }
}
