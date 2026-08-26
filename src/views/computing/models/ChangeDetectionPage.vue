<template>
  <div class="model-page">
    <PageHeader title="变化检测" desc="基于 ChangeFormer / Siamese 网络 — 分析多时相影像，发现城市扩张、森林砍伐、矿区变化" />
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card><template #header><span class="panel-title">检测参数</span></template>
          <el-form label-position="top">
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="模型"><el-select v-model="params.model" style="width:100%"><el-option label="ChangeFormer (推荐)" value="changeformer"/><el-option label="Siamese U-Net" value="siamese"/><el-option label="BIT" value="bit"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="前期影像" ><el-date-picker v-model="params.beforeDate" type="date" placeholder="选择日期" style="width:100%"/></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="后期影像"><el-date-picker v-model="params.afterDate" type="date" placeholder="选择日期" style="width:100%"/></el-form-item></el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="数据源"><el-select v-model="params.source" style="width:100%"><el-option label="哨兵二号 (10m)" value="sentinel2"/><el-option label="高分六号 (2m)" value="gf6"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="检测类型"><el-select v-model="params.changeType" style="width:100%" multiple><el-option label="城市扩张" value="urban"/><el-option label="植被变化" value="vegetation"/><el-option label="水体变化" value="water"/><el-option label="道路变化" value="road"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="变化阈值"><el-slider v-model="params.threshold" :min="0.1" :max="0.9" :step="0.1" show-input style="margin-top:12px"/></el-form-item></el-col>
            </el-row>
            <el-form-item><el-button type="primary" size="large" :loading="running" @click="run">{{ running ? '分析中…' : '▶ 开始分析' }}</el-button></el-form-item>
          </el-form>
        </el-card>
        <el-card style="margin-top:16px" v-if="result"><template #header><span class="panel-title">变化分析结果</span></template>
          <el-row :gutter="16"><el-col :span="12" v-for="c in result.changes" :key="c.type"><el-card shadow="never" class="change-card"><div class="change-header"><span class="change-icon"><el-icon :size="22"><component :is="c.icon" /></el-icon></span><div><div class="change-type">{{ c.typeZh }}</div><div class="change-trend" :style="{color:c.trendColor}">{{ c.trend }}</div></div></div><div class="change-stats"><span>变化面积: <b>{{ c.area }} km²</b></span><span>置信度: <b>{{ (c.confidence*100).toFixed(1) }}%</b></span></div></el-card></el-col></el-row>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card><template #header><span class="panel-title">模型信息</span></template><el-descriptions :column="1" border size="small"><el-descriptions-item label="基础架构">ChangeFormer (Transformer)</el-descriptions-item><el-descriptions-item label="骨干网络">MiT (Mix Transformer)</el-descriptions-item><el-descriptions-item label="训练数据">LEVIR-CD + WHU-CD</el-descriptions-item><el-descriptions-item label="F1-Score">91.8%</el-descriptions-item><el-descriptions-item label="推理速度">~1.5s/km² (A100)</el-descriptions-item></el-descriptions></el-card>
        <el-card style="margin-top:16px"><template #header><span class="panel-title">应用场景</span></template><ul class="scene-list"><li>城市扩张与土地利用变化监测</li><li>森林砍伐与退耕还林评估</li><li>矿区开采范围变化追踪</li><li>自然灾害（洪水/火灾）受灾评估</li></ul></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Sunny, Dish, MapLocation } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
const params = reactive({ model: 'changeformer', source: 'sentinel2', beforeDate: '2023-07-01', afterDate: '2026-07-01', changeType: ['urban', 'vegetation'], threshold: 0.5 })
const running = ref(false)
const result = ref<{ changes: { type:string; typeZh:string; icon:any; trend:string; trendColor:string; area:number; confidence:number }[] } | null>(null)
function run() {
  running.value = true
  setTimeout(() => {
    running.value = false
    result.value = { changes: [
      { type:'urban', typeZh:'城市扩张', icon: OfficeBuilding, trend:'扩张 +12.5%', trendColor:'#F56C6C', area:35.8, confidence:0.94 },
      { type:'vegetation', typeZh:'植被变化', icon: Sunny, trend:'退化 -8.3%', trendColor:'#E6A23C', area:52.3, confidence:0.91 },
      { type:'water', typeZh:'水体变化', icon: Dish, trend:'波动 +3.1%', trendColor:'#409EFF', area:18.2, confidence:0.88 },
      { type:'road', typeZh:'道路变化', icon: MapLocation, trend:'新建 +6.7%', trendColor:'#67C23A', area:12.5, confidence:0.90 },
    ]}
    ElMessage.success('变化检测完成！')
  }, 3200)
}
</script>

<style scoped>
.model-page { flex: 1; padding: 20px; overflow-y: auto; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; }
.change-card { margin-bottom: 0; }
.change-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.change-icon { font-size: 28px; }
.change-type { font-size: 17px; font-weight: 600; color: #303133; }
.change-trend { font-size: 15px; }
.change-stats { display: flex; gap: 20px; font-size: 15px; color: #606266; }
.scene-list { padding-left: 18px; margin: 0; }
.scene-list li { font-size: 15px; color: #606266; line-height: 2; }
</style>
