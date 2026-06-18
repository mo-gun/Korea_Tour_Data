import { useApp } from '../store/appState.jsx'
import Icon from '../components/Icon.jsx'

// 러닝코스(M4) — 비대회 시즌 단독 진입. MVP 스텁(두루누비 연동 예정).
const SAMPLE = [
  { name: '보문호수 둘레길', region: '경북 경주', dist: '3.2km', level: '쉬움' },
  { name: '한강 잠수교 코스', region: '서울', dist: '5.0km', level: '보통' },
  { name: '송정 해변 러닝', region: '부산', dist: '4.4km', level: '쉬움' },
]

export default function CoursesScreen() {
  const { dispatch } = useApp()
  return (
    <>
      <div className="appbar" style={{ padding: '8px 22px 14px' }}>
        <span className="title" style={{ fontSize: 20, fontWeight: 800 }}>러닝·산책 코스</span>
      </div>
      <div className="chip-row scr" style={{ flex: 'none', paddingTop: 4 }}>
        {['3~5km', '5~10km', '쉬움', '보통'].map((c) => <button key={c} className="chip">{c}</button>)}
      </div>
      <div className="scr scr-body" style={{ padding: '4px 22px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="infobox">
          <Icon name="info" size={20} stroke={2} style={{ color: 'var(--c-primary)' }} />
          <div>대회가 없어도 오늘 뛸 코스를 안내해요. (두루누비 코스 연동 예정)</div>
        </div>
        {SAMPLE.map((c) => (
          <div key={c.name} className="race-card">
            <span style={{ flex: 'none', width: 50, height: 50, borderRadius: 14, background: 'var(--cat-nature-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cat-nature-fg)' }}>
              <Icon name="courses" size={24} stroke={2} />
            </span>
            <div className="body">
              <div className="name" style={{ fontSize: 16 }}>{c.name}</div>
              <div className="place">{c.region}</div>
              <div className="evt-tags"><span className="evt-tag hi">{c.dist}</span><span className="evt-tag">{c.level}</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
