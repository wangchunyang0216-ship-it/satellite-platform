<template>
  <div class="sc-page">
    <!-- 顶部导航 -->
    <header class="topbar">
      <div class="topbar-inner">
        <div class="logo" @click="$router.push('/rs/home')">
          <span class="logo-icon">🛰️</span>
          <span class="logo-text">遥感卫星数据服务平台</span>
        </div>
        <div class="topbar-actions">
          <el-button link class="nav-link" @click="$router.push('/rs/home')">返回首页</el-button>
          <el-button type="primary" size="small" round @click="$router.push('/console')">进入控制台</el-button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-icon">💧</div>
        <h1>水资源管理</h1>
        <p>水体范围提取 · 动态监测 · 云检测剔除</p>
      </div>
    </section>

    <!-- 内容 -->
    <div class="content">
      <section class="block">
        <h2 class="block-title">行业痛点</h2>
        <div class="pain-grid">
          <div class="pain-item">
            <span class="pain-ico">💧</span>
            <strong>水体范围难监测</strong>
            <p>湖泊、河流水体范围随季节动态变化，传统测量手段难以精确掌握全貌。</p>
          </div>
          <div class="pain-item">
            <span class="pain-ico">☁️</span>
            <strong>云遮挡影像</strong>
            <p>光学影像受云层遮挡，直接影响水体识别的精度与连续性。</p>
          </div>
          <div class="pain-item">
            <span class="pain-ico">📉</span>
            <strong>调度决策缺数据</strong>
            <p>水资源调度与旱涝评估缺乏及时、准确的水体面积数据支撑。</p>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">解决方案</h2>
        <p class="block-desc">基于 NDWI 水体指数与云检测算法，实现水体范围的精确提取与长时序动态监测。</p>
        <div class="sol-list">
          <div class="sol-item">
            <span class="sol-step">1</span>
            <div>
              <strong>NDWI 水体指数提取</strong>
              <p>利用 NDWI（归一化差异水体指数）精确提取水体范围，区分水体与陆地、植被，生成水体分布图。</p>
            </div>
          </div>
          <div class="sol-item">
            <span class="sol-step">2</span>
            <div>
              <strong>云检测剔除无效影像</strong>
              <p>云检测算法自动识别云覆盖区域，剔除无效像元，保证水体提取结果的准确可靠。</p>
            </div>
          </div>
          <div class="sol-item">
            <span class="sol-step">3</span>
            <div>
              <strong>水体动态监测</strong>
              <p>多时相影像时序分析，监测水体面积变化趋势，辅助旱涝预警与水资源调度决策。</p>
            </div>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">关联算法</h2>
        <div class="algo-grid">
          <div class="algo-item" @click="$router.push('/console/computing/basic')">
            <span class="algo-ico">📊</span>
            <strong>光谱指数扩展</strong>
            <p>NDWI 水体指数，精确提取水体范围</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
          <div class="algo-item" @click="$router.push('/console/computing/basic')">
            <span class="algo-ico">☁️</span>
            <strong>云检测</strong>
            <p>自动识别云覆盖区域与云量百分比</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
          <div class="algo-item" @click="$router.push('/console/computing/models/change-detection')">
            <span class="algo-ico">🔄</span>
            <strong>变化检测</strong>
            <p>时序影像分析，监测水体面积变化</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
        </div>
      </section>
    </div>

    <footer class="foot">
      <p>© 2026 遥感卫星数据服务平台 · 让每一景遥感影像发挥最大价值</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.sc-page { min-height:100vh; display:flex; flex-direction:column; background:#F8FAFC; }

/* 顶部导航 */
.topbar { position:sticky; top:0; z-index:10; background:rgba(255,255,255,0.95); backdrop-filter:blur(8px); border-bottom:1px solid #E5E7EB; }
.topbar-inner { max-width:1200px; margin:0 auto; padding:0 24px; height:64px; display:flex; align-items:center; justify-content:space-between; }
.logo { display:flex; align-items:center; gap:10px; cursor:pointer; }
.logo-icon { font-size:22px; }
.logo-text { font-size:17px; font-weight:700; color:#1F2937; }
.topbar-actions { display:flex; align-items:center; gap:8px; }
.nav-link { font-size:16px; color:#4B5563; }

/* Hero */
.hero { background:linear-gradient(135deg, #0284C7 0%, #06B6D4 50%, #22D3EE 100%); padding:72px 24px; text-align:center; color:#fff; }
.hero-inner { max-width:800px; margin:0 auto; }
.hero-icon { font-size:52px; margin-bottom:12px; }
.hero h1 { font-size:34px; font-weight:800; margin:0 0 8px; letter-spacing:1px; }
.hero p { font-size:18px; color:rgba(255,255,255,0.85); margin:0; }

/* 内容 */
.content { flex:1; max-width:1200px; margin:0 auto; padding:40px 24px 60px; width:100%; }
.block { margin-bottom:44px; }
.block-title { font-size:22px; font-weight:800; color:#1F2937; margin:0 0 20px; padding-left:14px; border-left:4px solid #06B6D4; }
.block-desc { font-size:17px; color:#4B5563; margin:0 0 24px; line-height:1.7; }

/* 痛点 */
.pain-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.pain-item { background:#fff; border:1px solid #EEF0F3; border-radius:12px; padding:24px; }
.pain-ico { font-size:30px; display:block; margin-bottom:12px; }
.pain-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:8px; }
.pain-item p { font-size:15px; color:#6B7280; margin:0; line-height:1.6; }

/* 解决方案 */
.sol-list { display:flex; flex-direction:column; gap:16px; }
.sol-item { display:flex; gap:16px; background:#fff; border:1px solid #EEF0F3; border-radius:12px; padding:24px; }
.sol-step { flex-shrink:0; width:40px; height:40px; border-radius:50%; background:#06B6D4; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.sol-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:6px; }
.sol-item p { font-size:15px; color:#6B7280; margin:0; line-height:1.7; }

/* 关联算法 */
.algo-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.algo-item { background:#fff; border:1px solid #EEF0F3; border-radius:12px; padding:24px; cursor:pointer; transition:all .15s; }
.algo-item:hover { transform:translateY(-3px); border-color:#06B6D4; box-shadow:0 8px 24px rgba(6,182,212,0.1); }
.algo-ico { font-size:32px; display:block; margin-bottom:12px; }
.algo-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:8px; }
.algo-item p { font-size:15px; color:#6B7280; margin:0 0 16px; line-height:1.6; }
.algo-arrow { font-size:15px; font-weight:600; color:#06B6D4; }

/* 底部 */
.foot { text-align:center; padding:24px; border-top:1px solid #E5E7EB; background:#fff; }
.foot p { font-size:15px; color:#9CA3AF; margin:0; }

@media (max-width:800px) { .pain-grid,.algo-grid{grid-template-columns:1fr} }
</style>
