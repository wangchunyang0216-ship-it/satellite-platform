"""
算法服务 API 路由
POST   /api/v1/compute/run        — 提交计算任务
GET    /api/v1/compute/tasks      — 历史任务列表
GET    /api/v1/compute/task/{id}  — 任务状态与结果
GET    /api/v1/compute/download/{task_id} — 下载结果文件
"""
import json
import uuid
import threading
from datetime import datetime

import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database import get_db, SessionLocal
from models import User, ComputeTask
from auth import get_current_user
from compute_engine import (
    run_compute, SERVICE_MAP, OUTPUT_DIR,
    run_calibration, run_atmospheric_correction, run_geometric_correction,
    run_ndvi, run_cloud_detection, run_clip, run_spectral_index,
    run_mosaic, run_fusion,
)

OUTPUT_DIR = Path(__file__).parent / "outputs"


# ── 辅助函数 ──
MAX_DIM = 2048  # 超过此尺寸自动降采样，避免内存溢出

def _downsample(data: "np.ndarray", max_dim: int = MAX_DIM) -> "np.ndarray":
    """如果影像尺寸超过 max_dim，按整数倍降采样"""
    import numpy as np
    h, w = data.shape
    if h <= max_dim and w <= max_dim:
        return data
    factor = max(int(h / max_dim), int(w / max_dim)) + 1
    return data[::factor, ::factor]

def _save_band_preview(data: "np.ndarray", task_id: str, label: str):
    """把波段数据保存为灰度 PNG 预览，返回 URL 路径"""
    import numpy as np
    try:
        from PIL import Image
        # 先降采样，避免在超大影像上创建 PIL Image
        data = _downsample(data, 1024)
        vmin, vmax = float(np.percentile(data, 2)), float(np.percentile(data, 98))
        if vmax <= vmin:
            vmax = vmin + 1
        vis = ((data - vmin) / (vmax - vmin) * 255).clip(0, 255).astype(np.uint8)

        h, w = data.shape
        thumb_h = min(h, 360)
        thumb_w = int(w * thumb_h / h)

        pil_img = Image.fromarray(vis)
        pil_thumb = pil_img.resize((thumb_w, thumb_h), Image.LANCZOS)

        path = OUTPUT_DIR / f"{task_id}_{label}_thumb.png"
        pil_thumb.save(path)
        return f"/api/v1/compute/preview/{path.name}"
    except Exception:
        return ""


router = APIRouter(prefix="/api/v1/compute", tags=["compute"])


# ── 请求模型 ──
class ComputeRunRequest(BaseModel):
    service: str = Field(..., description="服务类型: calibration/atmospheric/geometric/ndvi/mosaic/fusion")
    params: dict = Field(default_factory=dict, description="服务参数")


# ── 响应模型 ──
class ApiResponse(BaseModel):
    code: int = 0
    message: str = "ok"
    data: dict | None = None


# ── 后台执行 ──
def _run_in_background(service: str, params: dict, task_id: str):
    """在后台线程中执行计算，完成后更新数据库"""
    db = SessionLocal()
    try:
        task = db.query(ComputeTask).filter(ComputeTask.task_id == task_id).first()
        if not task:
            return

        task.status = "running"
        task.progress = 10
        db.commit()

        result = run_compute(service=service, params=params, task_id=task_id)

        task.status = result.get("status", "completed")
        task.progress = 100
        task.output_path = result.get("output_path", "")
        task.stats_json = json.dumps(result.get("stats", {}), ensure_ascii=False)
        task.elapsed_sec = int(result.get("elapsed_sec", 0) * 1000)
        task.completed_at = datetime.utcnow()
        db.commit()

        # 自动生成 Cesium 3D PNG
        try:
            from imagery_routes import _generate_cesium_png as gen_png
            gen_png(task_id, task.output_path, service)
        except Exception:
            pass

    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        task = db.query(ComputeTask).filter(ComputeTask.task_id == task_id).first()
        if task:
            task.status = "failed"
            task.error_message = str(e)
            task.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


# ═══════════════════════════════════════════
#  提交计算任务
# ═══════════════════════════════════════════
@router.post("/run")
def compute_run(
    req: ComputeRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.service not in SERVICE_MAP:
        raise HTTPException(400, f"未知服务: {req.service}。支持: {list(SERVICE_MAP.keys())}")

    # 检查配额
    # if current_user.quota_used >= current_user.quota_total:
    #     raise HTTPException(429, "配额已用尽")

    task_id = "T-" + uuid.uuid4().hex[:12].upper()

    task = ComputeTask(
        task_id=task_id,
        user_id=current_user.id,
        service=req.service,
        params_json=json.dumps(req.params, ensure_ascii=False),
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 异步执行
    t = threading.Thread(
        target=_run_in_background,
        args=(req.service, req.params, task_id),
        daemon=True,
    )
    t.start()

    return ApiResponse(data={
        "taskId": task_id,
        "service": req.service,
        "status": "pending",
        "message": f"任务已提交，正在执行{req.service}计算",
    })


# ═══════════════════════════════════════════
#  任务列表
# ═══════════════════════════════════════════
@router.get("/tasks")
def compute_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    pageSize: int = 20,
):
    query = db.query(ComputeTask).filter(
        ComputeTask.user_id == current_user.id
    ).order_by(ComputeTask.created_at.desc())

    total = query.count()
    tasks = query.offset((page - 1) * pageSize).limit(pageSize).all()

    return ApiResponse(data={
        "list": [t.to_dict() for t in tasks],
        "total": total,
        "page": page,
        "pageSize": pageSize,
    })


# ═══════════════════════════════════════════
#  任务详情
# ═══════════════════════════════════════════
@router.get("/task/{task_id}")
def compute_task_detail(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(ComputeTask).filter(
        ComputeTask.task_id == task_id,
        ComputeTask.user_id == current_user.id,
    ).first()

    if not task:
        raise HTTPException(404, "任务不存在")

    data = task.to_dict()
    try:
        data["params"] = json.loads(task.params_json) if task.params_json else {}
    except json.JSONDecodeError:
        data["params"] = {}
    try:
        data["stats"] = json.loads(task.stats_json) if task.stats_json else {}
    except json.JSONDecodeError:
        data["stats"] = {}

    # 检查是否有预览图
    task_out = Path(task.output_path) if task.output_path else None
    if task_out and task_out.exists():
        preview = task_out.with_name(task_out.stem + "_thumb.png")
        if preview.exists():
            data["stats"]["thumbUrl"] = f"/api/v1/compute/preview/{preview.name}"
        full_preview = task_out.with_name(task_out.stem + "_preview.png")
        if full_preview.exists():
            data["stats"]["previewUrl"] = f"/api/v1/compute/preview/{full_preview.name}"

    return ApiResponse(data=data)


# ═══════════════════════════════════════════
#  下载结果
# ═══════════════════════════════════════════
@router.get("/download/{task_id}")
def compute_download(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import FileResponse

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

    import os
    if not os.path.exists(task.output_path):
        raise HTTPException(404, f"文件已被清理: {task.output_path}")

    return FileResponse(task.output_path, filename=os.path.basename(task.output_path))


# ═══════════════════════════════════════════
#  删除任务
# ═══════════════════════════════════════════
@router.delete("/task/{task_id}")
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除单个历史任务记录"""
    task = db.query(ComputeTask).filter(
        ComputeTask.task_id == task_id,
        ComputeTask.user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(404, "任务不存在")
    db.delete(task)
    db.commit()
    return ApiResponse(message="已删除")


@router.delete("/tasks")
def clear_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """清空当前用户所有任务记录"""
    db.query(ComputeTask).filter(
        ComputeTask.user_id == current_user.id,
    ).delete()
    db.commit()
    return ApiResponse(message="已清空")


# ═══════════════════════════════════════════
#  即时预览：上传 TIF → 返回渲染图
# ═══════════════════════════════════════════
@router.post("/preview-band")
async def preview_band(
    file: UploadFile = File(...),
):
    """上传单个 TIF 波段文件，即时返回灰度渲染图 URL"""
    import numpy as np
    import rasterio
    import shutil
    import uuid

    task_id = "P-" + uuid.uuid4().hex[:12].upper()
    tmp_path = Path(__file__).parent / "uploads" / f"{task_id}.tif"
    tmp_path.parent.mkdir(exist_ok=True)

    try:
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        with rasterio.open(tmp_path) as src:
            data = src.read(1).astype(np.float64)

        url = _save_band_preview(data, task_id, "preview")
        return {"code": 0, "data": {"url": url}}
    except Exception as e:
        raise HTTPException(400, f"无法解析文件: {e}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


# ═══════════════════════════════════════════
#  上传 GeoTIFF 直接计算（通用分发，支持全部9个算法服务）
# ═══════════════════════════════════════════
@router.post("/upload")
async def compute_upload(
    red_band: UploadFile = File(...),
    nir_band: UploadFile = File(None),
    service: str = Form(default="ndvi"),
    params: str = Form(default="{}"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """上传波段 GeoTIFF，根据 service 参数分发到对应算法引擎"""
    import numpy as np
    import rasterio
    import shutil
    import json
    from datetime import datetime

    # 解析额外参数
    try:
        extra = json.loads(params) if params else {}
    except json.JSONDecodeError:
        extra = {}

    # 保存上传文件到临时目录
    tmp_dir = Path(__file__).parent / "uploads"
    tmp_dir.mkdir(exist_ok=True)
    task_id = "U-" + uuid.uuid4().hex[:12].upper()

    red_path = tmp_dir / f"{task_id}_red.tif"
    nir_path = tmp_dir / f"{task_id}_nir.tif"

    try:
        with open(red_path, "wb") as f:
            shutil.copyfileobj(red_band.file, f)
        with rasterio.open(red_path) as src:
            band1 = src.read(1).astype(np.float64)
            # 从文件元数据读取校准系数
            cal_gain = float(src.scales[0]) if src.scales else 1.0
            cal_offset = float(src.offsets[0]) if src.offsets else 0.0
        # Sentinel-2 L2A: 存储值 = 反射率 × 10000, 即 gain=0.0001
        if cal_gain == 1.0 and cal_offset == 0.0:
            cal_gain, cal_offset = 0.0001, 0.0
        # 大影像降采样，避免内存溢出
        band1 = _downsample(band1)

        band2 = None
        if nir_band:
            with open(nir_path, "wb") as f:
                shutil.copyfileobj(nir_band.file, f)
            with rasterio.open(nir_path) as src:
                band2 = src.read(1).astype(np.float64)
            band2 = _downsample(band2)

        # 生成波段预览（在清理前）
        b1_thumb = _save_band_preview(band1, task_id, "band1")
        b2_thumb = _save_band_preview(band2, task_id, "band2") if band2 is not None else ""
    finally:
        for p in [red_path, nir_path]:
            if p.exists():
                p.unlink()

    # 尺寸对齐
    image_size = f"{band1.shape[1]}x{band1.shape[0]}"
    if band2 is not None and band1.shape != band2.shape:
        h = min(band1.shape[0], band2.shape[0])
        w = min(band1.shape[1], band2.shape[1])
        band1 = band1[:h, :w]
        band2 = band2[:h, :w]
        image_size = f"{w}x{h}"

    # ── 根据服务类型分发 ──
    preview_url = ""
    thumb_url = ""

    if service == "calibration":
        result = run_calibration(
            red_band=band1, nir_band=band2,
            gain=cal_gain, offset=cal_offset,
            task_id=task_id,
        )
        # 生成灰度预览
        _gen_gray_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "atmospheric":
        result = run_atmospheric_correction(
            band=band1,
            aerosol_model=extra.get("aerosol", "continental"),
            task_id=task_id,
        )
        _gen_gray_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "geometric":
        result = run_geometric_correction(
            band=band1,
            dem_source=extra.get("dem", "srtm30"),
            resample_method=extra.get("resample", "bilinear"),
            task_id=task_id,
        )
        _gen_gray_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "ndvi":
        result = run_ndvi(
            red_band=band1,
            nir_band=band2 if band2 is not None else band1 * 1.3,
            task_id=task_id,
        )
        _gen_ndvi_colormap_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "cloud_detection":
        result = run_cloud_detection(
            band=band1, blue_band=band2,
            threshold=extra.get("threshold", 0.15),
            task_id=task_id,
        )
        _gen_gray_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "clip":
        result = run_clip(
            band=band1,
            x=extra.get("x", 100), y=extra.get("y", 100),
            width=extra.get("width", 256), height=extra.get("height", 256),
            task_id=task_id,
        )
        _gen_gray_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "spectral_index":
        result = run_spectral_index(
            band=band1,
            nir_band=band2 if band2 is not None else band1 * 1.3,
            index_type=extra.get("index_type", "ndvi"),
            task_id=task_id,
        )
        _gen_ndvi_colormap_preview(result, task_id)
        preview_url, thumb_url = _get_preview_urls(task_id, result.get("output_path", ""))

    elif service == "mosaic":
        result = run_compute(service="mosaic", params=extra, task_id=task_id)

    elif service == "fusion":
        result = run_compute(service="fusion", params=extra, task_id=task_id)

    else:
        raise HTTPException(400, f"不支持的上传计算服务: {service}。支持: {list(SERVICE_MAP.keys())}")

    # 组装 stats
    stats = dict(result.get("stats", {}))
    stats["imageSize"] = image_size
    stats["service"] = service
    stats["previewUrl"] = preview_url
    stats["thumbUrl"] = thumb_url
    stats["band1ThumbUrl"] = b1_thumb
    stats["band2ThumbUrl"] = b2_thumb

    # 记录到数据库
    task = ComputeTask(
        task_id=task_id, user_id=current_user.id, service=service,
        params_json=json.dumps({
            "source": "upload",
            "file1": red_band.filename,
            "file2": nir_band.filename if nir_band else "none",
            **extra,
        }),
        status="completed", progress=100,
        output_path=result.get("output_path", ""),
        stats_json=json.dumps(stats, ensure_ascii=False),
        created_at=datetime.utcnow(), completed_at=datetime.utcnow(),
    )
    db.add(task)
    db.commit()

    # 自动生成 Cesium 3D PNG（预览图，Cesium 直接请求，无需认证）
    try:
        from imagery_routes import _generate_cesium_png as gen_png
        gen_png(task_id, task.output_path, service)
    except Exception as e:
        import traceback
        print(f"[WARN] Cesium PNG 生成失败 (task={task_id}): {e}")
        traceback.print_exc()

    return ApiResponse(data={"taskId": task_id, "status": "completed", "stats": stats})


# ── 预览生成辅助函数 ──

def _gen_gray_preview(result: dict, task_id: str):
    """为单波段结果生成灰度 PNG 预览"""
    import numpy as np
    out_path = Path(result.get("output_path", ""))
    if not out_path or not out_path.exists():
        return
    try:
        from PIL import Image
        if out_path.suffix == ".npy":
            data = np.load(out_path)
        else:
            import rasterio
            with rasterio.open(out_path) as src:
                data = src.read(1).astype(np.float64)

        # 降采样
        data = _downsample(data, 1024)

        vmin, vmax = float(np.percentile(data, 2)), float(np.percentile(data, 98))
        if vmax <= vmin:
            vmax = vmin + 1
        vis = ((data - vmin) / (vmax - vmin) * 255).clip(0, 255).astype(np.uint8)

        h, w = data.shape
        thumb_h = min(h, 480)
        thumb_w = int(w * thumb_h / h)

        pil_img = Image.fromarray(vis)
        preview_path = out_path.with_name(out_path.stem + "_preview.png")
        pil_img.save(preview_path)
        thumb = pil_img.resize((thumb_w, thumb_h), Image.LANCZOS)
        thumb_path = out_path.with_name(out_path.stem + "_thumb.png")
        thumb.save(thumb_path)
    except Exception as e:
        import traceback
        print(f"[WARN] 灰度预览生成失败 (task={task_id}): {e}")
        traceback.print_exc()


def _gen_ndvi_colormap_preview(result: dict, task_id: str):
    """为 NDVI/指数结果生成伪彩色 PNG 预览"""
    import numpy as np
    out_path = Path(result.get("output_path", ""))
    if not out_path or not out_path.exists():
        return
    try:
        from PIL import Image
        if out_path.suffix == ".npy":
            data = np.load(out_path)
        else:
            import rasterio
            with rasterio.open(out_path) as src:
                data = src.read(1).astype(np.float64)

        # 降采样 + 向量化 colormap
        data = _downsample(data, 1024)
        h, w = data.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        # 向量化：用 numpy 条件索引代替逐像素循环
        rgb[(data < 0), :] = (30, 60, 180)
        rgb[(data >= 0) & (data < 0.15), :] = (180, 160, 140)
        rgb[(data >= 0.15) & (data < 0.3), :] = (230, 210, 80)
        rgb[(data >= 0.3) & (data < 0.5), :] = (100, 190, 60)
        rgb[(data >= 0.5) & (data < 0.7), :] = (20, 150, 30)
        rgb[(data >= 0.7), :] = (5, 90, 10)

        preview_path = out_path.with_name(out_path.stem + "_preview.png")
        Image.fromarray(rgb).save(preview_path)

        thumb_h = min(h, 480)
        thumb_w = int(w * thumb_h / h)
        thumb = np.array(Image.fromarray(rgb).resize((thumb_w, thumb_h), Image.LANCZOS))
        thumb_path = out_path.with_name(out_path.stem + "_thumb.png")
        Image.fromarray(thumb).save(thumb_path)
    except Exception as e:
        import traceback
        print(f"[WARN] NDVI 预览生成失败 (task={task_id}): {e}")
        traceback.print_exc()


def _get_preview_urls(task_id: str, output_path: str) -> tuple:
    """根据输出文件路径构造预览图 URL"""
    out_path = Path(output_path) if output_path else None
    preview_url = ""
    thumb_url = ""
    if out_path and out_path.exists():
        preview = out_path.with_name(out_path.stem + "_preview.png")
        thumb = out_path.with_name(out_path.stem + "_thumb.png")
        if preview.exists():
            preview_url = f"/api/v1/compute/preview/{preview.name}"
        if thumb.exists():
            thumb_url = f"/api/v1/compute/preview/{thumb.name}"
    return preview_url, thumb_url


# ═══════════════════════════════════════════
#  预览图访问
# ═══════════════════════════════════════════
@router.get("/preview/{filename}")
def compute_preview(filename: str):
    """访问生成的 NDVI 伪彩色渲染图"""
    filepath = OUTPUT_DIR / filename
    if not filepath.exists():
        raise HTTPException(404, "预览图不存在")
    return FileResponse(str(filepath), media_type="image/png")


# ═══════════════════════════════════════════
#  可用服务列表
# ═══════════════════════════════════════════
@router.get("/services")
def compute_services():
    """返回所有可用算法服务的名称和描述"""
    info = {
        "calibration":   {"name": "辐射定标", "desc": "DN值 → 辐射亮度值/表观反射率", "category": "辐射校正"},
        "atmospheric":   {"name": "大气校正", "desc": "消除大气散射与吸收影响，获取地表真实反射率", "category": "辐射校正"},
        "geometric":     {"name": "几何校正", "desc": "消除几何畸变，影像精确地理编码", "category": "几何校正"},
        "ndvi":          {"name": "NDVI 植被指数", "desc": "归一化植被指数，定量评估植被覆盖度", "category": "指数计算"},
        "cloud_detection":{"name": "云检测", "desc": "自动识别影像中的云覆盖区域与云量百分比", "category": "影像预处理"},
        "clip":          {"name": "影像裁剪", "desc": "按矩形ROI提取影像子区域，支持自定义坐标", "category": "影像预处理"},
        "spectral_index":{"name": "光谱指数扩展", "desc": "计算EVI/NDWI/SAVI/NDBI/RVI/GNDVI等多种指数", "category": "指数计算"},
        "mosaic":        {"name": "影像镶嵌", "desc": "多景影像无缝拼接，生成大范围影像", "category": "影像处理"},
        "fusion":        {"name": "影像融合", "desc": "多光谱+全色融合，提升空间分辨率", "category": "影像处理"},
    }
    return ApiResponse(data=info)
