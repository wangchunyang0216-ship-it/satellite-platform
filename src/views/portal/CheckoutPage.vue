<template>
  <div class="page checkout-page">
    <PageHeader title="确认下单" desc="确认订单信息并选择交付方式" />

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card>
          <template #header><span class="panel-title">订单摘要</span></template>

          <template v-if="items.length > 0">
            <el-table :data="items" border size="small">
              <el-table-column prop="sceneName" label="影像名称" min-width="200" show-overflow-tooltip />
              <el-table-column prop="satellite" label="卫星" width="100" align="center" />
              <el-table-column prop="date" label="日期" width="110" align="center" />
              <el-table-column prop="resolution" label="分辨率" width="80" align="center">
                <template #default="{ row }">{{ row.resolution }}m</template>
              </el-table-column>
              <el-table-column prop="price" label="单价" width="80" align="center">
                <template #default="{ row }">¥{{ row.price }}</template>
              </el-table-column>
            </el-table>

            <el-divider />
            <div class="cost-summary">
              <div class="cost-row">
                <span>数据费用</span>
                <span>¥{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="cost-row">
                <span>处理费用</span>
                <span>¥{{ processFee.toFixed(2) }}</span>
              </div>
              <el-divider />
              <div class="cost-row cost-total">
                <span>合计</span>
                <span class="total-price">¥{{ total.toFixed(2) }}</span>
              </div>
            </div>
          </template>

          <el-empty v-else description="暂无待订购数据" :image-size="80">
            <el-button type="primary" @click="loadDemo">加载演示数据</el-button>
          </el-empty>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span class="panel-title">交付配置</span></template>
          <el-form label-position="top" size="default">
            <el-form-item label="交付方式">
              <el-radio-group v-model="delivery.method">
                <el-radio value="ftp">FTP 下载</el-radio>
                <el-radio value="http">HTTP 直链</el-radio>
                <el-radio value="physical">物理介质（硬盘邮寄）</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="数据格式">
              <el-select v-model="delivery.format" placeholder="请选择" style="width: 100%">
                <el-option label="GeoTIFF" value="geotiff" />
                <el-option label="IMG" value="img" />
                <el-option label="HDF" value="hdf" />
              </el-select>
            </el-form-item>
            <el-form-item label="投影坐标系">
              <el-select v-model="delivery.projection" placeholder="请选择" style="width: 100%">
                <el-option label="WGS84" value="wgs84" />
                <el-option label="CGCS2000" value="cgcs2000" />
                <el-option label="UTM" value="utm" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="delivery.remark" type="textarea" :rows="3" placeholder="如有特殊需求请备注" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" style="width: 100%" @click="handleSubmit" :disabled="items.length === 0">
                确认下单 (¥{{ total.toFixed(2) }})
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

interface OrderItem {
  id: string
  sceneName: string
  satellite: string
  date: string
  resolution: number
  price: number
}

const demoItems: OrderItem[] = [
  { id: '1', sceneName: 'S2A_MSIL2A_20260710_Wuhan', satellite: '哨兵2号', date: '2026-07-10', resolution: 10, price: 120 },
  { id: '2', sceneName: 'GF6_PMS_20260712_Huanggang', satellite: '高分6号', date: '2026-07-12', resolution: 2, price: 280 },
  { id: '3', sceneName: 'LC9_L2SP_20260711_Yichang', satellite: 'Landsat-9', date: '2026-07-11', resolution: 30, price: 80 },
]

const items = ref<OrderItem[]>([])
const delivery = reactive({
  method: 'http',
  format: 'geotiff',
  projection: 'wgs84',
  remark: '',
})

const subtotal = computed(() => items.value.reduce((s, i) => s + i.price, 0))
const processFee = computed(() => items.value.length > 0 ? 30 : 0)
const total = computed(() => subtotal.value + processFee.value)

const loadDemo = () => {
  items.value = [...demoItems]
}

const handleSubmit = () => {
  ElMessage.success('订单提交成功！')
  items.value = []
}
</script>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; padding: 12px 8px; overflow-y: auto; min-height: 0; }
.panel-title { font-size: 16px; font-weight: 600; color: #303133; }

.cost-summary { display: flex; flex-direction: column; gap: 8px; }
.cost-row { display: flex; justify-content: space-between; font-size: 16px; color: #606266; }
.cost-total { font-weight: 600; }
.total-price { font-size: 20px; color: #f56c6c; font-family: 'Consolas', monospace; }
</style>
