"""
Cesium 3D 球体影像服务 API
GET  /api/v1/compute/imagery/{task_id}        — 渲染 PNG 影像
GET  /api/v1/compute/imagery/{task_id}/info   — 影像元数据（边界、服务类型等）
"""
import json
import os
from pathlib import Path
from datetime import datetime

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import ComputeTask, User
from auth import get_current_user

OUTPUT_DIR = Path(__file__).parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

MAX_DIM = 2048  # Cesium SingleTileImageryProvider 推荐最大纹理尺寸

router = APIRouter(prefix="/api/v1/compute", tags=["imagery"])


# ── 辅助函数 ──

def _read_geotiff(filepath: Path) -> dict | None:
    """读取 GeoTIFF，返回像素数据 + 地理边界。失败返回 None"""
    try:
        import rasterio
        with rasterio.open(filepath) as src:
            data = src.read(1).astype(np.float64)
            bounds = src.bounds  # (left, bottom, right, top)
            return {
                "data": data,
                "west": float(bounds.left),
                "south": float(bounds.bottom),
                "east": float(bounds.right),
                "north": float(bounds.top),
            }
    except Exception:
        return None


def _read_npy(filepath: Path) -> dict | None:
    """读取 .npy + .json 元数据，返回像素数据 + 地理边界。失败返回 None"""
    npy_path = filepath.with_suffix(".npy")
    json_path = filepath.with_suffix(".json")
    try:
        data = np.load(npy_path).astype(np.float64)
        if json_path.exists():
            with open(json_path) as f:
                meta = json.load(f)
            # 如果有 geo_bounds 字段则使用，否则用硬编码默认值
            geo = meta.get("geo_bounds", {})
            west = geo.get("west", 114.0)
            south = geo.get("south", 30.0)
            east = geo.get("east", 115.0)
            north = geo.get("north", 31.0)
            return {"data": data, "west": west, "south": south, "east": east, "north": north}
    except Exception:
        return None
    return None


def _load_result(filepath: str) -> dict | None:
    """统一加载影像结果（GeoTIFF 或 NPY）"""
    path = Path(filepath)
    if not path.exists():
        return None

    # 先尝试 GeoTIFF
    result = _read_geotiff(path)
    if result:
        return result

    # 再尝试 NPY
    npy = path.with_suffix(".npy")
    if npy.exists():
        return _read_npy(path)

    return None


def _downsample(data: np.ndarray, max_dim: int = MAX_DIM) -> np.ndarray:
    """如果影像尺寸超过 max_dim，按整数倍降采样"""
    h, w = data.shape
    if h <= max_dim and w <= max_dim:
        return data
    factor = max(int(h / max_dim), int(w / max_dim)) + 1
    return data[::factor, ::factor]


def _render_colormap(data: np.ndarray, service: str) -> np.ndarray:
    """
    根据服务类型应用伪彩色映射，返回 RGB uint8 数组 (H, W, 3)
    """
    from PIL import Image

    h, w = data.shape

    if service in ("ndvi", "spectral_index"):
        # NDVI 绿色系伪彩色映射（与前端 AlgorithmServicePage 一致）
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        rgb[(data < 0), :] = (30, 60, 180)
        rgb[(data >= 0) & (data < 0.15), :] = (180, 160, 140)
        rgb[(data >= 0.15) & (data < 0.3), :] = (230, 210, 80)
        rgb[(data >= 0.3) & (data < 0.5), :] = (100, 190, 60)
        rgb[(data >= 0.5) & (data < 0.7), :] = (20, 150, 30)
        rgb[(data >= 0.7), :] = (5, 90, 10)
        return rgb

    elif service == "cloud_detection":
        # 云检测: 白色=云, 黑色=晴空
        # cloud_detection 输出是 uint8 mask * 255
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        mask = data > 127
        rgb[mask, :] = (255, 255, 255)  # 白色云
        rgb[~mask, :] = (30, 30, 30)     # 暗色晴空
        # 对晴空区域加一点透明度效果（用暗色调示意）
        return rgb

    else:
        # 灰度拉伸（2%-98% 百分位）
        vmin = float(np.percentile(data, 2))
        vmax = float(np.percentile(data, 98))
        if vmax <= vmin:
            vmax = vmin + 1
        vis = ((data - vmin) / (vmax - vmin) * 255).clip(0, 255).astype(np.uint8)
        # 堆叠成 3 通道灰度 RGB
        return np.stack([vis, vis, vis], axis=-1)


def _generate_cesium_png(task_id: str, output_path: str, service: str) -> str | None:
    """为已完成任务生成 Cesium 兼容的 PNG 渲染图，返回文件名"""
    result = _load_result(output_path)
    if result is None:
        return None

    data = _downsample(result["data"], MAX_DIM)
    rgb = _render_colormap(data, service)

    from PIL import Image
    filename = f"{task_id}_cesium.png"
    filepath = OUTPUT_DIR / filename

    # 如果已存在且比源文件新，则跳过（缓存）
    src_mtime = os.path.getmtime(output_path)
    if filepath.exists() and os.path.getmtime(filepath) >= src_mtime:
        return filename

    Image.fromarray(rgb).save(filepath, "PNG")
    return filename


# ═══════════════════════════════════════════
#  影像元数据
# ═══════════════════════════════════════════
@router.get("/imagery/{task_id}/info")
def get_imagery_info(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """返回影像的元数据：边界、服务类型、尺寸等（不渲染影像）"""
    task = db.query(ComputeTask).filter(
        ComputeTask.task_id == task_id,
        ComputeTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(404, "任务不存在")
    if task.status != "completed":
        raise HTTPException(400, "任务尚未完成")
    if not task.output_path:
        raise HTTPException(404, "结果文件不存在")

    result = _load_result(task.output_path)
    if result is None:
        raise HTTPException(404, "无法读取结果影像文件")

    h, w = result["data"].shape
    out_h, out_w = min(h, MAX_DIM), min(w, MAX_DIM)
    scale_h, scale_w = h / out_h, w / out_w
    out_h = int(h / max(scale_h, scale_w))
    out_w = int(w / max(scale_h, scale_w))

    # 自动生成 Cesium PNG（如果尚未生成）
    cesium_file = OUTPUT_DIR / f"{task_id}_cesium.png"
    if not cesium_file.exists():
        _generate_cesium_png(task_id, task.output_path, task.service)

    image_url = f"/api/v1/compute/imagery-files/{task_id}_cesium.png" if cesium_file.exists() else ""

    # 解析统计信息
    stats = {}
    try:
        stats = json.loads(task.stats_json) if task.stats_json else {}
    except json.JSONDecodeError:
        pass

    return {
        "code": 0,
        "data": {
            "taskId": task_id,
            "service": task.service,
            "imageUrl": image_url,
            "west": result["west"],
            "south": result["south"],
            "east": result["east"],
            "north": result["north"],
            "width": out_w,
            "height": out_h,
            "originalWidth": w,
            "originalHeight": h,
            "colorMap": _get_colormap_type(task.service),
            "stats": stats,
        },
    }


def _get_colormap_type(service: str) -> str:
    """根据服务类型返回伪彩色类型标识"""
    if service in ("ndvi", "spectral_index"):
        return "ndvi"
    elif service == "cloud_detection":
        return "cloud"
    return "grayscale"


def _ndvi_color(value: float) -> list:
    """单个 NDVI 值 → RGB 颜色数组"""
    if value < 0:
        return [30, 60, 180]
    elif value < 0.15:
        return [180, 160, 140]
    elif value < 0.3:
        return [230, 210, 80]
    elif value < 0.5:
        return [100, 190, 60]
    elif value < 0.7:
        return [20, 150, 30]
    else:
        return [5, 90, 10]


# ═══════════════════════════════════════════
#  3D 柱状图采样端点
# ═══════════════════════════════════════════
@router.get("/imagery/{task_id}/points")
def get_imagery_points(
    task_id: str,
    grid: int = 64,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    将影像结果采样为网格点，返回 3D 柱状图数据。
    仅对 ndvi / spectral_index / cloud_detection 有意义。
    参数 grid: 网格密度（默认 64×64，最大值 128）
    """
    task = db.query(ComputeTask).filter(
        ComputeTask.task_id == task_id,
        ComputeTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(404, "任务不存在")
    if task.status != "completed":
        raise HTTPException(400, "任务尚未完成")
    if not task.output_path:
        raise HTTPException(404, "结果文件不存在")

    result = _load_result(task.output_path)
    if result is None:
        raise HTTPException(404, "无法读取结果影像文件")

    data = result["data"]
    h, w = data.shape

    # 限制网格密度
    grid = min(grid, 128)

    # 降采样到网格
    dh, dw = max(1, h // grid), max(1, w // grid)
    sampled = data[::dh, ::dw]
    sh, sw = sampled.shape

    # 生成经纬度网格
    lats = np.linspace(result["south"], result["north"], sh)
    lngs = np.linspace(result["west"], result["east"], sw)

    points = []
    is_index = task.service in ("ndvi", "spectral_index")

    for i in range(sh):
        for j in range(sw):
            val = float(sampled[i, j])
            if is_index:
                # NDVI/指数: 值域 [-1, 1]
                # 负值（水/云）不显示柱子，正值用非线性映射增强对比
                clamped = max(0, val)
                # 平方根映射 → 小值也能看到柱子，但大值明显更高
                height = clamped ** 0.6 * 15000  # 指数映射，最高 15000m
                # 加微小的随机抖动避免完全平坦
                height += np.random.uniform(0, 200)
                color = _ndvi_color(val)
            elif task.service == "cloud_detection":
                height = 6000 if val > 127 else 0
                color = [255, 255, 255] if val > 127 else [60, 60, 60]
            else:
                # 灰度数据：归一化 + Gamma 增强
                vmin, vmax = float(np.percentile(data, 1)), float(np.percentile(data, 99))
                if vmax <= vmin:
                    vmax = vmin + 1
                normalized = (val - vmin) / (vmax - vmin)
                # Gamma 0.5 → 拉大暗部差异
                enhanced = normalized ** 0.5
                height = enhanced * 10000
                # 热力色映射
                r = int(min(255, enhanced * 2 * 255))
                g = int(min(255, (1 - abs(enhanced - 0.5) * 2) * 255))
                b = int(min(255, (1 - enhanced) * 255))
                color = [r, g, b]

            points.append({
                "lng": round(float(lngs[j]), 6),
                "lat": round(float(lats[i]), 6),
                "value": round(val, 4),
                "height": round(height, 1),
                "color": color,
            })

    return {
        "code": 0,
        "data": {
            "taskId": task_id,
            "service": task.service,
            "grid": f"{sh}×{sw}",
            "west": result["west"],
            "south": result["south"],
            "east": result["east"],
            "north": result["north"],
            "points": points,
        },
    }


# ═══════════════════════════════════════════
#  渲染 Cesium PNG 影像
# ═══════════════════════════════════════════
@router.get("/imagery/{task_id}")
def render_imagery(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """为指定任务生成（或返回缓存的）Cesium 兼容 PNG 渲染图"""
    task = db.query(ComputeTask).filter(
        ComputeTask.task_id == task_id,
        ComputeTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(404, "任务不存在")
    if task.status != "completed":
        raise HTTPException(400, "任务尚未完成")
    if not task.output_path:
        raise HTTPException(404, "结果文件不存在")

    filename = _generate_cesium_png(task_id, task.output_path, task.service)
    if filename is None:
        raise HTTPException(500, "影像渲染失败")

    filepath = OUTPUT_DIR / filename
    return FileResponse(str(filepath), media_type="image/png")
