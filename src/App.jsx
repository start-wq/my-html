import { useEffect, useMemo, useRef, useState } from 'react'
import { Dices, RotateCw, Sparkles, Swords, Trophy, X } from 'lucide-react'
import { heroCatalog, heroTotal, lanePools } from './constants/heroCatalog'

const lanes = [
  { id: 'clash', label: '对抗路', short: '对抗', icon: '⚔', color: '#e57d53' }, { id: 'jungle', label: '打野', short: '打野', icon: '✦', color: '#8478d4' }, { id: 'mid', label: '中路', short: '中路', icon: '◇', color: '#d66caa' }, { id: 'farm', label: '发育路', short: '发育', icon: '➶', color: '#e9a936' }, { id: 'roam', label: '游走', short: '游走', icon: '◈', color: '#43aeb0' },
]
const avatarColors = ['#3e759d', '#bd6b4b', '#6d7f4c', '#7f5fb2']
const makeCandidates = (all, winner) => {
  const others = all.filter((hero) => hero !== winner).sort(() => Math.random() - .5).slice(0, 11)
  return [winner, ...others].sort(() => Math.random() - .5)
}

export default function App() {
  const [lane, setLane] = useState('clash'); const [rotation, setRotation] = useState(0); const [spinning, setSpinning] = useState(false); const [picked, setPicked] = useState(''); const [history, setHistory] = useState([]); const timer = useRef(null)
  const selected = lanes.find((item) => item.id === lane); const pool = lanePools[lane]; const [candidates, setCandidates] = useState(() => makeCandidates(lanePools.clash, lanePools.clash[0])); const slices = candidates.length
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { setCandidates(makeCandidates(pool, pool[0])); setPicked('') }, [lane])
  const wheelStyle = useMemo(() => { const part = 360 / slices; const stops = candidates.map((_, i) => `${i % 2 ? '#f3ead9' : '#fff9ef'} ${i * part}deg ${(i + 1) * part}deg`).join(', '); return { background: `conic-gradient(from -${part / 2}deg, ${stops})`, transform: `rotate(${rotation}deg)` } }, [candidates, rotation, slices])
  function spin() { if (spinning) return; const name = pool[Math.floor(Math.random() * pool.length)]; const nextCandidates = makeCandidates(pool, name); const winner = nextCandidates.indexOf(name); const part = 360 / nextCandidates.length; const landing = 360 - winner * part; setCandidates(nextCandidates); setPicked(''); setSpinning(true); setRotation(current => current + 2160 + landing - (current % 360)); timer.current = setTimeout(() => { setPicked(name); setHistory(items => [{ name, lane: selected.short }, ...items].slice(0, 4)); setSpinning(false) }, 4200) }
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
  </main>
}
