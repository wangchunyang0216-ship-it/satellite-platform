import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SatelliteScene } from '@/types/satellite'
import type { SearchParams } from '@/api/data'

export const useSearchStore = defineStore('search', () => {
  const params = ref<SearchParams>({
    page: 1,
    pageSize: 20,
  })
  const results = ref<SatelliteScene[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)

  function setParams(p: Partial<SearchParams>) {
    params.value = { ...params.value, ...p }
  }

  function resetParams() {
    params.value = { page: 1, pageSize: 20 }
    results.value = []
    total.value = 0
  }

  function setResults(list: SatelliteScene[], t: number) {
    results.value = list
    total.value = t
  }

  return { params, results, total, loading, currentPage, pageSize, setParams, resetParams, setResults }
})
