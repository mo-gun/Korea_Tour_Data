import { useMemo, useState } from 'react'
import { useApp } from '../store/appState.jsx'
import Icon from '../components/Icon.jsx'
import { dow, todayStr } from '../lib/runninggu/index.js'

const MON_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export default function HomeScreen() {
  const { races, dispatch } = useApp()
  const [view, setView] = useState('list')
  const [region, setRegion] = useState(null)
  const [month, setMonth] = useState(null)
  const [openOnly, setOpenOnly] = useState(false)
  const [q, setQ] = useState('')

  // 다가오는 대회만 노출(오늘 이후). 지난 대회는 목록에서 제외.
  const upcoming = useMemo(() => {
    const today = todayStr()
    return races.filter((r) => r.date >= today)
  }, [races])

  const regions = useMemo(() => [...new Set(upcoming.map((r) => r.region))], [upcoming])
  const months = useMemo(() => [...new Set(upcoming.map((r) => Number(r.date.slice(5, 7))))].sort((a, b) => a - b), [upcoming])

  const filtered = useMemo(() => {
    return upcoming
      .filter((r) => (region ? r.region === region : true))
      .filter((r) => (month ? Number(r.date.slice(5, 7)) === month : true))
      .filter((r) => (openOnly ? r.regStatus === '접수중' : true))
      .filter((r) => (q ? (r.name + r.venue + r.region).includes(q) : true))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [upcoming, region, month, openOnly, q])

  const clearAll = () => { setRegion(null); setMonth(null); setOpenOnly(false); setQ('') }

  return (
    <>
      {/* 헤더 */}
      <div className="appbar" style={{ padding: '6px 22px 14px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--c-lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#15161B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-6 4 3 5-8" /><circle cx="20" cy="5" r="1.4" fill="#15161B" stroke="none" /></svg>
          </span>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px' }}>런트립</span>
        </span>
        <span className="spacer" />
        <button className="iconbtn" aria-label="검색"><Icon name="search" size={22} stroke={2} /></button>
      </div>

      {/* 리스트/캘린더 토글 */}
      <div style={{ padding: '0 22px 14px', flex: 'none' }}>
        <div className="toggle" role="tablist">
          <button className={`opt ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>리스트</button>
          <button className={`opt ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>캘린더</button>
        </div>
      </div>

      {/* 검색 인풋 */}
      <div style={{ padding: '0 22px 12px', flex: 'none' }}>
        <label className="sheet-search" style={{ margin: 0 }}>
          <Icon name="search" size={18} stroke={2} style={{ color: 'var(--c-ink-5)' }} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="대회·지역 검색"
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--c-ink)', fontFamily: 'inherit' }}
          />
        </label>
      </div>

      {/* 필터 칩 */}
      <div className="chip-row scr" style={{ flex: 'none' }}>
        <button className="chip outline-ink"><Icon name="filter" size={14} stroke={2.2} />필터</button>
        {regions.map((rg) => (
          <button key={rg} className={`chip ${region === rg ? 'active' : ''}`} onClick={() => setRegion(region === rg ? null : rg)}>
            {rg}{region === rg && <span className="x">✕</span>}
          </button>
        ))}
        {months.map((m) => (
          <button key={m} className={`chip ${month === m ? 'active' : ''}`} onClick={() => setMonth(month === m ? null : m)}>
            {m}월{month === m && <span className="x">✕</span>}
          </button>
        ))}
        <button className={`chip ${openOnly ? 'active' : ''}`} onClick={() => setOpenOnly(!openOnly)}>접수 가능만</button>
      </div>

      {/* 목록 */}
      <div className="scr scr-body" style={{ padding: '0 22px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink-4)' }}>
          대회 <span style={{ color: 'var(--c-primary)' }}>{filtered.length}</span>
        </div>
        {filtered.length === 0 && (
          <div className="empty">
            <div className="e-title">조건에 맞는 대회가 없어요.</div>
            <div>필터를 바꿔보세요.</div>
            <button className="e-link" onClick={clearAll}>필터 초기화</button>
          </div>
        )}
        {filtered.map((r, i) => (
          <RaceCard key={r.id} race={r} featured={i === 0 && r.regStatus === '접수중'} onClick={() => dispatch({ type: 'SELECT_RACE', race: r })} />
        ))}
      </div>
    </>
  )
}

function RaceCard({ race, featured, onClick }) {
  const mon = Number(race.date.slice(5, 7))
  const day = race.date.slice(8, 10)
  const closed = race.regStatus !== '접수중'
  return (
    <button className={`race-card ${featured ? 'featured' : ''} ${closed ? 'closed' : ''}`} onClick={onClick} style={{ textAlign: 'left', width: '100%' }}>
      <div className="datecol">
        <div className={`mon ${featured ? 'hot' : ''}`}>{MON_EN[mon - 1]}</div>
        <div className="day">{day}</div>
        <div className="dow">{dow(race.date)}</div>
      </div>
      <div className="body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div className="name">{race.name}</div>
          <Icon name="heart" size={22} stroke={1.5} fill={featured ? 'var(--c-orange)' : 'none'} style={{ color: featured ? 'var(--c-orange)' : '#C2C4C9', flex: 'none' }} />
        </div>
        <div className="place">{race.region} · {race.venue}</div>
        <div className="evt-tags">
          {race.eventTypes.map((e, idx) => <span key={e} className={`evt-tag ${idx === 0 ? 'hi' : ''}`}>{e}</span>)}
        </div>
        <div className="statusline">
          <span className={`statuschip ${closed ? 'closed' : 'open'}`}>{race.regStatus}</span>
          <span className="source">{race.source} · 확인 {race.checked?.slice(5).replace('-', '.')}</span>
        </div>
      </div>
    </button>
  )
}
