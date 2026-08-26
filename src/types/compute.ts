/** 计算任务类型 */
export type ComputeTaskType =
  | 'monitor'       // 遥感监测
  | 'detect'        // 智能识别
  | 'change_detect' // 变化检测
  | 'yield_estimate' // 产量预估
  | 'prescription'  // 处方生成

/** 计算任务状态 */
export type ComputeTaskStatus =
  | 'queued'      // 排队中
  | 'processing'  // 处理中
  | 'completed'   // 已完成
  | 'failed'      // 失败
  | 'cancelled'   // 已取消

/** AI 模型信息 */
export interface AIModel {
  id: string
  name: string
  version: string
  type: ComputeTaskType
  description: string
  accuracy: number
  parameters?: Record<string, unknown>
}

/** 计算任务 */
export interface ComputeTask {
  id: string
  name: string
  type: ComputeTaskType
  status: ComputeTaskStatus
  progress: number // 0-100
  currentStage: string
  estimatedTimeRemaining?: number // 秒
  inputParams: Record<string, unknown>
  result?: ComputeResult
  errorLog?: string
  modelId: string
  modelVersion: string
  createdAt: string
  completedAt?: string
}

/** 计算结果 */
export interface ComputeResult {
  taskId: string
  type: ComputeTaskType
  geojson?: Record<string, unknown>  // 地图叠加数据
  statistics?: ComputeStatistics
  imageUrls?: string[]
  reportUrl?: string
  charts?: ComputeChartData[]
}

/** 计算统计 */
export interface ComputeStatistics {
  mean?: number
  min?: number
  max?: number
  stdDev?: number
  totalArea?: number
  classifiedAreas?: { label: string; area: number; color: string }[]
  confidence?: number
}

/** 图表数据 */
export interface ComputeChartData {
  type: 'line' | 'bar' | 'pie'
  title: string
  labels: string[]
  datasets: { label: string; data: number[]; color?: string }[]
}

/** 监测参数 */
export interface MonitorParams {
  fieldIds: string[]
  startDate?: string
  endDate?: string
  indicators: ('ndvi' | 'evi' | 'ndwi' | 'lai')[]
}

/** 识别参数 */
export interface DetectParams {
  sceneIds: string[]
  detectType: 'crop_classify' | 'pest_disease' | 'lodging' | 'frost' | 'flood'
  modelId: string
  confidenceThreshold?: number
  nmsThreshold?: number
  minArea?: number
}

/** 变化检测参数 */
export interface ChangeDetectParams {
  preSceneId: string
  postSceneId: string
  changeTypes: ('building' | 'vegetation_loss' | 'water' | 'road' | 'custom')[]
  sensitivity?: number
}

/** 产量预估参数 */
export interface YieldEstimateParams {
  fieldId: string
  cropType: string
  plantingDate: string
  irrigation?: string
  fertilization?: string
  modelId: string
}
