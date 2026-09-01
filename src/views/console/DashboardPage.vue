<template>
  <div class="dash">
    <div class="dash-header">
      <div>
        <h2 class="dash-title">控制台</h2>
        <p class="dash-sub">欢迎回来，{{ userStore.user?.username || '用户' }}</p>
      </div>
    </div>

    <!-- 配额概览 -->
    <div class="quota-bar">
      <div class="quota-info">
        <span class="quota-label">资源配额</span>
        <span class="quota-usage">{{ quotaUsed }} / {{ quotaTotal }}</span>
      </div>
      <el-progress
        :percentage="quotaPercent"
        :stroke-width="8"
        :color="quotaColor"
      />
    </div>

    <!-- 概览卡片 -->
    <el-row :gutter="16" class="dash-cards">
      <el-col :span="6" v-for="card in overviewCards" :key="card.label">
        <el-card shadow="never" class="ov-card" @click="$router.push(card.route)">
          <div class="ovc-icon">
            <svg-icon v-if="typeof card.icon === 'string'" :icon-class="card.icon" />
            <el-icon v-else :size="22"><component :is="card.icon" /></el-icon>
          </div>
          <div class="ovc-body">
            <div class="ovc-val">{{ card.value }}</div>
            <div class="ovc-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 + 最近任务 -->
    <el-row :gutter="16" class="dash-row">
      <el-col :span="14">
        <el-card shadow="never" class="dash-panel">
          <template #header>
            <span class="dp-head">快捷入口</span>
          </template>
          <div class="quick-grid">
            <div v-for="q in quickLinks" :key="q.label" class="quick-item" @click="$router.push(q.route)">
              <svg-icon v-if="typeof q.icon === 'string'" :icon-class="q.icon" class-name="qi-icon" />
              <el-icon v-else :size="20" class="qi-icon"><component :is="q.icon" /></el-icon>
              <span class="qi-label">{{ q.label }}</span>
              <span class="qi-desc">{{ q.desc }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never" class="dash-panel">
          <template #header>
            <div class="dp-head-row">
              <span class="dp-head">最近任务</span>
              <el-button link type="primary" size="small" @click="$router.push('/console/tasks')">全部 →</el-button>
            </div>
          </template>
          <div v-if="!recentTasks.length" class="dp-empty">暂无计算任务</div>
          <div v-for="t in recentTasks" :key="t.taskId" class="dp-task">
            <span class="dpt-svc">{{ serviceName(t.service) }}</span>
            <span class="dpt-status" :class="t.status">
              {{ statusLabel(t.status) }}
            </span>
            <span class="dpt-time">{{ fmtTime(t.createdAt) }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 算法服务推荐 -->
    <el-card shadow="never" class="dash-panel dash-panel--last">
      <template #header>
        <span class="dp-head">推荐服务</span>
      </template>
      <div class="svc-row">
        <div v-for="s in recommendServices" :key="s.id" class="svc-chip" @click="$router.push('/console/computing/basic')">
          <svg-icon :icon-class="s.icon" class-name="svc-icon" />
          <div>
            <strong>{{ s.name }}</strong>
            <small>{{ s.desc }}</small>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/useUserStore'
import { computeApi, type AlgorithmTask } from '@/api/compute'
import {
  Picture,
  FolderOpened,
  User,
} from '@element-plus/icons-vue'

const userStore = useUserStore()

/* ───── 配额 ───── */
const quotaTotal = computed(() => userStore.user?.quota ?? 100)
const quotaUsed = computed(() => userStore.user?.usedQuota ?? 0)
const quotaPercent = computed(() => {
  if (!quotaTotal.value) return 0
  return Math.min(Math.round((quotaUsed.value / quotaTotal.value) * 100), 100)
})
const quotaColor = computed(() => {
  if (quotaPercent.value >= 90) return '#F56C6C'
  if (quotaPercent.value >= 70) return '#E6A23C'
  return '#409EFF'
})

/* ───── 概览卡片 ───── */
const overviewCards = [
  { icon: Picture, value: '—', label: '数据景数', route: '/console/data' },
  { icon: 'jisuanrenwu', value: '—', label: '计算任务', route: '/console/tasks' },
  { icon: 'suanfafuwu', value: '9', label: '算法服务', route: '/console/computing/basic' },
  { icon: 'dingdan', value: '—', label: '我的订单', route: '/console/orders' },
]

/* ───── 快捷入口 ───── */
const quickLinks = [
  { icon: FolderOpened, label: '数据中心', desc: '浏览与检索卫星数据', route: '/console/data' },
  { icon: 'suanfafuwu', label: '算法服务', desc: '辐射校正·指数计算·影像处理', route: '/console/computing/basic' },
  { icon: 'yaogan', label: '智能计算中心', desc: '算法服务·遥感大模型·任务编排', route: '/console/computing/models' },
  { icon: 'jisuanrenwu', label: '任务中心', desc: '管理计算任务与结果', route: '/console/tasks' },
  { icon: 'dingdan', label: '我的订单', desc: '查看历史订单', route: '/console/orders' },
  { icon: User, label: '个人中心', desc: '账户设置与配额', route: '/console/profile' },
]

/* ───── 推荐服务 ───── */
const recommendServices = [
  { id: 'ndvi', icon: 'guangpu', name: 'NDVI 植被指数', desc: '植被覆盖度分析' },
  { id: 'cloud_detection', icon: 'yunjiance', name: '云检测', desc: '自动识别云覆盖' },
  { id: 'fusion', icon: 'yingxiangronghe', name: '影像融合', desc: '多光谱+全色融合' },
  { id: 'calibration', icon: 'fushedingbiao', name: '辐射定标', desc: 'DN值→辐射亮度' },
]

/* ───── 任务 ───── */
const recentTasks = ref<AlgorithmTask[]>([])
const serviceName = (s: string) => ({ calibration: '辐射定标', atmospheric: '大气校正', geometric: '几何校正', ndvi: 'NDVI', cloud_detection: '云检测', clip: '影像裁剪', spectral_index: '光谱指数', mosaic: '影像镶嵌', fusion: '影像融合' }[s] || s)
const statusLabel = (s: string) => ({ completed: '已完成', running: '处理中', pending: '排队中', failed: '失败' }[s] || s)
const fmtTime = (t: string) => t ? new Date(t).toLocaleString() : ''

onMounted(async () => {
  try {
    const res = await computeApi.getTasks(1, 4)
    recentTasks.value = res.data.data.list || []
  } catch { /* pass */ }
})
</script>

<style scoped>
.dash { max-width:100%; margin:0 auto; padding:0 4px; }

/* ═══ 页头 ═══ */
.dash-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.dash-title { font-size:26px; font-weight:700; color:#1F2937; margin:0 0 4px; }
.dash-sub { font-size:18px; color:#6B7280; margin:0; }

/* ═══ 配额条 ═══ */
.quota-bar { background:#fff; border-radius:12px; padding:16px 20px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.04); border:1px solid #EBEEF5; }
.quota-info { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.quota-label { font-size:16px; font-weight:600; color:#606266; }
.quota-usage { font-size:16px; color:#909399; }

/* ═══ 概览卡片 ═══ */
.dash-cards { margin-bottom:20px; }
.ov-card { cursor:pointer; border-radius:12px; border:1px solid #EBEEF5; transition:all .2s; }
.ov-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.06); border-color:#D1D5DB; }
.ov-card :deep(.el-card__body) { display:flex; align-items:center; gap:14px; padding:20px; }
.ovc-icon { display:flex; align-items:center; justify-content:center; width:42px; height:42px; border-radius:10px; background:#F0F5FF; color:#409EFF; }
.ovc-icon .svg-icon { width:22px; height:22px; }
.ovc-body { flex:1; min-width:0; }
.ovc-val { font-size:28px; font-weight:700; color:#1F2937; }
.ovc-label { font-size:17px; color:#9CA3AF; margin-top:2px; }

/* ═══ 面板 ═══ */
.dash-row { margin-bottom:20px; }
.dash-panel { border-radius:12px; border:1px solid #EBEEF5; background:#fff; }
.dash-panel :deep(.el-card__header) { padding:16px 20px; border-bottom:1px solid #F0F1F3; }
.dash-panel :deep(.el-card__body) { padding:20px; }
.dash-panel--last { margin-bottom:20px; }
.dp-head { font-size:19px; font-weight:700; color:#1F2937; }
.dp-head-row { display:flex; align-items:center; justify-content:space-between; }
.dp-empty { text-align:center; padding:40px 0; color:#C0C4CC; font-size:16px; }

/* ═══ 快捷入口 ═══ */
.quick-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; }
.quick-item { padding:16px; border-radius:10px; cursor:pointer; border:1px solid #F0F1F3; transition:all .15s; }
.quick-item:hover { background:#F5F7FA; border-color:#C0C4CC; }
.qi-icon { display:flex; margin-bottom:8px; color:#606266; }
.qi-label { font-size:16px; font-weight:600; color:#303133; display:block; }
.qi-desc { font-size:15px; color:#909399; display:block; margin-top:4px; }

/* ═══ 任务列表 ═══ */
.dp-task { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #F5F7FA; font-size:16px; }
.dp-task:last-child { border-bottom:none; padding-bottom:0; }
.dp-task:first-child { padding-top:0; }
.dpt-svc { flex:1; font-weight:500; color:#374151; }
.dpt-status { font-size:15px; padding:2px 8px; border-radius:4px; font-weight:500; }
.dpt-status.completed { color:#059669; background:rgba(16,185,129,0.08); }
.dpt-status.running { color:#D97706; background:rgba(245,158,11,0.08); }
.dpt-status.pending { color:#909399; background:rgba(144,147,153,0.08); }
.dpt-status.failed { color:#DC2626; background:rgba(220,38,38,0.06); }
.dpt-time { font-size:15px; color:#C0C4CC; flex-shrink:0; }

/* ═══ 推荐服务 ═══ */
.svc-row { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; }
.svc-chip { display:flex; align-items:center; gap:12px; padding:16px; border-radius:10px; cursor:pointer; border:1px solid #F0F1F3; transition:all .15s; }
.svc-chip:hover { background:#F5F7FA; border-color:#C0C4CC; }
.svc-icon { width:22px; height:22px; color:#409EFF; flex-shrink:0; }
.svc-chip strong { display:block; font-size:16px; color:#303133; }
.svc-chip small { font-size:15px; color:#909399; margin-top:2px; display:block; }
</style>
