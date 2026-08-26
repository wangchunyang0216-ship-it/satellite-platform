<template>
  <div class="data-center-clean">
    <!-- ═══ 搜索区 ═══ -->
    <section class="search-hero">
      <div class="search-hero-inner">
        <h1 class="page-title">数据中心</h1>
        <p class="page-sub">搜索全球遥感卫星影像数据</p>
        <div class="search-row">
          <el-autocomplete
            v-model="quickSearch"
            :fetch-suggestions="fetchSuggestions"
            placeholder="输入卫星名称、传感器类型或地理位置…"
            size="large"
            :prefix-icon="Search"
            clearable
            class="search-autocomplete"
            @select="onSuggestionSelect"
            @keyup.enter="handleQuickSearch"
          >
            <template #prepend>
              <el-select v-model="searchScope" size="large" style="width:100px">
                <el-option label="全部" value="all" />
                <el-option label="卫星" value="satellite" />
                <el-option label="传感器" value="sensor" />
                <el-option label="位置" value="location" />
              </el-select>
            </template>
            <template #append>
              <el-button type="primary" @click="handleQuickSearch" :style="{background:'#2563EB',borderColor:'#2563EB',height:'100%'}">
                <el-icon :size="16"><Search /></el-icon>&nbsp;检索
              </el-button>
            </template>
          </el-autocomplete>
          <el-button
            v-if="!showScenario"
            class="scenario-toggle-btn"
            @click="toggleScenario"
          >
            <el-icon :size="16"><Grid /></el-icon>&nbsp;应用场景
          </el-button>
          <el-button
            v-else
            class="scenario-toggle-btn active"
            @click="toggleScenario"
          >
            <el-icon :size="16"><Fold /></el-icon>&nbsp;收起场景
          </el-button>
        </div>
      </div>
    </section>

    <!-- ═══ 主体 ═══ -->
    <div class="page-body">
      <!-- 场景面板（可收起） -->
      <transition name="panel-slide">
        <ScenarioPanel
          v-if="showScenario"
          :scenarios="scenarioConfigs"
          :activeKey="activeScenario"
          :getSatName="getSatNameById"
          @select="onScenarioSelect"
        />
      </transition>

      <!-- 内容区 -->
      <div class="content-main">

        <!-- 统计条 -->
        <section class="stats-bar">
          <div class="stat" v-for="s in statItems" :key="s.label">
            <div class="stat-icon" :style="{background:s.bg,color:s.color}">
              <el-icon :size="18"><component :is="s.icon" /></el-icon>
            </div>
            <div>
              <div class="stat-val">{{ s.value }}</div>
              <div class="stat-lbl">{{ s.label }}</div>
            </div>
            <span class="stat-tag" :class="s.trendUp ? 'up' : 'down'">{{ s.trend }}</span>
          </div>
        </section>

        <!-- ═══ 筛选行 ═══ -->
        <div class="filter-bar">
          <div class="cascade-group">
            <div class="fld">
              <label>卫星</label>
              <el-select v-model="filters.satellite" placeholder="全部" clearable size="default" @change="onSatelliteChange">
                <el-option v-for="s in satellites" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </div>
            <span class="cascade-arrow" :class="{ on: !!filters.satellite }">→</span>
            <div class="fld">
              <label>传感器</label>
              <el-select v-model="filters.sensorType" placeholder="全部" clearable size="default" :disabled="availableSensors.length === 0 && !filters.satellite" @change="onSensorChange">
                <el-option v-for="s in availableSensorOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </div>
            <span class="cascade-arrow" :class="{ on: !!filters.sensorType }">→</span>
            <div class="fld">
              <label>分辨率</label>
              <el-select v-model="filters.resolution" placeholder="全部" clearable size="default" :disabled="availableResolutions.length === 0">
                <el-option v-for="r in availableResolutions" :key="r.value" :label="r.label" :value="r.value" />
              </el-select>
            </div>
          </div>
          <div class="fld">
            <label>日期</label>
            <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" size="default" style="width:200px" />
          </div>
          <div class="fld">
            <label>云量 ≤</label>
            <el-select v-model="filters.cloudMax" size="default" style="width:100px">
              <el-option label="5%" :value="5" />
              <el-option label="10%" :value="10" />
              <el-option label="30%" :value="30" />
              <el-option label="不限" :value="100" />
            </el-select>
          </div>
          <div class="fld fld-actions">
            <el-button type="primary" size="small" @click="handleSearch" :style="{background:'#2563EB',borderColor:'#2563EB'}">筛选</el-button>
            <el-button size="small" @click="handleReset">重置</el-button>
          </div>
          <el-tag v-if="activeScenario" closable size="small" effect="plain" type="primary" @close="clearScenario" class="scenario-tag">
            {{ activeScenarioLabel }}
          </el-tag>
        </div>

        <!-- ═══ 卫星舰队 ═══ -->
        <div class="section-head">
          <h2><el-icon :size="16"><Monitor /></el-icon>在轨卫星舰队</h2>
          <span class="hint" @click="showFleet=!showFleet" style="cursor:pointer">{{ showFleet ? '收起' : '展开' }}</span>
        </div>
        <div v-show="showFleet" class="fleet">
          <div v-for="sat in satellites" :key="sat.id"
            class="sat-card" :class="{sel:filters.satellite===sat.id}"
            @click="filters.satellite = filters.satellite===sat.id ? '' : sat.id">
            <div class="sat-top">
              <span class="sat-ico"><el-icon :size="22"><component :is="sat.icon" /></el-icon></span>
              <span class="sat-tag" :class="sat.status==='active'?'on':'off'">{{ sat.status==='active'?'运行中':'维护中' }}</span>
            </div>
            <div class="sat-body">
              <h4>{{ sat.name }}</h4>
              <p>{{ sat.owner }}</p>
              <div class="sat-specs">
                <div class="sp"><span class="sp-l">传感器</span><span class="sp-v">{{ sat.sensorType }}</span></div>
                <div class="sp"><span class="sp-l">分辨率</span><span class="sp-v hi">{{ sat.resolution }}</span></div>
                <div class="sp"><span class="sp-l">幅宽</span><span class="sp-v">{{ sat.swath }}</span></div>
                <div class="sp"><span class="sp-l">数据量</span><span class="sp-v hi">{{ sat.sceneCount.toLocaleString() }} 景</span></div>
              </div>
            </div>
            <div class="sat-foot">
              <el-button type="primary" plain size="small" @click.stop="viewSatelliteData(sat.id)">查看数据 →</el-button>
            </div>
          </div>
        </div>

        <!-- ═══ 数据目录 ═══ -->
        <div class="section-head">
          <h2><el-icon :size="16"><List /></el-icon>数据产品目录</h2>
          <div class="head-right">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="table">列表</el-radio-button>
              <el-radio-button value="grid">卡片</el-radio-button>
            </el-radio-group>
            <span class="count-badge">{{ filteredScenes.length }} 条</span>
          </div>
        </div>

        <!-- 表视图 -->
        <div v-if="viewMode==='table'" class="card table-card">
          <el-table :data="pagedScenes" stripe header-cell-class-name="tbl-head" row-class-name="tbl-row" class="clean-table">
            <el-table-column label="预览" width="100" align="center">
              <template #default="{row}">
                <div class="thumb" :style="{backgroundImage:'url('+getPreviewUrl(row)+')'}">
                  <div class="thumb-mask"><el-icon :size="16"><ZoomIn /></el-icon></div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sceneName" label="影像标识" min-width="260" show-overflow-tooltip>
              <template #default="{row}">
                <div class="scene-name-col"><span class="sn">{{ row.sceneName }}</span><span class="sp">{{ row.path }}</span></div>
              </template>
            </el-table-column>
            <el-table-column prop="satellite" label="卫星" width="120" align="center" />
            <el-table-column prop="sensorType" label="传感器" width="85" align="center" />
            <el-table-column prop="date" label="采集时间" width="120" align="center" sortable>
              <template #default="{row}">{{ row.date }} {{ row.time }}</template>
            </el-table-column>
            <el-table-column prop="resolution" label="分辨率" width="85" align="center" sortable>
              <template #default="{row}"><span class="res-pill">{{ row.resolution }}m</span></template>
            </el-table-column>
            <el-table-column prop="cloudCoverage" label="云量" width="75" align="center" sortable>
              <template #default="{row}"><span class="cloud-tag" :class="row.cloudCoverage<10?'low':row.cloudCoverage<30?'mid':'high'">{{ row.cloudCoverage }}%</span></template>
            </el-table-column>
            <el-table-column prop="coverage" label="范围" width="95" align="center" />
            <el-table-column prop="size" label="大小" width="85" align="center" sortable />
            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="{row}">
                <el-button link type="primary" size="small" @click="viewDetail(row.id)">详情</el-button>
                <el-button link type="primary" size="small" @click="addToCart(row)" style="color:#059669"><el-icon :size="14"><ShoppingCart /></el-icon>订购</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredScenes.length" layout="prev, pager, next, sizes, total" :page-sizes="[10,20,50]" background small />
          </div>
        </div>

        <!-- 卡片视图 -->
        <div v-else class="scene-grid">
          <div v-for="scene in pagedScenes" :key="scene.id" class="scene-card" @click="viewDetail(scene.id)">
            <div class="scene-img" :style="{backgroundImage:'url('+getPreviewUrl(scene)+')'}">
              <div class="scene-badges">
                <span class="cloud-tag" :class="scene.cloudCoverage<10?'low':scene.cloudCoverage<30?'mid':'high'"><el-icon :size="12"><Cloudy /></el-icon>{{ scene.cloudCoverage }}%</span>
                <span class="res-pill">{{ scene.resolution }}m</span>
              </div>
              <div class="scene-hover"><el-icon :size="28"><ZoomIn /></el-icon><span>查看详情</span></div>
            </div>
            <div class="scene-info">
              <h5>{{ scene.satellite }}</h5>
              <p>{{ scene.sceneName }}</p>
              <div class="scene-meta">
                <span><el-icon :size="12"><Calendar /></el-icon>{{ scene.date }}</span>
                <span>{{ scene.size }}</span>
              </div>
            </div>
          </div>
          <div class="pager">
            <el-pagination v-model:current-page="currentPage" :page-size="gridPageSize" :total="filteredScenes.length" layout="prev, pager, next, sizes" :page-sizes="[12,24,48]" background small />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, ZoomIn, Monitor, FolderOpened, Odometer, TrendCharts,
  Connection, Aim, MapLocation, Promotion, View, ShoppingCart, Cloudy, Calendar, List, Grid, Fold,
} from '@element-plus/icons-vue'
import ScenarioPanel from '@/components/data/ScenarioPanel.vue'
import {
  scenarioConfigs, satelliteSensorMap, getSuggestionSources, sensorTypeMapping,
} from '@/config/scenarioFilters'
import type { ScenarioFilterPreset } from '@/config/scenarioFilters'

const router = useRouter()

// ═══ 统计 ═══
const statItems = [
  { label:'在轨卫星', value:'12 颗', color:'#2563EB', bg:'rgba(37,99,235,0.08)', icon:Monitor, trend:'+2', trendUp:true },
  { label:'数据产品', value:'48 类', color:'#059669', bg:'rgba(5,150,105,0.08)', icon:FolderOpened, trend:'+5', trendUp:true },
  { label:'影像总量', value:'156,800', color:'#D97706', bg:'rgba(217,119,6,0.08)', icon:Odometer, trend:'+12%', trendUp:true },
  { label:'覆盖面积', value:'8,520 万km²', color:'#7C3AED', bg:'rgba(124,58,237,0.08)', icon:TrendCharts, trend:'+8%', trendUp:true },
]

// ═══ 搜索 ═══
const quickSearch = ref('')
const searchScope = ref('all')
const searchFilterText = ref('')
const showScenario = ref(false)
const hotTags = ['应急救灾', '智慧农业', '高分七号', '哨兵二号', '云量<5%', '近7天']

function toggleScenario() { showScenario.value = !showScenario.value }

// ═══ 卫星 ═══
const satellites = ref([
  { id:'fy4a', name:'风云四号A星', icon:Monitor, owner:'中国气象局', sensorType:'多光谱成像仪', resolution:'500m', swath:'3,000km', revisit:'5分钟', altitude:'35,786km', launchDate:'2016-12-11', status:'active', sceneCount:28500 },
  { id:'fy3e', name:'风云三号E星', icon:Connection, owner:'中国气象局', sensorType:'微波/高光谱', resolution:'250m', swath:'1,200km', revisit:'12小时', altitude:'836km', launchDate:'2021-07-05', status:'active', sceneCount:42300 },
  { id:'gf6', name:'高分六号', icon:Aim, owner:'中国资源卫星中心', sensorType:'多光谱 PMS', resolution:'2m', swath:'90km', revisit:'4天', altitude:'644km', launchDate:'2018-06-02', status:'active', sceneCount:18600 },
  { id:'gf7', name:'高分七号', icon:MapLocation, owner:'中国资源卫星中心', sensorType:'立体测绘仪', resolution:'0.65m', swath:'20km', revisit:'5天', altitude:'506km', launchDate:'2019-11-03', status:'active', sceneCount:12400 },
  { id:'sentinel2', name:'哨兵二号', icon:Promotion, owner:'ESA', sensorType:'MSI 多光谱', resolution:'10m', swath:'290km', revisit:'5天', altitude:'786km', launchDate:'2015-06-23', status:'active', sceneCount:35200 },
  { id:'landsat9', name:'Landsat-9', icon:View, owner:'NASA/USGS', sensorType:'OLI-2/TIRS-2', resolution:'30m', swath:'185km', revisit:'16天', altitude:'705km', launchDate:'2021-09-27', status:'active', sceneCount:19800 },
])

// ═══ 场景数据 ═══
interface Scene { id:string; sceneName:string; path:string; satellite:string; sensorType:string; date:string; time:string; resolution:number; cloudCoverage:number; coverage:string; size:string; price:number; gradient:string; lng:number; lat:number; zoom:number }

const demoScenes: Scene[] = [
  { id:'s1', sceneName:'LC08_L1TP_123039_20250315', path:'WRS-2 / Row 39 / Path 123', satellite:'风云四号A星', sensorType:'多光谱', date:'2025-03-15', time:'10:32:18', resolution:500, cloudCoverage:2.3, coverage:'武汉', size:'1.8 GB', price:0, gradient:'', lng:114.30, lat:30.60, zoom:11 },
  { id:'s2', sceneName:'GF6_PMS_E113.5_N30.2_20250310', path:'GF6 / PMS / L1A', satellite:'高分六号', sensorType:'多光谱', date:'2025-03-10', time:'14:15:42', resolution:2, cloudCoverage:5.8, coverage:'武汉', size:'3.2 GB', price:120, gradient:'', lng:114.35, lat:30.55, zoom:12 },
  { id:'s3', sceneName:'S2A_MSIL2A_20250312_T50SKU', path:'S2A / MSI / L2A / T50SKU', satellite:'哨兵二号', sensorType:'MSI', date:'2025-03-12', time:'11:08:33', resolution:10, cloudCoverage:1.5, coverage:'武汉', size:'980 MB', price:0, gradient:'', lng:114.28, lat:30.58, zoom:11 },
  { id:'s4', sceneName:'GF7_DLC_E114.2_N30.5_20250308', path:'GF7 / DLC / L1', satellite:'高分七号', sensorType:'立体测绘', date:'2025-03-08', time:'09:44:17', resolution:0.65, cloudCoverage:3.1, coverage:'武汉', size:'5.6 GB', price:280, gradient:'', lng:114.20, lat:30.50, zoom:13 },
  { id:'s5', sceneName:'LC09_L1TP_123039_20250228', path:'WRS-2 / Row 39 / Path 123', satellite:'Landsat-9', sensorType:'OLI-2', date:'2025-02-28', time:'10:18:52', resolution:30, cloudCoverage:0.8, coverage:'北京', size:'890 MB', price:0, gradient:'', lng:116.40, lat:39.90, zoom:10 },
  { id:'s6', sceneName:'S2B_MSIL2A_20250301_T50SLJ', path:'S2B / MSI / L2A / T50SLJ', satellite:'哨兵二号', sensorType:'MSI', date:'2025-03-01', time:'10:52:11', resolution:10, cloudCoverage:8.6, coverage:'北京', size:'1.1 GB', price:0, gradient:'', lng:116.38, lat:39.92, zoom:10 },
  { id:'s7', sceneName:'FY4A_AGRI_L1_20250314_0800', path:'FY4A / AGRI / L1', satellite:'风云四号A星', sensorType:'多光谱', date:'2025-03-14', time:'08:00:00', resolution:500, cloudCoverage:15.2, coverage:'南海', size:'620 MB', price:0, gradient:'', lng:115.50, lat:16.80, zoom:9 },
  { id:'s8', sceneName:'FY3E_MWTS_L1_20250313', path:'FY3E / MWTS / L1', satellite:'风云三号E星', sensorType:'微波温度计', date:'2025-03-13', time:'18:22:07', resolution:250, cloudCoverage:45.0, coverage:'东海', size:'340 MB', price:0, gradient:'', lng:124.00, lat:28.50, zoom:9 },
  { id:'s9', sceneName:'GF6_WFV_E114.1_N30.6_20250305', path:'GF6 / WFV / L1A', satellite:'高分六号', sensorType:'多光谱', date:'2025-03-05', time:'13:28:19', resolution:16, cloudCoverage:6.4, coverage:'武汉', size:'1.5 GB', price:80, gradient:'', lng:114.10, lat:30.60, zoom:11 },
  { id:'s10', sceneName:'LC08_L1TP_122040_20250320', path:'WRS-2 / Row 40 / Path 122', satellite:'Landsat-9', sensorType:'TIRS-2', date:'2025-03-20', time:'10:35:44', resolution:100, cloudCoverage:0.3, coverage:'上海', size:'760 MB', price:0, gradient:'', lng:121.47, lat:31.23, zoom:10 },
  { id:'s11', sceneName:'FY3E_HIRAS_L1_20250318', path:'FY3E / HIRAS / L1', satellite:'风云三号E星', sensorType:'高光谱', date:'2025-03-18', time:'07:15:30', resolution:250, cloudCoverage:12.7, coverage:'新疆', size:'520 MB', price:0, gradient:'', lng:87.60, lat:43.80, zoom:8 },
  { id:'s12', sceneName:'GF7_DLC_E121.4_N31.2_20250322', path:'GF7 / DLC / L1', satellite:'高分七号', sensorType:'立体测绘', date:'2025-03-22', time:'10:11:05', resolution:0.65, cloudCoverage:1.9, coverage:'上海', size:'4.8 GB', price:280, gradient:'', lng:121.40, lat:31.20, zoom:13 },
]

// ═══ 筛选状态 ═══
const filters = reactive({ satellite:'', sensorType:'', resolution:'', dateRange:null as [string,string]|null, cloudMax:100 })
const viewMode = ref('table')
const currentPage = ref(1)
const pageSize = ref(10)
const gridPageSize = ref(12)
const showFleet = ref(true)

// ═══ 场景 ═══
const activeScenario = ref('')
const activeScenarioFilter = ref<ScenarioFilterPreset | null>(null)
const activeScenarioLabel = computed(() => scenarioConfigs.find(s => s.key === activeScenario.value)?.label || '')

// ═══ 级联 ═══
const availableSensors = computed<{ value:string; label:string }[]>(() => {
  const all = [
    { value:'optical', label:'光学' }, { value:'sar', label:'SAR 雷达' },
    { value:'hyperspectral', label:'高光谱' }, { value:'multispectral', label:'多光谱' },
    { value:'stereo', label:'立体测绘' }, { value:'thermal', label:'热红外' },
  ]
  if (!filters.satellite) return all
  const mapped = satelliteSensorMap[filters.satellite]
  if (!mapped) return all
  const vals = new Set<string>()
  for (const s of mapped) {
    if (s.label.includes('多光谱') || s.label.includes('MSI') || s.label.includes('OLI')) vals.add('multispectral')
    if (s.label.includes('立体')) vals.add('stereo')
    if (s.label.includes('高光谱')) vals.add('hyperspectral')
    if (s.label.includes('热红外') || s.label.includes('TIRS')) vals.add('thermal')
    if (s.label.includes('微波')) vals.add('sar')
  }
  return all.filter(a => vals.has(a.value))
})

const availableSensorOptions = computed(() => filters.satellite ? availableSensors.value : [
  { value:'optical', label:'光学' }, { value:'sar', label:'SAR 雷达' },
  { value:'hyperspectral', label:'高光谱' }, { value:'multispectral', label:'多光谱' },
])

const availableResolutions = computed(() => {
  if (!filters.satellite) return [
    { label:'≤ 1m 超高分辨', value:'vh' }, { label:'1m–5m 高分辨', value:'high' },
    { label:'5m–30m 中分辨', value:'mid' }, { label:'> 30m 低分辨', value:'low' },
  ]
  const mapped = satelliteSensorMap[filters.satellite]
  if (!mapped) return []
  let minR = Infinity, maxR = 0
  for (const s of mapped) { minR = Math.min(minR, s.resolutionRange[0]); maxR = Math.max(maxR, s.resolutionRange[1]) }
  const opts: { label:string; value:string }[] = []
  if (minR <= 1) opts.push({ label:`≤ 1m`, value:'vh' })
  if (maxR > 1 && minR < 5) opts.push({ label:'1m–5m', value:'high' })
  if (maxR >= 5) opts.push({ label:'5m–30m', value:'mid' })
  if (maxR >= 30) opts.push({ label:'> 30m', value:'low' })
  return opts
})

function onSatelliteChange() { filters.sensorType = ''; filters.resolution = '' }
function onSensorChange() { filters.resolution = '' }

// ═══ 场景选择 ═══
function onScenarioSelect(key: string, preset: ScenarioFilterPreset) {
  activeScenario.value = key
  activeScenarioFilter.value = preset
  if (preset.timeRangeDays) {
    const end = new Date()
    const start = new Date(); start.setDate(start.getDate() - preset.timeRangeDays)
    const fmt = (d:Date) => d.toISOString().slice(0,10)
    filters.dateRange = [fmt(start), fmt(end)]
  }
  if (preset.platforms?.length) filters.satellite = preset.platforms[0]
  if (preset.sensorTypes?.length) filters.sensorType = preset.sensorTypes[0]
  if (preset.cloudMax !== undefined) filters.cloudMax = preset.cloudMax
  if (preset.resolutionMin !== undefined || preset.resolutionMax !== undefined) {
    const mx = preset.resolutionMax || 999
    if (mx <= 1) filters.resolution = 'vh'
    else if (mx <= 5) filters.resolution = 'high'
    else if (mx <= 30) filters.resolution = 'mid'
    else filters.resolution = 'low'
  }
  currentPage.value = 1
}

function clearScenario() { activeScenario.value = ''; activeScenarioFilter.value = null }
function getSatNameById(id: string): string { return satellites.value.find(s => s.id === id)?.name || id }

// ═══ 筛选 ═══
const filteredScenes = computed(() => {
  let s = [...demoScenes]
  if (activeScenarioFilter.value) {
    const p = activeScenarioFilter.value
    if (p.platforms?.length) {
      const names = p.platforms.map(x => satellites.value.find(sat => sat.id === x)?.name || '').filter(Boolean)
      if (names.length) s = s.filter(x => names.includes(x.satellite))
    }
    if (p.sensorTypes?.length) {
      const allowed = p.sensorTypes.flatMap(t => sensorTypeMapping[t] || [])
      if (allowed.length) s = s.filter(x => allowed.includes(x.sensorType))
    }
    if (p.cloudMax !== undefined) s = s.filter(x => x.cloudCoverage <= p.cloudMax)
    if (p.resolutionMin !== undefined) s = s.filter(x => x.resolution >= p.resolutionMin!)
    if (p.resolutionMax !== undefined) s = s.filter(x => x.resolution <= p.resolutionMax!)
  }
  if (filters.satellite) {
    const sat = satellites.value.find(x => x.id === filters.satellite)
    if (sat) s = s.filter(x => x.satellite === sat.name)
  }
  if (filters.sensorType) {
    const allowed = sensorTypeMapping[filters.sensorType] || [filters.sensorType]
    s = s.filter(x => allowed.includes(x.sensorType))
  }
  if (filters.resolution) {
    const bands: Record<string,[number,number]> = { vh:[0,1], high:[1.01,5], mid:[5.01,30], low:[30.01,9999] }
    const [lo,hi] = bands[filters.resolution] || [0,9999]
    s = s.filter(x => x.resolution >= lo && x.resolution <= hi)
  }
  if (filters.dateRange) { const [st,en] = filters.dateRange; s = s.filter(x => x.date >= st && x.date <= en) }
  s = s.filter(x => x.cloudCoverage <= filters.cloudMax)
  if (searchFilterText.value) {
    const q = searchFilterText.value.toLowerCase()
    s = s.filter(x => x.satellite.toLowerCase().includes(q) || x.sensorType.toLowerCase().includes(q) || x.coverage.toLowerCase().includes(q) || x.sceneName.toLowerCase().includes(q))
  }
  return s
})

const pagedScenes = computed(() => {
  const ps = viewMode.value === 'grid' ? gridPageSize.value : pageSize.value
  return filteredScenes.value.slice((currentPage.value-1)*ps, (currentPage.value-1)*ps+ps)
})

// ═══ 搜索 ═══
function fetchSuggestions(qs: string, cb: Function) {
  const q = qs.toLowerCase()
  const satNames = satellites.value.map(s => s.name)
  const locs = [...new Set(demoScenes.map(s => s.coverage))]
  const sources = getSuggestionSources(satNames, locs)
  let src = sources
  if (searchScope.value === 'satellite') src = satNames
  else if (searchScope.value === 'sensor') src = sources.filter(x => !satNames.includes(x) && !locs.includes(x))
  else if (searchScope.value === 'location') src = locs
  cb([...new Set(src)].filter(s => s.toLowerCase().includes(q)).slice(0, 8).map(s => ({ value:s, label:s })))
}

function onSuggestionSelect(item: { value:string }) { quickSearch.value = item.value; handleQuickSearch() }

function handleQuickSearch() {
  searchFilterText.value = quickSearch.value
  currentPage.value = 1
  if (quickSearch.value) ElMessage.success(`搜索 "${quickSearch.value}" — ${filteredScenes.value.length} 条结果`)
}

function handleSearch() { currentPage.value = 1; ElMessage.success(`检索到 ${filteredScenes.value.length} 景数据`) }

function handleReset() {
  Object.assign(filters, { satellite:'', sensorType:'', resolution:'', dateRange:null, cloudMax:100 })
  quickSearch.value = ''; searchFilterText.value = ''; searchScope.value = 'all'
  clearScenario(); currentPage.value = 1
}

// ═══ 辅助 ═══
function getPreviewUrl(scene: Scene) {
  const z = scene.zoom || 11, lng = scene.lng || 114.3, lat = scene.lat || 30.6
  function lng2tile(lon:number, zoom:number){ return Math.floor((lon+180)/360*Math.pow(2,zoom)) }
  function lat2tile(lat2:number, zoom:number){ return Math.floor((1-Math.log(Math.tan(lat2*Math.PI/180)+1/Math.cos(lat2*Math.PI/180))/Math.PI)/2*Math.pow(2,zoom)) }
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${lat2tile(lat,z)}/${lng2tile(lng,z)}`
}

function viewDetail(id:string) { router.push('/console/data/' + id) }
function viewSatelliteData(id:string) { filters.satellite = id; handleSearch() }
function addToCart(s:Scene) { ElMessage.success(`已添加 "${s.sceneName}" 到购物车`) }
</script>

<style scoped>
/* ═══ 根 ═══ */
.data-center-clean { flex:1; display:flex; flex-direction:column; min-height:0; overflow:hidden; background:#F5F6F8; }

/* ═══ 搜索区 ═══ */
.search-hero {
  flex-shrink:0;
  background:linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%);
  border-bottom:1px solid #E5E7EB;
  padding:18px 20px 16px;
}
.search-hero-inner { width:100%; }
.page-title { font-size:24px; font-weight:800; color:#1F2937; margin:0 0 2px; }
.page-sub { font-size:15px; color:#9CA3AF; margin:0 0 14px; }
.search-row { display:flex; gap:10px; align-items:center; }
.search-autocomplete { flex:1; }
.search-autocomplete :deep(.el-input__wrapper) {
  border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.06);
}
.search-autocomplete :deep(.el-input-group__prepend) { padding:0; border:none; background:transparent; }
.search-autocomplete :deep(.el-input-group__prepend .el-select .el-input__wrapper) {
  border-radius:8px 0 0 8px; border-right:1px solid #E5E7EB; box-shadow:none; background:#F9FAFB;
}
.search-autocomplete :deep(.el-input-group__append) { border-radius:0 8px 8px 0; padding:0; }
.scenario-toggle-btn {
  flex-shrink:0; height:40px; border:1px solid #D1D5DB; background:#fff;
  color:#374151; border-radius:8px; font-size:15px; transition:all .15s;
}
.scenario-toggle-btn:hover { border-color:#2563EB; color:#2563EB; background:#F9FAFB; }
.scenario-toggle-btn.active { border-color:#2563EB; color:#2563EB; background:rgba(37,99,235,0.04); }

/* ═══ 主体 ═══ */
.page-body { display:flex; flex:1; min-height:0; overflow:hidden; }

/* 场景面板过渡 */
.panel-slide-enter-active, .panel-slide-leave-active { transition:all .25s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { width:0; opacity:0; }
.panel-slide-enter-to, .panel-slide-leave-from { width:200px; opacity:1; }

/* ═══ 内容区 ═══ */
.content-main { flex:1; overflow-y:auto; padding:16px 20px 60px; min-height:0; }

/* ═══ 统计条 ═══ */
.stats-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.stat { display:flex; align-items:center; gap:10px; padding:14px 16px; background:#fff; border-radius:8px; border:1px solid #F0F1F3; }
.stat-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.stat-val { font-size:18px; font-weight:700; color:#1F2937; line-height:1.2; }
.stat-lbl { font-size:13px; color:#9CA3AF; }
.stat-tag { margin-left:auto; font-size:13px; font-weight:600; padding:2px 7px; border-radius:6px; }
.stat-tag.up { color:#059669; background:rgba(5,150,105,0.08); }
.stat-tag.down { color:#DC2626; background:rgba(220,38,38,0.08); }

/* ═══ 筛选行 ═══ */
.filter-bar {
  display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;
  padding:14px 18px; margin-bottom:16px; background:#fff; border-radius:8px;
  border:1px solid #F0F1F3; box-shadow:0 1px 3px rgba(0,0,0,0.03);
}
.cascade-group { display:flex; align-items:center; gap:0; }
.cascade-group .fld { min-width:105px; }
.cascade-group .fld .el-select { width:120px; }
.cascade-arrow { font-size:17px; color:#D1D5DB; margin:0 4px 6px; user-select:none; transition:color .15s; }
.cascade-arrow.on { color:#2563EB; font-weight:700; }
.fld { display:flex; flex-direction:column; gap:3px; }
.fld label { font-size:13px; color:#999; font-weight:600; letter-spacing:.2px; }
.fld-actions { flex-direction:row; align-items:center; gap:6px; padding-bottom:2px; }
.scenario-tag { margin-left:auto; flex-shrink:0; }

/* ═══ 分区标题 ═══ */
.section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.section-head h2 { font-size:16px; font-weight:700; color:#111; margin:0; display:flex; align-items:center; gap:5px; }
.head-right { display:flex; align-items:center; gap:10px; }
.hint { font-size:14px; color:#999; }
.count-badge { font-size:14px; color:#666; background:#f0f0f0; padding:2px 10px; border-radius:10px; font-weight:500; }

/* ═══ 卫星舰队 ═══ */
.fleet { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px; }
.sat-card {
  padding:16px; background:#fff; border-radius:8px; border:1px solid #eee;
  cursor:pointer; transition:all .15s;
}
.sat-card:hover { border-color:#bbb; }
.sat-card.sel { border-color:#2563EB; box-shadow:0 0 0 2px rgba(37,99,235,0.1); }
.sat-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.sat-ico { color:#2563EB; }
.sat-tag { font-size:12px; padding:2px 7px; border-radius:4px; font-weight:600; }
.sat-tag.on { color:#059669; background:rgba(5,150,105,0.08); }
.sat-tag.off { color:#D97706; background:rgba(217,119,6,0.08); }
.sat-body h4 { font-size:19px; font-weight:700; color:#1F2937; margin:0 0 1px; }
.sat-body p { font-size:13px; color:#9CA3AF; margin:0 0 8px; }
.sat-specs { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.sat-specs .sp { display:flex; justify-content:space-between; font-size:13px; }
.sp-l { color:#9CA3AF; }
.sp-v { color:#374151; font-weight:500; }
.sp-v.hi { color:#2563EB; font-weight:600; }
.sat-foot { margin-top:10px; padding-top:10px; border-top:1px solid #F3F4F6; }

/* ═══ 表格 ═══ */
.table-card { padding:0; overflow:hidden; }
.clean-table { font-size:15px; }
:deep(.tbl-head) { background:#F9FAFB; color:#6B7280; font-size:14px; font-weight:600; }
:deep(.tbl-row) { cursor:pointer; }
.thumb { width:84px; height:58px; background-size:cover; background-position:center; border-radius:5px; position:relative; overflow:hidden; margin:0 auto; }
.thumb-mask { position:absolute; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; opacity:0; transition:.15s; color:#fff; }
.thumb:hover .thumb-mask { opacity:1; }
.scene-name-col { display:flex; flex-direction:column; }
.sn { font-weight:600; color:#1F2937; font-size:15px; }
.sp { font-size:13px; color:#9CA3AF; font-family:monospace; }
.res-pill { font-size:13px; padding:1px 7px; border-radius:4px; background:rgba(37,99,235,0.07); color:#2563EB; font-weight:600; white-space:nowrap; }
.cloud-tag { font-size:13px; font-weight:600; padding:1px 5px; border-radius:4px; display:inline-flex; align-items:center; gap:2px; }
.cloud-tag.low { color:#059669; background:rgba(5,150,105,0.07); }
.cloud-tag.mid { color:#D97706; background:rgba(217,119,6,0.07); }
.cloud-tag.high { color:#DC2626; background:rgba(220,38,38,0.07); }
.pager { display:flex; justify-content:center; margin-top:18px; }

/* ═══ 卡片视图 ═══ */
.scene-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
.scene-card {
  background:#fff; border-radius:8px; border:1px solid #F0F1F3;
  overflow:hidden; cursor:pointer; transition:all .15s; box-shadow:0 1px 3px rgba(0,0,0,0.03);
}
.scene-card:hover { transform:translateY(-3px); box-shadow:0 8px 22px rgba(0,0,0,0.07); }
.scene-img { height:140px; background-size:cover; background-position:center; position:relative; }
.scene-badges { position:absolute; top:6px; left:6px; display:flex; gap:4px; }
.scene-hover { position:absolute; inset:0; background:rgba(0,0,0,0.45); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; color:#fff; font-size:15px; opacity:0; transition:.2s; }
.scene-card:hover .scene-hover { opacity:1; }
.scene-info { padding:10px 12px; }
.scene-info h5 { font-size:15px; font-weight:700; color:#1F2937; margin:0 0 1px; }
.scene-info > p { font-size:13px; color:#6B7280; margin:0 0 5px; }
.scene-meta { display:flex; justify-content:space-between; font-size:13px; color:#9CA3AF; }
.scene-meta span { display:flex; align-items:center; gap:3px; }

@media (max-width:900px) { .stats-bar{grid-template-columns:repeat(2,1fr)} .fleet{grid-template-columns:repeat(2,1fr)} .scene-grid{grid-template-columns:repeat(3,1fr)} }
@media (max-width:700px) { .fleet{grid-template-columns:1fr} .scene-grid{grid-template-columns:repeat(2,1fr)} .stats-bar{grid-template-columns:1fr} }
</style>
