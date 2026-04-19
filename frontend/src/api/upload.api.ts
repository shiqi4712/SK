import request from './request'

export function uploadExcel(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
