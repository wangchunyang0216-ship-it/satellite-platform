import { createWebHistory, createRouter } from 'vue-router'
/* Layout */
import Layout from '@/layout'

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true                 // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                  // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                  // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                  // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮相对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index.vue')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register.vue'),
    hidden: true
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: '/console/dashboard',
    children: [
      {
        path: '/index',
        component: () => import('@/views/console/DashboardPage.vue'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/lock',
    component: () => import('@/views/lock'),
    hidden: true,
    meta: { title: '锁定屏幕' }
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile/:activeTab?',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  },

  // ══════════════════════════════════════
  //  遥感卫星数据服务平台（集成）
  // ══════════════════════════════════════
  // 遥感门户首页（公开，不套 Layout）
  {
    path: '/rs/home',
    component: () => import('@/views/home/HomePage.vue'),
    hidden: true,
    meta: { title: '遥感平台门户' }
  },
  {
    path: '/rs/guide',
    component: () => import('@/views/home/UserGuidePage.vue'),
    hidden: true,
    meta: { title: '使用说明文档' }
  },
  // 应用场景详情（公开，不套 Layout）
  { path: '/scenarios/agriculture', component: () => import('@/views/scenarios/SmartAgriculturePage.vue'), hidden: true, meta: { title: '智慧农业' } },
  { path: '/scenarios/urban', component: () => import('@/views/scenarios/UrbanPlanningPage.vue'), hidden: true, meta: { title: '城市规划' } },
  { path: '/scenarios/water', component: () => import('@/views/scenarios/WaterManagementPage.vue'), hidden: true, meta: { title: '水资源管理' } },
  { path: '/scenarios/forestry', component: () => import('@/views/scenarios/ForestryMonitoringPage.vue'), hidden: true, meta: { title: '林业监测' } },
  // 遥感控制台业务（套 Layout，侧边栏「遥感平台」菜单）
  {
    path: '/console',
    component: Layout,
    redirect: '/console/dashboard',
    meta: { title: '遥感平台', icon: 'yaogan' },
    children: [
      { path: 'dashboard', component: () => import('@/views/console/DashboardPage.vue'), name: 'RsDashboard', hidden: true, meta: { title: '控制台', icon: 'weixing' } },
      { path: 'computing/basic', component: () => import('@/views/computing/AlgorithmServicePage.vue'), name: 'RsAlgorithm', meta: { title: '算法服务', icon: 'suanfafuwu' } },
      { path: 'computing/basic/intro/:serviceId', component: () => import('@/views/computing/AlgorithmIntroPage.vue'), name: 'RsAlgorithmIntro', hidden: true, meta: { title: '算法介绍', activeMenu: '/console/computing/models' } },
      { path: 'computing/result/:taskId', component: () => import('@/views/computing/Result3DViewer.vue'), name: 'RsTaskResult3D', hidden: true, meta: { title: '任务结果', activeMenu: '/console/tasks' } },
      { path: 'computing/models', component: () => import('@/views/computing/ComputingHubPage.vue'), name: 'RsModels', meta: { title: '智能计算中心', icon: 'duomotaironghe' } },
      { path: 'computing/models/recognition', component: () => import('@/views/computing/models/RecognitionPage.vue'), name: 'RsRecognition', hidden: true, meta: { title: '地物识别', activeMenu: '/console/computing/models' } },
      { path: 'computing/models/detection', component: () => import('@/views/computing/models/TargetDetectionPage.vue'), name: 'RsDetection', hidden: true, meta: { title: '目标检测', activeMenu: '/console/computing/models' } },
      { path: 'computing/models/change-detection', component: () => import('@/views/computing/models/ChangeDetectionPage.vue'), name: 'RsChangeDetection', hidden: true, meta: { title: '变化检测', activeMenu: '/console/computing/models' } },
      { path: 'computing/models/multimodal-fusion', component: () => import('@/views/computing/models/MultiModalFusionPage.vue'), name: 'RsFusion', hidden: true, meta: { title: '多模态融合', activeMenu: '/console/computing/models' } },
      { path: 'tasks', component: () => import('@/views/computing/TaskCenterPage.vue'), name: 'RsTasks', meta: { title: '任务中心', icon: 'jisuanrenwu' } },
      { path: 'data', component: () => import('@/views/portal/DataCatalogPage.vue'), name: 'RsData', meta: { title: '数据中心', icon: 'weixing' } },
      {
        path: 'scenarios',
        name: 'RsScenarios',
        redirect: '/console/scenarios/emergency/flood',
        alwaysShow: true,
        meta: { title: '应用场景', icon: 'yaogan' },
        children: [
          {
            path: 'emergency',
            redirect: '/console/scenarios/emergency/flood',
            alwaysShow: true,
            meta: { title: '应急救灾', icon: 'mubiaojiance' },
            children: [
              { path: 'flood', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEmergencyFlood', meta: { title: '洪涝监测', icon: 'mubiaojiance' } },
              { path: 'earthquake', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEmergencyEarthquake', meta: { title: '地震评估', icon: 'mubiaojiance' } },
              { path: 'fire', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEmergencyFire', meta: { title: '火灾监测', icon: 'mubiaojiance' } }
            ]
          },
          {
            path: 'agriculture',
            redirect: '/console/scenarios/agriculture/crop',
            alwaysShow: true,
            meta: { title: '智慧农业', icon: 'zhihuinongye' },
            children: [
              { path: 'crop', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioAgricultureCrop', meta: { title: '作物监测', icon: 'zhihuinongye' } },
              { path: 'yield', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioAgricultureYield', meta: { title: '产量预估', icon: 'zhihuinongye' } },
              { path: 'pest', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioAgriculturePest', meta: { title: '病虫害预警', icon: 'zhihuinongye' } },
              { path: 'soil', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioAgricultureSoil', meta: { title: '土壤墒情', icon: 'zhihuinongye' } }
            ]
          },
          {
            path: 'meteorology',
            redirect: '/console/scenarios/meteorology/typhoon',
            alwaysShow: true,
            meta: { title: '气象监测', icon: 'yunjiance' },
            children: [
              { path: 'typhoon', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioMeteorologyTyphoon', meta: { title: '台风监测', icon: 'yunjiance' } },
              { path: 'rainstorm', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioMeteorologyRainstorm', meta: { title: '暴雨洪涝', icon: 'yunjiance' } },
              { path: 'sandstorm', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioMeteorologySandstorm', meta: { title: '沙尘暴监测', icon: 'yunjiance' } },
              { path: 'haze', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioMeteorologyHaze', meta: { title: '雾霾监测', icon: 'yunjiance' } }
            ]
          },
          {
            path: 'urban',
            redirect: '/console/scenarios/urban/landuse',
            alwaysShow: true,
            meta: { title: '城市规划', icon: 'chengshiguihua' },
            children: [
              { path: 'landuse', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioUrbanLanduse', meta: { title: '土地利用', icon: 'chengshiguihua' } },
              { path: 'illegal', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioUrbanIllegal', meta: { title: '违建监测', icon: 'chengshiguihua' } },
              { path: 'traffic', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioUrbanTraffic', meta: { title: '交通规划', icon: 'chengshiguihua' } },
              { path: 'heatisland', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioUrbanHeatisland', meta: { title: '热岛效应', icon: 'chengshiguihua' } }
            ]
          },
          {
            path: 'ocean',
            redirect: '/console/scenarios/ocean/redtide',
            alwaysShow: true,
            meta: { title: '海洋监测', icon: 'shuiziyuanguanli' },
            children: [
              { path: 'redtide', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioOceanRedtide', meta: { title: '赤潮监测', icon: 'shuiziyuanguanli' } },
              { path: 'oilspill', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioOceanOilspill', meta: { title: '溢油监测', icon: 'shuiziyuanguanli' } },
              { path: 'seaice', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioOceanSeaice', meta: { title: '海冰监测', icon: 'shuiziyuanguanli' } },
              { path: 'vessel', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioOceanVessel', meta: { title: '船舶识别', icon: 'shuiziyuanguanli' } }
            ]
          },
          {
            path: 'ecology',
            redirect: '/console/scenarios/ecology/forest',
            alwaysShow: true,
            meta: { title: '生态环保', icon: 'senlin' },
            children: [
              { path: 'forest', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEcologyForest', meta: { title: '森林覆盖', icon: 'senlin' } },
              { path: 'wetland', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEcologyWetland', meta: { title: '湿地监测', icon: 'senlin' } },
              { path: 'desert', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEcologyDesert', meta: { title: '荒漠化', icon: 'senlin' } },
              { path: 'carbon', component: () => import('@/views/scenarios/ScenarioCategoryPage.vue'), name: 'RsScenarioEcologyCarbon', meta: { title: '碳汇估算', icon: 'senlin' } }
            ]
          }
        ]
      },
      { path: 'data/satellite/:satelliteId', component: () => import('@/views/portal/SatelliteDataPage.vue'), name: 'RsSatelliteData', hidden: true, meta: { title: '卫星数据', activeMenu: '/console/data' } },
      { path: 'data/scene/:id', component: () => import('@/views/portal/DataDetailPage.vue'), name: 'RsDataDetail', hidden: true, meta: { title: '影像详情', activeMenu: '/console/data' } },
      { path: 'data/:id', redirect: to => `/console/data/scene/${to.params.id}`, hidden: true },
      { path: 'cart', component: () => import('@/views/portal/CartPage.vue'), name: 'RsCart', hidden: true, meta: { title: '购物车', activeMenu: '/console/data' } },
      { path: 'orders', component: () => import('@/views/portal/MyOrdersPage.vue'), name: 'RsOrders', hidden: true, meta: { title: '我的订单', icon: 'dingdan', activeMenu: '/console/data' } },
      { path: 'checkout', component: () => import('@/views/portal/CheckoutPage.vue'), name: 'RsCheckout', hidden: true, meta: { title: '确认下单', activeMenu: '/console/data' } },
      { path: 'profile', component: () => import('@/views/portal/OtherPage.vue'), name: 'RsProfile', hidden: true, meta: { title: '个人中心', activeMenu: '/console/dashboard' } }
    ]
  },
  // 遥感管理（套 Layout，侧边栏「遥感管理」菜单）
  {
    path: '/rs-admin',
    component: Layout,
    redirect: '/rs-admin/dashboard',
    meta: { title: '遥感管理', icon: 'yaogan' },
    children: [
      { path: 'dashboard', component: () => import('@/views/dashboard/DashboardPage.vue'), name: 'RsAdminDashboard', meta: { title: '数据大屏', icon: 'guangpu' } },
      { path: 'providers', component: () => import('@/views/admin/ProvidersPage.vue'), name: 'RsProviders', meta: { title: '数据源管理', icon: 'yunjiance' } },
      { path: 'pipeline', component: () => import('@/views/admin/PipelinePage.vue'), name: 'RsPipeline', meta: { title: '流水线监控', icon: 'yingxiangronghe' } },
      { path: 'users', component: () => import('@/views/admin/UsersPage.vue'), name: 'RsUsers', meta: { title: '用户管理', icon: 'user' } },
      { path: 'orders', component: () => import('@/views/admin/OrdersPage.vue'), name: 'RsAdminOrders', meta: { title: '订单管理', icon: 'dingdan' } },
      { path: 'stats', component: () => import('@/views/admin/StatsPage.vue'), name: 'RsStats', meta: { title: '统计看板', icon: 'fushedingbiao' } }
    ]
  },
  // Shur / RuoYi 原框架本地菜单（demo/白名单模式下也显示）
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'system' },
    alwaysShow: true,
    children: [
      { path: 'user', component: () => import('@/views/system/user/index.vue'), name: 'SystemUser', meta: { title: '用户管理', icon: 'user' } },
      { path: 'role', component: () => import('@/views/system/role/index.vue'), name: 'SystemRole', meta: { title: '角色管理', icon: 'peoples' } },
      { path: 'menu', component: () => import('@/views/system/menu/index.vue'), name: 'SystemMenu', meta: { title: '菜单管理', icon: 'tree-table' } },
      { path: 'dept', component: () => import('@/views/system/dept/index.vue'), name: 'SystemDept', meta: { title: '部门管理', icon: 'tree' } },
      { path: 'post', component: () => import('@/views/system/post/index.vue'), name: 'SystemPost', meta: { title: '岗位管理', icon: 'post' } },
      { path: 'dict', component: () => import('@/views/system/dict/index.vue'), name: 'SystemDict', meta: { title: '字典管理', icon: 'dict' } },
      { path: 'config', component: () => import('@/views/system/config/index.vue'), name: 'SystemConfig', meta: { title: '参数设置', icon: 'edit' } },
      { path: 'notice', component: () => import('@/views/system/notice/index.vue'), name: 'SystemNotice', meta: { title: '通知公告', icon: 'message' } },
      { path: 'operlog', component: () => import('@/views/system/operlog/index.vue'), name: 'SystemOperlog', meta: { title: '操作日志', icon: 'log' } },
      { path: 'logininfor', component: () => import('@/views/system/logininfor/index.vue'), name: 'SystemLogininfor', meta: { title: '登录日志', icon: 'logininfor' } },
      { path: 'dict-data/:dictId', component: () => import('@/views/system/dict/data.vue'), name: 'SystemDictData', hidden: true, meta: { title: '字典数据', activeMenu: '/system/dict' } },
      { path: 'role-auth/user/:roleId', component: () => import('@/views/system/role/authUser.vue'), name: 'SystemRoleAuthUser', hidden: true, meta: { title: '分配用户', activeMenu: '/system/role' } },
      { path: 'user-auth/role/:userId', component: () => import('@/views/system/user/authRole.vue'), name: 'SystemUserAuthRole', hidden: true, meta: { title: '分配角色', activeMenu: '/system/user' } },
      { path: 'user-view/:userId', component: () => import('@/views/system/user/view.vue'), name: 'SystemUserView', hidden: true, meta: { title: '用户详情', activeMenu: '/system/user' } }
    ]
  },
  {
    path: '/monitor',
    component: Layout,
    redirect: '/monitor/online',
    meta: { title: '系统监控', icon: 'monitor' },
    alwaysShow: true,
    children: [
      { path: 'online', component: () => import('@/views/monitor/online/index.vue'), name: 'MonitorOnline', meta: { title: '在线用户', icon: 'online' } },
      { path: 'job', component: () => import('@/views/monitor/job/index.vue'), name: 'MonitorJob', meta: { title: '定时任务', icon: 'job' } },
      { path: 'job-log', component: () => import('@/views/monitor/job/log.vue'), name: 'MonitorJobLog', hidden: true, meta: { title: '调度日志', activeMenu: '/monitor/job' } },
      { path: 'job-detail/:jobId', component: () => import('@/views/monitor/job/detail.vue'), name: 'MonitorJobDetail', hidden: true, meta: { title: '任务详情', activeMenu: '/monitor/job' } }
    ]
  },
  {
    path: '/tool',
    component: Layout,
    redirect: '/tool/build',
    meta: { title: '系统工具', icon: 'tool' },
    alwaysShow: true,
    children: [
      { path: 'build', component: () => import('@/views/tool/build/index.vue'), name: 'ToolBuild', meta: { title: '表单构建', icon: 'build' } },
      { path: 'gen', component: () => import('@/views/tool/gen/index.vue'), name: 'ToolGen', meta: { title: '代码生成', icon: 'code' } }
    ]
  }
]

// 动态路由，基于用户权限动态去加载
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
  {
    path: '/monitor/job-log',
    component: Layout,
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/tool/gen-edit',
    component: Layout,
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

export default router
