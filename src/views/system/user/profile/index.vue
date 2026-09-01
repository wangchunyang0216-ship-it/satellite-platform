<template>
   <div class="app-container rs-profile">
      <div class="profile-hero">
         <div>
            <p class="eyebrow">REMOTE SENSING ACCOUNT</p>
            <h1>{{ centerTitle }}</h1>
            <p>注册页只创建账号，实名信息、组织资料和遥感服务偏好在这里补全。使用受限功能时，可依据资料完整度进行提示。</p>
         </div>
         <el-tag :type="completionStatus.type" effect="dark" round>{{ completionStatus.text }}</el-tag>
      </div>

      <el-row :gutter="20">
         <el-col :span="6" :xs="24">
            <el-card class="profile-card side-card">
               <div class="text-center">
                  <userAvatar />
               </div>
               <h2>{{ profileForm.nickName || state.user.nickName || state.user.userName || '用户' }}</h2>
               <p>{{ state.roleGroup || '普通用户' }} · {{ profileForm.email || state.user.email || '-' }}</p>
               <ul class="profile-list">
                  <li><svg-icon icon-class="user" />用户名称<span>{{ state.user.userName || '-' }}</span></li>
                  <li><svg-icon icon-class="phone" />手机号码<span>{{ profileForm.phonenumber || '-' }}</span></li>
                  <li><svg-icon icon-class="email" />用户邮箱<span>{{ profileForm.email || '-' }}</span></li>
                  <li><svg-icon icon-class="tree" />账号类型<span>{{ profileForm.accountType === 'enterprise' ? '组织机构' : '个人用户' }}</span></li>
                  <li><svg-icon icon-class="date" />创建日期<span>{{ state.user.createTime || '-' }}</span></li>
               </ul>
            </el-card>

            <el-card class="profile-card progress-card">
               <div class="progress-head">
                  <span>资料完整度</span>
                  <strong>{{ completionPercent }}%</strong>
               </div>
               <el-progress :percentage="completionPercent" :stroke-width="10" />
               <div class="check-list">
                  <div v-for="item in completionItems" :key="item.label" :class="{ done: item.done }">
                     <i></i>{{ item.label }}
                  </div>
               </div>
            </el-card>
         </el-col>

         <el-col :span="18" :xs="24">
            <el-card class="profile-card form-card">
               <template #header>
                  <div class="card-header">
                     <span>资料补全</span>
                     <el-tabs v-model="selectedTab" class="mini-tabs">
                        <el-tab-pane label="补全资料" name="profile" />
                        <el-tab-pane label="修改密码" name="resetPwd" />
                     </el-tabs>
                  </div>
               </template>

               <template v-if="selectedTab === 'profile'">
                  <el-form ref="profileRef" :model="profileForm" :rules="profileRules" label-position="top" class="completion-form">
                     <div class="section-title">基础联系信息</div>
                     <div class="form-grid">
                        <el-form-item label="用户昵称" prop="nickName">
                           <el-input v-model.trim="profileForm.nickName" placeholder="例如：遥感分析员" maxlength="30" />
                        </el-form-item>
                        <el-form-item label="手机号码" prop="phonenumber">
                           <el-input v-model.trim="profileForm.phonenumber" placeholder="用于登录通知和找回账号" maxlength="11" />
                        </el-form-item>
                        <el-form-item label="邮箱" prop="email">
                           <el-input v-model.trim="profileForm.email" placeholder="用于接收订单、任务和成果通知" maxlength="50" />
                        </el-form-item>
                        <el-form-item label="所在地区" prop="region">
                           <el-input v-model.trim="profileForm.region" placeholder="例如：北京 / 华北区域 / 长三角" />
                        </el-form-item>
                     </div>

                     <div class="section-title">实名与主体资料</div>
                     <div class="form-grid">
                        <el-form-item label="账号类型" prop="accountType">
                           <el-radio-group v-model="profileForm.accountType">
                              <el-radio-button label="personal">个人用户</el-radio-button>
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
                           <el-input v-model.trim="profileForm.organizationName" placeholder="填写单位或组织完整名称" />
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
                     </div>

                     <el-alert
                        class="profile-tip"
                        type="info"
                        show-icon
                        :closable="false"
                        title="当前页面会保存基础资料到后台用户接口，并把遥感补全资料保存在本地；如需完整入库，需要后端新增资料补全接口。"
                     />

                     <div class="actions">
                        <el-button type="primary" @click="saveProfile">保存补全资料</el-button>
                        <el-button @click="resetCompletion">恢复已保存资料</el-button>
                     </div>
                  </el-form>
               </template>

               <resetPwd v-else />
            </el-card>
         </el-col>
      </el-row>
   </div>
</template>

<script setup name="Profile">
import userAvatar from "./userAvatar"
import resetPwd from "./resetPwd"
import { getUserProfile, updateUserProfile } from "@/api/system/user"

const STORAGE_KEY = "rs-admin-profile-completion"
const selectedTab = ref("profile")
const { proxy } = getCurrentInstance()
const state = reactive({
  user: {},
  roleGroup: "",
  postGroup: ""
})
const profileRef = ref()

const profileForm = reactive({
  nickName: "",
  phonenumber: "",
  email: "",
  sex: "0",
  region: "",
  accountType: "personal",
  realName: "",
  idCard: "",
  personalRole: "",
  personalOrg: "",
  personalOrganization: "",
  idCardExpire: "",
  contactAddress: "",
  organizationName: "",
  creditCode: "",
  legalPerson: "",
  contactTitle: "",
  registeredAddress: "",
  businessScope: ""
})

const centerTitle = computed(() => profileForm.accountType === "enterprise" ? "企业中心资料补全" : "个人中心资料补全")
const completionItems = computed(() => [
  { label: "基础联系方式", done: !!(profileForm.nickName && profileForm.phonenumber && profileForm.email) },
  { label: "实名信息", done: profileForm.accountType === "personal" ? !!(profileForm.realName && profileForm.idCard) : !!profileForm.realName },
  { label: "个人补充资料", done: profileForm.accountType === "enterprise" || !!(profileForm.personalRole && profileForm.personalOrg && profileForm.idCardExpire && profileForm.contactAddress) },
  { label: "企业补充资料", done: profileForm.accountType === "personal" || !!(profileForm.organizationName && profileForm.creditCode && profileForm.legalPerson && profileForm.contactTitle && profileForm.registeredAddress && profileForm.businessScope) }
])
const completionPercent = computed(() => Math.round(completionItems.value.filter(item => item.done).length / completionItems.value.length * 100))
const completionStatus = computed(() => {
  if (completionPercent.value >= 100) return { text: "资料已补全", type: "success" }
  if (completionPercent.value >= 50) return { text: "继续完善中", type: "warning" }
  return { text: "待补全", type: "info" }
})

const profileRules = {
  nickName: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
  phonenumber: [
    { required: true, message: "手机号码不能为空", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号码", trigger: "blur" }
  ],
  email: [
    { required: true, message: "邮箱地址不能为空", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }
  ],
  realName: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  idCard: [{ validator: validateIdCard, trigger: "blur" }],
  personalRole: [{ validator: validatePersonalRequired("请选择职业身份"), trigger: "change" }],
  personalOrg: [{ validator: validatePersonalRequired("请输入所属单位/学校"), trigger: "blur" }],
  idCardExpire: [{ validator: validatePersonalRequired("请选择证件有效期"), trigger: "change" }],
  contactAddress: [{ validator: validatePersonalRequired("请输入常住地址"), trigger: "blur" }],
  organizationName: [{ validator: validateOrganization, trigger: "blur" }],
  creditCode: [{ validator: validateCreditCode, trigger: "blur" }],
  legalPerson: [{ validator: validateEnterpriseRequired("请输入法定代表人"), trigger: "blur" }],
  contactTitle: [{ validator: validateEnterpriseRequired("请输入企业联系人职务"), trigger: "blur" }],
  registeredAddress: [{ validator: validateEnterpriseRequired("请输入注册地址"), trigger: "blur" }],
  businessScope: [{ validator: validateEnterpriseRequired("请输入经营或业务范围"), trigger: "blur" }]
}

function validateIdCard(rule, value, callback) {
  if (profileForm.accountType !== "personal") {
    callback()
    return
  }
  if (!value) {
    callback(new Error("请输入身份证号码"))
    return
  }
  if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
    callback(new Error("请输入正确的 18 位身份证号码"))
    return
  }
  callback()
}

function validateEnterpriseRequired(message) {
  return (rule, value, callback) => {
    if (profileForm.accountType === "enterprise" && !value) {
      callback(new Error(message))
      return
    }
    callback()
  }
}

function validatePersonalRequired(message) {
  return (rule, value, callback) => {
    if (profileForm.accountType === "personal" && !value) {
      callback(new Error(message))
      return
    }
    callback()
  }
}

function validateOrganization(rule, value, callback) {
  if (profileForm.accountType === "enterprise" && !value) {
    callback(new Error("请输入组织机构名称"))
    return
  }
  callback()
}

function validateCreditCode(rule, value, callback) {
  if (profileForm.accountType !== "enterprise") {
    callback()
    return
  }
  if (!value) {
    callback(new Error("请输入统一社会信用代码"))
    return
  }
  if (!/^[A-Z0-9]{18}$/.test(value)) {
    callback(new Error("请输入 18 位大写字母或数字"))
    return
  }
  callback()
}

function readSavedCompletion() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}

function fillForm(user = {}) {
  Object.assign(profileForm, {
    nickName: user.nickName || "",
    phonenumber: user.phonenumber || "",
    email: user.email || "",
    sex: user.sex || "0",
    organizationName: user.dept?.deptName || ""
  }, readSavedCompletion())
}

function getUser() {
  getUserProfile().then(response => {
    state.user = response.data
    state.roleGroup = response.roleGroup
    state.postGroup = response.postGroup
    fillForm(response.data)
  })
}

function saveProfile() {
  profileRef.value.validate(valid => {
    if (!valid) return
    updateUserProfile({
      nickName: profileForm.nickName,
      phonenumber: profileForm.phonenumber,
      email: profileForm.email,
      sex: profileForm.sex
    }).then(() => {
      const completion = {
        region: profileForm.region,
        accountType: profileForm.accountType,
        realName: profileForm.realName,
        idCard: profileForm.idCard,
        personalRole: profileForm.personalRole,
        personalOrg: profileForm.personalOrg,
        personalOrganization: profileForm.personalOrganization,
        idCardExpire: profileForm.idCardExpire,
        contactAddress: profileForm.contactAddress,
        organizationName: profileForm.organizationName,
        creditCode: profileForm.creditCode,
        legalPerson: profileForm.legalPerson,
        contactTitle: profileForm.contactTitle,
        registeredAddress: profileForm.registeredAddress,
        businessScope: profileForm.businessScope,
        profileCompleted: completionPercent.value >= 100,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completion))
      Object.assign(state.user, {
        nickName: profileForm.nickName,
        phonenumber: profileForm.phonenumber,
        email: profileForm.email,
        sex: profileForm.sex
      })
      proxy.$modal.msgSuccess("资料保存成功")
    })
  })
}

function resetCompletion() {
  fillForm(state.user)
  proxy.$modal.msgSuccess("已恢复已保存资料")
}

onMounted(() => {
  getUser()
})
</script>

<style scoped>
.rs-profile {
  background: #f5f7fb;
  min-height: calc(100vh - 84px);
}

.profile-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 24px 28px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #102641 0%, #1d4f8d 56%, #0f766e 100%);
}

.profile-hero h1 {
  margin: 6px 0 8px;
  font-size: 28px;
  font-weight: 800;
}

.profile-hero p {
  max-width: 780px;
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  line-height: 1.7;
}

.eyebrow {
  margin: 0;
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.profile-card {
  border: 1px solid #e5edf6;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.side-card h2 {
  margin: 12px 0 4px;
  text-align: center;
  color: #102033;
  font-size: 20px;
}

.side-card p {
  margin: 0 0 16px;
  text-align: center;
  color: #64748b;
}

.profile-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.profile-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #eef2f7;
  color: #334155;
}

.profile-list span {
  margin-left: auto;
  color: #0f172a;
}

.progress-card {
  margin-top: 16px;
}

.progress-head,
.card-header,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.progress-head {
  margin-bottom: 12px;
}

.progress-head strong {
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
}

.check-list i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #cbd5e1;
}

.check-list .done {
  color: #0f766e;
  font-weight: 700;
}

.check-list .done i {
  background: #10b981;
}

.card-header > span {
  color: #102033;
  font-size: 18px;
  font-weight: 800;
}

.mini-tabs {
  width: 220px;
}

.mini-tabs :deep(.el-tabs__header) {
  margin: 0;
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

.profile-tip {
  margin-top: 8px;
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
  border-radius: 9px;
  box-shadow: 0 0 0 1px #d8e0ea inset;
}

@media (max-width: 992px) {
  .profile-hero,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .mini-tabs {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
