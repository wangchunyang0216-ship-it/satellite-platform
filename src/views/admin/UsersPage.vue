<template>
  <div class="page">
    <PageHeader title="用户管理" desc="管理下游企业用户账号与配额" />
    <el-card>
      <div class="toolbar">
        <el-input v-model="search" placeholder="搜索用户名/公司" style="width: 240px" clearable />
        <el-button type="primary" style="margin-left: auto">+ 新增用户</el-button>
      </div>
      <el-table :data="filteredUsers" style="margin-top:16px" stripe>
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="company" label="公司" min-width="180" />
        <el-table-column label="角色" width="90">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : ''" size="small">{{ row.role === 'admin' ? '管理员' : '用户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配额使用" min-width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.quotaUsed / row.quotaTotal) * 100)"
              :color="quotaColor(row)"
              :format="() => `${row.quotaUsed} / ${row.quotaTotal} 景`"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default>
            <el-button size="small" link type="primary">编辑</el-button>
            <el-button size="small" link type="danger">禁用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { demoUsers } from '@/services/mockData'

const search = ref('')

const filteredUsers = computed(() => {
  if (!search.value) return demoUsers
  return demoUsers.filter((u) => u.username.includes(search.value) || u.company.includes(search.value))
})

function quotaColor(row: { quotaUsed: number; quotaTotal: number }) {
  const pct = row.quotaUsed / row.quotaTotal
  return pct > 0.8 ? '#F56C6C' : pct > 0.5 ? '#E6A23C' : '#67C23A'
}
</script>

<style scoped>
.page { max-width: 1200px; }
.toolbar { display: flex; gap: 12px; align-items: center; }
</style>
