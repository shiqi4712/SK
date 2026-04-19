<template>
  <div class="login-page">
    <div class="login-card">
      <h1>AI智能回访话术生成系统</h1>
      <p class="subtitle">让回访更高效，让沟通有温度</p>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="form.employeeNo"
            placeholder="请输入工号"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)

const form = reactive({
  employeeNo: '',
  password: '',
})

const handleLogin = async () => {
  if (!form.employeeNo || !form.password) {
    ElMessage.warning('请输入工号和密码')
    return
  }
  loading.value = true
  try {
    const res: any = await authStore.login(form.employeeNo, form.password)
    ElMessage.success('登录成功')
    if (res.user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/upload')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F7FA;
}
.login-card {
  width: 400px;
  padding: 48px 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.login-card h1 {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
  color: #262626;
}
.subtitle {
  font-size: 14px;
  color: #8C8C8C;
  text-align: center;
  margin-bottom: 32px;
}
.login-btn {
  width: 100%;
  height: 40px;
  font-size: 15px;
}
</style>
