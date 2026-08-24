<template>
  <div class="verify-slide-wrap" :style="wrapStyle">
    <!-- 图片区域 -->
    <div class="verify-img-area" :style="imgAreaStyle">
      <!-- 背景图 -->
      <img
        v-if="bgImg"
        :src="'data:image/png;base64,' + bgImg"
        class="verify-bg-img"
        :style="imgAreaStyle"
        ref="bgImgRef"
        @load="onBgImgLoad"
        draggable="false"
      />
      <!-- 滑块拼图：按后端切图原始尺寸渲染，避免与底图缺口大小不符 -->
      <img
        v-if="jkImg"
        :src="'data:image/png;base64,' + jkImg"
        class="verify-jk-img"
        :style="{ top: top + 'px', left: left + 'px' }"
        @load="onJkImgLoad"
        draggable="false"
      />
      <!-- 刷新按钮 -->
      <div class="verify-refresh" @click="refresh" title="刷新">
        <svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M918.4 512c0-223.2-174.4-405.6-393.6-418.4V32L416 134.4l108.8 102.4V174c176 12.8 313.6 160 313.6 338 0 187.2-152 338-338 338-187.2 0-338-152-338-338 0-84.8 32-163.2 84.8-222.4l-57.6-57.6C124.8 300.8 83.2 398.4 83.2 512c0 229.6 186.4 416 416 416s416-186.4 416-416h3.2z" fill="currentColor"/></svg>
      </div>
      <!-- 加载状态 -->
      <div v-if="loading" class="verify-loading">
        <span>加载中...</span>
      </div>
    </div>

    <!-- 滑块拖拽区域 -->
    <div class="verify-slider-bar" :class="{ 'is-active': isDragging, 'is-success': isSuccess, 'is-error': isError }">
      <div class="slider-track">
        <div class="slider-fill" :style="{ width: sliderLeft + 'px' }"></div>
        <div
          class="slider-handle"
          :style="{ left: sliderLeft + 'px' }"
          @mousedown="onDragStart"
          @touchstart.prevent="onDragStart"
        >
          <span v-if="!isDragging && !isSuccess && !isError">&rarr;</span>
          <span v-else-if="isSuccess">&check;</span>
          <span v-else-if="isError">&times;</span>
        </div>
      </div>
      <div class="slider-tip" v-show="!isDragging && !isSuccess && !isError">
        向右拖动滑块完成验证
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import CryptoJS from 'crypto-js'
import { getCaptcha, checkCaptcha } from '@/api/login'

const props = defineProps({
  captchaType: { type: String, default: 'blockPuzzle' },
  // 尺寸对齐 aj-captcha 原生底图 310×155，避免横向拉伸
  imgSize: { type: Object, default: () => ({ width: '310px', height: '155px' }) }
})

const emit = defineEmits(['success', 'fail', 'close'])

// 尺寸解析（blockSize 仅作为拼图块未加载前的占位默认值，真实尺寸由 onJkImgLoad 读取）
const blockSize = { width: 55, height: 55 }
const blockW = ref(blockSize.width)
const blockH = ref(blockSize.height)
// 底图实际渲染元素 + 原生宽度（后端切图固定 310×155），用于把"渲染像素拖拽距离"换算回"底图坐标"
const bgImgRef = ref(null)
const bgNaturalW = ref(310)
const wrapStyle = computed(() => ({ width: props.imgSize.width }))
const imgAreaStyle = computed(() => ({
  width: props.imgSize.width,
  height: props.imgSize.height
}))

// 状态
const bgImg = ref('')
const jkImg = ref('')
const token = ref('')
const secretKey = ref('')
const top = ref(0)
const left = ref(0)
// 后端 get 返回的拼图缺口纵坐标（point.y），用于正确摆放拼图
const pointY = ref(5)
const loading = ref(false)
const isDragging = ref(false)
const isSuccess = ref(false)
const isError = ref(false)
const sliderLeft = ref(0)

let startX = 0
let isBindMove = false

// 解析图片宽高
const imgWidth = computed(() => parseInt(props.imgSize.width))
const imgHeight = computed(() => parseInt(props.imgSize.height))

// 获取验证码
async function getCaptchaData() {
  loading.value = true
  resetState()
  try {
    const res = await getCaptcha()
    // 兼容两种响应格式
    let data = null
    if (res.repCode === '0000') {
      data = res.repData
    } else if (res.code === 200) {
      data = res.data
    } else if (res.repData) {
      data = res.repData
    }
    if (data) {
      bgImg.value = data.originalImageBase64
      jkImg.value = data.jigsawImageBase64
      token.value = data.token
      secretKey.value = data.secretKey
      // 读取后端返回的拼图缺口纵坐标 point.y（本库 get 返回 point=null，默认 5 即可）
      let y = 5
      if (data.point != null) {
        let p = data.point
        if (typeof p === 'string') {
          try { p = JSON.parse(p) } catch (e) { p = null }
        }
        if (p && typeof p === 'object' && p.y !== undefined) {
          y = Number(p.y)
        }
      }
      pointY.value = y
      // 关键：后端缺口按 y=0 切图（模板高度 155 == 底图高度 155，point.y 恒为 5 仅是校验秘密值，接口返回 null），
      // 拼图块内部形状同样位于 y=0，故 top 必须为 0；top=5 会导致拼图块比缺口低 5px（此前"y轴不匹配"的根因）
      top.value = 0
      left.value = 0
    }
  } catch (e) {
    console.error('获取验证码失败', e)
  } finally {
    loading.value = false
  }
}

// 刷新
function refresh() {
  getCaptchaData()
}

// 拼图块加载完成后读取真实宽高（用于与底图缺口 1:1 对齐、以及拖拽限位）
function onJkImgLoad(e) {
  const img = e.target
  if (img && img.naturalWidth) {
    blockW.value = img.naturalWidth
    blockH.value = img.naturalHeight
  }
}

// 底图加载后记录其原生宽度，用于拖拽距离归一化
function onBgImgLoad(e) {
  const img = e.target
  if (img && img.naturalWidth) {
    bgNaturalW.value = img.naturalWidth
  }
}

// 重置状态
function resetState() {
  isDragging.value = false
  isSuccess.value = false
  isError.value = false
  sliderLeft.value = 0
  left.value = 0
}

// 加密滑块明文点位（用于 /captcha/check 的 pointJson 字段，后端 decrypt 后得到这段明文）
function encryptPoint(plainPointJson) {
  const key = CryptoJS.enc.Utf8.parse(secretKey.value)
  // 后端 check 对 y 是严格相等校验（stored.y == client.y），而本库模板高度==底图高度时 stored.y 恒为 5；
  // 接口不返回 point（null），前端按默认 5 提交即可通过 y 校验。6111 的根因是 x 未按渲染宽度归一化。
  const encrypted = CryptoJS.AES.encrypt(plainPointJson, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

// 生成 captchaVerification：AES(token + "---" + 明文点位JSON, secretKey)
// 必须与后端 check 写入的二次校验缓存 key 完全一致（后端 check 用解密后的明文点位拼接再加密），
// 因此这里只能喂明文点位，绝不能把加密后的密文再加密一次，否则登录接口的 verification 必然失败（API_CAPTCHA_INVALID）。
function generateCaptchaVerification(plainPointJson) {
  const key = CryptoJS.enc.Utf8.parse(secretKey.value)
  const verification = token.value + '---' + plainPointJson
  const encrypted = CryptoJS.AES.encrypt(verification, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

// 拖拽开始
function onDragStart(e) {
  if (isSuccess.value || loading.value) return
  isDragging.value = true
  isError.value = false
  startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX
  isBindMove = true
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove)
  document.addEventListener('touchend', onDragEnd)
}

// 拖拽中
function onDragMove(e) {
  if (!isBindMove) return
  const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
  let moveX = clientX - startX
  const maxLeft = Math.max(0, imgWidth.value - blockW.value)
  if (moveX < 0) moveX = 0
  if (moveX > maxLeft) moveX = maxLeft
  sliderLeft.value = moveX
  left.value = moveX
}

// 拖拽结束
async function onDragEnd() {
  if (!isBindMove) return
  isBindMove = false
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)

  // 拖拽距离是"渲染像素"，必须按 原生宽度/实际渲染宽度 换算回底图坐标：
  // 例如 login.vue 曾传 330px 渲染（原生 310px），直接提交会使 x 偏大 330/310≈1.065 倍，超出后端 ±5px 容差 → 6111
  const renderW = bgImgRef.value ? bgImgRef.value.getBoundingClientRect().width : imgWidth.value
  const pointX = Math.round(sliderLeft.value * bgNaturalW.value / (renderW || bgNaturalW.value))
  if (pointX < 5) {
    // 滑动距离太短，重置
    resetState()
    return
  }

  // 明文点位 JSON：check 的 pointJson 用它加密，captchaVerification 也用它拼接，二者必须同源
  const plainPoint = JSON.stringify({ x: pointX, y: pointY.value })
  const encryptedPoint = encryptPoint(plainPoint)
  const captchaVerification = generateCaptchaVerification(plainPoint)

  try {
    const res = await checkCaptcha({
      captchaType: props.captchaType,
      token: token.value,
      pointJson: encryptedPoint
    })
    // 兼容两种响应格式
    let success = false
    let repData = ''
    if (res.repCode === '0000') {
      success = true
      repData = res.repData
    } else if (res.code === 200) {
      success = true
      repData = res.data
    }
    if (success) {
      isSuccess.value = true
      // repData 可能是字符串或对象
      const verification = typeof repData === 'string' ? repData : captchaVerification
      emit('success', { captchaVerification: verification })
    } else {
      isError.value = true
      emit('fail')
      setTimeout(() => {
        refresh()
      }, 800)
    }
  } catch (err) {
    console.error('验证码校验失败', err)
    isError.value = true
    emit('fail')
    setTimeout(() => {
      refresh()
    }, 800)
  }
}

onMounted(() => {
  getCaptchaData()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
})

defineExpose({ refresh })
</script>

<style scoped>
.verify-slide-wrap {
  background: #fff;
  user-select: none;
  /* 防止被外层 flex 容器（如 el-form-item）压缩导致底图变形 */
  flex-shrink: 0;
}
.verify-img-area {
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}
.verify-bg-img {
  display: block;
  width: 100%;
  height: 100%;
  /* 覆盖全局 img { width:100% } / max-width:100% 对底图的拉伸 */
  max-width: none;
}
.verify-jk-img {
  position: absolute;
  z-index: 2;
  /* 拼图块按后端切图原始尺寸渲染，禁止被全局样式缩放 */
  max-width: none;
}
.verify-refresh {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  transition: background 0.2s;
}
.verify-refresh:hover {
  background: rgba(0, 0, 0, 0.7);
}
.verify-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  z-index: 4;
}

/* 滑块条 */
.verify-slider-bar {
  position: relative;
  height: 40px;
  margin-top: 10px;
  background: #e8e8e8;
  border-radius: 20px;
  overflow: hidden;
}
.slider-track {
  position: relative;
  height: 100%;
}
.slider-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 20px 0 0 20px;
  transition: background 0.3s;
}
.verify-slider-bar .slider-fill {
  background: rgba(69, 154, 245, 0.15);
}
.verify-slider-bar.is-active .slider-fill {
  background: rgba(69, 154, 245, 0.25);
}
.verify-slider-bar.is-success .slider-fill {
  background: rgba(82, 196, 26, 0.2);
}
.verify-slider-bar.is-error .slider-fill {
  background: rgba(245, 69, 69, 0.2);
}

.slider-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 2;
  font-size: 18px;
  color: #459af5;
  transition: background 0.3s, color 0.3s;
}
.slider-handle:active {
  cursor: grabbing;
}
.verify-slider-bar.is-success .slider-handle {
  background: #52c41a;
  color: #fff;
}
.verify-slider-bar.is-error .slider-handle {
  background: #f54545;
  color: #fff;
}

.slider-tip {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #999;
  pointer-events: none;
}
</style>
