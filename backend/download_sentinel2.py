"""
从 AWS Sentinel-2 COG 公共桶下载武汉真实卫星数据并计算 NDVI
无需注册，免费公开访问
用法: python download_sentinel2.py
"""
import rasterio
from rasterio.windows import Window
import numpy as np
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "test_data"
OUTPUT_DIR.mkdir(exist_ok=True)

# STAC API 搜索到的武汉地区真实场景 (2024年10月，云量<0.01%)
SCENE_PATH = "50/R/KU/2024/10/S2A_50RKU_20241025_0_L2A"
COG_BASE = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs"

WINDOW_SIZE = 1024  # 下载窗口像素 (10m分辨率 ≈ 10km×10km)


def main():
    print("=" * 60)
    print("  Sentinel-2 真实卫星数据 — 武汉地区 NDVI 计算")
    print("=" * 60)
    print(f"  场景: S2A_50RKU_20241025 (2024-10-25, 云量 0.008%)")
    print(f"  区域: 武汉周边 (UTM 50R)")
    print(f"  窗口: {WINDOW_SIZE}x{WINDOW_SIZE} 像素 ≈ 10x10km")
    print()

    # 1. 下载红波段 (B04) 和近红外波段 (B08)
    print("从 AWS 公共桶下载波段数据...")

    red_url = f"{COG_BASE}/{SCENE_PATH}/B04.tif"
    nir_url = f"{COG_BASE}/{SCENE_PATH}/B08.tif"

    with rasterio.open(red_url) as src:
        h, w = src.height, src.width
        print(f"  影像尺寸: {w}x{h} 像素")
        # 取影像中心偏上区域 (避开可能的边缘和云)
        y, x = h // 3, w // 3
        red = src.read(1, window=Window(x, y, WINDOW_SIZE, WINDOW_SIZE)).astype(np.float32)

    with rasterio.open(nir_url) as src:
        nir = src.read(1, window=Window(x, y, WINDOW_SIZE, WINDOW_SIZE)).astype(np.float32)

    print(f"  B04 (红): {red.shape[1]}x{red.shape[0]}, 范围 [{red.min():.0f}, {red.max():.0f}]")
    print(f"  B08 (近红外): {nir.shape[1]}x{nir.shape[0]}, 范围 [{nir.min():.0f}, {nir.max():.0f}]")

    # 2. 保存原始波段
    profile = {"driver": "GTiff", "height": red.shape[0], "width": red.shape[1],
               "count": 1, "dtype": "float32", "crs": "EPSG:32650"}
    with rasterio.open(OUTPUT_DIR / "red_band.tif", "w", **profile) as d:
        d.write(red, 1)
    with rasterio.open(OUTPUT_DIR / "nir_band.tif", "w", **profile) as d:
        d.write(nir, 1)

    # 3. 计算 NDVI
    print("\n计算 NDVI = (NIR - Red) / (NIR + Red) ...")
    denom = nir + red
    denom[denom == 0] = 1e-10
    ndvi = np.clip((nir - red) / denom, -1, 1)

    # 过滤无效值
    valid = ndvi[~np.isnan(ndvi)]
    total = valid.size

    # 分级统计
    dense = (valid > 0.6).sum() / total * 100
    moderate = ((valid > 0.2) & (valid <= 0.6)).sum() / total * 100
    sparse = ((valid >= 0) & (valid <= 0.2)).sum() / total * 100
    water = (valid < 0).sum() / total * 100

    print()
    print("=" * 50)
    print("  NDVI 计算结果 — 真实 Sentinel-2 武汉数据")
    print("=" * 50)
    print(f"  均值:          {valid.mean():.4f}")
    print(f"  标准差:        {valid.std():.4f}")
    print(f"  最小值:        {valid.min():.4f}")
    print(f"  最大值:        {valid.max():.4f}")
    print(f"  ─────────────────────────────")
    print(f"  浓密植被 >0.6:  {dense:.1f}%")
    print(f"  中等植被 0.2-0.6:{moderate:.1f}%")
    print(f"  稀疏/裸土 0-0.2:{sparse:.1f}%")
    print(f"  水体/阴影 <0:   {water:.1f}%")

    # 4. 保存 NDVI 结果
    with rasterio.open(OUTPUT_DIR / "ndvi_result.tif", "w", **profile) as d:
        d.write(ndvi.astype(np.float32), 1)

    # 5. 也保存一个 PNG 预览
    try:
        from PIL import Image
        # NDVI 映射到 0-255 灰度
        ndvi_vis = ((ndvi + 1) / 2 * 255).clip(0, 255).astype(np.uint8)
        Image.fromarray(ndvi_vis).save(OUTPUT_DIR / "ndvi_preview.png")
        print(f"\n  预览图: {OUTPUT_DIR / 'ndvi_preview.png'}")
    except ImportError:
        pass

    print(f"\n  所有文件保存在: {OUTPUT_DIR}/")
    print(f"  ├── red_band.tif      (红波段)")
    print(f"  ├── nir_band.tif      (近红外波段)")
    print(f"  └── ndvi_result.tif   (NDVI 结果)")
    print(f"\n用 QGIS 或 Python 打开查看效果!")


if __name__ == "__main__":
    main()
