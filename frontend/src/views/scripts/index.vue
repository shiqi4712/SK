<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">本周话术列表</span>
          <div class="header-right">
            <el-form-item label="AI风格" class="style-select">
              <el-select v-model="aiStyle" size="small" style="width: 140px">
                <el-option label="严肃型" value="serious" />
                <el-option label="友善型" value="friendly" />
                <el-option label="亲和型" value="warm" />
                <el-option label="激励挑战型" value="challenge" />
              </el-select>
            </el-form-item>
            <el-button type="primary" :disabled="!selectedIds.length" @click="handleExport">
              批量下载选中
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="courseData.userName" label="学员姓名" width="120" />
        <el-table-column prop="courseData.className" label="班级" width="120" />
        <el-table-column label="上课时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.courseData?.lessonStartTime) }}
          </template>
        </el-table-column>
        <el-table-column label="风格" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="styleTagType(row.aiStyle)">
              {{ styleLabel(row.aiStyle) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isEdited ? 'success' : 'primary'">
              {{ row.isEdited ? '已编辑' : '已生成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="话术预览">
          <template #default="{ row }">
            <div class="script-preview">
              {{ (row.finalContent || row.generatedContent || '').slice(0, 60) }}...
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" @click="copyScript(row)">复制</el-button>
            <el-button type="warning" size="small" @click="handleGenerate(row)">重新生成</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="editVisible" title="编辑话术" width="600px">
      <el-input
        v-model="editForm.finalContent"
        type="textarea"
        :rows="12"
        placeholder="编辑话术内容"
      />
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getScriptList, updateScript, exportExcel, generateScript } from '../../api/script.api'

const list = ref<any[]>([])
const selectedIds = ref<number[]>([])
const editVisible = ref(false)
const editForm = ref<any>({})
const aiStyle = ref('friendly')

const fetchList = async () => {
  try {
    const res: any = await getScriptList()
    list.value = res || []
  } catch {
    list.value = []
  }
}

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map((r) => r.id)
}

const formatTime = (time: string) => {
  if (!time) return '--'
  return new Date(time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const styleLabel = (style?: string) => {
  const map: Record<string, string> = { serious: '严肃型', friendly: '友善型', warm: '亲和型', challenge: '激励挑战型' }
  return map[style || ''] || '友善型'
}

const styleTagType = (style?: string) => {
  const map: Record<string, any> = { serious: 'info', friendly: 'primary', warm: 'success', challenge: 'danger' }
  return map[style || ''] || 'primary'
}

const openEdit = (row: any) => {
  editForm.value = { ...row }
  editVisible.value = true
}

const saveEdit = async () => {
  try {
    await updateScript(editForm.value.id, editForm.value.finalContent)
    ElMessage.success('保存成功')
    editVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

const copyScript = (row: any) => {
  const text = row.finalContent || row.generatedContent || ''
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

const handleGenerate = async (row: any) => {
  try {
    await generateScript(row.courseDataId, aiStyle.value)
    ElMessage.success('话术重新生成成功')
    fetchList()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '生成失败')
  }
}

const handleExport = async () => {
  try {
    const blob: any = await exportExcel({ ids: selectedIds.value })
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `话术导出_${Date.now()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '导出失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 24px auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.style-select {
  margin-bottom: 0;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.script-preview {
  color: #595959;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
