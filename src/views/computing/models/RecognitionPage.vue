<template>
  <div class="model-page">
    <PageHeader title="地物识别" desc="基于遥感大模型的语义分割 — 自动识别建筑、道路、森林、水体等地表目标" />
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card><template #header><span class="panel-title">识别参数</span></template>
          <el-form label-position="top">
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="模型"><el-select v-model="params.model" style="width:100%"><el-option label="U-Net++ (推荐)" value="unetpp"/><el-option label="DeepLabV3+" value="deeplab"/><el-option label="SegFormer" value="segformer"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="数据源"><el-select v-model="params.source" style="width:100%"><el-option label="高分六号 (2m)" value="gf6"/><el-option label="哨兵二号 (10m)" value="sentinel2"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="识别类别"><el-select v-model="params.category" style="width:100%" multiple><el-option label="建筑" value="building"/><el-option label="道路" value="road"/><el-option label="森林" value="forest"/><el-option label="水体" value="water"/><el-option label="农田" value="farmland"/><el-option label="裸地" value="bareland"/></el-select></el-form-item></el-col>
            </el-row>
            <el-form-item><el-button type="primary" size="large" :loading="running" @click="run">{{ running ? '推理中…' : '▶ 开始识别' }}</el-button></el-form-item>
          </el-form>
        </el-card>
        <el-card style="margin-top:16px" v-if="result"><template #header><span class="panel-title">识别结果</span></template>
          <el-row :gutter="16">
            <el-col :span="16"><div class="result-map"><el-icon :size="64" color="#409EFF"><Picture /></el-icon><p>地物分类渲染图</p></div></el-col>
            <el-col :span="8">
              <div v-for="c in result.classes" :key="c.name" class="class-bar"><span class="class-color" :style="{background:c.color}"/><span class="class-name">{{ c.name }}</span><span class="class-pct">{{ c.ratio }}%</span></div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card><template #header><span class="panel-title">模型信息</span></template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="基础架构">U-Net++ / DeepLabV3+</el-descriptions-item>
            <el-descriptions-item label="骨干网络">ResNet-101</el-descriptions-item>
            <el-descriptions-item label="训练数据">LandCover.ai + GID-15</el-descriptions-item>
            <el-descriptions-item label="mIoU">87.3%</el-descriptions-item>
            <el-descriptions-item label="推理速度">~2.8s/km² (A100)</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card style="margin-top:16px"><template #header><span class="panel-title">应用场景</span></template>
          <ul class="scene-list"><li>城市规划与土地利用分类</li><li>生态环境监测与评估</li><li>农业种植结构调查</li><li>水资源管理与水域监测</li></ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

const params = reactive({ model: 'unetpp', source: 'gf6', category: ['building', 'road', 'forest', 'water'] })
const running = ref(false)
const result = ref<{ classes: { name: string; color: string; ratio: number }[] } | null>(null)

function run() {
  running.value = true
  setTimeout(() => {
    running.value = false
    result.value = { classes: [
      { name: '建筑', color: '#F56C6C', ratio: 18.5 },
      { name: '道路', color: '#909399', ratio: 8.2 },
      { name: '森林', color: '#67C23A', ratio: 32.1 },
      { name: '水体', color: '#409EFF', ratio: 15.3 },
      { name: '农田', color: '#E6A23C', ratio: 21.7 },
      { name: '裸地', color: '#D2B48C', ratio: 4.2 },
    ]}
    ElMessage.success('地物识别完成！')
  }, 3000)
}
</script>

<style scoped>
.model-page { flex: 1; padding: 20px; overflow-y: auto; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; }
.result-map { height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f5f7fa; border-radius: 8px; color: #909399; }
.class-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 15px; }
.class-color { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
.class-name { flex: 1; color: #606266; }
.class-pct { font-weight: 600; color: #303133; }
.scene-list { padding-left: 18px; margin: 0; }
.scene-list li { font-size: 15px; color: #606266; line-height: 2; }
</style>
