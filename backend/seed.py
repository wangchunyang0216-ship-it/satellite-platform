"""初始化数据库 + 创建测试账号"""

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from database import init_db, SessionLocal
from models import User
from auth import hash_password


def seed():
    init_db()
    db = SessionLocal()

    # 检查是否已有数据
    if db.query(User).first():
        print("⚠️  数据库已有数据，跳过初始化")
        db.close()
        return

    # 创建测试账号
    users = [
        User(
            username="admin",
            password=hash_password("admin123"),
            email="admin@satellite.com",
            company="遥感数据服务平台",
            role="admin",
            quota_used=0,
            quota_total=1000,
        ),
        User(
            username="demo",
            password=hash_password("demo123"),
            email="demo@test.com",
            company="测试农业公司",
            role="user",
            quota_used=12,
            quota_total=100,
        ),
    ]

    db.add_all(users)
    db.commit()
    db.close()
    print("✅ 数据库初始化完成")
    print("")
    print("测试账号:")
    print("  管理员 — admin / admin123")
    print("  普通用户 — demo / demo123")


if __name__ == "__main__":
    seed()
