import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, getProfile } from '../api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(null)

  async function login(employeeNo: string, password: string) {
    const res: any = await loginApi({ employeeNo, password })
    token.value = res.token
    user.value = res.user
    localStorage.setItem('token', res.token)
    return res
  }

  async function fetchProfile() {
    if (!token.value) return null
    try {
      const res: any = await getProfile()
      user.value = res.user
      return res.user
    } catch (error) {
      logout()
      return null
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, login, fetchProfile, logout }
})
