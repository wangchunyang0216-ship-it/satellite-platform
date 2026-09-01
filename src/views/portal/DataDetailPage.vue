<template>
  <div class="page" v-if="scene && satellite">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{path:'/console/data'}">数据中心</el-breadcrumb-item>
      <el-breadcrumb-item :to="{path:`/console/data/satellite/${satellite.id}`}">{{ satellite.name }}</el-breadcrumb-item>
      <el-breadcrumb-item>影像详情</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="detail-layout">
      <section class="preview-area"><div class="preview-map" ref="mapContainer"></div><div class="preview-label">{{ scene.satellite }} · {{ scene.coverage }} · {{ scene.date }}</div></section>
      <aside class="info-panel">
        <el-card shadow="never"><template #header><span class="panel-title">影像信息</span></template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="影像标识">{{ scene.sceneName }}</el-descriptions-item><el-descriptions-item label="卫星">{{ scene.satellite }}</el-descriptions-item>
            <el-descriptions-item label="传感器">{{ scene.sensorType }}</el-descriptions-item><el-descriptions-item label="采集时间">{{ scene.date }} {{ scene.time }}</el-descriptions-item>
            <el-descriptions-item label="分辨率"><b class="primary">{{ scene.resolution }}m</b></el-descriptions-item><el-descriptions-item label="云覆盖率">{{ scene.cloudCoverage }}%</el-descriptions-item>
            <el-descriptions-item label="覆盖范围">{{ scene.coverage }}</el-descriptions-item><el-descriptions-item label="文件大小">{{ scene.size }}</el-descriptions-item><el-descriptions-item label="轨道参数">{{ scene.path }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card shadow="never" class="sat-card"><template #header><span class="panel-title">{{ satellite.name }} · 卫星介绍</span></template>
          <p>{{ satellite.description }}</p><div class="sat-spec"><span>所属机构</span><b>{{ satellite.owner }}</b><span>主要传感器</span><b>{{ satellite.sensorType }}</b><span>重访周期</span><b>{{ satellite.revisit }}</b></div>
        </el-card>
        <el-card shadow="never" class="actions"><el-button type="primary" @click="addToCart">加入购物车</el-button><el-button @click="$router.push(`/console/data/satellite/${satellite.id}`)">返回该卫星目录</el-button></el-card>
      </aside>
    </div>
  </div>
  <el-result v-else icon="warning" title="未找到该影像数据"><template #extra><el-button type="primary" @click="$router.push('/console/data')">返回数据中心</el-button></template></el-result>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import L from 'leaflet'
import { satelliteScenes, getSatellite } from '@/data/satelliteCatalog'

const route=useRoute(), mapContainer=ref<HTMLElement>()
const scene=satelliteScenes.find(item=>item.id===String(route.params.id))
const satellite=scene ? getSatellite(scene.satId) : undefined
onMounted(async()=>{if(!scene)return;await nextTick();if(mapContainer.value){const map=L.map(mapContainer.value,{center:[scene.lat,scene.lng],zoom:scene.resolution<5?13:scene.resolution<50?11:7,zoomControl:false,attributionControl:false});L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:18}).addTo(map)}})
function addToCart(){ElMessage.success(`已将 ${scene?.sceneName} 加入购物车`)}
</script>

<style scoped>
.page{height:100%;overflow:auto;background:#f5f7fa;padding:20px 28px 50px}.breadcrumb{margin-bottom:16px}.detail-layout{display:flex;gap:20px}.preview-area{flex:1;min-width:0}.preview-map{height:520px;border-radius:14px;overflow:hidden;border:1px solid #dfe5ed}.preview-label{text-align:center;color:#8b96a8;font-size:13px;margin-top:8px}.info-panel{width:390px;flex-shrink:0}.panel-title{font-size:16px;font-weight:700}.primary{color:#2563eb}.sat-card,.actions{margin-top:12px}.sat-card p{font-size:14px;color:#68758a;line-height:1.7}.sat-spec{display:grid;grid-template-columns:90px 1fr;gap:7px;font-size:13px}.sat-spec span{color:#929caf}.sat-spec b{color:#344054}.actions :deep(.el-card__body){display:grid;gap:8px}.actions .el-button{width:100%;margin:0}@media(max-width:900px){.detail-layout{flex-direction:column}.info-panel{width:100%}.preview-map{height:380px}}
</style>
