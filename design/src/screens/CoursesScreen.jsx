import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { fetchWalkingCourses } from '../lib/runninggu/index.js'

// 러닝코스(M4) — 두루누비(TourAPI) 걷기 코스(코리아둘레길). 대회가 없어도 오늘 걸을/뛸 코스를 안내.
const DIST_FILTERS = [
  { key: '~10km', min: 0, max: 10 },
  { key: '10~15km', min: 10, max: 15 },
  { key: '15km+', min: 15, max: 999 },
]
const LEVEL_FILTERS = ['쉬움', '보통', '어려움']

export default function CoursesScreen() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState(null)
  const [dist, setDist] = useState(null)
  const [level, setLevel] = useState(null)

  useEffect(() => {
    let on = true
    setLoading(true)
    fetchWalkingCourses()
      .then((list) => { if (on) { setCourses(list); setLoading(false) } })
      .catch(() => { if (on) { setCourses([]); setLoading(false) } })
    return () => { on = false }
  }, [])

  // 지역 칩은 실제 데이터에 존재하는 시·도에서 코스 많은 순으로.
  const regions = useMemo(() => {
    const cnt = {}
    for (const c of courses) if (c.sido) cnt[c.sido] = (cnt[c.sido] || 0) + 1
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([r]) => r)
  }, [courses])

  const filtered = useMemo(() => {
    const df = DIST_FILTERS.find((f) => f.key === dist)
    return courses
      .filter((c) => (region ? c.sido === region : true))
      .filter((c) => (df ? c.distKm >= df.min && c.distKm < df.max : true))
      .filter((c) => (level ? c.level === level : true))
  }, [courses, region, dist, level])

  const clearAll = () => { setRegion(null); setDist(null); setLevel(null) }

  return (
    <>
      <div className="appbar" style={{ padding: '8px 22px 14px' }}>
        <span className="title" style={{ fontSize: 20, fontWeight: 800 }}>러닝·산책 코스</span>
      </div>

      {/* 지역 칩 */}
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 4 }}>
        {regions.map((rg) => (
          <button key={rg} className={`chip ${region === rg ? 'active' : ''}`} onClick={() => setRegion(region === rg ? null : rg)}>
            {rg}{region === rg && <span className="x">✕</span>}
          </button>
        ))}
      </div>
      {/* 거리·난이도 칩 */}
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 2 }}>
        {DIST_FILTERS.map((f) => (
          <button key={f.key} className={`chip ${dist === f.key ? 'active' : ''}`} onClick={() => setDist(dist === f.key ? null : f.key)}>{f.key}</button>
        ))}
        {LEVEL_FILTERS.map((l) => (
          <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(level === l ? null : l)}>{l}</button>
        ))}
      </div>

      <div className="scr scr-body" style={{ padding: '4px 22px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="infobox">
          <Icon name="info" size={20} stroke={2} style={{ color: 'var(--c-primary)' }} />
          <div>대회가 없어도 오늘 걸을 코스를 안내해요. (한국관광공사 두루누비 · 코리아둘레길)</div>
        </div>
        {!loading && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink-4)' }}>
            코스 <span style={{ color: 'var(--c-primary)' }}>{filtered.length}</span>
          </div>
        )}
        {loading && <div className="empty">코스를 찾는 중…</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div className="e-title">조건에 맞는 코스가 없어요.</div>
            <div>필터를 바꿔보세요.</div>
            <button className="e-link" onClick={clearAll}>필터 초기화</button>
          </div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="race-card">
            <span style={{ flex: 'none', width: 50, height: 50, borderRadius: 14, background: 'var(--cat-nature-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-nature-fg)' }}>
              <Icon name="courses" size={24} stroke={2} />
            </span>
            <div className="body">
              <div className="name" style={{ fontSize: 16 }}>{c.name}</div>
              <div className="place">{c.sigun}{c.minutes ? ` · 약 ${c.minutes}분` : ''}</div>
              <div className="evt-tags"><span className="evt-tag hi">{c.distKm}km</span><span className="evt-tag">{c.level}</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
