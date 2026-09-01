# 遥感卫星数据服务平台（data-center-vue）

本项目是在 Shur / RuoYi 风格 Vue 后台框架基础上，集成遥感卫星数据服务平台页面 Demo 与 Python 遥感算法服务后端后的前端工程。

当前定位要说清楚：

- 前端框架：Vue 3 + Vite + Element Plus + Shur/RuoYi 后台布局。
- 遥感算法后端：`backend/` 下的 Python FastAPI 服务，默认端口 `8766`。
- 二者放在同一个仓库里统一管理，但运行时仍是两个独立进程。
- Java Spring Cloud 后端不是本次遥感算法服务的运行依赖；当前遥感平台页面主要走本地路由、前端 Demo 数据和 Python FastAPI 接口。

## 主要页面

### 登录与注册入口

这些入口已加入前端白名单，可直接访问：

- `/login`：登录页面。
- `/register`：注册页面。

本地开发默认地址示例：

- `http://localhost:80/login`
- `http://localhost:80/register`

### 官网入口

- `/rs/home`：遥感卫星数据服务平台官网首页。
- `/rs/guide`：平台使用说明文档。

如果你登录后进入的是 Shur 默认首页，可以手动访问 `/rs/home` 查看门户首页。

### 控制台入口

- `/console`：遥感平台控制台。
- `/console/data`：数据中心。
- `/console/data/satellite/:satelliteId`：单颗卫星数据页面。
- `/console/computing`：算法服务入口。
- `/console/computing/tasks`：任务中心。
- `/console/computing/result/:taskId`：单任务 3D 结果查看。

### 后台管理入口

- `/rs-admin`：遥感管理。
- `/system`：系统管理，本地临时菜单。
- `/monitor`：系统监控，本地临时菜单。
- `/tool`：系统工具，本地临时菜单。

这些系统菜单主要是为了保留 Shur/RuoYi 原框架的目录结构，部分页面仍依赖原后端接口。

## 启动方式

### 1. 启动 Python 遥感算法后端

在项目根目录执行：

```powershell
cd E:\Projects\New_Project\data-center-vue\backend
.\.venv\Scripts\python.exe main.py
```

如果没有虚拟环境，可先安装依赖：

```powershell
cd E:\Projects\New_Project\data-center-vue\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```

启动成功后应看到：

```text
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8766
```

健康检查：

```text
http://localhost:8766/api/health
```

### 2. 启动前端

```powershell
cd E:\Projects\New_Project\data-center-vue
npm.cmd install
npm.cmd run dev
```

生产构建验证：

```powershell
npm.cmd run build:prod
```

Windows PowerShell 下如果 `npm` 被策略拦截，使用 `npm.cmd`。

## 代理与接口

Vite 开发代理已配置：

- `/api` -> `http://localhost:8766`
- `/ws` -> `ws://localhost:8766`

所以前端请求 `/api/v1/compute/...` 会转发到 Python FastAPI 后端。

## 当前已集成功能

### 数据中心

- 数据中心顶部只保留搜索/选择卫星的逻辑。
- 搜索后只展示匹配卫星结果，例如搜索“风云”会匹配风云系列卫星。
- 点击某一颗卫星后进入独立页面展示该卫星介绍和影像数据。
- 数据中心顶部背景色按首页暗蓝风格调整，但只改数据中心顶部 hero 区域。

相关文件：

- `src/views/portal/DataCatalogPage.vue`
- `src/views/portal/SatelliteDataPage.vue`
- `src/views/portal/DataDetailPage.vue`
- `src/data/satelliteCatalog.ts`

### 首页

- 官网首页为遥感卫星数据服务平台首页。
- 顶部导航已新增“使用说明文档”。
- 右上角原 Shur 的“源码地址”“文档地址”图标已删除。

相关文件：

- `src/views/home/HomePage.vue`
- `src/views/home/UserGuidePage.vue`
- `src/layout/components/Navbar.vue`

### 算法服务

- 算法服务页面接入 Cesium 3D 可视化。
- 创建算法任务时支持填写任务名称；不填写则后端自动生成名称。
- 任务支持按算法类型、任务名称/ID、时间筛选。
- 右侧结果图层支持拖拽调整宽度。
- 右侧结果图层支持整体收起/展开。
- 同时最多叠加 5 个 TIF 结果图层。
- 结果任务列表默认显示 5 个任务，超过 5 个时底部显示“展开剩余 N 个任务 / 收起任务”。
- 为了演示任务数量，页面底部混入了若干 mock 任务；真实任务来自后端。

相关文件：

- `src/views/computing/AlgorithmServicePage.vue`
- `src/views/computing/TaskCenterPage.vue`
- `src/views/computing/Result3DViewer.vue`
- `src/composables/useCesiumLayers.ts`
- `src/api/compute.ts`

### Python 后端

- `backend/` 已集成 FastAPI 算法服务。
- 支持任务创建、上传、列表、重命名、结果预览等接口。
- `compute_tasks` 表已追加 `task_name` 字段，老数据库启动时会自动补字段。
- 本地开发环境允许 demo fallback 鉴权，避免前端访问接口一直 403。

相关文件：

- `backend/main.py`
- `backend/compute_routes.py`
- `backend/models.py`
- `backend/database.py`
- `backend/auth.py`

## 不要提交的文件

这些是运行时产物或大文件，不应提交：

```text
backend/outputs/
backend/test_data/
backend/uploads/
backend/data.db
backend/__pycache__/
backend/.venv/
dist/
node_modules/
```

## 常见问题

### 1. Git Bash 里 Anaconda Python 路径报 command not found

错误写法：

```bash
C:\ProgramData\anaconda3\python.exe -m pip install -r requirements.txt
```

Git Bash 中应写成：

```bash
/c/ProgramData/anaconda3/python.exe -m pip install -r requirements.txt
```

PowerShell 中才使用：

```powershell
C:\ProgramData\anaconda3\python.exe -m pip install -r requirements.txt
```

### 2. pip 提示 numpy / pillow 依赖冲突

这是 base 环境包冲突，建议使用 `backend/.venv` 虚拟环境，不要污染 Anaconda base。

### 3. Python 后端 403 Forbidden

之前是鉴权问题，当前 `backend/auth.py` 已做 demo fallback。若仍出现 403：

- 确认启动的是 `data-center-vue/backend/main.py`。
- 确认后端已重启。
- 确认前端代理打到 `localhost:8766`。

### 4. 创建任务不显示任务名称输入框

任务名称输入框在算法服务弹窗顶部。若看不到：

- 重启前端开发服务。
- 浏览器强制刷新。
- 确认当前访问的是 `data-center-vue` 的前端，不是旧 `satellite-platform` 页面。

## 当前建议

新开上下文后，优先读取 `AGENTS.md`。里面记录了当前工程的关键修改点、启动方式、注意事项和下一步风险点。
