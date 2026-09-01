<template>
  <div class="chub">
    <div class="inner">
      <div class="page-head">
        <h1>智能计算中心</h1>
        <p>整合标准算法服务与遥感大模型能力，统一支撑影像处理、智能识别和计算任务流转。</p>
      </div>

      <!-- 算法服务 -->
      <section class="sec">
        <div class="sec-head-card algo">
          <div class="sec-head">
            <div class="sec-title">
              <span class="sec-ico algo-ico"><svg-icon icon-class="suanfafuwu" /></span>
              <div class="sec-title-text">
                <h2>算法服务</h2>
                <span class="sec-subtitle">Algorithm Services</span>
              </div>
            </div>
          </div>
          <p class="sec-desc">成熟的遥感数据处理算法，涵盖辐射校正、影像预处理、指数计算与影像处理四大类。</p>
        </div>
        <div class="svc-grid">
          <div v-for="s in visibleBasic" :key="s.id" class="card svc-item" @click="go(s.route)">
            <div class="svc-ico" :style="{background:s.color}"><svg-icon :icon-class="s.icon" /></div>
            <div class="svc-body"><h4>{{ s.name }}</h4><p>{{ s.desc }}</p></div>
            <el-icon class="arr"><ArrowRight /></el-icon>
          </div>
        </div>
        <div v-if="basic.length > 6" class="expand-bar" @click="basicExpanded = !basicExpanded">
          <span>{{ basicExpanded ? '收起' : `展开更多 (${basic.length - 6})` }}</span>
          <el-icon :class="{ rotated: basicExpanded }"><ArrowDown /></el-icon>
        </div>
      </section>

      <!-- 遥感大模型 -->
      <section class="sec">
        <div class="sec-head-card ai">
          <div class="sec-head">
            <div class="sec-title">
              <span class="sec-ico ai-ico"><svg-icon icon-class="yaogan" /></span>
              <div class="sec-title-text">
                <h2>遥感大模型</h2>
                <span class="sec-subtitle">Remote Sensing Foundation Models</span>
              </div>
            </div>
          </div>
          <p class="sec-desc">基于前沿深度学习架构的遥感智能分析，覆盖地物识别、目标检测、变化检测与多模态融合四大能力。</p>
        </div>
        <div class="model-grid">
          <div v-for="m in visibleModels" :key="m.id" class="card model-card" @click="go(m.route)">
            <div class="model-ico" :style="{background:m.color}"><svg-icon :icon-class="m.icon" /></div>
            <div class="model-body">
              <div class="model-top"><h4>{{ m.name }}</h4><el-tag size="small" effect="plain" round>{{ m.modelTag }}</el-tag></div>
              <p>{{ m.desc }}</p>
              <div class="tags"><span v-for="t in m.tags" :key="t" class="tag">{{ t }}</span></div>
            </div>
            <el-icon class="arr"><ArrowRight /></el-icon>
          </div>
        </div>
      </section>

      <!-- 任务中心 -->
      <div class="card cta">
        <div><h3>任务管理中心</h3><p>查看所有计算任务的运行状态、进度与历史记录</p></div>
        <el-button type="primary" size="large" @click="$router.push('/console/tasks')">进入任务中心 →</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue'
const router = useRouter()

interface S { id:string; name:string; desc:string; icon:string; color:string; route:string; tags?:string[]; modelTag?:string }

const basicExpanded = ref(false)
const basic:S[] = [
  { id:'cal',name:'辐射定标',desc:'DN值→辐射亮度值及表观反射率',icon:'fushedingbiao',color:'rgba(37,99,235,0.06)',route:'/console/computing/basic' },
  { id:'atm',name:'大气校正',desc:'消除大气散射与吸收，获取地表真实反射率',icon:'daqixiaozheng-48',color:'rgba(5,150,105,0.06)',route:'/console/computing/basic' },
  { id:'geo',name:'几何校正',desc:'消除几何畸变，影像精确地理编码',icon:'jihexiaozheng',color:'rgba(217,119,6,0.06)',route:'/console/computing/basic' },
  { id:'cloud',name:'云检测',desc:'自动识别云覆盖区域与云量百分比',icon:'yunjiance',color:'rgba(107,114,128,0.06)',route:'/console/computing/basic' },
  { id:'clip',name:'影像裁剪',desc:'按ROI矩形区域提取影像子区域',icon:'yingxiangcaijian',color:'rgba(239,68,68,0.06)',route:'/console/computing/basic' },
  { id:'ndvi',name:'NDVI 植被指数',desc:'归一化植被指数，定量评估植被覆盖度',icon:'guangpu',color:'rgba(5,150,105,0.06)',route:'/console/computing/basic' },
  { id:'spec',name:'光谱指数扩展',desc:'EVI/NDWI/SAVI/NDBI等7种指数',icon:'danweihuaxiang-jichuxinxi-nianlingfenbu',color:'rgba(124,58,237,0.06)',route:'/console/computing/basic' },
  { id:'mos',name:'影像镶嵌',desc:'多景影像无缝拼接，生成大范围影像',icon:'yingxiangxiangqian',color:'rgba(245,158,11,0.06)',route:'/console/computing/basic' },
  { id:'fus',name:'影像融合',desc:'多光谱+全色融合，提升空间分辨率',icon:'yingxiangronghe',color:'rgba(37,99,235,0.06)',route:'/console/computing/basic' },
]

const visibleBasic = computed(() => basicExpanded.value ? basic : basic.slice(0, 6))

const models:S[] = [
  { id:'rec',name:'地物识别',desc:'自动识别建筑、道路、森林、水体等地表目标',icon:'diwushibie',color:'rgba(37,99,235,0.06)',route:'/console/computing/models/recognition',tags:['语义分割','U-Net','DeepLab'],modelTag:'分割' },
  { id:'det',name:'目标检测',desc:'定位并检测飞机、船舶、车辆等特定目标',icon:'mubiaojiance',color:'rgba(220,38,38,0.06)',route:'/console/computing/models/detection',tags:['YOLOv8','Faster R-CNN'],modelTag:'检测' },
  { id:'chg',name:'变化检测',desc:'分析多时相影像，发现城市扩张、森林砍伐',icon:'bianhuajiance',color:'rgba(5,150,105,0.06)',route:'/console/computing/models/change-detection',tags:['Siamese','ChangeFormer'],modelTag:'双时相' },
  { id:'fm',name:'多模态融合',desc:'融合光学、SAR、高光谱、LiDAR等多源数据',icon:'duomotaironghe',color:'rgba(217,119,6,0.06)',route:'/console/computing/models/multimodal-fusion',tags:['Cross-Attention','Mamba'],modelTag:'融合' },
]
const visibleModels = computed(() => models)

function go(r:string){ router.push(r) }
</script>

<style scoped>
.chub { min-height:100%; padding:12px 16px 40px; }
.inner { width:100%; }
.page-head { text-align:center; margin-bottom:36px; }
.page-head h1 { font-size:28px; font-weight:800; color:#1F2937; margin:0 0 6px; }
.page-head p { font-size:19px; color:#6B7280; margin:0; }

.sec { margin-bottom:32px; }
.sec-head-card {
  position:relative; border-radius:16px; padding:22px 28px;
  margin-bottom:18px; overflow:hidden;
  box-shadow:0 3px 16px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);
}
.sec-head-card.algo {
  background:linear-gradient(135deg, #F0F5FF 0%, #E8F0FE 30%, #FFFFFF 70%, #F8FAFF 100%);
  border:1px solid rgba(37,99,235,0.1);
}
.sec-head-card.algo::before {
  content:''; position:absolute; top:-40px; right:-30px;
  width:160px; height:160px; border-radius:50%;
  background:radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%);
  pointer-events:none;
}
.sec-head-card.ai {
  background:linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 30%, #FFFFFF 70%, #FAF8FF 100%);
  border:1px solid rgba(124,58,237,0.1);
}
.sec-head-card.ai::before {
  content:''; position:absolute; top:-50px; right:-40px;
  width:180px; height:180px; border-radius:50%;
  background:radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%);
  pointer-events:none;
}
.sec-head { display:flex; align-items:flex-start; justify-content:space-between; position:relative; z-index:1; }
.sec-title { display:flex; align-items:center; gap:16px; }
.sec-ico {
  width:52px; height:52px; border-radius:14px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  transition:transform .2s;
}
.sec-head-card:hover .sec-ico { transform:scale(1.05); }
.sec-ico.algo-ico {
  background:linear-gradient(135deg, #2563EB, #3B82F6); color:#fff;
  box-shadow:0 8px 20px rgba(37,99,235,0.25);
}
.sec-ico.ai-ico {
  background:linear-gradient(135deg, #7C3AED, #8B5CF6); color:#fff;
  box-shadow:0 8px 20px rgba(124,58,237,0.25);
}
.sec-ico .svg-icon {
  width: 22px;
  height: 22px;
}
.algo-ico .svg-icon {
  width: 40px;
  height: 40px;
}
.sec-title-text { position:relative; z-index:1; }
.sec-title-text h2 { font-size:23px; font-weight:800; color:#1F2937; margin:0 0 3px; letter-spacing:-0.4px; line-height:1.2; }
.sec-subtitle { font-size:14px; color:#9CA3AF; font-weight:500; letter-spacing:0.8px; text-transform:uppercase; }
.badge { font-size:14px; padding:5px 14px; border-radius:20px; font-weight:600; white-space:nowrap; position:relative; z-index:1; }
.sec-head-card.algo .badge { color:#2563EB; background:rgba(37,99,235,0.08); }
.sec-head-card.ai .badge { color:#7C3AED; background:rgba(124,58,237,0.08); }
.sec-desc { font-size:19px; color:#6B7280; margin:10px 0 0; line-height:1.6; padding-left:68px; position:relative; z-index:1; }

.card { background:#fff; border-radius:14px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.03); }

.svc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.svc-item { display:flex; align-items:center; gap:14px; cursor:pointer; transition:all .15s; }
.svc-item:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.06); }
.svc-ico, .model-ico { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:0; flex-shrink:0; }
.svc-ico .svg-icon { width:24px; height:24px; color:#2563EB; }
.model-ico .svg-icon { width:20px; height:20px; color:#2563EB; }
.svc-body { flex:1; min-width:0; }
.svc-body h4 { font-size:19px; font-weight:600; color:#1F2937; margin:0 0 3px; }
.svc-body p { font-size:18px; color:#6B7280; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.expand-bar { display:flex; align-items:center; justify-content:center; gap:6px; padding:14px 0 0; font-size:15px; color:#2563EB; cursor:pointer; user-select:none; }
.expand-bar:hover { color:#1D4ED8; }
.expand-bar .el-icon { transition:transform .2s; }
.expand-bar .el-icon.rotated { transform:rotate(180deg); }

.model-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.model-card { display:flex; align-items:flex-start; gap:14px; cursor:pointer; transition:all .15s; }
.model-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.06); }
.model-body { flex:1; min-width:0; }
.model-top { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.model-body h4 { font-size:19px; font-weight:600; color:#1F2937; margin:0; }
.model-body p { font-size:18px; color:#6B7280; margin:0 0 8px; line-height:1.5; }
.tags { display:flex; gap:4px; flex-wrap:wrap; }
.tag { font-size:12px; padding:2px 7px; border-radius:6px; color:#6B7280; background:#F3F4F6; }
.arr { color:#D1D5DB; flex-shrink:0; }

.cta { display:flex; align-items:center; justify-content:space-between; }
.cta h3 { font-size:18px; color:#1F2937; margin:0 0 4px; }
.cta p { font-size:18px; color:#6B7280; margin:0; }

@media (max-width:800px) { .svc-grid,.model-grid{grid-template-columns:repeat(2,1fr)} }
@media (max-width:500px) { .svc-grid,.model-grid{grid-template-columns:1fr} }
</style>
