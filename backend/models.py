"""数据库模型 — User"""

import secrets
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)           # bcrypt hash
    email = Column(String(100), nullable=False)
    company = Column(String(100), default="")
    role = Column(String(10), default="user")                # user / admin
    quota_used = Column(Integer, default=0)
    quota_total = Column(Integer, default=100)
    api_key = Column(String(64), default=lambda: secrets.token_hex(32))
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "company": self.company,
            "role": self.role,
            "quotaUsed": self.quota_used,
            "quotaTotal": self.quota_total,
            "apiKey": self.api_key,
        }


class ComputeTask(Base):
    """算法服务 — 计算任务"""
    __tablename__ = "compute_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(64), unique=True, nullable=False, index=True)
    task_name = Column(String(128), default="")
    user_id = Column(Integer, nullable=False)
    service = Column(String(32), nullable=False)                 # calibration / atmospheric / ...
    params_json = Column(String(4096), default="{}")              # 请求参数 JSON
    status = Column(String(16), default="pending")               # pending / running / completed / failed
    progress = Column(Integer, default=0)                        # 0–100
    output_path = Column(String(512), default="")
    stats_json = Column(String(4096), default="{}")              # 输出统计 JSON
    error_message = Column(String(1024), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    elapsed_sec = Column(Integer, default=0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "taskId": self.task_id,
            "taskName": self.task_name,
            "userId": self.user_id,
            "service": self.service,
            "params": self.params_json,
            "status": self.status,
            "progress": self.progress,
            "outputPath": self.output_path,
            "stats": self.stats_json,
            "errorMessage": self.error_message,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "elapsedSec": self.elapsed_sec,
        }
