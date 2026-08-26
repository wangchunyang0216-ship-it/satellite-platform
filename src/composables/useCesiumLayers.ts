import { ref, computed } from 'vue'
import type { CesiumLayerConfig } from '@/types/cesium'
import type { AlgorithmTask } from '@/api/compute'

/** 管理 Cesium 3D 球体上的算法结果影像图层 */
export function useCesiumLayers() {
  const layers = ref<CesiumLayerConfig[]>([])
  const loading = ref(false)

  const activeLayers = computed(() => layers.value.filter((l) => l.visible))
  const layerCount = computed(() => layers.value.length)

  function buildConfig(task: AlgorithmTask): CesiumLayerConfig {
    const bounds = getBounds(task.service)
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    return {
      id: task.taskId,
      label: `${SERVICE_LABELS[task.service] || task.service}`,
      imageUrl: `${apiBase}/compute/preview/${task.taskId}_cesium.png`,
      west: bounds.west, south: bounds.south, east: bounds.east, north: bounds.north,
      service: task.service,
      colorMap: getColorMapType(task.service),
      opacity: 0.45,
      visible: true,
    }
  }

  function addTaskLayer(task: AlgorithmTask): CesiumLayerConfig | undefined {
    if (layers.value.find((l) => l.id === task.taskId)) return
    const config = buildConfig(task)
    layers.value.push(config)
    return config
  }

  function removeLayer(taskId: string) { layers.value = layers.value.filter((l) => l.id !== taskId) }
  function toggleLayer(taskId: string) { const l = layers.value.find((x) => x.id === taskId); if (l) l.visible = !l.visible }
  function setOpacity(taskId: string, o: number) { const l = layers.value.find((x) => x.id === taskId); if (l) l.opacity = Math.max(0, Math.min(1, o)) }
  function clearAll() { layers.value = [] }

  return { layers, loading, activeLayers, layerCount, addTaskLayer, removeLayer, toggleLayer, setOpacity, clearAll }
}

/** 模拟数据的固定地理范围（武汉附近 1°×1°） */
function getBounds(service: string) {
  const offsets: Record<string, { dx: number; dy: number }> = {
    calibration: { dx: -0.06, dy: 0.06 }, atmospheric: { dx: 0.06, dy: 0.06 },
    geometric: { dx: -0.06, dy: -0.06 }, ndvi: { dx: 0, dy: 0 },
    cloud_detection: { dx: 0.06, dy: -0.06 }, clip: { dx: -0.12, dy: 0.12 },
    spectral_index: { dx: 0.12, dy: 0 }, mosaic: { dx: -0.12, dy: -0.12 },
    fusion: { dx: 0.12, dy: -0.12 },
  }
  const o = offsets[service] || { dx: 0, dy: 0 }
  return { west: 114.0 + o.dx, south: 30.0 + o.dy, east: 115.0 + o.dx, north: 31.0 + o.dy }
}

function getColorMapType(service: string): 'grayscale' | 'ndvi' | 'cloud' {
  if (service === 'ndvi' || service === 'spectral_index') return 'ndvi'
  if (service === 'cloud_detection') return 'cloud'
  return 'grayscale'
}

const SERVICE_LABELS: Record<string, string> = {
  calibration: '辐射定标', atmospheric: '大气校正', geometric: '几何校正',
  ndvi: 'NDVI 植被指数', cloud_detection: '云检测', clip: '影像裁剪',
  spectral_index: '光谱指数', mosaic: '影像镶嵌', fusion: '影像融合',
}

export function getServiceColor(service: string): string {
  const c: Record<string, string> = {
    calibration: '#8B5CF6', atmospheric: '#3B82F6', geometric: '#06B6D4',
    ndvi: '#10B981', cloud_detection: '#F59E0B', clip: '#EF4444',
    spectral_index: '#84CC16', mosaic: '#EC4899', fusion: '#6366F1',
  }
  return c[service] || '#6B7280'
}
