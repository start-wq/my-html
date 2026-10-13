const configKey = 'glory-draft-supabase-config'

export const readCloudConfig = () => {
  try { return JSON.parse(localStorage.getItem(configKey)) || { url: '', key: '', roomCode: '' } } catch { return { url: '', key: '', roomCode: '' } }
}

export const saveCloudConfig = (config) => localStorage.setItem(configKey, JSON.stringify(config))

const request = async (config, path, options = {}) => {
  if (!config.url || !config.key || !config.roomCode) throw new Error('请先填写 Supabase 配置和房间码')
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(options.headers || {}) },
  })
  if (!response.ok) throw new Error(`云端同步失败（${response.status}）`)
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const fetchRoomRecords = (config) => request(config, `match_records?room_code=eq.${encodeURIComponent(config.roomCode)}&order=played_at.desc`)
export const saveRoomRecord = (config, record) => request(config, 'match_records', { method: 'POST', body: JSON.stringify({ room_code: config.roomCode, player_id: record.playerId, result: record.result, rating: record.rating, hero: record.hero || null, played_at: new Date().toISOString() }) })
export const deleteRoomRecord = (config, id) => request(config, `match_records?id=eq.${encodeURIComponent(id)}&room_code=eq.${encodeURIComponent(config.roomCode)}`, { method: 'DELETE' })
