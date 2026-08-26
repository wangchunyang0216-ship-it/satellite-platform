import request from './request'
import type { SatelliteScene } from '@/types/satellite'

export interface CartItem {
  id: string
  scene: SatelliteScene
  addedAt: string
}

export const cartApi = {
  add(sceneId: string) {
    return request.post(`/cart/add`, { sceneId })
  },
  list() {
    return request.get<unknown, { data: CartItem[] }>('/cart')
  },
  remove(id: string) {
    return request.delete(`/cart/${id}`)
  },
  clear(ids: string[]) {
    return request.post('/cart/clear', { ids })
  },
}
