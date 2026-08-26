<template>
  <div class="op"><div class="inner">
    <h1 class="pt"><el-icon :size="20"><Document /></el-icon> 我的订单</h1>
    <el-tabs v-model="tab" class="tabs"><el-tab-pane label="全部" name="all"/><el-tab-pane label="待处理" name="pending"/><el-tab-pane label="已完成" name="completed"/><el-tab-pane label="已取消" name="cancelled"/></el-tabs>
    <template v-if="fOrders.length">
      <div class="list">
        <div v-for="o in fOrders" :key="o.id" class="card oc">
          <div class="ot"><div class="oi"><span class="on">{{ o.orderNo }}</span><span class="tag" :class="o.status">{{ sl[o.status] }}</span><span class="otm">{{ o.createdAt }}</span></div><div class="opr">¥{{ o.amount.toFixed(2) }}</div></div>
          <el-table :data="o.items" border size="small" header-cell-class-name="th" row-class-name="tr" class="tb" style="margin-top:12px"><el-table-column prop="sceneName" label="影像名称" min-width="240" show-overflow-tooltip/><el-table-column prop="satellite" label="卫星" width="110" align="center"/><el-table-column prop="date" label="日期" width="110" align="center"/><el-table-column prop="size" label="大小" width="100" align="center"/></el-table>
          <div class="of"><span><strong>交付：</strong>{{ o.deliveryMethod }} · {{ o.dataFormat }} / {{ o.projection }}</span><div><template v-if="o.status==='completed'&&o.downloadUrl"><span class="exp" v-if="o.expiresAt">有效期至 {{ o.expiresAt }}</span><el-button size="small" type="primary" @click="dl(o)" :style="{background:'#2563EB',borderColor:'#2563EB'}">下载</el-button></template><template v-if="o.status==='processing'"><el-button size="small" disabled>处理中…</el-button></template><template v-if="o.status==='pending'"><el-button size="small" type="danger" @click="cancel(o)">取消</el-button></template></div></div>
        </div>
      </div>
    </template>
    <div v-else class="card" style="text-align:center;padding:60px"><el-empty description="暂无订单数据"><el-button type="primary" @click="$router.push('/console/data')">前往数据中心</el-button></el-empty></div>
  </div></div>
</template>
<script setup lang="ts">
import { ref,computed } from 'vue'; import { ElMessage,ElMessageBox } from 'element-plus'; import { Document } from '@element-plus/icons-vue'; import { demoOrderList } from '@/services/mockData'; import type { DemoOrderDetail } from '@/services/mockData'
const tab=ref('all')
const sl:Record<string,string>={pending:'待处理',processing:'处理中',completed:'已完成',cancelled:'已取消'}
const orders=ref<DemoOrderDetail[]>(demoOrderList)
const fOrders=computed(()=>tab.value==='all'?orders.value:orders.value.filter(o=>o.status===tab.value))
const dl=(o:DemoOrderDetail)=>ElMessage.success(`订单 ${o.orderNo} 开始下载`)
const cancel=async(o:DemoOrderDetail)=>{try{await ElMessageBox.confirm(`取消 ${o.orderNo}？`,'确认',{type:'warning'});o.status='cancelled'}catch{}}
</script>
<style scoped>
.op { flex:1; padding:16px 12px; overflow-y:auto; }
.inner { max-width:100%; margin:0 auto; }
.pt { font-size:24px; font-weight:700; color:#1F2937; margin:0 0 20px; }
.tabs { margin-bottom:20px; }
.tabs :deep(.el-tabs__item){ color:#6B7280; }
.tabs :deep(.el-tabs__item.is-active){ color:#2563EB; }
.card { background:#fff; border-radius:14px; padding:12px 8px; box-shadow:0 4px 12px rgba(0,0,0,0.03); }
.list { display:flex; flex-direction:column; gap:16px; }
.ot { display:flex; align-items:center; justify-content:space-between; }
.oi { display:flex; align-items:center; gap:12px; }
.on { font-size:17px; font-weight:600; color:#1F2937; font-family:'Consolas',monospace; }
.otm { font-size:14px; color:#9CA3AF; }
.opr { font-size:22px; font-weight:700; color:#DC2626; }
.tag { font-size:13px; padding:2px 9px; border-radius:8px; font-weight:500; }
.tag.completed { color:#059669; background:rgba(16,185,129,0.08); }
.tag.processing { color:#D97706; background:rgba(245,158,11,0.08); }
.tag.pending { color:#6B7280; background:#F3F4F6; }
.tag.cancelled { color:#9CA3AF; background:#F3F4F6; }
.of { display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:12px; border-top:1px solid #F3F4F6; font-size:14px; color:#6B7280; }
.exp { margin-right:8px; color:#D97706; font-size:13px; }
.tb :deep(.th){ background:#F9FAFB; color:#6B7280; font-size:14px; border-color:#F3F4F6; }
.tb :deep(.tr){ background:#fff; color:#374151; border-color:#F3F4F6; }
:deep(.el-empty__description){ color:#6B7280; }
</style>
