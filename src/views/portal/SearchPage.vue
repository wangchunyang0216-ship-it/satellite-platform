<template>
  <div class="page search-page">
    <div class="search-layout">
      <!-- 左侧筛选面板 -->
      <aside class="filter-panel">
        <el-card>
          <template #header>
            <span class="panel-title">检索条件</span>
          </template>

          <el-form label-position="top" size="default">
            <el-form-item label="卫星平台">
              <el-select v-model="filters.platforms" placeholder="全部卫星" multiple style="width:100%">
                <el-option label="哨兵2号" value="sentinel-2" />
                <el-option label="Landsat-9" value="landsat-9" />
                <el-option label="高分6号" value="gf-6" />
                <el-option label="WorldView-4" value="worldview-4" />
                <el-option label="PlanetScope" value="planetscope" />
              </el-select>
            </el-form-item>

            <el-form-item label="传感器类型">
              <el-checkbox-group v-model="filters.sensorTypes">
                <el-checkbox value="optical" label="光学" />
                <el-checkbox value="sar" label="SAR" />
                <el-checkbox value="hyperspectral" label="高光谱" />
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width:100%"
              />
            </el-form-item>

            <el-form-item label="分辨率 (m)">
              <el-slider v-model="filters.resolution" range :min="0.1" :max="100" :step="0.1" />
              <span class="slider-label">{{ filters.resolution[0] }}m - {{ filters.resolution[1] }}m</span>
            </el-form-item>

            <el-form-item label="云覆盖率上限">
              <el-slider v-model="filters.cloudMax" :max="100" show-input />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" style="width:100%" @click="handleSearch" :loading="searching">
                {{ searching ? '检索中…' : '检 索' }}
              </el-button>
            </el-form-item>
            <el-form-item>
              <el-button style="width:100%" @click="resetFilters">重 置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </aside>

      <!-- 右侧地图 + 结果 -->
      <section class="map-area">
        <MapView ref="mapRef" @draw="onMapDraw" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import MapView from '@/components/MapView/MapView.vue'

const mapRef = ref<InstanceType<typeof MapView>>()
const searching = ref(false)
const drawBounds = ref<{ north: number; south: number; east: number; west: number } | null>(null)

const filters = reactive({
  platforms: [] as string[],
  sensorTypes: [] as string[],
  dateRange: null as [Date, Date] | null,
  resolution: [0.1, 100] as [number, number],
  cloudMax: 30,
})

function onMapDraw(bounds: { north: number; south: number; east: number; west: number }) {
  drawBounds.value = bounds
}

function handleSearch() {
  if (!drawBounds.value) {
    ElMessage.warning('请先在地图上框选检索范围')
    return
  }
  searching.value = true
  // 模拟检索
  setTimeout(() => {
    searching.value = false
    const count = Math.floor(Math.random() * 5) + 1
    mapRef.value?.setFootprintCount(count)
    ElMessage.success(`检索完成，找到 ${count} 景影像`)
  }, 800)
}

function resetFilters() {
  filters.platforms = []
  filters.sensorTypes = []
  filters.dateRange = null
  filters.resolution = [0.1, 100]
  filters.cloudMax = 30
  drawBounds.value = null
  mapRef.value?.setFootprintCount(0)
}
</script>

<style scoped>
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.search-layout {
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

.filter-panel {
  width: 310px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 12px;
  background: #fff;
  border-right: 1px solid #ebeef5;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.slider-label {
  font-size: 13px;
  color: #909399;
  margin-top: -8px;
  display: block;
}

.map-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
