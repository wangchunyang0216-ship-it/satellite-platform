<template>
  <div class="guide-page">
    <header class="guide-topbar">
      <div class="guide-brand" @click="$router.push('/rs/home')">
        <span class="brand-mark">◎</span>
        <span>遥感卫星数据服务平台</span>
      </div>
      <div class="guide-actions">
        <el-button link @click="$router.push('/rs/home')">返回首页</el-button>
        <el-button type="primary" round @click="$router.push('/console')">进入控制台</el-button>
      </div>
    </header>

    <main class="guide-main">
      <section class="guide-hero">
        <span class="eyebrow">USER GUIDE</span>
        <h1>平台使用说明文档</h1>
        <p>从注册登录、数据检索、算法计算到结果查看，快速了解遥感卫星数据服务平台的完整使用流程。</p>
      </section>

      <section class="guide-grid">
        <article v-for="item in guideSteps" :key="item.title" class="guide-card">
          <div class="step-index">{{ item.index }}</div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.desc }}</p>
          <ul>
            <li v-for="point in item.points" :key="point">{{ point }}</li>
          </ul>
        </article>
      </section>

      <section class="guide-panel">
        <div>
          <h2>推荐操作路径</h2>
          <p>首次使用时，建议先从数据中心选择卫星影像，再进入算法服务提交计算任务，最后在任务中心查看处理进度和结果。</p>
        </div>
        <el-button type="primary" size="large" round @click="$router.push('/console/data')">开始检索数据</el-button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
const guideSteps = [
  {
    index: '01',
    title: '进入平台',
    desc: '通过首页注册或登录，进入遥感平台控制台。',
    points: ['新用户可点击免费注册', '已有账号可直接登录', '登录后可进入控制台查看任务与资源'],
  },
  {
    index: '02',
    title: '检索卫星数据',
    desc: '在数据中心按卫星、传感器或覆盖区域检索影像数据。',
    points: ['搜索风云、高分、哨兵等卫星', '选择目标卫星后进入专属影像目录', '按云量、日期、传感器筛选影像'],
  },
  {
    index: '03',
    title: '使用算法服务',
    desc: '选择辐射校正、指数计算、影像处理或进入智能计算中心。',
    points: ['上传或选择影像数据', '配置算法参数', '提交计算任务并等待处理完成'],
  },
  {
    index: '04',
    title: '查看任务结果',
    desc: '在任务中心查看进度、历史任务和计算结果。',
    points: ['查看任务状态和完成时间', '预览结果影像或统计图', '按需下载处理结果'],
  },
]
</script>

<style scoped>
.guide-page{min-height:100vh;background:#f6f8fb;color:#172033}.guide-topbar{height:56px;background:#fff;border-bottom:1px solid #e6ebf2;display:flex;align-items:center;justify-content:space-between;padding:0 12%;position:sticky;top:0;z-index:20}.guide-brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:700;cursor:pointer}.brand-mark{color:#2563eb;font-size:24px}.guide-actions{display:flex;align-items:center;gap:12px}.guide-main{max-width:1120px;margin:0 auto;padding:58px 28px 72px}.guide-hero{text-align:center;margin-bottom:34px}.eyebrow{font-size:13px;font-weight:700;letter-spacing:2px;color:#2563eb}.guide-hero h1{font-size:38px;margin:8px 0 12px}.guide-hero p{max-width:720px;margin:0 auto;color:#667085;font-size:18px;line-height:1.8}.guide-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.guide-card{background:#fff;border:1px solid #e5eaf1;border-radius:12px;padding:24px}.step-index{font-size:26px;font-weight:800;color:#d9e6ff;margin-bottom:8px}.guide-card h2{font-size:21px;margin:0 0 8px}.guide-card p{color:#667085;margin:0 0 14px;line-height:1.7}.guide-card ul{margin:0;padding-left:18px;color:#344054;line-height:1.9}.guide-panel{margin-top:22px;background:linear-gradient(155deg,#0b1a30,#132742);color:#fff;border-radius:14px;padding:26px 30px;display:flex;align-items:center;justify-content:space-between;gap:24px}.guide-panel h2{margin:0 0 8px;font-size:24px}.guide-panel p{margin:0;color:rgba(255,255,255,.68);line-height:1.8}@media(max-width:760px){.guide-topbar{padding:0 18px}.guide-grid{grid-template-columns:1fr}.guide-panel{align-items:flex-start;flex-direction:column}.guide-hero h1{font-size:30px}}
</style>
