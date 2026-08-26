import request from './request'

export interface DataSource {
  id: string
  name: string
  protocolType: string
  apiUrl: string
  authMethod: string
  status: 'active' | 'inactive' | 'error'
  lastSyncAt?: string
  syncLog?: { time: string; status: string; message: string }[]
}

export interface PipelineStatus {
  todayInbound: number
  todaySuccess: number
  todayFailed: number
  queueBacklog: number
  hourlyTrend: { hour: string; count: number }[]
  statusRatio: { name: string; value: number }[]
}

export const adminApi = {
  // 数据源管理
  listProviders() {
    return request.get<unknown, { data: DataSource[] }>('/admin/providers')
  },
  createProvider(data: Partial<DataSource>) {
    return request.post<unknown, { data: DataSource }>('/admin/providers', data)
  },
  updateProvider(id: string, data: Partial<DataSource>) {
    return request.put<unknown, { data: DataSource }>(`/admin/providers/${id}`, data)
  },
  deleteProvider(id: string) {
    return request.delete(`/admin/providers/${id}`)
  },

  // 流水线监控
  getPipelineStatus() {
    return request.get<unknown, { data: PipelineStatus }>('/admin/pipeline/status')
  },

  // 用户管理
  listUsers(params?: { page?: number; pageSize?: number }) {
    return request.get('/admin/users', { params })
  },
  updateUser(id: string, data: Record<string, unknown>) {
    return request.put(`/admin/users/${id}`, data)
  },

  // 订单管理
  listOrders(params?: { status?: string; page?: number; pageSize?: number }) {
    return request.get('/admin/orders', { params })
  },

  // 统计
  getOverviewStats() {
    return request.get('/admin/stats/overview')
  },
  getTrendStats() {
    return request.get('/admin/stats/trend')
  },
}
