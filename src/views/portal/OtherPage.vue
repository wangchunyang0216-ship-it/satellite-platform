<template>
  <div class="op"><div class="inner">
    <h1 class="pt">个人中心</h1>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <div class="ch">账户信息</div>
          <div class="ur"><el-avatar :size="56" icon="UserFilled"/><div><h3>{{ u.user?.username||'用户' }}</h3><p>{{ u.user?.role==='admin'?'管理员':'普通用户' }} · {{ u.user?.email||'-' }}</p></div></div>
          <el-descriptions :column="1" border size="small" class="dd"><el-descriptions-item label="用户名">{{ u.user?.username||'-' }}</el-descriptions-item><el-descriptions-item label="邮箱">{{ u.user?.email||'-' }}</el-descriptions-item><el-descriptions-item label="所属单位">{{ u.user?.company||'-' }}</el-descriptions-item><el-descriptions-item label="API Key">{{ u.user?.apiKey||'暂无' }}</el-descriptions-item></el-descriptions>
        </div>
        <div class="card" style="margin-top:16px"><div class="ch">配额使用</div><div class="qr"><span>数据调用配额</span><span>{{ u.user?.quotaUsed||0 }} / {{ u.user?.quotaTotal||100 }}</span></div><el-progress :percentage="u.quotaPercent" :stroke-width="10"/></div>
      </el-col>
      <el-col :span="12">
        <div class="card"><div class="ch">修改密码</div><el-form label-position="top"><el-form-item label="当前密码"><el-input type="password" show-password/></el-form-item><el-form-item label="新密码"><el-input type="password" show-password/></el-form-item><el-form-item label="确认新密码"><el-input type="password" show-password/></el-form-item><el-form-item><el-button type="primary" :style="{background:'#2563EB',borderColor:'#2563EB'}">修改密码</el-button></el-form-item></el-form></div>
      </el-col>
    </el-row>
  </div></div>
</template>
<script setup lang="ts">
import { useUserStore } from '@/stores/useUserStore'; const u=useUserStore()
</script>
<style scoped>
.op { flex:1; padding:16px 12px; overflow-y:auto; }
.inner { max-width:100%; margin:0 auto; }
.pt { font-size:24px; font-weight:700; color:#1F2937; margin:0 0 24px; }
.card { background:#fff; border-radius:14px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.03); }
.ch { font-size:17px; font-weight:600; color:#1F2937; margin-bottom:16px; }
.ur { display:flex; align-items:center; gap:14px; margin-bottom:18px; }
.ur h3 { font-size:19px; color:#1F2937; margin:0 0 2px; }
.ur p { font-size:16px; color:#6B7280; margin:0; }
.dd :deep(.el-descriptions__label){ color:#6B7280; background:#F9FAFB; border-color:#F3F4F6; font-size:16px !important; }
.dd :deep(.el-descriptions__content){ color:#374151; border-color:#F3F4F6; font-size:17px !important; }
.qr { display:flex; justify-content:space-between; font-size:16px; color:#6B7280; margin-bottom:10px; }
:deep(.el-form-item__label){ font-size:17px !important; }
:deep(.el-input__wrapper){ box-shadow:0 1px 3px rgba(0,0,0,0.04); border:1px solid #E5E7EB; border-radius:10px; }
:deep(.el-input__inner){ color:#1F2937; font-size:17px !important; }
</style>
