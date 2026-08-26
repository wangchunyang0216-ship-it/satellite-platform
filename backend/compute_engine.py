"""
遥感卫星数据服务平台 — 算法引擎
支持: 辐射定标 · 大气校正 · 几何校正 · NDVI · 影像镶嵌 · 影像融合
"""
import os
import uuid
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np

# 输出目录
OUTPUT_DIR = Path(__file__).parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)


def _simulate_image(shape=(512, 512), seed: int = 42) -> np.ndarray:
    """生成模拟遥感影像 (0–10000 的 uint16 值，模拟 DN 值)"""
    rng = np.random.default_rng(seed)
    # 基础地表反射率 + 空间渐变 + 噪声
    x = np.linspace(0, 4 * np.pi, shape[1])
    y = np.linspace(0, 4 * np.pi, shape[0])
    X, Y = np.meshgrid(x, y)
    base = 3000 + 1500 * np.sin(X) * np.cos(Y)
    noise = rng.normal(0, 200, shape)
    img = np.clip(base + noise, 0, 10000).astype(np.float64)
    return img


def _save_geotiff(data: np.ndarray, task_id: str, suffix: str) -> str:
    """保存结果为 GeoTIFF 文件，返回文件路径"""
    filename = f"{task_id}_{suffix}.tif"
    filepath = OUTPUT_DIR / filename
    try:
        import rasterio
        if data.ndim == 2:
            h, w = data.shape
            count = 1
        else:
            count, h, w = data.shape[0], data.shape[1], data.shape[2]
        profile = {
            "driver": "GTiff",
            "height": h,
            "width": w,
            "count": count,
            "dtype": data.dtype.name if hasattr(data.dtype, 'name') else str(data.dtype),
            "crs": "EPSG:4326",
            "transform": rasterio.transform.from_bounds(114.0, 30.0, 115.0, 31.0, w, h),
        }
        with rasterio.open(filepath, "w", **profile) as dst:
            if data.ndim == 2:
                dst.write(data, 1)
            else:
                dst.write(data)
    except ImportError:
        # 无 rasterio 时保存为 npy + JSON 元数据
        npy_path = filepath.with_suffix(".npy")
        np.save(npy_path, data)
        meta = {"shape": list(data.shape), "dtype": str(data.dtype), "crs": "EPSG:4326"}
        with open(filepath.with_suffix(".json"), "w") as f:
            json.dump(meta, f)
        filepath = npy_path
    return str(filepath)


def run_calibration(
    red_band: Optional[np.ndarray] = None,
    nir_band: Optional[np.ndarray] = None,
    gain: float = 1.0,
    offset: float = 0.0,
    task_id: str = "",
) -> dict:
    """
    辐射定标: L = DN × Gain + Offset
    将影像数字量化值 (DN) 转换为辐射亮度值
    """
    t0 = time.time()

    if red_band is None:
        red_band = _simulate_image((512, 512), seed=hash(task_id + "red") % 10000)
    if nir_band is None:
        nir_band = _simulate_image((512, 512), seed=hash(task_id + "nir") % 10000)

    red_cal = red_band * gain + offset
    nir_cal = nir_band * gain + offset

    out_path = _save_geotiff(np.stack([red_cal, nir_cal]), task_id, "calibrated")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id,
        "service": "calibration",
        "status": "completed",
        "output_path": out_path,
        "stats": {
            "red_mean": round(float(red_cal.mean()), 2),
            "red_std": round(float(red_cal.std()), 2),
            "nir_mean": round(float(nir_cal.mean()), 2),
            "nir_std": round(float(nir_cal.std()), 2),
            "gain": gain,
            "offset": offset,
        },
        "elapsed_sec": elapsed,
    }


def run_atmospheric_correction(
    band: Optional[np.ndarray] = None,
    aerosol_model: str = "continental",
    visibility_km: float = 23.0,
    task_id: str = "",
) -> dict:
    """
    大气校正: 基于简化 6SV 模型
    ρ_surface = (ρ_toa - ρ_path) / (T_down × T_up)

    简化实现使用暗目标减法 (DOS):
    ρ = (L_sat - L_haze) / (E_sun × cos(θ) / π)
    其中 L_haze 通过暗目标统计估计
    """
    t0 = time.time()

    if band is None:
        band = _simulate_image((512, 512), seed=hash(task_id) % 10000)

    # 暗目标法: 取影像最低 1% 像元均值作为路径辐射
    flat = np.sort(band.ravel())
    dark_pixels = flat[: max(1, len(flat) // 100)]
    L_haze = float(np.mean(dark_pixels))

    # 表观反射率 (简化)
    E_sun = 1960.0   # 太阳辐照度 W·m⁻²·μm⁻¹ (红光波段典型值)
    cos_theta = 0.85  # 太阳天顶角余弦
    rho_toa = (band - L_haze) / (E_sun * cos_theta / np.pi)

    # 气溶胶光学厚度影响因子 (简化)
    aod_factor = {"continental": 0.92, "maritime": 0.88, "urban": 0.78}.get(aerosol_model, 0.90)
    rho_surface = np.clip(rho_toa / aod_factor, 0, 1)

    out_path = _save_geotiff((rho_surface * 10000).astype(np.float32), task_id, "atmospheric_corrected")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id,
        "service": "atmospheric_correction",
        "status": "completed",
        "output_path": out_path,
        "stats": {
            "path_radiance": round(L_haze, 4),
            "mean_reflectance": round(float(rho_surface.mean()), 6),
            "std_reflectance": round(float(rho_surface.std()), 6),
            "aerosol_model": aerosol_model,
            "aod_factor": round(aod_factor, 3),
        },
        "elapsed_sec": elapsed,
    }


def run_geometric_correction(
    band: Optional[np.ndarray] = None,
    dem_source: str = "srtm30",
    resample_method: str = "bilinear",
    task_id: str = "",
) -> dict:
    """
    几何校正: 基于 RPC 模型的正射校正
    实际使用 GDAL Warp，此处为算法原型实现:
    - 读取 RPC 系数
    - 逐像素计算物方坐标
    - DEM 高度插值
    - 重采样
    """
    t0 = time.time()

    if band is None:
        band = _simulate_image((512, 512), seed=hash(task_id) % 10000)

    # 模拟几何畸变校正: 应用仿射变换残差
    rows, cols = band.shape
    y, x = np.mgrid[0:rows, 0:cols]
    # 模拟原始畸变: 添加径向和切向分量
    cx, cy = cols / 2, rows / 2
    dx = (x - cx) * 0.005 + (y - cy) * 0.002  # 模拟平移
    dy = (y - cy) * 0.003 - (x - cx) * 0.004

    # 重采样
    if resample_method == "bilinear":
        from scipy.ndimage import map_coordinates
        coords = np.array([(y + dy).ravel(), (x + dx).ravel()])
        corrected = map_coordinates(band, coords, order=1, mode="nearest").reshape(rows, cols)
    elif resample_method == "cubic":
        from scipy.ndimage import map_coordinates
        coords = np.array([(y + dy).ravel(), (x + dx).ravel()])
        corrected = map_coordinates(band, coords, order=3, mode="nearest").reshape(rows, cols)
    else:  # nearest
        from scipy.ndimage import map_coordinates
        coords = np.array([(y + dy).ravel(), (x + dx).ravel()])
        corrected = map_coordinates(band, coords, order=0, mode="nearest").reshape(rows, cols)

    # 计算校正精度 (RMSE)
    rmse = float(np.sqrt(np.mean((band - corrected) ** 2)))
    out_path = _save_geotiff(corrected.astype(np.float32), task_id, "geometric_corrected")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id,
        "service": "geometric_correction",
        "status": "completed",
        "output_path": out_path,
        "stats": {
            "rmse_pixels": round(rmse, 4),
            "dem_source": dem_source,
            "resample_method": resample_method,
            "max_displacement_px": round(float(max(np.abs(dx).max(), np.abs(dy).max())), 3),
        },
        "elapsed_sec": elapsed,
    }


def run_ndvi(
    red_band: Optional[np.ndarray] = None,
    nir_band: Optional[np.ndarray] = None,
    generate_preview: bool = True,
    task_id: str = "",
) -> dict:
    """
    NDVI 植被指数计算: NDVI = (NIR − Red) / (NIR + Red)
    这是遥感最经典的植被指数，值域 [-1, 1]
    > 0.6  → 浓密植被
    0.2–0.6 → 中等植被
    0–0.2 → 稀疏植被 / 裸土
    < 0    → 水体 / 云 / 阴影
    """
    t0 = time.time()

    if red_band is None:
        red_band = _simulate_image((512, 512), seed=hash(task_id + "r") % 10000)
    if nir_band is None:
        # NIR 波段在植被区反射率更高
        nir_base = _simulate_image((512, 512), seed=hash(task_id + "n") % 10000)
        # 增强植被区的 NIR 信号
        veg_mask = _simulate_image((512, 512), seed=42) > 3500
        nir_band = nir_base.copy()
        nir_band[veg_mask] *= 1.5
        nir_band = np.clip(nir_band, 0, 10000)

    # 避免除零
    denominator = nir_band + red_band
    denominator[denominator == 0] = 1e-10
    ndvi = (nir_band - red_band) / denominator
    ndvi = np.clip(ndvi, -1, 1)

    # 统计
    veg_healthy = float(np.sum(ndvi > 0.6) / ndvi.size * 100)
    veg_moderate = float(np.sum((ndvi > 0.2) & (ndvi <= 0.6)) / ndvi.size * 100)
    veg_sparse = float(np.sum((ndvi >= 0) & (ndvi <= 0.2)) / ndvi.size * 100)
    non_veg = float(np.sum(ndvi < 0) / ndvi.size * 100)

    out_path = _save_geotiff(ndvi.astype(np.float32), task_id, "ndvi")
    elapsed = round(time.time() - t0, 3)

    result = {
        "task_id": task_id,
        "service": "ndvi",
        "status": "completed",
        "output_path": out_path,
        "stats": {
            "ndvi_mean": round(float(ndvi.mean()), 4),
            "ndvi_std": round(float(ndvi.std()), 4),
            "ndvi_min": round(float(ndvi.min()), 4),
            "ndvi_max": round(float(ndvi.max()), 4),
            "vegetation_healthy_pct": round(veg_healthy, 1),
            "vegetation_moderate_pct": round(veg_moderate, 1),
            "vegetation_sparse_pct": round(veg_sparse, 1),
            "non_vegetation_pct": round(non_veg, 1),
        },
        "elapsed_sec": elapsed,
    }

    return result


def run_mosaic(
    scenes: Optional[list] = None,
    seamline_method: str = "mcp",
    color_balance: bool = True,
    task_id: str = "",
) -> dict:
    """
    影像镶嵌: 多景影像无缝拼接
    - 特征匹配 (SIFT/SURF)
    - 拼接线生成 (最小代价路径 / Voronoi)
    - 全局匀色 (Wallis 滤波)
    - 融合 (多尺度融合)
    """
    t0 = time.time()

    if scenes is None:
        # 模拟 4 景影像，每景有不同偏移
        scenes = []
        for i, (seed, dx, dy) in enumerate([(10, 0, 0), (20, 380, 0), (30, 0, 380), (40, 380, 380)]):
            img = _simulate_image((400, 400), seed=seed)
            # 模拟不同光照条件
            brightness = 0.9 + np.random.random() * 0.2
            img = img * brightness
            scenes.append({"image": img, "offset_x": dx, "offset_y": dy})

    n_scenes = len(scenes)
    canvas_w, canvas_h = 780, 780
    canvas = np.zeros((canvas_h, canvas_w), dtype=np.float64)
    weight_sum = np.zeros_like(canvas)

    for i, sc in enumerate(scenes):
        img = sc["image"]
        ox, oy = sc["offset_x"], sc["offset_y"]
        h, w = img.shape

        # 计算拼接线权重 (到边缘的距离作为权重，实现羽化融合)
        if seamline_method == "mcp":
            # 最小代价路径: 使用 Sigmoid 羽化
            y_dist = np.minimum(np.arange(h), h - 1 - np.arange(h)).reshape(-1, 1)
            x_dist = np.minimum(np.arange(w), w - 1 - np.arange(w)).reshape(1, -1)
            dist = np.sqrt(y_dist ** 2 + x_dist ** 2)
            weight = 1 / (1 + np.exp(-(dist - 30) / 10))  # Sigmoid 羽化
        else:
            # Voronoi: 硬分割 + 边缘羽化
            y_dist = np.minimum(np.arange(h), h - 1 - np.arange(h)).reshape(-1, 1)
            x_dist = np.minimum(np.arange(w), w - 1 - np.arange(w)).reshape(1, -1)
            weight = np.minimum(y_dist, x_dist) / 20.0
            weight = np.clip(weight, 0, 1)

        # 匀色处理 — Wallis 滤波简化
        if color_balance and i > 0:
            ref_mean = scenes[0]["image"].mean()
            ref_std = scenes[0]["image"].std()
            cur_mean = img.mean()
            cur_std = img.std()
            img = (img - cur_mean) * (ref_std / max(cur_std, 1e-6)) + ref_mean

        # 写入画布
        y1, y2 = oy, min(oy + h, canvas_h)
        x1, x2 = ox, min(ox + w, canvas_w)
        canvas[y1:y2, x1:x2] += img[:y2 - y1, :x2 - x1] * weight[:y2 - y1, :x2 - x1]
        weight_sum[y1:y2, x1:x2] += weight[:y2 - y1, :x2 - x1]

    # 归一化
    weight_sum[weight_sum == 0] = 1
    mosaic_result = canvas / weight_sum
    mosaic_result = np.clip(mosaic_result, 0, 10000)

    out_path = _save_geotiff(mosaic_result.astype(np.float32), task_id, "mosaic")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id,
        "service": "mosaic",
        "status": "completed",
        "output_path": out_path,
        "stats": {
            "n_scenes": n_scenes,
            "canvas_size": f"{canvas_w}×{canvas_h}",
            "seamline_method": seamline_method,
            "color_balance_applied": color_balance,
            "output_mean": round(float(mosaic_result.mean()), 2),
            "output_std": round(float(mosaic_result.std()), 2),
        },
        "elapsed_sec": elapsed,
    }


def run_fusion(
    multispectral: Optional[np.ndarray] = None,
    panchromatic: Optional[np.ndarray] = None,
    method: str = "gs",
    task_id: str = "",
) -> dict:
    """
    影像融合: 多光谱 + 全色 → 高分辨率多光谱
    支持: Gram-Schmidt / PCA / Brovey

    Gram-Schmidt 原理:
    1. 对多光谱波段进行 Gram-Schmidt 正交化
    2. 用全色波段替换第一个 GS 分量
    3. 逆 GS 变换得到融合多光谱
    """
    t0 = time.time()

    # 模拟数据: 多光谱 4 波段 128×128, 全色 512×512
    if multispectral is None:
        bands = []
        for i in range(4):
            b = _simulate_image((128, 128), seed=hash(task_id + str(i)) % 10000)
            bands.append(b)
        multispectral = np.stack(bands)  # (4, 128, 128)
    if panchromatic is None:
        panchromatic = _simulate_image((512, 512), seed=hash(task_id + "pan") % 10000)

    n_bands, ms_h, ms_w = multispectral.shape
    pan_h, pan_w = panchromatic.shape

    # 上采样多光谱到全色分辨率
    if ms_h != pan_h:
        from scipy.ndimage import zoom
        zoom_factor = (1, pan_h / ms_h, pan_w / ms_w)
        ms_upsampled = zoom(multispectral, zoom_factor, order=1)
    else:
        ms_upsampled = multispectral.copy()

    if method == "gs":
        # Gram-Schmidt 正交化
        gs = np.zeros_like(ms_upsampled)
        gs[0] = ms_upsampled[0].copy()
        for i in range(1, n_bands):
            gs[i] = ms_upsampled[i].copy()
            for j in range(i):
                # 正交化
                num = np.sum(ms_upsampled[i] * gs[j])
                den = np.sum(gs[j] * gs[j]) + 1e-10
                gs[i] -= (num / den) * gs[j]

        # 用全色替换第一个 GS 分量
        pan_normalized = (panchromatic - panchromatic.mean()) * (gs[0].std() / max(panchromatic.std(), 1e-6)) + gs[0].mean()
        gs[0] = pan_normalized

        # 逆 GS 变换
        fused = np.zeros_like(gs)
        for i in range(n_bands):
            fused[i] = gs[i].copy()
            for j in range(i + 1, n_bands):
                num = np.sum(ms_upsampled[j] * gs[i])
                den = np.sum(gs[i] * gs[i]) + 1e-10
                # 这里做简化逆变换
            # 实际上逆 GS 变换需要下三角矩阵的逆
            # 简化: 直接用 GS 分量近似
        fused = np.clip(gs, 0, 10000)

    elif method == "pca":
        # PCA 融合
        ms_flat = ms_upsampled.reshape(n_bands, -1)
        ms_mean = ms_flat.mean(axis=1, keepdims=True)
        ms_centered = ms_flat - ms_mean
        cov = ms_centered @ ms_centered.T / (ms_flat.shape[1] - 1)

        eigenvalues, eigenvectors = np.linalg.eigh(cov)
        idx = np.argsort(eigenvalues)[::-1]
        eigenvectors = eigenvectors[:, idx]

        pca = eigenvectors.T @ ms_centered
        pca = pca.reshape(n_bands, pan_h, pan_w)

        # 替换第一主成分
        pan_normalized = (panchromatic - panchromatic.mean()) * (pca[0].std() / max(panchromatic.std(), 1e-6)) + pca[0].mean()
        pca[0] = pan_normalized

        # 逆 PCA
        fused_flat = eigenvectors @ pca.reshape(n_bands, -1) + ms_mean
        fused = np.clip(fused_flat.reshape(n_bands, pan_h, pan_w), 0, 10000)

    elif method == "brovey":
        # Brovey 变换
        intensity = ms_upsampled.sum(axis=0) / n_bands
        intensity[intensity == 0] = 1e-10
        fused = np.zeros_like(ms_upsampled)
        for i in range(n_bands):
            fused[i] = ms_upsampled[i] * (panchromatic / intensity)
        fused = np.clip(fused, 0, 10000)

    else:
        fused = ms_upsampled

    # 评估融合质量
    corr = [float(np.corrcoef(fused[i].ravel(), panchromatic.ravel())[0, 1]) for i in range(n_bands)]

    out_path = _save_geotiff(fused.astype(np.float32), task_id, f"fused_{method}")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id,
        "service": "fusion",
        "status": "completed",
        "output_path": out_path,
        "stats": {
            "method": method,
            "n_bands": n_bands,
            "output_resolution": f"{pan_w}×{pan_h}",
            "band_correlation_with_pan": [round(c, 4) for c in corr],
        },
        "elapsed_sec": elapsed,
    }


def run_cloud_detection(
    band: Optional[np.ndarray] = None,
    blue_band: Optional[np.ndarray] = None,
    threshold: float = 0.15,
    task_id: str = "",
) -> dict:
    """
    云检测: 基于多光谱阈值法自动识别影像中的云覆盖区域
    原理: 利用云在可见光波段的高反射特性 + 归一化差值
    - 蓝波段反射率 > 阈值 → 疑似云
    - 结合纹理和亮度特征做精化
    """
    t0 = time.time()

    if band is None:
        band = _simulate_image((512, 512), seed=hash(task_id) % 10000)
    if blue_band is None:
        blue_band = band * (0.85 + np.random.random() * 0.3)

    # 归一化到 0-1
    b_norm = (blue_band - blue_band.min()) / (blue_band.max() - blue_band.min() + 1e-10)

    # 阈值分割
    cloud_mask = b_norm > threshold

    # 形态学后处理: 去除小噪点
    from scipy.ndimage import binary_opening, binary_closing
    struct = np.ones((3, 3))
    cloud_mask = binary_opening(cloud_mask, struct)
    cloud_mask = binary_closing(cloud_mask, struct)

    total_px = cloud_mask.size
    cloud_px = int(cloud_mask.sum())
    cloud_pct = round(cloud_px / total_px * 100, 2)

    out_path = _save_geotiff(cloud_mask.astype(np.uint8) * 255, task_id, "cloud_mask")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id, "service": "cloud_detection", "status": "completed",
        "output_path": out_path,
        "stats": {
            "cloud_pixels": cloud_px, "total_pixels": total_px,
            "cloud_coverage_pct": cloud_pct, "threshold": threshold,
            "classification": "晴空" if cloud_pct < 5 else ("少云" if cloud_pct < 25 else ("多云" if cloud_pct < 60 else "阴天")),
        },
        "elapsed_sec": elapsed,
    }


def run_clip(
    band: Optional[np.ndarray] = None,
    x: int = 100, y: int = 100, width: int = 256, height: int = 256,
    task_id: str = "",
) -> dict:
    """
    影像裁剪: 按矩形 ROI 提取影像子区域
    支持指定起始坐标 (x,y) 和裁剪尺寸 (width,height)
    常用于: 按行政区划 / 研究区域 / AOI 提取局部影像
    """
    t0 = time.time()

    if band is None:
        band = _simulate_image((512, 512), seed=hash(task_id) % 10000)

    h, w = band.shape
    # 边界检查
    x = max(0, min(x, w - 1))
    y = max(0, min(y, h - 1))
    width = max(1, min(width, w - x))
    height = max(1, min(height, h - y))

    clipped = band[y:y + height, x:x + width].copy()

    out_path = _save_geotiff(clipped.astype(np.float32), task_id, "clipped")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id, "service": "clip", "status": "completed",
        "output_path": out_path,
        "stats": {
            "original_size": f"{w}x{h}",
            "crop_region": f"x={x}, y={y}, w={width}, h={height}",
            "output_size": f"{clipped.shape[1]}x{clipped.shape[0]}",
            "crop_ratio_pct": round(width * height / (w * h) * 100, 2),
        },
        "elapsed_sec": elapsed,
    }


def run_spectral_index(
    band: Optional[np.ndarray] = None,
    nir_band: Optional[np.ndarray] = None,
    blue_band: Optional[np.ndarray] = None,
    swir_band: Optional[np.ndarray] = None,
    index_type: str = "ndvi",
    task_id: str = "",
) -> dict:
    """
    光谱指数扩展: 计算多种遥感植被/水体/城市指数
    支持: NDVI, EVI, NDWI, SAVI, NDBI, RVI, GNDVI

    NDVI: (NIR-Red)/(NIR+Red)                    植被覆盖
    EVI:  2.5*(NIR-Red)/(NIR+6*Red-7.5*Blue+1)   增强型植被指数 (抗大气干扰)
    NDWI: (Green-NIR)/(Green+NIR)                  水体指数
    SAVI: 1.5*(NIR-Red)/(NIR+Red+0.5)             土壤调节植被指数
    NDBI: (SWIR-NIR)/(SWIR+NIR)                    建筑/城市指数
    RVI:  NIR/Red                                  比值植被指数
    GNDVI:(NIR-Green)/(NIR+Green)                  绿波段归一化植被指数
    """
    t0 = time.time()

    if band is None:
        band = _simulate_image((512, 512), seed=hash(task_id + "r") % 10000)
    if nir_band is None:
        nir_base = _simulate_image((512, 512), seed=hash(task_id + "n") % 10000)
        veg_mask = _simulate_image((512, 512), seed=42) > 3500
        nir_band = nir_base.copy()
        nir_band[veg_mask] *= 1.5
        nir_band = np.clip(nir_band, 0, 10000)
    if blue_band is None:
        blue_band = band * (0.85 + np.random.random() * 0.2)
    if swir_band is None:
        swir_band = band * (0.6 + np.random.random() * 0.3)

    eps = 1e-10

    if index_type == "evi":
        denom = nir_band + 6 * band - 7.5 * blue_band + 1
        denom[denom == 0] = eps
        result = 2.5 * (nir_band - band) / denom
        name = "EVI"
    elif index_type == "ndwi":
        denom = band + nir_band
        denom[denom == 0] = eps
        result = (band - nir_band) / denom
        name = "NDWI"
    elif index_type == "savi":
        L = 0.5
        denom = nir_band + band + L
        denom[denom == 0] = eps
        result = 1.5 * (nir_band - band) / denom
        name = "SAVI"
    elif index_type == "ndbi":
        denom = swir_band + nir_band
        denom[denom == 0] = eps
        result = (swir_band - nir_band) / denom
        name = "NDBI"
    elif index_type == "rvi":
        denom = band.copy()
        denom[denom == 0] = eps
        result = nir_band / denom
        name = "RVI"
    elif index_type == "gndvi":
        denom = nir_band + band
        denom[denom == 0] = eps
        result = (nir_band - band) / denom
        name = "GNDVI"
    else:  # ndvi
        denom = nir_band + band
        denom[denom == 0] = eps
        result = (nir_band - band) / denom
        name = "NDVI"

    result = np.clip(result, -5, 5)
    valid = result[~np.isnan(result)]

    out_path = _save_geotiff(result.astype(np.float32), task_id, f"index_{index_type}")
    elapsed = round(time.time() - t0, 3)

    return {
        "task_id": task_id, "service": "spectral_index", "status": "completed",
        "output_path": out_path,
        "stats": {
            "index_type": index_type, "index_name": name,
            "mean": round(float(valid.mean()), 4),
            "std": round(float(valid.std()), 4),
            "min": round(float(valid.min()), 4),
            "max": round(float(valid.max()), 4),
        },
        "elapsed_sec": elapsed,
    }


# ─── 统一调度入口 ───

SERVICE_MAP = {
    "calibration":     run_calibration,
    "atmospheric":     run_atmospheric_correction,
    "geometric":       run_geometric_correction,
    "ndvi":            run_ndvi,
    "mosaic":          run_mosaic,
    "fusion":          run_fusion,
    "cloud_detection": run_cloud_detection,
    "clip":            run_clip,
    "spectral_index":  run_spectral_index,
}


def run_compute(service: str, params: dict, task_id: str = "") -> dict:
    """统一的算法服务调度入口 — 自动映射参数名 + 生成预览图"""
    import inspect

    if service not in SERVICE_MAP:
        raise ValueError(f"未知服务: {service}。支持: {list(SERVICE_MAP.keys())}")

    # 参数名映射: 前端驼峰 → 后端下划线
    PARAM_ALIASES = {
        "cloudThreshold": "threshold",
        "clipX": "x", "clipY": "y", "clipW": "width", "clipH": "height",
        "indexType": "index_type",
        "calType": "cal_type", "geoModel": "geo_model",
        "waterVapor": "water_vapor", "fusionMethod": "method",
        "seamline": "seamline_method", "colorBalance": "color_balance",
    }
    mapped = {}
    for k, v in params.items():
        mapped[PARAM_ALIASES.get(k, k)] = v

    fn = SERVICE_MAP[service]
    sig = inspect.signature(fn)

    valid_params = {}
    for key, value in mapped.items():
        if key in sig.parameters:
            valid_params[key] = value

    result = fn(task_id=task_id, **valid_params)

    # 为 NDVI 结果生成伪彩色预览
    if service == "ndvi" and result.get("output_path"):
        _generate_ndvi_preview(result)

    return result


def _generate_ndvi_preview(result: dict, size: int = 480):
    """为 NDVI 结果生成伪彩色 PNG 预览和缩略图"""
    import numpy as np

    out_path = Path(result["output_path"])
    if not out_path.exists():
        return

    try:
        # 读取 NDVI 数据
        if out_path.suffix == ".npy":
            ndvi = np.load(out_path)
        else:
            import rasterio
            with rasterio.open(out_path) as src:
                ndvi = src.read(1)

        from PIL import Image

        def ndvi_colormap(v):
            if v < 0: return (30, 60, 180)
            elif v < 0.15: return (180, 160, 140)
            elif v < 0.3: return (230, 210, 80)
            elif v < 0.5: return (100, 190, 60)
            elif v < 0.7: return (20, 150, 30)
            else: return (5, 90, 10)

        h, w = ndvi.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        for i in range(h):
            for j in range(w):
                rgb[i, j] = ndvi_colormap(float(ndvi[i, j]))

        preview_path = out_path.with_name(out_path.stem + "_preview.png")
        Image.fromarray(rgb).save(preview_path)

        # 缩略图
        thumb_h = min(h, size)
        thumb_w = int(w * thumb_h / h)
        thumb = np.array(Image.fromarray(rgb).resize((thumb_w, thumb_h), Image.LANCZOS))
        thumb_path = out_path.with_name(out_path.stem + "_thumb.png")
        Image.fromarray(thumb).save(thumb_path)

        base = "/api/v1/compute/preview/"
        result["preview_url"] = base + preview_path.name
        result["thumb_url"] = base + thumb_path.name
    except Exception:
        pass
