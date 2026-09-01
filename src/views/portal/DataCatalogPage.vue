<template>
  <div class="data-center">
    <section class="hero">
      <div class="hero-heading">
        <div><span class="eyebrow">SATELLITE DATA CENTER</span><h1>数据中心</h1><p>先搜索或选择目标卫星，再进入独立目录检索该卫星的影像数据。</p></div>
      </div>
      <div class="search-tools">
      <el-autocomplete v-model="keyword" :fetch-suggestions="fetchSuggestions" placeholder="搜索卫星、传感器、影像编号或覆盖区域" clearable size="large" class="search" @select="selectSuggestion" @keyup.enter="search">
        <template #prepend><el-select v-model="searchScope" style="width:104px"><el-option label="全部" value="all"/><el-option label="卫星" value="satellite"/><el-option label="传感器" value="sensor"/><el-option label="位置" value="location"/></el-select></template>
        <template #append><el-button type="primary" @click="search"><el-icon><Search /></el-icon>检索</el-button></template>
      </el-autocomplete>
      </div>
    </section>

    <section v-if="hasSearched" class="search-result">
      <div class="result-head">
        <div><span>SEARCH RESULT</span><h2>卫星搜索结果</h2></div>
        <div class="result-actions"><span>{{ searchResults.length }} 个结果</span><el-button link @click="clearSearchResult">清除结果</el-button></div>
      </div>
      <el-empty v-if="!searchResults.length" description="没有找到匹配的卫星或影像" />
      <article v-for="sat in searchResults" v-else :key="sat.id" class="result-card">
        <div class="result-icon"><el-icon :size="30"><Promotion /></el-icon></div>
        <div class="result-main"><span>{{ sat.shortName }}</span><h3>{{ sat.name }}</h3><p>{{ sat.description }}</p><div class="result-tags"><span>{{ sat.owner }}</span><span>{{ sat.sensorType }}</span><span>分辨率 {{ sat.resolution }}</span></div></div>
        <div class="result-stats"><div><span>重访周期</span><b>{{ sat.revisit }}</b></div><div><span>数据规模</span><b>{{ sat.sceneCount.toLocaleString() }} 景</b></div></div>
        <el-button type="primary" size="large" @click="openSatellite(sat.id,keyword.trim())">查看该卫星影像数据 <el-icon><ArrowRight/></el-icon></el-button>
      </article>
    </section>

    <section class="stats">
      <div v-for="item in stats" :key="item.label" class="stat">
        <el-icon :size="22"><component :is="item.icon" /></el-icon>
        <div><strong>{{ item.value }}</strong><span>{{ item.label }}</span></div>
      </div>
    </section>

    <section v-if="!hasSearched" class="fleet-section">
      <div class="section-title">
        <div><h2>在轨卫星舰队</h2><p>选择一颗卫星，进入它的专属数据目录</p></div>
        <span>{{ satellites.length }} 颗在轨卫星</span>
      </div>
      <div class="fleet">
        <article v-for="sat in satellites" :key="sat.id" class="sat-card" @click="openSatellite(sat.id)">
          <div class="card-top"><div class="orbit-icon"><el-icon :size="24"><Promotion /></el-icon></div><span class="status"><i></i>运行中</span></div>
          <div class="identity"><span>{{ sat.shortName }}</span><h3>{{ sat.name }}</h3><p>{{ sat.owner }}</p></div>
          <p class="description">{{ sat.description }}</p>
          <div class="spec-grid">
            <div><span>传感器</span><b>{{ sat.sensorType }}</b></div><div><span>最高分辨率</span><b>{{ sat.resolution }}</b></div>
            <div><span>重访周期</span><b>{{ sat.revisit }}</b></div><div><span>数据量</span><b>{{ sat.sceneCount.toLocaleString() }} 景</b></div>
          </div>
          <div class="applications"><span v-for="app in sat.applications" :key="app">{{ app }}</span></div>
          <button class="enter">查看 {{ sat.name }} 影像数据 <el-icon><ArrowRight /></el-icon></button>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Promotion, ArrowRight, Monitor, FolderOpened, Picture, MapLocation } from '@element-plus/icons-vue'
import { satellites, satelliteScenes } from '@/data/satelliteCatalog'

const router = useRouter()
const keyword = ref('')
const searchScope = ref('all')
const hasSearched = ref(false)
const searchResultIds = ref<string[]>([])
const searchResults = computed(() => searchResultIds.value.map(id => satellites.find(item => item.id === id)).filter(Boolean) as typeof satellites)
const stats = [
  { label:'在轨卫星', value:`${satellites.length} 颗`, icon:Monitor }, { label:'数据产品', value:'48 类', icon:FolderOpened },
  { label:'可检索影像', value:'156,800 景', icon:Picture }, { label:'全球覆盖', value:'持续更新', icon:MapLocation },
]

function openSatellite(id: string, query = '') { router.push({ path:`/console/data/satellite/${id}`, query:query ? { q:query } : {} }) }
function findSatellites(text: string) {
  const q = text.trim().toLowerCase()
  if (!q) return []
  const resultIds = new Set<string>()
  if (searchScope.value !== 'location') satellites.forEach(s => {
    const values = searchScope.value === 'satellite' ? [s.name,s.shortName,s.owner] : searchScope.value === 'sensor' ? [s.sensorType] : [s.name,s.shortName,s.owner,s.sensorType,...s.applications]
    if (values.some(v => v.toLowerCase().includes(q))) resultIds.add(s.id)
  })
  satelliteScenes.forEach(s => {
    const values = searchScope.value === 'location' ? [s.coverage] : searchScope.value === 'sensor' ? [s.sensorType] : searchScope.value === 'satellite' ? [s.satellite] : [s.sceneName,s.coverage,s.sensorType,s.satellite]
    if (values.some(v => v.toLowerCase().includes(q))) resultIds.add(s.satId)
  })
  return satellites.filter(s => resultIds.has(s.id))
}
function search() {
  const matches = findSatellites(keyword.value)
  hasSearched.value = true
  searchResultIds.value = matches.map(s => s.id)
  if (!matches.length) ElMessage.warning('没有找到匹配的卫星或影像')
}
function fetchSuggestions(query:string,cb:(items:Array<{value:string;satId:string}>)=>void) {
  const q=query.trim().toLowerCase(), items:Array<{value:string;satId:string}>=[]
  if(searchScope.value==='all'||searchScope.value==='satellite') satellites.filter(s=>!q||[s.name,s.shortName,s.owner].some(v=>v.toLowerCase().includes(q))).forEach(s=>items.push({value:`${s.name} · ${s.owner}`,satId:s.id}))
  if(searchScope.value==='all'||searchScope.value==='sensor') satelliteScenes.filter(s=>!q||s.sensorType.toLowerCase().includes(q)).forEach(s=>items.push({value:`${s.sensorType} · ${s.satellite}`,satId:s.satId}))
  if(searchScope.value==='all'||searchScope.value==='location') satelliteScenes.filter(s=>!q||s.coverage.toLowerCase().includes(q)).forEach(s=>items.push({value:`${s.coverage} · ${s.satellite}`,satId:s.satId}))
  cb(items.filter((item,index,list)=>list.findIndex(x=>x.value===item.value&&x.satId===item.satId)===index).slice(0,12))
}
function selectSuggestion(item:{value:string;satId:string}) { hasSearched.value=true; searchResultIds.value=[item.satId] }
function clearSearchResult(){hasSearched.value=false;searchResultIds.value=[];keyword.value=''}
</script>

<style scoped>
.data-center{height:100%;overflow:auto;background:#f5f7fa;padding:24px 28px 60px;color:#172033}
.hero{display:flex;flex-direction:column;gap:22px;padding:28px 32px;border-radius:16px;background:linear-gradient(155deg,#0b1a30 0%,#132742 30%,#0d2b45 60%,#091a28 100%);color:#fff;box-shadow:0 12px 30px rgba(37,99,235,.18)}
.hero-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
.eyebrow{font-size:12px;letter-spacing:2px;opacity:.72}
.hero h1{margin:6px 0 4px;font-size:30px}
.hero p{margin:0;opacity:.82}
.search-tools{width:100%}
.search{width:100%}
.search :deep(.el-input__wrapper){box-shadow:none}
.search :deep(.el-input-group__append){background:#fff;padding:0}
.search :deep(.el-button){height:40px;border-radius:0 7px 7px 0}
.search-result{margin:18px 0 0;background:#fff;border:1px solid #cfe0fb;border-radius:14px;padding:18px 20px;box-shadow:0 8px 22px rgba(37,99,235,.07)}
.result-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.result-head span{font-size:11px;letter-spacing:1.5px;color:#2563eb}
.result-head h2{font-size:18px;margin:2px 0 0}
.result-actions{display:flex;align-items:center;gap:12px}
.result-card{display:flex;align-items:center;gap:18px}
.result-card+.result-card{margin-top:14px;padding-top:14px;border-top:1px solid #edf0f4}
.result-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:14px;background:#edf4ff;color:#2563eb;flex-shrink:0}
.result-main{flex:1;min-width:0}
.result-main>span{font-size:12px;color:#2563eb;font-weight:700}
.result-main h3{font-size:21px;margin:2px 0}
.result-main p{font-size:13px;color:#738096;margin:0 0 7px}
.result-tags{display:flex;gap:6px;flex-wrap:wrap}
.result-tags span{font-size:12px;background:#f2f5f9;color:#59687e;padding:3px 7px;border-radius:4px}
.result-stats{display:flex;gap:26px;border-left:1px solid #edf0f4;padding-left:22px}
.result-stats div{display:flex;flex-direction:column}
.result-stats span{font-size:12px;color:#929caf}
.result-stats b{font-size:14px;color:#344054}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0 26px}
.stat{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e8edf4;border-radius:12px;padding:16px 18px;color:#2563eb}
.stat div{display:flex;flex-direction:column}
.stat strong{font-size:20px;color:#172033}
.stat span{font-size:13px;color:#8a94a6}
.section-title{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:14px}
.section-title h2{font-size:22px;margin:0 0 4px}
.section-title p{margin:0;color:#8490a4}
.section-title>span{font-size:13px;color:#68758a;background:#e9eef6;padding:5px 10px;border-radius:20px}
.fleet{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.sat-card{display:flex;flex-direction:column;background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:20px;cursor:pointer;transition:.2s}
.sat-card:hover{transform:translateY(-3px);border-color:#8fb3ef;box-shadow:0 12px 26px rgba(24,55,96,.10)}
.card-top{display:flex;justify-content:space-between;align-items:center}
.orbit-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:#edf4ff;color:#2563eb}
.status{font-size:12px;color:#198754;background:#ecf8f1;padding:4px 8px;border-radius:20px}
.status i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#20b26b;margin-right:5px}
.identity{margin-top:14px}
.identity>span{font-size:12px;color:#2563eb;font-weight:700}
.identity h3{font-size:21px;margin:3px 0}
.identity p{font-size:13px;color:#929bad;margin:0}
.description{font-size:14px;color:#657186;line-height:1.7;min-height:48px}
.spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 0;border-top:1px solid #eef1f5;border-bottom:1px solid #eef1f5}
.spec-grid div{display:flex;flex-direction:column;min-width:0}
.spec-grid span{font-size:12px;color:#9aa4b5}
.spec-grid b{font-size:13px;color:#344054;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.applications{display:flex;gap:6px;flex-wrap:wrap;margin:13px 0}
.applications span{font-size:12px;padding:3px 8px;border-radius:5px;background:#f2f5f9;color:#617087}
.enter{display:flex;align-items:center;justify-content:space-between;width:100%;border:0;background:transparent;color:#2563eb;font-weight:600;padding:8px 0 0;cursor:pointer}
.enter:hover{color:#174cad}

@media(max-width:1100px){
  .fleet{grid-template-columns:repeat(2,1fr)}
  .result-card{align-items:flex-start;flex-wrap:wrap}
  .result-stats{border-left:0;padding-left:76px}
}

@media(max-width:720px){
  .data-center{padding:14px}
  .stats,.fleet{grid-template-columns:1fr}
  .hero{padding:22px}
  .hero-heading{flex-direction:column}
  .result-stats{padding-left:0}
  .section-title{align-items:flex-start;gap:10px;flex-direction:column}
}
</style>
