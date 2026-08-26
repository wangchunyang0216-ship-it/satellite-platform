# 遥感算法服务

本目录是平台的 Python FastAPI 算法服务。它与 Shur 的 Java/Spring Cloud 后端放在同一仓库管理，但仍以独立进程运行。

## 本地启动

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python main.py
```

服务默认监听 `http://localhost:8766`：

- 健康检查：`http://localhost:8766/api/health`
- Swagger：`http://localhost:8766/docs`

前端开发服务器已经把 `/api` 和 `/ws` 代理到该服务。`outputs/`、`uploads/`、`test_data/`、`data.db` 和 `.env` 都是本地运行数据，不提交到 Git。
