<template>
  <div class="page">
    <PageHeader title="数据流水线监控" desc="实时查看数据处理各环节的运行状态和统计数据" />
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6"><StatCard title="今日接入量" :value="1234" unit="景" icon="Download" color="#409EFF" /></el-col>
      <el-col :span="6"><StatCard title="处理成功" :value="1180" unit="景" icon="CircleCheck" color="#67C23A" /></el-col>
      <el-col :span="6"><StatCard title="处理失败" :value="23" unit="景" icon="CircleClose" color="#F56C6C" :trend="-12" /></el-col>
      <el-col :span="6"><StatCard title="队列积压" :value="31" unit="景" icon="Clock" color="#E6A23C" /></el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="14">
        <el-card>
          <div class="chart-title">24小时处理量趋势</div>
          <div ref="hourlyChart" style="height:280px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <div class="chart-title">任务状态分布</div>
          <div ref="pieChart" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top:16px">
      <div class="chart-title">实时处理任务列表</div>
      <el-table :data="taskList" stripe style="margin-top:8px">
        <el-table-column prop="id" label="任务ID" width="140" />
        <el-table-column prop="sceneName" label="影像名" min-width="160" />
        <el-table-column prop="stage" label="当前环节" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.stage === '数据入库' ? 'success' : ''">{{ row.stage }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'success' ? 'success' : 'warning'">{{ row.status === 'success' ? '成功' : '处理中' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import { generate24HourData } from '@/services/mockData'

const hourlyChart = ref<HTMLElement>()
const pieChart = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

const taskList = [
  { id: 'T-20260713-0892', sceneName: 'S2A_MSIL2A_20260713_Wuhan', stage: '数据入库', status: 'success', duration: '3.2s' },
  { id: 'T-20260713-0891', sceneName: 'LC9_L2SP_20260713_Huanggang', stage: '大气校正', status: 'processing', duration: '12.5s' },
  { id: 'T-20260713-0890', sceneName: 'GF6_PMS_20260713_Jingzhou', stage: '辐射定标', status: 'processing', duration: '8.1s' },
  { id: 'T-20260713-0889', sceneName: 'S2A_MSIL2A_20260713_Yichang', stage: '几何校正', status: 'success', duration: '5.6s' },
  { id: 'T-20260713-0888', sceneName: 'WV4_20260712_Xiangyang', stage: '数据入库', status: 'success', duration: '4.8s' },
]

onMounted(async () => {
  await nextTick()
  if (hourlyChart.value) {
    const c = echarts.init(hourlyChart.value)
    charts.push(c)
    const { hours, inbound, processed } = generate24HourData()
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 45, right: 15, top: 10, bottom: 25 },
      xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series: [
        { name: '接入量', type: 'bar', data: inbound, itemStyle: { color: '#409EFF', borderRadius: [3,3,0,0] }, barWidth: 8 },
        { name: '处理量', type: 'bar', data: processed, itemStyle: { color: '#67C23A', borderRadius: [3,3,0,0] }, barWidth: 8 },
      ],
      legend: { data: ['接入量', '处理量'], bottom: 0, textStyle: { fontSize: 10 } },
    })
  }

  if (pieChart.value) {
    const c = echarts.init(pieChart.value)
    charts.push(c)
    c.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie', radius: ['50%', '75%'], center: ['50%', '55%'],
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
        data: [
          { value: 1180, name: '成功', itemStyle: { color: '#67C23A' } },
          { value: 23, name: '失败', itemStyle: { color: '#F56C6C' } },
          { value: 31, name: '处理中', itemStyle: { color: '#E6A23C' } },
        ],
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
.stat-row { margin-top: 8px; }
.chart-title { font-size: 16px; font-weight: 500; color: #303133; margin-bottom: 4px; }
</style>
