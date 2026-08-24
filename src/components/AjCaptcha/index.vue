<template>
  <div class="aj-captcha-container">
    <div v-if="loading" class="captcha-loading">加载验证码...</div>
    <div v-else class="captcha-box" :style="{ width: imgWidth + 'px', height: imgHeight + 'px' }">
      <div class="captcha-bg" ref="bgRef">
        <img :src="bgImage" :style="{ width: imgWidth + 'px', height: imgHeight + 'px' }" />
      </div>
      <div
        class="captcha-slider"
        :style="{
          left: sliderLeft + 'px',
          width: sliderSize + 'px',
          height: imgHeight + 'px'
        }"
      >
        <img :src="sliderImage" :style="{ width: sliderSize + 'px', height: imgHeight + 'px' }" />
      </div>
      <div class="captcha-track" :style="{ width: imgWidth + 'px' }">
        <div
          class="captcha-track-bar"
          :class="{ 'captcha-verified': verified }"
          :style="{ width: (verified ? imgWidth : sliderLeft) + 'px' }"
        ></div>
        <div
          class="captcha-track-btn"
          :class="{ 'captcha-verified-btn': verified }"
          :style="{ left: sliderLeft + 'px' }"
          @mousedown="onDragStart"
          @touchstart.prevent="onDragStart"
        >
          <span v-if="verified">✓</span>
          <span v-else>→</span>
        </div>
        <span class="captcha-track-text">
          {{ verified ? '验证通过' : '请拖动滑块完成验证' }}
        </span>
      </div>
    </div>
    <div v-if="error" class="captcha-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getCaptcha, checkCaptcha } from '@/api/login'
import CryptoJS from 'crypto-js'

const emit = defineEmits(['success', 'fail'])

const imgWidth = 310
const imgHeight = 155
const sliderSize = 55

const loading = ref(true)
const error = ref(null)
const verified = ref(false)
const bgImage = ref('')
const sliderImage = ref('')
const sliderLeft = ref(0)
const captchaToken = ref('')
const secretKey = ref('')

const bgRef = ref(null)
let isDragging = false
let startX = 0
let startLeft = 0

// 加载验证码
const loadCaptcha = async () => {
  loading.value = true
  error.value = null
  verified.value = false
  sliderLeft.value = 0
  try {
    const res = await getCaptcha()
    if (res.repCode === '0000' || res.code === 200) {
      const data = res.repData || res.data
      bgImage.value = 'data:image/png;base64,' + data.originalImageBase64
      sliderImage.value = 'data:image/png;base64,' + data.jigsawImageBase64
      captchaToken.value = data.token
      secretKey.value = data.secretKey
    } else {
      error.value = '验证码加载失败'
    }
  } catch (e) {
    error.value = '验证码加载失败'
  }
  loading.value = false
}

// 加密位置信息
const encryptPoint = (x) => {
  const point = JSON.stringify({ x: Math.round(x), y: 5 })
  const key = CryptoJS.enc.Utf8.parse(secretKey.value)
  const encrypted = CryptoJS.AES.encrypt(point, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

// 校验验证码
const verify = async (x) => {
  try {
    const pointJson = encryptPoint(x)
    const res = await checkCaptcha({
      captchaType: 'blockPuzzle',
      token: captchaToken.value,
      pointJson: pointJson
    })
    if (res.repCode === '0000' || res.code === 200) {
      const data = res.repData || res.data
      verified.value = true
      emit('success', data.captchaVerification)
    } else {
      error.value = res.repMsg || '验证失败，请重试'
      emit('fail')
      setTimeout(() => {
        loadCaptcha()
      }, 1000)
    }
  } catch (e) {
    error.value = '验证失败，请重试'
    emit('fail')
    setTimeout(() => {
      loadCaptcha()
    }, 1000)
  }
}

// 拖拽事件
const onDragStart = (e) => {
  if (verified.value) return
  isDragging = true
  startX = e.clientX || e.touches[0].clientX
  startLeft = sliderLeft.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

const onDragMove = (e) => {
  if (!isDragging) return
  e.preventDefault()
  const clientX = e.clientX || e.touches[0].clientX
  const diff = clientX - startX
  let newLeft = startLeft + diff
  const maxLeft = imgWidth - sliderSize
  if (newLeft < 0) newLeft = 0
  if (newLeft > maxLeft) newLeft = maxLeft
  sliderLeft.value = newLeft
}

const onDragEnd = () => {
  if (!isDragging) return
  isDragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
  // 发送验证
  verify(sliderLeft.value)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
})

defineExpose({ loadCaptcha })

onMounted(() => {
  loadCaptcha()
})
</script>

<style scoped>
.aj-captcha-container {
  width: 100%;
  user-select: none;
}
.captcha-loading {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 10px 0;
}
.captcha-box {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
}
.captcha-bg {
  position: absolute;
  top: 0;
  left: 0;
}
.captcha-bg img {
  display: block;
}
.captcha-slider {
  position: absolute;
  top: 0;
  overflow: hidden;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}
.captcha-track {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 40px;
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
}
.captcha-track-bar {
  height: 100%;
  background: #d1e9ff;
  border-radius: 4px;
  transition: width 0.1s;
}
.captcha-track-bar.captcha-verified {
  background: #d1f5e0;
}
.captcha-track-btn {
  position: absolute;
  top: 2px;
  width: 36px;
  height: 36px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #606266;
  z-index: 2;
  transition: background 0.2s;
}
.captcha-track-btn:hover {
  background: #409eff;
  color: #fff;
}
.captcha-verified-btn {
  background: #67c23a;
  color: #fff;
  cursor: default;
}
.captcha-track-text {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #909399;
  z-index: 1;
  pointer-events: none;
}
.captcha-error {
  color: #f56c6c;
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
}
</style>