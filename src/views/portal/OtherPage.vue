<template>
  <div class="profile-page">
    <el-row :gutter="18">
      <el-col :xs="24" :lg="8">
        <section class="card account-card">
          <div class="user-line">
            <el-avatar :size="62" icon="UserFilled" />
            <div>
              <h2>{{ displayName }}</h2>
              <p>{{ roleLabel }} · {{ userStore.user?.email || profileForm.email || '-' }}</p>
            </div>
          </div>

          <el-descriptions :column="1" border size="small" class="account-desc">
            <el-descriptions-item label="登录账号">{{ userStore.user?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户昵称">{{ profileForm.displayName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号码">
              <el-input v-model.trim="profileForm.phone" class="side-desc-input" placeholder="请输入手机号" />
            </el-descriptions-item>
            <el-descriptions-item label="联系邮箱">
              <el-input v-model.trim="profileForm.email" class="side-desc-input" placeholder="请输入邮箱" />
            </el-descriptions-item>
            <el-descriptions-item label="所在地区">
              <el-input v-model.trim="profileForm.region" class="side-desc-input" placeholder="例如：北京" />
            </el-descriptions-item>
            <el-descriptions-item label="账号类型">{{ profileForm.accountType === 'enterprise' ? '组织机构' : '个人用户' }}</el-descriptions-item>
            <el-descriptions-item label="所属单位">{{ userStore.user?.company || profileForm.organizationName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="API Key">{{ userStore.user?.apiKey || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="card progress-card">
          <div class="card-title-row">
            <h3>资料完整度</h3>
            <strong>{{ completionPercent }}%</strong>
          </div>
          <el-progress :percentage="completionPercent" :stroke-width="12" />
          <div class="check-list">
            <div v-for="item in completionItems" :key="item.label" :class="{ done: item.done }">
              <span></span>
              {{ item.label }}
            </div>
          </div>
        </section>

        <section class="card quota-card">
          <h3>配额使用</h3>
          <div class="quota-line">
            <span>数据调用配额</span>
            <strong>{{ userStore.user?.quotaUsed || 0 }} / {{ userStore.user?.quotaTotal || 100 }}</strong>
          </div>
          <el-progress :percentage="userStore.quotaPercent" :stroke-width="10" />
        </section>
      </el-col>

      <el-col :xs="24" :lg="16">
        <section class="card form-card">
          <div class="form-head">
            <div>
              <h2>资料补全</h2>
            </div>
            <el-button plain @click="resetForm">重置</el-button>
          </div>

          <el-form ref="profileRef" :model="profileForm" :rules="profileRules" label-position="top">
            <div class="form-grid">
              <el-form-item label="账号类型" prop="accountType">
                <el-radio-group v-model="profileForm.accountType">
                  <el-radio-button label="personal">个人</el-radio-button>
                  <el-radio-button label="enterprise">组织机构</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="真实姓名" prop="realName">
                <el-input v-model.trim="profileForm.realName" placeholder="请填写身份证件上的真实姓名" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'personal'" label="身份证号码" prop="idCard">
                <el-input v-model.trim="profileForm.idCard" placeholder="请输入 18 位身份证号码" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'personal'" label="职业身份" prop="personalRole">
                <el-select v-model="profileForm.personalRole" placeholder="请选择">
                  <el-option label="学生/科研学习" value="student" />
                  <el-option label="科研人员" value="researcher" />
                  <el-option label="企业从业者" value="practitioner" />
                  <el-option label="政府/事业单位人员" value="public" />
                  <el-option label="个人开发者" value="developer" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'personal'" label="所属单位/学校" prop="personalOrg">
                <el-input v-model.trim="profileForm.personalOrg" placeholder="没有可填写个人" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'personal'" label="所属组织机构" prop="personalOrganization">
                <el-input v-model.trim="profileForm.personalOrganization" placeholder="可填写组织机构名称、账号或邀请码，用于后续挂靠组织账号" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'personal'" label="证件有效期" prop="idCardExpire">
                <el-date-picker v-model="profileForm.idCardExpire" type="date" value-format="YYYY-MM-DD" placeholder="请选择身份证有效期" style="width: 100%" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'personal'" label="常住地址" prop="contactAddress" class="full-row">
                <el-input v-model.trim="profileForm.contactAddress" placeholder="请输入常住地址或联系地址" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'enterprise'" label="组织机构名称" prop="organizationName">
                <el-input v-model.trim="profileForm.organizationName" placeholder="填写营业执照或单位证照上的完整名称" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'enterprise'" label="统一社会信用代码" prop="creditCode">
                <el-input v-model.trim="profileForm.creditCode" placeholder="18 位大写字母或数字" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'enterprise'" label="法定代表人" prop="legalPerson">
                <el-input v-model.trim="profileForm.legalPerson" placeholder="请输入法定代表人姓名" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'enterprise'" label="企业联系人职务" prop="contactTitle">
                <el-input v-model.trim="profileForm.contactTitle" placeholder="例如：项目负责人 / 数据管理员" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'enterprise'" label="注册地址" prop="registeredAddress" class="full-row">
                <el-input v-model.trim="profileForm.registeredAddress" placeholder="请输入营业执照登记地址" />
              </el-form-item>
              <el-form-item v-if="profileForm.accountType === 'enterprise'" label="经营/业务范围" prop="businessScope" class="full-row">
                <el-input v-model.trim="profileForm.businessScope" type="textarea" :rows="3" placeholder="简要说明单位业务范围或项目用途" />
              </el-form-item>
              <el-form-item class="full-row" label="实名/资质状态">
                <el-alert
                  :closable="false"
                  show-icon
                  type="info"
                  title="当前仅保存补全资料，证件上传、人工审核和实名校验接口后续可接入后端。"
                />
              </el-form-item>
            </div>

            <div class="actions">
              <el-button type="primary" size="large" @click="saveProfile">保存补全资料</el-button>
              <el-button size="large" @click="router.push('/console/dashboard')">返回控制台</el-button>
            </div>
          </el-form>
        </section>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/useUserStore'

const STORAGE_KEY = 'rs-profile-completion'
const router = useRouter()
const userStore = useUserStore()
const profileRef = ref()

const savedProfile = readSavedProfile()

const profileForm = reactive({
  displayName: savedProfile.displayName || userStore.user?.username || '',
  phone: savedProfile.phone || userStore.user?.username || '',
  email: savedProfile.email || userStore.user?.email || '',
  region: savedProfile.region || '',
  accountType: savedProfile.accountType || 'personal',
  realName: savedProfile.realName || '',
  idCard: savedProfile.idCard || '',
  personalRole: savedProfile.personalRole || '',
  personalOrg: savedProfile.personalOrg || '',
  personalOrganization: savedProfile.personalOrganization || '',
  idCardExpire: savedProfile.idCardExpire || '',
  contactAddress: savedProfile.contactAddress || '',
  organizationName: savedProfile.organizationName || userStore.user?.company || '',
  creditCode: savedProfile.creditCode || '',
  legalPerson: savedProfile.legalPerson || '',
  contactTitle: savedProfile.contactTitle || '',
  registeredAddress: savedProfile.registeredAddress || '',
  businessScope: savedProfile.businessScope || ''
})

const profileRules = {
  displayName: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  idCard: [{ validator: validateIdCard, trigger: 'blur' }],
  personalRole: [{ validator: validatePersonalRequired('请选择职业身份'), trigger: 'change' }],
  personalOrg: [{ validator: validatePersonalRequired('请输入所属单位/学校'), trigger: 'blur' }],
  idCardExpire: [{ validator: validatePersonalRequired('请选择证件有效期'), trigger: 'change' }],
  contactAddress: [{ validator: validatePersonalRequired('请输入常住地址'), trigger: 'blur' }],
  organizationName: [{ validator: validateOrganization, trigger: 'blur' }],
  creditCode: [{ validator: validateCreditCode, trigger: 'blur' }],
  legalPerson: [{ validator: validateEnterpriseRequired('请输入法定代表人'), trigger: 'blur' }],
  contactTitle: [{ validator: validateEnterpriseRequired('请输入企业联系人职务'), trigger: 'blur' }],
  registeredAddress: [{ validator: validateEnterpriseRequired('请输入注册地址'), trigger: 'blur' }],
  businessScope: [{ validator: validateEnterpriseRequired('请输入经营或业务范围'), trigger: 'blur' }]
}

const roleLabel = computed(() => userStore.user?.role === 'admin' ? '管理员' : '普通用户')
const displayName = computed(() => profileForm.displayName || userStore.user?.username || '用户')

const completionItems = computed(() => [
  { label: '基础联系信息', done: !!(profileForm.displayName && profileForm.phone && profileForm.email) },
  { label: '实名信息', done: profileForm.accountType === 'personal' ? !!(profileForm.realName && profileForm.idCard) : !!profileForm.realName },
  {
    label: '个人补充资料',
    done: profileForm.accountType === 'enterprise' || !!(profileForm.personalRole && profileForm.personalOrg && profileForm.idCardExpire && profileForm.contactAddress)
  },
  {
    label: '企业补充资料',
    done: profileForm.accountType === 'personal' || !!(profileForm.legalPerson && profileForm.contactTitle && profileForm.registeredAddress && profileForm.businessScope)
  }
])

const completionPercent = computed(() => {
  const doneCount = completionItems.value.filter(item => item.done).length
  return Math.round((doneCount / completionItems.value.length) * 100)
})

function validateOrganization(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (profileForm.accountType === 'enterprise' && !value) {
    callback(new Error('请输入组织机构名称'))
    return
  }
  callback()
}

function validateCreditCode(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (profileForm.accountType !== 'enterprise') {
    callback()
    return
  }
  if (!value) {
    callback(new Error('请输入统一社会信用代码'))
    return
  }
  if (!/^[A-Z0-9]{18}$/.test(value)) {
    callback(new Error('请输入 18 位大写字母或数字'))
    return
  }
  callback()
}

function validateIdCard(rule: unknown, value: string, callback: (error?: Error) => void) {
  if (profileForm.accountType !== 'personal') {
    callback()
    return
  }
  if (!value) {
    callback(new Error('请输入身份证号码'))
    return
  }
  if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
    callback(new Error('请输入正确的 18 位身份证号码'))
    return
  }
  callback()
}

function validateEnterpriseRequired(message: string) {
  return (rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (profileForm.accountType === 'enterprise' && !value) {
      callback(new Error(message))
      return
    }
    callback()
  }
}

function validatePersonalRequired(message: string) {
  return (rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (profileForm.accountType === 'personal' && !value) {
      callback(new Error(message))
      return
    }
    callback()
  }
}

function readSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProfile() {
  profileRef.value?.validate((valid: boolean) => {
    if (!valid) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...profileForm,
      profileCompleted: completionPercent.value >= 100,
      updatedAt: new Date().toISOString()
    }))
    ElMessage.success('资料已保存，后续接入后端接口后可同步入库')
  })
}

function resetForm() {
  Object.assign(profileForm, readSavedProfile())
  ElMessage.info('已恢复到上次保存的资料')
}
</script>

<style scoped>
.profile-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  background: #f4f7fb;
}

.profile-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 24px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #102641 0%, #1d4f8d 54%, #0f766e 100%);
}

.profile-hero h1 {
  margin: 6px 0 8px;
  font-size: 28px;
}

.profile-hero p {
  max-width: 780px;
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.eyebrow {
  margin: 0;
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.card {
  margin-bottom: 18px;
  padding: 22px;
  border: 1px solid #e5edf6;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
}

.user-line {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.user-line h2,
.form-head h2,
.card h3 {
  margin: 0;
  color: #102033;
}

.user-line p,
.form-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.account-desc :deep(.el-descriptions__label) {
  width: 92px;
  color: #64748b;
  background: #f8fafc;
}

.side-desc-input {
  width: 100%;
}

.side-desc-input :deep(.el-input__wrapper) {
  min-height: 28px;
  border-radius: 8px;
  background: #f8fafc;
  box-shadow: 0 0 0 1px #d8e0ea inset;
}

.side-desc-input :deep(.el-input__inner) {
  height: 28px;
  color: #0f172a;
}

.card-title-row,
.quota-line,
.form-head,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.card-title-row {
  margin-bottom: 14px;
}

.card-title-row strong {
  color: #2563eb;
  font-size: 24px;
}

.check-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.check-list div {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.check-list span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #cbd5e1;
}

.check-list .done {
  color: #0f766e;
  font-weight: 700;
}

.check-list .done span {
  background: #10b981;
}

.quota-line {
  margin: 14px 0 10px;
  color: #64748b;
}

.form-head {
  align-items: flex-start;
  margin-bottom: 20px;
}

.section-title {
  margin: 18px 0 12px;
  color: #1e3a5f;
  font-size: 16px;
  font-weight: 800;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 18px;
}

.full-row {
  grid-column: 1 / -1;
}

.actions {
  justify-content: flex-start;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #eef2f7;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #d8e0ea inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #2563eb inset, 0 0 0 3px rgba(37, 99, 235, 0.12);
}

@media (max-width: 992px) {
  .profile-hero,
  .form-head,
  .actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
