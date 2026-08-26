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
        <div class="hero-icon">🏙️</div>
        <h1>城市规划</h1>
        <p>土地利用变化检测 · 违建监测 · 规划决策</p>
      </div>
    </section>

    <!-- 内容 -->
    <div class="content">
      <section class="block">
        <h2 class="block-title">行业痛点</h2>
        <div class="pain-grid">
          <div class="pain-item">
            <span class="pain-ico">🏗️</span>
            <strong>土地利用变化难发现</strong>
            <p>城市扩张迅速，土地利用类型转换频繁，传统人工统计滞后、更新慢。</p>
          </div>
          <div class="pain-item">
            <span class="pain-ico">🚧</span>
            <strong>违建监测效率低</strong>
            <p>违法建设行为隐蔽、分布零散，人工巡查覆盖不全、发现不及时。</p>
          </div>
          <div class="pain-item">
            <span class="pain-ico">📋</span>
            <strong>规划决策缺数据</strong>
            <p>规划编制缺乏及时、客观的土地利用现状数据，决策依据不足。</p>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">解决方案</h2>
        <p class="block-desc">基于变化检测算法与多时相卫星影像，实现城市土地利用变化的自动识别与违建目标的快速发现。</p>
        <div class="sol-list">
          <div class="sol-item">
            <span class="sol-step">1</span>
            <div>
              <strong>变化检测识别土地利用变化</strong>
              <p>基于双时相影像的变化检测算法，自动识别新增建筑、道路、土地类型转换等变化图斑，生成城市变化分布图。</p>
            </div>
          </div>
          <div class="sol-item">
            <span class="sol-step">2</span>
            <div>
              <strong>时序对比监测违建</strong>
              <p>多期影像自动对比，结合规划红线数据叠加分析，及时发现疑似违建目标，辅助执法取证。</p>
            </div>
          </div>
          <div class="sol-item">
            <span class="sol-step">3</span>
            <div>
              <strong>辅助规划决策</strong>
              <p>变化图斑与土地利用现状叠加分析，为城市规划编制、评估与调整提供及时客观的数据支撑。</p>
            </div>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">关联算法</h2>
        <div class="algo-grid">
          <div class="algo-item" @click="$router.push('/console/computing/models/change-detection')">
            <span class="algo-ico">🔄</span>
            <strong>变化检测</strong>
            <p>双时相影像分析，自动识别土地利用变化</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
          <div class="algo-item" @click="$router.push('/console/computing/models/recognition')">
            <span class="algo-ico">🏘️</span>
            <strong>地物识别</strong>
            <p>自动识别建筑、道路、水体等地表目标</p>
            <span class="algo-arrow">立即使用 →</span>
          </div>
          <div class="algo-item" @click="$router.push('/console/computing/basic')">
            <span class="algo-ico">🧩</span>
            <strong>影像镶嵌</strong>
            <p>多景影像无缝拼接，生成大范围城市影像</p>
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
.hero { background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A855F7 100%); padding:72px 24px; text-align:center; color:#fff; }
.hero-inner { max-width:800px; margin:0 auto; }
.hero-icon { font-size:52px; margin-bottom:12px; }
.hero h1 { font-size:34px; font-weight:800; margin:0 0 8px; letter-spacing:1px; }
.hero p { font-size:18px; color:rgba(255,255,255,0.85); margin:0; }

/* 内容 */
.content { flex:1; max-width:1200px; margin:0 auto; padding:40px 24px 60px; width:100%; }
.block { margin-bottom:44px; }
.block-title { font-size:22px; font-weight:800; color:#1F2937; margin:0 0 20px; padding-left:14px; border-left:4px solid #7C3AED; }
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
.sol-step { flex-shrink:0; width:40px; height:40px; border-radius:50%; background:#7C3AED; color:#fff; font-size:18px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.sol-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:6px; }
.sol-item p { font-size:15px; color:#6B7280; margin:0; line-height:1.7; }

/* 关联算法 */
.algo-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.algo-item { background:#fff; border:1px solid #EEF0F3; border-radius:12px; padding:24px; cursor:pointer; transition:all .15s; }
.algo-item:hover { transform:translateY(-3px); border-color:#7C3AED; box-shadow:0 8px 24px rgba(124,58,237,0.1); }
.algo-ico { font-size:32px; display:block; margin-bottom:12px; }
.algo-item strong { display:block; font-size:17px; font-weight:700; color:#1F2937; margin-bottom:8px; }
.algo-item p { font-size:15px; color:#6B7280; margin:0 0 16px; line-height:1.6; }
.algo-arrow { font-size:15px; font-weight:600; color:#7C3AED; }

/* 底部 */
.foot { text-align:center; padding:24px; border-top:1px solid #E5E7EB; background:#fff; }
.foot p { font-size:15px; color:#9CA3AF; margin:0; }

@media (max-width:800px) { .pain-grid,.algo-grid{grid-template-columns:1fr} }
</style>
