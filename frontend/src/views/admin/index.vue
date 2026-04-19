<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="话术数据" name="scripts">
        <el-card>
          <template #header>
            <span class="title">全量话术数据</span>
          </template>

          <el-form :inline="true" class="search-form">
            <el-form-item label="老师姓名">
              <el-input v-model="filters.teacherName" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="周次">
              <el-input v-model="filters.weekLabel" placeholder="如 2026W16" clearable />
            </el-form-item>
            <el-form-item label="班级">
              <el-input v-model="filters.className" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchData">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="list">
            <el-table-column prop="teacher.name" label="老师姓名" width="120" />
            <el-table-column prop="courseData.userName" label="学员姓名" width="120" />
            <el-table-column prop="courseData.className" label="班级" width="120" />
            <el-table-column label="上课时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.courseData?.lessonStartTime) }}
              </template>
            </el-table-column>
            <el-table-column label="话术内容">
              <template #default="{ row }">
                <div class="script-preview">
                  {{ (row.finalContent || row.generatedContent || '').slice(0, 80) }}...
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="老师管理" name="teachers">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="title">老师账号管理</span>
              <el-button type="primary" @click="openCreateDialog">创建老师账号</el-button>
            </div>
          </template>

          <el-table :data="teacherList">
            <el-table-column prop="name" label="姓名" width="150" />
            <el-table-column prop="employeeNo" label="工号" width="150" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="createDialogVisible" title="创建老师账号" width="450px">
      <el-form :model="createForm" label-width="80px" :rules="createRules" ref="createFormRef">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入老师姓名" />
        </el-form-item>
        <el-form-item label="工号" prop="employeeNo">
          <el-input v-model="createForm.employeeNo" placeholder="请输入工号（登录账号）" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input v-model="createForm.password" placeholder="不填则默认为 123456" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确认创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAllScripts, getTeachers, createTeacher } from '../../api/admin.api'

const activeTab = ref('scripts')
const list = ref<any[]>([])
const filters = ref({ teacherName: '', weekLabel: '', className: '' })

const teacherList = ref<any[]>([])
const createDialogVisible = ref(false)
const createFormRef = ref<any>(null)
const createForm = ref({ name: '', employeeNo: '', password: '' })
const createRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  employeeNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
}

const fetchData = async () => {
  try {
    const res: any = await getAllScripts(filters.value)
    list.value = res || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '查询失败')
  }
}

const fetchTeachers = async () => {
  try {
    const res: any = await getTeachers()
    teacherList.value = res || []
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取老师列表失败')
  }
}

const openCreateDialog = () => {
  createForm.value = { name: '', employeeNo: '', password: '' }
  createDialogVisible.value = true
}

const submitCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await createTeacher(createForm.value)
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    fetchTeachers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '创建失败')
  }
}

const formatTime = (time: string) => {
  if (!time) return '--'
  return new Date(time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchData()
  fetchTeachers()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 24px auto;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 16px;
}
.script-preview {
  color: #595959;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
