import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComputeTask, ComputeTaskType, AIModel } from '@/types/compute'

export const useComputeStore = defineStore('compute', () => {
  const tasks = ref<ComputeTask[]>([])
  const models = ref<AIModel[]>([])
  const loading = ref(false)

  const activeTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'queued' || t.status === 'processing'),
  )
  const completedTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'completed'),
  )
  const failedTasks = computed(() =>
    tasks.value.filter((t) => t.status === 'failed'),
  )

  function addTask(task: ComputeTask) {
    tasks.value.unshift(task)
  }

  function updateTask(taskId: string, updates: Partial<ComputeTask>) {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...updates }
    }
  }

  function removeTask(taskId: string) {
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
  }

  function getTaskById(taskId: string): ComputeTask | undefined {
    return tasks.value.find((t) => t.id === taskId)
  }

  function setModels(modelList: AIModel[]) {
    models.value = modelList
  }

  function getModelsByType(type: ComputeTaskType): AIModel[] {
    return models.value.filter((m) => m.type === type)
  }

  return {
    tasks, models, loading,
    activeTasks, completedTasks, failedTasks,
    addTask, updateTask, removeTask, getTaskById,
    setModels, getModelsByType,
  }
})
