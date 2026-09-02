<template>
  <div class="auth-page">
    <header class="auth-header">
      <button class="brand" type="button" @click="router.push('/rs/home')">
        <span class="brand-mark">RS</span>
        <span>{{ title }}</span>
      </button>
      <div class="header-actions">
        <el-button text @click="router.push('/rs/guide')">使用说明</el-button>
      </div>
    </header>

    <main class="auth-shell">
      <section class="guide-panel">
        <div class="panel-kicker">REMOTE SENSING DATA CENTER</div>
        <h1>遥感卫星数据服务平台</h1>
        <p class="panel-desc">统一管理卫星数据检索、算法计算、任务进度和三维成果查看，为企业与个人用户提供稳定的遥感数据服务入口。</p>

        <div class="notice-card">
          <div class="notice-title">
            <el-icon><DocumentChecked /></el-icon>
            平台宣传指导
          </div>
          <div class="notice-tabs">
            <button
              v-for="tab in guideTabs"
              :key="tab.key"
              type="button"
              :class="{ active: activeGuide === tab.key }"
              @click="activeGuide = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="notice-list">
            <article v-for="item in activeGuideItems" :key="item.title" class="notice-item">
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
              <a href="javascript:;">查看详情</a>
            </article>
          </div>
        </div>

        <div class="guide-extra-grid">
          <article v-for="item in guideExtras" :key="item.title">
            <strong>{{ item.title }}</strong>
            <span>{{ item.desc }}</span>
          </article>
        </div>

      </section>

      <section class="form-panel">
        <div class="panel-topline">
          <span class="topline-dot"></span>
          <span>AUTH NODE ONLINE</span>
          <span class="topline-divider"></span>
          <span>零代码接入 · 安全审计 · 任务可追踪</span>
        </div>

        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
          <div class="form-heading">
            <span>用户登录</span>
            <h2>欢迎回来</h2>
            <p>登录后进入控制台，继续管理数据、任务与计算成果。</p>
          </div>

          <div class="login-mode-tabs">
            <button type="button" :class="{ active: loginMode === 'account' }" @click="loginMode = 'account'">账号登录</button>
            <button type="button" :class="{ active: loginMode === 'phone' }" @click="loginMode = 'phone'">手机号登录</button>
            <button type="button" :class="{ active: loginMode === 'qr' }" @click="loginMode = 'qr'">二维码登录</button>
          </div>

          <div class="trust-row">
            <span>企业空间</span>
            <span>算法任务</span>
            <span>成果图层</span>
          </div>

          <template v-if="loginMode === 'account'">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                type="text"
                size="large"
                autocomplete="off"
                placeholder="请输入账号 / 手机号 / 邮箱"
              >
                <template #prefix><el-icon><User /></el-icon></template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                size="large"
                autocomplete="off"
                show-password
                placeholder="请输入登录密码"
                @keyup.enter="handleLogin"
              >
                <template #prefix><el-icon><Lock /></el-icon></template>
              </el-input>
            </el-form-item>
          </template>

          <template v-else-if="loginMode === 'phone'">
            <el-form-item>
              <el-input v-model.trim="phoneLoginForm.phone" size="large" autocomplete="off" placeholder="请输入手机号">
                <template #prefix><el-icon><User /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-input v-model.trim="phoneLoginForm.code" size="large" autocomplete="off" placeholder="请输入验证码">
                <template #append>
                  <button class="code-button" type="button">获取验证码</button>
                </template>
              </el-input>
            </el-form-item>
          </template>

          <div v-else class="qr-login-box">
            <div class="qr-code" aria-label="二维码登录">
              <span></span><span></span><span></span><span></span>
            </div>
            <strong>扫码登录平台</strong>
            <p>使用移动端工作台或企业微信扫码确认身份。</p>
          </div>

          <Verify
            ref="verifyRef"
            :mode="'pop'"
            :captchaType="'blockPuzzle'"
            :imgSize="{ width: '310px', height: '155px' }"
            @success="captchaCheckSuccess"
          />

          <div v-if="loginMode !== 'qr'" class="form-options">
            <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
            <a href="javascript:;" @click="forgotVisible = true">忘记密码？</a>
          </div>

          <el-button :loading="loading" size="large" type="primary" class="submit-btn" @click.prevent="handleLogin">
            {{ loading ? '登录中...' : loginMode === 'qr' ? '刷新二维码' : '登录' }}
          </el-button>

          <div class="quick-actions">
            <el-button plain @click="fillDemoAccount('admin')">管理员演示</el-button>
            <el-button plain @click="fillDemoAccount('demo')">普通用户演示</el-button>
          </div>

          <div class="security-note">
            <span class="note-title">安全提示</span>
            <p>当前登录入口已启用滑块校验、凭据记忆和路由回跳，适合直接接入遥感数据检索与算法任务控制台。</p>
          </div>

          <div class="switch-line">
            <span>还没有账号？</span>
            <router-link to="/register">立即注册</router-link>
          </div>
        </el-form>
      </section>
    </main>

    <el-dialog v-model="forgotVisible" title="找回密码" width="420px">
      <p class="dialog-text">演示环境请联系平台管理员重置密码；正式环境可对接短信、邮箱或企业统一身份认证。</p>
      <template #footer>
        <el-button type="primary" @click="forgotVisible = false">我知道了</el-button>
      </template>
    </el-dialog>

    <footer class="auth-footer">{{ footerContent }}</footer>
  </div>
</template>

<script setup>
import Cookies from "js-cookie"
import { computed, getCurrentInstance, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { DocumentChecked, Lock, User } from "@element-plus/icons-vue"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from "@/store/modules/user"
import defaultSettings from "@/settings"
import Verify from "@/components/Verifition/Verify"

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const verifyRef = ref(null)
const loading = ref(false)
const captchaEnabled = ref(true)
const redirect = ref(undefined)
const activeGuide = ref("standard")
const forgotVisible = ref(false)
const loginMode = ref("account")

const loginForm = ref({
  username: "admin",
  password: "admin123",
  rememberMe: false,
  captchaVerification: ""
})

const phoneLoginForm = ref({
  phone: "",
  code: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入密码" }]
}

const guideTabs = [
  { key: "standard", label: "服务规范" },
  { key: "template", label: "数据模板" },
  { key: "guide", label: "办理指南" }
]

const guideMap = {
  standard: [
    { title: "遥感数据接入与共享服务规范", desc: "覆盖账号开通、数据检索、订单申请与成果交付。" },
    { title: "算法计算任务安全使用说明", desc: "说明上传数据、运行任务、查看结果的权限边界。" },
    { title: "影像成果在线预览管理办法", desc: "支持三维场景叠加、图层筛选与任务溯源。" }
  ],
  template: [
    { title: "企业用户注册信息模板", desc: "适用于单位管理员创建组织空间和成员管理。" },
    { title: "个人科研用户认证模板", desc: "适用于教学、科研和轻量化数据试用场景。" },
    { title: "算法任务数据上传模板", desc: "明确 TIF、ZIP 与辅助文件命名规则。" }
  ],
  guide: [
    { title: "新用户开通流程", desc: "注册账号、完善资料、登录控制台、创建首个任务。" },
    { title: "企业空间开通流程", desc: "提交单位信息后由管理员审核并分配计算额度。" },
    { title: "结果查看与下载流程", desc: "任务完成后可进入 3D 页面查看并下载成果。" }
  ]
}

const guideExtras = [
  { title: "企业账号资料模板", desc: "统一信用代码、联系人、服务范围和成果交付偏好一次补全。" },
  { title: "个人试用办理指南", desc: "支持科研学习、轻量分析和样例任务验证，开通链路更短。" },
  { title: "任务进度与审计留痕", desc: "从数据申请、算法运行到成果预览，全流程状态可追踪。" },
  { title: "三维成果在线查看", desc: "影像、检测结果和空间图层可在控制台进行叠加预览。" }
]

const activeGuideItems = computed(() => guideMap[activeGuide.value])

watch(route, (newRoute) => {
  redirect.value = newRoute.query && newRoute.query.redirect
}, { immediate: true })

function captchaCheckSuccess(params) {
  loginForm.value.captchaVerification = params.captchaVerification
  doLogin()
}

function handleLogin() {
  proxy.$refs.loginRef.validate(valid => {
    if (valid) {
      if (captchaEnabled.value) {
        verifyRef.value.show()
      } else {
        doLogin()
      }
    }
  })
}

function doLogin() {
  loading.value = true
  if (loginForm.value.rememberMe) {
    Cookies.set("username", loginForm.value.username, { expires: 30 })
    Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
    Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
  } else {
    Cookies.remove("username")
    Cookies.remove("password")
    Cookies.remove("rememberMe")
  }

  userStore.login(loginForm.value).then(() => {
    sessionStorage.removeItem("rs-ai-assistant-login-prompted")
    const query = route.query
    const otherQueryParams = Object.keys(query).reduce((acc, cur) => {
      if (cur !== "redirect") {
        acc[cur] = query[cur]
      }
      return acc
    }, {})
    router.push({ path: redirect.value || "/", query: otherQueryParams })
  }).catch(() => {
    loading.value = false
    loginForm.value.captchaVerification = ""
  })
}

function fillDemoAccount(type) {
  loginForm.value.username = type
  loginForm.value.password = type === "admin" ? "admin123" : "demo123"
}

function getCookie() {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe),
    captchaVerification: ""
  }
}

getCookie()
</script>

<style lang="scss" scoped src="@/assets/styles/login.scss"></style>

