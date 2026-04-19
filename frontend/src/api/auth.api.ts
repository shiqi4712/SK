import request from './request'

export function login(data: { employeeNo: string; password: string }) {
  return request.post('/auth/login', data)
}

export function getProfile() {
  return request.get('/auth/profile')
}

export function changePassword(data: { oldPassword: string; newPassword: string }) {
  return request.post('/auth/change-password', data)
}
