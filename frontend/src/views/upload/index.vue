<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">上传本周课程数据</span>
          <span class="tip">支持 .xlsx / .csv 格式，文件大小不超过 5MB</span>
        </div>
      </template>

      <el-upload
        drag
        action="/api/upload/excel"
        :headers="uploadHeaders"
        :limit="1"
        accept=".xlsx,.csv"
        :on-success="handleSuccess"
        :on-error="handleError"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或 <em>点击上传</em>
        </div>
      </el-upload>

      <div v-if="uploadResult" class="result">
        <el-alert
          :title="`上传成功！共解析 ${uploadResult.total} 条数据，周次：${uploadResult.weekLabel}`"
          type="success"
          show-icon
          :closable="false"
        />
        <div class="actions">
          <el-button type="primary" @click="$router.push('/status')">
            前往状态确认
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const uploadResult = ref<any>(null)

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`,
}))

const handleSuccess = (response: any) => {
  uploadResult.value = response
  ElMessage.success(response.message)
  setTimeout(() => {
    router.push('/status')
  }, 1500)
}

const handleError = (error: any) => {
  let msg = '上传失败'
  if (typeof error === 'string') {
    msg = error
  } else if (error?.response?.data?.message) {
    msg = error.response.data.message
  } else if (error?.message) {
    msg = error.message
  }
  ElMessage.error(msg)
}
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 24px auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.tip {
  font-size: 13px;
  color: #8C8C8C;
}
.result {
  margin-top: 24px;
}
.actions {
  margin-top: 16px;
  text-align: center;
}
</style>
