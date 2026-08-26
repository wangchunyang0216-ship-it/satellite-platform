<template>
  <div class="basic-service-page">
    <PageHeader :title="service.title" :desc="service.desc" />

    <!-- 服务参数配置 -->
    <el-card style="margin-top: 16px">
      <template #header><span class="panel-title">参数配置</span></template>
      <el-form label-position="top" size="default">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="输入数据源">
              <el-select v-model="params.dataSource" placeholder="选择卫星数据" style="width: 100%">
                <el-option label="哨兵二号 MSI" value="sentinel2" />
                <el-option label="Landsat-9 OLI" value="landsat9" />
                <el-option label="高分六号 PMS" value="gf6" />
                <el-option label="风云四号 AGRI" value="fy4a" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="影像区域">
              <el-select v-model="params.region" placeholder="选择目标区域" style="width: 100%">
                <el-option label="武汉阳逻 (114.5°E, 30.5°N)" value="wuhan" />
                <el-option label="荆州监利 (112.5°E, 30.1°N)" value="jingzhou" />
                <el-option label="襄阳襄州 (112.1°E, 31.9°N)" value="xiangyang" />
                <el-option label="自定义区域" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="service.hasOutputFormat">
            <el-form-item label="输出格式">
              <el-select v-model="params.outputFormat" style="width: 100%">
                <el-option label="GeoTIFF" value="geotiff" />
                <el-option label="NetCDF" value="netcdf" />
                <el-option label="HDF5" value="hdf5" />
                <el-option label="PNG (快视图)" value="png" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" size="large" :loading="running" @click="runService">
            {{ running ? '运行中…' : '▶ 开始计算' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 算法说明 -->
    <el-card style="margin-top: 16px">
      <template #header><span class="panel-title">算法说明</span></template>
      <div class="algo-desc">
        <p v-for="(line, i) in service.algorithm" :key="i">{{ line }}</p>
      </div>
    </el-card>

    <!-- 历史结果 -->
    <el-card style="margin-top: 16px" v-if="history.length > 0">
      <template #header><span class="panel-title">历史结果</span></template>
      <el-table :data="history" border stripe size="small">
        <el-table-column prop="id" label="任务ID" width="120" />
        <el-table-column prop="createdAt" label="执行时间" width="160" />
        <el-table-column prop="input" label="输入数据" min-width="180" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'info'" size="small">{{ row.status === 'completed' ? '完成' : '处理中' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default><el-button link type="primary" size="small">下载</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

const route = useRoute()

const serviceMap: Record<string, { title: string; desc: string; hasOutputFormat: boolean; algorithm: string[] }> = {
  calibration: {
    title: '辐射定标', desc: '将影像DN值转换为具有物理意义的辐射亮度值或表观反射率',
    hasOutputFormat: true,
    algorithm: ['采用绝对辐射定标系数法：L = Gain × DN + Offset', 'Gain/Offset 参数从影像元数据（MTL/XML）中自动提取', '支持多光谱各波段独立定标，输出辐射亮度 (W·m⁻²·sr⁻¹·μm⁻¹)'],
  },
  atmospheric: {
    title: '大气校正', desc: '消除大气分子和气溶胶的散射与吸收影响，获取地表真实反射率',
    hasOutputFormat: true,
    algorithm: ['基于 6SV (Second Simulation of a Satellite Signal in the Solar Spectrum) 辐射传输模型', '自动匹配 MODIS 气溶胶光学厚度 (AOD) 与臭氧数据', '支持逐像元大气校正，输出地表反射率 (Surface Reflectance)'],
  },
  geometric: {
    title: '几何校正', desc: '消除传感器内外方位元素引起的几何畸变，精确地理编码',
    hasOutputFormat: true,
    algorithm: ['基于有理多项式系数 (RPC) 的严格几何模型', 'DEM 辅助正射校正 (SRTM 30m / ALOS 30m)', '自动匹配 GCP 控制点，配准精度 ≤ 1 像素'],
  },
  ndvi: {
    title: 'NDVI 植被指数', desc: '归一化植被指数，定量评估植被覆盖度与生长状态',
    hasOutputFormat: true,
    algorithm: ['NDVI = (NIR - Red) / (NIR + Red)', '自动识别红光 (Red) 与近红外 (NIR) 波段', '输出 -1 至 1 浮点图像 + 分级渲染快视图'],
  },
  mosaic: {
    title: '影像镶嵌', desc: '多景影像无缝拼接，消除拼接线，生成大范围无缝影像',
    hasOutputFormat: true,
    algorithm: ['基于 SIFT/SURF 特征匹配的自动配准', '多尺度融合拼接线消除算法', '全局匀色处理，消除多景间辐射差异'],
  },
  fusion: {
    title: '影像融合', desc: '融合高分辨率全色波段与多光谱波段，生成高分辨率多光谱影像',
    hasOutputFormat: true,
    algorithm: ['Gram-Schmidt (GS) 正交化融合算法', '支持 NNDiffuse、PCA、Brovey 等多种融合方法', '融合后空间分辨率提升至全色波段级别'],
  },
}

const service = computed(() => serviceMap[route.params.serviceId as string] || serviceMap.calibration)

const params = reactive({
  dataSource: 'sentinel2',
  region: 'wuhan',
  outputFormat: 'geotiff',
})

const running = ref(false)
const history = ref<{ id: string; createdAt: string; input: string; status: string }[]>([])

function runService() {
  running.value = true
  setTimeout(() => {
    running.value = false
    const taskId = `T-${Date.now().toString(36).toUpperCase()}`
    history.value.unshift({ id: taskId, createdAt: new Date().toLocaleString(), input: params.dataSource, status: 'completed' })
    ElMessage.success(`${service.value.title} 计算完成！任务ID: ${taskId}`)
  }, 2500)
}
</script>

<style scoped>
.basic-service-page { flex: 1; padding: 20px; overflow-y: auto; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; }
.algo-desc p { font-size: 15px; color: #606266; line-height: 1.8; margin: 0 0 4px; padding-left: 12px; border-left: 3px solid #409EFF; }
</style>
