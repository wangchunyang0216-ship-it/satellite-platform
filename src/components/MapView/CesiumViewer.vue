<template>
  <div class="cesium-viewer">
    <div ref="cesiumContainer" class="cesium-container"></div>

    <div class="cesium-toolbar">
      <el-select v-model="basemap" @change="setBasemap" size="small" style="width:100px">
        <el-option label="卫星图" value="satellite" />
        <el-option label="街道图" value="street" />
      </el-select>

      <div class="exag-slider">
        <span class="exag-label">地形起伏</span>
        <el-slider v-model="terrainExaggeration" :min="1" :max="10" :step="1"
          size="small" style="width:80px" @input="onExaggerationChange" />
        <span class="exag-val">{{ terrainExaggeration }}x</span>
      </div>

      <el-tooltip :content="isOrbiting ? '停止环绕' : '环绕'" placement="bottom">
        <el-button class="toolbar-icon-btn" size="small" circle :icon="RefreshRight" @click="toggleOrbit" />
      </el-tooltip>
      <el-tooltip content="复位" placement="bottom">
        <el-button class="toolbar-icon-btn" size="small" circle :icon="Aim" @click="resetView" />
      </el-tooltip>

      <slot name="toolbar-actions"></slot>
    </div>

    <span class="coord-overlay" v-if="mousePos">
      {{ mousePos.lat.toFixed(4) }}°N {{ mousePos.lng.toFixed(4) }}°E
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Aim, RefreshRight } from '@element-plus/icons-vue'
import * as Cesium from 'cesium'
import type { CesiumLayerConfig } from '@/types/cesium'

type BasemapType = 'satellite' | 'street'

const cesiumContainer = ref<HTMLElement>()
const basemap = ref<BasemapType>('satellite')
const terrainExaggeration = ref(6)
const mousePos = ref<{ lat: number; lng: number } | null>(null)
const activeLayersCount = ref(0)
const isOrbiting = ref(false)
let orbitCancel: (() => void) | null = null

let viewer: Cesium.Viewer | null = null
let currentBasemap: Cesium.ImageryLayer | null = null
let labelsLayer: Cesium.ImageryLayer | null = null
const layerMap = new Map<string, Cesium.ImageryLayer>()
const borderMap = new Map<string, Cesium.Entity>()

const BORDER_COLORS: Record<string, Cesium.Color> = {
  calibration: Cesium.Color.VIOLET,
  atmospheric: Cesium.Color.ROYALBLUE,
  geometric: Cesium.Color.CYAN,
  ndvi: Cesium.Color.LIME,
  cloud_detection: Cesium.Color.YELLOW,
  clip: Cesium.Color.RED,
  spectral_index: Cesium.Color.GREEN,
  mosaic: Cesium.Color.MAGENTA,
  fusion: Cesium.Color.DODGERBLUE,
}

const basemapProviders: Record<BasemapType, () => Cesium.ImageryProvider> = {
  satellite: () => new Cesium.UrlTemplateImageryProvider({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maximumLevel: 19,
  }),
  street: () => new Cesium.OpenStreetMapImageryProvider({
    url: 'https://tile.openstreetmap.org/',
    maximumLevel: 19,
  }),
}

// ═══ 城市标注 ═══
function addCityLabels(viewer: Cesium.Viewer) {
  const cities = [
    { name:'武汉', lat:30.58, lng:114.30 },
    { name:'北京', lat:39.90, lng:116.40 },
    { name:'上海', lat:31.23, lng:121.47 },
    { name:'广州', lat:23.13, lng:113.26 },
    { name:'深圳', lat:22.54, lng:114.06 },
    { name:'成都', lat:30.57, lng:104.07 },
    { name:'重庆', lat:29.56, lng:106.55 },
    { name:'西安', lat:34.26, lng:108.94 },
    { name:'南京', lat:32.06, lng:118.80 },
    { name:'杭州', lat:30.25, lng:120.16 },
    { name:'郑州', lat:34.75, lng:113.63 },
    { name:'长沙', lat:28.23, lng:112.94 },
    { name:'合肥', lat:31.82, lng:117.23 },
    { name:'南昌', lat:28.68, lng:115.86 },
    { name:'福州', lat:26.07, lng:119.30 },
    { name:'济南', lat:36.65, lng:117.00 },
    { name:'天津', lat:39.12, lng:117.20 },
    { name:'昆明', lat:25.04, lng:102.70 },
    { name:'贵阳', lat:26.65, lng:106.63 },
    { name:'南宁', lat:22.82, lng:108.37 },
    { name:'海口', lat:20.02, lng:110.35 },
    { name:'拉萨', lat:29.65, lng:91.10 },
    { name:'乌鲁木齐', lat:43.83, lng:87.62 },
    { name:'兰州', lat:36.06, lng:103.83 },
    { name:'西宁', lat:36.62, lng:101.78 },
    { name:'银川', lat:38.47, lng:106.27 },
    { name:'呼和浩特', lat:40.82, lng:111.75 },
    { name:'哈尔滨', lat:45.80, lng:126.53 },
    { name:'长春', lat:43.88, lng:125.32 },
    { name:'沈阳', lat:41.80, lng:123.43 },
    { name:'石家庄', lat:38.05, lng:114.50 },
    { name:'太原', lat:37.87, lng:112.55 },
    { name:'香港', lat:22.30, lng:114.17 },
    { name:'澳门', lat:22.20, lng:113.55 },
    { name:'台北', lat:25.03, lng:121.57 },
    { name:'东京', lat:35.68, lng:139.76 },
    { name:'首尔', lat:37.57, lng:126.98 },
    { name:'曼谷', lat:13.75, lng:100.50 },
    { name:'新加坡', lat:1.35, lng:103.82 },
    { name:'新德里', lat:28.61, lng:77.23 },
    { name:'莫斯科', lat:55.75, lng:37.62 },
  ]
  for (const c of cities) {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(c.lng, c.lat, 0),
      label: {
        text: c.name,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        scale: 0.7,
        translucencyByDistance: new Cesium.NearFarScalar(1e4, 1.0, 1e6, 0.0),
        pixelOffset: new Cesium.Cartesian2(0, -12),
      },
    })
  }
}

// ═══ 初始化 ═══
async function initCesium() {
  if (!cesiumContainer.value) return

  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''
  if (ionToken) Cesium.Ion.defaultAccessToken = ionToken

  viewer = new Cesium.Viewer(cesiumContainer.value, {
    animation: false, timeline: false, baseLayerPicker: false,
    fullscreenButton: false, vrButton: false, geocoder: false,
    homeButton: false, sceneModePicker: false, navigationHelpButton: false,
    infoBox: false, selectionIndicator: false,
    sceneMode: Cesium.SceneMode.SCENE3D,
    creditContainer: document.createElement('div'),
  })

  // 大气 & 光照
  viewer.scene.skyAtmosphere.show = true
  viewer.scene.globe.enableLighting = true
  viewer.scene.globe.showGroundAtmosphere = true

  // 底图
  currentBasemap = viewer.imageryLayers.addImageryProvider(basemapProviders.satellite(), 0)

  // 地名标注图层（Stamen Toner Labels — 透明底纯标注）
  try {
    labelsLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
        maximumLevel: 20,
      }),
      1
    )
  } catch (e) {
    console.warn('[Cesium] 标注瓦片加载失败，使用兜底 Label:', e)
  }

  // 兜底：Cesium 原生 Label 标注主要城市
  addCityLabels(viewer)

  // 地形
  if (ionToken) {
    try {
      console.log('[Cesium] 开始加载地形...')
      const tp = await Cesium.createWorldTerrainAsync({
        requestVertexNormals: true, requestWaterMask: true,
      })
      viewer.terrainProvider = tp
      viewer.scene.globe.terrainExaggeration = terrainExaggeration.value
      console.log('[Cesium] ✅ 地形加载成功，当前夸张度:', terrainExaggeration.value, 'x')
    } catch (e) {
      console.error('[Cesium] ❌ 地形加载失败:', e)
    }
  } else {
    console.warn('[Cesium] ⚠️ 无 Ion Token，地形不可用')
  }

  // 相机：指向武汉北边（大别山余脉，有起伏）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.721, 30.8, 20000),
    orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
  })

  // 鼠标坐标
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const cartesian = viewer!.camera.pickEllipsoid(movement.endPosition, viewer!.scene.globe.ellipsoid)
    if (cartesian) {
      const c = Cesium.Cartographic.fromCartesian(cartesian)
      mousePos.value = { lat: Cesium.Math.toDegrees(c.latitude), lng: Cesium.Math.toDegrees(c.longitude) }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  handler.setInputAction(() => {
    if (isOrbiting.value && orbitCancel) { orbitCancel(); orbitCancel = null; isOrbiting.value = false }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

  emit('ready', viewer)
}

// ═══ 底图 / 地形 ═══
function setBasemap(type: BasemapType) {
  if (!viewer) return
  if (currentBasemap) viewer.imageryLayers.remove(currentBasemap, true)
  currentBasemap = viewer.imageryLayers.addImageryProvider(basemapProviders[type](), 0)
  // 卫星图模式显示地名标注，街道图已有标注则隐藏
  if (labelsLayer) labelsLayer.show = type === 'satellite'
}
function onExaggerationChange(val: number) {
  if (viewer) viewer.scene.globe.terrainExaggeration = val
}

// ═══ 图层管理 ═══
function addLayer(config: CesiumLayerConfig): boolean {
  if (!viewer) return false
  if (layerMap.has(config.id)) return false

  try {
    const provider = new Cesium.SingleTileImageryProvider({
      url: config.imageUrl,
      rectangle: Cesium.Rectangle.fromDegrees(config.west, config.south, config.east, config.north),
      tileWidth: 256,
      tileHeight: 256,
    })
    const layer = viewer.imageryLayers.addImageryProvider(provider)
    layer.alpha = config.opacity
    layerMap.set(config.id, layer)
    // 细边框标记区域
    const rect = Cesium.Rectangle.fromDegrees(config.west, config.south, config.east, config.north)
    const border = viewer.entities.add({
      rectangle: {
        coordinates: rect,
        material: Cesium.Color.TRANSPARENT,
        outline: true,
        outlineColor: BORDER_COLORS[config.service] || Cesium.Color.WHITE,
        outlineWidth: 2,
      },
    })
    borderMap.set(config.id, border)
    activeLayersCount.value = layerMap.size
    return true
  } catch (e) {
    console.error('[Cesium] 添加图层失败:', e)
    return false
  }
}

function removeLayer(id: string): boolean {
  if (!viewer) return false
  const layer = layerMap.get(id)
  if (!layer) return false
  viewer.imageryLayers.remove(layer, true)
  layerMap.delete(id)
  const b = borderMap.get(id)
  if (b) { viewer!.entities.remove(b); borderMap.delete(id) }
  activeLayersCount.value = layerMap.size
  return true
}

function removeAllLayers() {
  if (!viewer) return
  layerMap.forEach((l) => viewer!.imageryLayers.remove(l, true))
  layerMap.clear()
  borderMap.forEach((e) => viewer!.entities.remove(e))
  borderMap.clear()
  activeLayersCount.value = 0
}

function setLayerOpacity(id: string, o: number) {
  const l = layerMap.get(id); if (l) l.alpha = Math.max(0, Math.min(1, o))
}
function setLayerVisible(id: string, v: boolean) {
  const l = layerMap.get(id); if (l) l.show = v
}

// ═══ 相机 ═══
function flyTo(lat: number, lng: number, h = 12000) {
  viewer?.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lng, lat + 0.15, h),
    orientation: { heading: Cesium.Math.toRadians(35), pitch: Cesium.Math.toRadians(-30), roll: 0 },
    duration: 2.0,
  })
}
function orbitAround(lat: number, lng: number, h = 50000) {
  if (!viewer) return
  if (orbitCancel) orbitCancel()
  const center = Cesium.Cartesian3.fromDegrees(lng, lat, 0)
  let animId = 0; let cancelled = false
  function anim() {
    if (cancelled || !viewer) return
    viewer!.camera.lookAt(center, new Cesium.HeadingPitchRange(
      viewer!.camera.heading + Cesium.Math.toRadians(0.3), Cesium.Math.toRadians(-50), h
    ))
    animId = requestAnimationFrame(anim)
  }
  anim()
  orbitCancel = () => { cancelled = true; cancelAnimationFrame(animId); orbitCancel = null; isOrbiting.value = false }
  isOrbiting.value = true
}
function toggleOrbit() {
  if (isOrbiting.value) { if (orbitCancel) { orbitCancel(); orbitCancel = null }; isOrbiting.value = false }
  else orbitAround(30.3, 114.72, 50000)
}
function resetView() {
  if (orbitCancel) { orbitCancel(); orbitCancel = null; isOrbiting.value = false }
  flyTo(30.4, 114.721, 12000)
}

defineExpose({
  getViewer: () => viewer, addLayer, removeLayer, removeAllLayers,
  setLayerOpacity, setLayerVisible, flyTo, resetView,
})

const emit = defineEmits<{ (e: 'ready', viewer: Cesium.Viewer): void }>()

onMounted(async () => { await nextTick(); initCesium() })
onUnmounted(() => { removeAllLayers(); viewer?.destroy(); viewer = null })
</script>

<style scoped>
.cesium-viewer { position: relative; width: 100%; height: 100%; flex: 1; min-height: 0; }
.cesium-viewer :deep(.cesium-viewer-bottom) { display: none !important; }
.cesium-viewer :deep(.cesium-widget-credits) { display: none !important; }
.cesium-container { width: 100%; height: 100%; }
.cesium-toolbar {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%); z-index: 1000;
  min-width: 640px; max-width: calc(100% - 32px);
  display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.95);
  padding: 6px 14px; border-radius: 8px; box-shadow: 0 2px 16px rgba(0,0,0,0.15); flex-wrap: nowrap;
  overflow: hidden;
}
.toolbar-icon-btn { width: 28px; height: 28px; padding: 0; }
.exag-slider { display: flex; align-items: center; gap: 4px; flex-shrink: 0; white-space: nowrap; }
.exag-label { font-size: 13px; color: #606266; }
.exag-val { font-size: 13px; color: #606266; width: 28px; text-align: right; }
.coord-overlay {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 1000;
  font-size: 13px;
  color: rgba(255,255,255,.92);
  font-family: monospace;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(15,23,42,.75);
  pointer-events: none;
}
</style>
