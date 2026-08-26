<template>
  <div class="r3v">
    <!-- 左侧面板：任务列表 -->
    <aside class="r3v-panel">
      <div class="panel-header">
        <h3>3D 可视化</h3>
        <p>已完成 {{ completedTasks.length }} 个任务，已加载 {{ layers.layerCount }} 个图层</p>
      </div>

      <div class="panel-actions">
        <el-button size="small" type="primary" @click="loadAll" :loading="layers.loading.value">
          加载全部
        </el-button>
        <el-button size="small" @click="clearAll">清空图层</el-button>
        <el-button size="small" @click="orbitGlobe" :disabled="layers.layerCount === 0">
          环绕飞行
        </el-button>
      </div>

      <!-- 任务列表 -->
      <div class="task-list" v-if="completedTasks.length > 0">
        <div
          v-for="task in completedTasks"
          :key="task.taskId"
          class="task-item"
          :class="{ active: isLayerLoaded(task.taskId) }"
        >
          <div class="task-item-row">
            <span class="service-color" :style="{ background: getServiceColor(task.service) }"></span>
            <div class="task-info" @click="toggleTask(task)">
              <div class="task-label">{{ serviceLabel(task.service) }}</div>
              <div class="task-id">{{ task.taskId }}</div>
            </div>
            <el-switch
              v-if="isLayerLoaded(task.taskId)"
              v-model="layerVisibility[task.taskId]"
              size="small"
              @change="(v: boolean) => onVisibilityChange(task.taskId, v)"
            />
            <el-button
              v-else
              size="small"
              type="primary"
              :loading="loadingTasks.has(task.taskId)"
              @click.stop="toggleTask(task)"
            >
              加载
            </el-button>
          </div>

          <!-- 透明度滑块（仅加载后显示） -->
          <div v-if="isLayerLoaded(task.taskId)" class="opacity-row">
            <span class="opacity-label">透明度</span>
            <el-slider
              v-model="layerOpacity[task.taskId]"
              :min="0.1" :max="1" :step="0.05"
              size="small"
              style="flex:1"
              @input="(v: number) => onOpacityChange(task.taskId, v)"
            />
            <el-button link size="small" type="primary" @click="downloadTif(task.taskId)">
              下载 TIF
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-icon :size="40" color="#D1D5DB"><Picture /></el-icon>
        <p>暂无已完成的任务</p>
        <span>去 <router-link to="/console/computing/basic">算法服务</router-link> 提交计算任务</span>
      </div>
    </aside>

    <!-- 右侧：Cesium 3D 球体 -->
    <main class="r3v-globe">
      <CesiumViewer ref="cesiumRef" @ready="onCesiumReady" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import CesiumViewer from '@/components/MapView/CesiumViewer.vue'
import { useCesiumLayers, getServiceColor } from '@/composables/useCesiumLayers'
import { computeApi, type AlgorithmTask } from '@/api/compute'

const cesiumRef = ref<InstanceType<typeof CesiumViewer>>()
const layers = useCesiumLayers()
const completedTasks = ref<AlgorithmTask[]>([])
const loadingTasks = reactive(new Set<string>())
const layerVisibility = reactive<Record<string, boolean>>({})
const layerOpacity = reactive<Record<string, number>>({})

// ── 任务管理 ──

onMounted(async () => {
  await loadTasks()
})

async function loadTasks() {
  try {
    const res = await computeApi.getTasks(1, 100)
    const list = (res.data as any).data?.list || (res.data as any).list || []
    completedTasks.value = (list as AlgorithmTask[]).filter(
      (t: AlgorithmTask) => t.status === 'completed'
    )
  } catch {
    // 后端未启动时静默
  }
}

function isLayerLoaded(taskId: string): boolean {
  return layers.layers.value.some((l) => l.id === taskId)
}

function toggleTask(task: AlgorithmTask) {
  if (isLayerLoaded(task.taskId)) {
    cesiumRef.value?.removeLayer(task.taskId)
    layers.removeLayer(task.taskId)
    delete layerVisibility[task.taskId]
    delete layerOpacity[task.taskId]
  } else {
    loadTaskLayer(task)
  }
}

function loadTaskLayer(task: AlgorithmTask) {
  loadingTasks.add(task.taskId)
  try {
    const config = layers.addTaskLayer(task)
    if (config && cesiumRef.value) {
      cesiumRef.value.addLayer(config)
      layerVisibility[task.taskId] = true
      layerOpacity[task.taskId] = config.opacity
      const centerLat = (config.south + config.north) / 2
      const centerLng = (config.west + config.east) / 2
      cesiumRef.value.flyTo(centerLat, centerLng, 30000)
    }
  } catch {
    ElMessage.error(`加载图层失败: ${task.taskId}`)
  } finally {
    loadingTasks.delete(task.taskId)
  }
}

function loadAll() {
  for (const task of completedTasks.value) {
    if (!isLayerLoaded(task.taskId)) {
      loadTaskLayer(task)
    }
  }
}

function clearAll() {
  cesiumRef.value?.removeAllLayers()
  layers.clearAll()
  Object.keys(layerVisibility).forEach((k) => delete layerVisibility[k])
  Object.keys(layerOpacity).forEach((k) => delete layerOpacity[k])
}

// ── 图层控制 ──

function onVisibilityChange(taskId: string, visible: boolean) {
  cesiumRef.value?.setLayerVisible(taskId, visible)
}

function onOpacityChange(taskId: string, opacity: number) {
  cesiumRef.value?.setLayerOpacity(taskId, opacity)
}

function downloadTif(taskId: string) {
  const url = computeApi.getDownloadUrl(taskId)
  const token = localStorage.getItem('token')
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => {
      if (!r.ok) throw new Error('下载失败')
      return r.blob()
    })
    .then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${taskId}_result.tif`
      a.click()
      URL.revokeObjectURL(a.href)
    })
    .catch(() => ElMessage.error('下载失败'))
}

function serviceLabel(service: string): string {
  const labels: Record<string, string> = {
    calibration: '辐射定标',
    atmospheric: '大气校正',
    geometric: '几何校正',
    ndvi: 'NDVI 植被指数',
    cloud_detection: '云检测',
    clip: '影像裁剪',
    spectral_index: '光谱指数',
    mosaic: '影像镶嵌',
    fusion: '影像融合',
  }
  return labels[service] || service
}

function orbitGlobe() {
  // 在武汉区域上空环绕飞行
  cesiumRef.value?.orbitAround(30.2, 114.721, 50000, 20)
}

function onCesiumReady(_viewer: unknown) {
  // Cesium 球体就绪回调
}
</script>

<style scoped>
.r3v {
  display: flex;
  height: calc(100vh - 50px - 48px); /* 减去顶栏和 padding */
  gap: 0;
}

/* ── 左侧面板 ── */
.r3v-panel {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.panel-header {
  padding: 16px 16px 8px;
}
.panel-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 4px;
}
.panel-header p {
  font-size: 14px;
  color: #9CA3AF;
  margin: 0;
}
.panel-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  border-bottom: 1px solid #F3F4F6;
}

/* ── 任务列表 ── */
.task-list {
  flex: 1;
  overflow-y: auto;
}
.task-item {
  padding: 12px 16px;
  border-bottom: 1px solid #F3F4F6;
  transition: background 0.12s;
}
.task-item:hover {
  background: #F9FAFB;
}
.task-item.active {
  background: rgba(37, 99, 235, 0.04);
}
.task-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.service-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.task-info {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}
.task-label {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}
.task-id {
  font-size: 13px;
  color: #9CA3AF;
  font-family: monospace;
}
.opacity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-left: 20px;
}
.opacity-label {
  font-size: 13px;
  color: #9CA3AF;
  flex-shrink: 0;
}

/* ── 空状态 ── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}
.empty-state p {
  font-size: 16px;
  color: #9CA3AF;
  margin: 12px 0 4px;
}
.empty-state span {
  font-size: 14px;
  color: #9CA3AF;
}
.empty-state a {
  color: #2563EB;
  text-decoration: none;
}

/* ── 右侧球体 ── */
.r3v-globe {
  flex: 1;
  min-width: 0;
  position: relative;
}
</style>
