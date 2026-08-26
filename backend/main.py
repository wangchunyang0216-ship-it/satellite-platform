"""
遥感卫星数据服务平台 — 后端 API
启动: python main.py   (默认端口 8765)
"""

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import get_db, init_db, SessionLocal
from models import User
from schemas import (
    RegisterRequest, LoginRequest,
    UserResponse, TokenResponse, QuotaResponse, ApiResponse,
)
from auth import hash_password, verify_password, create_access_token, get_current_user
from compute_routes import router as compute_router
from imagery_routes import router as imagery_router
from ai_routes import router as ai_router

OUTPUT_DIR = Path(__file__).parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(title="遥感卫星数据服务平台 API", version="1.0.0")

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════
#  Auth 路由
# ══════════════════════════════════════════

@app.post("/api/v1/auth/register", response_model=ApiResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # 检查用户名是否已存在
    exists = db.query(User).filter(User.username == req.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="用户名已被注册")

    user = User(
        username=req.username,
        password=hash_password(req.password),
        email=req.email,
        company=req.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return ApiResponse(data={"token": token, "user": user.to_dict()})


@app.post("/api/v1/auth/login", response_model=ApiResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_access_token(user.id)
    return ApiResponse(data={"token": token, "user": user.to_dict()})


# ══════════════════════════════════════════
#  User 路由（需认证）
# ══════════════════════════════════════════

@app.get("/api/v1/user/profile", response_model=ApiResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=current_user.to_dict())


@app.get("/api/v1/user/quota", response_model=ApiResponse)
def get_quota(current_user: User = Depends(get_current_user)):
    return ApiResponse(data={
        "used": current_user.quota_used,
        "total": current_user.quota_total,
    })


# ══════════════════════════════════════════
#  Health
# ══════════════════════════════════════════

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── 注册算法服务路由 ──
app.include_router(compute_router)

# ── 注册 Cesium 3D 影像路由 ──
app.include_router(imagery_router)

# ── 注册 AI 教程助手路由 ──
app.include_router(ai_router)

# ── 静态文件服务（Cesium PNG 影像）──
app.mount("/api/v1/compute/imagery-files", StaticFiles(directory=str(OUTPUT_DIR)), name="imagery_files")


# ══════════════════════════════════════════
#  Entry
# ══════════════════════════════════════════

def auto_seed():
    """如果数据库无用户，自动创建测试账号"""
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            from seed import seed
            seed()
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    from database import SessionLocal
    init_db()
    auto_seed()
    print("[OK] 数据库已初始化")
    print("[OK] 启动服务: http://localhost:8766")
    print("[OK] API 文档: http://localhost:8766/docs")
    print("  测试账号: admin/admin123  |  demo/demo123")
    uvicorn.run(app, host="0.0.0.0", port=8766)
