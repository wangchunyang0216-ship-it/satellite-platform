<template>
  <div class="asp">
    <!-- ═══ 左侧：服务目录 ═══ -->
    <aside class="asp-sidebar">
      <div class="svc-list">
        <div v-for="svc in services" :key="svc.id" class="svc-card"
          :class="{ active: active === svc.id }"
          @click="openService(svc)">
          <span class="svc-ico"><svg-icon :icon-class="svc.icon" /></span>
          <div class="svc-body">
            <strong>{{ svc.name }}</strong>
            <div class="svc-sub">
              <span class="svc-desc">{{ svc.shortDesc }}</span>
              <span class="svc-cat">{{ svc.category }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ═══ 右侧：Cesium 3D 球体 + 图层面板 ═══ -->
    <main class="asp-main">
      <div class="asp-globe-wrap">
        <!-- Cesium -->
        <div class="globe-container">
          <CesiumViewer ref="cesiumRef" @ready="onCesiumReady">
            <template #toolbar-actions>
              <div class="map-layer-actions">
                <el-tooltip content="加载前五个" placement="bottom">
                  <el-button class="map-icon-btn" size="small" type="primary" circle :icon="Download" @click="loadFirstFiveTasks" :loading="layerLoading" />
                </el-tooltip>
                <el-tooltip content="清空图层" placement="bottom">
                  <el-button class="map-icon-btn" size="small" circle :icon="Delete" @click="clearGlobe" :disabled="layerCount === 0" />
                </el-tooltip>
              </div>
            </template>
          </CesiumViewer>
        </div>
        <!-- 拖动条 -->
        <div v-if="!layerPanelCollapsed" class="asp-splitter" @mousedown="onSplitterDown"></div>
        <!-- 图层面板（右侧） -->
        <div v-if="!layerPanelCollapsed" class="layer-panel" :style="{ width: panelWidth + 'px' }">
          <div class="lp-head">
            <div>
              <span>结果图层</span>
              <small>最多叠加 {{ MAX_LAYER_COUNT }} 个 TIF 结果</small>
            </div>
            <div class="lp-head-actions">
              <span class="lp-count">{{ filteredTasks.length }} / {{ completedTasks.length }}</span>
              <el-button link size="small" type="primary" @click="layerPanelCollapsed = true">收起</el-button>
            </div>
          </div>
          <div class="lp-filters">
            <el-input
              v-model="layerFilters.keyword"
              clearable
              size="small"
              placeholder="搜索任务"
            />
            <el-select v-model="layerFilters.service" clearable size="small" placeholder="全部算法">
              <el-option v-for="svc in services" :key="svc.id" :label="svc.name" :value="svc.id" />
            </el-select>
            <el-date-picker
              v-model="layerFilters.dateRange"
              type="daterange"
              size="small"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD"
              style="width:100%"
            />
          </div>
          <div class="lp-list" v-if="filteredTasks.length > 0">
            <div v-for="task in visibleLayerTasks" :key="task.taskId" class="lp-item"
              :class="{ loaded: isTaskLoaded(task.taskId) }">
              <div class="lp-row">
                <span class="lp-dot" :style="{background:getServiceColor(task.service)}"></span>
                <div class="lp-info">
                  <span class="lp-name">{{ getTaskName(task) }}</span>
                  <span class="lp-meta">{{ serviceLabel(task.service) }} · 完成 {{ formatTaskTime(task.completedAt || task.createdAt) }}</span>
                  <span class="lp-id">{{ task.taskId }}</span>
                </div>
                <el-button link size="small" type="primary" @click.stop="renameTask(task)">重命名</el-button>
              </div>
              <div class="lp-actions" v-if="isTaskLoaded(task.taskId)">
                <el-switch v-model="taskVisibility[task.taskId]" size="small"
                  @change="(v:boolean) => onTaskVisibility(task.taskId, v)" />
                <el-slider v-model="taskOpacity[task.taskId]" :min="0.1" :max="1" :step="0.05"
                  size="small" style="width:50px"
                  @input="(v:number) => onTaskOpacity(task.taskId, v)" />
                <el-button link size="small" type="primary" @click="downloadTif(task.taskId)">TIF</el-button>
                <el-button link size="small" type="danger" @click="removeGlobeLayer(task.taskId)">✕</el-button>
              </div>
              <el-button v-else size="small" type="primary" class="lp-load-btn" @click="loadOneTask(task)">加载</el-button>
            </div>
            <button v-if="hiddenLayerTaskCount > 0" class="lp-more" @click="layerListExpanded = !layerListExpanded">
              {{ layerListExpanded ? '收起任务' : `展开剩余 ${hiddenLayerTaskCount} 个任务` }}
            </button>
          </div>
          <div v-else class="lp-empty">{{ completedTasks.length ? '没有匹配的任务' : '暂无任务，执行算法后自动出现' }}</div>
        </div>
        <button v-else class="layer-expand" @click="layerPanelCollapsed = false">
          展开结果图层
        </button>
      </div>
    </main>

    <!-- ═══ 服务弹窗 ═══ -->
    <el-dialog v-model="dialogVisible" :title="cur.name + ' — 参数配置'" width="960px" destroy-on-close>
      <div class="dlg-svc-header">
        <span class="dlg-ico"><svg-icon :icon-class="cur.icon" /></span>
        <div>
          <strong>{{ cur.name }}</strong>
          <p>{{ cur.desc }}</p>
        </div>
        <el-tag effect="plain" round size="small">{{ cur.category }}</el-tag>
      </div>

      <el-form label-position="top" size="default">
        <el-form-item label="任务名称">
          <el-input
            v-model="params.taskName"
            maxlength="128"
            clearable
            show-word-limit
            placeholder="可选，例如：武汉东湖 NDVI 植被分析；不填则系统自动命名"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <div class="upload-box" :class="{ 'has-preview': redPreviewUrl }" @click="triggerUpload('red')" @drop.prevent="onDrop('red', $event)" @dragover.prevent>
              <input type="file" ref="redInput" accept=".tif,.tiff" style="display:none" @change="onFilePicked('red', $event)" />
              <template v-if="redPreviewUrl"><img :src="redPreviewUrl" class="upload-preview-img" /><div class="upload-overlay"><span @click.stop="handleFileRemove('red')">重新选择</span></div></template>
              <template v-else><el-icon :size="28" color="#2563EB"><UploadFilled /></el-icon><p>红波段 TIF <b>B04</b></p></template>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="upload-box" :class="{ 'has-preview': nirPreviewUrl }" @click="triggerUpload('nir')" @drop.prevent="onDrop('nir', $event)" @dragover.prevent>
              <input type="file" ref="nirInput" accept=".tif,.tiff" style="display:none" @change="onFilePicked('nir', $event)" />
              <template v-if="nirPreviewUrl"><img :src="nirPreviewUrl" class="upload-preview-img" /><div class="upload-overlay"><span @click.stop="handleFileRemove('nir')">重新选择</span></div></template>
              <template v-else><el-icon :size="28" color="#059669"><UploadFilled /></el-icon><p>近红外 TIF <b>B08</b></p></template>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-if="active === 'calibration'">
          <el-col :span="12"><el-form-item label="定标类型"><el-select v-model="params.calType" style="width:100%"><el-option label="绝对定标" value="absolute" /><el-option label="相对定标" value="relative" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'atmospheric'">
          <el-col :span="12"><el-form-item label="气溶胶模型"><el-select v-model="params.aerosol" style="width:100%"><el-option label="大陆型" value="continental" /><el-option label="海洋型" value="maritime" /><el-option label="城市型" value="urban" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'geometric'">
          <el-col :span="8"><el-form-item label="DEM"><el-select v-model="params.dem" style="width:100%"><el-option label="SRTM 30m" value="srtm30" /><el-option label="ALOS 30m" value="alos30" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="重采样"><el-select v-model="params.resample" style="width:100%"><el-option label="双线性" value="bilinear" /><el-option label="三次卷积" value="cubic" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'cloud_detection'">
          <el-col :span="12"><el-form-item label="检测阈值"><el-slider v-model="params.cloudThreshold" :min="0.05" :max="0.5" :step="0.01" show-input /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'clip'">
          <el-col :span="6"><el-form-item label="X"><el-input-number v-model="params.clipX" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="Y"><el-input-number v-model="params.clipY" :min="0" size="small" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="宽"><el-input-number v-model="params.clipW" :min="1" size="small" style="width:100%" /></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="高"><el-input-number v-model="params.clipH" :min="1" size="small" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'spectral_index'">
          <el-col :span="12"><el-form-item label="指数类型"><el-select v-model="params.indexType" style="width:100%"><el-option label="NDVI" value="ndvi" /><el-option label="EVI" value="evi" /><el-option label="NDWI" value="ndwi" /><el-option label="SAVI" value="savi" /><el-option label="NDBI" value="ndbi" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'mosaic'">
          <el-col :span="8"><el-form-item label="拼接线"><el-select v-model="params.seamline" style="width:100%"><el-option label="MCP" value="mcp" /><el-option label="Voronoi" value="voronoi" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="匀色"><el-switch v-model="params.colorBalance" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16" v-if="active === 'fusion'">
          <el-col :span="12"><el-form-item label="融合算法"><el-select v-model="params.fusionMethod" style="width:100%"><el-option label="Gram-Schmidt" value="gs" /><el-option label="PCA" value="pca" /><el-option label="Brovey" value="brovey" /></el-select></el-form-item></el-col>
        </el-row>
      </el-form>

      <!-- 结果预览 -->
      <div v-if="uploadResult" class="result-box">
        <div class="result-title">计算结果 — {{ cur.name }}</div>
        <!-- 预览图：独占一行 -->
        <div class="result-preview-wrap">
          <img v-if="previewUrl" :src="previewUrl" class="ndvi-result-img" />
          <div v-else class="ndvi-placeholder"><el-icon :size="40" color="#c0c4cc"><Picture /></el-icon><p>暂无预览图</p></div>
        </div>
        <!-- 统计指标：3 列 -->
        <div class="stats-grid-3">
          <div v-for="(v,k) in displayStats" :key="k" class="stat-cell"><span>{{ k }}</span><b>{{ v }}</b></div>
        </div>
        <!-- 底部操作 -->
        <div class="result-footer">
          <span class="result-size">尺寸: {{ uploadStats.imageSize }}</span>
          <el-button type="primary" size="small" @click="downloadCesiumPng" :style="{background:'#2563EB',borderColor:'#2563EB'}">下载 TIF</el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button @click="resetParams">重置</el-button>
        <el-button type="primary" :loading="running" @click="run" :style="{background:'#2563EB',borderColor:'#2563EB'}">
          {{ running ? '计算中…' : `▶ 开始${cur.name}` }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, UploadFilled, Picture, Close, Download, Delete } from '@element-plus/icons-vue'
import CesiumViewer from '@/components/MapView/CesiumViewer.vue'
import { computeApi, type AlgorithmTask } from '@/api/compute'
import { useCesiumLayers, getServiceColor } from '@/composables/useCesiumLayers'
import type { CesiumLayerConfig } from '@/types/cesium'

const cesiumRef = ref<InstanceType<typeof CesiumViewer>>()
const route = useRoute()
const MAX_LAYER_COUNT = 5
const DEFAULT_VISIBLE_LAYER_TASKS = 5
const layers = useCesiumLayers()
const completedTasks = ref<AlgorithmTask[]>([])
const taskVisibility = reactive<Record<string, boolean>>({})
const taskOpacity = reactive<Record<string, number>>({})
const taskNames = reactive<Record<string, string>>(loadTaskNames())
const layerFilters = reactive<{ keyword: string; service: string; dateRange: string[] }>({
  keyword: '',
  service: '',
  dateRange: [],
})
const cesiumReady = ref(false)
const pendingLayers = ref<CesiumLayerConfig[]>([])
const panelWidth = ref(280)
const layerPanelCollapsed = ref(false)
const layerListExpanded = ref(false)
const dialogVisible = ref(false)

const layerLoading = computed(() => layers.loading.value)
const layerCount = computed(() => layers.layerCount.value)
const serviceLabel = (s: string) => ({ calibration:'辐射定标', atmospheric:'大气校正', geometric:'几何校正', ndvi:'NDVI', cloud_detection:'云检测', clip:'影像裁剪', spectral_index:'光谱指数', mosaic:'影像镶嵌', fusion:'影像融合' }[s] || s)
const filteredTasks = computed(() => {
  const keyword = layerFilters.keyword.trim().toLowerCase()
  return completedTasks.value.filter((task) => {
    const taskName = getTaskName(task).toLowerCase()
    const taskId = task.taskId.toLowerCase()
    if (keyword && !taskName.includes(keyword) && !taskId.includes(keyword)) return false
    if (layerFilters.service && task.service !== layerFilters.service) return false
    if (layerFilters.dateRange?.length === 2) {
      const time = new Date(task.completedAt || task.createdAt).getTime()
      const start = new Date(`${layerFilters.dateRange[0]} 00:00:00`).getTime()
      const end = new Date(`${layerFilters.dateRange[1]} 23:59:59`).getTime()
      if (Number.isFinite(time) && (time < start || time > end)) return false
    }
    return true
  })
})
const hiddenLayerTaskCount = computed(() => Math.max(filteredTasks.value.length - DEFAULT_VISIBLE_LAYER_TASKS, 0))
const visibleLayerTasks = computed(() => layerListExpanded.value ? filteredTasks.value : filteredTasks.value.slice(0, DEFAULT_VISIBLE_LAYER_TASKS))
watch(layerFilters, () => { layerListExpanded.value = false }, { deep: true })

interface ServiceDef { id: string; name: string; shortDesc: string; desc: string; icon: string; category: string; algorithm: string[] }
const services: ServiceDef[] = [
  { id:'calibration', name:'辐射定标', shortDesc:'DN值→辐射亮度', desc:'将影像数字量化值(DN)转换为具有物理意义的辐射亮度值', icon:'fushedingbiao', category:'辐射校正', algorithm:[] },
  { id:'atmospheric', name:'大气校正', shortDesc:'消除大气影响', desc:'消除大气散射与吸收效应，获取地表真实反射率', icon:'daqixiaozheng-48', category:'辐射校正', algorithm:[] },
  { id:'geometric', name:'几何校正', shortDesc:'精确地理定位', desc:'基于RPC模型的几何畸变校正，实现影像精确地理编码', icon:'jihexiaozheng', category:'几何校正', algorithm:[] },
  { id:'cloud_detection', name:'云检测', shortDesc:'识别云覆盖', desc:'多光谱阈值法自动识别云覆盖区域', icon:'yunjiance', category:'影像预处理', algorithm:[] },
  { id:'clip', name:'影像裁剪', shortDesc:'ROI区域提取', desc:'按矩形ROI从大影像中提取子区域', icon:'yingxiangcaijian', category:'影像预处理', algorithm:[] },
  { id:'ndvi', name:'NDVI 植被指数', shortDesc:'植被覆盖评估', desc:'归一化差值植被指数，定量评估植被覆盖度', icon:'guangpu', category:'指数计算', algorithm:[] },
  { id:'spectral_index', name:'光谱指数扩展', shortDesc:'EVI/NDWI/SAVI等', desc:'支持多种遥感光谱指数计算', icon:'danweihuaxiang-jichuxinxi-nianlingfenbu', category:'指数计算', algorithm:[] },
  { id:'mosaic', name:'影像镶嵌', shortDesc:'多景无缝拼接', desc:'多景影像自动配准与无缝拼接', icon:'yingxiangxiangqian', category:'影像处理', algorithm:[] },
  { id:'fusion', name:'影像融合', shortDesc:'多光谱+全色', desc:'融合高分辨率全色与多光谱影像', icon:'yingxiangronghe', category:'影像处理', algorithm:[] },
]

const mockTasks: AlgorithmTask[] = [
  {
    id: -1,
    taskId: 'MOCK-NDVI-20260826-01',
    taskName: '武汉东湖 NDVI 植被覆盖分析',
    userId: 0,
    service: 'ndvi',
    params: {},
    status: 'completed',
    progress: 100,
    outputPath: '',
    stats: { imageSize: '2048x2048' },
    errorMessage: '',
    createdAt: '2026-08-26T06:42:50',
    completedAt: '2026-08-26T06:43:18',
    elapsedSec: 28,
  },
  {
    id: -2,
    taskId: 'MOCK-CLOUD-20260826-02',
    taskName: '汉江流域云量检测任务',
    userId: 0,
    service: 'cloud_detection',
    params: {},
    status: 'completed',
    progress: 100,
    outputPath: '',
    stats: { imageSize: '1792x1792' },
    errorMessage: '',
    createdAt: '2026-08-26T07:10:02',
    completedAt: '2026-08-26T07:10:41',
    elapsedSec: 39,
  },
  {
    id: -3,
    taskId: 'MOCK-GEOM-20260825-01',
    taskName: '高分六号几何校正结果',
    userId: 0,
    service: 'geometric',
    params: {},
    status: 'completed',
    progress: 100,
    outputPath: '',
    stats: { imageSize: '1536x1536' },
    errorMessage: '',
    createdAt: '2026-08-25T08:43:21',
    completedAt: '2026-08-25T08:44:05',
    elapsedSec: 44,
  },
  {
    id: -4,
    taskId: 'MOCK-FUSION-20260824-01',
    taskName: '城区多源影像融合演示',
    userId: 0,
    service: 'fusion',
    params: {},
    status: 'completed',
    progress: 100,
    outputPath: '',
    stats: { imageSize: '4096x4096' },
    errorMessage: '',
    createdAt: '2026-08-24T15:22:18',
    completedAt: '2026-08-24T15:23:06',
    elapsedSec: 48,
  },
  {
    id: -5,
    taskId: 'MOCK-CLIP-20260823-01',
    taskName: '重点农田 ROI 影像裁剪',
    userId: 0,
    service: 'clip',
    params: {},
    status: 'completed',
    progress: 100,
    outputPath: '',
    stats: { imageSize: '1024x1024' },
    errorMessage: '',
    createdAt: '2026-08-23T11:18:12',
    completedAt: '2026-08-23T11:18:27',
    elapsedSec: 15,
  },
]

const active = ref('ndvi')
const running = ref(false)
const redFile = ref<File | null>(null)
const nirFile = ref<File | null>(null)
const redPreviewUrl = ref('')
const nirPreviewUrl = ref('')
const redInput = ref<HTMLInputElement | null>(null)
const nirInput = ref<HTMLInputElement | null>(null)
const uploadResult = ref<AlgorithmTask | null>(null)
const cur = computed(() => services.find(s => s.id === active.value) || services[0])

interface Params { taskName: string; source: string; region: string; format: string; calType?: string; aerosol?: string; dem?: string; resample?: string; cloudThreshold?: number; clipX?: number; clipY?: number; clipW?: number; clipH?: number; indexType?: string; seamline?: string; colorBalance?: boolean; fusionMethod?: string }
const defaultParams: Params = { taskName:'', source:'sentinel2', region:'wuhan', format:'geotiff', calType:'absolute', aerosol:'continental', dem:'srtm30', resample:'bilinear', cloudThreshold:0.15, clipX:100, clipY:100, clipW:256, clipH:256, indexType:'ndvi', seamline:'mcp', colorBalance:true, fusionMethod:'gs' }
const params = reactive<Params>({ ...defaultParams })

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const previewUrl = computed(() => { if (!uploadResult.value?.stats) return ''; const url = (uploadResult.value.stats as any).thumbUrl || (uploadResult.value.stats as any).previewUrl || ''; return url ? `${apiBase}${url.replace('/api/v1', '')}` : '' })
const uploadStats = computed(() => uploadResult.value?.stats || {})
const displayStats = computed(() => {
  const s: Record<string, any> = { ...uploadStats.value }
  delete s.imageSize; delete s.service; delete s.previewUrl; delete s.thumbUrl; delete s.band1ThumbUrl; delete s.band2ThumbUrl
  const labels: Record<string, string> = { ndvi_mean:'NDVI均值', ndvi_std:'标准差', red_mean:'红波段均值', red_std:'红标准差', nir_mean:'近红外均值', nir_std:'近红外标准差', gain:'增益', offset:'偏移', path_radiance:'路径辐射', mean_reflectance:'平均反射率', aerosol_model:'气溶胶模型', rmse_pixels:'RMSE', dem_source:'DEM', cloud_coverage_pct:'云覆盖率', classification:'分类', index_name:'指数类型', mean:'均值', std:'标准差', min:'最小值', max:'最大值' }
  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(s)) { const label = labels[k] || k; result[label] = typeof v === 'number' ? v.toFixed(4) : v }
  return result
})

onMounted(() => {
  refreshCompletedTasks()
  openServiceFromQuery()
})

watch(() => route.query.service, () => {
  openServiceFromQuery()
})

// ═══ 对话框 ═══
function openService(svc: ServiceDef) { active.value = svc.id; resetParams(); uploadResult.value = null; dialogVisible.value = true }
function openServiceFromQuery() {
  const serviceId = String(route.query.service || '')
  const svc = services.find(item => item.id === serviceId)
  if (svc) openService(svc)
}
function triggerUpload(band: 'red' | 'nir') { (band === 'red' ? redInput : nirInput).value?.click() }
function onDrop(band: 'red' | 'nir', e: DragEvent) { const f = e.dataTransfer?.files?.[0]; if (f) uploadAndPreview(band, f) }
async function onFilePicked(band: 'red' | 'nir', e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadAndPreview(band, f) }
async function uploadAndPreview(band: 'red' | 'nir', file: File) {
  if (band === 'red') redFile.value = file; else nirFile.value = file
  const fd = new FormData(); fd.append('file', file)
  try {
    const res = await fetch(`${apiBase}/compute/preview-band`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` },
      body:fd,
    })
    const data = await res.json()
    if (data.code === 0) {
      const url = `${apiBase}${data.data.url.replace('/api/v1', '')}`
      if (band === 'red') redPreviewUrl.value = url; else nirPreviewUrl.value = url
    } else {
      console.warn('Preview upload warning:', data.message)
    }
  } catch (e) {
    console.error('Preview upload failed:', e)
    // 预览失败不影响主流程，用户仍可运行算法
  }
}
function handleFileRemove(band: 'red' | 'nir') { if (band === 'red') { redFile.value = null; redPreviewUrl.value = '' } else { nirFile.value = null; nirPreviewUrl.value = '' } }
function resetParams() { Object.assign(params, { ...defaultParams }); uploadResult.value = null }

async function run() {
  running.value = true; const serviceId = active.value

  // 需要上传文件的算法（mosaic/fusion 使用模拟数据，无需文件）
  const needsFile = !['mosaic', 'fusion'].includes(serviceId)
  if (needsFile && !redFile.value) {
    ElMessage.error('请先上传 TIF 文件')
    running.value = false
    return
  }

  const fd = new FormData()
  if (redFile.value) fd.append('red_band', redFile.value)
  if (nirFile.value) fd.append('nir_band', nirFile.value)
  fd.append('service', serviceId)
  fd.append('task_name', params.taskName.trim())

  const extra: Record<string, any> = {}
  if (serviceId === 'calibration') extra.calType = params.calType
  if (serviceId === 'atmospheric') extra.aerosol = params.aerosol
  if (serviceId === 'geometric') { extra.dem = params.dem; extra.resample = params.resample }
  if (serviceId === 'cloud_detection') extra.threshold = params.cloudThreshold
  if (serviceId === 'clip') { extra.x = params.clipX; extra.y = params.clipY; extra.width = params.clipW; extra.height = params.clipH }
  if (serviceId === 'spectral_index') extra.index_type = params.indexType
  if (serviceId === 'mosaic') { extra.seamline = params.seamline; extra.colorBalance = params.colorBalance }
  if (serviceId === 'fusion') extra.fusionMethod = params.fusionMethod
  fd.append('params', JSON.stringify(extra))

  try {
    const res = await fetch(`${apiBase}/compute/upload`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` },
      body:fd,
    })
    const data = await res.json()
    if (data.code === 0) {
      uploadResult.value = {
        id:0, taskId:data.data.taskId, userId:0, service:serviceId,
        taskName:data.data.taskName,
        params:{}, status:'completed', progress:100, outputPath:'',
        stats:data.data.stats, errorMessage:'',
        createdAt:new Date().toISOString(), completedAt:new Date().toISOString(), elapsedSec:0,
      }
      ElMessage.success(`${cur.value.name} — 完成！已加载到 3D 地图`)
      openGlobeForTask(data.data.taskId)
    } else {
      ElMessage.error(data.message || `计算失败 (code=${data.code})`)
    }
  } catch (e: any) {
    console.error('Compute upload failed:', e)
    ElMessage.error('上传失败，请检查后端服务是否运行')
  }
  running.value = false
}

function downloadCesiumPng() {
  if (!uploadResult.value) return
  fetch(computeApi.getDownloadUrl(uploadResult.value.taskId), { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }).then(r => r.blob()).then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${uploadResult.value!.taskId}_result.tif`; a.click() }).catch(() => ElMessage.error('下载失败'))
}

// ═══ 3D 图层 ═══
function onCesiumReady() { cesiumReady.value = true; for (const c of pendingLayers.value) cesiumRef.value?.addLayer(c); pendingLayers.value = [] }
function addLayerToGlobe(config: CesiumLayerConfig) { if (cesiumReady.value && cesiumRef.value) cesiumRef.value.addLayer(config); else pendingLayers.value.push(config) }
function isTaskLoaded(taskId: string): boolean { return layers.layers.value.some(l => l.id === taskId) }
function loadOneTask(task: AlgorithmTask) {
  if (!isTaskLoaded(task.taskId) && layerCount.value >= MAX_LAYER_COUNT) {
    ElMessage.warning(`最多只能同时叠加 ${MAX_LAYER_COUNT} 个 TIF 结果，请先移除一个图层`)
    return
  }
  const config = layers.addTaskLayer(task)
  if (config) {
    addLayerToGlobe(config)
    taskVisibility[task.taskId] = true
    taskOpacity[task.taskId] = config.opacity
  }
}
function onTaskVisibility(taskId: string, v: boolean) { cesiumRef.value?.setLayerVisible(taskId, v) }
function onTaskOpacity(taskId: string, v: number) { cesiumRef.value?.setLayerOpacity(taskId, v) }
async function refreshCompletedTasks() {
  try {
    const res = await computeApi.getTasks(1, 100)
    const list: AlgorithmTask[] = (res.data as any).data?.list || (res.data as any).list || []
    const realTasks = list.filter(t => t.status === 'completed')
    completedTasks.value = mergeMockTasks(realTasks)
  } catch {
    completedTasks.value = mergeMockTasks([])
  }
}
async function loadFirstFiveTasks() {
  try {
    await refreshCompletedTasks()
    const availableSlots = Math.max(0, MAX_LAYER_COUNT - layerCount.value)
    const loadLimit = Math.min(DEFAULT_VISIBLE_LAYER_TASKS, availableSlots)
    const candidates = filteredTasks.value.filter(task => !isTaskLoaded(task.taskId)).slice(0, loadLimit)
    for (const task of candidates) loadOneTask(task)
    if (filteredTasks.value.length > 0) {
      ElMessage.success(`已加载前 ${candidates.length} 个任务，最多同时叠加 ${MAX_LAYER_COUNT} 个结果`)
    }
  } catch { ElMessage.error('加载失败') }
}
function clearGlobe() { cesiumRef.value?.removeAllLayers(); layers.clearAll(); Object.keys(taskVisibility).forEach(k => delete taskVisibility[k]); Object.keys(taskOpacity).forEach(k => delete taskOpacity[k]); pendingLayers.value = [] }
function removeGlobeLayer(taskId: string) { cesiumRef.value?.removeLayer(taskId); layers.removeLayer(taskId); delete taskVisibility[taskId]; delete taskOpacity[taskId] }
async function openGlobeForTask(taskId: string) {
  try {
    await fetch(computeApi.getImageryUrl(taskId), { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } })
  } catch { /* */ }
  try {
    await refreshCompletedTasks()
  } catch { /* */ }
  const task = completedTasks.value.find(t => t.taskId === taskId)
  if (task && !isTaskLoaded(taskId)) loadOneTask(task)
}
function downloadTif(taskId: string) {
  fetch(computeApi.getDownloadUrl(taskId), { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } }).then(r => r.blob()).then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${taskId}_result.tif`; a.click() }).catch(() => ElMessage.error('下载失败'))
}

// ═══ 拖动 ═══
function onSplitterDown(e: MouseEvent) {
  const sx = e.clientX; const sw = panelWidth.value
  const mm = (ev: MouseEvent) => { panelWidth.value = Math.max(280, Math.min(720, sw - (ev.clientX - sx))) }
  const mu = () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu) }
  document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu)
}

function loadTaskNames(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('rs_task_names') || '{}')
  } catch {
    return {}
  }
}

function saveTaskNames() {
  localStorage.setItem('rs_task_names', JSON.stringify(taskNames))
}

function getTaskName(task: AlgorithmTask): string {
  return task.taskName || taskNames[task.taskId] || buildAutoTaskName(task)
}

function ensureTaskName(task: AlgorithmTask) {
  if (!task.taskName && !taskNames[task.taskId]) {
    taskNames[task.taskId] = buildAutoTaskName(task)
    saveTaskNames()
  }
}

function buildAutoTaskName(task: AlgorithmTask): string {
  const sameService = completedTasks.value
    .filter(t => t.service === task.service)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const index = Math.max(1, sameService.findIndex(t => t.taskId === task.taskId) + 1)
  const stamp = compactTaskTime(task.completedAt || task.createdAt)
  return `${serviceLabel(task.service)}-${String(index).padStart(2, '0')}-${stamp}`
}

function mergeMockTasks(realTasks: AlgorithmTask[]) {
  const realIds = new Set(realTasks.map(task => task.taskId))
  return [
    ...realTasks,
    ...mockTasks.filter(task => !realIds.has(task.taskId)),
  ]
}

async function renameTask(task: AlgorithmTask) {
  if (task.taskId.startsWith('MOCK-')) {
    ElMessage.info('演示任务不保存改名，请对真实任务进行改名')
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请输入新的任务名称', '修改任务名称', {
      inputValue: getTaskName(task),
      inputPlaceholder: '例如：NDVI-武汉东湖-第1次',
      inputValidator: (value) => value.trim().length > 0 || '任务名称不能为空',
    })
    const nextName = value.trim()
    const res = await computeApi.renameTask(task.taskId, nextName)
    task.taskName = ((res.data as any).data?.taskName || nextName)
    ElMessage.success('任务名称已更新')
  } catch {
    // 用户取消
  }
}

function compactTaskTime(value?: string | null): string {
  if (!value) return '未记录'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '未记录'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function formatTaskTime(value?: string | null): string {
  if (!value) return '未记录'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '未记录'
  return d.toLocaleString()
}
</script>

<style scoped>
.asp { display:flex; height:100%; }
/* ═══ 左侧 ═══ */
.asp-sidebar { width:240px; flex-shrink:0; background:#fff; border-right:1px solid #E5E7EB; overflow-y:auto; padding:12px; }
.svc-list { display:flex; flex-direction:column; gap:6px; }
.svc-card { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; cursor:pointer; transition:all .12s; border:1px solid transparent; }
.svc-card:hover { background:#F9FAFB; border-color:#E5E7EB; }
.svc-card.active { background:rgba(37,99,235,0.06); border-color:#2563EB; }
.svc-ico { color:#2563EB; flex-shrink:0; }
.svc-ico .svg-icon { width:20px; height:20px; }
.svc-body { flex:1; min-width:0; }
.svc-body strong { display:block; font-size:17px; font-weight:600; color:#1F2937; white-space:nowrap; margin-bottom:2px; }
.svc-sub { display:flex; align-items:center; gap:6px; min-width:0; }
.svc-desc { font-size:14px; color:#9CA3AF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.svc-cat { font-size:13px; color:#9CA3AF; background:#F3F4F6; padding:2px 6px; border-radius:4px; flex-shrink:0; white-space:nowrap; }

/* ═══ 右侧 ═══ */
.asp-main { flex:1; display:flex; flex-direction:column; min-width:0; background:#F0F2F5; }
.asp-globe-wrap { flex:1; display:flex; min-height:0; position:relative; }
.map-layer-actions { display:flex; align-items:center; gap:6px; padding-left:8px; border-left:1px solid #E5E7EB; flex-shrink:0; }
.map-icon-btn { width:28px; height:28px; padding:0; }
.layer-panel { flex-shrink:0; background:#fff; border-left:1px solid #E5E7EB; display:flex; flex-direction:column; overflow:hidden; }
.lp-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; padding:10px 12px; font-size:16px; font-weight:700; color:#1F2937; border-bottom:1px solid #F3F4F6; }
.lp-head small { display:block; margin-top:2px; font-size:12px; font-weight:400; color:#909399; }
.lp-head-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.lp-count { font-size:14px; color:#9CA3AF; background:#E5E7EB; padding:1px 7px; border-radius:10px; }
.lp-filters { display:flex; flex-direction:column; gap:8px; padding:10px 12px; border-bottom:1px solid #F3F4F6; background:#FAFBFC; }
.lp-list { flex:1; min-height:0; overflow-y:auto; padding:8px 10px 12px; display:flex; flex-direction:column; }
.lp-item { padding:10px 12px; border-radius:10px; margin-bottom:8px; border:1px solid #E5E7EB; background:#fff; box-shadow:0 2px 8px rgba(15,23,42,.04); }
.lp-item.loaded { border-color:#E5E7EB; background:#fff; }
.lp-row { display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; }
.lp-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.lp-info { flex:1; min-width:0; }
.lp-name { display:block; font-size:16px; font-weight:600; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lp-meta { display:block; font-size:12px; color:#6B7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
.lp-id { display:block; font-size:13px; color:#C0C4CC; font-family:monospace; }
.lp-actions { display:flex; align-items:center; gap:8px; }
.lp-load-btn { width:100%; }
.lp-more { width:100%; min-height:42px; margin:8px 0 0; border:1px solid #2563EB; background:linear-gradient(135deg,#2563EB,#3B82F6); color:#fff; border-radius:10px; cursor:pointer; font-size:14px; font-weight:700; letter-spacing:.2px; box-shadow:0 8px 18px rgba(37,99,235,.22); }
.lp-more:hover { background:linear-gradient(135deg,#1D4ED8,#2563EB); transform:translateY(-1px); }
.lp-empty { text-align:center; padding:30px 12px; font-size:15px; color:#C0C4CC; }
.asp-splitter { width:6px; cursor:col-resize; flex-shrink:0; background:#E5E7EB; transition:background .12s; }
.asp-splitter:hover { background:#2563EB; }
.globe-container { flex:1; min-width:0; position:relative; }
.layer-expand { position:absolute; right:12px; top:12px; z-index:20; border:1px solid #2563EB; background:#fff; color:#2563EB; border-radius:18px; padding:7px 12px; cursor:pointer; box-shadow:0 6px 18px rgba(15,23,42,.14); font-size:13px; }
.layer-expand:hover { background:#2563EB; color:#fff; }

/* ═══ 弹窗 ═══ */
.dlg-svc-header { display:flex; align-items:center; gap:12px; padding-bottom:14px; margin-bottom:16px; border-bottom:1px solid #F3F4F6; }
.dlg-ico { color:#2563EB; }
.dlg-ico .svg-icon { width:22px; height:22px; }
.dlg-svc-header strong { font-size:18px; font-weight:700; color:#1F2937; display:block; }
.dlg-svc-header p { font-size:14px; color:#9CA3AF; margin:3px 0 0; }
.dlg-svc-header .el-tag { margin-left:auto; }
.upload-box { position:relative; height:240px; border:2px dashed #D1D5DB; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; background:#FAFBFC; }
.upload-box:hover { border-color:#2563EB; }
.upload-box p { font-size:14px; color:#6B7280; margin:4px 0 0; }
.upload-preview-img { width:100%; height:100%; object-fit:contain; display:block; border-radius:8px; background:#fff; }
.upload-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); color:#fff; font-size:14px; opacity:0; transition:.2s; border-radius:8px; }
.upload-box:hover .upload-overlay { opacity:1; }
/* 结果区 */
.result-box { margin-top:16px; padding:16px; background:#F9FAFB; border-radius:10px; }
.result-title { font-size:16px; font-weight:700; color:#1F2937; margin-bottom:12px; }
.result-preview-wrap { margin-bottom:12px; }
.ndvi-result-img { width:100%; height:240px; object-fit:contain; border-radius:8px; border:1px solid #E5E7EB; background:#fff; display:block; }
.ndvi-placeholder { height:120px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; background:#fff; border-radius:8px; border:1px solid #E5E7EB; }
.ndvi-placeholder p { font-size:14px; color:#C0C4CC; margin:0; }
.stats-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
.stat-cell { padding:8px; background:#fff; border-radius:6px; text-align:center; }
.stat-cell span { display:block; font-size:13px; color:#9CA3AF; margin-bottom:2px; }
.stat-cell b { font-size:16px; font-weight:700; color:#1F2937; }
.result-footer { display:flex; align-items:center; justify-content:space-between; }
.result-size { font-size:13px; color:#9CA3AF; }
</style>




