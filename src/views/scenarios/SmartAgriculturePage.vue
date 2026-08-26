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
        <div class="hero-icon">🌾</div>
        <h1>智慧农业</h1>
        <p>作物长势监测 · 产量预估 · 灾害预警</p>
      </div>
    </section>

    <!-- 内容 -->
    <div class="content">
      <section class="block">
        <h2 class="block-title">行业痛点</h2>
        <div class="pain-grid">
          <div class="pain-item">
            <span class="pain-ico">👀</span>
            <strong>人工巡田成本高</strong>
            <p>农田面积大、地块分散，人工巡查覆盖范围有限、效率低、成本高。</p>
          </div>
          <div class="pain-item">
            <span class="pain-ico">📈</span>
            <strong>长势难以量化</strong>
            <p>作物生长状态依赖经验判断，缺乏客观、可量化的植被覆盖度评估手段。</p>
          </div>
          <div class="pain-item">
            <span class="pain-ico">⚠️</span>
            <strong>灾害预警滞后</strong>
            <p>干旱、洪涝、病虫害等灾害发现不及时，往往造成损失后才被动响应。</p>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">解决方案</h2>
        <p class="block-desc">基于多时相卫星影像与植被指数，构建从「长势监测 → 产量预估 → 灾害预警」的全流程遥感农业监测体系。</p>
        <div class="sol-list">
          <div class="sol-item">
            <span class="sol-step">1</span>
            <div>
              <strong>植被指数长势监测</strong>
              <p>利用 NDVI、EVI 等植被指数反演作物长势，生成覆盖度与叶绿素含量的空间分布图，实时掌握全区作物生长状态。</p>
            </div>
          </div>
          <div class="sol-item">
            <span class="sol-step">2</span>
            <div>
              <strong>时序影像产量预估</strong>
              <p>结合关键生育期的时序影像，建立长势-产量回归模型，提前完成区域作物估产，辅助粮食安全决策。</p>
            </div>
          </div>
          <div class="sol-item">
            <span class="sol-step">3</span>
            <div>
              <strong>灾害监测与预警</strong>
              <p>通过时序变化检测与指数异常分析，及时发现干旱、洪涝、病虫害等异常，实现灾害早发现、早预警、早处置。</p>
            </div>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">关联算法</h2>
        <div class="algo-grid">
          <div class="algo-item" @click="$router.push('/console/computing/basic')">
            <span class="algo-ico">🌿</span>
            <strong>NDVI 植被指数</strong>
            <p>归一化植被指数，定量评估植被覆盖度</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
          <div class="algo-item" @click="$router.push('/console/computing/basic')">
            <span class="algo-ico">📊</span>
            <strong>光谱指数扩展</strong>
            <p>EVI、NDWI、SAVI 等 7 种光谱指数</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
          <div class="algo-item" @click="$router.push('/console/computing/models/change-detection')">
            <span class="algo-ico">🔄</span>
            <strong>变化检测</strong>
            <p>多时相影像分析，发现农田异常变化</p>
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
.hero { background:linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #059669 100%); padding:72px 24px; text-align:center; color:#fff; }
.hero-inner { max-width:800px; margin:0 auto; }
.hero-icon { font-size:52px; margin-bottom:12px; }
.hero h1 { font-size:34px; font-weight:800; margin:0 0 8px; letter-spacing:1px; }
.hero p { font-size:18px; color:rgba(255,255,255,0.85); margin:0; }

/* 内容 */
.content { flex:1; max-width:1200px; margin:0 auto; padding:40px 24px 60px; width:100%; }
.block { margin-bottom:44px; }
.block-title { font-size:22px; font-weight:800; color:#1F2937; margin:0 0 20px; padding-left:14px; border-left:4px solid #2563EB; }
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
.sol-step { flex-shrink:0; width:40px; height:40px; border-radius:50%; background:#2563EB; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.sol-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:6px; }
.sol-item p { font-size:15px; color:#6B7280; margin:0; line-height:1.7; }

/* 关联算法 */
.algo-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.algo-item { background:#fff; border:1px solid #EEF0F3; border-radius:12px; padding:24px; cursor:pointer; transition:all .15s; }
.algo-item:hover { transform:translateY(-3px); border-color:#2563EB; box-shadow:0 8px 24px rgba(37,99,235,0.1); }
.algo-ico { font-size:32px; display:block; margin-bottom:12px; }
.algo-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:8px; }
.algo-item p { font-size:15px; color:#6B7280; margin:0 0 16px; line-height:1.6; }
.algo-arrow { font-size:15px; font-weight:600; color:#2563EB; }

/* 底部 */
.foot { text-align:center; padding:24px; border-top:1px solid #E5E7EB; background:#fff; }
.foot p { font-size:15px; color:#9CA3AF; margin:0; }

@media (max-width:800px) { .pain-grid,.algo-grid{grid-template-columns:1fr} }
</style>
