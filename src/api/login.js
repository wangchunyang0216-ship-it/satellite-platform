import request from '@/utils/request'

// 登录方法
export function login(username, password, captchaVerification) {
  return request({
    url: '/auth/login',
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    method: 'post',
    data: { username, password, captchaVerification }
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 刷新方法
export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

// 解锁屏幕
export function unlockScreen(password) {
  return request({
    url: '/auth/unlockscreen',
    method: 'post',
    data: { password }
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'delete'
  })
}

// 获取滑动验证码
export function getCaptcha() {
  return request({
    url: '/captcha/get',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// 校验滑动验证码
export function checkCaptcha(data) {
  return request({
    url: '/captcha/check',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data,
    timeout: 20000
  })
}