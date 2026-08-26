import request from './request'
import type { ApiResponse } from '@/types/common'

export interface UserProfile {
  id: string
  username: string
  email: string
  company: string
  role: 'admin' | 'user'
  quotaUsed: number
  quotaTotal: number
  apiKey: string
}

export interface AuthData {
  token: string
  user: UserProfile
}

export const userApi = {
  login(params: { username: string; password: string }) {
    return request.post<any, ApiResponse<AuthData>>('/auth/login', params)
  },
  register(params: { username: string; password: string; email: string; company: string }) {
    return request.post<any, ApiResponse<AuthData>>('/auth/register', params)
  },
  getProfile() {
    return request.get<unknown, { data: UserProfile }>('/user/profile')
  },
  getQuota() {
    return request.get<unknown, { data: { used: number; total: number } }>('/user/quota')
  },
  resetApiKey() {
    return request.post<unknown, { data: { apiKey: string } }>('/user/apikey')
  },
  changePassword(params: { oldPassword: string; newPassword: string }) {
    return request.post('/user/change-password', params)
  },
}
