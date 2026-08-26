<template>
  <div class="page">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/console/data' }">数据中心</el-breadcrumb-item>
      <el-breadcrumb-item>数据详情</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="detail-layout" v-if="scene">
      <!-- 预览 -->
      <section class="preview-area">
        <div class="preview-map" ref="mapContainer"></div>
        <div class="preview-label">{{ scene.satellite }} · {{ scene.coverage }} · {{ scene.date }}</div>
      </section>

      <!-- 信息 -->
      <aside class="info-panel">
        <el-card shadow="never">
          <template #header><span class="panel-title">影像信息</span></template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="影像标识">{{ scene.sceneName }}</el-descriptions-item>
            <el-descriptions-item label="卫星">{{ scene.satellite }}</el-descriptions-item>
            <el-descriptions-item label="传感器">{{ scene.sensorType }}</el-descriptions-item>
            <el-descriptions-item label="采集时间">{{ scene.date }} {{ scene.time }}</el-descriptions-item>
            <el-descriptions-item label="分辨率"><b style="color:#2563EB">{{ scene.resolution }}m</b></el-descriptions-item>
            <el-descriptions-item label="云覆盖率">{{ scene.cloudCoverage }}%</el-descriptions-item>
            <el-descriptions-item label="覆盖范围">{{ scene.coverage }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ scene.size }}</el-descriptions-item>
            <el-descriptions-item label="轨道参数">{{ scene.path }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 卫星介绍 -->
        <el-card shadow="never" style="margin-top:12px" v-if="satInfo">
          <template #header><span class="panel-title">{{ satInfo.name }} · 卫星介绍</span></template>
          <div class="sat-intro">
            <p><b>所属机构：</b>{{ satInfo.owner }}</p>
            <p><b>传感器：</b>{{ satInfo.sensorType }}</p>
            <p><b>分辨率：</b>{{ satInfo.resolution }}</p>
            <p><b>幅宽：</b>{{ satInfo.swath }}</p>
            <p><b>轨道高度：</b>{{ satInfo.altitude }}</p>
            <p><b>重访周期：</b>{{ satInfo.revisit }}</p>
            <p><b>发射日期：</b>{{ satInfo.launchDate }}</p>
            <p><b>状态：</b><span :style="{color:satInfo.status==='active'?'#059669':'#D97706'}">{{ satInfo.status==='active'?'✅ 运行中':'⚠️ 维护中' }}</span></p>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top:12px">
          <el-button type="primary" style="width:100%;margin-bottom:8px" @click="addToCart">加入购物车</el-button>
          <el-button style="width:100%" @click="$router.back()">返回列表</el-button>
        </el-card>
      </aside>
    </div>

    <div v-else class="not-found">
      <el-empty description="未找到该数据产品" />
      <el-button type="primary" @click="$router.push('/console/data')">返回数据中心</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import L from 'leaflet'

const route = useRoute()
const mapContainer = ref<HTMLElement>()
const scene = ref<any>(null)
const satInfo = ref<any>(null)

const satellites = [
  { id:'fy4a', name:'风云四号A星', owner:'中国气象局', sensorType:'多光谱成像仪', resolution:'500m', swath:'3,000km', revisit:'5分钟', altitude:'35,786km', launchDate:'2016-12-11', status:'active' },
  { id:'fy3e', name:'风云三号E星', owner:'中国气象局', sensorType:'微波/高光谱', resolution:'250m', swath:'2,800km', revisit:'6小时', altitude:'836km', launchDate:'2021-07-05', status:'active' },
  { id:'gf6', name:'高分六号', owner:'中国资源卫星中心', sensorType:'多光谱 PMS', resolution:'2m', swath:'90km', revisit:'4天', altitude:'644km', launchDate:'2018-06-02', status:'active' },
  { id:'gf7', name:'高分七号', owner:'中国资源卫星中心', sensorType:'立体测绘仪', resolution:'0.65m', swath:'20km', revisit:'5天', altitude:'506km', launchDate:'2019-11-03', status:'active' },
  { id:'sentinel2', name:'哨兵二号', owner:'ESA 欧洲空间局', sensorType:'MSI 多光谱', resolution:'10m', swath:'290km', revisit:'5天', altitude:'786km', launchDate:'2015-06-23', status:'active' },
  { id:'landsat9', name:'Landsat-9', owner:'NASA / USGS', sensorType:'OLI-2 / TIRS-2', resolution:'30m', swath:'185km', revisit:'16天', altitude:'705km', launchDate:'2021-09-27', status:'active' },
]

const scenes: any[] = [
  { id:'s1', sceneName:'GF6_PMS_L1A_20260716T0330', path:'Path/Row: 123/039', satellite:'高分六号', satId:'gf6', sensorType:'多光谱', date:'2026-07-16', time:'03:30 UTC', resolution:2, cloudCoverage:3, coverage:'武汉·湖北', size:'2.1 GB', lng:114.3, lat:30.6 },
  { id:'s2', sceneName:'GF7_MUX_L1A_20260715T0215', path:'Path/Row: 098/042', satellite:'高分七号', satId:'gf7', sensorType:'立体测绘', date:'2026-07-15', time:'02:15 UTC', resolution:0.65, cloudCoverage:8, coverage:'宜昌·湖北', size:'4.5 GB', lng:111.3, lat:30.7 },
  { id:'s3', sceneName:'S2A_MSIL2A_20260714T0452', path:'Path/Row: 051/028', satellite:'哨兵二号', satId:'sentinel2', sensorType:'MSI', date:'2026-07-14', time:'04:52 UTC', resolution:10, cloudCoverage:2, coverage:'荆州·湖北', size:'856 MB', lng:112.2, lat:30.3 },
  { id:'s4', sceneName:'LC9_L2SP_20260714T0310', path:'Path/Row: 125/039', satellite:'Landsat-9', satId:'landsat9', sensorType:'OLI-2', date:'2026-07-14', time:'03:10 UTC', resolution:30, cloudCoverage:18, coverage:'黄冈·湖北', size:'520 MB', lng:114.9, lat:30.5 },
  { id:'s5', sceneName:'FY4A_AGRI_L1_20260716T0800', path:'Full Disk', satellite:'风云四号A星', satId:'fy4a', sensorType:'多光谱', date:'2026-07-16', time:'08:00 UTC', resolution:500, cloudCoverage:5, coverage:'亚太区域', size:'1.2 GB', lng:110, lat:30 },
  { id:'s6', sceneName:'FY3E_MERSI_L2_20260716T0300', path:'Orbit: 12345', satellite:'风云三号E星', satId:'fy3e', sensorType:'高光谱', date:'2026-07-16', time:'03:00 UTC', resolution:250, cloudCoverage:12, coverage:'中国东部', size:'2.8 GB', lng:116, lat:32 },
  { id:'s7', sceneName:'GF6_PMS_L1A_20260713T0415', path:'Path/Row: 119/041', satellite:'高分六号', satId:'gf6', sensorType:'多光谱', date:'2026-07-13', time:'04:15 UTC', resolution:2, cloudCoverage:1, coverage:'襄阳·湖北', size:'1.9 GB', lng:112.1, lat:32.0 },
  { id:'s8', sceneName:'S2B_MSIL2A_20260712T0440', path:'Path/Row: 052/028', satellite:'哨兵二号', satId:'sentinel2', sensorType:'MSI', date:'2026-07-12', time:'04:40 UTC', resolution:10, cloudCoverage:7, coverage:'荆门·湖北', size:'832 MB', lng:112.2, lat:31.0 },
  { id:'s9', sceneName:'FY4A_AGRI_L1_20260713T1200', path:'Full Disk', satellite:'风云四号A星', satId:'fy4a', sensorType:'多光谱', date:'2026-07-13', time:'12:00 UTC', resolution:500, cloudCoverage:15, coverage:'四川盆地', size:'1.1 GB', lng:104, lat:30 },
  { id:'s10', sceneName:'LC9_L2SP_20260711T0325', path:'Path/Row: 126/039', satellite:'Landsat-9', satId:'landsat9', sensorType:'TIRS-2', date:'2026-07-11', time:'03:25 UTC', resolution:30, cloudCoverage:22, coverage:'孝感·湖北', size:'480 MB', lng:113.9, lat:31.0 },
  { id:'s11', sceneName:'GF7_MUX_L1A_20260710T0210', path:'Path/Row: 095/043', satellite:'高分七号', satId:'gf7', sensorType:'立体测绘', date:'2026-07-10', time:'02:10 UTC', resolution:0.65, cloudCoverage:4, coverage:'恩施·湖北', size:'5.2 GB', lng:109.5, lat:30.3 },
  { id:'s12', sceneName:'FY3E_MERSI_L2_20260710T0800', path:'Orbit: 12389', satellite:'风云三号E星', satId:'fy3e', sensorType:'微波温度计', date:'2026-07-10', time:'08:00 UTC', resolution:250, cloudCoverage:20, coverage:'南海区域', size:'3.1 GB', lng:115, lat:16 },
]

onMounted(async () => {
  const id = route.params.id as string
  scene.value = scenes.find(s => s.id === id) || null
  if (scene.value) {
    satInfo.value = satellites.find(s => s.id === scene.value.satId) || null
    await nextTick()
    if (mapContainer.value && scene.value) {
      const m = L.map(mapContainer.value, { center: [scene.value.lat, scene.value.lng], zoom: scene.value.resolution < 5 ? 13 : scene.value.resolution < 50 ? 11 : 7, zoomControl: false, attributionControl: false })
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }).addTo(m)
    }
  }
})

function addToCart() { ElMessage.success(`已添加 "${scene.value?.sceneName}" 到购物车`) }
</script>

<style scoped>
.page { flex:1; overflow-y:auto; padding:12px 8px 24px 40px; max-width:100%; margin:0 auto; }
.breadcrumb { margin-bottom:12px; }
.detail-layout { display:flex; gap:20px; }
.preview-area { flex:1; min-width:0; }
.preview-map { height:400px; border-radius:12px; overflow:hidden; border:1px solid #E5E7EB; }
.preview-label { font-size:14px; color:#9CA3AF; text-align:center; margin-top:8px; }
.info-panel { width:380px; flex-shrink:0; }
.panel-title { font-size:16px; font-weight:700; color:#1F2937; }
.sat-intro p { font-size:15px; color:#6B7280; margin:0 0 6px; line-height:1.6; }
.sat-intro p b { color:#374151; }
.not-found { text-align:center; padding:80px 0; }
</style>
