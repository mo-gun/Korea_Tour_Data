import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import MapView from '../map/MapView.jsx'
import { browseCourses, buildRouteNear, courseRegions, geocodePlace } from '../lib/runninggu/index.js'

// 러닝코스(M4) — 두루누비 걷기 코스(코리아둘레길).
//  · 내 주변: 사용자 위치에서 가까운 코스를 원하는 길이로 잘라 추천 + 지도 표시
//  · 지역별: 시·도/거리/난이도로 전체 코스 브라우징
const LENGTHS = [3, 5, 10, 15]
// 코스가 실제로 있는 해안·수도권 프리셋(GPS 대체/데모용).
const PRESETS = [
  { label: '부산 해운대', lat: 35.1587, lng: 129.1604 },
  { label: '여수', lat: 34.7604, lng: 127.6622 },
  { label: '강릉', lat: 37.7519, lng: 128.8761 },
  { label: '인천 강화', lat: 37.7466, lng: 126.4880 },
  { label: '서울시청', lat: 37.5665, lng: 126.9780 },
]
const DIST_FILTERS = [
  { key: '~10km', min: 0, max: 10 },
  { key: '10~15km', min: 10, max: 15 },
  { key: '15km+', min: 15, max: 999 },
]
const LEVELS = ['쉬움', '보통', '어려움']

export default function CoursesScreen() {
  const [mode, setMode] = useState('near')
  return (
    <>
      <div className="appbar" style={{ padding: '8px 22px 12px' }}>
        <span className="title" style={{ fontSize: 20, fontWeight: 800 }}>러닝·산책 코스</span>
      </div>
      <div style={{ padding: '0 22px 12px', flex: 'none' }}>
        <div className="toggle" role="tablist">
          <button className={`opt ${mode === 'near' ? 'active' : ''}`} onClick={() => setMode('near')}>내 주변</button>
          <button className={`opt ${mode === 'browse' ? 'active' : ''}`} onClick={() => setMode('browse')}>지역별</button>
        </div>
      </div>
      {mode === 'near' ? <NearMode /> : <BrowseMode />}
    </>
  )
}

// ── 내 주변: 지도 기반 코스 빌더 (출발지 + 목표거리 → 두루누비 왕복 경로) ──
function NearMode() {
  const [loc, setLoc] = useState(null)         // { lat, lng, label }
  const [targetKm, setTargetKm] = useState(5)
  const [locating, setLocating] = useState(true)
  const [selId, setSelId] = useState(null)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState(null)       // 검색 결과 후보

  const useGps = () => {
    if (!navigator.geolocation) { setLocating(false); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, label: '현재 위치' }); setLocating(false); setSelId(null); setHits(null) },
      () => setLocating(false), { timeout: 6000 },
    )
  }
  useEffect(() => { useGps() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runSearch = async () => {
    if (!q.trim()) return
    const res = await geocodePlace(q)
    setHits(res)
    if (res[0]) { setLoc({ lat: res[0].lat, lng: res[0].lng, label: res[0].name }); setSelId(null) }
  }

  const routes = useMemo(
    () => (loc ? buildRouteNear({ lat: loc.lat, lng: loc.lng, targetKm, radiusKm: 8, limit: 12 }) : []),
    [loc, targetKm],
  )
  const selected = routes.find((r) => r.id === selId) || routes[0] || null

  return (
    <>
      {/* 출발지 검색 */}
      <div style={{ padding: '0 22px 8px', flex: 'none' }}>
        <label className="sheet-search" style={{ margin: 0 }}>
          <Icon name="search" size={18} stroke={2} style={{ color: 'var(--c-ink-5)' }} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="출발지 검색 (예: 경주역, 해운대)"
            style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: 14, color: 'var(--c-ink)', fontFamily: 'inherit' }}
          />
          <button className="chip outline-ink" style={{ padding: '4px 10px' }} onClick={runSearch}>검색</button>
        </label>
      </div>
      {/* 출발지 칩: 내 위치 + 프리셋 */}
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 0 }}>
        <button className="chip outline-ink" onClick={useGps}><Icon name="route" size={14} stroke={2.2} />내 위치</button>
        {PRESETS.map((p) => (
          <button key={p.label} className={`chip ${loc?.label === p.label ? 'active' : ''}`}
            onClick={() => { setLoc({ ...p }); setSelId(null); setHits(null) }}>{p.label}</button>
        ))}
      </div>
      {/* 목표 거리 */}
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 2 }}>
        <span style={{ fontSize: 12, color: 'var(--c-ink-5)', alignSelf: 'center', paddingRight: 4 }}>몇 km 뛸까요</span>
        {LENGTHS.map((L) => (
          <button key={L} className={`chip ${targetKm === L ? 'active' : ''}`} onClick={() => setTargetKm(L)}>{L}km</button>
        ))}
      </div>

      <div className="scr scr-body" style={{ padding: '4px 22px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 지도 우선 */}
        <MapView polyline={selected ? selected.routePoints : null} pins={[]} height={230} />

        {!loc && (
          <div className="empty">
            <div className="e-title">{locating ? '위치를 확인하는 중…' : '출발지를 정해주세요.'}</div>
            <div>내 위치 허용 · 출발지 검색 · 프리셋 중 하나를 고르면 두루누비 왕복 코스를 짜드려요.</div>
          </div>
        )}

        {/* 선택된 코스 요약 */}
        {selected && (
          <div className="race-card featured" style={{ alignItems: 'flex-start' }}>
            <span style={{ flex: 'none', width: 50, height: 50, borderRadius: 14, background: 'var(--cat-nature-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-nature-fg)' }}>
              <Icon name="courses" size={24} stroke={2} />
            </span>
            <div className="body">
              <div className="name" style={{ fontSize: 16 }}>{selected.parentName} 왕복</div>
              <div className="place">{selected.sigun} · 출발지→진입점 {fmtM(selected.accessM)}</div>
              <div className="evt-tags">
                <span className="evt-tag hi">{selected.routeKm}km</span>
                <span className="evt-tag">약 {selected.minutes}분</span>
                <span className="evt-tag">{selected.levelLabel}</span>
              </div>
              {selected.shortfall && (
                <div style={{ fontSize: 12, color: 'var(--c-ink-5)', marginTop: 4 }}>이 코스가 짧아 목표({targetKm}km)보다 짧게 짜였어요.</div>
              )}
            </div>
          </div>
        )}

        {/* 대체 코스 */}
        {loc && routes.length > 1 && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink-4)' }}>다른 코스 {routes.length - 1}개</div>
        )}
        {loc && routes.length === 0 && (
          <div className="empty">
            <div className="e-title">이 근처엔 두루누비 코스가 없어요.</div>
            <div>두루누비는 해안·둘레길 위주라 도시엔 적어요. 부산·여수·강릉 등을 눌러보세요.</div>
          </div>
        )}
        {routes.filter((r) => r.id !== selected?.id).map((c) => (
          <button key={c.id} className="race-card" onClick={() => setSelId(c.id)} style={{ textAlign: 'left', width: '100%' }}>
            <span style={{ flex: 'none', width: 50, height: 50, borderRadius: 14, background: 'var(--cat-nature-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-nature-fg)' }}>
              <Icon name="courses" size={24} stroke={2} />
            </span>
            <div className="body">
              <div className="name" style={{ fontSize: 16 }}>{c.parentName} 왕복</div>
              <div className="place">{c.sigun} · 진입점까지 {fmtM(c.accessM)}</div>
              <div className="evt-tags">
                <span className="evt-tag hi">{c.routeKm}km</span>
                <span className="evt-tag">약 {c.minutes}분</span>
                <span className="evt-tag">{c.levelLabel}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

const fmtM = (m) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`)

// ── 지역별: 브라우징 ──
function BrowseMode() {
  const [region, setRegion] = useState(null)
  const [dist, setDist] = useState(null)
  const [level, setLevel] = useState(null)
  const regions = useMemo(() => courseRegions(), [])

  const filtered = useMemo(() => {
    const df = DIST_FILTERS.find((f) => f.key === dist)
    return browseCourses({ region, minKm: df?.min ?? 0, maxKm: df?.max ?? 999, level })
  }, [region, dist, level])

  const clearAll = () => { setRegion(null); setDist(null); setLevel(null) }

  return (
    <>
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 2 }}>
        {regions.map((rg) => (
          <button key={rg} className={`chip ${region === rg ? 'active' : ''}`} onClick={() => setRegion(region === rg ? null : rg)}>
            {rg}{region === rg && <span className="x">✕</span>}
          </button>
        ))}
      </div>
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 2 }}>
        {DIST_FILTERS.map((f) => (
          <button key={f.key} className={`chip ${dist === f.key ? 'active' : ''}`} onClick={() => setDist(dist === f.key ? null : f.key)}>{f.key}</button>
        ))}
        {LEVELS.map((l) => (
          <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(level === l ? null : l)}>{l}</button>
        ))}
      </div>
      <div className="scr scr-body" style={{ padding: '4px 22px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="infobox">
          <Icon name="info" size={20} stroke={2} style={{ color: 'var(--c-primary)' }} />
          <div>대회가 없어도 오늘 걸을 코스를 안내해요. (한국관광공사 두루누비 · 코리아둘레길)</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink-4)' }}>
          코스 <span style={{ color: 'var(--c-primary)' }}>{filtered.length}</span>
        </div>
        {filtered.length === 0 && (
          <div className="empty">
            <div className="e-title">조건에 맞는 코스가 없어요.</div>
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
              <div className="evt-tags"><span className="evt-tag hi">{c.distKm}km</span><span className="evt-tag">{c.levelLabel}</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
