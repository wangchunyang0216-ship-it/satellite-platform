<template>
  <div class="profile-info-page">
    <el-row :gutter="16">
      <!-- 左侧：用户信息 + 配额 -->
      <el-col :span="12">
        <!-- 用户基本信息 -->
        <el-card>
          <template #header>
            <span class="panel-title">账户信息</span>
          </template>
          <div class="user-profile">
            <el-avatar :size="64" icon="UserFilled" />
            <div class="user-details">
              <h3 class="user-name">{{ userStore.user?.username || '用户' }}</h3>
              <p class="user-meta">
                角色：{{ userStore.user?.role === 'admin' ? '管理员' : '普通用户' }}
                &nbsp;|&nbsp; 邮箱：{{ userStore.user?.email || '-' }}
              </p>
            </div>
          </div>
          <el-descriptions :column="1" border style="margin-top: 16px">
            <el-descriptions-item label="用户名">{{ userStore.user?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userStore.user?.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属单位">{{ userStore.user?.company || '-' }}</el-descriptions-item>
            <el-descriptions-item label="API Key">{{ userStore.user?.apiKey || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 配额使用 -->
        <el-card style="margin-top: 16px">
          <template #header>
            <span class="panel-title">配额使用情况</span>
          </template>
          <div class="quota-section">
            <div class="quota-item">
              <div class="quota-label">
                <span>数据调用配额</span>
                <span class="quota-usage">{{ userStore.user?.quotaUsed || 0 }} / {{ userStore.user?.quotaTotal || 100 }}</span>
              </div>
              <el-progress :percentage="userStore.quotaPercent" :stroke-width="12" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：修改密码 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="panel-title">修改密码</span>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="当前密码">
              <el-input type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input type="password" placeholder="请输入新密码" show-password />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()
</script>

<style scoped>
.profile-info-page {
  flex: 1;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px;
}

.user-meta {
  font-size: 15px;
  color: #909399;
  margin: 0;
}

.quota-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quota-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quota-label {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  color: #606266;
}

.quota-usage {
  color: #909399;
}
</style>
