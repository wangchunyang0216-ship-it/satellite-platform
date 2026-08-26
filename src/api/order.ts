import request from './request'

export interface OrderInfo {
  id: string
  orderNo: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  dataCount: number
  amount: number
  deliveryMethod: 'download' | 'ftp' | 's3'
  createdAt: string
  items?: { sceneName: string; sceneId: string }[]
  downloadUrl?: string
}

export const orderApi = {
  create(params: { sceneIds: string[]; deliveryMethod: string; deliveryConfig?: Record<string, unknown> }) {
    return request.post<unknown, { data: OrderInfo }>('/orders', params)
  },
  list(params?: { status?: string; page?: number; pageSize?: number }) {
    return request.get<unknown, { data: { list: OrderInfo[]; total: number } }>('/orders', { params })
  },
  getById(id: string) {
    return request.get<unknown, { data: OrderInfo }>(`/orders/${id}`)
  },
  download(id: string) {
    return request.post<unknown, { data: { url: string } }>(`/orders/${id}/download`)
  },
}
