<template>
  <div class="page">
    <PageHeader title="统计看板" desc="核心业务数据可视化总览" />

    <el-row :gutter="16">
      <el-col :span="6"><StatCard title="总数据量" :value="156800" unit="景" icon="TrendCharts" color="#409EFF" /></el-col>
      <el-col :span="6"><StatCard title="今日接入" :value="423" unit="景" icon="Download" color="#67C23A" :trend="8" /></el-col>
      <el-col :span="6"><StatCard title="今日检索" :value="2891" unit="次" icon="Search" color="#E6A23C" /></el-col>
      <el-col :span="6"><StatCard title="今日下载" :value="567" unit="景" icon="Upload" color="#9B59B6" :trend="-3" /></el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="14">
        <el-card>
          <div class="chart-title">近30天数据接入与下载趋势</div>
          <div ref="trend30Chart" style="height:280px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <div class="chart-title">各上游数据源数据量排名</div>
          <div ref="sourceBarChart" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card>
          <div class="chart-title">计算服务使用分布</div>
          <div ref="computePieChart" style="height:280px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div class="chart-title">区域数据覆盖热力</div>
          <div ref="regionHeatChart" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'

const trend30Chart = ref<HTMLElement>()
const sourceBarChart = ref<HTMLElement>()
const computePieChart = ref<HTMLElement>()
const regionHeatChart = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

onMounted(async () => {
  await nextTick()

  // 30天趋势
  if (trend30Chart.value) {
    const c = echarts.init(trend30Chart.value)
    charts.push(c)
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 6, 14 - 29 + i)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    const access = dates.map(() => Math.floor(280 + Math.random() * 200))
    const download = dates.map(() => Math.floor(150 + Math.random() * 180))

    c.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['接入量', '下载量'], bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 45, right: 15, top: 10, bottom: 30 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 9, color: '#909399', interval: 4 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#909399' }, splitLine: { lineStyle: { color: '#f5f5f5' } } },
      series: [
        {
          name: '接入量', type: 'line', data: access, smooth: true, symbol: 'none',
          lineStyle: { color: '#409EFF', width: 2 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(64,158,255,0.25)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }]) },
        },
        {
          name: '下载量', type: 'line', data: download, smooth: true, symbol: 'none',
          lineStyle: { color: '#67C23A', width: 2 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(103,194,58,0.25)' }, { offset: 1, color: 'rgba(103,194,58,0.02)' }]) },
        },
      ],
    })
  }

  // 数据源排名
  if (sourceBarChart.value) {
    const c = echarts.init(sourceBarChart.value)
    charts.push(c)
    const sources = ['哨兵2号', '高分6号', 'Landsat-9', 'PlanetScope', 'WorldView-4']
    const counts = [48500, 36200, 29800, 21500, 12800]
    const colors = ['#409EFF', '#67C23A', '#E6A23C', '#9B59B6', '#F56C6C']

    c.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 80, right: 40, top: 8, bottom: 8 },
      xAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#909399' }, splitLine: { lineStyle: { color: '#f5f5f5' } } },
      yAxis: {
        type: 'category', data: sources, axisLabel: { fontSize: 11, color: '#606266' },
        inverse: true, axisLine: { lineStyle: { color: '#dcdfe6' } },
      },
      series: [{
        type: 'bar',
        data: sources.map((_, i) => ({ value: counts[i], itemStyle: { color: colors[i], borderRadius: [0, 4, 4, 0] } })),
        barWidth: 20,
        label: { show: true, position: 'right', formatter: (p: any) => `${(p.value / 1000).toFixed(1)}k`, fontSize: 10, color: '#606266' },
      }],
    })
  }

  // 计算服务分布
  if (computePieChart.value) {
    const c = echarts.init(computePieChart.value)
    charts.push(c)
    c.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)' },
      legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { fontSize: 11 } },
      series: [{
        type: 'pie', radius: ['48%', '75%'], center: ['38%', '50%'],
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
        data: [
          { value: 1840, name: '遥感监测', itemStyle: { color: '#67C23A' } },
          { value: 1320, name: '智能识别', itemStyle: { color: '#409EFF' } },
          { value: 860, name: '变化检测', itemStyle: { color: '#E6A23C' } },
          { value: 520, name: '产量预估', itemStyle: { color: '#9B59B6' } },
        ],
      }],
    })
  }

  // 区域覆盖热力
  if (regionHeatChart.value) {
    const c = echarts.init(regionHeatChart.value)
    charts.push(c)
    const regions = ['华北', '东北', '华东', '华中', '华南', '西南', '西北']
    const heatData: [number, number, number][] = []
    regions.forEach((_, ri) => {
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach((_, ci) => {
        heatData.push([ci, ri, Math.floor(300 + Math.random() * 800)])
      })
    })

    c.setOption({
      tooltip: { formatter: (p: any) => `${regions[p.value[1]]} Q${p.value[0] + 1}<br/>接入量: <b>${p.value[2]}</b> 景` },
      grid: { left: 60, right: 20, top: 10, bottom: 25 },
      xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], axisLabel: { fontSize: 10, color: '#909399' } },
      yAxis: { type: 'category', data: regions, axisLabel: { fontSize: 10, color: '#606266' } },
      visualMap: {
        min: 300, max: 1100, calculable: true, orient: 'vertical', right: 6, top: 'center',
        itemHeight: 160, textStyle: { color: '#606266', fontSize: 10 },
        inRange: { color: ['#f0f5ff', '#bdd4f5', '#7eaae3', '#409EFF', '#1a5fb4'] },
      },
      series: [{
        type: 'heatmap', data: heatData,
        label: { show: true, fontSize: 10, color: '#606266' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' } },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
      }],
    })
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach((c) => c.dispose())
})

function handleResize() { charts.forEach((c) => c.resize()) }
</script>

<style scoped>
.page { max-width: 1200px; }
.chart-title { font-size: 16px; font-weight: 500; color: #303133; margin-bottom: 4px; }
</style>
