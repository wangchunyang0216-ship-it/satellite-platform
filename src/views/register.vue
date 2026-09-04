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

        <div class="register-visual-card">
          <div class="rv-orbit orbit-a"></div>
          <div class="rv-orbit orbit-b"></div>
          <div class="rv-content">
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
        <div class="form-panel-title">账号注册</div>

        <div class="inner-scroll">
          <el-form
            ref="registerRef"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            class="register-form"
          >
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
                <div class="field-group">
                <el-form-item label="联系邮箱" prop="email">
                  <el-input v-model.trim="registerForm.email" size="large" type="email" autocomplete="email" placeholder="用于接收验证码与通知">
                    <template #prefix><el-icon><Message /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="邮箱验证码" prop="emailCode">
                  <div class="verification-row">
                    <el-input v-model.trim="registerForm.emailCode" size="large" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入 6 位验证码" />
                    <el-button class="code-button" :disabled="codeCountdown > 0" @click="sendEmailCode">{{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}</el-button>
                  </div>
                </el-form-item>
                </div>
                <div class="field-group">
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
              </div>
            </template>

            <template v-else>
              <div class="form-grid">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model.trim="registerForm.phone" size="large" placeholder="用于登录通知和找回账号">
                    <template #prefix><el-icon><User /></el-icon></template>
                  </el-input>
                </el-form-item>
                <div class="field-group">
                <el-form-item label="联系邮箱" prop="email">
                  <el-input v-model.trim="registerForm.email" size="large" type="email" autocomplete="email" placeholder="用于接收验证码与通知">
                    <template #prefix><el-icon><Message /></el-icon></template>
                  </el-input>
                </el-form-item>
                <el-form-item label="邮箱验证码" prop="emailCode">
                  <div class="verification-row">
                    <el-input v-model.trim="registerForm.emailCode" size="large" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入 6 位验证码" />
                    <el-button class="code-button" :disabled="codeCountdown > 0" @click="sendEmailCode">{{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}</el-button>
                  </div>
                </el-form-item>
                </div>
                <div class="field-group">
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

            <Verify
              ref="verifyRef"
              mode="pop"
              captcha-type="blockPuzzle"
              :img-size="{ width: '310px', height: '155px' }"
              @success="captchaCheckSuccess"
            />
          </el-form>
        </div>
      </section>
    </main>

    <footer class="auth-footer">{{ footerContent }}</footer>
  </div>
</template>

<script src="./register.js"></script>

<style src="@/assets/styles/register.scss" lang="scss" scoped></style>
