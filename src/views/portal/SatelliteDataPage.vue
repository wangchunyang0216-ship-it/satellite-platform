<template>
  <div class="satellite-page" v-if="satellite">
    <el-breadcrumb separator="/" class="breadcrumb"><el-breadcrumb-item :to="{path:'/console/data'}">数据中心</el-breadcrumb-item><el-breadcrumb-item>{{ satellite.name }}</el-breadcrumb-item></el-breadcrumb>
    <section class="sat-hero">
      <div class="sat-mark"><el-icon :size="34"><Promotion /></el-icon></div>
      <div class="sat-title"><span>{{ satellite.shortName }}</span><h1>{{ satellite.name }}</h1><p>{{ satellite.description }}</p></div>
      <div class="sat-status"><i></i>在轨运行</div>
    </section>
    <section class="overview">
      <div v-for="item in overview" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
    </section>
    <section class="intro-card">
      <div><h2>卫星介绍</h2><p>{{ satellite.name }}由{{ satellite.owner }}运营，搭载{{ satellite.sensorType }}，主要服务于{{ satellite.applications.join('、') }}等应用。</p></div>
      <div class="tags"><span v-for="item in satellite.applications" :key="item">{{ item }}</span></div>
    </section>

    <section class="catalog">
      <div class="catalog-head"><div><h2>{{ satellite.name }}影像数据</h2><p>以下目录仅展示当前卫星的数据产品</p></div><span>{{ filteredScenes.length }} 条结果</span></div>
      <div class="filters">
        <el-input v-model="keyword" clearable placeholder="影像编号、传感器或覆盖区域" :prefix-icon="Search" @keyup.enter="currentPage=1" />
        <el-select v-model="sensor" clearable placeholder="全部传感器"><el-option v-for="item in sensors" :key="item" :label="item" :value="item" /></el-select>
        <el-select v-model="cloudMax" placeholder="云量"><el-option label="云量 ≤ 5%" :value="5"/><el-option label="云量 ≤ 10%" :value="10"/><el-option label="云量 ≤ 30%" :value="30"/><el-option label="不限云量" :value="100"/></el-select>
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" range-separator="至" />
        <el-button @click="reset">重置</el-button>
      </div>

      <el-table :data="pagedScenes" stripe class="scene-table" empty-text="当前筛选条件下暂无影像">
        <el-table-column label="影像标识" min-width="260"><template #default="{row}"><div class="scene-id"><b>{{ row.sceneName }}</b><span>{{ row.path }}</span></div></template></el-table-column>
        <el-table-column prop="sensorType" label="传感器" width="130"/>
        <el-table-column label="采集时间" width="165"><template #default="{row}">{{ row.date }} {{ row.time }}</template></el-table-column>
        <el-table-column label="分辨率" width="90"><template #default="{row}"><span class="resolution">{{ row.resolution }}m</span></template></el-table-column>
        <el-table-column label="云量" width="85"><template #default="{row}"><span class="cloud" :class="row.cloudCoverage<=10?'low':'mid'">{{ row.cloudCoverage }}%</span></template></el-table-column>
        <el-table-column prop="coverage" label="覆盖区域" width="120"/>
        <el-table-column prop="size" label="大小" width="90"/>
        <el-table-column label="操作" width="155" fixed="right"><template #default="{row}"><el-button link type="primary" @click="viewScene(row.id)">查看详情</el-button><el-button link type="success" @click="addToCart(row)">加入购物车</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-if="filteredScenes.length" v-model:current-page="currentPage" :page-size="pageSize" :total="filteredScenes.length" layout="prev, pager, next, total" background class="pagination" />
    </section>
  </div>
  <el-result v-else icon="warning" title="未找到该卫星"><template #extra><el-button type="primary" @click="$router.push('/console/data')">返回数据中心</el-button></template></el-result>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Promotion, Search } from '@element-plus/icons-vue'
import { getSatellite, getSatelliteScenes, type SatelliteScene } from '@/data/satelliteCatalog'
import useSettingsStore from '@/store/modules/settings'
import useTagsViewStore from '@/store/modules/tagsView'

const route=useRoute(), router=useRouter()
const settingsStore=useSettingsStore(), tagsViewStore=useTagsViewStore()
const satellite=computed(()=>getSatellite(String(route.params.satelliteId)))
const scenes=computed(()=>getSatelliteScenes(String(route.params.satelliteId)))
const keyword=ref(String(route.query.q||'')), sensor=ref(''), cloudMax=ref(100), dateRange=ref<[string,string]|null>(null), currentPage=ref(1), pageSize=10
const sensors=computed(()=>[...new Set(scenes.value.map(s=>s.sensorType))])
const overview=computed(()=>satellite.value ? [
  {label:'运营机构',value:satellite.value.owner},{label:'主要传感器',value:satellite.value.sensorType},{label:'最高分辨率',value:satellite.value.resolution},
  {label:'观测幅宽',value:satellite.value.swath},{label:'重访周期',value:satellite.value.revisit},{label:'轨道高度',value:satellite.value.altitude},{label:'发射日期',value:satellite.value.launchDate},{label:'数据规模',value:`${satellite.value.sceneCount.toLocaleString()} 景`},
] : [])
const filteredScenes=computed(()=>scenes.value.filter(item=>{
  const q=keyword.value.trim().toLowerCase(); const match=!q||[item.sceneName,item.sensorType,item.coverage,item.path].some(v=>v.toLowerCase().includes(q))
  const inDate=!dateRange.value||(item.date>=dateRange.value[0]&&item.date<=dateRange.value[1])
  return match&&(!sensor.value||item.sensorType===sensor.value)&&item.cloudCoverage<=cloudMax.value&&inDate
}))
const pagedScenes=computed(()=>filteredScenes.value.slice((currentPage.value-1)*pageSize,currentPage.value*pageSize))
watch([keyword,sensor,cloudMax,dateRange],()=>currentPage.value=1)
watch(satellite,(item)=>{
  if(!item) return
  const title=item.name
  route.meta.title=title
  settingsStore.setTitle(title)
  nextTick(()=>tagsViewStore.updateVisitedView({ ...route, title, meta:{ ...route.meta, title } }))
},{immediate:true})
function reset(){keyword.value='';sensor.value='';cloudMax.value=100;dateRange.value=null}
function viewScene(id:string){router.push(`/console/data/scene/${id}`)}
function addToCart(row:SatelliteScene){ElMessage.success(`已将 ${row.sceneName} 加入购物车`)}
</script>

<style scoped>
.satellite-page{height:100%;overflow:auto;background:#f5f7fa;padding:20px 28px 60px}.breadcrumb{margin-bottom:16px}.sat-hero{display:flex;align-items:center;gap:20px;padding:24px 28px;border-radius:14px;background:linear-gradient(115deg,#102d54,#1e5bb8);color:#fff}.sat-mark{width:62px;height:62px;display:grid;place-items:center;border-radius:16px;background:rgba(255,255,255,.12)}.sat-title{flex:1}.sat-title>span{font-size:12px;letter-spacing:2px;color:#9dc2ff}.sat-title h1{font-size:28px;margin:3px 0}.sat-title p{margin:0;max-width:780px;line-height:1.7;opacity:.78}.sat-status{align-self:flex-start;background:rgba(28,191,110,.16);color:#a6f2cc;border:1px solid rgba(120,237,180,.25);border-radius:20px;padding:6px 11px;font-size:13px}.sat-status i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#52dc96;margin-right:6px}.overview{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid #e5eaf1;border-radius:12px;margin:16px 0;overflow:hidden}.overview>div{padding:15px 18px;border-right:1px solid #edf0f4;border-bottom:1px solid #edf0f4;display:flex;flex-direction:column}.overview span{font-size:12px;color:#929caf}.overview strong{font-size:14px;color:#2d3849;margin-top:4px}.intro-card{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 22px;background:#fff;border:1px solid #e5eaf1;border-radius:12px;margin-bottom:22px}.intro-card h2,.catalog-head h2{font-size:18px;margin:0 0 5px}.intro-card p,.catalog-head p{margin:0;color:#758196;font-size:14px}.tags{display:flex;gap:7px;flex-shrink:0}.tags span{background:#edf4ff;color:#2b65b8;border-radius:5px;padding:5px 9px;font-size:12px}.catalog{background:#fff;border:1px solid #e5eaf1;border-radius:14px;padding:20px}.catalog-head{display:flex;align-items:end;justify-content:space-between}.catalog-head>span{font-size:13px;color:#6e7a8d}.filters{display:grid;grid-template-columns:minmax(240px,1fr) 180px 150px 330px auto;gap:10px;margin:18px 0}.scene-id{display:flex;flex-direction:column}.scene-id b{font-size:14px;color:#263449}.scene-id span{font-size:12px;color:#99a2b1;font-family:monospace}.resolution{color:#2563eb;background:#edf4ff;padding:2px 7px;border-radius:4px;font-weight:600}.cloud{padding:2px 7px;border-radius:4px;font-weight:600}.cloud.low{color:#138654;background:#eaf8f1}.cloud.mid{color:#b56a10;background:#fff5e8}.pagination{justify-content:center;margin-top:18px}@media(max-width:1100px){.overview{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr 1fr}.intro-card{align-items:flex-start;flex-direction:column}}@media(max-width:700px){.satellite-page{padding:14px}.sat-hero{align-items:flex-start}.overview,.filters{grid-template-columns:1fr}.sat-status{display:none}}
</style>
