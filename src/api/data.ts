import request from './request'
import type { SatelliteScene } from '@/types/satellite'
import type { PaginatedData } from '@/types/common'

export interface SearchParams {
  bbox?: [number, number, number, number]
  polygon?: number[][]
  startDate?: string
  endDate?: string
  sensorTypes?: string[]
  resolutionMin?: number
  resolutionMax?: number
  cloudMax?: number
  platforms?: string[]
  page?: number
  pageSize?: number
}

export const dataApi = {
  /** 空间范围 + 条件组合检索 */
  search(params: SearchParams) {
    return request.post<unknown, { data: PaginatedData<SatelliteScene> }>('/data/search', params)
  },
  /** 获取单景影像详情 */
  getById(id: string) {
    return request.get<unknown, { data: SatelliteScene }>(`/data/${id}`)
  },
  /** 获取缩略图 */
  getThumbnail(id: string) {
    return request.get(`/data/thumbnail/${id}`, { responseType: 'blob' })
  },
}
