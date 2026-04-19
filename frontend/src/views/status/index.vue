<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <span class="title">学员状态确认</span>
            <span class="tip">请逐一对学生进行状态确认后再生成话术</span>
          </div>
          <div class="header-right">
            <el-form-item label="AI风格" class="style-select">
              <el-select v-model="aiStyle" size="small" style="width: 140px">
                <el-option label="严肃型" value="serious" />
                <el-option label="友善型" value="friendly" />
                <el-option label="亲和型" value="warm" />
                <el-option label="激励挑战型" value="challenge" />
              </el-select>
            </el-form-item>
            <el-button type="primary" @click="batchConfirm" :disabled="!selectedIds.length || generating">
              {{ generating ? `生成中 ${generateProgress}%` : '确认选中并生成话术' }}
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userName" label="学员姓名" width="120" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column label="出勤状态" width="140">
          <template #default="{ row }">
            <el-select v-model="row.statusForm.attendanceStatus" placeholder="请选择" size="small">
              <el-option label="到课" value="到课" />
              <el-option label="迟到" value="迟到" />
              <el-option label="早退" value="早退" />
              <el-option label="缺勤" value="缺勤" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="课堂表现" width="140">
          <template #default="{ row }">
            <el-select v-model="row.statusForm.performanceLevel" placeholder="请选择" size="small">
              <el-option label="优秀" value="优秀" />
              <el-option label="良好" value="良好" />
              <el-option label="一般" value="一般" />
              <el-option label="需关注" value="需关注" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="作业情况" width="140">
          <template #default="{ row }">
            <el-select v-model="row.statusForm.homeworkStatus" placeholder="请选择" size="small">
              <el-option label="已完成" value="已完成" />
              <el-option label="未完成" value="未完成" />
              <el-option label="未提交" value="未提交" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注">
          <template #default="{ row }">
            <el-input v-model="row.statusForm.remarks" placeholder="备注" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="saveOne(row)">保存</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getStatusList, saveStatus, batchConfirm as batchConfirmApi } from '../../api/status.api'
import { batchGenerate, getQueueStatus } from '../../api/script.api'

const router = useRouter()
const list = ref<any[]>([])
const selectedIds = ref<number[]>([])
const aiStyle = ref('friendly')
const generating = ref(false)
const generateProgress = ref(0)

const initStatusForm = (item: any) => {
  // 出勤状态：已保存优先，否则按原始数据映射
  let attendanceStatus = item.attendanceStatus
  if (!attendanceStatus) {
    if (item.isAbsent) attendanceStatus = '缺勤'
    else if (item.isAttended) attendanceStatus = '到课'
    else attendanceStatus = '迟到'
  }

  // 作业情况：已保存优先，否则按课后正确率映射
  let homeworkStatus = item.homeworkStatus
  if (!homeworkStatus) {
    if (item.homeworkAccuracy > 0 || item.extensionAccuracy > 0) homeworkStatus = '已完成'
    else homeworkStatus = '未提交'
  }

  // 课堂表现：已保存优先，否则综合正确率和奖杯数判断
  let performanceLevel = item.performanceLevel
  if (!performanceLevel) {
    const hw = item.homeworkAccuracy ?? 0
    const ext = item.extensionAccuracy ?? 0
    if (hw >= 90 && ext >= 90 && item.trophyCount >= 2) performanceLevel = '优秀'
    else if (hw >= 60 && ext >= 60) performanceLevel = '良好'
    else if (hw >= 40 && ext >= 40) performanceLevel = '一般'
    else performanceLevel = '需关注'
  }

  return {
    attendanceStatus,
    performanceLevel,
    homeworkStatus,
    remarks: item.remarks || '',
  }
}

const fetchList = async () => {
  try {
    const res: any = await getStatusList()
    list.value = res.map((item: any) => ({
      ...item,
      statusForm: initStatusForm(item),
    }))
  } catch {
    list.value = []
  }
}

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map((r) => r.id)
}

const saveOne = async (row: any) => {
  try {
    await saveStatus(row.id, row.statusForm)
    ElMessage.success('保存成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  }
}

const pollJobStatus = async (jobIds: string[]) => {
  const total = jobIds.length
  let completed = 0
  const maxAttempts = 40 // 最多轮询3分钟

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const states = await Promise.all(
      jobIds.map((id) => getQueueStatus(id).catch(() => ({ state: 'unknown' })))
    )
    completed = states.filter((s: any) => s?.state === 'completed' || s?.state === 'failed').length
    generateProgress.value = Math.round((completed / total) * 100)

    if (completed >= total) break
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }
}

const batchConfirm = async () => {
  try {
    const selectedRows = list.value.filter((r) => selectedIds.value.includes(r.id))
    for (const row of selectedRows) {
      await saveStatus(row.id, row.statusForm)
    }
    await batchConfirmApi(selectedIds.value)
    ElMessage.success('状态确认成功，已加入生成队列')

    const res: any = await batchGenerate(selectedIds.value, aiStyle.value)
    const jobs = res?.jobs || []
    if (jobs.length > 0) {
      generating.value = true
      const jobIds = jobs.map((j: any) => String(j.jobId))
      await pollJobStatus(jobIds)
      generating.value = false
    }

    ElMessage.success('话术生成完成')
    router.push('/scripts')
  } catch (error: any) {
    generating.value = false
    ElMessage.error(error.response?.data?.message || '操作失败')
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
  margin-right: 12px;
}
.tip {
  font-size: 13px;
  color: #8C8C8C;
}
</style>
