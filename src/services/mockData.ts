/** 遥感卫星数据服务平台 — 演示数据集 */

// ═══════════════════════════════════════
// Dashboard — 核心指标
// ═══════════════════════════════════════

export const dashboardMetrics = {
  totalScenes: 156800,
  coverageArea: 8520,        // 万 km²
  customerCount: 486,
  dailyApiCalls: 2891,
}

// ═══════════════════════════════════════
// Dashboard — 全球飞线 (起点 → 终点)
// ═══════════════════════════════════════

export interface FlyLine {
  fromName: string
  fromLat: number
  fromLng: number
  toName: string
  toLat: number
  toLng: number
  value: number
}

export const flyLines: FlyLine[] = [
  { fromName: '北京地面站', fromLat: 40.0, fromLng: 116.4, toName: '哨兵2号', toLat: 48.8, toLng: 2.3, value: 320 },
  { fromName: '北京地面站', fromLat: 40.0, fromLng: 116.4, toName: 'Landsat-9', toLat: 38.9, toLng: -77.0, value: 280 },
  { fromName: '北京地面站', fromLat: 40.0, fromLng: 116.4, toName: '高分6号', toLat: 35.0, toLng: 105.0, value: 450 },
  { fromName: '喀什地面站', fromLat: 39.5, fromLng: 76.0, toName: '哨兵2号', toLat: 48.8, toLng: 2.3, value: 210 },
  { fromName: '三亚地面站', fromLat: 18.2, fromLng: 109.5, toName: '高分6号', toLat: 35.0, toLng: 105.0, value: 180 },
  { fromName: '武汉数据中心', fromLat: 30.5, fromLng: 114.3, toName: '哨兵2号', toLat: 48.8, toLng: 2.3, value: 150 },
  { fromName: '武汉数据中心', fromLat: 30.5, fromLng: 114.3, toName: 'Landsat-9', toLat: 38.9, toLng: -77.0, value: 130 },
]

// ═══════════════════════════════════════
// Dashboard — 24h 处理量趋势 (每小时)
// ═══════════════════════════════════════

export function generate24HourData() {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const inbound = hours.map(() => Math.floor(Math.random() * 80 + 20))
  const processed = inbound.map((v) => Math.floor(v * (0.85 + Math.random() * 0.1)))
  return { hours, inbound, processed }
}

// ═══════════════════════════════════════
// Dashboard — 7天趋势
// ═══════════════════════════════════════

export const sevenDayTrend = {
  dates: ['07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13'],
  access: [320, 450, 380, 520, 480, 610, 560],
  search: [1200, 1580, 1350, 1890, 1720, 2100, 1950],
}

// ═══════════════════════════════════════
// Dashboard — 数据源接入分布 (桑基图数据)
// ═══════════════════════════════════════

export const sankeyData = {
  nodes: [
    { name: '哨兵2号' }, { name: 'Landsat-9' }, { name: '高分6号' },
    { name: 'WorldView-4' }, { name: 'PlanetScope' },
    { name: '原始影像' }, { name: '几何校正' }, { name: '辐射定标' },
    { name: '大气校正' }, { name: '数据入库' },
  ],
  links: [
    { source: '哨兵2号', target: '原始影像', value: 420 },
    { source: 'Landsat-9', target: '原始影像', value: 310 },
    { source: '高分6号', target: '原始影像', value: 380 },
    { source: 'WorldView-4', target: '原始影像', value: 180 },
    { source: 'PlanetScope', target: '原始影像', value: 260 },
    { source: '原始影像', target: '几何校正', value: 1550 },
    { source: '几何校正', target: '辐射定标', value: 1480 },
    { source: '辐射定标', target: '大气校正', value: 1420 },
    { source: '大气校正', target: '数据入库', value: 1380 },
  ],
}

// ═══════════════════════════════════════
// Dashboard — 实时滚动播报
// ═══════════════════════════════════════

export const tickerNews: string[] = [
  '哨兵2号 — 2026-07-13 14:32 武汉阳逻 云量3%',
  '高分6号 — 2026-07-13 14:28 荆州监利 云量8%',
  'Landsat-9 — 2026-07-13 14:15 黄冈团风 云量12%',
  '哨兵2号 — 2026-07-13 13:50 襄阳襄州 云量1%',
  'WorldView-4 — 2026-07-13 13:22 宜昌夷陵 云量5%',
  '高分6号 — 2026-07-13 12:58 孝感汉川 云量15%',
  'PlanetScope — 2026-07-13 12:35 荆门钟祥 云量7%',
  '哨兵2号 — 2026-07-13 12:10 天门多宝 云量2%',
  'Landsat-9 — 2026-07-13 11:45 潜江园林 云量9%',
  '高分6号 — 2026-07-13 11:20 仙桃彭场 云量4%',
]

// ═══════════════════════════════════════
// 管理后台 — 数据源
// ═══════════════════════════════════════

export interface DemoDataSource {
  id: string
  name: string
  protocolType: string
  apiUrl: string
  authMethod: string
  status: 'active' | 'inactive' | 'error'
  lastSyncAt: string
  syncLog: { time: string; status: string; message: string }[]
}

export const demoProviders: DemoDataSource[] = [
  {
    id: '1', name: '哨兵2号 ESA Hub', protocolType: 'OData REST',
    apiUrl: 'https://scihub.copernicus.eu/dhus', authMethod: 'Basic Auth',
    status: 'active', lastSyncAt: '2026-07-13 14:32:10',
    syncLog: [
      { time: '14:32', status: 'success', message: '同步完成，新增 23 景' },
      { time: '08:00', status: 'success', message: '同步完成，新增 18 景' },
    ],
  },
  {
    id: '2', name: 'Landsat-9 USGS', protocolType: 'STAC API',
    apiUrl: 'https://landsatlook.usgs.gov/api', authMethod: 'API Key',
    status: 'active', lastSyncAt: '2026-07-13 14:15:30',
    syncLog: [
      { time: '14:15', status: 'success', message: '同步完成，新增 15 景' },
    ],
  },
  {
    id: '3', name: '高分6号 CRESDA', protocolType: 'FTP Pull',
    apiUrl: 'ftp://data.cresda.com/GF6', authMethod: 'Key Pair',
    status: 'active', lastSyncAt: '2026-07-13 14:28:45',
    syncLog: [
      { time: '14:28', status: 'success', message: '同步完成，新增 31 景' },
    ],
  },
  {
    id: '4', name: 'WorldView-4 Maxar', protocolType: 'REST API',
    apiUrl: 'https://api.maxar.com/ordering', authMethod: 'OAuth 2.0',
    status: 'inactive', lastSyncAt: '2026-07-12 09:00:00',
    syncLog: [
      { time: '09:00', status: 'error', message: '认证令牌过期，需重新授权' },
    ],
  },
  {
    id: '5', name: 'PlanetScope Planet Labs', protocolType: 'REST API',
    apiUrl: 'https://api.planet.com/data/v1', authMethod: 'API Key',
    status: 'active', lastSyncAt: '2026-07-13 13:50:20',
    syncLog: [
      { time: '13:50', status: 'success', message: '同步完成，新增 56 景' },
    ],
  },
]

// ═══════════════════════════════════════
// 管理后台 — 用户
// ═══════════════════════════════════════

export interface DemoUser {
  id: string
  username: string
  company: string
  role: 'admin' | 'user'
  quotaUsed: number
  quotaTotal: number
  status: 'active' | 'disabled'
}

export const demoUsers: DemoUser[] = [
  { id: '1', username: 'admin', company: '遥感数据服务平台', role: 'admin', quotaUsed: 0, quotaTotal: 1000, status: 'active' },
  { id: '2', username: 'demo', company: '测试农业公司', role: 'user', quotaUsed: 12, quotaTotal: 100, status: 'active' },
  { id: '3', username: 'wuhan_agri', company: '武汉农业科技', role: 'user', quotaUsed: 45, quotaTotal: 200, status: 'active' },
  { id: '4', username: 'hubei_farm', company: '湖北农垦集团', role: 'user', quotaUsed: 180, quotaTotal: 500, status: 'active' },
  { id: '5', username: 'testuser', company: 'test', role: 'user', quotaUsed: 0, quotaTotal: 100, status: 'active' },
]

// ═══════════════════════════════════════
// 管理后台 — 订单
// ═══════════════════════════════════════

export interface DemoOrder {
  id: string
  orderNo: string
  username: string
  dataCount: number
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  deliveryMethod: string
}

export const demoOrders: DemoOrder[] = [
  { id: '1', orderNo: 'ORD-20260713-001', username: 'wuhan_agri', dataCount: 5, amount: 250, status: 'completed', createdAt: '2026-07-13 10:30', deliveryMethod: 'S3转存' },
  { id: '2', orderNo: 'ORD-20260713-002', username: 'hubei_farm', dataCount: 12, amount: 600, status: 'completed', createdAt: '2026-07-13 11:15', deliveryMethod: '下载链接' },
  { id: '3', orderNo: 'ORD-20260713-003', username: 'demo', dataCount: 3, amount: 150, status: 'pending', createdAt: '2026-07-13 13:20', deliveryMethod: 'FTP推送' },
  { id: '4', orderNo: 'ORD-20260712-001', username: 'hubei_farm', dataCount: 8, amount: 400, status: 'completed', createdAt: '2026-07-12 15:40', deliveryMethod: 'S3转存' },
  { id: '5', orderNo: 'ORD-20260712-002', username: 'wuhan_agri', dataCount: 2, amount: 100, status: 'cancelled', createdAt: '2026-07-12 16:00', deliveryMethod: '下载链接' },
  { id: '6', orderNo: 'ORD-20260711-001', username: 'hubei_farm', dataCount: 20, amount: 1000, status: 'completed', createdAt: '2026-07-11 09:00', deliveryMethod: 'S3转存' },
]

// ═══════════════════════════════════════
// 地图检索 — 卫星场景
// ═══════════════════════════════════════

export interface DemoScene {
  id: string
  satelliteName: string
  sensorType: string
  acquisitionTime: string
  resolution: number
  cloudCoverage: number
  thumbnailUrl: string
  bbox: [number, number, number, number]
  fileSize: number
}

export const demoScenes: DemoScene[] = [
  {
    id: 'S2A_20260713_Wuhan',
    satelliteName: '哨兵2号', sensorType: '光学',
    acquisitionTime: '2026-07-13 10:32:00', resolution: 10,
    cloudCoverage: 3.2, thumbnailUrl: '',
    bbox: [114.5, 30.4, 114.9, 30.7], fileSize: 856_000_000,
  },
  {
    id: 'LC9_20260713_Huanggang',
    satelliteName: 'Landsat-9', sensorType: '光学',
    acquisitionTime: '2026-07-13 09:15:00', resolution: 30,
    cloudCoverage: 12.5, thumbnailUrl: '',
    bbox: [114.8, 30.4, 115.2, 30.7], fileSize: 520_000_000,
  },
  {
    id: 'GF6_20260713_Jingzhou',
    satelliteName: '高分6号', sensorType: '光学',
    acquisitionTime: '2026-07-13 11:28:00', resolution: 2,
    cloudCoverage: 8.1, thumbnailUrl: '',
    bbox: [112.0, 30.1, 112.5, 30.4], fileSize: 2_100_000_000,
  },
  {
    id: 'S2A_20260712_Yichang',
    satelliteName: '哨兵2号', sensorType: '光学',
    acquisitionTime: '2026-07-12 10:50:00', resolution: 10,
    cloudCoverage: 1.8, thumbnailUrl: '',
    bbox: [111.0, 30.5, 111.5, 30.8], fileSize: 840_000_000,
  },
  {
    id: 'WV4_20260712_Xiangyang',
    satelliteName: 'WorldView-4', sensorType: '光学',
    acquisitionTime: '2026-07-12 13:22:00', resolution: 0.31,
    cloudCoverage: 5.0, thumbnailUrl: '',
    bbox: [112.0, 31.8, 112.3, 32.1], fileSize: 3_500_000_000,
  },
]

// ═══════════════════════════════════════
// 计算服务 — 遥感监测结果
// ═══════════════════════════════════════

/** 生成热力图网格数据 (NDVI 空间分布) */
export function generateHeatmapGrid(fieldId: string) {
  const rows = 10
  const cols = 12
  const data: [number, number, number][] = []
  // 模拟地块的 NDVI 分布：中心高、边缘低，加一些随机噪声
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2) / Math.sqrt(cx ** 2 + cy ** 2)
      let ndvi = 0.85 - dist * 0.55 + (Math.random() - 0.5) * 0.18
      ndvi = Math.round(Math.max(0.08, Math.min(0.92, ndvi)) * 1000) / 1000
      data.push([c, r, ndvi])
    }
  }
  return { rows, cols, data }
}

/** 生成时序变化数据 */
export function generateMonitorTimeSeries(
  startDate: string,
  endDate: string,
  indicators: string[],
) {
  // 生成日期序列（按旬：每10天一景）
  const dates: string[] = []
  const start = new Date(startDate || '2026-03-01')
  const end = new Date(endDate || '2026-07-10')
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`)
    cur.setDate(cur.getDate() + 10)
  }

  // 每个指数生成带趋势 + 季节性的曲线
  function makeSeries(base: number, amplitude: number, trend: number, noise: number) {
    return dates.map((_, i) => {
      const t = i / dates.length
      const seasonal = Math.sin(t * Math.PI * 2.2) * amplitude
      const trendVal = t * trend
      const n = (Math.random() - 0.5) * noise
      return Math.round(Math.max(0, Math.min(1, base + seasonal + trendVal + n)) * 1000) / 1000
    })
  }

  const seriesMap: Record<string, { name: string; color: string; base: number; amp: number; trend: number; noise: number }> = {
    NDVI: { name: 'NDVI', color: '#67C23A', base: 0.55, amp: 0.18, trend: 0.12, noise: 0.06 },
    EVI:  { name: 'EVI',  color: '#409EFF', base: 0.42, amp: 0.15, trend: 0.10, noise: 0.05 },
    NDWI: { name: 'NDWI', color: '#00D4FF', base: 0.35, amp: 0.20, trend: -0.05, noise: 0.07 },
    LAI:  { name: 'LAI',  color: '#E6A23C', base: 2.5,  amp: 1.2,  trend: 0.8,  noise: 0.25 },
  }

  const series = indicators
    .filter((k) => seriesMap[k])
    .map((k) => {
      const cfg = seriesMap[k]
      return {
        name: cfg.name,
        color: cfg.color,
        data: makeSeries(cfg.base, cfg.amp, cfg.trend, cfg.noise),
      }
    })

  return { dates, series }
}

/** 根据 grid 数据计算统计摘要 */
export function computeMonitorStats(gridData: [number, number, number][]) {
  const values = gridData.map((d) => d[2])
  const n = values.length
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const min = Math.min(...values)
  const max = Math.max(...values)
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)
  // NDVI > 0.6 视为健康植被区
  const healthyArea = values.filter((v) => v > 0.6).length / n * 100

  return { mean, min, max, stdDev, healthyArea }
}

// ═══════════════════════════════════════
// 计算服务 — 历史任务
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// 计算服务 — 智能识别结果
// ═══════════════════════════════════════

export interface DetectionObject {
  id: number
  className: string
  classNameZh: string
  confidence: number
  bbox: [number, number, number, number] // [x, y, w, h] 归一化
  areaPx: number
  color: string
}

export function generateDetectionResults(detectType: string): {
  objects: DetectionObject[]
  stats: { total: number; classCount: number; avgConfidence: number; processTime: number }
  classDistribution: { name: string; count: number; color: string }[]
} {
  const classMap: Record<string, { name: string; zh: string; color: string; weight: number }[]> = {
    crop_classify: [
      { name: 'wheat', zh: '冬小麦', color: '#67C23A', weight: 35 },
      { name: 'corn', zh: '玉米', color: '#409EFF', weight: 28 },
      { name: 'rice', zh: '水稻', color: '#E6A23C', weight: 20 },
      { name: 'soybean', zh: '大豆', color: '#9B59B6', weight: 12 },
      { name: 'cotton', zh: '棉花', color: '#F56C6C', weight: 5 },
    ],
    pest_disease: [
      { name: 'rust', zh: '锈病', color: '#F56C6C', weight: 30 },
      { name: 'aphid', zh: '蚜虫侵害', color: '#E6A23C', weight: 25 },
      { name: 'blight', zh: '枯萎病', color: '#8B4513', weight: 20 },
      { name: 'healthy', zh: '健康', color: '#67C23A', weight: 25 },
    ],
    lodging: [
      { name: 'severe', zh: '严重倒伏', color: '#F56C6C', weight: 15 },
      { name: 'moderate', zh: '中度倒伏', color: '#E6A23C', weight: 25 },
      { name: 'mild', zh: '轻微倒伏', color: '#409EFF', weight: 20 },
      { name: 'normal', zh: '正常', color: '#67C23A', weight: 40 },
    ],
    frost: [
      { name: 'severe', zh: '重度冻害', color: '#8B008B', weight: 10 },
      { name: 'moderate', zh: '中度冻害', color: '#F56C6C', weight: 20 },
      { name: 'mild', zh: '轻度冻害', color: '#E6A23C', weight: 30 },
      { name: 'normal', zh: '正常', color: '#67C23A', weight: 40 },
    ],
    flood: [
      { name: 'submerged', zh: '淹没区', color: '#409EFF', weight: 18 },
      { name: 'waterlogged', zh: '渍涝区', color: '#00D4FF', weight: 22 },
      { name: 'at_risk', zh: '风险区', color: '#E6A23C', weight: 25 },
      { name: 'normal', zh: '正常', color: '#67C23A', weight: 35 },
    ],
  }

  const classes = classMap[detectType] || classMap.crop_classify
  const totalWeight = classes.reduce((s, c) => s + c.weight, 0)
  const totalObjects = 40 + Math.floor(Math.random() * 60)

  const objects: DetectionObject[] = []
  for (let i = 0; i < totalObjects; i++) {
    const r = Math.random() * totalWeight
    let acc = 0
    let cls = classes[0]
    for (const c of classes) {
      acc += c.weight
      if (r <= acc) { cls = c; break }
    }
    const x = Math.round((Math.random() * 0.85) * 1000) / 1000
    const y = Math.round((Math.random() * 0.85) * 1000) / 1000
    const w = Math.round((0.02 + Math.random() * 0.12) * 1000) / 1000
    const h = Math.round((0.02 + Math.random() * 0.12) * 1000) / 1000
    objects.push({
      id: i + 1,
      className: cls.name,
      classNameZh: cls.zh,
      confidence: Math.round((0.65 + Math.random() * 0.33) * 1000) / 1000,
      bbox: [x, y, w, h],
      areaPx: Math.round(w * h * 10000),
      color: cls.color,
    })
  }

  const classDistribution = classes.map((c) => ({
    name: c.zh,
    count: objects.filter((o) => o.className === c.name).length,
    color: c.color,
  }))

  return {
    objects,
    stats: {
      total: totalObjects,
      classCount: classes.length,
      avgConfidence: Math.round(objects.reduce((s, o) => s + o.confidence, 0) / totalObjects * 1000) / 1000,
      processTime: Math.round((1.2 + Math.random() * 4.5) * 10) / 10,
    },
    classDistribution,
  }
}

// ═══════════════════════════════════════
// 计算服务 — 变化检测结果
// ═══════════════════════════════════════

export interface ChangeItem {
  type: string
  typeZh: string
  count: number
  area: number
  ratio: number
  confidence: number
  trend: string
}

export function generateChangeDetectionResults(changeTypes: string[]): ChangeItem[] {
  const typeMap: Record<string, { zh: string; trend: string; baseArea: number; baseCount: number }> = {
    building: { zh: '新增建筑', trend: '↑ 扩张', baseArea: 12.5, baseCount: 23 },
    vegetation: { zh: '植被减少', trend: '↓ 退化', baseArea: 45.2, baseCount: 67 },
    water: { zh: '水体变化', trend: '↗ 波动', baseArea: 8.3, baseCount: 15 },
    road: { zh: '道路变化', trend: '↑ 新建', baseArea: 6.8, baseCount: 11 },
  }

  const active = changeTypes.length > 0 ? changeTypes : ['building', 'vegetation', 'water', 'road']
  const items: ChangeItem[] = active
    .filter((t) => typeMap[t])
    .map((t) => {
      const m = typeMap[t]
      const variation = 1 + (Math.random() - 0.5) * 0.6
      return {
        type: t,
        typeZh: m.zh,
        count: Math.round(m.baseCount * variation),
        area: Math.round(m.baseArea * variation * 100) / 100,
        ratio: 0, // calculated below
        confidence: Math.round((0.78 + Math.random() * 0.2) * 1000) / 1000,
        trend: m.trend,
      }
    })

  const totalArea = items.reduce((s, i) => s + i.area, 0)
  items.forEach((i) => { i.ratio = Math.round((i.area / totalArea) * 1000) / 10 })

  return items
}

// ═══════════════════════════════════════
// 计算服务 — 产量预估结果
// ═══════════════════════════════════════

export function generateYieldEstimate(): {
  yieldPerHectare: number
  totalYield: number
  area: number
  confidenceInterval: [number, number]
  confidence: number
  factors: { name: string; contribution: number; color: string }[]
} {
  const baseYield = 5800 + Math.random() * 1200
  const area = 120 + Math.random() * 80
  const confidence = 0.82 + Math.random() * 0.13

  return {
    yieldPerHectare: Math.round(baseYield),
    totalYield: Math.round(baseYield * area / 1000),
    area: Math.round(area * 100) / 100,
    confidenceInterval: [
      Math.round(baseYield * 0.88),
      Math.round(baseYield * 1.1),
    ],
    confidence: Math.round(confidence * 1000) / 1000,
    factors: [
      { name: 'NDVI 时序', contribution: Math.round(28 + Math.random() * 8), color: '#67C23A' },
      { name: '降水量', contribution: Math.round(18 + Math.random() * 6), color: '#409EFF' },
      { name: '温度', contribution: Math.round(14 + Math.random() * 6), color: '#F56C6C' },
      { name: '土壤湿度', contribution: Math.round(12 + Math.random() * 5), color: '#E6A23C' },
      { name: '施肥水平', contribution: Math.round(10 + Math.random() * 5), color: '#9B59B6' },
      { name: '品种特性', contribution: Math.round(5 + Math.random() * 4), color: '#00D4FF' },
    ],
  }
}

// ═══════════════════════════════════════
// 计算服务 — 历史任务
// ═══════════════════════════════════════

export const demoComputeTasks = [
  {
    id: 'task-001', name: '武汉阳逻地块NDVI监测', type: 'monitor' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'ndvi-v2', modelVersion: '2.1.0',
    createdAt: '2026-07-13 09:30', completedAt: '2026-07-13 09:32', duration: '2m12s',
  },
  {
    id: 'task-002', name: '荆州监利作物分类识别', type: 'detect' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'yolov8-s', modelVersion: '8.2.0',
    createdAt: '2026-07-13 08:00', completedAt: '2026-07-13 08:05', duration: '5m08s',
  },
  {
    id: 'task-003', name: '黄冈团风变化检测', type: 'change_detect' as const,
    status: 'processing' as const, progress: 62,
    currentStage: '正在执行AI推理...', modelId: 'changeformer', modelVersion: '1.0.0',
    createdAt: '2026-07-13 14:00', completedAt: undefined, duration: '3m20s',
  },
  {
    id: 'task-004', name: '湖北农垦产量预估', type: 'yield_estimate' as const,
    status: 'queued' as const, progress: 0,
    currentStage: '排队等待中', modelId: 'lstm-crop', modelVersion: '3.0.1',
    createdAt: '2026-07-13 14:30', completedAt: undefined, duration: '--',
  },
  {
    id: 'task-005', name: '襄阳襄州EVI时序监测', type: 'monitor' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'ndvi-v2', modelVersion: '2.1.0',
    createdAt: '2026-07-12 15:00', completedAt: '2026-07-12 15:03', duration: '3m45s',
  },
  {
    id: 'task-006', name: '宜昌夷陵病虫害检测', type: 'detect' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'yolov8-m', modelVersion: '8.2.0',
    createdAt: '2026-07-12 10:20', completedAt: '2026-07-12 10:27', duration: '7m12s',
  },
  {
    id: 'task-007', name: '孝感汉川水体变化检测', type: 'change_detect' as const,
    status: 'failed' as const, progress: 45,
    currentStage: 'AI推理异常中断', modelId: 'changeformer', modelVersion: '1.0.0',
    createdAt: '2026-07-12 08:15', completedAt: '2026-07-12 08:22', duration: '7m00s',
  },
  {
    id: 'task-008', name: '天门多宝小麦产量预估', type: 'yield_estimate' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'lstm-crop', modelVersion: '3.0.1',
    createdAt: '2026-07-11 16:00', completedAt: '2026-07-11 16:08', duration: '8m30s',
  },
  {
    id: 'task-009', name: '潜江园林NDWI水分监测', type: 'monitor' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'ndvi-v2', modelVersion: '2.1.0',
    createdAt: '2026-07-11 09:45', completedAt: '2026-07-11 09:47', duration: '2m05s',
  },
  {
    id: 'task-010', name: '仙桃彭场洪涝范围识别', type: 'detect' as const,
    status: 'completed' as const, progress: 100,
    currentStage: '结果已生成', modelId: 'segformer', modelVersion: '1.3.0',
    createdAt: '2026-07-10 14:30', completedAt: '2026-07-10 14:38', duration: '8m15s',
  },
  {
    id: 'task-011', name: '荆门钟祥土地变化检测', type: 'change_detect' as const,
    status: 'queued' as const, progress: 0,
    currentStage: '排队等待中', modelId: 'changeformer', modelVersion: '1.0.0',
    createdAt: '2026-07-13 15:00', completedAt: undefined, duration: '--',
  },
  {
    id: 'task-012', name: '荆州监利大豆产量预估', type: 'yield_estimate' as const,
    status: 'processing' as const, progress: 28,
    currentStage: '正在提取时序特征...', modelId: 'ensemble', modelVersion: '2.0.0',
    createdAt: '2026-07-13 15:10', completedAt: undefined, duration: '1m40s',
  },
]

// ═══════════════════════════════════════
// 订单 — 演示订单
// ═══════════════════════════════════════

export interface DemoOrderDetail {
  id: string
  orderNo: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  amount: number
  deliveryMethod: string
  dataFormat: string
  projection: string
  items: { sceneName: string; satellite: string; date: string; size: string; thumbnailUrl: string }[]
  downloadUrl?: string
  expiresAt?: string
}

export const demoOrderList: DemoOrderDetail[] = [
  {
    id: '1', orderNo: 'ORD-20260713-001', status: 'completed',
    createdAt: '2026-07-13 10:30', amount: 250,
    deliveryMethod: 'S3 转存', dataFormat: 'GeoTIFF', projection: 'WGS84',
    items: [
      { sceneName: 'S2A_MSIL2A_20260710_Wuhan', satellite: '哨兵2号', date: '2026-07-10', size: '856 MB', thumbnailUrl: '' },
      { sceneName: 'S2A_MSIL2A_20260705_Jingzhou', satellite: '哨兵2号', date: '2026-07-05', size: '812 MB', thumbnailUrl: '' },
    ],
    downloadUrl: 'https://data.example.com/dl/ORD-001.zip',
    expiresAt: '2026-07-20 10:30',
  },
  {
    id: '2', orderNo: 'ORD-20260713-002', status: 'processing',
    createdAt: '2026-07-13 11:15', amount: 600,
    deliveryMethod: 'FTP 推送', dataFormat: 'GeoTIFF', projection: 'CGCS2000',
    items: [
      { sceneName: 'GF6_PMS_20260712_Huanggang', satellite: '高分6号', date: '2026-07-12', size: '2.1 GB', thumbnailUrl: '' },
      { sceneName: 'LC9_L2SP_20260711_Yichang', satellite: 'Landsat-9', date: '2026-07-11', size: '520 MB', thumbnailUrl: '' },
      { sceneName: 'S2A_MSIL2A_20260709_Xiangyang', satellite: '哨兵2号', date: '2026-07-09', size: '840 MB', thumbnailUrl: '' },
    ],
  },
  {
    id: '3', orderNo: 'ORD-20260712-003', status: 'completed',
    createdAt: '2026-07-12 15:40', amount: 380,
    deliveryMethod: 'HTTP 直链', dataFormat: 'IMG', projection: 'UTM',
    items: [
      { sceneName: 'WV4_20260710_Xiaogan', satellite: 'WorldView-4', date: '2026-07-10', size: '3.5 GB', thumbnailUrl: '' },
    ],
    downloadUrl: 'https://data.example.com/dl/ORD-003.zip',
    expiresAt: '2026-07-19 15:40',
  },
  {
    id: '4', orderNo: 'ORD-20260711-004', status: 'cancelled',
    createdAt: '2026-07-11 09:00', amount: 150,
    deliveryMethod: 'FTP 推送', dataFormat: 'GeoTIFF', projection: 'WGS84',
    items: [
      { sceneName: 'PS_20260709_Tianmen', satellite: 'PlanetScope', date: '2026-07-09', size: '380 MB', thumbnailUrl: '' },
    ],
  },
]
