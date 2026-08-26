/** 通用 API 响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页请求参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 分页响应 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 经纬度坐标 */
export interface LatLng {
  lat: number
  lng: number
}

/** GeoJSON 几何 */
export type GeoJSONGeometry = {
  type: 'Polygon' | 'MultiPolygon' | 'Point'
  coordinates: number[][][] | number[][] | number[]
}

/** 选项 */
export interface SelectOption {
  label: string
  value: string | number
}
