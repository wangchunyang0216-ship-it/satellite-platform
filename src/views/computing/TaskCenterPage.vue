<template>
  <div class="page">
    <PageHeader title="任务管理中心" desc="统一管理所有已提交的计算任务，查看进度和历史" />

    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" inline>
        <el-form-item label="算法服务">
          <el-select v-model="filters.service" placeholder="全部" clearable style="width:160px">
            <el-option v-for="s in serviceOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width:120px">
            <el-option label="排队中" value="pending" />
            <el-option label="处理中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="搜索任务ID" clearable style="width:200px">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTasks">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-header">
          <span class="card-title">任务列表</span>
          <span class="task-count">共 {{ total }} 个任务</span>
          <div class="batch-actions">
            <el-button size="small" type="danger" @click="handleClearAll" :disabled="total === 0">
              清空全部
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="taskList" border stripe class="task-table" v-loading="loading">
        <el-table-column prop="taskId" label="任务 ID" min-width="260" show-overflow-tooltip />
        <el-table-column label="算法服务" min-width="150" align="center">
          <template #default="{ row }">
            <el-tag size="large" :type="serviceTag(row.service)">{{ serviceLabel(row.service) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="large">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务操作" min-width="150" align="center">
          <template #default="{ row }">
            <el-button link :type="taskActionType(row.status)" @click="handleStatusAction(row)">
              {{ taskActionLabel(row.status) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="210" align="center">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '--' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary"
              :disabled="row.status !== 'completed'"
              @click="downloadResult(row.taskId)">
              下载 TIF
            </el-button>
            <el-button link type="danger" @click="handleDelete(row.taskId)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadTasks"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { computeApi, type AlgorithmTask } from '@/api/compute'

const router = useRouter()
const loading = ref(false)
const taskList = ref<AlgorithmTask[]>([])
const total = ref(0)

const filters = reactive({ service: '', status: '', keyword: '' })
const pagination = reactive({ current: 1, pageSize: 20 })

const serviceOptions = [
  { label: '辐射定标', value: 'calibration' },
  { label: '大气校正', value: 'atmospheric' },
  { label: '几何校正', value: 'geometric' },
  { label: 'NDVI 植被指数', value: 'ndvi' },
  { label: '云检测', value: 'cloud_detection' },
  { label: '影像裁剪', value: 'clip' },
  { label: '光谱指数', value: 'spectral_index' },
  { label: '影像镶嵌', value: 'mosaic' },
  { label: '影像融合', value: 'fusion' },
]

const serviceLabels: Record<string, string> = {
  calibration: '辐射定标', atmospheric: '大气校正', geometric: '几何校正',
  ndvi: 'NDVI', cloud_detection: '云检测', clip: '影像裁剪',
  spectral_index: '光谱指数', mosaic: '影像镶嵌', fusion: '影像融合',
}
const statusLabels: Record<string, string> = {
  pending: '排队中', running: '处理中', completed: '已完成', failed: '失败',
}

function serviceLabel(s: string) { return serviceLabels[s] || s }
function serviceTag(s: string) {
  const m: Record<string, string> = { ndvi: 'success', calibration: '', atmospheric: '', geometric: 'warning', cloud_detection: 'info', clip: 'danger', spectral_index: 'success', mosaic: '', fusion: 'info' }
  return m[s] || ''
}
function statusTag(s: string) {
  const m: Record<string, string> = { pending: 'info', running: 'warning', completed: 'success', failed: 'danger' }
  return m[s] || 'info'
}
function statusLabel(s: string) { return statusLabels[s] || s }
function taskActionLabel(s: string) {
  const m: Record<string, string> = { pending: '查看排队状态', running: '查看完成状态', completed: '查看结果', failed: '查看错误' }
  return m[s] || '查看状态'
}
function taskActionType(s: string) {
  const m: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = { pending: 'warning', running: 'primary', completed: 'success', failed: 'danger' }
  return m[s] || 'primary'
}

async function loadTasks() {
  loading.value = true
  try {
    const res = await computeApi.getTasks(pagination.current, pagination.pageSize)
    const data = (res.data as any).data || res.data
    let list: AlgorithmTask[] = data.list || []
    // 前端过滤（后端暂不支持按服务/状态筛选）
    if (filters.service) list = list.filter((t: AlgorithmTask) => t.service === filters.service)
    if (filters.status) list = list.filter((t: AlgorithmTask) => t.status === filters.status)
    if (filters.keyword) list = list.filter((t: AlgorithmTask) => t.taskId.toLowerCase().includes(filters.keyword.toLowerCase()))
    taskList.value = list
    total.value = data.total || list.length
  } catch {
    taskList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filters.service = ''; filters.status = ''; filters.keyword = ''
  pagination.current = 1
  loadTasks()
}

async function handleDelete(taskId: string) {
  try {
    await ElMessageBox.confirm(`确定删除任务 ${taskId}？`, '确认删除', { type: 'warning' })
    await computeApi.deleteTask(taskId)
    ElMessage.success('已删除')
    loadTasks()
  } catch { /* cancelled or error */ }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定清空全部历史任务记录？此操作不可恢复。', '确认清空', { type: 'warning' })
    await computeApi.clearTasks()
    ElMessage.success('已清空全部记录')
    loadTasks()
  } catch { /* cancelled */ }
}

function handleStatusAction(row: AlgorithmTask) {
  if (row.status === 'completed') {
    router.push(`/console/computing/result/${row.taskId}`)
    return
  }
  if (row.status === 'failed') {
    ElMessage.error(`任务 ${row.taskId} 执行失败，请检查参数或重新提交`)
    return
  }
  ElMessage.info(`任务 ${row.taskId} 当前状态：${statusLabel(row.status)}`)
}

function downloadResult(taskId: string) {
  const url = computeApi.getDownloadUrl(taskId)
  const token = localStorage.getItem('token')
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => { if (!r.ok) throw new Error('下载失败'); return r.blob() })
    .then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${taskId}_result.tif`; a.click() })
    .catch(() => ElMessage.error('下载失败'))
}

onMounted(() => loadTasks())
</script>

<style scoped>
.page { flex:1; display:flex; flex-direction:column; padding:12px 16px 24px; overflow-y:auto; min-height:0; height:100%; }
.filter-card { margin-bottom:16px; }
.table-card { flex:1; min-height:0; margin-bottom:0; display:flex; flex-direction:column; }
.table-card :deep(.el-card__body) { flex:1; min-height:0; display:flex; flex-direction:column; padding:0 20px 20px; }
.table-header { display:flex; align-items:center; gap:16px; }
.card-title { font-size:17px; font-weight:600; color:#303133; }
.task-count { font-size:14px; color:#909399; }
.batch-actions { margin-left:auto; display:flex; gap:8px; }
.task-table { flex:1; width:100%; font-size:15px; }
.task-table :deep(.el-table__cell) { padding:16px 0; }
.task-table :deep(.cell) { line-height:24px; }
.task-table :deep(.el-table__header .cell) { font-weight:700; white-space:nowrap; }
.task-table :deep(.el-table__body .el-table__cell:first-child .cell) { white-space:nowrap; font-family:Consolas, Monaco, monospace; font-weight:600; color:#172033; }
.pagination-wrapper { display:flex; justify-content:flex-end; margin-top:16px; }
</style>
