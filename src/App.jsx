import { useEffect, useMemo, useRef, useState } from 'react'
import { Dices, RotateCw, Sparkles, Swords, Trophy, X, ClipboardPlus, Crown, Flame, Trash2, Cloud, RefreshCw } from 'lucide-react'
import { heroCatalog, heroTotal, lanePools } from './constants/heroCatalog'
import { deleteRoomRecord, fetchRoomRecords, readCloudConfig, saveCloudConfig, saveRoomRecord } from './lib/supabaseRoom'

const lanes = [
  { id: 'clash', label: '对抗路', short: '对抗', icon: '⚔', color: '#e57d53' }, { id: 'jungle', label: '打野', short: '打野', icon: '✦', color: '#8478d4' }, { id: 'mid', label: '中路', short: '中路', icon: '◇', color: '#d66caa' }, { id: 'farm', label: '发育路', short: '发育', icon: '➶', color: '#e9a936' }, { id: 'roam', label: '游走', short: '游走', icon: '◈', color: '#43aeb0' },
]
const avatarColors = ['#3e759d', '#bd6b4b', '#6d7f4c', '#7f5fb2']
const teamSlots = [
  { id: 'clash', lane: '对抗路', name: '对抗路队友' }, { id: 'jungle', lane: '打野', name: '打野队友' }, { id: 'mid', lane: '中路', name: '中路队友' }, { id: 'farm', lane: '发育路', name: '发育路队友' }, { id: 'roam', lane: '游走', name: '游走队友' },
]
const scoreInputLabels = { clash: '对抗', jungle: '打野', mid: '中单', farm: '发育', roam: '辅助' }
const storageKey = 'glory-draft-scoreboard-v1'
const readScoreboard = () => { try { return JSON.parse(localStorage.getItem(storageKey)) || { players: teamSlots, records: [] } } catch { return { players: teamSlots, records: [] } } }
const makeCandidates = (all, winner) => {
  const others = all.filter((hero) => hero !== winner).sort(() => Math.random() - .5).slice(0, 11)
  return [winner, ...others].sort(() => Math.random() - .5)
}

export default function App() {
  const [lane, setLane] = useState('clash'); const [rotation, setRotation] = useState(0); const [spinning, setSpinning] = useState(false); const [picked, setPicked] = useState(''); const [history, setHistory] = useState([]); const timer = useRef(null)
  const initialBoard = useMemo(readScoreboard, [])
  const [players, setPlayers] = useState(initialBoard.players?.length === 5 ? initialBoard.players : teamSlots)
  const [records, setRecords] = useState(initialBoard.records || [])
  const [scoreForm, setScoreForm] = useState({ result: 'win', ratings: { clash: '', jungle: '', mid: '', farm: '', roam: '' } })
  const [cloud, setCloud] = useState(readCloudConfig); const [cloudStatus, setCloudStatus] = useState('本地模式')
  const selected = lanes.find((item) => item.id === lane); const pool = lanePools[lane]; const [candidates, setCandidates] = useState(() => makeCandidates(lanePools.clash, lanePools.clash[0])); const slices = candidates.length
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { setCandidates(makeCandidates(pool, pool[0])); setPicked('') }, [lane])
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify({ players, records })) }, [players, records])
  useEffect(() => { if (!cloud.url || !cloud.key || !cloud.roomCode) return undefined; const timerId = setInterval(() => syncRecords(false), 12000); syncRecords(false); return () => clearInterval(timerId) }, [cloud.url, cloud.key, cloud.roomCode])
  const wheelStyle = useMemo(() => { const part = 360 / slices; const stops = candidates.map((_, i) => `${i % 2 ? '#f3ead9' : '#fff9ef'} ${i * part}deg ${(i + 1) * part}deg`).join(', '); return { background: `conic-gradient(from -${part / 2}deg, ${stops})`, transform: `rotate(${rotation}deg)` } }, [candidates, rotation, slices])
  function spin() { if (spinning) return; const name = pool[Math.floor(Math.random() * pool.length)]; const nextCandidates = makeCandidates(pool, name); const winner = nextCandidates.indexOf(name); const part = 360 / nextCandidates.length; const landing = 360 - winner * part; setCandidates(nextCandidates); setPicked(''); setSpinning(true); setRotation(current => current + 2160 + landing - (current % 360)); timer.current = setTimeout(() => { setPicked(name); setHistory(items => [{ name, lane: selected.short }, ...items].slice(0, 4)); setSpinning(false) }, 4200) }
  const stats = players.map(player => {
    const latest = records.filter(record => record.playerId === player.id).slice(0, 10)
    const games = latest.length; const wins = latest.filter(record => record.result === 'win').length
    const average = games ? latest.reduce((sum, record) => sum + Number(record.rating), 0) / games : 0
    const score = games ? average / 16 * 80 + (wins / games) * 20 : 0
    return { ...player, games, wins, average, score }
  }).sort((a, b) => b.score - a.score)
  const best = stats.find(player => player.games); const needsHelp = [...stats].reverse().find(player => player.games)
  const allTimeExtremes = useMemo(() => {
    if (!records.length) return null
    const ordered = [...records].sort((a, b) => Number(a.rating) - Number(b.rating))
    const positiveRecords = ordered.filter(record => Number(record.rating) > 0)
    const describe = (record) => {
      const player = players.find(item => item.id === record.playerId)
      return { lane: player?.lane || '未知分路', rating: Number(record.rating) }
    }
    return { lowest: positiveRecords.length ? describe(positiveRecords[0]) : null, highest: describe(ordered[ordered.length - 1]) }
  }, [records, players])
  function updatePlayer(id, name) { setPlayers(items => items.map(player => player.id === id ? { ...player, name: name.trim() || teamSlots.find(slot => slot.id === id).name } : player)) }
  async function syncRecords(showStatus = true) { try { const rows = await fetchRoomRecords(cloud); setRecords(rows.map(row => ({ id: row.id, playerId: row.player_id, result: row.result, rating: Number(row.rating), hero: row.hero || '', createdAt: new Date(row.played_at).getTime() }))); setCloudStatus(`房间 ${cloud.roomCode} · 已同步`); } catch (error) { if (showStatus) setCloudStatus(error.message) } }
  function connectCloud(event) { event.preventDefault(); saveCloudConfig(cloud); if (cloud.url && cloud.key && cloud.roomCode) syncRecords(); else setCloudStatus('本地模式') }
  async function addRecord(event) { event.preventDefault(); const createdAt = Date.now(); const matchRecords = teamSlots.map((player, index) => ({ id: `${createdAt}-${player.id}`, playerId: player.id, result: scoreForm.result, rating: Math.max(0, Math.min(16, Number(scoreForm.ratings[player.id]))), hero: '', createdAt: createdAt + index })); if (matchRecords.some(record => Number.isNaN(record.rating))) return; try { if (cloud.url && cloud.key && cloud.roomCode) { await Promise.all(matchRecords.map(record => saveRoomRecord(cloud, record))); await syncRecords(false) } else setRecords(items => [...matchRecords, ...items]); setScoreForm({ result: scoreForm.result, ratings: { clash: '', jungle: '', mid: '', farm: '', roam: '' } }) } catch (error) { setCloudStatus(error.message) } }
  async function removeRecord(id) { try { if (cloud.url && cloud.key && cloud.roomCode) { await deleteRoomRecord(cloud, id); await syncRecords(false) } else setRecords(items => items.filter(item => item.id !== id)) } catch (error) { setCloudStatus(error.message) } }
  return <main className="app-shell" style={{ '--lane': selected.color }}>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar"><div className="brand"><div className="brand-mark"><Swords size={22} /></div><div><strong>峡谷命运局</strong><span>GLORY DRAFT</span></div></div><div className="status"><span className="status-dot" />今日适合上分</div></header>
    <section className="hero-copy"><p className="eyebrow"><Sparkles size={15} /> 随机英雄 · 告别选择困难</p><h1>这一局，<em>谁来带飞？</em></h1><p>选择你的分路，让命运替你锁定本局英雄。</p></section>
    <section className="draft-layout">
      <aside className="lane-panel"><div className="panel-title"><span>01</span><div><h2>选择分路</h2><p>英雄池将随分路切换</p></div></div><div className="lane-list">{lanes.map(item => <button key={item.id} onClick={() => !spinning && setLane(item.id)} className={`lane-button ${lane === item.id ? 'active' : ''}`} style={{ '--item': item.color }} disabled={spinning}><b>{item.icon}</b><span>{item.label}</span>{lane === item.id && <i>已选</i>}</button>)}</div><div className="tip"><Dices size={17} /><span>已按 {Object.keys(heroCatalog).length} 个职业分类收录 {heroTotal} 位英雄；当前分路 {pool.length} 位</span></div></aside>
      <section className="wheel-area"><div className="stage-label"><span />本局分路：<b>{selected.label}</b><span /></div><div className="wheel-stage"><div className="pointer"><span /></div><div className="wheel-outer"><div className="wheel" style={wheelStyle}>{candidates.map((name, i) => { const angle = i * 360 / slices; return <div className="wheel-label" key={name} style={{ transform: `rotate(${angle}deg)` }}><span style={{ transform: `rotate(${-angle}deg)` }}>{name}</span></div> })}<div className="wheel-core"><span>命运</span><small>WHEEL</small></div></div></div></div><button className={`spin-button ${spinning ? 'loading' : ''}`} onClick={spin} disabled={spinning}><RotateCw size={20} />{spinning ? '命运转动中...' : '开启命运转盘'}</button><p className="spin-note">从当前分路全量英雄池中随机抽取 · 转盘展示 12 位候选</p></section>
      <aside className="record-panel"><div className="panel-title"><span>03</span><div><h2>本局战令</h2><p>随机结果记录</p></div></div>{history.length ? <div className="history">{history.map((item, i) => <div className="history-item" key={`${item.name}-${i}`}><div className="hero-avatar" style={{ '--avatar': avatarColors[i] }}>{item.name.slice(0, 1)}</div><div><b>{item.name}</b><span>{item.lane}</span></div><small>#{String(history.length - i).padStart(2, '0')}</small></div>)}</div> : <div className="empty-record"><Trophy size={34} /><p>转动一次<br />开启你的峡谷之旅</p></div>}<div className="record-footer"><span>今日已抽取</span><b>{history.length} 次</b></div></aside>
    </section>
    {picked && <div className="result-toast"><div className="result-icon">{picked.slice(0, 1)}</div><div><span>本局英雄已锁定</span><b>{picked}</b></div><button onClick={() => setPicked('')}><X size={17} /></button></div>}
    <section className="scoreboard">
      <form className="cloud-bar" onSubmit={connectCloud}><div className="cloud-title"><Cloud size={17} /><b>共享房间</b><span>{cloudStatus}</span></div><input className="room-code" placeholder="输入房间码，如 WZRY-8K2M" value={cloud.roomCode} onChange={event => setCloud(item => ({ ...item, roomCode: event.target.value.toUpperCase().replace(/\s/g, '') }))} /><button type="submit">连接房间</button><button type="button" title="立即同步" onClick={() => syncRecords()}><RefreshCw size={16} /></button></form>
      <div className="scoreboard-heading"><div><p className="eyebrow"><ClipboardPlus size={15} /> 五排战绩评分</p><h2>最近 10 局，谁在 <em>带飞？</em></h2><p>由战绩记录员手动填写每局胜负与游戏内评分（最高 16 分）。综合分 = 平均评分 ÷ 16 × 80 + 胜率 × 20。</p></div><div className="score-legend"><span><Crown size={15} />{best ? `本周 C 位：${best.name}` : '等待首局战绩'}</span><span><Flame size={15} />仅统计每人最近 10 局</span></div></div>
      <div className="all-time-extremes">{allTimeExtremes ? <><span>最低评分：{allTimeExtremes.lowest ? <><b>{allTimeExtremes.lowest.lane}</b> {allTimeExtremes.lowest.rating} 分</> : '暂无有效记录'}</span><i /> <span>最高评分：<b>{allTimeExtremes.highest.lane}</b> {allTimeExtremes.highest.rating} 分</span></> : <span>最低评分：暂无记录　　最高评分：暂无记录</span>}</div>
      <div className="score-grid">
        <form className="score-form" onSubmit={addRecord}><h3>登记一局</h3><label>本局结果<div className="result-switch"><button type="button" className={scoreForm.result === 'win' ? 'chosen win' : ''} onClick={() => setScoreForm(form => ({ ...form, result: 'win' }))}>胜利</button><button type="button" className={scoreForm.result === 'loss' ? 'chosen loss' : ''} onClick={() => setScoreForm(form => ({ ...form, result: 'loss' }))}>失败</button></div></label><div className="rating-inputs"><span>五路评分（0–16）</span>{teamSlots.map(player => <input key={player.id} aria-label={`${scoreInputLabels[player.id]}评分`} type="number" min="0" max="16" step="0.1" placeholder={scoreInputLabels[player.id]} value={scoreForm.ratings[player.id]} onChange={event => setScoreForm(form => ({ ...form, ratings: { ...form.ratings, [player.id]: event.target.value } }))} required />)}</div><button className="save-score" type="submit"><ClipboardPlus size={17} />保存本局战绩</button></form>
        <div className="rank-list"><div className="rank-title"><h3>五排状态榜</h3><span>总记录 {records.length} 局</span></div>{stats.map((player, index) => <article className={`rank-card ${player.id === best?.id ? 'best' : ''} ${player.id === needsHelp?.id && player.games ? 'help' : ''}`} key={player.id}><div className="rank-number">{String(index + 1).padStart(2, '0')}</div><div className="player-info"><input aria-label={`${player.lane}玩家名称`} value={player.name} onChange={event => updatePlayer(player.id, event.target.value)} /><span>{player.lane} · {player.games ? `${player.games} 局 · 胜率 ${Math.round(player.wins / player.games * 100)}%` : '暂无战绩'}</span></div><div className="player-score"><b>{player.games ? player.score.toFixed(1) : '—'}</b><small>综合分</small></div>{player.id === best?.id && <Crown className="rank-badge crown" size={16} />}{player.id === needsHelp?.id && player.id !== best?.id && <span className="help-badge">需要带飞</span>}</article>)}</div>
      </div>
      {records.length > 0 && <div className="recent-records"><div><h3>最近登记</h3><p>删除错误录入后，排行榜会立即重新计算。</p></div><div className="record-chips">{records.slice(0, 10).map(record => { const player = players.find(item => item.id === record.playerId); return <span className={record.result} key={record.id}><b>{player?.name}</b> {record.result === 'win' ? '胜' : '负'} · {record.rating} 分{record.hero ? ` · ${record.hero}` : ''}<button aria-label="删除此条战绩" onClick={() => removeRecord(record.id)}><Trash2 size={12} /></button></span> })}</div></div>}
    </section>
  </main>
}
