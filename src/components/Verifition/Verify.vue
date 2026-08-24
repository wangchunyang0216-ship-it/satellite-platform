<template>
  <div v-show="visible" class="verify-mask" @click.self="close">
    <div class="verify-dialog" :style="{ width: imgSize.width }">
      <div class="verify-header">
        <span>安全验证</span>
        <span class="verify-close" @click="close">&times;</span>
      </div>
      <VerifySlide
        ref="slideRef"
        :captchaType="captchaType"
        :imgSize="imgSize"
        @success="onSuccess"
        @fail="onFail"
        @close="close"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import VerifySlide from './VerifySlide.vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'pop'
  },
  captchaType: {
    type: String,
    default: 'blockPuzzle'
  },
  imgSize: {
    type: Object,
    default: () => ({ width: '310px', height: '155px' })
  }
})

const emit = defineEmits(['success', 'fail'])

const visible = ref(false)
const slideRef = ref(null)

function show() {
  visible.value = true
  nextTick(() => {
    slideRef.value && slideRef.value.refresh()
  })
}

function close() {
  visible.value = false
}

function onSuccess(params) {
  emit('success', params)
  close()
}

function onFail() {
  emit('fail')
}

defineExpose({ show, close })
</script>

<style scoped>
.verify-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}
.verify-dialog {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 9999;
}
.verify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}
.verify-close {
  cursor: pointer;
  font-size: 22px;
  color: #999;
  line-height: 1;
  transition: color 0.2s;
}
.verify-close:hover {
  color: #333;
}
</style>
