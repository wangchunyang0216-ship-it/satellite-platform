"""为所有已完成任务的 TIF 生成 Cesium PNG（调用已有 colormap，存到 outputs/）"""
import json, os, sys
import numpy as np
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "outputs"
MAX_DIM = 2048


def read_tif(path):
    try:
        import rasterio
        with rasterio.open(path) as src:
            return src.read(1).astype(np.float64), src.bounds
    except:
        return None, None


def read_npy(path):
    npy = path.with_suffix(".npy")
    js = path.with_suffix(".json")
    if npy.exists():
        data = np.load(npy).astype(np.float64)
        return data, None
    return None, None


def downsample(data, mx=MAX_DIM):
    h, w = data.shape
    if h <= mx and w <= mx:
        return data
    f = max(h // mx, w // mx) + 1
    return data[::f, ::f]


def _feather_mask(h, w, border_ratio=0.12):
    """生成羽化 alpha 遮罩：边缘更宽渐变"""
    alpha = np.ones((h, w), dtype=np.float64)
    border = int(min(h, w) * border_ratio)
    if border < 1 or h < 4 or w < 4:
        return (alpha * 255).astype(np.uint8)
    if border * 2 >= min(h, w):
        border = min(h, w) // 2 - 1
    if border < 1:
        return (alpha * 255).astype(np.uint8)
    for i in range(border):
        fade = i / border
        if i < h: alpha[i, :] = np.minimum(alpha[i, :], fade)
        if h - 1 - i >= 0: alpha[h - 1 - i, :] = np.minimum(alpha[h - 1 - i, :], fade)
        if i < w: alpha[:, i] = np.minimum(alpha[:, i], fade)
        if w - 1 - i >= 0: alpha[:, w - 1 - i] = np.minimum(alpha[:, w - 1 - i], fade)
    return (alpha * 255).astype(np.uint8)


def render(data, service):
    h, w = data.shape
    alpha = _feather_mask(h, w)

    # 整体 alpha 降低，让结果图融入底图而非贴膏药
    if service in ("ndvi", "spectral_index"):
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[data < 0] = (30, 60, 180, 40)
        rgba[(data >= 0) & (data < 0.15)] = (180, 160, 140, 100)
        rgba[(data >= 0.15) & (data < 0.3)] = (230, 210, 80, 110)
        rgba[(data >= 0.3) & (data < 0.5)] = (100, 190, 60, 115)
        rgba[(data >= 0.5) & (data < 0.7)] = (20, 150, 30, 120)
        rgba[(data >= 0.7)] = (5, 90, 10, 125)
        rgba[:, :, 3] = np.minimum(rgba[:, :, 3], alpha)
    elif service == "cloud_detection":
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[data > 127] = (255, 255, 255, 100)
        rgba[data <= 127] = (40, 40, 40, 10)
        rgba[:, :, 3] = np.minimum(rgba[:, :, 3], alpha)
    else:
        vmin = float(np.percentile(data, 2))
        vmax = float(np.percentile(data, 98))
        if vmax <= vmin: vmax = vmin + 1
        v = ((data - vmin) / (vmax - vmin) * 255).clip(0, 255).astype(np.uint8)
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[:, :, 0] = v
        rgba[:, :, 1] = v
        rgba[:, :, 2] = v
        rgba[:, :, 3] = (v * 0.35 + 15).astype(np.uint8)
        rgba[:, :, 3] = np.minimum(rgba[:, :, 3], alpha)
    return rgba


def gen_one(tif_path, service, task_id):
    data, bounds = read_tif(Path(tif_path))
    if data is None:
        data, bounds = read_npy(Path(tif_path))
    if data is None:
        print(f"[SKIP] 读不了: {tif_path}")
        return

    data = downsample(data)
    rgba = render(data, service)
    from PIL import Image
    fname = f"{task_id}_cesium.png"
    Image.fromarray(rgba, 'RGBA').save(OUTPUT_DIR / fname)
    print(f"[OK] {fname}  ({rgba.shape[1]}x{rgba.shape[0]})  service={service}")


def main():
    import sqlite3
    db_path = Path(__file__).parent / "data.db"
    if not db_path.exists():
        print("data.db 不存在，尝试遍历所有 TIF…")
        for f in OUTPUT_DIR.glob("*.tif"):
            tid = f.stem.split("_")[0]
            svc = f.stem.split("_")[-1] if "_" in f.stem else "unknown"
            gen_one(str(f), svc, tid)
        return

    conn = sqlite3.connect(str(db_path))
    rows = conn.execute(
        "SELECT task_id, service, output_path FROM compute_tasks WHERE status='completed' AND output_path != ''"
    ).fetchall()
    conn.close()

    for task_id, service, output_path in rows:
        path = Path(output_path)
        if not path.exists():
            print(f"[MISS] {task_id}: {output_path}")
            continue
        gen_one(str(path), service, task_id)

    print(f"\n完成! {len(rows)} 个任务")


if __name__ == "__main__":
    main()
