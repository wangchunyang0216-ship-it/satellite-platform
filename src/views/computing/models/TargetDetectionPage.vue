<template>
  <div class="model-page">
    <PageHeader title="目标检测" desc="基于 YOLOv8 / Faster R-CNN — 定位并检测飞机、船舶、车辆等特定目标" />
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card><template #header><span class="panel-title">检测参数</span></template>
          <el-form label-position="top">
            <el-row :gutter="16">
              <el-col :span="6"><el-form-item label="模型"><el-select v-model="params.model" style="width:100%"><el-option label="YOLOv8-X (推荐)" value="yolov8x"/><el-option label="Faster R-CNN" value="fasterrcnn"/><el-option label="DETR" value="detr"/></el-select></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="数据源"><el-select v-model="params.source" style="width:100%"><el-option label="高分七号 (0.65m)" value="gf7"/><el-option label="WorldView-4 (0.31m)" value="wv4"/></el-select></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="目标类型"><el-select v-model="params.targetType" style="width:100%"><el-option label="飞机" value="aircraft"/><el-option label="船舶" value="ship"/><el-option label="车辆" value="vehicle"/><el-option label="建筑" value="building"/></el-select></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="置信度阈值"><el-slider v-model="params.confidence" :min="0.1" :max="0.9" :step="0.1" show-input style="margin-top:12px"/></el-form-item></el-col>
            </el-row>
            <el-form-item><el-button type="primary" size="large" :loading="running" @click="run">{{ running ? '检测中…' : '▶ 开始检测' }}</el-button></el-form-item>
          </el-form>
        </el-card>
        <el-card style="margin-top:16px" v-if="result"><template #header><span class="panel-title">检测结果 — 共 {{ result.total }} 个目标</span></template>
          <div class="result-map"><el-icon :size="64" color="#F56C6C"><Aim /></el-icon><p>目标检测标注图（含边界框与置信度）</p></div>
          <el-table :data="result.objects" border size="small" style="margin-top:12px"><el-table-column prop="id" label="#" width="50"/><el-table-column prop="classNameZh" label="类别" width="100"/><el-table-column prop="confidence" label="置信度" width="90"><template #default="{row}">{{ (row.confidence*100).toFixed(1) }}%</template></el-table-column><el-table-column prop="bbox" label="边界框 (x,y,w,h)"/></el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card><template #header><span class="panel-title">模型信息</span></template><el-descriptions :column="1" border size="small"><el-descriptions-item label="基础架构">YOLOv8-X</el-descriptions-item><el-descriptions-item label="骨干网络">CSPDarkNet</el-descriptions-item><el-descriptions-item label="训练数据">DOTA v2.0 + DIOR</el-descriptions-item><el-descriptions-item label="mAP@0.5">92.6%</el-descriptions-item><el-descriptions-item label="推理速度">~0.8s/km² (A100)</el-descriptions-item></el-descriptions></el-card>
        <el-card style="margin-top:16px"><template #header><span class="panel-title">应用场景</span></template><ul class="scene-list"><li>机场飞机数量统计与型号识别</li><li>港口船舶检测与吞吐量估算</li><li>城市车辆密度分析</li><li>军事目标侦察与态势感知</li></ul></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Aim } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

const params = reactive({ model: 'yolov8x', source: 'gf7', targetType: 'aircraft', confidence: 0.5 })
const running = ref(false)
const result = ref<{ total: number; objects: { id: number; classNameZh: string; confidence: number; bbox: string }[] } | null>(null)

function run() {
  running.value = true
  setTimeout(() => {
    running.value = false
    result.value = { total: 47, objects: [
      { id:1, classNameZh:'飞机', confidence:0.96, bbox:'[0.234, 0.451, 0.078, 0.062]' },
      { id:2, classNameZh:'飞机', confidence:0.93, bbox:'[0.312, 0.528, 0.065, 0.058]' },
      { id:3, classNameZh:'飞机', confidence:0.89, bbox:'[0.567, 0.389, 0.082, 0.071]' },
      { id:4, classNameZh:'车辆', confidence:0.91, bbox:'[0.721, 0.612, 0.045, 0.038]' },
      { id:5, classNameZh:'车辆', confidence:0.87, bbox:'[0.683, 0.591, 0.042, 0.035]' },
    ]}
    ElMessage.success('目标检测完成！共检测到 47 个目标')
  }, 2800)
}
</script>

<style scoped>
.model-page { flex: 1; padding: 20px; overflow-y: auto; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; }
.result-map { height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f5f7fa; border-radius: 8px; color: #909399; }
.scene-list { padding-left: 18px; margin: 0; }
.scene-list li { font-size: 15px; color: #606266; line-height: 2; }
</style>
