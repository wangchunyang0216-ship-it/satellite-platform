export interface SatelliteInfo {
  id: string
  name: string
  shortName: string
  owner: string
  sensorType: string
  resolution: string
  swath: string
  revisit: string
  altitude: string
  launchDate: string
  status: 'active' | 'maintenance'
  sceneCount: number
  description: string
  applications: string[]
}

export interface SatelliteScene {
  id: string
  sceneName: string
  path: string
  satellite: string
  satId: string
  sensorType: string
  date: string
  time: string
  resolution: number
  cloudCoverage: number
  coverage: string
  size: string
  price: number
  lng: number
  lat: number
}

export const satellites: SatelliteInfo[] = [
  { id:'fy4a', name:'风云四号A星', shortName:'FY-4A', owner:'中国气象局', sensorType:'AGRI 多光谱成像仪', resolution:'500m', swath:'全圆盘', revisit:'5分钟', altitude:'35,786km', launchDate:'2016-12-11', status:'active', sceneCount:28500, description:'我国第二代静止轨道气象卫星，提供高频次、多光谱的天气与环境观测数据。', applications:['天气监测','台风追踪','灾害预警'] },
  { id:'fy3e', name:'风云三号E星', shortName:'FY-3E', owner:'中国气象局', sensorType:'MERSI / HIRAS / MWTS', resolution:'250m', swath:'2,800km', revisit:'6小时', altitude:'836km', launchDate:'2021-07-05', status:'active', sceneCount:42300, description:'全球首颗民用晨昏轨道气象卫星，强化晨昏时段全球大气、海洋和地表观测。', applications:['全球气象','海洋监测','大气探测'] },
  { id:'gf6', name:'高分六号', shortName:'GF-6', owner:'中国资源卫星中心', sensorType:'PMS / WFV 多光谱', resolution:'2m', swath:'90km', revisit:'4天', altitude:'644km', launchDate:'2018-06-02', status:'active', sceneCount:18600, description:'高分辨率对地观测卫星，具备宽覆盖、高分辨率和高频次观测能力。', applications:['农业监测','资源调查','生态评估'] },
  { id:'gf7', name:'高分七号', shortName:'GF-7', owner:'中国资源卫星中心', sensorType:'双线阵立体测绘相机', resolution:'0.65m', swath:'20km', revisit:'5天', altitude:'506km', launchDate:'2019-11-03', status:'active', sceneCount:12400, description:'我国首颗民用亚米级光学传输型立体测绘卫星，可获取高精度立体影像。', applications:['立体测绘','城市建模','国土调查'] },
  { id:'sentinel2', name:'哨兵二号', shortName:'Sentinel-2', owner:'ESA 欧洲空间局', sensorType:'MSI 多光谱', resolution:'10m', swath:'290km', revisit:'5天', altitude:'786km', launchDate:'2015-06-23', status:'active', sceneCount:35200, description:'欧洲哥白尼计划的多光谱成像任务，提供全球陆地与沿海区域的开放数据。', applications:['植被监测','水体分析','土地覆盖'] },
  { id:'landsat9', name:'Landsat-9', shortName:'Landsat-9', owner:'NASA / USGS', sensorType:'OLI-2 / TIRS-2', resolution:'30m', swath:'185km', revisit:'16天', altitude:'705km', launchDate:'2021-09-27', status:'active', sceneCount:19800, description:'Landsat 连续地球观测计划的新一代卫星，提供稳定的多光谱与热红外数据。', applications:['长期变化','地表温度','资源管理'] },
]

export const satelliteScenes: SatelliteScene[] = [
  { id:'s1', sceneName:'GF6_PMS_L1A_20260716T0330', path:'Path/Row: 123/039', satellite:'高分六号', satId:'gf6', sensorType:'PMS 多光谱', date:'2026-07-16', time:'03:30 UTC', resolution:2, cloudCoverage:3, coverage:'武汉·湖北', size:'2.1 GB', price:120, lng:114.3, lat:30.6 },
  { id:'s2', sceneName:'GF7_MUX_L1A_20260715T0215', path:'Path/Row: 098/042', satellite:'高分七号', satId:'gf7', sensorType:'立体测绘', date:'2026-07-15', time:'02:15 UTC', resolution:0.65, cloudCoverage:8, coverage:'宜昌·湖北', size:'4.5 GB', price:280, lng:111.3, lat:30.7 },
  { id:'s3', sceneName:'S2A_MSIL2A_20260714T0452', path:'Tile: T49RGP', satellite:'哨兵二号', satId:'sentinel2', sensorType:'MSI', date:'2026-07-14', time:'04:52 UTC', resolution:10, cloudCoverage:2, coverage:'荆州·湖北', size:'856 MB', price:0, lng:112.2, lat:30.3 },
  { id:'s4', sceneName:'LC09_L2SP_125039_20260714', path:'WRS-2: 125/039', satellite:'Landsat-9', satId:'landsat9', sensorType:'OLI-2', date:'2026-07-14', time:'03:10 UTC', resolution:30, cloudCoverage:18, coverage:'黄冈·湖北', size:'520 MB', price:0, lng:114.9, lat:30.5 },
  { id:'s5', sceneName:'FY4A_AGRI_L1_20260716T0800', path:'Full Disk', satellite:'风云四号A星', satId:'fy4a', sensorType:'AGRI 多光谱', date:'2026-07-16', time:'08:00 UTC', resolution:500, cloudCoverage:5, coverage:'亚太区域', size:'1.2 GB', price:0, lng:110, lat:30 },
  { id:'s6', sceneName:'FY3E_MERSI_L2_20260716T0300', path:'Orbit: 12345', satellite:'风云三号E星', satId:'fy3e', sensorType:'MERSI', date:'2026-07-16', time:'03:00 UTC', resolution:250, cloudCoverage:12, coverage:'中国东部', size:'2.8 GB', price:0, lng:116, lat:32 },
  { id:'s7', sceneName:'GF6_WFV_L1A_20260713T0415', path:'Path/Row: 119/041', satellite:'高分六号', satId:'gf6', sensorType:'WFV 多光谱', date:'2026-07-13', time:'04:15 UTC', resolution:16, cloudCoverage:1, coverage:'襄阳·湖北', size:'1.9 GB', price:80, lng:112.1, lat:32 },
  { id:'s8', sceneName:'S2B_MSIL2A_20260712T0440', path:'Tile: T49RFP', satellite:'哨兵二号', satId:'sentinel2', sensorType:'MSI', date:'2026-07-12', time:'04:40 UTC', resolution:10, cloudCoverage:7, coverage:'荆门·湖北', size:'832 MB', price:0, lng:112.2, lat:31 },
  { id:'s9', sceneName:'FY4A_AGRI_L1_20260713T1200', path:'Full Disk', satellite:'风云四号A星', satId:'fy4a', sensorType:'AGRI 多光谱', date:'2026-07-13', time:'12:00 UTC', resolution:500, cloudCoverage:15, coverage:'四川盆地', size:'1.1 GB', price:0, lng:104, lat:30 },
  { id:'s10', sceneName:'LC09_L2SP_126039_20260711', path:'WRS-2: 126/039', satellite:'Landsat-9', satId:'landsat9', sensorType:'TIRS-2', date:'2026-07-11', time:'03:25 UTC', resolution:100, cloudCoverage:22, coverage:'孝感·湖北', size:'480 MB', price:0, lng:113.9, lat:31 },
  { id:'s11', sceneName:'GF7_DLC_L1A_20260710T0210', path:'Path/Row: 095/043', satellite:'高分七号', satId:'gf7', sensorType:'双线阵立体', date:'2026-07-10', time:'02:10 UTC', resolution:0.65, cloudCoverage:4, coverage:'恩施·湖北', size:'5.2 GB', price:280, lng:109.5, lat:30.3 },
  { id:'s12', sceneName:'FY3E_HIRAS_L1_20260710T0800', path:'Orbit: 12389', satellite:'风云三号E星', satId:'fy3e', sensorType:'HIRAS 高光谱', date:'2026-07-10', time:'08:00 UTC', resolution:250, cloudCoverage:20, coverage:'南海区域', size:'3.1 GB', price:0, lng:115, lat:16 },
]

export const getSatellite = (id: string) => satellites.find(item => item.id === id)
export const getSatelliteScenes = (id: string) => satelliteScenes.filter(item => item.satId === id)
