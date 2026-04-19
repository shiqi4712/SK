<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.store'

const authStore = useAuthStore()

onMounted(() => {
  if (authStore.token) {
    authStore.fetchProfile()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  background-color: #F5F7FA;
  color: #262626;
}
</style>
