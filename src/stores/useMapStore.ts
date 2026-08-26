import { defineStore } from 'pinia'
import { ref } from 'vue'

export type BasemapType = 'satellite' | 'street' | 'terrain'

export const useMapStore = defineStore('map', () => {
  const mapInstance = ref<unknown>(null)
  const basemap = ref<BasemapType>('satellite')
  const searchGeometry = ref<Record<string, unknown> | null>(null) // GeoJSON
  const center = ref<[number, number]>([114.721, 30.585]) // 武汉阳逻
  const zoom = ref(12)

  function setMapInstance(map: unknown) {
    mapInstance.value = map
  }

  function setBasemap(type: BasemapType) {
    basemap.value = type
  }

  function setDrawGeometry(geojson: Record<string, unknown> | null) {
    searchGeometry.value = geojson
  }

  function flyTo(lng: number, lat: number, z?: number) {
    center.value = [lng, lat]
    if (z !== undefined) zoom.value = z
  }

  return { mapInstance, basemap, searchGeometry, center, zoom, setMapInstance, setBasemap, setDrawGeometry, flyTo }
})
