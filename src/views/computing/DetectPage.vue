<template>
  <div class="page">
    <PageHeader title="智能识别" desc="基于深度学习模型的目标检测与语义分割" />

    <el-card class="form-card" shadow="never">
      <el-form :model="form" label-width="120px">
        <el-form-item label="检测类型">
          <el-radio-group v-model="form.detectType">
            <el-radio-button value="crop_classify">作物分类</el-radio-button>
            <el-radio-button value="pest_disease">病虫害</el-radio-button>
            <el-radio-button value="lodging">倒伏</el-radio-button>
            <el-radio-button value="frost">霜冻</el-radio-button>
            <el-radio-button value="flood">洪涝</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="场景选择">
          <el-select v-model="form.scene" placeholder="请选择场景" clearable style="width: 280px">
            <el-option label="华北平原-2024Q2" value="scene_01" />
            <el-option label="东北黑土地-2024Q3" value="scene_02" />
            <el-option label="长江中下游-2024Q1" value="scene_03" />
            <el-option label="四川盆地-2024Q2" value="scene_04" />
          </el-select>
        </el-form-item>

        <el-form-item label="模型选择">
          <el-select v-model="form.model" placeholder="请选择模型" style="width: 280px">
            <el-option label="YOLOv8-S (轻量)" value="yolov8s" />
            <el-option label="YOLOv8-M (均衡)" value="yolov8m" />
            <el-option label="Mask R-CNN (高精度)" value="mask_rcnn" />
            <el-option label="SegFormer (语义分割)" value="segformer" />
          </el-select>
        </el-form-item>

        <el-form-item label="高级参数">
          <el-row :gutter="16" style="width: 100%">
            <el-col :span="8">
              <div class="param-item">
                <label>置信度阈值</label>
                <el-slider v-model="form.confidenceThreshold" :min="0.1" :max="0.9" :step="0.05" show-input />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="param-item">
                <label>NMS阈值</label>
                <el-slider v-model="form.nmsThreshold" :min="0.1" :max="0.9" :step="0.05" show-input />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="param-item">
                <label>最小面积 (px)</label>
                <el-input-number v-model="form.minArea" :min="16" :max="1024" :step="16" style="width: 100%" />
              </div>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            开始检测
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果区域 -->
    <template v-if="hasResult">
      <el-row :gutter="16" class="result-row">
        <el-col :span="14">
          <el-card shadow="never">
            <template #header>
              <span class="card-title">检测叠加地图</span>
            </template>
            <div ref="detectMapChart" class="chart-box map-chart-box"></div>
          </el-card>
        </el-col>

        <el-col :span="10">
          <el-card shadow="never" class="list-card">
            <template #header>
              <span class="card-title">检测列表</span>
              <span class="card-subtitle">共 {{ result.objects.length }} 个目标</span>
            </template>
            <div class="detect-list">
              <div
                v-for="obj in result.objects.slice(0, 12)"
                :key="obj.id"
                class="detect-item"
              >
                <span
                  class="detect-dot"
                  :style="{ background: obj.color }"
                ></span>
                <span class="detect-name">{{ obj.classNameZh }}</span>
                <span class="detect-conf">{{ (obj.confidence * 100).toFixed(1) }}%</span>
              </div>
              <div v-if="result.objects.length > 12" class="detect-more">
                还有 {{ result.objects.length - 12 }} 个目标…
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never">
        <template #header>
          <span class="card-title">检测统计</span>
        </template>
        <el-row :gutter="16">
          <el-col :span="6" v-for="item in statsCards" :key="item.label">
            <div class="stat-card">
              <div class="stat-card-label">{{ item.label }}</div>
              <div class="stat-card-value" :style="{ color: item.color }">{{ item.value }}</div>
              <div class="stat-card-unit">{{ item.unit }}</div>
            </div>
          </el-col>
        </el-row>
        <div ref="classPieChart" class="chart-box pie-chart-box" style="margin-top:16px"></div>
      </el-card>
    </template>

    <!-- 无结果时占位 -->
    <template v-if="!hasResult">
      <el-row :gutter="16" class="result-row">
        <el-col :span="14">
          <el-card shadow="never">
            <template #header><span class="card-title">检测叠加地图</span></template>
            <div class="chart-placeholder map-placeholder">
              <el-icon :size="48"><MapLocation /></el-icon>
              <p>目标检测结果叠加地图</p>
              <span class="placeholder-sub">检测框与分割掩膜将在此叠加显示</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="10">
          <el-card shadow="never" class="list-card">
            <template #header><span class="card-title">检测列表</span></template>
            <div class="chart-placeholder list-placeholder">
              <el-icon :size="48"><List /></el-icon>
              <p>检测目标列表</p>
              <span class="placeholder-sub">检测结果将以列表形式展示</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-card shadow="never">
        <template #header><span class="card-title">检测统计</span></template>
        <el-row :gutter="16">
          <el-col :span="6" v-for="item in statsPreview" :key="item.label">
            <div class="stat-card">
              <div class="stat-card-label">{{ item.label }}</div>
              <div class="stat-card-value">--</div>
              <div class="stat-card-unit">{{ item.unit }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { MapLocation, List } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/common/PageHeader.vue'
import { generateDetectionResults } from '@/services/mockData'

interface DetectForm {
  detectType: string
  scene: string
  model: string
  confidenceThreshold: number
  nmsThreshold: number
  minArea: number
}

const form = reactive<DetectForm>({
  detectType: 'crop_classify',
  scene: '',
  model: 'yolov8s',
  confidenceThreshold: 0.5,
  nmsThreshold: 0.45,
  minArea: 64,
})

const loading = ref(false)
const hasResult = ref(false)
const result = ref<ReturnType<typeof generateDetectionResults>>()

const statsPreview = [
  { label: '检测目标总数', unit: '个' },
  { label: '作物分类', unit: '类' },
  { label: '平均置信度', unit: '%' },
  { label: '处理耗时', unit: '秒' },
]

const statsCards = computed(() => {
  if (!result.value) return []
  const s = result.value.stats
  return [
    { label: '检测目标总数', value: s.total, unit: '个', color: '#303133' },
    { label: '分类数量', value: s.classCount, unit: '类', color: '#409EFF' },
    { label: '平均置信度', value: (s.avgConfidence * 100).toFixed(1), unit: '%', color: '#67C23A' },
    { label: '处理耗时', value: s.processTime, unit: '秒', color: '#E6A23C' },
  ]
})

// ── Chart refs ──
const detectMapChart = ref<HTMLElement>()
const classPieChart = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

function initDetectMap() {
  if (!detectMapChart.value || !result.value) return
  const c = echarts.init(detectMapChart.value)
  charts.push(c)

  const series = result.value.classDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({
      type: 'scatter' as const,
      name: d.name,
      data: result.value!.objects
        .filter((o) => o.color === d.color)
        .map((o) => [o.bbox[0] + o.bbox[2] / 2, o.bbox[1] + o.bbox[3] / 2, o.bbox[2] * o.bbox[3] * 1000, o.confidence]),
      symbolSize: (val: number[]) => Math.max(8, Math.min(40, val[2] * 3)),
      itemStyle: { color: d.color, opacity: 0.75, borderColor: '#fff', borderWidth: 0.5 },
      emphasis: { itemStyle: { opacity: 1, borderWidth: 2 } },
    }))

  c.setOption({
    tooltip: {
      formatter: (p: any) =>
        `${p.seriesName}<br/>置信度: <b>${(p.value[3] * 100).toFixed(1)}%</b><br/>面积: ${Math.round(p.value[2])} px²`,
    },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value', name: 'X (归一化)', min: 0, max: 1, axisLabel: { fontSize: 10, color: '#909399' }, splitLine: { lineStyle: { color: '#f5f5f5' } } },
    yAxis: { type: 'value', name: 'Y (归一化)', min: 0, max: 1, axisLabel: { fontSize: 10, color: '#909399' }, splitLine: { lineStyle: { color: '#f5f5f5' } } },
    series,
  })
}

function initClassPie() {
  if (!classPieChart.value || !result.value) return
  const c = echarts.init(classPieChart.value)
  charts.push(c)

  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 个 ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['40%', '50%'],
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
      data: result.value.classDistribution.filter((d) => d.count > 0).map((d) => ({
        value: d.count, name: d.name, itemStyle: { color: d.color },
      })),
    }],
  })
}

// ── Submit ──
const handleSubmit = async () => {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1800))
  loading.value = false

  result.value = generateDetectionResults(form.detectType)
  hasResult.value = true

  await nextTick()
  charts.forEach((c) => c.dispose())
  charts = []
  initDetectMap()
  initClassPie()
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
.card-subtitle { font-size: 14px; color: #909399; margin-left: 8px; }
.param-item { display: flex; flex-direction: column; }
.param-item label { font-size: 14px; color: #909399; margin-bottom: 6px; }

.chart-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 6px; color: #909399;
}
.chart-placeholder p { margin: 12px 0 4px; font-size: 16px; color: #606266; }
.placeholder-sub { font-size: 14px; color: #c0c4cc; }

.chart-box { width: 100%; }
.map-chart-box { height: 360px; }
.list-placeholder { height: 360px; }
.pie-chart-box { height: 260px; }

.detect-list { display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; padding: 4px 0; }
.detect-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f7fa; border-radius: 6px; }
.detect-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.detect-name { flex: 1; font-size: 15px; color: #303133; }
.detect-conf { font-size: 15px; font-weight: 600; color: #606266; }
.detect-more { text-align: center; font-size: 14px; color: #c0c4cc; padding: 8px; }

.stat-card { text-align: center; padding: 20px 12px; background: #f5f7fa; border-radius: 6px; }
.stat-card-label { font-size: 15px; color: #909399; margin-bottom: 8px; }
.stat-card-value { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.stat-card-unit { font-size: 14px; color: #c0c4cc; }
</style>
