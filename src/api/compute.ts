import request from './request'
import type { ApiResponse, PaginatedData } from '@/types/common'
import type {
  ComputeTask as LegacyComputeTask, AIModel, ComputeResult,
  MonitorParams, DetectParams, ChangeDetectParams, YieldEstimateParams,
} from '@/types/compute'

// ====== 新版：算法服务任务（对接后端 /api/v1/compute） ======

export interface AlgorithmTask {
  id: number
  taskId: string
  userId: number
  service: string
  params: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  outputPath: string
  stats: Record<string, unknown>
  errorMessage: string
  createdAt: string
  completedAt: string | null
  elapsedSec: number
}

export interface ComputeRunParams {
  service: string
  params: Record<string, unknown>
}

export interface ServiceInfo {
  name: string
  desc: string
  category: string
}

export const computeApi = {
  // ─── 新版：统一算法服务 ───

  /** 提交算法计算任务 */
  run(params: ComputeRunParams) {
    return request.post<unknown, ApiResponse<{ taskId: string; service: string; status: string; message: string }>>('/compute/run', params)
  },

  /** 获取算法任务列表 */
  getTasks(page = 1, pageSize = 20) {
    return request.get<unknown, ApiResponse<PaginatedData<AlgorithmTask>>>('/compute/tasks', { params: { page, pageSize } })
  },

  /** 获取算法任务详情 */
  getTask(taskId: string) {
    return request.get<unknown, ApiResponse<AlgorithmTask>>(`/compute/task/${taskId}`)
  },

  /** 获取可用算法服务列表 */
  getServices() {
    return request.get<unknown, ApiResponse<Record<string, ServiceInfo>>>('/compute/services')
  },

  /** 下载算法结果文件 */
  getDownloadUrl(taskId: string) {
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    return `${base}/compute/download/${taskId}`
  },

  /** 获取 Cesium 3D 影像渲染 PNG 的 URL */
  getImageryUrl(taskId: string) {
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    return `${base}/compute/imagery/${taskId}`
  },

  /** 获取 Cesium 3D 影像元数据（边界、服务类型等） */
  getImageryInfo(taskId: string) {
    return request.get<unknown, ApiResponse<import('@/types/cesium').ImageryInfo>>(`/compute/imagery/${taskId}/info`)
  },

  /** 删除单个任务记录 */
  deleteTask(taskId: string) {
    return request.delete<unknown, ApiResponse>(`/compute/task/${taskId}`)
  },

  /** 清空所有任务记录 */
  clearTasks() {
    return request.delete<unknown, ApiResponse>('/compute/tasks')
  },

  // ─── 旧版兼容（智能模型等）───

  submitMonitor(params: MonitorParams) {
    return request.post<unknown, { data: LegacyComputeTask }>('/compute/monitor', params)
  },
  submitDetect(params: DetectParams) {
    return request.post<unknown, { data: LegacyComputeTask }>('/compute/detect', params)
  },
  submitChangeDetect(params: ChangeDetectParams) {
    return request.post<unknown, { data: LegacyComputeTask }>('/compute/change-detect', params)
  },
  submitYieldEstimate(params: YieldEstimateParams) {
    return request.post<unknown, { data: LegacyComputeTask }>('/compute/yield-estimate', params)
  },
  getTaskStatus(taskId: string) {
    return request.get<unknown, { data: LegacyComputeTask }>(`/compute/task/${taskId}`)
  },
  cancelTask(taskId: string) {
    return request.delete(`/compute/task/${taskId}`)
  },
  getModels() {
    return request.get<unknown, { data: AIModel[] }>('/compute/models')
  },
}
