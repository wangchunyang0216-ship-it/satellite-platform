<template>
  <div class="cp"><div class="inner">
    <h1 class="pt"><el-icon :size="20"><ShoppingCart /></el-icon> 购物车</h1>
    <div class="card bar" v-if="items.length">
      <el-checkbox v-model="all" @change="tAll"><span style="color:#374151">全选</span></el-checkbox>
      <el-button type="danger" plain @click="rmSel" :disabled="sel.size===0">批量删除</el-button>
      <el-button plain @click="clr">清空</el-button>
      <span class="cnt">共 {{ items.length }} 项</span>
    </div>
    <template v-if="items.length">
      <div class="card" style="margin-top:16px">
        <el-table :data="items" stripe header-cell-class-name="th" row-class-name="tr" class="tb">
          <el-table-column type="selection" width="50" align="center"/>
          <el-table-column label="预览" width="90" align="center"><template #default><div class="tmb"><el-icon :size="26" color="#D1D5DB"><Picture/></el-icon></div></template></el-table-column>
          <el-table-column prop="sceneName" label="影像名称" min-width="220" show-overflow-tooltip/>
          <el-table-column prop="satellite" label="卫星" width="110" align="center"/>
          <el-table-column prop="date" label="采集日期" width="120" align="center"/>
          <el-table-column prop="resolution" label="分辨率" width="90" align="center"><template #default="{row}">{{row.resolution}}m</template></el-table-column>
          <el-table-column prop="size" label="大小" width="100" align="center"/>
          <el-table-column prop="price" label="单价" width="90" align="center"><template #default="{row}">¥{{row.price}}</template></el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right"><template #default="{row}"><el-button link type="danger" size="small" @click="rm(row.id)">删除</el-button></template></el-table-column>
        </el-table>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="ch">交付配置</div>
        <el-form label-position="top"><el-row :gutter="16">
          <el-col :span="8"><el-form-item label="交付方式"><el-select v-model="dv.method" style="width:100%"><el-option label="FTP 下载" value="ftp"/><el-option label="HTTP 直链" value="http"/><el-option label="S3 转存" value="s3"/></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="数据格式"><el-select v-model="dv.format" style="width:100%"><el-option label="GeoTIFF" value="geotiff"/><el-option label="IMG" value="img"/><el-option label="HDF" value="hdf"/></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="坐标系"><el-select v-model="dv.projection" style="width:100%"><el-option label="WGS84" value="wgs84"/><el-option label="CGCS2000" value="cgcs2000"/></el-select></el-form-item></el-col>
        </el-row></el-form>
        <div class="sub"><span class="pr">¥{{ tp.toFixed(2) }}</span><el-button type="primary" size="large" @click="sub" :style="{background:'#2563EB',borderColor:'#2563EB'}">提交订单</el-button></div>
      </div>
    </template>
    <div v-else class="card" style="text-align:center;padding:60px;margin-top:16px">
      <el-empty description="购物车为空"><el-button type="primary" @click="seed">加载演示数据</el-button><el-button @click="$router.push('/console/data')">前往数据中心</el-button></el-empty>
    </div>
  </div></div>
</template>
<script setup lang="ts">
import { reactive,ref,computed } from 'vue'; import { useRouter } from 'vue-router'; import { ElMessage,ElMessageBox } from 'element-plus'; import { Picture, ShoppingCart } from '@element-plus/icons-vue'; import { demoOrderList } from '@/services/mockData'
const router = useRouter()
interface R { id:string; sceneName:string; satellite:string; date:string; resolution:number; size:string; price:number }
const demo:R[]=[{id:'c1',sceneName:'S2A_MSIL2A_20260710_武汉',satellite:'哨兵二号',date:'2026-07-10',resolution:10,size:'856 MB',price:120},{id:'c2',sceneName:'GF6_PMS_20260712_黄冈',satellite:'高分六号',date:'2026-07-12',resolution:2,size:'2.1 GB',price:280},{id:'c3',sceneName:'LC9_L2SP_20260711_宜昌',satellite:'Landsat-9',date:'2026-07-11',resolution:30,size:'520 MB',price:80},{id:'c4',sceneName:'S2A_MSIL2A_20260709_襄阳',satellite:'哨兵二号',date:'2026-07-09',resolution:10,size:'840 MB',price:120}]
const items=ref<R[]>(demo.map(d=>({...d}))); const all=ref(false); const sel=ref<Set<string>>(new Set())
const dv=reactive({method:'http',format:'geotiff',projection:'wgs84'})
const tp=computed(()=>items.value.reduce((s,i)=>s+i.price,0))
const seed=()=>{ items.value=[...demo]; ElMessage.success('已加载 4 项演示数据') }
const tAll=(v:boolean)=>{ if(v) sel.value=new Set(items.value.map(i=>i.id)); else sel.value.clear() }
const handleSelectionChange=(s:R[])=>{ sel.value=new Set(s.map(i=>i.id)); all.value=s.length===items.value.length }
const rm=(id:string)=>{ items.value=items.value.filter(i=>i.id!==id); sel.value.delete(id) }
const rmSel=()=>{ items.value=items.value.filter(i=>!sel.value.has(i.id)); sel.value.clear(); ElMessage.success('已删除') }
const clr=async()=>{ try{ await ElMessageBox.confirm('确定清空？','确认',{type:'warning'}); items.value=[]; sel.value.clear() }catch{} }
const sub=()=>{
  const now = new Date()
  const no = 'ORD-' + now.toISOString().slice(0,10).replace(/-/g,'') + '-' + String(demoOrderList.length+1).padStart(3,'0')
  const dvMap:Record<string,string>={ftp:'FTP 推送',http:'HTTP 直链',s3:'S3 转存'}
  const fmtMap:Record<string,string>={geotiff:'GeoTIFF',img:'IMG',hdf:'HDF'}
  const prjMap:Record<string,string>={wgs84:'WGS84',cgcs2000:'CGCS2000'}
  demoOrderList.unshift({
    id: String(Date.now()), orderNo: no, status: 'processing',
    createdAt: now.toISOString().slice(0,16).replace('T',' '), amount: tp.value,
    deliveryMethod: dvMap[dv.method]||dv.method, dataFormat: fmtMap[dv.format]||dv.format,
    projection: prjMap[dv.projection]||dv.projection,
    items: items.value.map(i=>({ sceneName:i.sceneName, satellite:i.satellite, date:i.date, size:i.size, thumbnailUrl:'' })),
  })
  ElMessage.success(`订单 ${no} 已提交！`)
  items.value=[]
  router.push('/console/orders')
}
</script>
<style scoped>
.cp { flex:1; padding:16px 12px; overflow-y:auto; }
.inner { max-width:100%; margin:0 auto; }
.pt { font-size:24px; font-weight:700; color:#1F2937; margin:0 0 24px; }
.card { background:#fff; border-radius:14px; padding:12px 8px; box-shadow:0 4px 12px rgba(0,0,0,0.03); }
.ch { font-size:16px; font-weight:600; color:#1F2937; margin-bottom:14px; }
.bar { display:flex; align-items:center; gap:12px; }
.cnt { margin-left:auto; font-size:15px; color:#6B7280; }
.tmb { width:50px; height:50px; display:flex; align-items:center; justify-content:center; background:#F9FAFB; border-radius:6px; margin:0 auto; }
.sub { display:flex; align-items:center; justify-content:flex-end; gap:20px; margin-top:16px; padding-top:16px; border-top:1px solid #F3F4F6; }
.pr { font-size:24px; font-weight:700; color:#DC2626; }
.tb :deep(.th){ background:#F9FAFB; color:#6B7280; font-size:14px; border-color:#F3F4F6; }
.tb :deep(.tr){ background:#fff; color:#374151; border-color:#F3F4F6; }
:deep(.el-input__wrapper){ box-shadow:0 1px 3px rgba(0,0,0,0.04); border:1px solid #E5E7EB; border-radius:10px; }
</style>
