import request from './request'

export function getAllScripts(params?: { teacherName?: string; weekLabel?: string; className?: string }) {
  return request.get('/admin/scripts', { params })
}

export function getStats() {
  return request.get('/admin/stats')
}

export function getWeeklyStats(weekLabel?: string) {
  return request.get('/admin/weekly-stats', { params: weekLabel ? { weekLabel } : undefined })
}

export function getTeachers() {
  return request.get('/admin/teachers')
}

export function createTeacher(data: { name: string; employeeNo: string; password?: string }) {
  return request.post('/admin/teachers', data)
}
