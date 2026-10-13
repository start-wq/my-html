export async function fetchDashboard() {
  const response = await fetch('/api/dashboard')

  if (!response.ok) {
    throw new Error('无法连接后端服务')
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.message || '获取首页数据失败')
  }
  return result.data
}
