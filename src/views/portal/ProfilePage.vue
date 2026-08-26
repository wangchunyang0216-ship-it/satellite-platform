<template>
  <div class="page profile-page">
    <PageHeader title="个人中心" desc="管理账户信息、购物车与订单" />

    <el-tabs v-model="activeTab" class="profile-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="账户信息" name="info" />
      <el-tab-pane label="购物车" name="cart" />
      <el-tab-pane label="我的订单" name="orders" />
    </el-tabs>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const route = useRoute()

const activeTab = ref('info')

// 根据当前路由路径同步 tab
function syncTabFromPath(path: string) {
  if (path.includes('/profile/cart')) {
    activeTab.value = 'cart'
  } else if (path.includes('/profile/orders')) {
    activeTab.value = 'orders'
  } else {
    activeTab.value = 'info'
  }
}

syncTabFromPath(route.path)

watch(() => route.path, syncTabFromPath)

function handleTabChange(tabName: string) {
  const tabMap: Record<string, string> = {
    info: '/portal/profile/info',
    cart: '/portal/profile/cart',
    orders: '/portal/profile/orders',
  }
  router.push(tabMap[tabName] || '/portal/profile/info')
}
</script>

<style scoped>
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 8px;
  overflow-y: auto;
  min-height: 0;
}

.profile-tabs {
  margin-bottom: 20px;
}
</style>
