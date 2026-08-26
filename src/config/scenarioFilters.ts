/**
 * 应用场景 → 后台筛选参数映射
 * 淘宝模式：前台类目导航与后台标准数据解耦，按用户业务场景找数据
 */
import {
  Cloudy, Aim, Monitor, MapLocation, Promotion, View,
  Connection, FolderOpened, Sunny, WindPower, Umbrella, Ship,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

// ═══════════════════════════════════════════
//  场景配置
// ═══════════════════════════════════════════

export interface ScenarioChild {
  key: string
  label: string
}

export interface ScenarioFilterPreset {
  /** 限定卫星平台 id 列表 */
  platforms?: string[]
  /** 限定传感器类型 */
  sensorTypes?: string[]
  /** 分辨率上限 (m) */
  resolutionMax?: number
  /** 分辨率下限 (m) */
  resolutionMin?: number
  /** 云量上限 (%) */
  cloudMax?: number
  /** 回溯天数（从今天往前推算日期范围） */
  timeRangeDays?: number
}

export interface ScenarioConfig {
  key: string
  label: string
  icon: Component
  children: ScenarioChild[]
  filterPreset: ScenarioFilterPreset
  /** hover fly-out 中显示的关联卫星 id */
  relatedSatellites: string[]
}

export const scenarioConfigs: ScenarioConfig[] = [
  {
    key: 'emergency',
    label: '应急救灾',
    icon: Aim,
    children: [
      { key: 'flood', label: '洪涝监测' },
      { key: 'earthquake', label: '地震评估' },
      { key: 'fire', label: '火灾监测' },
    ],
    filterPreset: {
      sensorTypes: ['optical', 'sar'],
      resolutionMax: 5,
      cloudMax: 20,
      timeRangeDays: 7,
    },
    relatedSatellites: ['gf6', 'gf7', 'sentinel2'],
  },
  {
    key: 'agriculture',
    label: '智慧农业',
    icon: Sunny,
    children: [
      { key: 'crop', label: '作物监测' },
      { key: 'yield', label: '产量预估' },
      { key: 'pest', label: '病虫害预警' },
      { key: 'soil', label: '土壤墒情' },
    ],
    filterPreset: {
      sensorTypes: ['multispectral', 'hyperspectral'],
      resolutionMax: 30,
      cloudMax: 10,
      timeRangeDays: 30,
    },
    relatedSatellites: ['sentinel2', 'landsat9', 'gf6'],
  },
  {
    key: 'meteorology',
    label: '气象监测',
    icon: Cloudy,
    children: [
      { key: 'typhoon', label: '台风监测' },
      { key: 'rainstorm', label: '暴雨洪涝' },
      { key: 'sandstorm', label: '沙尘暴监测' },
      { key: 'haze', label: '雾霾监测' },
    ],
    filterPreset: {
      sensorTypes: ['optical', 'hyperspectral'],
      resolutionMax: 250,
      cloudMax: 50,
      platforms: ['fy4a', 'fy3e'],
    },
    relatedSatellites: ['fy4a', 'fy3e'],
  },
  {
    key: 'urban',
    label: '城市规划',
    icon: Monitor,
    children: [
      { key: 'landuse', label: '土地利用' },
      { key: 'illegal', label: '违建监测' },
      { key: 'traffic', label: '交通规划' },
      { key: 'heatisland', label: '热岛效应' },
    ],
    filterPreset: {
      sensorTypes: ['optical'],
      resolutionMax: 2,
      cloudMax: 15,
    },
    relatedSatellites: ['gf6', 'gf7'],
  },
  {
    key: 'ocean',
    label: '海洋监测',
    icon: Ship,
    children: [
      { key: 'redtide', label: '赤潮监测' },
      { key: 'oilspill', label: '溢油监测' },
      { key: 'seaice', label: '海冰监测' },
      { key: 'vessel', label: '船舶识别' },
    ],
    filterPreset: {
      sensorTypes: ['sar', 'optical'],
      resolutionMax: 50,
      cloudMax: 30,
      timeRangeDays: 3,
    },
    relatedSatellites: ['sentinel2', 'landsat9'],
  },
  {
    key: 'ecology',
    label: '生态环保',
    icon: FolderOpened,
    children: [
      { key: 'forest', label: '森林覆盖' },
      { key: 'wetland', label: '湿地监测' },
      { key: 'desert', label: '荒漠化' },
      { key: 'carbon', label: '碳汇估算' },
    ],
    filterPreset: {
      sensorTypes: ['multispectral', 'hyperspectral'],
      resolutionMax: 30,
      cloudMax: 20,
    },
    relatedSatellites: ['sentinel2', 'landsat9', 'gf6'],
  },
]

// ═══════════════════════════════════════════
//  卫星 → 传感器 → 分辨率 级联关系
// ═══════════════════════════════════════════

export interface SensorOption {
  value: string
  label: string
  resolutionRange: [number, number] // [min, max] in meters
}

export const satelliteSensorMap: Record<string, SensorOption[]> = {
  fy4a: [
    { value: 'multispectral_low', label: '多光谱成像仪', resolutionRange: [250, 1000] },
  ],
  fy3e: [
    { value: 'microwave', label: '微波探测仪', resolutionRange: [250, 500] },
    { value: 'hyperspectral_high', label: '高光谱探测仪', resolutionRange: [250, 250] },
  ],
  gf6: [
    { value: 'multispectral_pms', label: '多光谱 PMS', resolutionRange: [2, 8] },
  ],
  gf7: [
    { value: 'stereo', label: '立体测绘仪', resolutionRange: [0.5, 2] },
  ],
  sentinel2: [
    { value: 'msi', label: 'MSI 多光谱', resolutionRange: [10, 60] },
  ],
  landsat9: [
    { value: 'oli2', label: 'OLI-2 多光谱', resolutionRange: [15, 100] },
    { value: 'tirs2', label: 'TIRS-2 热红外', resolutionRange: [30, 100] },
  ],
}

// ═══════════════════════════════════════════
//  搜索建议源
// ═══════════════════════════════════════════

/** 从 demo 数据中收集所有可搜索的词汇 */
export function getSuggestionSources(satNames: string[], locations: string[]): string[] {
  const sensors = [
    '光学', 'SAR 雷达', '高光谱', '多光谱', 'MSI', 'OLI-2', 'TIRS-2',
    '多光谱成像仪', '立体测绘仪', '微波探测仪', '高光谱探测仪',
    '多光谱 PMS', 'MSI 多光谱', 'OLI-2 多光谱', 'TIRS-2 热红外',
  ]
  return [...new Set([...satNames, ...sensors, ...locations])]
}

// ═══════════════════════════════════════════
//  传感器类型映射（前端标签 → demo 数据字段）
// ═══════════════════════════════════════════

export const sensorTypeMapping: Record<string, string[]> = {
  optical: ['多光谱', '立体测绘', 'OLI-2', 'MSI'],
  sar: ['SAR'],
  hyperspectral: ['高光谱', '微波温度计', '微波/高光谱'],
  multispectral: ['多光谱', 'MSI', 'OLI-2'],
}
