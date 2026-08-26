import type { GeoJSONGeometry } from './common'

/** 卫星场景数据 */
export interface SatelliteScene {
  id: string
  satelliteName: string // 哨兵2号 / Landsat-9 / 高分6号
  sensorType: 'optical' | 'sar' | 'hyperspectral'
  acquisitionTime: string // ISO 8601
  resolution: number // 米/像素
  cloudCoverage: number // 0-100
  bands: string[]
  bbox: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
  thumbnailUrl: string
  footprint: GeoJSONGeometry
  fileSize: number // bytes
  fileFormat: 'GeoTIFF' | 'JPEG2000' | 'HDF5' | 'NetCDF'
  coordinateSystem: string // EPSG:4326
  md5: string
}

/** 植被指数 */
export interface VegetationIndex {
  sceneId: string
  fieldId: string
  date: string
  ndvi: number
  evi?: number
  ndwi?: number
  lai?: number
}

/** NDVI 时序数据点 */
export interface NDVITimePoint {
  date: string
  value: number
  fieldId: string
}

/** 作物健康报告 */
export interface CropHealthReport {
  id: string
  fieldId: string
  fieldName: string
  date: string
  ndviMean: number
  ndviMin: number
  ndviMax: number
  healthLevel: 'excellent' | 'good' | 'fair' | 'poor'
  trend: 'up' | 'down' | 'stable'
  recommendation: string
  area: number // 亩
  cropType: string
}

/** 产量预估 */
export interface YieldEstimation {
  id: string
  fieldId: string
  fieldName: string
  cropType: string
  estimatedYield: number // kg/亩
  confidenceInterval: [number, number]
  historicalYields: { year: number; value: number }[]
  factors: { name: string; contribution: number }[]
  spatialDistribution?: GeoJSONGeometry // 产量空间分布
}

/** 处方图 */
export interface PrescriptionMap {
  id: string
  fieldId: string
  fieldName: string
  type: 'fertilizer' | 'pesticide' | 'irrigation'
  date: string
  zones: {
    id: string
    rate: number // 施用量
    unit: string
    geometry: GeoJSONGeometry
  }[]
}

/** 灾害预警 */
export interface DisasterAlert {
  id: string
  fieldId?: string
  fieldName?: string
  type: 'drought' | 'pest' | 'flood' | 'lodging' | 'frost' | 'extreme_weather'
  level: 'red' | 'orange' | 'yellow' | 'blue'
  title: string
  description: string
  ndviAnomaly?: number
  suggestion: string
  time: string
  isRead: boolean
  affectedArea?: number // 亩
  geometry?: GeoJSONGeometry
}

/** 地图图层 */
export interface MapLayer {
  id: string
  name: string
  type: 'ndvi' | 'true_color' | 'false_color' | 'classification' | 'boundary' | 'alert'
  url?: string
  visible: boolean
  opacity: number
  zIndex: number
}

/** 物候期 */
export interface PhenologicalCheckpoint {
  cropType: string
  stage: string
  startDate: string
  endDate: string
  typicalNDVI: [number, number]
}
