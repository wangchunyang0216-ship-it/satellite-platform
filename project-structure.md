# 项目结构与代码规范说明

本文档用于说明当前 `data-center-vue` 项目的主要目录、若依框架代码位置、首页右上角图标修改位置，以及后续新增代码时建议遵守的命名规范。

## 首页右上角图标在哪里改

首页进入后台布局后，右上角那一排小图标主要在这个文件里：

```text
src/layout/components/Navbar.vue
```

当前右上角区域对应模板结构是：

```vue
<div class="right-menu">
  <template v-if="appStore.device !== 'mobile'">
    ...
  </template>

  <el-dropdown class="avatar-container right-menu-item hover-effect">
    ...
  </el-dropdown>
</div>
```

常见图标和对应代码位置：

| 功能 | 入口代码 | 组件位置 |
| --- | --- | --- |
| 平台首页图标 | `portal-home-entry` | `src/layout/components/Navbar.vue` |
| 搜索图标 | `<header-search />` | `src/components/HeaderSearch/index.vue` |
| 全屏图标 | `<screenfull />` | `src/components/Screenfull/index.vue` |
| 主题切换 | `theme-switch-wrapper` | `src/layout/components/Navbar.vue` |
| 布局大小 | `<size-select />` | `src/components/SizeSelect/index.vue` |
| 消息通知 | `<header-notice />` | `src/layout/components/HeaderNotice/index.vue` |
| 用户头像下拉 | `<el-dropdown class="avatar-container">` | `src/layout/components/Navbar.vue` |

如果要隐藏某个图标，可以在 `Navbar.vue` 里注释或删除对应标签。例如消息通知当前就是这样处理的：

```vue
<!-- <el-tooltip content="消息通知" effect="dark" placement="bottom">
  <header-notice id="header-notice" class="right-menu-item hover-effect" />
</el-tooltip> -->
```

如果消息通知不再使用，建议同时删除脚本里的导入：

```js
import HeaderNotice from './HeaderNotice'
```

否则页面一般还能运行，但代码会留下无用引用。

## 根目录结构

```text
data-center-vue
├── backend                 # 当前项目附带的后端或本地服务代码
├── bin                     # 脚本入口或辅助命令
├── dist                    # Vite 构建产物，不手写业务代码
├── html                    # 静态 HTML 模板或外部页面资源
├── node_modules            # npm 依赖，不手动修改
├── public                  # Vite public 静态资源，原样复制到构建结果
├── scripts                 # 项目脚本
├── src                     # 前端源码主目录
├── vite                    # Vite 构建相关配置扩展
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
├── .env.staging            # 预发布环境变量
├── index.html              # Vite HTML 入口
├── package.json            # 依赖和 npm scripts
├── postcss.config.cjs      # PostCSS 配置，包括 px 转 viewport
├── vite.config.js          # Vite 主配置
├── README.md               # 项目说明
├── AGENTS.md               # 给编码助手看的项目工作说明
└── ruoyi.md                # 若依页面查找说明
```

## src 目录结构

```text
src
├── api             # 后端接口封装
├── assets          # 图片、图标、全局样式等静态资源
├── components      # 全局可复用组件
├── composables     # Vue 组合式函数
├── config          # 业务配置或常量配置
├── data            # 本地静态业务数据、模拟数据
├── directive       # 自定义指令，如权限指令
├── layout          # 后台整体布局，顶部栏、侧边栏、内容区
├── plugins         # 全局插件注册
├── router          # 路由配置
├── services        # 偏业务层的服务封装
├── store           # Pinia/若依状态模块
├── stores          # 新增业务状态模块，部分新代码会放这里
├── types           # TypeScript 类型定义
├── utils           # 通用工具函数
├── views           # 页面级组件
├── App.vue         # 根组件
├── main.js         # 应用入口
├── permission.js   # 路由权限守卫
└── settings.js     # 系统设置
```

## 重要目录说明

### api

`src/api` 用来封装接口请求。一个业务模块通常对应一个 API 文件。

示例：

```text
src/api/system/user.js
src/api/system/operlog.js
src/api/monitor/job.js
src/api/monitor/jobLog.js
```

写法一般是：

```js
import request from '@/utils/request'

export function listSomething(query) {
  return request({
    url: '/xxx/list',
    method: 'get',
    params: query
  })
}
```

### views

`src/views` 放页面级 Vue 文件。一个菜单页面一般就是一个 `views` 下的 `.vue` 文件。

若依原始后台页面主要在：

```text
src/views/system
src/views/monitor
src/views/tool
```

遥感业务页面主要在：

```text
src/views/home
src/views/console
src/views/portal
src/views/computing
src/views/scenarios
src/views/admin
```

### router

路由统一在：

```text
src/router/index.js
```

查页面位置时，看这里的 `component`：

```js
component: () => import('@/views/system/operlog/index.vue')
```

这个就表示页面文件是：

```text
src/views/system/operlog/index.vue
```

### layout

`src/layout` 是若依后台布局核心。常改的文件：

```text
src/layout/index.vue
src/layout/components/Navbar.vue
src/layout/components/Sidebar
src/layout/components/AppMain.vue
src/layout/components/TagsView
src/layout/components/Settings
```

其中 `Navbar.vue` 控制顶部导航栏和右上角图标，`Sidebar` 控制左侧菜单。

### components

`src/components` 放跨页面复用组件，例如：

```text
HeaderSearch       # 顶部搜索
Screenfull         # 全屏按钮
SizeSelect         # 布局大小
Pagination         # 分页
RightToolbar       # 表格右侧工具栏
SvgIcon            # SVG 图标
```

如果组件只服务某一个页面，优先放在页面目录附近；如果多个页面都会用，再放到 `src/components`。

### store / stores

当前项目里两个目录都存在：

```text
src/store
src/stores
```

`src/store` 更偏若依原框架模块，例如用户、权限、设置、锁屏。

`src/stores` 更适合放新业务模块。后续新增遥感业务状态时，建议放到 `src/stores`，除非要复用若依已有模块。

### assets

`src/assets` 放前端资源：

```text
src/assets/images    # 图片
src/assets/icons     # SVG 图标
src/assets/styles    # 全局样式、登录注册样式、侧边栏样式
```

页面独有的小样式优先写在当前 `.vue` 的 `<style scoped>` 里；跨页面共享样式再放 `assets/styles`。

## 若依页面如何找

标准查找顺序：

1. 在 `src/router/index.js` 搜菜单名称。
2. 看当前路由的 `component` 字段。
3. 打开对应 `src/views/...` 页面。
4. 看页面 `<script>` 里 import 的 `@/api/...` 文件。
5. 打开 API 文件，看真实后端接口地址。

例如“系统管理 - 操作日志”：

```text
路由：src/router/index.js
页面：src/views/system/operlog/index.vue
详情：src/views/system/operlog/detail.vue
接口：src/api/system/operlog.js
```

例如“系统监控 - 定时任务”：

```text
路由：src/router/index.js
页面：src/views/monitor/job/index.vue
详情：src/views/monitor/job/detail.vue
日志：src/views/monitor/job/log.vue
接口：src/api/monitor/job.js
接口：src/api/monitor/jobLog.js
```

## 命名规范

### Vue 页面文件

页面级组件建议使用 `PascalCase`：

```text
DashboardPage.vue
DataCatalogPage.vue
AlgorithmServicePage.vue
TaskCenterPage.vue
```

若依原始页面保留原目录风格：

```text
src/views/system/user/index.vue
src/views/monitor/job/index.vue
```

新增遥感业务页面建议用明确的业务名，不要只叫 `index.vue`，除非该目录只有一个若依标准页面。

### 组件文件夹

全局组件建议使用 `PascalCase` 文件夹：

```text
src/components/HeaderSearch/index.vue
src/components/Screenfull/index.vue
src/components/Pagination/index.vue
```

页面内部组件可以放在页面同级的 `components` 目录：

```text
src/views/computing/components/LayerPanel.vue
```

### API 文件

API 文件使用小写或小驼峰，按后端模块分目录：

```text
src/api/system/operlog.js
src/api/monitor/jobLog.js
src/api/portal/order.js
src/api/computing/task.js
```

函数命名建议用动词 + 业务对象：

```js
listJob()
getJob()
addJob()
updateJob()
delJob()
runJob()
```

### 变量和函数

JavaScript / TypeScript 变量、函数使用 `camelCase`：

```js
const taskList = ref([])
const queryParams = reactive({})
function handleQuery() {}
function resetQuery() {}
```

布尔变量建议带语义前缀：

```js
const loading = ref(false)
const dialogVisible = ref(false)
const isEnterprise = computed(...)
const hasPermission = computed(...)
```

### 常量

固定常量使用 `UPPER_SNAKE_CASE`：

```js
const STORAGE_KEY = 'rs_profile'
const MAX_FILE_SIZE = 1024 * 1024 * 1024
```

如果是页面内展示配置，也可以使用小驼峰数组：

```js
const quickLinks = [...]
const serviceCards = [...]
```

### 路由命名

路由 `path` 使用小写短横线或业务层级：

```text
/console/dashboard
/console/computing/basic
/console/computing/result/:taskId
```

路由 `name` 使用 `PascalCase`：

```js
name: 'RsDashboard'
name: 'RsAlgorithm'
name: 'MonitorJob'
```

### CSS / SCSS

类名建议使用语义化短横线：

```scss
.right-menu
.right-menu-item
.portal-home-entry
.theme-switch-wrapper
.dashboard-card
.task-status
```

页面根节点建议有一个页面级 class，避免样式串到别的页面：

```vue
<template>
  <div class="algorithm-service-page">
    ...
  </div>
</template>
```

### 事件处理函数

按钮事件建议用若依常见写法：

```js
handleQuery()
resetQuery()
handleAdd()
handleUpdate()
handleDelete()
handleExport()
handleDetail()
```

业务动作也可以更具体：

```js
runAlgorithm()
uploadSceneFile()
openResultViewer()
```

## 新增代码建议

新增一个业务页面时，建议同时补齐：

```text
src/views/模块名/页面名.vue
src/api/模块名/接口名.js
src/router/index.js 路由配置
必要时增加 src/stores/模块名.ts
```

新增一个若依后台管理页时，建议沿用若依风格：

```text
src/views/system/example/index.vue
src/api/system/example.js
```

新增一个遥感业务页面时，建议沿用当前业务风格：

```text
src/views/computing/NewAlgorithmPage.vue
src/api/computing/newAlgorithm.js
```

## 修改代码时的注意事项

- 改菜单入口：优先看 `src/router/index.js`。
- 改顶部右上角图标：优先看 `src/layout/components/Navbar.vue`。
- 改左侧菜单显示：看 `src/layout/components/Sidebar` 和路由 `meta`。
- 改按钮权限：看页面里的 `v-hasPermi`。
- 改接口地址：看 `src/api` 下对应模块文件。
- 改请求拦截、token、错误提示：看 `src/utils/request.js` 和 `src/utils/auth.js`。
- 改登录注册：看 `src/views/login.vue`、`src/views/register.vue`、`src/views/register.js`。

