"""
AI 教程助手 — LLM 服务层
支持 OpenAI 兼容 API，内置降级模式（无 API Key 时返回预设教程）
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional, AsyncGenerator

# 自动加载 .env 文件
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).parent / '.env'
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass

logger = logging.getLogger("ai_service")

# ── 平台知识库 System Prompt ──
SYSTEM_PROMPT = """你是"遥感卫星数据服务平台"的 AI 教程助手 🛰️。你的职责是帮助用户快速上手使用本平台。

## 平台核心功能

### 1. 数据中心（数据服务 → 数据中心）
- 浏览和检索多源卫星影像：哨兵二号(10m)、高分六号(2m)、高分七号(0.65m)、风云四号(500m)、Landsat-9(30m)
- 支持按卫星平台、传感器类型(光学/SAR/高光谱)、分辨率、采集日期、云量筛选
- 列表视图和卡片视图两种浏览模式
- 数据产品可加入购物车并下单订购

### 2. 算法服务（算法服务 → 基础算法）
9 种遥感处理算法：
- 辐射定标：DN值→辐射亮度值，支持绝对/相对定标
- 大气校正：基于6SV模型，消除大气散射与吸收
- 几何校正：RPC正射校正，DEM辅助定位
- 云检测：多光谱阈值法，输出云掩膜与覆盖率
- 影像裁剪：按ROI矩形区域提取子影像
- NDVI植被指数：归一化植被指数，评估植被覆盖度
- 光谱指数扩展：EVI/NDWI/SAVI/NDBI/RVI/GNDVI
- 影像镶嵌：多景无缝拼接，全局匀色
- 影像融合：Gram-Schmidt/PCA多光谱全色融合

### 3. AI 智能模型（算法服务 → AI 智能模型）
- 地物识别：语义分割，识别建筑/道路/森林/水体
- 目标检测：YOLOv8/Faster R-CNN，检测飞机/船舶/车辆
- 变化检测：ChangeFormer/Siamese网络，双时相分析
- 多模态融合：融合光学/SAR/高光谱数据
- 智能解译：视觉语言模型，影像描述与问答

### 4. 任务中心（工作台 → 任务中心）
- 查看所有计算任务的运行状态（排队中/处理中/已完成/失败）
- 查看任务进度百分比和耗时
- 下载已完成任务的结果文件（TIF/PNG）

### 5. 购物车与订单（数据服务 → 购物车 / 我的订单）
- 购物车管理数据产品
- 配置交付方式（HTTP下载/API）、数据格式（GeoTIFF/NetCDF）、投影（WGS84/UTM）
- 下单确认，查看历史订单

## 新用户使用流程（前几步）

第1步：注册账号 — 首页点击"免费注册"，填写用户名和密码
第2步：进入控制台 — 登录后点击顶部"进入控制台"按钮
第3步：浏览数据中心 — 左侧菜单"数据服务 → 数据中心"，查看在轨卫星和可用数据
第4步：检索数据 — 在筛选栏选择卫星平台、分辨率、日期等条件，点击"检索"
第5步：尝试算法服务 — "算法服务 → 基础算法"，选择NDVI等服务，配置参数，点击运行
第6步：查看结果 — 在"任务中心"查看计算进度，完成后可下载结果文件

## 回答规则
- 用中文回答，语气友好专业
- 涉及具体操作时，给出菜单路径（如：左侧菜单 → 数据服务 → 数据中心）
- 如果用户问的功能平台已有，详细说明操作步骤
- 如果用户问的功能平台暂不支持，诚实告知并建议替代方案
- 回答简洁，每次控制在 3-5 个要点
"""

# ── 预设教程问答（降级模式） ──
FALLBACK_QA = {
    '注册': '## 如何注册账号？\n\n1. 打开平台首页，点击右上角 **免费注册** 按钮\n2. 填写用户名和密码（密码至少6位）\n3. 点击「注册」按钮完成\n4. 注册成功后自动跳转到登录页\n\n> 新用户注册即送免费计算额度！',

    '登录': '## 如何登录？\n\n1. 点击首页右上角 **登录** 按钮\n2. 输入用户名和密码\n3. 点击「登录」\n4. 登录成功后，管理员会跳转到管理后台，普通用户进入控制台\n\n> 演示账号：demo / demo123',

    '数据中心': '## 如何使用数据中心？\n\n1. 左侧菜单：数据服务 → 数据中心\n2. 页面顶部有搜索栏，可直接搜索卫星、传感器、地理位置\n3. 使用筛选栏按以下条件筛选：\n   - 卫星平台（哨兵二号/高分六号/风云四号...）\n   - 传感器类型（光学/SAR/高光谱）\n   - 分辨率范围\n   - 采集日期\n   - 最大云量\n4. 点击「检索」查看结果\n5. 结果可以用列表或卡片视图浏览\n6. 点击「详情」查看单景数据，点击「订购」加入购物车\n\n> 目前平台展示 6 颗在轨卫星，156,800+ 景数据',

    'NDVI': '## 如何计算 NDVI 植被指数？\n\n1. 左侧菜单：算法服务 → 基础算法\n2. 在左侧「服务目录」选择 NDVI 植被指数\n3. 右侧配置参数：\n   - 数据源：选择卫星（哨兵二号/Landsat-9/高分六号...）\n   - 目标区域：选择区域（武汉/荆州/襄阳...）\n   - 输出格式：GeoTIFF（推荐）\n4. 可以切换「上传 TIF 文件」模式上传自己的影像\n5. 点击「开始 NDVI」按钮提交任务\n6. 等待几秒，结果面板会显示：\n   - NDVI 伪彩色预览图\n   - 统计信息（均值/标准差/植被覆盖比例）\n7. 点击「下载完整 TIF」保存结果\n\n> NDVI = (NIR - Red) / (NIR + Red)，取值范围 -1 到 1',

    '云检测': '## 如何运行云检测？\n\n1. 左侧菜单：算法服务 → 基础算法\n2. 选择云检测服务\n3. 调整检测阈值（默认0.15，越低越敏感）\n4. 可选择开启形态学处理（去噪+填充空洞）\n5. 点击运行\n6. 结果会显示：\n   - 云覆盖率百分比\n   - 云像素数 / 总像素数\n   - 分类（晴天/少云/多云/阴天）\n\n> 建议云量 < 10% 的影像用于定量分析',

    '任务': '## 如何查看任务进度？\n\n1. 左侧菜单：工作台 → 任务中心\n2. 页面显示所有已提交的计算任务\n3. 可按任务类型、状态、时间范围筛选\n4. 每行显示：任务名称、类型、状态、进度条、提交时间、耗时\n5. 操作按钮：\n   - 详情：查看任务完整信息\n   - 结果：查看/下载计算结果（完成后可用）\n   - 重提：失败的任务可重新提交\n6. 支持批量重提和批量删除\n\n> 简单算法（NDVI/裁剪）通常 3-5 秒完成',

    '购物车': '## 如何使用购物车和下单？\n\n1. 在数据中心浏览数据，点击「订购」加入购物车\n2. 左侧菜单：数据服务 → 购物车 查看已选数据\n3. 可全选/单选/删除购物车项\n4. 配置交付参数：\n   - 交付方式：HTTP 下载 / API 接口\n   - 数据格式：GeoTIFF / NetCDF\n   - 投影：WGS84 / UTM\n5. 点击「提交订单」确认\n6. 在我的订单中查看订单状态和下载链接\n\n> 部分公益卫星数据（风云系列）免费开放',

    'default': '## 欢迎使用遥感卫星数据服务平台！\n\n我是 AI 教程助手，可以帮你了解：\n\n- 如何检索卫星数据 — 数据中心使用指南\n- 如何运行算法 — NDVI、大气校正、云检测等\n- AI 模型应用 — 地物识别、目标检测、变化检测\n- 如何下单购买数据 — 购物车与订单管理\n\n新用户快速上手路径：\n1. 注册账号 → 2. 进入控制台 → 3. 浏览数据中心 → 4. 尝试算法服务\n\n直接输入你的问题，我会给出详细步骤！',
}


def get_config():
    """读取 AI 配置"""
    return {
        "api_base": os.getenv("AI_API_BASE", "https://api.openai.com/v1"),
        "api_key": os.getenv("AI_API_KEY", ""),
        "model": os.getenv("AI_MODEL", "gpt-4o-mini"),
    }


def is_configured() -> bool:
    """检查是否已配置 API Key"""
    cfg = get_config()
    return bool(cfg["api_key"])


async def chat(
    message: str,
    history: Optional[list[dict]] = None,
) -> str:
    """
    发送消息到 LLM，返回回复文本。
    如果未配置 API Key，使用降级模式返回预设教程。
    """
    # ── 降级模式 ──
    if not is_configured():
        return fallback_chat(message)

    # ── 真实 LLM 调用 ──
    cfg = get_config()

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=cfg["api_key"],
            base_url=cfg["api_base"],
        )

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        response = await client.chat.completions.create(
            model=cfg["model"],
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )

        return response.choices[0].message.content or "抱歉，AI 返回了空回复。"

    except ImportError:
        logger.warning("openai 库未安装，使用降级模式")
        return fallback_chat(message)
    except Exception as e:
        logger.error(f"LLM 调用失败: {e}")
        return f"AI 服务暂时不可用（{str(e)[:100]}）。\n\n以下是平台使用指南：\n\n" + fallback_chat(message)


async def chat_stream(
    message: str,
    history: Optional[list[dict]] = None,
) -> AsyncGenerator[str, None]:
    """
    流式聊天 — 返回 SSE 事件流
    """
    if not is_configured():
        # 降级模式也模拟流式输出
        text = fallback_chat(message)
        for char in text:
            yield char
        return

    cfg = get_config()

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=cfg["api_key"],
            base_url=cfg["api_base"],
        )

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        stream = await client.chat.completions.create(
            model=cfg["model"],
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    except ImportError:
        text = fallback_chat(message)
        for char in text:
            yield char
    except Exception as e:
        logger.error(f"流式调用失败: {e}")
        yield f"AI 服务暂时不可用: {str(e)[:100]}"


def fallback_chat(message: str) -> str:
    """
    降级模式：关键词匹配预设教程
    """
    msg_lower = message.lower()

    # 关键词匹配
    keywords = {
        "注册": ["注册", "注册账号", "signup", "register"],
        "登录": ["登录", "登陆", "login", "signin"],
        "数据中心": ["数据", "检索", "搜索", "卫星", "影像", "浏览"],
        "NDVI": ["ndvi", "植被", "指数"],
        "云检测": ["云检测", "云", "cloud"],
        "任务": ["任务", "进度", "task", "计算"],
        "购物车": ["购物车", "订单", "购买", "cart", "order", "下单"],
    }

    for key, words in keywords.items():
        if any(w in msg_lower for w in words):
            return FALLBACK_QA[key]

    return FALLBACK_QA["default"]


def get_suggestions() -> list[str]:
    """返回推荐问题列表"""
    return [
        "如何检索哨兵二号的卫星数据？",
        "怎么计算 NDVI 植被指数？",
        "如何查看我的计算任务进度？",
        "怎么把数据加入购物车并下单？",
        "平台支持哪些卫星和传感器？",
        "新用户注册后第一步该做什么？",
    ]
