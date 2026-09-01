"""SQLAlchemy 数据库引擎 — SQLite"""

from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = Path(__file__).parent / "data.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 单线程限制
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 依赖注入：每个请求获取独立 session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """建表"""
    Base.metadata.create_all(bind=engine)
    ensure_schema_updates()


def ensure_schema_updates():
    """轻量级 SQLite 结构补丁，兼容已有 data.db。"""
    with engine.begin() as conn:
        rows = conn.execute(text("PRAGMA table_info(compute_tasks)")).fetchall()
        columns = {row[1] for row in rows}
        if rows and "task_name" not in columns:
            conn.execute(text("ALTER TABLE compute_tasks ADD COLUMN task_name VARCHAR(128) DEFAULT ''"))
