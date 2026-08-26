<template>
  <div class="page">
    <PageHeader title="数据源管理" desc="管理所有上游卫星数据源，支持新增、编辑、删除和手动触发同步" />
    <el-card>
      <div class="toolbar">
        <el-input v-model="search" placeholder="搜索数据源名称" style="width: 240px" clearable />
        <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px" clearable>
          <el-option label="活跃" value="active" />
          <el-option label="停用" value="inactive" />
          <el-option label="异常" value="error" />
        </el-select>
        <el-button type="primary" style="margin-left: auto">+ 新增数据源</el-button>
      </div>
      <el-table :data="filteredProviders" style="margin-top: 16px" stripe>
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="protocolType" label="协议类型" width="130" />
        <el-table-column prop="authMethod" label="认证方式" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastSyncAt" label="最近同步" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default>
            <el-button size="small" link type="primary">详情</el-button>
            <el-button size="small" link type="primary">编辑</el-button>
            <el-button size="small" link>同步</el-button>
            <el-button size="small" link type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { demoProviders } from '@/services/mockData'

const search = ref('')
const statusFilter = ref('')

const filteredProviders = computed(() => {
  let list = demoProviders
  if (search.value) list = list.filter((p) => p.name.includes(search.value))
  if (statusFilter.value) list = list.filter((p) => p.status === statusFilter.value)
  return list
})

function statusTag(s: string) { return s === 'active' ? 'success' : s === 'inactive' ? 'warning' : 'danger' }
function statusText(s: string) { return s === 'active' ? '活跃' : s === 'inactive' ? '停用' : '异常' }
</script>

<style scoped>
.page { max-width: 1200px; }
.toolbar { display: flex; gap: 12px; align-items: center; }
</style>
