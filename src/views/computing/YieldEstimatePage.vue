<template>
  <div class="page">
    <PageHeader title="产量预估" desc="基于时序遥感数据和气象数据，利用AI模型预估作物产量" />

    <el-card class="form-card" shadow="never">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="地块选择">
              <el-select v-model="form.field" placeholder="请选择地块" clearable style="width: 100%">
                <el-option label="示范区A-小麦" value="field_a" />
                <el-option label="示范区B-玉米" value="field_b" />
                <el-option label="示范区C-水稻" value="field_c" />
                <el-option label="实验田D-大豆" value="field_d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作物类型">
              <el-select v-model="form.cropType" placeholder="请选择作物" clearable style="width: 100%">
                <el-option label="冬小麦" value="winter_wheat" />
                <el-option label="春玉米" value="spring_corn" />
                <el-option label="水稻" value="rice" />
                <el-option label="大豆" value="soybean" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="输入参数">
          <el-row :gutter="16" style="width: 100%">
            <el-col :span="8">
              <div class="param-item">
                <label>播种日期</label>
                <el-date-picker v-model="form.plantingDate" type="date" placeholder="选择日期" style="width: 100%" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="param-item">
                <label>灌溉方式</label>
                <el-select v-model="form.irrigation" placeholder="请选择" style="width: 100%">
                  <el-option label="充分灌溉" value="full" />
                  <el-option label="节水灌溉" value="deficit" />
                  <el-option label="雨养" value="rainfed" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="param-item">
                <label>施肥水平</label>
                <el-select v-model="form.fertilization" placeholder="请选择" style="width: 100%">
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="预估模型">
          <el-radio-group v-model="form.modelType">
            <el-radio-button value="ensemble">Ensemble 集成</el-radio-button>
            <el-radio-button value="lstm">LSTM 时序</el-radio-button>
            <el-radio-button value="random_forest">Random Forest</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            开始预估
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果 -->
    <template v-if="hasResult">
      <el-row :gutter="16" class="result-row">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span class="card-title">预估产量</span></template>
            <div class="yield-display">
              <div class="yield-number">
                <span class="yield-value">{{ result.yieldPerHectare.toLocaleString() }}</span>
                <span class="yield-unit">kg/公顷</span>
              </div>
              <div class="yield-sub-row">
                <div class="yield-sub-item">
                  <span class="sub-label">总产量</span>
                  <span class="sub-value">{{ result.totalYield.toLocaleString() }} 吨</span>
                </div>
                <div class="yield-sub-item">
                  <span class="sub-label">地块面积</span>
                  <span class="sub-value">{{ result.area }} 公顷</span>
                </div>
              </div>
              <div class="yield-interval">
                置信区间: <strong>{{ result.confidenceInterval[0].toLocaleString() }} ~ {{ result.confidenceInterval[1].toLocaleString() }}</strong> kg/公顷 (95%)
              </div>
              <el-progress
                :percentage="Math.round(result.confidence * 100)"
                :stroke-width="14"
                :color="result.confidence > 0.9 ? '#67C23A' : '#E6A23C'"
                style="margin-top: 16px; width: 100%"
              >
                <template #default="{ percentage }">
                  <span class="progress-label">模型置信度 {{ percentage }}%</span>
                </template>
              </el-progress>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span class="card-title">影响因子分析</span></template>
            <div ref="factorChart" class="chart-box factor-chart-box"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never">
        <template #header><span class="card-title">空间分布预估</span></template>
        <div ref="spatialChart" class="chart-box spatial-chart-box"></div>
      </el-card>
    </template>

    <!-- 无结果时占位 -->
    <template v-if="!hasResult">
      <el-row :gutter="16" class="result-row">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span class="card-title">预估产量</span></template>
            <div class="yield-display">
              <div class="yield-number">
                <span class="yield-value">--</span>
                <span class="yield-unit">kg/公顷</span>
              </div>
              <div class="yield-interval">
                置信区间: <strong>-- ~ --</strong> kg/公顷 (95%)
              </div>
              <el-progress :percentage="0" :stroke-width="14" style="margin-top: 16px">
                <template #default="{ percentage }">
                  <span class="progress-label">置信度 {{ percentage }}%</span>
                </template>
              </el-progress>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span class="card-title">影响因子分析</span></template>
            <div class="chart-placeholder factor-placeholder">
              <el-icon :size="48"><DataAnalysis /></el-icon>
              <p>各因子贡献度分析</p>
              <span class="placeholder-sub">NDVI / 降水 / 温度 / 土壤湿度 / 施肥</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-card shadow="never">
        <template #header><span class="card-title">空间分布预估</span></template>
        <div class="chart-placeholder map-placeholder">
          <el-icon :size="48"><MapLocation /></el-icon>
          <p>产量空间分布预估图</p>
          <span class="placeholder-sub">地块级别的产量空间异质性展示</span>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { DataAnalysis, MapLocation } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import { generateYieldEstimate } from '@/services/mockData'

interface YieldForm {
  field: string
  cropType: string
  plantingDate: Date | null
  irrigation: string
  fertilization: string
  modelType: string
}

const form = reactive<YieldForm>({
  field: '',
  cropType: '',
  plantingDate: null,
  irrigation: 'full',
  fertilization: 'medium',
  modelType: 'ensemble',
})

const loading = ref(false)
const hasResult = ref(false)
const result = ref<ReturnType<typeof generateYieldEstimate>>()

// ── Chart refs ──
const factorChart = ref<HTMLElement>()
const spatialChart = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

function initFactorChart() {
  if (!factorChart.value || !result.value) return
  const c = echarts.init(factorChart.value)
  charts.push(c)

  const sorted = [...result.value.factors].sort((a, b) => b.contribution - a.contribution)
  c.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 40, top: 8, bottom: 8 },
    xAxis: { type: 'value', name: '贡献度 (%)', axisLabel: { fontSize: 10, color: '#909399' }, splitLine: { lineStyle: { color: '#f5f5f5' } } },
    yAxis: {
      type: 'category',
      data: sorted.map((f) => f.name),
      axisLabel: { fontSize: 11, color: '#606266' },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: sorted.map((f) => ({
        value: f.contribution,
        itemStyle: {
          color: f.color,
          borderRadius: [0, 4, 4, 0],
        },
      })),
      barWidth: 18,
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11, color: '#606266' },
    }],
  })
}

function initSpatialChart() {
  if (!spatialChart.value || !result.value) return
  const c = echarts.init(spatialChart.value)
  charts.push(c)

  const data: [number, number, number][] = []
  for (let r = 0; r < 8; r++) {
    for (let col = 0; col < 12; col++) {
      const dist = Math.sqrt((col - 6) ** 2 + (r - 3.5) ** 2) / 7
      const base = result.value!.yieldPerHectare / 1000
      const val = base * (1.2 - dist * 0.45 + (Math.random() - 0.5) * 0.25)
      data.push([col, r, Math.round(Math.max(base * 0.55, val) * 100) / 100])
    }
  }

  c.setOption({
    tooltip: { formatter: (p: any) => `预估产量: <b>${(p.value[2] * 1000).toFixed(0)}</b> kg/公顷` },
    grid: { left: 45, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: Array.from({ length: 12 }, (_, i) => `C${i + 1}`), axisLabel: { fontSize: 10, color: '#909399' } },
    yAxis: { type: 'category', data: Array.from({ length: 8 }, (_, i) => `R${8 - i}`), axisLabel: { fontSize: 10, color: '#909399' } },
    visualMap: {
      min: Math.round(result.value!.yieldPerHectare * 0.55 / 1000 * 100) / 100,
      max: Math.round(result.value!.yieldPerHectare * 1.2 / 1000 * 100) / 100,
      calculable: true,
      orient: 'vertical',
      right: 6,
      top: 'center',
      itemHeight: 160,
      text: ['高', '低'],
      textStyle: { color: '#606266', fontSize: 10 },
      inRange: { color: ['#F56C6C', '#f0ad4e', '#e6d933', '#a8e66c', '#409EFF', '#1a7a3a'] },
    },
    series: [{
      type: 'heatmap', data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' } },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
    }],
  })
}

// ── Submit ──
const handleSubmit = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 2000))
  loading.value = false

  result.value = generateYieldEstimate()
  hasResult.value = true

  await nextTick()
  charts.forEach((c) => c.dispose())
  charts = []
  initFactorChart()
  initSpatialChart()
}

function handleResize() { charts.forEach((c) => c.resize()) }

onMounted(() => { window.addEventListener('resize', handleResize) })
onUnmounted(() => { window.removeEventListener('resize', handleResize); charts.forEach((c) => c.dispose()) })
</script>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow-y: auto; min-height: 0; }
.form-card { margin-bottom: 16px; }
.result-row { margin-bottom: 16px; }
.card-title { font-size: 17px; font-weight: 600; color: #303133; }

.param-item { display: flex; flex-direction: column; }
.param-item label { font-size: 14px; color: #909399; margin-bottom: 6px; }

.yield-display { display: flex; flex-direction: column; align-items: center; padding: 20px 16px; }
.yield-number { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.yield-value { font-size: 48px; font-weight: 700; color: #409eff; }
.yield-unit { font-size: 18px; color: #909399; }
.yield-sub-row { display: flex; gap: 32px; margin-bottom: 12px; }
.yield-sub-item { display: flex; flex-direction: column; align-items: center; }
.sub-label { font-size: 14px; color: #909399; }
.sub-value { font-size: 18px; font-weight: 600; color: #303133; }
.yield-interval { font-size: 15px; color: #606266; margin-bottom: 4px; }
.progress-label { font-size: 14px; color: #909399; }

.chart-box { width: 100%; }
.factor-chart-box { height: 260px; }
.spatial-chart-box { height: 320px; }

.chart-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 6px; color: #909399;
}
.chart-placeholder p { margin: 12px 0 4px; font-size: 16px; color: #606266; }
.placeholder-sub { font-size: 14px; color: #c0c4cc; }
.factor-placeholder { height: 260px; }
.map-placeholder { height: 320px; }
</style>
