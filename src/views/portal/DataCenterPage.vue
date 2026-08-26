<template>
  <div class="page data-center-page">
    <PageHeader title="数据中心" desc="浏览、检索与订购卫星遥感数据产品" />

    <el-tabs v-model="activeTab" class="data-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="数据浏览" name="catalog" />
      <el-tab-pane label="数据检索" name="search" />
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

const activeTab = ref('catalog')

function syncTabFromPath(path: string) {
  if (path.includes('/data/orders')) activeTab.value = 'orders'
  else if (path.includes('/data/cart')) activeTab.value = 'cart'
  else if (path.includes('/data/search')) activeTab.value = 'search'
  else activeTab.value = 'catalog'
}

syncTabFromPath(route.path)
watch(() => route.path, syncTabFromPath)

function handleTabChange(tabName: string) {
  const map: Record<string, string> = {
    catalog: '/portal/data/catalog',
    search: '/portal/data/search',
    cart: '/portal/data/cart',
    orders: '/portal/data/orders',
  }
  router.push(map[tabName] || '/portal/data/catalog')
}
</script>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow-y: auto; min-height: 0; }
.data-tabs { margin-bottom: 20px; }
</style>
