<template>
  <div class="page">
    <PageHeader title="订单管理" desc="查看所有下游用户的订单记录" />
    <el-card>
      <div class="toolbar">
        <el-date-picker type="daterange" placeholder="时间范围" style="width:260px" />
        <el-select v-model="statusFilter" placeholder="订单状态" style="width:140px" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input v-model="search" placeholder="搜索用户" style="width:200px" clearable />
      </div>
      <el-table :data="filteredOrders" style="margin-top:16px" stripe>
        <el-table-column prop="orderNo" label="订单号" width="190" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="dataCount" label="数据数量" width="90" />
        <el-table-column prop="amount" label="金额" width="90">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="orderStatusTag(row.status)" size="small">{{ orderStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryMethod" label="交付方式" width="110" />
        <el-table-column prop="createdAt" label="时间" width="170" />
        <el-table-column label="操作" width="100">
          <template #default>
            <el-button size="small" link type="primary">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { demoOrders } from '@/services/mockData'

const search = ref('')
const statusFilter = ref('')

const filteredOrders = computed(() => {
  let list = demoOrders
  if (search.value) list = list.filter((o) => o.username.includes(search.value))
  if (statusFilter.value) list = list.filter((o) => o.status === statusFilter.value)
  return list
})

function orderStatusTag(s: string) {
  return s === 'completed' ? 'success' : s === 'pending' ? 'warning' : 'info'
}
function orderStatusText(s: string) {
  return s === 'completed' ? '已完成' : s === 'pending' ? '待处理' : s === 'processing' ? '处理中' : '已取消'
}
</script>

<style scoped>
.page { max-width: 1200px; }
.toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
</style>
