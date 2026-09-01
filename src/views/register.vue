<template>
  <div class="auth-page register-page">
    <header class="auth-header">
      <button class="brand" type="button" @click="router.push('/rs/home')">
        <span class="brand-mark">RS</span>
        <span>{{ title }}</span>
      </button>
      <div class="header-actions">
        <el-button text @click="router.push('/rs/guide')">使用说明</el-button>
        <el-button round @click="router.push('/login')">返回登录</el-button>
      </div>
    </header>

    <main class="auth-shell register-shell">
      <section class="guide-panel">
        <div class="panel-kicker">ACCOUNT APPLICATION</div>
        <h1>按使用场景开通遥感服务账号</h1>
        <p class="panel-desc">企业可申请组织空间、成员管理和更高计算额度；个人用户可快速开通试用账号，用于学习、科研和轻量任务验证。</p>

        <div class="signal-strip" aria-hidden="true">
          <span>ORG WORKSPACE</span>
          <span>PERSONAL TRIAL</span>
          <span>DATA COMPLIANCE</span>
        </div>

        <div class="register-visual-card">
          <div class="rv-orbit orbit-a"></div>
          <div class="rv-orbit orbit-b"></div>
          <div class="rv-core"></div>
          <div class="rv-content">
            <div class="rv-badge">ACCESS ROUTE MAP</div>
            <div class="rv-points">
              <article>
                <strong>企业</strong>
                <span>组织空间 / 多成员协同 / 更高任务额度</span>
              </article>
              <article>
                <strong>个人</strong>
                <span>快速试用 / 科研学习 / 轻量分析验证</span>
              </article>
              <article>
                <strong>资料审核</strong>
                <span>联系方式 / 使用场景 / 合规说明一次补全</span>
              </article>
              <article>
                <strong>开通后</strong>
                <span>检索数据 / 提交算法任务 / 在线查看成果</span>
              </article>
            </div>
          </div>
        </div>

        <div class="process-card">
          <h2>注册办理流程</h2>
          <div class="process-list">
            <article v-for="step in processSteps" :key="step.title">
              <span>{{ step.index }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.desc }}</p>
              </div>
            </article>
          </div>
        </div>

        <div class="policy-card">
          <div>
            <el-icon><InfoFilled /></el-icon>
            <strong>资料说明</strong>
          </div>
          <p>当前 Demo 环境会立即创建账号。正式环境可在这里接入企业审核、实名认证、附件归档和短信/邮箱验证。</p>
        </div>
      </section>

      <section class="form-panel register-form-panel">
        <div class="panel-topline">
          <span class="topline-dot"></span>
          <span>ACCOUNT ONBOARDING</span>
          <span class="topline-divider"></span>
          <span>先开户，后补充实名与资料</span>
        </div>

        <div class="inner-scroll">
          <el-form
            ref="registerRef"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            class="register-form"
          >
            <div class="form-heading">
              <span>账号注册</span>
              <h2>创建平台账号</h2>
              <p>注册页只填写基础信息，实名与资料认证后续在个人中心补充。</p>
            </div>

            <div class="trust-row">
              <span>快速开户</span>
              <span>资料后补</span>
              <span>功能前校验</span>
            </div>

            <el-form-item prop="accountType" class="type-item">
              <el-segmented v-model="registerForm.accountType" :options="accountTypeOptions" block />
            </el-form-item>

            <div class="section-title">
              <el-icon><UserFilled /></el-icon>
              基础注册信息
            </div>

            <template v-if="isEnterprise">
              <div class="form-grid">
                <el-form-item label="组织机构名称" prop="companyName">
                  <el-input v-model.trim="registerForm.companyName" size="large" placeholder="请输入组织或单位名称">
                    <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="管理员手机号" prop="phone">
                  <el-input v-model.trim="registerForm.phone" size="large" placeholder="用于登录通知和后续资料补全">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="登录密码" prop="password">
                  <el-input
                    v-model="registerForm.password"
                    size="large"
                    type="password"
                    show-password
                    placeholder="至少 6 位，建议包含字母和数字"
                    @keyup.enter="handleRegister"
                  >
                    <template #prefix><el-icon><Lock /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="registerForm.confirmPassword"
                    size="large"
                    type="password"
                    show-password
                    placeholder="再次输入登录密码"
                    @keyup.enter="handleRegister"
                  >
                    <template #prefix><el-icon><Lock /></el-icon></template>
                  </el-input>
                </el-form-item>
              </div>
            </template>

            <template v-else>
              <div class="form-grid">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model.trim="registerForm.phone" size="large" placeholder="用于登录通知和找回账号">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="联系邮箱" prop="email">
                  <el-input v-model.trim="registerForm.email" size="large" placeholder="用于接收通知和找回账号">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="登录密码" prop="password">
                  <el-input
                    v-model="registerForm.password"
                    size="large"
                    type="password"
                    show-password
                    placeholder="至少 6 位，建议包含字母和数字"
                    @keyup.enter="handleRegister"
                  >
                    <template #prefix><el-icon><Lock /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="registerForm.confirmPassword"
                    size="large"
                    type="password"
                    show-password
                    placeholder="再次输入登录密码"
                    @keyup.enter="handleRegister"
                  >
                    <template #prefix><el-icon><Lock /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="用户昵称" prop="displayName" class="full-row">
                  <el-input v-model.trim="registerForm.displayName" size="large" placeholder="例如：张同学、遥感分析员、项目成员">
                    <template #prefix><el-icon><UserFilled /></el-icon></template>
                  </el-input>
                </el-form-item>
              </div>
            </template>

            <el-form-item prop="agreement" class="agreement-item">
              <el-checkbox v-model="registerForm.agreement">
                我已阅读并同意平台服务协议、数据合规使用要求和隐私政策
              </el-checkbox>
            </el-form-item>

            <div class="security-note">
              <span class="note-title">办理说明</span>
              <p>详细实名信息、组织资质、任务配额和数据合规材料不在注册页填写；进入个人中心或使用受限功能时再提示补充。</p>
            </div>

            <div class="sticky-actions">
              <el-button :loading="loading" size="large" type="primary" class="submit-btn" @click.prevent="handleRegister">
                {{ loading ? '提交中...' : submitText }}
              </el-button>
              <el-button size="large" class="login-link-btn" @click="router.push('/login')">
                已有账号，返回登录页面
              </el-button>
            </div>
          </el-form>
        </div>
      </section>
    </main>

    <footer class="auth-footer">{{ footerContent }}</footer>
  </div>
</template>

<script setup>
import { ElMessageBox } from "element-plus"
import { computed, getCurrentInstance, ref, watch } from "vue"
import { useRouter } from "vue-router"
import {
  InfoFilled,
  Lock,
  OfficeBuilding,
  User,
  UserFilled
} from "@element-plus/icons-vue"
import { register } from "@/api/login"
import defaultSettings from "@/settings"
import { usePasswordRule } from "@/utils/passwordRule"

const title = import.meta.env.VITE_APP_TITLE
const footerContent = defaultSettings.footerContent
const router = useRouter()
const { proxy } = getCurrentInstance()
const { registerPwdValidator } = usePasswordRule()

const registerForm = ref({
  accountType: "enterprise",
  password: "",
  confirmPassword: "",
  companyName: "",
  displayName: "",
  email: "",
  phone: "",
  agreement: false
})

const loading = ref(false)

const accountTypeOptions = [
  { label: "企业注册", value: "enterprise" },
  { label: "个人注册", value: "personal" }
]

const processSteps = [
  { index: "01", title: "快速创建账号", desc: "个人填写手机号、邮箱和密码，组织填写基础联系人信息。" },
  { index: "02", title: "登录进入控制台", desc: "先体验数据检索、算法目录和成果查看入口。" },
  { index: "03", title: "按需补充资料", desc: "使用受限功能时再补实名、组织资质和配额资料。" }
]

const isEnterprise = computed(() => registerForm.value.accountType === "enterprise")
const submitText = computed(() => isEnterprise.value ? "提交组织机构注册申请" : "提交个人注册")
const generatedUsername = computed(() => registerForm.value.phone.trim())
const generatedEmail = computed(() => registerForm.value.email.trim() || `${registerForm.value.phone.trim() || "user"}@rs-demo.local`)

const equalToPassword = (rule, value, callback) => {
  if (registerForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const validateAgreement = (rule, value, callback) => {
  if (!value) {
    callback(new Error("请先同意平台服务协议"))
  } else {
    callback()
  }
}

const registerRules = {
  password: registerPwdValidator,
  confirmPassword: [
    { required: true, trigger: "blur", message: "请再次输入密码" },
    { validator: equalToPassword, trigger: "blur" }
  ],
  companyName: [{ required: true, trigger: "blur", message: "请输入组织机构名称" }],
  displayName: [{ required: true, trigger: "blur", message: "请输入用户昵称" }],
  email: [
    { required: true, trigger: "blur", message: "请输入联系邮箱" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }
  ],
  phone: [
    { required: true, trigger: "blur", message: "请输入联系电话" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" }
  ],
  agreement: [{ validator: validateAgreement, trigger: "change" }]
}

watch(() => registerForm.value.accountType, () => {
  proxy?.$refs?.registerRef?.clearValidate()
})

function buildRegisterPayload() {
  const phone = registerForm.value.phone.trim()
  const displayName = registerForm.value.displayName.trim()

  return {
    username: generatedUsername.value,
    password: registerForm.value.password,
    email: generatedEmail.value,
    company: isEnterprise.value ? registerForm.value.companyName : displayName,
    accountType: registerForm.value.accountType,
    phone,
    profile: {
      displayName,
      profileCompleted: false,
      realNameVerified: false,
      organizationVerified: false
    }
  }
}

function handleRegister() {
  proxy.$refs.registerRef.validate(valid => {
    if (valid) {
      loading.value = true
      register(buildRegisterPayload()).then(() => {
        ElMessageBox.alert(
          `账号 ${registerForm.value.phone} 注册成功，请返回登录页面进入平台。后续完整实名与资料信息可在个人中心补充。`,
          "系统提示",
          { type: "success" }
        ).then(() => {
          router.push("/login")
        }).catch(() => {})
      }).catch(() => {
        loading.value = false
      })
    }
  })
}
</script>

<style lang="scss" scoped>
.auth-page {
  --brand-blue: #2563eb;
  --brand-blue-dark: #1d4ed8;
  --ink: #1f2937;
  --muted: #6b7280;
  --light-muted: #9ca3af;
  --line: #e5e7eb;
  --soft: #f8fafc;
  height: 100vh;
  position: relative;
  overflow: hidden;
  color: var(--ink);
  background:
    linear-gradient(155deg, rgba(19, 39, 66, 0.96) 0%, rgba(42, 62, 87, 0.94) 45%, rgba(78, 96, 115, 0.92) 100%),
    url("../assets/images/login-background.jpg") center / cover no-repeat;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.auth-page::before {
  content: "";
  position: absolute;
  inset: 0;
  height: 100%;
  background:
    linear-gradient(180deg, rgba(11, 26, 48, 0.32), rgba(11, 26, 48, 0.12) 48%, rgba(15, 23, 42, 0.2)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: auto, 88px 88px;
  pointer-events: none;
}

.auth-page::after {
  content: "";
  position: absolute;
  top: 88px;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

.auth-header {
  position: relative;
  z-index: 2;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100vw - 96px);
  margin: 0 auto;
  padding: 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.brand-mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions :deep(.el-button.is-text) {
  color: rgba(255, 255, 255, 0.82);
}

.header-actions :deep(.el-button:not(.is-text)) {
  border-color: rgba(255, 255, 255, 0.32);
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.auth-shell {
  position: relative;
  z-index: 1;
  width: calc(100vw - 96px);
  height: calc(100vh - 56px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  align-items: start;
  gap: 56px;
  box-sizing: border-box;
  padding: 30px 0 44px;
}

.guide-panel {
  position: relative;
  padding: 0;
  color: #fff;
}

.panel-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.panel-kicker::before {
  content: "";
  width: 28px;
  height: 1px;
  background: #60a5fa;
}

.guide-panel h1 {
  margin: 16px 0 14px;
  font-size: 38px;
  line-height: 1.22;
  letter-spacing: 0;
}

.panel-desc {
  margin: 0 0 24px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 18px;
  line-height: 1.78;
}

.signal-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.signal-strip span {
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  letter-spacing: 0;
}

.register-visual-card {
  position: relative;
  min-height: 156px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(13, 43, 69, 0.72);
  box-shadow: none;
}

.rv-orbit,
.rv-core {
  position: absolute;
  border-radius: 50%;
}

.rv-orbit {
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.orbit-a {
  top: 16px;
  right: 28px;
  width: 140px;
  height: 140px;
}

.orbit-b {
  top: 34px;
  right: 46px;
  width: 104px;
  height: 104px;
}

.rv-core {
  right: 91px;
  top: 79px;
  width: 16px;
  height: 16px;
  background: #60a5fa;
  box-shadow: none;
}

.rv-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 156px;
  padding: 18px;
}

.rv-badge {
  align-self: flex-start;
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.rv-points {
  display: grid;
  gap: 8px;
}

.rv-points article {
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rv-points strong {
  display: block;
  color: #fff;
  font-size: 16px;
}

.rv-points span {
  display: block;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  line-height: 1.65;
}

.process-card,
.policy-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  padding: 18px;
  color: var(--ink);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
}

.process-card h2 {
  margin: 0 0 18px;
  font-size: 18px;
}

.process-list {
  display: grid;
  gap: 12px;
}

.process-list article {
  display: flex;
  gap: 14px;
}

.process-list article > span {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  font-weight: 800;
  background: var(--brand-blue);
}

.process-list strong {
  display: block;
  color: var(--ink);
}

.process-list p {
  margin: 5px 0 0;
  color: var(--muted);
  line-height: 1.6;
}

.policy-card {
  margin-top: 16px;
}

.policy-card div {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.policy-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.register-form-panel {
  height: calc(100vh - 130px);
  min-height: 0;
  max-height: none;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
  padding: 0;
  overflow: hidden;
}

.panel-topline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f1f3;
  color: var(--light-muted);
  font-size: 12px;
  letter-spacing: 0;
}

.topline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: none;
}

.topline-divider {
  width: 1px;
  height: 14px;
  background: #e5e7eb;
}

.inner-scroll {
  height: calc(100% - 43px);
  max-height: none;
  overflow: auto;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
}

.register-form {
  padding: 24px 28px 24px;
  color: #1f2d3d;
}

.form-heading {
  text-align: center;
  margin-bottom: 16px;
}

.form-heading span {
  display: inline-flex;
  color: var(--brand-blue);
  font-weight: 700;
  letter-spacing: 1px;
}

.form-heading h2 {
  margin: 6px 0;
  color: #10213a;
  font-size: 28px;
  letter-spacing: 0;
}

.form-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.trust-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 0 0 16px;
}

.trust-row span {
  padding: 5px 10px;
  border-radius: 5px;
  background: rgba(37, 99, 235, 0.06);
  border: 0;
  color: var(--brand-blue);
  font-size: 12px;
  font-weight: 600;
}

.type-item {
  margin-bottom: 18px;
}

.type-item :deep(.el-segmented) {
  width: 100%;
  padding: 4px;
  border-radius: 10px;
  background: #f3f4f6;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
  color: var(--ink);
  font-size: 18px;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 20px;
}

.form-grid .full-row {
  grid-column: 1 / -1;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.register-form :deep(.el-form-item__label) {
  color: #34445a;
  font-weight: 600;
}

.register-form :deep(.el-input__wrapper),
.register-form :deep(.el-select__wrapper) {
  min-height: 46px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 1px #d1d5db inset;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.register-form :deep(.el-input__wrapper.is-focus),
.register-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--brand-blue) inset, 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.register-form :deep(.el-input__prefix-inner) {
  color: #2563eb;
}

.register-form :deep(.el-segmented__item) {
  min-height: 40px;
  border-radius: 8px;
  font-weight: 700;
}

.register-form :deep(.el-segmented__item.is-selected) {
  color: #fff;
  background: #fff;
  color: var(--brand-blue);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.license-upload :deep(.el-upload) {
  display: inline-flex;
}

.license-upload :deep(.el-button) {
  min-height: 42px;
  border-radius: 8px;
  background: var(--brand-blue);
  border: 0;
}

.upload-tip {
  margin-top: 8px;
  color: #f04444;
  font-size: 13px;
}

.agreement-item {
  margin-top: 14px;
}

.agreement-item :deep(.el-checkbox__label) {
  color: #4a5568;
  line-height: 1.6;
  white-space: normal;
}

.security-note {
  margin-top: 10px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.note-title {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--brand-blue);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.security-note p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.75;
}

.sticky-actions {
  position: sticky;
  bottom: -24px;
  z-index: 2;
  display: grid;
  gap: 10px;
  padding: 16px 0 0;
  border-top: 1px solid #edf0f5;
  background: rgba(255, 255, 255, 0.98);
}

.submit-btn,
.login-link-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-weight: 700;
}

.submit-btn {
  border: 0;
  background: var(--brand-blue);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
}

.login-link-btn {
  border-color: #d5e6fb;
  background: #fff;
  color: #374151;
}

.auth-footer {
  position: fixed;
  bottom: 14px;
  left: 0;
  z-index: 2;
  width: 100%;
  color: rgba(255, 255, 255, 0.64);
  text-align: center;
  font-size: 12px;
}

/* Register page keeps the same login-page rhythm while avoiding clipped side content. */
.register-shell {
  grid-template-columns: 390px minmax(0, 1fr);
  align-items: stretch;
  gap: 48px;
  padding: 24px 0 52px;
}

.register-shell .guide-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 24px;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.96);
  box-shadow: 0 18px 46px rgba(8, 20, 36, 0.18);
  overflow: hidden;
  color: #10213a;
}

.register-shell .guide-panel h1 {
  margin: 12px 0 10px;
  font-size: 30px;
  line-height: 1.24;
  color: #10213a;
}

.register-shell .panel-desc {
  margin-bottom: 0;
  font-size: 15px;
  line-height: 1.75;
  color: #475569;
}

.register-shell .signal-strip {
  display: none;
}

.register-visual-card {
  min-height: 256px;
  margin-top: 22px;
  margin-bottom: 14px;
  border-color: rgba(203, 213, 225, 0.86);
  background: #fff;
}

.rv-content {
  min-height: 256px;
  padding: 17px 16px 18px;
}

.rv-badge {
  border-color: #dbeafe;
  background: #eff6ff;
  color: var(--brand-blue);
}

.rv-points {
  gap: 9px;
}

.rv-points article {
  padding: 12px 13px;
  border-color: #e5e7eb;
  background: #f8fafc;
}

.rv-points strong {
  color: #10213a;
  font-size: 15px;
}

.rv-points span {
  color: #64748b;
  font-size: 12.5px;
  line-height: 1.6;
}

.process-card {
  margin-top: auto;
  padding: 16px;
  transform: translateY(-4px);
}

.process-card h2 {
  margin-bottom: 12px;
  font-size: 17px;
}

.process-list {
  gap: 10px;
}

.process-list article {
  gap: 12px;
}

.process-list article > span {
  width: 34px;
  height: 34px;
  flex-basis: 34px;
}

.process-list p {
  margin-top: 3px;
  font-size: 13px;
  line-height: 1.55;
}

.policy-card {
  display: none;
}

.register-form-panel {
  align-self: stretch;
  height: auto;
}

.inner-scroll {
  height: calc(100vh - 154px);
}

.sticky-actions {
  bottom: 0;
  padding-bottom: 0;
}

@media (max-width: 1100px) {
  .auth-page {
    overflow: auto;
    height: auto;
  }

  .auth-shell {
    width: calc(100vw - 40px);
    min-height: auto;
    height: auto;
    grid-template-columns: 1fr;
    padding-bottom: 88px;
  }

  .register-form-panel,
  .inner-scroll {
    min-height: auto;
    height: auto;
    max-height: none;
  }

  .rv-core,
  .rv-orbit {
    display: none;
  }
}

@media (max-width: 640px) {
  .auth-header {
    height: auto;
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    width: calc(100vw - 40px);
    padding: 18px 0;
  }

  .guide-panel,
  .register-form-panel {
    padding: 0;
  }

  .guide-panel h1 {
    font-size: 30px;
  }

  .register-form {
    padding: 24px 18px 20px;
  }

  .panel-topline {
    padding-inline: 4px;
    flex-wrap: wrap;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
