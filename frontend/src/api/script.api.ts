import request from './request'

export function getScriptList(weekLabel?: string) {
  return request.get('/scripts', { params: { weekLabel } })
}

export function generateScript(courseDataId: number, style?: string) {
  return request.post(`/scripts/generate/${courseDataId}`, { style })
}

export function batchGenerate(ids: number[], style?: string) {
  return request.post('/scripts/batch-generate', { ids, style })
}

export function getQueueStatus(jobId: string) {
  return request.get(`/scripts/queue-status/${jobId}`)
}

export function updateScript(id: number, finalContent: string) {
  return request.put(`/scripts/${id}`, { finalContent })
}

export function exportExcel(data: { ids?: number[]; weekLabel?: string }) {
  return request.post('/export/excel', data, {
    responseType: 'blob',
  })
}
