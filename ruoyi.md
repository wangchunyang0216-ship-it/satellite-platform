# 若依前端代码查找说明

本文档用于在当前 `data-center-vue` 项目中快速定位若依框架相关页面、路由、接口和公共模块。

## 项目基础

- 前端框架：Vue 3 + Vite + Vue Router + Pinia + Element Plus
- 路由入口：`src/router/index.js`
- 权限守卫：`src/permission.js`
- 登录态工具：`src/utils/auth.js`
- 请求封装：`src/utils/request.js`
- 若依页面目录：`src/views/system`、`src/views/monitor`、`src/views/tool`
- 若依接口目录：`src/api/system`、`src/api/monitor`、`src/api/tool`

查找页面时优先从 `src/router/index.js` 里看菜单路由，路由里的 `component: () => import(...)` 就是对应的 Vue 页面文件。

## 系统管理 - 操作日志

菜单路由在：

```js
// src/router/index.js
{
  path: '/system',
  children: [
    {
      path: 'operlog',
      component: () => import('@/views/system/operlog/index.vue'),
      name: 'SystemOperlog',
      meta: { title: '操作日志', icon: 'log' }
    }
  ]
}
```

访问路径：

```text
/system/operlog
```

前端页面文件：

- `src/views/system/operlog/index.vue`：操作日志列表页，包含查询表单、表格、删除、清空、导出、详情入口。
- `src/views/system/operlog/detail.vue`：操作日志详情弹窗组件。

接口文件：

- `src/api/system/operlog.js`

主要接口：

```js
GET    /system/operlog/list
DELETE /system/operlog/{operId}
DELETE /system/operlog/clean
```

导出接口在页面内通过公共下载方法调用：

```js
proxy.download("system/operlog/export", ...)
```

## 系统监控 - 定时任务

菜单路由在：

```js
// src/router/index.js
{
  path: '/monitor',
  children: [
    {
      path: 'job',
      component: () => import('@/views/monitor/job/index.vue'),
      name: 'MonitorJob',
      meta: { title: '定时任务', icon: 'job' }
    },
    {
      path: 'job-log',
      component: () => import('@/views/monitor/job/log.vue'),
      name: 'MonitorJobLog',
      hidden: true,
      meta: { title: '调度日志', activeMenu: '/monitor/job' }
    },
    {
      path: 'job-detail/:jobId',
      component: () => import('@/views/monitor/job/detail.vue'),
      name: 'MonitorJobDetail',
      hidden: true,
      meta: { title: '任务详情', activeMenu: '/monitor/job' }
    }
  ]
}
```

访问路径：

```text
/monitor/job
```

前端页面文件：

- `src/views/monitor/job/index.vue`：定时任务列表页，包含查询、新增、修改、删除、执行一次、状态切换、Cron 表达式选择、日志入口。
- `src/views/monitor/job/log.vue`：调度日志列表页。
- `src/views/monitor/job/detail.vue`：任务详情页。

接口文件：

- `src/api/monitor/job.js`
- `src/api/monitor/jobLog.js`

主要接口：

```js
GET    /schedule/job/list
GET    /schedule/job/{jobId}
POST   /schedule/job
PUT    /schedule/job
DELETE /schedule/job/{jobId}
PUT    /schedule/job/changeStatus
PUT    /schedule/job/run

GET    /schedule/job/log/list
DELETE /schedule/job/log/{jobLogId}
DELETE /schedule/job/log/clean
```

注意：当前项目的定时任务接口前缀是 `/schedule/job`，不是若依常见的 `/monitor/job`。

## 若依前端目录速查

### 系统管理

目录：

```text
src/views/system
src/api/system
```

常见页面对应关系：

| 菜单 | 页面 | API |
| --- | --- | --- |
| 用户管理 | `src/views/system/user/index.vue` | `src/api/system/user.js` |
| 角色管理 | `src/views/system/role/index.vue` | `src/api/system/role.js` |
| 菜单管理 | `src/views/system/menu/index.vue` | `src/api/system/menu.js` |
| 部门管理 | `src/views/system/dept/index.vue` | `src/api/system/dept.js` |
| 岗位管理 | `src/views/system/post/index.vue` | `src/api/system/post.js` |
| 字典管理 | `src/views/system/dict/index.vue` | `src/api/system/dict/type.js` |
| 字典数据 | `src/views/system/dict/data.vue` | `src/api/system/dict/data.js` |
| 参数设置 | `src/views/system/config/index.vue` | `src/api/system/config.js` |
| 通知公告 | `src/views/system/notice/index.vue` | `src/api/system/notice.js` |
| 操作日志 | `src/views/system/operlog/index.vue` | `src/api/system/operlog.js` |
| 登录日志 | `src/views/system/logininfor/index.vue` | `src/api/system/logininfor.js` |

### 系统监控

目录：

```text
src/views/monitor
src/api/monitor
```

常见页面对应关系：

| 菜单 | 页面 | API |
| --- | --- | --- |
| 在线用户 | `src/views/monitor/online/index.vue` | `src/api/monitor/online.js` |
| 定时任务 | `src/views/monitor/job/index.vue` | `src/api/monitor/job.js` |
| 调度日志 | `src/views/monitor/job/log.vue` | `src/api/monitor/jobLog.js` |
| 任务详情 | `src/views/monitor/job/detail.vue` | `src/api/monitor/job.js` |

### 系统工具

目录：

```text
src/views/tool
src/api/tool
```

常见页面：

| 菜单 | 页面 |
| --- | --- |
| 表单构建 | `src/views/tool/build/index.vue` |
| 代码生成 | `src/views/tool/gen/index.vue` |

## 查找方法

1. 先在 `src/router/index.js` 搜菜单名称，例如 `操作日志`、`定时任务`。
2. 找到路由里的 `component` 字段，得到页面路径。
3. 进入页面文件，看顶部或 `<script setup>` 里的 `import ... from "@/api/..."`。
4. 打开对应 API 文件，确认真实后端接口地址。
5. 如果按钮显示不出来，检查页面里的 `v-hasPermi` 权限标识，以及当前用户权限数据。

常用命令：

```bash
rg "操作日志|定时任务" src/router src/views src/api
rg "system:operlog|monitor:job|schedule/job" src
```

## 常见公共模块

- `src/layout`：若依后台布局、侧边栏、顶部栏、标签栏。
- `src/store/modules/user.js`：用户信息、角色、权限、登录退出。
- `src/store/modules/permission.js`：动态路由和侧边栏菜单生成。
- `src/directive/permission/hasPermi.js`：按钮级权限指令 `v-hasPermi`。
- `src/components`：公共组件，如分页、右侧工具栏、字典标签、文件上传、图标选择等。
- `src/assets/styles`：全局样式和主题样式。

