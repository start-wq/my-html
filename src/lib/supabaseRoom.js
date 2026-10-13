const configKey = 'glory-draft-supabase-config'
const projectUrl = 'https://ndwlerksqmcifpeaunqt.supabase.co'
const publishableKey = 'sb_publishable_iAaAVFu1hfLOhV75Uwhx2g_LGgNAd24'

export const readCloudConfig = () => {
  try { return { url: projectUrl, key: publishableKey, roomCode: JSON.parse(localStorage.getItem(configKey))?.roomCode || '' } } catch { return { url: projectUrl, key: publishableKey, roomCode: '' } }
}

export const saveCloudConfig = (config) => localStorage.setItem(configKey, JSON.stringify({ roomCode: config.roomCode }))

const request = async (config, path, options = {}) => {
  if (!config.url || !config.key || !config.roomCode) throw new Error('请先填写 Supabase 配置和房间码')
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    // 新版 sb_publishable_ 密钥是浏览器 API key，不是可作为 Bearer 令牌使用的 JWT。
    headers: { apikey: config.key, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) },
  })
  if (!response.ok) {
    const detail = await response.text()
    const hint = response.status === 404 ? '找不到数据表，请先执行 schema.sql' : response.status === 401 || response.status === 403 ? 'URL、Publishable key 或权限配置不正确' : detail.slice(0, 80)
    throw new Error(`云端同步失败（${response.status}）：${hint}`)
  }
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const fetchRoomRecords = (config) => request(config, `match_records?room_code=eq.${encodeURIComponent(config.roomCode)}&order=played_at.desc`)
export const saveRoomRecord = (config, record) => request(config, 'match_records', { method: 'POST', body: JSON.stringify({ room_code: config.roomCode, player_id: record.playerId, result: record.result, rating: record.rating, hero: record.hero || null, played_at: new Date().toISOString() }) })
export const deleteRoomRecord = (config, id) => request(config, `match_records?id=eq.${encodeURIComponent(id)}&room_code=eq.${encodeURIComponent(config.roomCode)}`, { method: 'DELETE' })
