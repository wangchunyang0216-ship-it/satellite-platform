/** Cesium 影像图层配置 */
export interface CesiumLayerConfig {
  /** 唯一标识（用 taskId） */
  id: string
  /** 图层显示名称 */
  label: string
  /** 影像 PNG URL */
  imageUrl: string
  /** 地理边界 */
  west: number
  south: number
  east: number
  north: number
  /** 服务类型标识 */
  service: string
  /** 伪彩色类型 */
  colorMap: 'grayscale' | 'ndvi' | 'cloud'
  /** 透明度 0-1 */
  opacity: number
  /** 是否可见 */
  visible: boolean
}

/** 后端 /api/v1/compute/imagery/{taskId}/info 响应 */
export interface ImageryInfo {
  taskId: string
  service: string
  imageUrl: string
  west: number
  south: number
  east: number
  north: number
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  colorMap: 'grayscale' | 'ndvi' | 'cloud'
  stats: Record<string, unknown>
}
