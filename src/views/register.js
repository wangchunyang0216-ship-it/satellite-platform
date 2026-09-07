import { ElMessage, ElMessageBox } from "element-plus"
import { computed, defineComponent, onBeforeUnmount, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { InfoFilled, Lock, Message, OfficeBuilding, User, UserFilled } from "@element-plus/icons-vue"
import { register } from "@/api/login"
import defaultSettings from "@/settings"
import { usePasswordRule } from "@/utils/passwordRule"
import Verify from "@/components/Verifition/Verify"

export default defineComponent({
  name: "RegisterPage",
  components: { InfoFilled, Lock, Message, OfficeBuilding, User, UserFilled, Verify },
  setup() {
    const title = import.meta.env.VITE_APP_TITLE
    const footerContent = defaultSettings.footerContent
    const router = useRouter()
    const { registerPwdValidator } = usePasswordRule()
    const registerRef = ref(null)
    const verifyRef = ref(null)
    const loading = ref(false)
    const codeCountdown = ref(0)
    let codeTimer = null

    const registerForm = ref({
      accountType: "enterprise", password: "", confirmPassword: "", companyName: "",
      displayName: "", email: "", phone: "", emailCode: "", captchaVerification: "", agreement: false
    })

    const processSteps = [
      { index: "01", title: "快速创建账号", desc: "填写手机号、邮箱和密码，完善基础联系人信息。" },
      { index: "02", title: "登录进入控制台", desc: "体验数据检索、算法目录和成果查看功能。" },
      { index: "03", title: "按需补充资料", desc: "使用受限功能时再补充实名、组织资质和配额资料。" }
    ]

    const isEnterprise = computed(() => registerForm.value.accountType === "enterprise")
    const submitText = computed(() => isEnterprise.value ? "提交组织机构注册申请" : "提交个人注册")
    const equalToPassword = (_rule, value, callback) => {
      registerForm.value.password === value ? callback() : callback(new Error("两次输入的密码不一致"))
    }
    const validateAgreement = (_rule, value, callback) => {
      value ? callback() : callback(new Error("请先同意平台服务协议"))
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
      emailCode: [
        { required: true, trigger: ["blur", "change"], message: "请输入邮箱验证码" },
        { pattern: /^\d{6}$/, trigger: ["blur", "change"], message: "请输入 6 位数字验证码" }
      ],
      agreement: [{ validator: validateAgreement, trigger: "change" }]
    }

    watch(() => registerForm.value.accountType, () => registerRef.value?.clearValidate())

    const sendEmailCode = () => {
      const email = registerForm.value.email.trim()
      if (!email) return ElMessage.warning("请先填写联系邮箱")
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ElMessage.warning("请输入正确的邮箱地址")
      ElMessage.success(`验证码已发送至 ${email}（演示环境，任意 6 位数字即可）`)
      codeCountdown.value = 60
      if (codeTimer) clearInterval(codeTimer)
      codeTimer = setInterval(() => {
        codeCountdown.value -= 1
        if (codeCountdown.value <= 0) {
          clearInterval(codeTimer)
          codeTimer = null
        }
      }, 1000)
    }

    onBeforeUnmount(() => codeTimer && clearInterval(codeTimer))

    const buildRegisterPayload = () => {
      const phone = registerForm.value.phone.trim()
      const displayName = registerForm.value.displayName.trim()
      return {
        username: phone,
        password: registerForm.value.password,
        email: registerForm.value.email.trim(),
        emailCode: registerForm.value.emailCode.trim(),
        captchaVerification: registerForm.value.captchaVerification,
        code: registerForm.value.captchaVerification,
        company: isEnterprise.value ? registerForm.value.companyName.trim() : displayName,
        accountType: registerForm.value.accountType,
        phone,
        profile: { displayName, profileCompleted: false, realNameVerified: false, organizationVerified: false }
      }
    }

    const doRegister = async () => {
      if (loading.value) return
      loading.value = true
      try {
        await register(buildRegisterPayload())
        await ElMessageBox.alert(
          `账号 ${registerForm.value.phone} 注册成功，请返回登录页面进入平台。后续资料可在个人中心补充。`,
          "系统提示",
          { type: "success" }
        )
        router.push("/login")
      } catch (_error) {
        registerForm.value.captchaVerification = ""
      } finally {
        loading.value = false
      }
    }

    const captchaCheckSuccess = (params) => {
      registerForm.value.captchaVerification = params?.captchaVerification || ""
      if (!registerForm.value.captchaVerification) {
        ElMessage.error("滑块验证码校验结果为空，请重新验证")
        return
      }
      doRegister()
    }

    const handleRegister = async () => {
      if (!registerRef.value || loading.value) return
      const valid = await registerRef.value.validate().catch(() => false)
      if (!valid) return
      registerForm.value.captchaVerification = ""
      verifyRef.value?.show()
    }

    return {
      captchaCheckSuccess, codeCountdown, footerContent, handleRegister, isEnterprise,
      loading, processSteps, registerForm, registerRef, registerRules, router, sendEmailCode, submitText,
      title, verifyRef
    }
  }
})
