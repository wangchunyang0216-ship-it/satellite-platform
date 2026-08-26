<template>
  <div class="model-page">
    <PageHeader title="多模态融合" desc="融合光学、SAR、高光谱、LiDAR 等多源遥感数据，提高分析精度与信息维度" />
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card><template #header><span class="panel-title">融合参数</span></template>
          <el-form label-position="top">
            <el-row :gutter="16">
              <el-col :span="12"><el-form-item label="主数据（光学）"><el-select v-model="params.primary" style="width:100%"><el-option label="高分六号 多光谱 (2m)" value="gf6"/><el-option label="哨兵二号 MSI (10m)" value="sentinel2"/></el-select></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="辅助数据"><el-select v-model="params.secondary" style="width:100%" multiple><el-option label="SAR (哨兵一号)" value="sar"/><el-option label="高光谱 (PRISMA)" value="hyperspectral"/><el-option label="LiDAR (ICESat-2)" value="lidar"/></el-select></el-form-item></el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="8"><el-form-item label="融合算法"><el-select v-model="params.algorithm" style="width:100%"><el-option label="Cross-Attention Mamba" value="mamba"/><el-option label="Transformer Fusion" value="transformer"/><el-option label="CNN Concatenation" value="cnn"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="输出分辨率"><el-select v-model="params.outputRes" style="width:100%"><el-option label="按主数据" value="primary"/><el-option label="1m 超分辨率" value="1m"/></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="输出波段"><el-select v-model="params.outputBands" style="width:100%" multiple><el-option label="光学+SAR融合" value="opt_sar"/><el-option label="高程信息" value="dem"/><el-option label="光谱指数" value="indices"/></el-select></el-form-item></el-col>
            </el-row>
            <el-form-item><el-button type="primary" size="large" :loading="running" @click="run">{{ running ? '融合中…' : '▶ 开始融合' }}</el-button></el-form-item>
          </el-form>
        </el-card>
        <el-card style="margin-top:16px" v-if="result"><template #header><span class="panel-title">融合结果</span></template>
          <div class="result-grid"><div v-for="b in result.bands" :key="b.name" class="band-preview"><div class="band-img" :style="{borderColor:b.color}"><el-icon :size="36" :color="b.color"><Picture /></el-icon></div><span class="band-label">{{ b.name }}</span><span class="band-info">{{ b.info }}</span></div></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card><template #header><span class="panel-title">模型信息</span></template><el-descriptions :column="1" border size="small"><el-descriptions-item label="基础架构">Cross-Attention Mamba</el-descriptions-item><el-descriptions-item label="融合策略">特征级注意力融合</el-descriptions-item><el-descriptions-item label="支持模态">光学/SAR/高光谱/LiDAR</el-descriptions-item><el-descriptions-item label="精度提升">+12~18% vs 纯光学</el-descriptions-item><el-descriptions-item label="推理速度">~3.5s/km² (A100)</el-descriptions-item></el-descriptions></el-card>
        <el-card style="margin-top:16px"><template #header><span class="panel-title">应用场景</span></template><ul class="scene-list"><li>云雨区 SAR+光学互补监测</li><li>城市三维建模（光学+LiDAR）</li><li>精准农业（多光谱+高光谱）</li><li>地质勘探与矿物识别</li></ul></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
const params = reactive({ primary:'gf6', secondary:['sar'], algorithm:'mamba', outputRes:'primary', outputBands:['opt_sar'] })
const running = ref(false)
const result = ref<{ bands: { name:string; info:string; color:string }[] } | null>(null)
function run() {
  running.value = true
  setTimeout(() => {
    running.value = false
    result.value = { bands: [
      { name:'光学-SAR融合', info:'空间分辨率 2m · 含纹理增强', color:'#409EFF' },
      { name:'DEM高程', info:'SRTM 30m 重采样', color:'#67C23A' },
      { name:'NDVI', info:'植被指数栅格', color:'#E6A23C' },
      { name:'NDWI', info:'水体指数栅格', color:'#00D4FF' },
    ]}
    ElMessage.success('多模态融合完成！')
  }, 3500)
}
</script>

<style scoped>
.model-page { flex: 1; padding: 20px; overflow-y: auto; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; }
.result-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.band-preview { text-align: center; }
.band-img { height: 90px; display: flex; align-items: center; justify-content: center; background: #f5f7fa; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 6px; }
.band-label { font-size: 15px; font-weight: 600; color: #303133; display: block; }
.band-info { font-size: 13px; color: #909399; }
.scene-list { padding-left: 18px; margin: 0; }
.scene-list li { font-size: 15px; color: #606266; line-height: 2; }
</style>
