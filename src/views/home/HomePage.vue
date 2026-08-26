<template>
  <div class="home">
    <!-- ═══════════════════════ 顶部导航 ═══════════════════════ -->
    <header class="topbar" :class="{ scrolled: scrolled }">
      <div class="topbar-inner">
        <div class="topbar-left" @click="$router.push('/rs/home')">
          <span class="logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="5" ry="9" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="1.5" fill="#2563EB"/>
              <rect x="11" y="1" width="2" height="4" rx="1"/><rect x="17" y="4" width="2" height="4" rx="1" transform="rotate(45 18 6)"/>
            </svg>
          </span>
          <span class="logo-text">遥感卫星数据服务平台</span>
        </div>
        <nav class="topbar-nav">
          <div class="nav-dropdown" v-for="menu in navMenus" :key="menu.label">
            <span class="nav-trigger">{{ menu.label }} <i class="arrow">▾</i></span>
            <div class="nav-dropdown-panel">
              <div class="nav-dropdown-inner">
                <div v-for="item in menu.children" :key="item.name" class="nav-dropdown-item"
                  @click="handleNavClick(item)">
                  <span class="ndi-icon"><el-icon :size="18"><component :is="item.icon" /></el-icon></span>
                  <div>
                    <span class="ndi-name">{{ item.name }}</span>
                    <span class="ndi-desc">{{ item.desc }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div class="topbar-right">
          <template v-if="isLoggedIn">
            <el-button link class="nav-link" @click="$router.push('/console/tasks')">任务中心</el-button>
            <el-button type="primary" size="small" round @click="$router.push('/console')">进入控制台</el-button>
          </template>
          <template v-else>
            <el-button link class="nav-link" @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" size="small" round @click="$router.push('/register')">免费注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════ 英雄区 ═══════════════════════ -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-dot dot1"></div>
        <div class="hero-dot dot2"></div>
        <div class="hero-dot dot3"></div>
        <div class="hero-ring ring1"></div>
        <div class="hero-ring ring2"></div>
      </div>
      <div class="hero-inner">
        <h1 class="hero-title">遥感数据，<span class="hl">智</span>在云端</h1>
        <p class="hero-desc">统一数据接入 · AI 智能分析 · 高性能计算引擎<br/>一站式遥感影像数据处理与智能解译平台</p>
        <div class="hero-actions">
          <el-button class="hero-btn-primary" size="large" round @click="$router.push('/register')">免费注册</el-button>
          <el-button class="hero-btn-secondary" size="large" round @click="scrollToSection('anchor-products')">了解产品</el-button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ 新用户福利条 ═══════════════════════ -->
    <section class="benefit-bar">
      <div class="benefit-grid">
        <div v-for="b in benefits" :key="b.title" class="benefit-item">
          <span class="bf-icon"><el-icon :size="22"><component :is="b.icon" /></el-icon></span>
          <div>
            <strong>{{ b.title }}</strong>
            <span>{{ b.desc }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ 产品与服务 ═══════════════════════ -->
    <section id="anchor-products" class="products-section">
      <div class="section-label">产品与服务</div>
      <h2 class="section-title">覆盖遥感数据处理全流程</h2>
      <p class="section-sub">从原始影像到分析结果，一站式算法服务满足您的业务需求</p>

      <!-- 分类标签 -->
      <div class="tab-bar">
        <span v-for="tab in categoryTabs" :key="tab.key" class="tab-item"
          :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          {{ tab.label }}
        </span>
      </div>

      <!-- 产品卡片网格 -->
      <div class="product-grid">
        <div v-for="p in filteredProducts" :key="p.id" class="product-card"
          @click="handleProductClick(p.id)">
          <div class="pc-icon-wrap">
            <span class="pc-icon">{{ p.icon }}</span>
          </div>
          <div class="pc-body">
            <h4 class="pc-name">{{ p.name }}</h4>
            <p class="pc-desc">{{ p.desc }}</p>
          </div>
          <div class="pc-footer">
            <span class="pc-tag">{{ p.category }}</span>
            <span class="pc-action">了解详情 →</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ 卫星数据源 ═══════════════════════ -->
    <section id="anchor-satellites" class="satellites-section">
      <div class="section-label">数据源</div>
      <h2 class="section-title">多源卫星数据接入</h2>
      <!-- 主推卫星 — 全幅卫星地图 + 浮动信息卡片 -->
      <div class="satellite-featured">
        <div ref="satMapContainer" class="sf-map"></div>
        <div class="sf-overlay">
          <div class="sf-badge">主力数据源</div>
          <h3 class="sf-name">{{ featuredSat.name }}<small>{{ featuredSat.sensor }}</small></h3>
          <p class="sf-desc">{{ featuredSat.desc }}</p>
          <div class="sf-specs">
            <div class="sf-spec"><b>{{ featuredSat.resolution }}</b><span>分辨率</span></div>
            <div class="sf-spec"><b>{{ featuredSat.bands }} 波段</b><span>多光谱</span></div>
            <div class="sf-spec"><b>{{ featuredSat.swath }}</b><span>幅宽</span></div>
            <div class="sf-spec"><b>{{ featuredSat.revisit }}</b><span>重访</span></div>
          </div>
        </div>
      </div>
      <!-- 其他卫星 — 底部横条 -->
      <div class="satellite-others">
        <div v-for="sat in otherSatellites" :key="sat.name" class="so-item">
          <span class="so-icon">{{ sat.icon }}</span>
          <strong>{{ sat.name }}</strong>
          <span class="so-spec">{{ sat.resolution }} · {{ sat.bands }}波段 · {{ sat.revisit }}</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ 应用场景 ═══════════════════════ -->
    <section id="anchor-scenarios" class="scenarios-section">
      <div class="section-label">应用场景</div>
      <h2 class="section-title">多行业遥感应用解决方案</h2>
      <div class="scenario-grid">
        <div v-for="sc in scenarios" :key="sc.title" class="scenario-card" @click="$router.push(sc.route)">
          <div class="sc-img"><span class="sc-ico">{{ sc.icon }}</span></div>
          <h4>{{ sc.title }}</h4>
          <p>{{ sc.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ 数字看板 ═══════════════════════ -->
    <section class="stats-section">
      <div class="stats-grid">
        <div v-for="st in statsData" :key="st.label" class="stats-item">
          <div class="stats-value"><span class="num">{{ st.value }}</span><small>{{ st.unit }}</small></div>
          <div class="stats-label">{{ st.label }}</div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════ 底部 CTA ═══════════════════════ -->
    <section class="bottom-cta">
      <h2>准备好开始了吗？</h2>
      <p>新用户注册即享免费计算额度，无需绑定支付方式</p>
      <div class="bottom-cta-btns">
        <el-button class="cta-btn-primary" size="large" round @click="$router.push('/register')">免费注册</el-button>
        <el-button class="cta-btn-outline" size="large" round @click="$router.push('/login')">已有账号，立即登录</el-button>
      </div>
    </section>

    <!-- ═══════════════════════ Footer ═══════════════════════ -->
    <footer class="footer">
      <div class="footer-grid">
        <div class="footer-col">
          <h5>产品</h5>
          <a @click="scrollToSection('anchor-products')">数据中心</a>
          <a @click="scrollToSection('anchor-products')">算法服务</a>
          <a @click="scrollToSection('anchor-products')">AI 智能模型</a>
          <a @click="scrollToSection('anchor-products')">任务中心</a>
        </div>
        <div class="footer-col">
          <h5>数据</h5>
          <a @click="scrollToSection('anchor-satellites')">卫星数据源</a>
          <a @click="scrollToSection('anchor-samples')">数据产品</a>
          <a @click="scrollToSection('anchor-scenarios')">应用场景</a>
          <a @click="scrollToSection('anchor-why')">平台优势</a>
        </div>
        <div class="footer-col">
          <h5>快速入口</h5>
          <a @click="$router.push('/login')">登录控制台</a>
          <a @click="$router.push('/register')">免费注册</a>
        </div>
        <div class="footer-col footer-contact">
          <h5>联系我们</h5>
          <p><el-icon><Message /></el-icon> support@rs-platform.cn</p>
          <p><el-icon><Phone /></el-icon> 400-888-8888</p>
          <p><el-icon><Clock /></el-icon> 7×24 小时技术支持</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 遥感卫星数据服务平台 · 让每一景遥感影像发挥最大价值</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'
import L from 'leaflet'
import { Message, Phone, Clock, Present, Star, Timer, Lock, FolderOpened, Setting, Cpu, List, Sunny, OfficeBuilding, Dish, Warning } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const scrolled = ref(false)
const satMapContainer = ref<HTMLElement>()
let satMap: L.Map | null = null
const activeTab = ref('all')

// ── 导航菜单 ──
const navMenus = [
  {
    label: '产品', children: [
      { icon: FolderOpened, name: '数据中心', desc: '多源卫星数据检索与下载', scroll: 'anchor-products' },
      { icon: Setting, name: '算法服务', desc: '辐射校正、指数计算、影像处理', scroll: 'anchor-products' },
      { icon: FolderOpened, name: '卫星数据源', desc: '哨兵、Landsat、高分等卫星数据', scroll: 'anchor-satellites' },
      { icon: Cpu, name: 'AI 智能模型', desc: '地物识别、目标检测、变化检测', scroll: 'anchor-products' },
      { icon: List, name: '任务中心', desc: '计算任务管理与监控', scroll: 'anchor-products' },
    ]
  },
  {
    label: '解决方案', children: [
      { icon: Sunny, name: '智慧农业', desc: '作物长势监测与估产', scroll: 'anchor-scenarios' },
      { icon: OfficeBuilding, name: '城市规划', desc: '土地利用变化检测', scroll: 'anchor-scenarios' },
      { icon: Dish, name: '水利监测', desc: '水体提取与水质反演', scroll: 'anchor-scenarios' },
      { icon: Warning, name: '灾害评估', desc: '火灾洪涝灾害监测', scroll: 'anchor-scenarios' },
    ]
  },
]

// ── 新用户福利 ──
const benefits = [
  { icon: Present, title: '新用户专享', desc: '注册即送 500 计算额度' },
  { icon: Star, title: '免费试用', desc: '所有算法服务免费体验' },
  { icon: Timer, title: '秒级响应', desc: '常用算法 3 秒内出结果' },
  { icon: Lock, title: '数据安全', desc: '上传数据 7 天后自动清理' },
]

// ── 产品列表 ──
const allProducts = [
  { id: 'calibration', name: '辐射定标', desc: 'DN 值转换为辐射亮度值，支持绝对/相对定标', icon: '📐', category: '辐射校正' },
  { id: 'atmospheric', name: '大气校正', desc: '基于 6SV 模型消除大气散射与吸收效应', icon: '🌫️', category: '辐射校正' },
  { id: 'geometric', name: '几何校正', desc: 'RPC 正射校正，DEM 辅助精确定位', icon: '🗺️', category: '辐射校正' },
  { id: 'cloud_detection', name: '云检测', desc: '多光谱阈值法自动识别云覆盖区域与云量', icon: '☁️', category: '影像预处理' },
  { id: 'clip', name: '影像裁剪', desc: '按矩形 ROI 提取子影像，支持自定义坐标', icon: '✂️', category: '影像预处理' },
  { id: 'ndvi', name: 'NDVI 植被指数', desc: '归一化植被指数，定量评估植被覆盖度', icon: '🌿', category: '指数计算' },
  { id: 'spectral_index', name: '光谱指数扩展', desc: 'EVI、NDWI、SAVI、NDBI 等 7 种指数', icon: '📊', category: '指数计算' },
  { id: 'mosaic', name: '影像镶嵌', desc: '多景影像无缝拼接，全局匀色处理', icon: '🧩', category: '影像处理' },
  { id: 'fusion', name: '影像融合', desc: 'Gram-Schmidt / PCA 多光谱全色融合', icon: '✨', category: '影像处理' },
]

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: '辐射校正', label: '辐射校正' },
  { key: '影像预处理', label: '影像预处理' },
  { key: '指数计算', label: '指数计算' },
  { key: '影像处理', label: '影像处理' },
]

const filteredProducts = computed(() =>
  activeTab.value === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === activeTab.value)
)

// ── 应用场景 ──
const scenarios = [
  { icon: '🌾', title: '智慧农业', desc: '利用 NDVI、EVI 等植被指数监测作物长势，结合时序影像实现产量预估与灾害预警', route: '/scenarios/agriculture' },
  { icon: '🏙️', title: '城市规划', desc: '基于变化检测算法识别土地利用变化，辅助城市规划决策与违建监测', route: '/scenarios/urban' },
  { icon: '💧', title: '水资源管理', desc: 'NDWI 水体指数提取水体范围，云检测自动剔除无效影像数据', route: '/scenarios/water' },
  { icon: '🌲', title: '林业监测', desc: '多光谱影像融合提升分辨率，精准识别林区变化与森林健康状态', route: '/scenarios/forestry' },
]

// ── 亮点 ──
const features = [
  { icon: '🛰️', title: '多源数据接入', desc: '哨兵二号、Landsat-9、高分六号等多源卫星数据，支持标准 GeoTIFF 格式上传' },
  { icon: '🧠', title: 'AI 智能分析', desc: '集成深度学习模型，支持地物识别、目标检测、变化检测等智能遥感解译' },
  { icon: '⚡', title: '高性能计算', desc: '分布式计算引擎，常用算法秒级响应，大规模任务自动并行调度' },
  { icon: '🔒', title: '企业级安全', desc: 'API Key + JWT 双重认证，数据隔离存储，全链路审计追踪，7 天自动清理' },
]

// ── 数据资产统计 ──
// ── 卫星数据源 ──
const featuredSat = { icon: '🛰️', name: '哨兵二号', sensor: 'Sentinel-2A/2B MSI', resolution: '10m', bands: '13', swath: '290km', revisit: '5天', desc: '欧空局（ESA）哥白尼计划核心卫星，双星组网 5 天重访。免费开放数据，Level-2A 大气校正产品开箱即用。13 个光谱波段覆盖可见光、近红外、短波红外，是植被监测、土地利用、水体提取的首选数据源。' }
const otherSatellites = [
  { icon: '🛰️', name: 'Landsat-9', resolution: '30m', bands: '11', revisit: '16天' },
  { icon: '📡', name: '高分六号', resolution: '2m/16m', bands: '8', revisit: '4天' },
  { icon: '🌐', name: 'MODIS', resolution: '250m-1km', bands: '36', revisit: '1-2天' },
  { icon: '🔭', name: '高分一号', resolution: '2m/16m', bands: '5', revisit: '4天' },
  { icon: '🗺️', name: '风云四号', resolution: '500m-4km', bands: '14', revisit: '15分钟' },
]

// ── 数字 ──
const statsData = [
  { label: '累计数据景数', value: '156,800', unit: '+' },
  { label: '覆盖面积 (万km²)', value: '8,520', unit: '' },
  { label: '服务客户', value: '486', unit: '家' },
  { label: '今日 API 调用', value: '2,891', unit: '次' },
]

// ── 交互 ──
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function handleNavClick(item: { name: string; icon: any; desc: string; scroll?: string; route?: string }) {
  if (item.scroll) {
    scrollToSection(item.scroll)
  } else if (item.route) {
    router.push(item.route)
  }
}

function handleProductClick(_id: string) {
  const section = document.getElementById('anchor-products')
  if (section) section.scrollIntoView({ behavior: 'smooth' })
}

function onScroll() { scrolled.value = window.scrollY > 40 }
onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  await nextTick()
  // 延迟确保 DOM 尺寸就绪
  setTimeout(() => {
    if (!satMapContainer.value) return
    satMap = L.map(satMapContainer.value, {
      center: [30.59, 114.31], zoom: 11,
      zoomControl: false, attributionControl: false,
    })
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 }).addTo(satMap)
    satMap.invalidateSize()
    // 自动缓慢平移
    let panDir = 1
    setInterval(() => {
      if (!satMap) return
      const c = satMap.getCenter()
      satMap.panTo([c.lat + panDir * 0.003, c.lng + 0.004], { animate: true, duration: 3 })
      if (c.lat > 30.8) panDir = -1
      if (c.lat < 30.3) panDir = 1
    }, 4000)
  }, 300)
})
onUnmounted(() => { window.removeEventListener('scroll', onScroll); if (satMap) { satMap.remove(); satMap = null; } })
</script>

<style scoped>
/* ═══════════════════════ 基础变量 ═══════════════════════ */
.home { min-height:100vh; background:#fff; color:#1F2937; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif; line-height:1.6; }

/* ═══════════════════════ 导航栏 ═══════════════════════ */
.topbar { position:fixed; top:0; left:0; right:0; z-index:1000; height:56px; background:rgba(255,255,255,0.96); backdrop-filter:blur(12px); transition:box-shadow .25s; box-shadow:0 1px 0 rgba(0,0,0,0.04); }
.topbar.scrolled { box-shadow:0 2px 20px rgba(0,0,0,0.07); }
.topbar-inner { max-width:1200px; margin:0 auto; height:100%; display:flex; align-items:center; gap:32px; padding:0 28px; }
.topbar-left { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; }
.logo-icon { font-size:24px; }
.logo-text { font-size:18px; font-weight:700; color:#1F2937; white-space:nowrap; }

.topbar-nav { display:flex; gap:4px; flex:1; }
.nav-dropdown { position:relative; }
.nav-trigger { display:flex; align-items:center; gap:4px; padding:8px 14px; font-size:17px; font-weight:500; color:#374151; cursor:pointer; border-radius:8px; transition:all .15s; }
.nav-trigger:hover { color:#2563EB; background:rgba(37,99,235,0.04); }
.nav-trigger .arrow { font-size:13px; color:#9CA3AF; margin-top:1px; }
.nav-dropdown-panel { display:none; position:absolute; top:100%; left:0; padding-top:8px; min-width:260px; }
.nav-dropdown:hover .nav-dropdown-panel { display:block; }
.nav-dropdown-inner { background:#fff; border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,0.10); border:1px solid #E5E7EB; padding:8px; }
.nav-dropdown-item { display:flex; align-items:flex-start; gap:12px; padding:10px 12px; border-radius:8px; cursor:pointer; transition:background .12s; }
.nav-dropdown-item:hover { background:#F3F4F6; }
.ndi-icon { font-size:24px; flex-shrink:0; width:32px; text-align:center; }
.ndi-name { display:block; font-size:16px; font-weight:600; color:#1F2937; }
.ndi-desc { display:block; font-size:15px; color:#9CA3AF; margin-top:1px; }

.topbar-right { display:flex; align-items:center; gap:12px; flex-shrink:0; }
.nav-link { color:#4B5563; font-size:17px; }

/* ═══════════════════════ 英雄区 ═══════════════════════ */
.hero { position:relative; overflow:hidden; padding:140px 24px 120px; text-align:center; }
.hero-bg { position:absolute; inset:0; background:linear-gradient(155deg, #0b1a30 0%, #132742 30%, #0d2b45 60%, #091a28 100%); z-index:0; }
.hero-dot { position:absolute; border-radius:50%; background:rgba(37,99,235,0.18); z-index:0; }
.dot1 { width:300px; height:300px; top:-80px; right:-60px; }
.dot2 { width:160px; height:160px; bottom:40px; left:10%; }
.dot3 { width:80px; height:80px; top:60px; left:20%; background:rgba(99,102,241,0.2); }
.hero-ring { position:absolute; border-radius:50%; border:1px solid rgba(255,255,255,0.06); z-index:0; }
.ring1 { width:500px; height:500px; top:-180px; left:50%; transform:translateX(-60%); }
.ring2 { width:340px; height:340px; bottom:-100px; right:15%; }

.hero-inner { position:relative; z-index:1; max-width:740px; margin:0 auto; }
.hero-title { font-size:52px; font-weight:800; color:#fff; margin:0 0 20px; letter-spacing:2px; }
.hero-title .hl { color:#60A5FA; position:relative; }
.hero-desc { font-size:20px; color:rgba(255,255,255,0.65); margin:0 0 44px; line-height:1.8; }
.hero-actions { display:flex; justify-content:center; gap:16px; }
.hero-btn-primary { height:48px; padding:0 44px; font-size:19px; font-weight:600; background:#fff; color:#1F2937; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.15); }
.hero-btn-primary:hover { background:#F9FAFB; box-shadow:0 6px 28px rgba(0,0,0,0.2); transform:translateY(-1px); }
.hero-btn-secondary { height:48px; padding:0 44px; font-size:19px; font-weight:600; border:1.5px solid rgba(255,255,255,0.35); color:#fff; background:transparent; }
.hero-btn-secondary:hover { border-color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.06); }

/* ═══════════════════════ 新用户福利条 ═══════════════════════ */
.benefit-bar { background:#F8FAFC; border-bottom:1px solid #E5E7EB; }
.benefit-grid { max-width:1000px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:0; }
.benefit-item { display:flex; align-items:center; gap:12px; padding:18px 24px; border-right:1px solid #E5E7EB; }
.benefit-item:last-child { border-right:none; }
.bf-icon { font-size:26px; flex-shrink:0; }
.benefit-item strong { display:block; font-size:16px; font-weight:600; color:#1F2937; }
.benefit-item span { font-size:15px; color:#9CA3AF; }

/* ═══════════════════════ 通用区块 ═══════════════════════ */
.section-label { font-size:15px; font-weight:700; color:#2563EB; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
.section-title { font-size:32px; font-weight:700; color:#1F2937; margin:0 0 12px; }
.section-sub { font-size:18px; color:#6B7280; margin:0; }

/* ═══════════════════════ 产品与服务 ═══════════════════════ */
.products-section { max-width:1200px; margin:0 auto; padding:72px 28px 60px; }
.products-section .section-label,
.products-section .section-title,
.products-section .section-sub { text-align:center; }
.products-section .section-sub { margin-bottom:36px; }

.tab-bar { display:flex; justify-content:center; gap:0; margin-bottom:36px; background:#F3F4F6; border-radius:10px; padding:4px; width:fit-content; margin-left:auto; margin-right:auto; }
.tab-item { padding:8px 22px; font-size:16px; font-weight:500; color:#6B7280; cursor:pointer; border-radius:8px; transition:all .2s; }
.tab-item.active { background:#fff; color:#2563EB; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.06); }

.product-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; }
.product-card { background:#fff; border:1px solid #E5E7EB; border-radius:12px; padding:24px; cursor:pointer; transition:all .22s; display:flex; flex-direction:column; }
.product-card:hover { border-color:#2563EB; box-shadow:0 8px 28px rgba(37,99,235,0.08); transform:translateY(-3px); }
.pc-icon-wrap { width:48px; height:48px; border-radius:10px; background:linear-gradient(135deg, rgba(37,99,235,0.06), rgba(99,102,241,0.04)); display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
.pc-icon { font-size:24px; }
.pc-body { flex:1; }
.pc-name { font-size:18px; font-weight:700; color:#1F2937; margin:0 0 6px; }
.pc-desc { font-size:16px; color:#6B7280; margin:0; line-height:1.6; }
.pc-footer { display:flex; align-items:center; justify-content:space-between; margin-top:18px; padding-top:14px; border-top:1px solid #F3F4F6; }
.pc-tag { font-size:14px; font-weight:600; color:#2563EB; background:rgba(37,99,235,0.06); padding:3px 10px; border-radius:5px; }
.pc-action { font-size:15px; font-weight:600; color:#9CA3AF; transition:color .15s; }
.product-card:hover .pc-action { color:#2563EB; }

/* ═══════════════════════ 卫星数据源 ═══════════════════════ */
.satellites-section { max-width:1200px; margin:0 auto; padding:64px 28px 48px; text-align:center; }
/* 全幅卫星地图容器 */
.satellite-featured { position:relative; max-width:1100px; margin:24px auto 0; height:380px; border-radius:16px; overflow:hidden; }
.sf-map { width:100%; height:100%; }
/* 浮动信息卡片 */
.sf-overlay { position:absolute; bottom:0; left:0; right:0; z-index:1000; background:linear-gradient(transparent, rgba(11,26,48,0.94) 35%, rgba(11,26,48,0.99)); padding:56px 28px 24px; color:#fff; text-align:left; pointer-events:none; }
.sf-overlay > * { pointer-events:auto; }
.sf-badge { display:inline-block; font-size:14px; font-weight:700; color:#60A5FA; background:rgba(96,165,250,0.2); padding:4px 12px; border-radius:20px; margin-bottom:10px; }
.sf-name { font-size:24px; font-weight:800; margin:0 0 6px; }
.sf-name small { font-size:15px; font-weight:400; color:rgba(255,255,255,0.45); font-family:monospace; margin-left:10px; }
.sf-desc { font-size:16px; color:rgba(255,255,255,0.55); line-height:1.7; margin:0 0 14px; max-width:600px; }
.sf-specs { display:flex; gap:12px; }
.sf-spec { background:rgba(255,255,255,0.1); border-radius:10px; padding:10px 18px; text-align:center; }
.sf-spec b { display:block; font-size:21px; font-weight:700; color:#fff; }
.sf-spec span { display:block; font-size:13px; color:rgba(255,255,255,0.4); margin-top:3px; }
/* 其他卫星 */
.satellite-others { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-top:20px; max-width:1100px; margin-left:auto; margin-right:auto; }
.so-item { display:flex; align-items:center; gap:8px; background:#F8FAFC; border-radius:10px; padding:10px 16px; border:1px solid #E5E7EB; }
.so-icon { font-size:23px; }
.so-item strong { font-size:16px; font-weight:600; color:#374151; }
.so-spec { font-size:14px; color:#9CA3AF; }

/* ═══════════════════════ 应用场景 ═══════════════════════ */
.scenarios-section { background:#F8FAFC; padding:72px 28px 60px; text-align:center; }
.scenario-grid { max-width:1200px; margin:40px auto 0; display:grid; grid-template-columns:repeat(4, 1fr); gap:24px; }
.scenario-card { background:#fff; border-radius:12px; padding:32px 24px; transition:all .2s; border:1px solid transparent; cursor:pointer; }
.scenario-card:hover { border-color:#E5E7EB; box-shadow:0 4px 20px rgba(0,0,0,0.04); }
.sc-ico { font-size:42px; display:block; margin-bottom:16px; }
.scenario-card h4 { font-size:19px; font-weight:700; color:#1F2937; margin:0 0 8px; }
.scenario-card p { font-size:16px; color:#6B7280; margin:0; line-height:1.7; }

/* ═══════════════════════ 数字看板 ═══════════════════════ */
.stats-section { background:linear-gradient(155deg, #0b1a30, #132742); padding:60px 28px; }
.stats-grid { max-width:900px; margin:0 auto; display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; }
.stats-item { text-align:center; padding:20px; }
.stats-value { margin-bottom:8px; }
.stats-value .num { font-size:40px; font-weight:800; color:#fff; }
.stats-value small { font-size:21px; font-weight:600; color:rgba(255,255,255,0.5); margin-left:2px; }
.stats-label { font-size:17px; color:rgba(255,255,255,0.5); }

/* ═══════════════════════ 底部 CTA ═══════════════════════ */
.bottom-cta { text-align:center; padding:72px 28px; background:#F8FAFC; }
.bottom-cta h2 { font-size:30px; font-weight:700; color:#1F2937; margin:0 0 10px; }
.bottom-cta p { font-size:18px; color:#6B7280; margin:0 0 32px; }
.bottom-cta-btns { display:flex; justify-content:center; gap:16px; }
.cta-btn-primary { height:48px; padding:0 40px; font-size:19px; font-weight:600; background:#2563EB; color:#fff; border:none; box-shadow:0 4px 16px rgba(37,99,235,0.25); }
.cta-btn-primary:hover { background:#1D4ED8; box-shadow:0 6px 24px rgba(37,99,235,0.35); transform:translateY(-1px); }
.cta-btn-outline { height:48px; padding:0 40px; font-size:19px; font-weight:600; border:1.5px solid #D1D5DB; color:#374151; background:#fff; }
.cta-btn-outline:hover { border-color:#2563EB; color:#2563EB; }

/* ═══════════════════════ Footer ═══════════════════════ */
.footer { background:#fff; border-top:1px solid #E5E7EB; padding:48px 28px 28px; }
.footer-grid { max-width:1000px; margin:0 auto; display:grid; grid-template-columns:repeat(4, 1fr); gap:40px; }
.footer-col h5 { font-size:17px; font-weight:700; color:#1F2937; margin:0 0 16px; }
.footer-col a { display:block; font-size:16px; color:#6B7280; text-decoration:none; padding:3px 0; transition:color .15s; cursor:pointer; }
.footer-col a:hover { color:#2563EB; }
.footer-contact p { font-size:16px; color:#6B7280; margin:0 0 6px; }
.footer-bottom { max-width:1000px; margin:32px auto 0; padding-top:20px; border-top:1px solid #F0F1F3; text-align:center; }
.footer-bottom p { font-size:15px; color:#9CA3AF; margin:0; }

/* ═══════════════════════ 响应式 ═══════════════════════ */
@media (max-width: 900px) {
  .topbar-nav { display:none; }
  .product-grid { grid-template-columns:repeat(2, 1fr); }
  .scenario-grid, .benefit-grid, .stats-grid, .footer-grid { grid-template-columns:repeat(2, 1fr); }
  .satellite-featured { height:280px; }
  .sf-name { font-size:21px; }
  .hero-title { font-size:34px; }
  .hero { padding:100px 20px 80px; }
}
@media (max-width: 560px) {
  .product-grid, .scenario-grid, .benefit-grid, .stats-grid, .footer-grid { grid-template-columns:1fr; }
  .sf-spec { min-width:56px; padding:10px 12px; }
  .sf-spec b { font-size:19px; }
  .hero-title { font-size:26px; }
  .hero-actions { flex-direction:column; align-items:center; }
  .benefit-item { border-right:none; border-bottom:1px solid #E5E7EB; }
  .benefit-item:last-child { border-bottom:none; }
}
</style>
