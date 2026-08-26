<template>
  <div class="page">
    <PageHeader title="遥感监测" desc="基于多光谱遥感影像的植被指数计算与作物健康监测" />

    <el-card class="form-card" shadow="never">
      <el-form :model="form" label-width="100px" inline>
        <el-form-item label="地块选择">
          <el-select v-model="form.field" placeholder="请选择监测地块" clearable style="width: 220px">
            <el-option label="示范区A-小麦" value="field_a" />
            <el-option label="示范区B-玉米" value="field_b" />
            <el-option label="示范区C-水稻" value="field_c" />
            <el-option label="实验田D-大豆" value="field_d" />
          </el-select>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>

        <el-form-item label="植被指数">
          <el-checkbox-group v-model="form.indicators">
            <el-checkbox label="NDVI">NDVI</el-checkbox>
            <el-checkbox label="EVI">EVI</el-checkbox>
            <el-checkbox label="NDWI">NDWI</el-checkbox>
            <el-checkbox label="LAI">LAI</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            开始分析
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="result-row">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">热力图分布</span>
          </template>
          <div v-if="!hasResult" class="chart-placeholder map-placeholder">
            <el-icon :size="48"><MapLocation /></el-icon>
            <p>植被指数空间分布热力图</p>
            <span class="placeholder-sub">提交分析任务后在此展示结果</span>
          </div>
          <div v-else ref="heatmapChart" class="chart-box map-chart-box"></div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">统计摘要</span>
          </template>
          <div v-if="!hasResult" class="chart-placeholder stats-placeholder">
            <div class="stat-item" v-for="item in statsPreview" :key="item.label">
              <span class="stat-label">{{ item.label }}</span>
              <span class="stat-value">--</span>
              <span class="stat-unit">{{ item.unit }}</span>
            </div>
          </div>
          <div v-else class="stats-filled">
            <div class="stat-item">
              <span class="stat-label">NDVI 均值</span>
              <span class="stat-value">{{ stats.mean }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大值</span>
              <span class="stat-value">{{ stats.max }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最小值</span>
              <span class="stat-value">{{ stats.min }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标准差</span>
              <span class="stat-value">{{ stats.stdDev }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">健康植被占比</span>
              <span class="stat-value">{{ stats.healthyArea }}<span class="stat-unit">%</span></span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="chart-card">
      <template #header>
        <span class="card-title">时序变化曲线</span>
      </template>
      <div v-if="!hasResult" class="chart-placeholder time-series-placeholder">
        <el-icon :size="48"><TrendCharts /></el-icon>
        <p>植被指数时序变化趋势</p>
        <span class="placeholder-sub">选择多个指数后可对比查看趋势变化</span>
      </div>
      <div v-else ref="timeSeriesChart" class="chart-box time-chart-box"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { MapLocation, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import {
  generateHeatmapGrid,
  generateMonitorTimeSeries,
  computeMonitorStats,
} from '@/services/mockData'

interface MonitorForm {
  field: string
  dateRange: [Date, Date] | null
  indicators: string[]
}

const form = reactive<MonitorForm>({
  field: '',
  dateRange: null,
  indicators: ['NDVI'],
})

const loading = ref(false)
const hasResult = ref(false)

const stats = reactive({
  mean: 0,
  max: 0,
  min: 0,
  stdDev: 0,
  healthyArea: 0,
})

const statsPreview = [
  { label: 'NDVI 均值', unit: '' },
  { label: '最大值', unit: '' },
  { label: '最小值', unit: '' },
  { label: '标准差', unit: '' },
  { label: '健康植被占比', unit: '%' },
]

// ── Chart refs ──
const heatmapChart = ref<HTMLElement>()
const timeSeriesChart = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

// ── Heatmap ──
function initHeatmap() {
  if (!heatmapChart.value) return
  const c = echarts.init(heatmapChart.value)
  charts.push(c)

  const { rows, cols, data } = generateHeatmapGrid(form.field || 'default')

  // 生成行/列标签（模拟经纬度或网格编号）
  const xLabels = Array.from({ length: cols }, (_, i) => `C${i + 1}`)
  const yLabels = Array.from({ length: rows }, (_, i) => `R${rows - i}`)

  c.setOption({
    tooltip: {
      formatter: (p: any) =>
        `网格 [${p.value[0]},${p.value[1]}]<br/>NDVI: <b>${p.value[2].toFixed(3)}</b>`,
    },
    grid: { left: 55, right: 30, top: 20, bottom: 35 },
    xAxis: {
      type: 'category',
      data: xLabels,
      splitArea: { show: true },
      axisLabel: { fontSize: 10, color: '#909399' },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
    },
    yAxis: {
      type: 'category',
      data: yLabels,
      splitArea: { show: true },
      axisLabel: { fontSize: 10, color: '#909399' },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: 'vertical',
      right: 8,
      top: 'center',
      itemHeight: 180,
      text: ['高', '低'],
      textStyle: { color: '#606266', fontSize: 11 },
      inRange: {
        color: ['#f56c6c', '#f0ad4e', '#e6d933', '#a8e66c', '#409EFF', '#1a7a3a'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)',
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
      },
    ],
  })
}

// ── Time Series ──
function initTimeSeries() {
  if (!timeSeriesChart.value) return
  const c = echarts.init(timeSeriesChart.value)
  charts.push(c)

  const startDate = form.dateRange?.[0]
    ? form.dateRange[0].toISOString().slice(0, 10)
    : '2026-03-01'
  const endDate = form.dateRange?.[1]
    ? form.dateRange[1].toISOString().slice(0, 10)
    : '2026-07-10'

  const { dates, series } = generateMonitorTimeSeries(
    startDate,
    endDate,
    form.indicators,
  )

  const yAxisConfig: Record<string, { name: string; min?: number; max?: number }> = {
    NDVI: { name: 'NDVI', min: 0, max: 1 },
    EVI: { name: 'EVI', min: 0, max: 1 },
    NDWI: { name: 'NDWI', min: 0, max: 1 },
    LAI: { name: 'LAI', min: 0, max: 6 },
  }

  const hasLAI = form.indicators.includes('LAI')

  const yAxes: any[] = [
    {
      type: 'value',
      name: '指数值',
      min: 0,
      max: 1,
      axisLabel: { fontSize: 10, color: '#909399' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      nameTextStyle: { fontSize: 10, color: '#909399' },
    },
  ]

  if (hasLAI) {
    yAxes.push({
      type: 'value',
      name: 'LAI',
      min: 0,
      max: 6,
      axisLabel: { fontSize: 10, color: '#909399' },
      splitLine: { show: false },
      nameTextStyle: { fontSize: 10, color: '#909399' },
    })
  }

  c.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133', fontSize: 12 },
    },
    legend: {
      data: series.map((s) => s.name),
      textStyle: { fontSize: 11, color: '#606266' },
      top: 0,
    },
    grid: { left: 50, right: hasLAI ? 60 : 30, top: 35, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        fontSize: 10,
        color: '#909399',
        rotate: 30,
        formatter: (v: string) => v.slice(5), // MM-DD
      },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
    },
    yAxis: yAxes,
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      yAxisIndex: s.name === 'LAI' && hasLAI ? 1 : 0,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: s.color + '40' },
          { offset: 1, color: s.color + '05' },
        ]),
      },
    })),
  })
}

// ── Handle submit ──
const handleSubmit = async () => {
  loading.value = true
  // 模拟分析延迟
  await new Promise((r) => setTimeout(r, 1500))
  loading.value = false

  // 计算统计
  const { data } = generateHeatmapGrid(form.field || 'default')
  const s = computeMonitorStats(data)
  stats.mean = Math.round(s.mean * 1000) / 1000
  stats.max = Math.round(s.max * 1000) / 1000
  stats.min = Math.round(s.min * 1000) / 1000
  stats.stdDev = Math.round(s.stdDev * 1000) / 1000
  stats.healthyArea = Math.round(s.healthyArea * 10) / 10

  hasResult.value = true

  await nextTick()
  // 清理旧图表再重建
  charts.forEach((c) => c.dispose())
  charts = []
  initHeatmap()
  initTimeSeries()
}

// ── Resize ──
function handleResize() {
  charts.forEach((c) => c.resize())
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach((c) => c.dispose())
})
</script>

<style scoped>
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
}

.form-card {
  margin-bottom: 16px;
}

.result-row {
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

/* ── Placeholder ── */
.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 280px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  color: #909399;
}

.chart-placeholder p {
  margin: 12px 0 4px;
  font-size: 16px;
  color: #606266;
}

.placeholder-sub {
  font-size: 14px;
  color: #c0c4cc;
}

.map-placeholder {
  height: 360px;
}

.stats-placeholder {
  height: 360px;
  justify-content: flex-start;
  padding: 20px;
  gap: 16px;
}

.time-series-placeholder {
  height: 300px;
}

/* ── ECharts box ── */
.chart-box {
  width: 100%;
}

.map-chart-box {
  height: 360px;
}

.time-chart-box {
  height: 300px;
}

/* ── Stats ── */
.stats-filled {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0;
  height: 360px;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-label {
  flex: 1;
  font-size: 15px;
  color: #606266;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin-right: 4px;
}

.stat-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 2px;
}
</style>
