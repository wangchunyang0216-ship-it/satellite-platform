<template>
  <div class="page">
    <PageHeader title="变化检测" desc="对比不同时期影像，自动识别地表变化区域" />

    <el-card class="form-card" shadow="never">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="变化前影像">
              <el-select v-model="form.beforeScene" placeholder="选择变化前场景" clearable style="width: 100%">
                <el-option label="2023-Q2 华北平原L2A" value="before_01" />
                <el-option label="2023-Q1 东北地区L2A" value="before_02" />
                <el-option label="2022-Q4 长江流域L2A" value="before_03" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="变化后影像">
              <el-select v-model="form.afterScene" placeholder="选择变化后场景" clearable style="width: 100%">
                <el-option label="2024-Q2 华北平原L2A" value="after_01" />
                <el-option label="2024-Q1 东北地区L2A" value="after_02" />
                <el-option label="2023-Q4 长江流域L2A" value="after_03" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="变化类型">
          <el-checkbox-group v-model="form.changeTypes">
            <el-checkbox label="building">新增建筑</el-checkbox>
            <el-checkbox label="vegetation">植被减少</el-checkbox>
            <el-checkbox label="water">水体变化</el-checkbox>
            <el-checkbox label="road">道路变化</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="灵敏度">
          <el-slider v-model="form.sensitivity" :min="1" :max="10" show-input style="width: 320px" />
          <span class="slider-hint">值越高对小变化越敏感</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            开始对比
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果区域 -->
    <template v-if="hasResult">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="card-title">对比视图</span>
          <el-radio-group v-model="compareMode" size="small" style="margin-left: 16px">
            <el-radio-button value="split">左右分屏</el-radio-button>
            <el-radio-button value="overlay">叠加对比</el-radio-button>
            <el-radio-button value="diff">差异热力图</el-radio-button>
          </el-radio-group>
        </template>
        <div class="compare-result">
          <template v-if="compareMode === 'split'">
            <div class="compare-split">
              <div class="compare-panel filled">
                <div class="compare-label">变化前</div>
                <div ref="beforeChart" class="chart-box compare-chart-box"></div>
              </div>
              <div class="compare-divider-v">
                <el-icon :size="24"><DArrowRight /></el-icon>
              </div>
              <div class="compare-panel filled">
                <div class="compare-label">变化后</div>
                <div ref="afterChart" class="chart-box compare-chart-box"></div>
              </div>
            </div>
          </template>
          <template v-else-if="compareMode === 'overlay'">
            <div ref="overlayChart" class="chart-box compare-chart-box-large"></div>
          </template>
          <template v-else>
            <div ref="diffChart" class="chart-box compare-chart-box-large"></div>
          </template>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <span class="card-title">变化统计表</span>
        </template>
        <el-table :data="result" border stripe style="width: 100%">
          <el-table-column prop="typeZh" label="变化类型" width="140" />
          <el-table-column prop="count" label="变化图斑数量" width="140" align="center">
            <template #default="{ row }">
              <span class="val-highlight">{{ row.count }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="area" label="变化面积 (公顷)" width="160" align="center">
            <template #default="{ row }">
              <span class="val-highlight">{{ row.area }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ratio" label="占比 (%)" width="120" align="center">
            <template #default="{ row }">
              <el-progress :percentage="row.ratio" :stroke-width="8" :color="progressColor(row)" />
            </template>
          </el-table-column>
          <el-table-column label="置信度" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.confidence > 0.9 ? 'success' : 'warning'" size="small">
                {{ (row.confidence * 100).toFixed(1) }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="trend" label="趋势" min-width="140" align="center">
            <template #default="{ row }">
              <span :class="['trend-text', row.trend.includes('↑') ? 'trend-up' : row.trend.includes('↓') ? 'trend-down' : '']">
                {{ row.trend }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <!-- 无结果时占位 -->
    <template v-if="!hasResult">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <span class="card-title">对比视图</span>
          <el-radio-group v-model="compareMode" size="small" style="margin-left: 16px">
            <el-radio-button value="split">左右分屏</el-radio-button>
            <el-radio-button value="overlay">叠加对比</el-radio-button>
            <el-radio-button value="diff">差异热力图</el-radio-button>
          </el-radio-group>
        </template>
        <div class="chart-placeholder compare-placeholder">
          <div class="compare-container">
            <div class="compare-panel">
              <el-icon :size="36"><Picture /></el-icon>
              <p>变化前影像</p>
              <span class="placeholder-sub">{{ form.beforeScene || '未选择' }}</span>
            </div>
            <div class="compare-divider">
              <el-icon :size="24"><DArrowRight /></el-icon>
            </div>
            <div class="compare-panel">
              <el-icon :size="36"><Picture /></el-icon>
              <p>变化后影像</p>
              <span class="placeholder-sub">{{ form.afterScene || '未选择' }}</span>
            </div>
          </div>
          <span class="placeholder-sub" style="margin-top: 12px">提交对比任务后在此展示结果</span>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header><span class="card-title">变化统计表</span></template>
        <el-table :data="tableData" border stripe style="width: 100%">
          <el-table-column prop="type" label="变化类型" width="140" />
          <el-table-column prop="count" label="变化图斑数量" width="140" align="center">
            <template #default><span class="table-placeholder">--</span></template>
          </el-table-column>
          <el-table-column prop="area" label="变化面积 (公顷)" width="160" align="center">
            <template #default><span class="table-placeholder">--</span></template>
          </el-table-column>
          <el-table-column prop="ratio" label="占比 (%)" width="120" align="center">
            <template #default><span class="table-placeholder">--</span></template>
          </el-table-column>
          <el-table-column prop="confidence" label="置信度" width="120" align="center">
            <template #default><span class="table-placeholder">--</span></template>
          </el-table-column>
          <el-table-column prop="trend" label="趋势" min-width="140" align="center">
            <template #default><span class="table-placeholder">--</span></template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { Picture, DArrowRight } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import { generateChangeDetectionResults } from '@/services/mockData'
import type { ChangeItem } from '@/services/mockData'

interface ChangeDetectForm {
  beforeScene: string
  afterScene: string
  changeTypes: string[]
  sensitivity: number
}

const form = reactive<ChangeDetectForm>({
  beforeScene: '',
  afterScene: '',
  changeTypes: ['building'],
  sensitivity: 5,
})

const loading = ref(false)
const hasResult = ref(false)
const compareMode = ref('split')
const result = ref<ChangeItem[]>([])

const tableData = [
  { type: '新增建筑' }, { type: '植被减少' }, { type: '水体变化' }, { type: '道路变化' },
]

// ── Chart refs ──
const beforeChart = ref<HTMLElement>()
const afterChart = ref<HTMLElement>()
const overlayChart = ref<HTMLElement>()
const diffChart = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

function makePatchGrid(seed: number) {
  const data: [number, number, number][] = []
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 14; c++) {
      const val = Math.sin(c * 0.7 + seed) * 0.3 + Math.cos(r * 0.5 + seed) * 0.3 + 0.5 + (Math.random() - 0.5) * 0.4
      data.push([c, r, Math.round(Math.max(0.1, Math.min(0.95, val)) * 100) / 100])
    }
  }
  return data
}

function makeSimpleHeatmap(el: HTMLElement, title: string, colorScheme: string[], seed: number) {
  const c = echarts.init(el)
  charts.push(c)
  c.setOption({
    tooltip: { formatter: (p: any) => `${title}<br/>值: ${p.value[2].toFixed(2)}` },
    grid: { left: 8, right: 8, top: 24, bottom: 8 },
    xAxis: { type: 'category', show: false, data: Array.from({ length: 14 }, (_, i) => `${i}`) },
    yAxis: { type: 'category', show: false, data: Array.from({ length: 10 }, (_, i) => `${i}`) },
    visualMap: { show: false, min: 0, max: 1, inRange: { color: colorScheme } },
    graphic: [{ type: 'text', left: 'center', top: 4, style: { text: title, fontSize: 11, fill: '#606266' } }],
    series: [{ type: 'heatmap', data: makePatchGrid(seed), label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 0.5 } }],
  })
}

function makeDiffHeatmap(el: HTMLElement) {
  const c = echarts.init(el)
  charts.push(c)
  const data: [number, number, number][] = []
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 14; c++) {
      // 中心区域有显著变化
      const dist = Math.sqrt((c - 7) ** 2 + (r - 4.5) ** 2) / 7
      const diff = Math.max(-0.8, Math.min(0.8, (1 - dist) * 0.7 * (Math.random() > 0.5 ? 1 : -1) + (Math.random() - 0.5) * 0.3))
      data.push([c, r, Math.round(diff * 100) / 100])
    }
  }
  c.setOption({
    tooltip: { formatter: (p: any) => `变化幅度: <b>${p.value[2].toFixed(2)}</b>` },
    grid: { left: 40, right: 20, top: 16, bottom: 16 },
    xAxis: { type: 'category', show: false, data: Array.from({ length: 14 }, (_, i) => `${i}`) },
    yAxis: { type: 'category', show: false, data: Array.from({ length: 10 }, (_, i) => `${i}`) },
    visualMap: {
      min: -0.8, max: 0.8, calculable: true, orient: 'vertical', right: 4, top: 'center', itemHeight: 160,
      text: ['增加', '减少'], textStyle: { color: '#606266', fontSize: 10 },
      inRange: { color: ['#F56C6C', '#f5f0f0', '#ffffff', '#e8f5e8', '#67C23A'] },
    },
    series: [{ type: 'heatmap', data, label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 0.5 } }],
  })
}

function initAllComparisonCharts() {
  charts.forEach((c) => c.dispose())
  charts = []

  if (compareMode.value === 'split') {
    if (beforeChart.value) makeSimpleHeatmap(beforeChart.value, '2023 年影像', ['#f0f0e0', '#e0e8d0', '#c0d8a0', '#80b860', '#409040'], 1)
    if (afterChart.value) makeSimpleHeatmap(afterChart.value, '2024 年影像', ['#f0f0e0', '#e0e8d0', '#c0d8a0', '#80b860', '#409040'], 2.5)
  } else if (compareMode.value === 'overlay') {
    if (overlayChart.value) {
      const c = echarts.init(overlayChart.value)
      charts.push(c)
      const beforeGrid = makePatchGrid(1)
      const afterGrid = makePatchGrid(2.5)
      const mix: [number, number, number, number][] = beforeGrid.map((b, i) => [b[0], b[1], b[2], afterGrid[i][2]])
      c.setOption({
        tooltip: { formatter: (p: any) => `变化前: ${p.value[2].toFixed(2)}<br/>变化后: ${p.value[3].toFixed(2)}` },
        grid: { left: 8, right: 8, top: 24, bottom: 8 },
        xAxis: { type: 'category', show: false, data: Array.from({ length: 14 }, (_, i) => `${i}`) },
        yAxis: { type: 'category', show: false, data: Array.from({ length: 10 }, (_, i) => `${i}`) },
        graphic: [{ type: 'text', left: 'center', top: 4, style: { text: '叠加对比视图', fontSize: 11, fill: '#606266' } }],
        series: [{
          type: 'heatmap', data: mix,
          label: { show: false },
          itemStyle: { borderColor: '#fff', borderWidth: 0.5 },
        }],
      })
    }
  } else if (compareMode.value === 'diff') {
    if (diffChart.value) makeDiffHeatmap(diffChart.value)
  }
}

// ── Submit ──
const handleSubmit = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 2000))
  loading.value = false

  result.value = generateChangeDetectionResults(form.changeTypes)
  hasResult.value = true

  await nextTick()
  initAllComparisonCharts()
}

function progressColor(row: ChangeItem) {
  if (row.type === 'building') return '#F56C6C'
  if (row.type === 'vegetation') return '#E6A23C'
  if (row.type === 'water') return '#409EFF'
  return '#67C23A'
}

function handleResize() { charts.forEach((c) => c.resize()) }

onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach((c) => c.dispose())
})
</script>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow-y: auto; min-height: 0; }
.form-card { margin-bottom: 16px; }
.chart-card { margin-bottom: 16px; }
.card-title { font-size: 17px; font-weight: 600; color: #303133; }
.slider-hint { font-size: 14px; color: #c0c4cc; margin-left: 12px; }

.chart-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 6px; color: #909399;
}
.compare-placeholder { height: 340px; }
.compare-container { display: flex; align-items: center; gap: 20px; width: 100%; padding: 0 40px; }
.compare-panel {
  flex: 1; display: flex; flex-direction: column; align-items: center; padding: 30px 20px;
  background: #fff; border: 1px solid #ebeef5; border-radius: 6px;
}
.compare-panel p { margin: 12px 0 4px; font-size: 16px; color: #606266; }
.compare-divider { display: flex; align-items: center; color: #409eff; }
.compare-divider-v { display: flex; align-items: center; color: #409eff; padding: 0 8px; }
.placeholder-sub { font-size: 14px; color: #c0c4cc; }
.table-placeholder { color: #c0c4cc; }

.compare-result { min-height: 320px; }
.compare-split { display: flex; align-items: stretch; gap: 8px; }
.compare-panel.filled { flex: 1; background: #fafafa; border-radius: 6px; padding: 8px; position: relative; }
.compare-label { font-size: 14px; color: #909399; text-align: center; margin-bottom: 4px; }
.chart-box { width: 100%; }
.compare-chart-box { height: 300px; }
.compare-chart-box-large { height: 380px; }

.val-highlight { font-weight: 600; color: #303133; }
.trend-text { font-size: 15px; }
.trend-up { color: #F56C6C; }
.trend-down { color: #67C23A; }
</style>
