import request from './request'

export function getStatusList(weekLabel?: string) {
  return request.get('/status', { params: { weekLabel } })
}

export function saveStatus(courseDataId: number, data: any) {
  return request.post(`/status/${courseDataId}`, data)
}

export function batchConfirm(ids: number[]) {
  return request.post('/status/batch-confirm', { ids })
}
