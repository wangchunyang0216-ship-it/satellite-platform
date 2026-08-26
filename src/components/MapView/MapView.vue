<template>
  <div class="map-view">
    <div ref="mapContainer" class="map-container"></div>

    <!-- 绘制工具条 -->
    <div class="draw-toolbar">
      <el-button-group>
        <el-button size="small" :type="drawMode === 'bbox' ? 'primary' : 'default'" @click="setDrawMode('bbox')">
          <el-icon><svg viewBox="0 0 24 24" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="2"/></svg></el-icon>
          框选
        </el-button>
        <el-button size="small" :type="drawMode === 'polygon' ? 'primary' : 'default'" @click="setDrawMode('polygon')">
          <el-icon><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2L2 22h20L12 2z"/></svg></el-icon>
          多边形
        </el-button>
        <el-button size="small" @click="clearDraw">
          <el-icon><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></el-icon>
          清除
        </el-button>
      </el-button-group>

      <!-- 底图切换 -->
      <el-select :model-value="basemap" @change="setBasemap" size="small" style="width: 120px; margin-left: 8px">
        <el-option label="卫星影像" value="satellite" />
        <el-option label="街道地图" value="street" />
        <el-option label="地形图" value="terrain" />
      </el-select>

      <!-- 坐标显示 -->
      <span class="coord-display" v-if="mouseLatlng">
        {{ mouseLatlng.lat.toFixed(4) }}°N, {{ mouseLatlng.lng.toFixed(4) }}°E
      </span>
    </div>

    <!-- 检索结果数量提示 -->
    <div class="result-badge" v-if="footprintCount > 0">
      当前检索结果：{{ footprintCount }} 景影像
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'

type DrawMode = 'bbox' | 'polygon' | null
type BasemapType = 'satellite' | 'street' | 'terrain'

const mapContainer = ref<HTMLElement>()
const drawMode = ref<DrawMode>(null)
const basemap = ref<BasemapType>('satellite')
const mouseLatlng = ref<{ lat: number; lng: number } | null>(null)
const footprintCount = ref(0)

let map: L.Map | null = null
let drawnLayer: L.Rectangle | L.Polygon | null = null
let tempRect: L.Rectangle | null = null
let tempPoints: [number, number][] = []
let tempPolygon: L.Polygon | null = null
let drawStart: L.LatLng | null = null

// 底图 URL
const tileUrls: Record<BasemapType, string> = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  terrain: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
}

const tileAttrs: Record<BasemapType, string> = {
  satellite: 'Esri, Maxar, Earthstar Geographics',
  street: '© OpenStreetMap contributors',
  terrain: 'Esri, USGS',
}

let tileLayer: L.TileLayer

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {
    center: [30.585, 114.721],  // 武汉阳逻农业区
    zoom: 10,
    zoomControl: true,
    attributionControl: true,
  })

  tileLayer = L.tileLayer(tileUrls.satellite, {
    attribution: tileAttrs.satellite,
    maxZoom: 19,
  }).addTo(map)

  // 鼠标坐标跟踪
  map.on('mousemove', (e: L.LeafletMouseEvent) => {
    mouseLatlng.value = { lat: e.latlng.lat, lng: e.latlng.lng }
  })

  // 地图点击 — 多边形模式
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (drawMode.value === 'polygon') {
      tempPoints.push([e.latlng.lat, e.latlng.lng])
      if (tempPolygon) map!.removeLayer(tempPolygon)
      tempPolygon = L.polygon(tempPoints, {
        color: '#409EFF',
        fillColor: '#409EFF',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map!)
      // 双击完成
      tempPolygon.on('dblclick', () => finishPolygon())
    }
  })

  // 框选模式 — mousedown/mousemove/mouseup
  map.on('mousedown', (e: L.LeafletMouseEvent) => {
    if (drawMode.value !== 'bbox') return
    drawStart = e.latlng
    map!.dragging.disable()
  })

  map.on('mousemove', (e: L.LeafletMouseEvent) => {
    if (drawMode.value !== 'bbox' || !drawStart) return
    if (tempRect) map!.removeLayer(tempRect)
    tempRect = L.rectangle(L.latLngBounds(drawStart, e.latlng), {
      color: '#409EFF',
      fillColor: '#409EFF',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '6, 6',
    }).addTo(map!)
  })

  map.on('mouseup', (e: L.LeafletMouseEvent) => {
    if (drawMode.value !== 'bbox' || !drawStart) return
    map!.dragging.enable()

    // 框太小忽略
    const bounds = L.latLngBounds(drawStart, e.latlng)
    if (bounds.toBBoxString() === L.latLngBounds(e.latlng, e.latlng).toBBoxString()) {
      drawStart = null
      return
    }

    finishBbox(bounds)
    drawStart = null
  })
}

function setDrawMode(mode: DrawMode) {
  if (drawMode.value === mode) {
    drawMode.value = null
    return
  }
  drawMode.value = mode
  if (mode === 'polygon') {
    map?.dragging.enable()
  }
}

function finishBbox(bounds: L.LatLngBounds) {
  if (drawnLayer) map!.removeLayer(drawnLayer)
  if (tempRect) { map!.removeLayer(tempRect); tempRect = null }
  drawnLayer = L.rectangle(bounds, {
    color: '#67C23A',
    fillColor: '#67C23A',
    fillOpacity: 0.2,
    weight: 2,
  }).addTo(map!)
  drawMode.value = null
  emitDraw(bounds)
}

function finishPolygon() {
  if (drawnLayer) map!.removeLayer(drawnLayer)
  if (tempPolygon) {
    drawnLayer = L.polygon(tempPoints, {
      color: '#67C23A',
      fillColor: '#67C23A',
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map!)
    map!.removeLayer(tempPolygon)
    tempPolygon = null
  }
  drawMode.value = null
  const latlngs = tempPoints.map(([lat, lng]) => L.latLng(lat, lng))
  emitDraw(L.latLngBounds(latlngs))
  tempPoints = []
}

function clearDraw() {
  if (drawnLayer) { map!.removeLayer(drawnLayer); drawnLayer = null }
  if (tempRect) { map!.removeLayer(tempRect); tempRect = null }
  if (tempPolygon) { map!.removeLayer(tempPolygon); tempPolygon = null }
  tempPoints = []
  drawStart = null
  drawMode.value = null
  footprintCount.value = 0
}

function setBasemap(type: BasemapType) {
  basemap.value = type
  if (tileLayer && map) {
    map.removeLayer(tileLayer)
    tileLayer = L.tileLayer(tileUrls[type], {
      attribution: tileAttrs[type],
      maxZoom: 19,
    }).addTo(map)
  }
}

const emit = defineEmits<{
  (e: 'draw', bounds: { north: number; south: number; east: number; west: number }): void
}>()

function emitDraw(bounds: L.LatLngBounds) {
  emit('draw', {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  })
}

// 暴露给父组件的方法
defineExpose({
  getMap: () => map,
  setFootprintCount: (n: number) => { footprintCount.value = n },
  flyTo: (lat: number, lng: number, zoom = 14) => map?.flyTo([lat, lng], zoom),
})

onMounted(async () => {
  await nextTick()
  initMap()
})

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<style scoped>
.map-view {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}
.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}
.draw-toolbar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 6px 10px;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
.coord-display {
  font-size: 14px;
  color: #606266;
  font-family: monospace;
  margin-left: 8px;
}
.result-badge {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.4);
}
</style>
