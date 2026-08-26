import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import type { UserProfile } from '@/api/user'

export const useUserStore = defineStore('rsUser', () => {
  const token = ref<string>(Cookies.get('Admin-Token') || '')
  const user = ref<UserProfile | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const quotaPercent = computed(() =>
    user.value ? Math.round((user.value.quotaUsed / user.value.quotaTotal) * 100) : 0,
  )

  function setToken(t: string) {
    token.value = t
    Cookies.set('Admin-Token', t)
  }

  function setUser(u: UserProfile) {
    user.value = u
    localStorage.setItem('userRole', u.role || 'user')
    if (u.apiKey) {
      localStorage.setItem('apiKey', u.apiKey)
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    Cookies.remove('Admin-Token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('apiKey')
  }

  return { token, user, isLoggedIn, isAdmin, quotaPercent, setToken, setUser, logout }
})
