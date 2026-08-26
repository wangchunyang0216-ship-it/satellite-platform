import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/common'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const TIMEOUT = 30000

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

// 活跃的请求控制器 Map
const pendingRequests = new Map<string, AbortController>()

/** 生成请求唯一 key */
function getRequestKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`
}

// ── 请求拦截 ──
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 自动附加 Token（复用 Shur 框架的 Admin-Token Cookie）
    const token = Cookies.get('Admin-Token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 自动附加 API Key
    const apiKey = localStorage.getItem('apiKey')
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey
    }

    // 取消重复请求（GET 请求）
    if (config.method?.toUpperCase() === 'GET') {
      const key = getRequestKey(config)
      const existing = pendingRequests.get(key)
      if (existing) {
        existing.abort()
      }
      const controller = new AbortController()
      config.signal = controller.signal
      pendingRequests.set(key, controller)
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ── 响应拦截 ──
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 清理 pending 记录
    if (response.config.method?.toUpperCase() === 'GET') {
      pendingRequests.delete(getRequestKey(response.config))
    }

    // 202 异步任务已提交
    if (response.status === 202) {
      ElMessage.info('任务已提交，正在异步处理…')
    }

    return response
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.log('[Request Cancelled]', error.message)
      return Promise.reject(error)
    }

    const status = error.response?.status
    switch (status) {
      case 401:
        localStorage.removeItem('token')
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
        break
      case 403:
        ElMessage.error('暂无操作权限')
        break
      case 500:
        ElMessage.error('服务器内部错误，请稍后重试')
        break
      default:
        ElMessage.error(error.response?.data?.message || '网络请求失败')
    }

    return Promise.reject(error)
  },
)

export default request
