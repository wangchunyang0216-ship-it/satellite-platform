<template>
  <div class="dash-page">
    <header class="dash-header">
      <h1 class="dash-title">遥感卫星数据服务平台 — 运行态势感知</h1>
      <div class="dash-clock">{{ clock }}</div>
    </header>

    <div class="dash-body">
      <!-- 左上：全球数据接入飞线 -->
      <div class="dash-panel">
        <div class="panel-title">全球数据接入实时飞线</div>
        <div ref="globeChart" class="chart-box"></div>
      </div>

      <!-- 右上：核心指标 -->
      <div class="dash-panel panel-metrics">
        <div class="metric-grid">
          <div class="metric-item" v-for="m in metrics" :key="m.label">
            <div class="metric-val" :style="{ color: m.color }">
              <span>{{ m.display }}</span>
            </div>
            <div class="metric-label">{{ m.label }}</div>
            <div class="metric-sub">{{ m.sub }}</div>
          </div>
        </div>
      </div>

      <!-- 左下：数据处理桑基图 -->
      <div class="dash-panel">
        <div class="panel-title">近24小时数据流水线（桑基图）</div>
        <div ref="sankeyChart" class="chart-box"></div>
      </div>

      <!-- 右下：7天趋势 -->
      <div class="dash-panel">
        <div class="panel-title">近7天数据接入与检索趋势</div>
        <div ref="trendChart" class="chart-box"></div>
      </div>
    </div>

    <!-- 底部滚动播报 -->
    <footer class="dash-footer">
      <div class="ticker-wrap">
        <div class="ticker-track" :style="{ transform: `translateX(${tickerOffset}px)` }">
          <span class="ticker-item" v-for="news in tickerLoop" :key="news">{{ news }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  dashboardMetrics, sankeyData,
  sevenDayTrend, tickerNews,
} from '@/services/mockData'

// ── 时钟 ──
const clock = ref('')
let clockTimer: ReturnType<typeof setInterval>

// ── 指标显示值 ──
const fmt = (n: number) => n.toLocaleString()
const metrics = ref([
  { label: '累计数据景数', display: '0', sub: '景', color: '#409EFF', target: dashboardMetrics.totalScenes },
  { label: '覆盖面积',     display: '0', sub: '万 km²', color: '#67C23A', target: dashboardMetrics.coverageArea },
  { label: '服务客户数',   display: '0', sub: '家',     color: '#E6A23C', target: dashboardMetrics.customerCount },
  { label: '今日调用量',   display: '0', sub: '次',     color: '#9B59B6', target: dashboardMetrics.dailyApiCalls },
])

function animateCounters() {
  const duration = 2000
  const fps = 30
  const frames = Math.floor(duration / (1000 / fps))
  let frame = 0

  const timer = setInterval(() => {
    frame++
    const progress = Math.min(frame / frames, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    metrics.value.forEach((m) => {
      m.display = fmt(Math.floor(m.target * eased))
    })
    if (progress >= 1) clearInterval(timer)
  }, 1000 / fps)
}

// ── 底部滚动 ──
const tickerLoop = [...tickerNews, ...tickerNews] // 双份实现无缝循环
let tickerOffset = ref(0)
let tickerTimer: ReturnType<typeof setInterval>

function startTicker() {
  const speed = 0.8   // px per frame
  tickerTimer = setInterval(() => {
    tickerOffset.value -= speed
    // 滚完一半（第一份播完）瞬间回位
    if (tickerOffset.value <= -tickerNews.length * 340) {
      tickerOffset.value = 0
    }
  }, 16)
}

// ── ECharts Refs ──
const globeChart = ref<HTMLElement>()
const sankeyChart = ref<HTMLElement>()
const trendChart = ref<HTMLElement>()

let charts: echarts.ECharts[] = []

// ── 中国地图 + 卫星飞线图（真实 GeoJSON）──
async function initGlobeChart() {
  if (!globeChart.value) return
  const c = echarts.init(globeChart.value)
  charts.push(c)

  // 加载中国 GeoJSON 并注册
  try {
    const geoRes = await fetch('/map/world.json')
    const geoJson = await geoRes.json()
    echarts.registerMap('china', geoJson)
  } catch {
    // 地图加载失败，回退到纯散点模式
  }

  // 地面站（真实经纬度）
  const stations = [
    { name: '北京站', lng: 116.4, lat: 40.0, val: 320 },
    { name: '喀什站', lng: 76.0,  lat: 39.5, val: 210 },
    { name: '三亚站', lng: 109.5, lat: 18.2, val: 180 },
    { name: '武汉站', lng: 114.3, lat: 30.5, val: 150 },
  ]

  // 卫星（全球位置）
  const sats = [
    { name: '哨兵2号', lng: 2.3, lat: 48.8, val: 680 },
    { name: 'Landsat-9', lng: -77.0, lat: 38.9, val: 410 },
    { name: '高分6号', lng: 105.0, lat: 35.0, val: 630 },
  ]

  // 飞线：站 → 卫星
  const linesData = stations.flatMap((st) =>
    sats.map((sa) => ({ from: [st.lng, st.lat] as [number, number], to: [sa.lng, sa.lat] as [number, number], val: st.val + sa.val }))
  )

  const hasMap = !!echarts.getMap('china')

  const series: any[] = [
    // 飞线
    ...linesData.map((fl, idx) => ({
      type: 'lines',
      coordinateSystem: hasMap ? 'geo' : 'cartesian2d',
      polyline: false,
      data: [{ coords: [fl.from, fl.to] }],
      lineStyle: {
        color: ['#409EFF', '#67C23A', '#F39C12', '#9B59B6', '#1ABC9C'][idx % 5],
        width: 0.8,
        opacity: 0.4,
        curveness: 0.25,
      },
      effect: {
        show: true,
        period: 4 + Math.random() * 2,
        trailLength: 0.2,
        symbol: 'arrow',
        symbolSize: 4,
      },
    })),
    // 地面站
    {
      type: 'scatter',
      coordinateSystem: hasMap ? 'geo' : 'cartesian2d',
      data: stations.map((s) => ({ name: s.name, value: hasMap ? [s.lng, s.lat, s.val] : [s.lng, s.lat, s.val] })),
      symbolSize: 14,
      itemStyle: { color: '#409EFF', borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}', color: '#a0c0ff', fontSize: 11, position: 'bottom' },
    },
    // 卫星
    {
      type: 'scatter',
      coordinateSystem: hasMap ? 'geo' : 'cartesian2d',
      data: sats.map((s) => ({ name: s.name, value: hasMap ? [s.lng, s.lat, s.val] : [s.lng, s.lat, s.val] })),
      symbol: 'diamond',
      symbolSize: 12,
      itemStyle: { color: '#67C23A', borderColor: '#fff', borderWidth: 1.5 },
      label: { show: true, formatter: '{b}', color: '#80d080', fontSize: 10, position: 'right' },
    },
  ]

  const option: any = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 20, 40, 0.9)',
      borderColor: '#409EFF',
      textStyle: { color: '#e0e6f0', fontSize: 12 },
    },
    series,
  }

  if (hasMap) {
    option.geo = {
      map: 'china',
      roam: true,
      zoom: 1.5,
      center: [104, 36],
      itemStyle: {
        areaColor: '#0d1a30',
        borderColor: 'rgba(64,158,255,0.35)',
        borderWidth: 0.5,
        shadowColor: 'rgba(64,158,255,0.15)',
        shadowBlur: 20,
      },
      emphasis: {
        itemStyle: { areaColor: '#1a3555' },
        label: { show: false },
      },
    }
    option.series = series
  } else {
    // 回退：无地图时用二维坐标
    option.xAxis = { show: false, min: -180, max: 180 }
    option.yAxis = { show: false, min: -60, max: 80 }
  }

  c.setOption(option)
}

// ── 桑基图 ──
function initSankeyChart() {
  if (!sankeyChart.value) return
  const c = echarts.init(sankeyChart.value)
  charts.push(c)

  c.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [{
      type: 'sankey',
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'left',
      layoutIterations: 0,
      data: sankeyData.nodes.map((n) => ({ name: n.name })),
      links: sankeyData.links.map((l) => ({
        source: l.source,
        target: l.target,
        value: l.value,
      })),
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.3 },
      label: { color: '#a0b4d0', fontSize: 10 },
    }],
  })
}

// ── 趋势双轴图 ──
function initTrendChart() {
  if (!trendChart.value) return
  const c = echarts.init(trendChart.value)
  charts.push(c)

  c.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['数据接入', '检索次数'],
      textStyle: { color: '#a0b4d0', fontSize: 11 },
      top: 0,
    },
    grid: { left: 50, right: 60, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: sevenDayTrend.dates,
      axisLabel: { color: '#607090', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: [
      {
        type: 'value',
        name: '接入量(景)',
        nameTextStyle: { color: '#607090', fontSize: 10 },
        axisLabel: { color: '#607090', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      {
        type: 'value',
        name: '检索(次)',
        nameTextStyle: { color: '#607090', fontSize: 10 },
        axisLabel: { color: '#607090', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '数据接入',
        type: 'bar',
        data: sevenDayTrend.access,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#1a3a5c' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 20,
      },
      {
        name: '检索次数',
        type: 'line',
        yAxisIndex: 1,
        data: sevenDayTrend.search,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#67C23A', width: 2 },
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103,194,58,0.3)' },
            { offset: 1, color: 'rgba(103,194,58,0.02)' },
          ]),
        },
      },
    ],
  })
}

// ── Lifecycle ──
onMounted(async () => {
  clockTimer = setInterval(() => {
    clock.value = new Date().toLocaleString('zh-CN', { hour12: false })
  }, 1000)

  await nextTick()
  initGlobeChart()
  initSankeyChart()
  initTrendChart()
  animateCounters()
  startTicker()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  clearInterval(clockTimer)
  clearInterval(tickerTimer)
  window.removeEventListener('resize', handleResize)
  charts.forEach((c) => c.dispose())
})

function handleResize() {
  charts.forEach((c) => c.resize())
}
</script>

<style scoped>
.dash-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at 50% 0%, #0f1a30 0%, #0a0e27 70%);
  color: #e0e6f0;
  overflow: hidden;
}
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 60px;
  background: linear-gradient(180deg, rgba(16, 24, 60, 0.95), transparent);
  flex-shrink: 0;
}
.dash-title { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 1px; }
.dash-clock { font-size: 19px; font-family: 'Consolas', monospace; opacity: 0.8; }

.dash-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 14px;
  padding: 0 36px 12px;
}
.dash-panel {
  background: rgba(16, 24, 60, 0.55) !important;
  border: 1px solid rgba(64, 158, 255, 0.12) !important;
  border-radius: 8px;
  padding: 12px 16px;
  position: relative;
}
.panel-title {
  font-size: 15px;
  color: #8090b0;
  margin-bottom: 6px;
  font-weight: 500;
}
.chart-box {
  width: 100%;
  height: calc(100% - 24px);
}

/* 指标 */
.panel-metrics {
  display: flex;
  align-items: center;
}
.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}
.metric-item { text-align: center; }
.metric-val {
  font-size: 34px;
  font-weight: 700;
  font-family: 'Consolas', 'Courier New', monospace;
  line-height: 1.1;
}
.metric-label { font-size: 15px; color: #607090; margin-top: 2px; }
.metric-sub  { font-size: 13px; color: #405070; }

/* Footer ticker */
.dash-footer {
  height: 36px;
  background: rgba(16, 24, 60, 0.85);
  border-top: 1px solid rgba(64, 158, 255, 0.08);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
}
.ticker-wrap { width: 100%; overflow: hidden; }
.ticker-track { display: flex; white-space: nowrap; will-change: transform; }
.ticker-item {
  display: inline-block;
  font-size: 14px;
  color: #506080;
  padding: 0 40px;
  flex-shrink: 0;
}
</style>
