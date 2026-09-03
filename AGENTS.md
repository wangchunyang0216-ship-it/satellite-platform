# AGENTS.md — data-center-vue 交接说明

你正在维护 `E:\Projects\New_Project\data-center-vue`。当前 shell 默认目录可能是 `E:\Projects\New_Project\satellite-platform`，但用户真正要改的是 `data-center-vue`。操作文件时优先使用绝对路径，避免改错项目。
 
## px 转 vw（postcss-px-to-viewport）

已接入 `postcss-px-to-viewport@1.1.1`，把遥感业务页面 px 转成 vw（1920 设计稿），只影响遥感业务，排除 Element Plus / Cesium / Leaflet / RuoYi 框架样式。

- 配置：`postcss.config.cjs`（用 `.cjs` 是因为 package.json 是 `"type": "module"`）。
- 关键坑：`vite.config.js` 里不能再写内联 `css.postcss`——Vite 6 只要存在内联对象就会完全忽略 `postcss.config.cjs`。原来的 charset-removal 插件已并入 `postcss.config.cjs`，`vite.config.js` 里的内联 postcss 已删除。
- 排除机制：`/node_modules/i`（三方库）+ `selectorBlackList`（`.el-`/`.cesium-`/`.leaflet-` 等）+ `exclude` 正则（ruoyi/sidebar 等框架 scss）。
- `minPixelValue: 1` + `propList` 里 `!border`/`!border-width`/`!box-shadow`，保证 1px 边框不转。
- `rs-theme.scss`（遥感主题，含 `--el-*` 字号变量）在转换范围内，会导致 Element Plus 组件字号随视口缩放——这是有意为之；若想让 EP 组件固定字号需额外排除。

## 用户偏好

- 用户要直接、明确、少废话。
- 不要长篇解释“方案”，除非用户问原因。
- 用户经常说“改吧”“执行吧”，通常意味着允许你直接改代码并验证。
- 回答要告诉他：改了哪里、怎么刷新/启动、是否构建通过。

## 项目定位

这是 Shur/RuoYi 风格 Vue 后台框架 + 遥感卫星数据服务平台 Demo + Python FastAPI 算法后端的整合项目。

关键事实：

- 前端：Vue 3 + Vite + Element Plus。
- 后端算法服务：`backend/`，Python FastAPI，端口 `8766`。
- Java Spring Cloud 不是当前算法服务依赖。
- Python 后端和 Vue 前端放在同仓库统一管理，但运行时是两个进程。

## 常用命令

前端：

```powershell
cd E:\Projects\New_Project\data-center-vue
npm.cmd run dev
npm.cmd run build:prod
```

后端：

```powershell
cd E:\Projects\New_Project\data-center-vue\backend
.\.venv\Scripts\python.exe main.py
```

如果没有 venv：

```powershell
cd E:\Projects\New_Project\data-center-vue\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```

Windows 下优先使用 `npm.cmd`，不要只写 `npm`。

## 提交代码流程

提交前先确认当前仓库和改动范围：

```powershell
cd E:\Projects\New_Project\data-center-vue
git status --short
```

如果本次任务需要把当前所有改动保存到 Git 工作区并提交：

```powershell
git add -A
git commit -m "feat: update remote sensing platform UI and console"
```
最后还要有一个git push

提交后确认工作区状态和最新提交：

```powershell
git status --short
git log -1 --oneline
```

如果用户只要求提交某几个文件，不要 `git add -A`，改用明确文件路径，例如：

```powershell
git add src/views/login.vue src/assets/styles/login.scss
git commit -m "style: refine login page"
```

## 重要路由

门户：

- `/rs/home` 官网首页。
- `/rs/guide` 使用说明文档。

控制台：

- `/index` 登录后的控制台首页，显示 `src/views/console/DashboardPage.vue`。
- `/console` 仍可访问控制台首页，但侧边栏已隐藏“遥感平台/控制台”这一重复菜单项。
- `/console/data` 数据中心。
- `/console/data/satellite/:satelliteId` 单卫星数据页。
- `/console/computing/basic` 算法服务。
- `/console/computing/basic/intro/:serviceId` 算法介绍（9 个算法服务各自跳转页）。
- `/console/computing/models` 智能计算中心（算法服务 + 遥感大模型入口）。
- `/console/computing/models/recognition` 地物识别。
- `/console/computing/models/detection` 目标检测。
- `/console/computing/models/change-detection` 变化检测。
- `/console/computing/models/multimodal-fusion` 多模态融合。
- `/console/tasks` 任务中心。
- `/console/computing/result/:taskId` 单任务 3D 结果。

系统菜单：

- `/system`
- `/monitor`
- `/tool`
- `/rs-admin`

## 已做关键改动

### 1. backend 集成

`backend/` 已放入 Python FastAPI 算法服务。

重要文件：

- `backend/main.py`
- `backend/compute_routes.py`
- `backend/models.py`
- `backend/database.py`
- `backend/auth.py`

后端当前支持：

- demo fallback 鉴权，避免接口 403。
- 任务上传/运行/列表。
- 任务名称 `task_name`。
- 启动时自动给旧 SQLite 表补 `task_name` 字段。
- 任务重命名接口：`PATCH /api/v1/compute/task/{task_id}/name`。

不要提交：

- `backend/outputs/`
- `backend/test_data/`
- `backend/uploads/`
- `backend/data.db`
- `backend/.venv/`
- `backend/__pycache__/`

### 2. 数据中心逻辑

相关文件：

- `src/views/portal/DataCatalogPage.vue`
- `src/views/portal/SatelliteDataPage.vue`
- `src/views/portal/DataDetailPage.vue`
- `src/data/satelliteCatalog.ts`

当前逻辑：

- 数据中心首页只显示搜索和卫星舰队。
- 不直接把所有影像数据铺在数据中心首页。
- 搜索后只显示匹配卫星，如“风云”会出现风云相关卫星。
- 点击卫星后跳到单卫星页面。
- 单卫星页面顶部 tabs/tag 标题显示具体卫星名。

用户曾特别强调：不要乱改全局背景，只改数据中心顶部 hero 背景。

### 3. 首页逻辑

相关文件：

- `src/views/home/HomePage.vue`
- `src/views/home/UserGuidePage.vue`
- `src/layout/components/Navbar.vue`
- `src/views/login.vue`
- `src/views/register.vue`

当前状态：

- `/rs/home` 是遥感平台官网首页。
- 首页导航在“产品”“解决方案”旁新增“使用说明文档”。
- Navbar 右上角源码地址、文档地址图标已删除。
- 登录页已改成左右两栏：左侧平台宣传指导/服务规范/数据模板/办理指南，右侧用户登录表单。
- 登录页保留原有 `userStore.login()`、记住密码、滑块验证码、redirect 跳转逻辑。
- 登录页新增管理员/普通用户演示账号快捷填充。
- 注册页已改成左右两栏，左侧注册办理流程，右侧基础注册表单。
- 注册页支持 `企业注册 / 个人注册` 切换。
- 企业注册字段保留基础账号信息与组织机构基础信息，提交按钮文案为 `提交组织机构注册申请`。
- 个人注册字段保留手机号、邮箱、昵称、密码等基础信息。
- 更完整的个人/组织信息放到个人中心补全，不在注册页一次性填完。
- 注册提交仍兼容当前后端 `/auth/register`：核心字段为 `username/password/email/company`，额外资料放在 `accountType/profile/phone` 中。

### 4. 菜单/路由

相关文件：

- `src/router/index.js`
- `src/permission.js`
- `src/store/modules/permission.js`

当前状态：

- `/console/**` 和 `/rs-admin/**` 加入白名单/本地路由逻辑。
- `/index` 已改为控制台 Dashboard，不再自动跳 `/rs/home`。
- 右上角 Navbar 放大镜左侧有“平台首页”图标按钮，点击跳 `/rs/home`。
- 前端临时补了完整本地菜单：系统管理、系统监控、系统工具。
- `ensureLocalSidebarRouters()` 用于补本地菜单。
- `uniqueRoutesByPath()` 用于避免左侧菜单重复。

### 5. 任务中心

相关文件：

- `src/views/computing/TaskCenterPage.vue`

当前状态：

- 任务列表表格已铺满，单元格加大。
- 任务 ID 不再挤成两行。
- 状态后加了操作栏。
- 已完成任务可以“查看结果”，跳 `/console/computing/result/:taskId`。
- 未完成任务显示查看进度/状态类操作。

### 6. 算法服务页

相关文件：

- `src/views/computing/AlgorithmServicePage.vue`
- `src/views/computing/Result3DViewer.vue`
- `src/composables/useCesiumLayers.ts`
- `src/api/compute.ts`

当前状态：

- 创建算法任务弹窗顶部有“任务名称”输入框。
- 用户不填写任务名时，后端自动命名，例如 `辐射定标-01-0827-0642`。
- 结果图层支持关键词、算法类型、时间筛选。
- 右侧结果图层面板可拖拽改变宽度。
- 右侧结果图层面板可整体收起/展开。
- 最多同时叠加 5 个 TIF 图层。
- 任务结果列表默认显示 5 个任务。
- Cesium 地图顶部工具条已改为图标按钮：环绕、复位、加载前五个、清空图层，悬浮显示功能名。
- `加载前五个` 只加载当前筛选结果中未加载的前 5 个任务。
- 超过 5 个任务时，底部显示醒目的蓝色按钮：`展开剩余 N 个任务`。
- 展开后按钮显示 `收起任务`。
- 页面混入了几个 mock 任务，用来让演示显得任务更多。

注意：mock 任务是展示用。如果用户点击 mock 任务加载 TIF 失败，优先处理方式是禁用 mock 任务的“加载”按钮或给 mock 任务接一个固定可用的演示影像，不要让它假装真实后端数据。

### 7. 智能计算中心（九个算法服务跳转页 + 遥感大模型）

智能计算中心首页（`/console/computing/models`）是「算法服务（9 个）+ 遥感大模型（4 个）」两个卡片区的入口页。

相关文件：

- `src/views/computing/ComputingHubPage.vue` — 智能计算中心首页。
- `src/views/computing/AlgorithmIntroPage.vue` — 算法介绍页（9 个算法服务共用的跳转详情页）。
- `src/views/computing/AlgorithmServicePage.vue` — 算法服务功能使用页（路由 `/console/computing/basic`）。
- `src/views/computing/models/RecognitionPage.vue` — 地物识别（遥感大模型）。
- `src/views/computing/models/TargetDetectionPage.vue` — 目标检测。
- `src/views/computing/models/ChangeDetectionPage.vue` — 变化检测。
- `src/views/computing/models/MultiModalFusionPage.vue` — 多模态融合。
- `src/components/common/PageHeader.vue` — 四个大模型详情页的统一页头组件。
- `src/router/index.js` — 相关路由集中在 `/console` 下。

跳转关系：

- `ComputingHubPage.vue`：
  - `basic[]` 数组（约 76-86 行）定义 9 个算法服务，点击 `goAlgorithmIntro()` 跳 `/console/computing/basic/intro/:serviceId?title=名字`。
  - `models[]` 数组（约 90-95 行）定义 4 个遥感大模型，点击 `go(route)` 跳到各自详情页。
- `AlgorithmIntroPage.vue`：
  - `intros` 字典（约 92-228 行）按 `serviceId` 存 9 套介绍文案。
  - 顶部「返回智能计算中心」→ `/console/computing/models`。
  - 「进入功能使用」→ `/console/computing/basic?service=:id`。
- `AlgorithmServicePage.vue`：`services` 数组（约 263 行）定义同一批 9 个服务。

九个算法服务（id / 名称 / 类别）：

| id | 名称 | 类别 |
|---|---|---|
| calibration | 辐射定标 | 辐射校正 |
| atmospheric | 大气校正 | 辐射校正 |
| geometric | 几何校正 | 几何校正 |
| cloud_detection | 云检测 | 影像预处理 |
| clip | 影像裁剪 | 影像预处理 |
| ndvi | NDVI 植被指数 | 指数计算 |
| spectral_index | 光谱指数扩展 | 指数计算 |
| mosaic | 影像镶嵌 | 影像处理 |
| fusion | 影像融合 | 影像处理 |

四个遥感大模型详情页（都在 `src/views/computing/models/`）：

| 页面 | 路由 | 模型 |
|---|---|---|
| 地物识别 | `/console/computing/models/recognition` | U-Net++ / DeepLabV3+ / SegFormer |
| 目标检测 | `/console/computing/models/detection` | YOLOv8 / Faster R-CNN / DETR |
| 变化检测 | `/console/computing/models/change-detection` | ChangeFormer / Siamese / BIT |
| 多模态融合 | `/console/computing/models/multimodal-fusion` | Cross-Attention Mamba / Transformer / CNN |

注意：

- 这 9 个服务的 `id` 在三处出现，必须保持一致：`ComputingHubPage.vue` 的 `basic[]`、`AlgorithmIntroPage.vue` 的 `intros`、`AlgorithmServicePage.vue` 的 `services` 和 `serviceLabel`。改一处要同步另外几处。
- `ComputingHubPage.vue` 的 `basic[]` 里 `route` 字段虽写 `/console/computing/basic`，但卡片点击实际走 `goAlgorithmIntro()` 跳介绍页，`route` 字段当前没直接用于跳转。
- 四个大模型详情页目前是带参数表单 + 本地 mock 结果（`run()` 里 `setTimeout`，未接真实后端）；只有 `AlgorithmServicePage` / `Result3DViewer` / `TaskCenterPage` 真正调用了 `@/api/compute`。

### 8. UI/UX Pro Max skill

已通过官方 CLI 接入 `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`：

```powershell
npx.cmd ui-ux-pro-max-cli init --ai codex --global
```

安装位置：

```text
C:\Users\123\.agents\skills\
```

当前已安装 skill：

- `ui-ux-pro-max`
- `ui-styling`
- `design`
- `design-system`
- `brand`
- `banner-design`
- `slides`

查看本机已安装 skills：

```powershell
Get-ChildItem C:\Users\123\.agents\skills -Directory | Select-Object -ExpandProperty Name
```

查看 `ui-ux-pro-max` 使用说明：

```powershell
Get-Content -Raw C:\Users\123\.agents\skills\ui-ux-pro-max\SKILL.md
```

本地查询设计建议示例：

```powershell
python C:\Users\123\.agents\skills\ui-ux-pro-max\scripts\search.py "satellite data login page enterprise form" --design-system --stack vue
```

在对话中触发方式：

```text
使用 ui-ux-pro-max 帮我优化这个登录页
```

说明：

- 新会话/重启 Codex 面板后会重新扫描 skills，最稳。
- 当前会话如果系统已刷新到 skills 列表，也可以直接点名 `ui-ux-pro-max` 使用。
- 如果用户问“必须新开会话吗”，回答：不一定；当前能看到 skill 时不用新开，识别不到时再新开。

## 最近一次用户关注点

用户最近要求：

> 现在修改登录和注册界面，把注册登录界面分为左右两栏，类似截图的系统那样，注册时分企业和个人，这个注册登录做的全面一点

已经处理：

- `src/views/login.vue` 双栏重做，修复旧文件中文乱码，保留原登录/验证码逻辑。
- `src/views/register.vue` 双栏重做，增加企业/个人注册切换和更完整字段。
- `npm.cmd run build:prod` 构建通过。
- 开发服务用 `npm.cmd run dev -- --host 0.0.0.0 --port 3000` 启动成功。

此前用户要求：

> 右侧结果图层要占满屏幕，默认显示五个任务，底部展开/收起按钮明显一点。

已经处理：

- `DEFAULT_VISIBLE_LAYER_TASKS = 5`
- `.lp-list` 占满右侧面板剩余高度。
- `.lp-item` 间距和卡片感增强。
- `.lp-more` 改成明显蓝色渐变大按钮。

修改位置：`src/views/computing/AlgorithmServicePage.vue`

## 验证状态

最近多次运行：

```powershell
npm.cmd run build:prod
```

构建通过。

## 常见坑

1. 当前 Codex 工作目录可能不是目标仓库。
   - 目标仓库是 `E:\Projects\New_Project\data-center-vue`。
   - 不要误改 `E:\Projects\New_Project\satellite-platform`。

2. PowerShell 执行 npm 脚本。
   - 用 `npm.cmd`。

3. 后端任务名称输入框看不到。
   - 先确认前端已重启/强刷。
   - 再确认打开的是 `data-center-vue`，不是旧项目。

4. 403 Forbidden。
   - 确认启动的是 `data-center-vue/backend/main.py`。
   - 确认后端代码包含 demo fallback。
   - 重启 Python 后端。

5. 乱码问题。
   - 部分旧文件曾出现中文乱码显示，但当前关键页面源码已经能看到正常中文。
   - 写文件时使用 UTF-8。

## 交接建议

新上下文窗口开始后，先读：

1. `E:\Projects\New_Project\data-center-vue\AGENTS.md`
2. `E:\Projects\New_Project\data-center-vue\README.md`
3. 当前用户截图或最新要求

然后再改代码。不要重新推翻已有结构。
