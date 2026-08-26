import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem } from '@/api/cart'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const selectedIds = ref<Set<string>>(new Set())

  const count = computed(() => items.value.length)
  const selectedCount = computed(() => selectedIds.value.size)

  function addItem(item: CartItem) {
    if (!items.value.find((i) => i.id === item.id)) {
      items.value.push(item)
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    selectedIds.value.delete(id)
  }

  function toggleSelect(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  }

  function selectAll() {
    items.value.forEach((i) => selectedIds.value.add(i.id))
  }

  function deselectAll() {
    selectedIds.value.clear()
  }

  function removeSelected() {
    items.value = items.value.filter((i) => !selectedIds.value.has(i.id))
    selectedIds.value.clear()
  }

  return { items, selectedIds, count, selectedCount, addItem, removeItem, toggleSelect, selectAll, deselectAll, removeSelected }
})
