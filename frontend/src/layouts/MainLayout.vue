<template>
  <div class="main-layout">
    <header class="top-nav">
      <div class="nav-brand">
        <el-icon class="brand-icon"><Document /></el-icon>
        <span class="brand-title">AI回访话术系统</span>
      </div>
      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-link', { active: $route.path === item.path }]"
        >
          {{ item.title }}
        </router-link>
      </nav>
      <div class="nav-user">
        <span class="user-name">{{ authStore.user?.name || '用户' }}</span>
        <el-button type="info" size="small" plain @click="handleLogout">
          退出
        </el-button>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Document } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const menuItems = computed(() => {
  if (authStore.user?.role === 'admin') {
    return [{ path: '/admin', title: '管理后台' }]
  }
  return [
    { path: '/upload', title: '上传数据' },
    { path: '/status', title: '状态确认' },
    { path: '/scripts', title: '话术列表' },
  ]
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: #F5F7FA;
}
.top-nav {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #E4E7ED;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}
.brand-icon {
  font-size: 20px;
  color: #409EFF;
}
.nav-menu {
  display: flex;
  gap: 8px;
}
.nav-link {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  color: #595959;
  text-decoration: none;
  transition: all 0.2s;
}
.nav-link:hover {
  color: #409EFF;
  background-color: #ECF5FF;
}
.nav-link.active {
  color: #409EFF;
  background-color: #ECF5FF;
  font-weight: 500;
}
.nav-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  font-size: 14px;
  color: #262626;
}
.main-content {
  padding: 24px;
}
</style>
