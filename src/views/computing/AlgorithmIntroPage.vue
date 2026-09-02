<template>
  <div class="intro-page">
    <div class="intro-hero">
      <button class="back-btn" type="button" @click="router.push('/console/computing/models')">
        <el-icon><ArrowLeft /></el-icon>
        返回智能计算中心
      </button>
      <div class="hero-main">
        <span class="hero-ico" :style="{ background: service.color }">
          <svg-icon :icon-class="service.icon" />
        </span>
        <div>
          <p class="kicker">{{ service.category }}</p>
          <h1>{{ service.name }}</h1>
          <p class="hero-desc">{{ service.summary }}</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="startUse">进入功能使用</el-button>
    </div>

    <div class="intro-grid">
      <section class="panel span-2">
        <h2>功能介绍</h2>
        <p>{{ service.detail }}</p>
        <div class="feature-list">
          <article v-for="item in service.features" :key="item">
            <el-icon><Check /></el-icon>
            <span>{{ item }}</span>
          </article>
        </div>
      </section>

      <section class="panel">
        <h2>适用场景</h2>
        <div class="tag-list">
          <span v-for="scene in service.scenes" :key="scene">{{ scene }}</span>
        </div>
      </section>

      <section class="panel">
        <h2>输入输出</h2>
        <dl class="io-list">
          <div>
            <dt>输入</dt>
            <dd>{{ service.input }}</dd>
          </div>
          <div>
            <dt>输出</dt>
            <dd>{{ service.output }}</dd>
          </div>
        </dl>
      </section>

      <section class="panel example-panel span-2">
        <h2>简单示例</h2>
        <div class="example-card">
          <div>
            <strong>{{ service.exampleTitle }}</strong>
            <p>{{ service.example }}</p>
          </div>
          <el-button type="primary" plain @click="startUse">使用该算法</el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check } from '@element-plus/icons-vue'

interface Intro {
  id: string
  name: string
  category: string
  icon: string
  color: string
  summary: string
  detail: string
  features: string[]
  scenes: string[]
  input: string
  output: string
  exampleTitle: string
  example: string
}

const route = useRoute()
const router = useRouter()

const intros: Record<string, Intro> = {
  calibration: {
    id: 'calibration',
    name: '辐射定标',
    category: '辐射校正',
    icon: 'fushedingbiao',
    color: 'linear-gradient(135deg,#2563EB,#60A5FA)',
    summary: '将影像 DN 值转换为辐射亮度或表观反射率，让数据具备可比较的物理意义。',
    detail: '辐射定标用于消除传感器增益、偏置和成像条件差异造成的灰度偏差，是多时相分析、指数计算和后续反演任务的基础处理步骤。',
    features: ['支持绝对定标与相对定标', '保留原始空间参考信息', '输出可直接进入后续校正与指数计算'],
    scenes: ['多时相对比', '定量遥感反演', '数据预处理'],
    input: '单景 GeoTIFF 影像、定标类型参数',
    output: '辐射亮度 / 表观反射率 GeoTIFF 与统计信息',
    exampleTitle: '示例：高分影像定标预处理',
    example: '上传一景高分六号影像，选择绝对定标后生成可用于 NDVI 或大气校正的标准化结果。',
  },
  atmospheric: {
    id: 'atmospheric',
    name: '大气校正',
    category: '辐射校正',
    icon: 'daqixiaozheng-48',
    color: 'linear-gradient(135deg,#059669,#34D399)',
    summary: '削弱大气散射、吸收和薄雾影响，恢复更接近地表真实状态的反射率。',
    detail: '大气校正适合在影像对比、植被指数、水体指数和地表覆盖分析前使用，减少不同日期、不同天气条件下的颜色和亮度差异。',
    features: ['支持大陆型、海洋型、城市型气溶胶模型', '适合批量预处理链路', '提升指数计算稳定性'],
    scenes: ['地表反射率生成', '植被与水体分析', '跨期影像对比'],
    input: '定标后影像、气溶胶模型参数',
    output: '地表反射率 GeoTIFF 与校正统计',
    exampleTitle: '示例：武汉城区影像去雾校正',
    example: '选择城市型气溶胶模型，对城区影像进行校正，降低薄雾对建筑和道路识别的影响。',
  },
  geometric: {
    id: 'geometric',
    name: '几何校正',
    category: '几何校正',
    icon: 'jihexiaozheng',
    color: 'linear-gradient(135deg,#D97706,#F59E0B)',
    summary: '校正影像几何畸变，提高地理定位精度，便于与矢量、DEM 和多源影像叠加。',
    detail: '几何校正基于 DEM 与重采样方式对影像进行地理纠正，可减少地形起伏、传感器姿态等造成的位置偏移。',
    features: ['支持 SRTM / ALOS DEM', '支持双线性和三次卷积重采样', '适合制图和结果叠加'],
    scenes: ['地图叠加', '多源配准', '变化检测前处理'],
    input: '原始影像、DEM 源、重采样方式',
    output: '地理编码后的 GeoTIFF 影像',
    exampleTitle: '示例：山区影像定位修正',
    example: '对山区卫星影像选择 SRTM 30m DEM 进行校正，让道路、水系和行政边界叠加更准确。',
  },
  cloud_detection: {
    id: 'cloud_detection',
    name: '云检测',
    category: '影像预处理',
    icon: 'yunjiance',
    color: 'linear-gradient(135deg,#64748B,#94A3B8)',
    summary: '自动识别云、薄云和高亮遮挡区域，输出云覆盖比例与掩膜结果。',
    detail: '云检测用于判断影像可用性，也可作为后续裁剪、镶嵌和变化检测的质量控制步骤，避免云层区域干扰分析结果。',
    features: ['支持阈值参数调整', '输出云量百分比', '可作为任务筛选条件'],
    scenes: ['影像质检', '灾害应急筛选', '无云影像挑选'],
    input: '单景多光谱影像、云检测阈值',
    output: '云掩膜、云覆盖率和预览图',
    exampleTitle: '示例：灾害区域影像可用性检查',
    example: '上传灾后影像并设置云检测阈值，快速判断可用于洪涝或地震评估的有效区域。',
  },
  clip: {
    id: 'clip',
    name: '影像裁剪',
    category: '影像预处理',
    icon: 'yingxiangcaijian',
    color: 'linear-gradient(135deg,#DC2626,#F87171)',
    summary: '根据 ROI 或矩形范围裁出目标区域，减少后续计算量并聚焦重点区域。',
    detail: '影像裁剪适用于大范围影像中的局部分析，例如农田样方、城市新区、河道沿线和重点工程区域。',
    features: ['支持 X/Y/宽/高矩形参数', '保留裁剪区域空间信息', '适合轻量任务快速验证'],
    scenes: ['ROI 分析', '样本制作', '局部成果交付'],
    input: '原始影像、裁剪窗口参数',
    output: '裁剪后的子区域 GeoTIFF',
    exampleTitle: '示例：重点农田样方裁剪',
    example: '从一景大范围 Sentinel-2 影像中裁出农田样方，再进入植被指数计算。',
  },
  ndvi: {
    id: 'ndvi',
    name: 'NDVI 植被指数',
    category: '指数计算',
    icon: 'guangpu',
    color: 'linear-gradient(135deg,#16A34A,#4ADE80)',
    summary: '利用红光和近红外波段计算植被覆盖与长势状态，是农业和生态监测常用指标。',
    detail: 'NDVI 通过近红外与红光反射差异刻画植被活性，可用于作物长势、林地健康、水土保持和生态恢复评估。',
    features: ['上传红波段和近红外波段即可计算', '输出均值、标准差、最大最小值', '支持结果图层叠加预览'],
    scenes: ['智慧农业', '林业监测', '生态修复'],
    input: '红波段 B04、近红外 B08 GeoTIFF',
    output: 'NDVI 栅格、统计指标与预览图',
    exampleTitle: '示例：农田植被覆盖评估',
    example: '上传同一区域 B04/B08 波段，计算 NDVI 后查看低值区，辅助识别长势异常地块。',
  },
  spectral_index: {
    id: 'spectral_index',
    name: '光谱指数扩展',
    category: '指数计算',
    icon: 'danweihuaxiang-jichuxinxi-nianlingfenbu',
    color: 'linear-gradient(135deg,#7C3AED,#A78BFA)',
    summary: '支持 EVI、NDWI、SAVI、NDBI 等指数，覆盖植被、水体、裸土和建设用地分析。',
    detail: '光谱指数扩展适合根据业务目标选择不同指数，补充 NDVI 单一指标的局限，形成更完整的地表状态判断。',
    features: ['多指数类型可选', '统一输出统计结构', '可与专题图层联动'],
    scenes: ['水体提取', '城市建设用地', '干旱与裸土分析'],
    input: '多光谱波段影像、指数类型',
    output: '对应指数栅格与统计结果',
    exampleTitle: '示例：湖泊水体范围识别',
    example: '选择 NDWI 指数，对湖泊区域影像进行计算，突出水体边界并辅助面积变化分析。',
  },
  mosaic: {
    id: 'mosaic',
    name: '影像镶嵌',
    category: '影像处理',
    icon: 'yingxiangxiangqian',
    color: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
    summary: '将多景相邻或重叠影像拼接成连续大范围成果，适合区域级制图。',
    detail: '影像镶嵌用于跨轨道、跨景号影像的统一成图，配合匀色和拼接线策略可减少接边差异。',
    features: ['支持拼接线策略', '支持匀色处理', '生成区域级连续影像'],
    scenes: ['大区域底图制作', '行政区成果交付', '多景影像整合'],
    input: '多景影像、拼接线和匀色参数',
    output: '镶嵌后的大范围 GeoTIFF',
    exampleTitle: '示例：城市群影像拼接',
    example: '选择多景覆盖城市群的影像，开启匀色后生成一张连续的专题底图。',
  },
  fusion: {
    id: 'fusion',
    name: '影像融合',
    category: '影像处理',
    icon: 'yingxiangronghe',
    color: 'linear-gradient(135deg,#2563EB,#38BDF8)',
    summary: '融合全色与多光谱数据，在保留光谱信息的同时提升空间细节表现。',
    detail: '影像融合适合目标识别、精细制图和成果展示，让道路、建筑、水系边缘更加清晰。',
    features: ['支持 Gram-Schmidt / PCA / Brovey', '提升空间分辨率', '适合识别类任务前处理'],
    scenes: ['精细化解译', '目标检测前处理', '成果展示增强'],
    input: '全色影像、多光谱影像、融合算法',
    output: '融合增强后的 GeoTIFF 影像',
    exampleTitle: '示例：城区建筑纹理增强',
    example: '将高分辨率全色影像与多光谱影像融合，用于后续建筑轮廓识别和规划分析。',
  },
}

const service = computed(() => intros[String(route.params.serviceId)] || intros.ndvi)

watchEffect(() => {
  route.meta.title = service.value.name
})

function startUse() {
  router.push({ path: '/console/computing/basic', query: { service: service.value.id } })
}
</script>

<style scoped>
.intro-page { min-height:100%; padding:18px; background:#F3F6FA; }
.intro-hero {
  display:flex; align-items:center; justify-content:space-between; gap:18px;
  background:#fff; border:1px solid #E5E7EB; border-radius:18px; padding:22px 24px;
  box-shadow:0 8px 24px rgba(15,23,42,.05);
}
.back-btn {
  border:0; background:#F3F4F6; color:#475569; border-radius:999px; padding:8px 12px;
  display:flex; align-items:center; gap:6px; cursor:pointer; flex-shrink:0;
}
.back-btn:hover { color:#2563EB; background:#EFF6FF; }
.hero-main { display:flex; align-items:center; gap:18px; flex:1; min-width:0; }
.hero-ico {
  width:64px; height:64px; border-radius:18px; display:flex; align-items:center; justify-content:center;
  color:#fff; box-shadow:0 10px 22px rgba(37,99,235,.16); flex-shrink:0;
}
.hero-ico .svg-icon { width:36px; height:36px; }
.kicker { margin:0 0 4px; font-size:13px; color:#2563EB; font-weight:800; letter-spacing:.08em; }
h1 { margin:0; font-size:28px; color:#0F172A; line-height:1.2; }
.hero-desc { margin:8px 0 0; font-size:16px; color:#64748B; line-height:1.7; }
.intro-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:16px; margin-top:16px; }
.panel { background:#fff; border:1px solid #E5E7EB; border-radius:16px; padding:20px; box-shadow:0 6px 18px rgba(15,23,42,.04); }
.span-2 { grid-column:span 2; }
h2 { margin:0 0 12px; font-size:20px; color:#0F172A; }
.panel p { margin:0; font-size:16px; color:#475569; line-height:1.8; }
.feature-list { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:16px; }
.feature-list article { display:flex; align-items:center; gap:8px; padding:12px; border-radius:12px; color:#1E293B; background:#F8FAFC; border:1px solid #E2E8F0; }
.feature-list .el-icon { color:#2563EB; }
.tag-list { display:flex; flex-wrap:wrap; gap:10px; }
.tag-list span { padding:8px 12px; border-radius:999px; color:#2563EB; background:#EFF6FF; font-size:14px; font-weight:700; }
.io-list { margin:0; display:grid; gap:14px; }
.io-list div { padding:12px; background:#F8FAFC; border-radius:12px; border:1px solid #E2E8F0; }
.io-list dt { font-size:14px; color:#2563EB; font-weight:800; margin-bottom:6px; }
.io-list dd { margin:0; color:#475569; line-height:1.7; }
.example-card { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:18px; background:linear-gradient(135deg,#F8FAFC,#EFF6FF); border:1px solid #DBEAFE; border-radius:14px; }
.example-card strong { font-size:17px; color:#0F172A; }
.example-card p { margin-top:6px; }
@media (max-width:900px) {
  .intro-hero { flex-direction:column; align-items:stretch; }
  .intro-grid { grid-template-columns:1fr; }
  .span-2 { grid-column:auto; }
  .feature-list { grid-template-columns:1fr; }
}
</style>
