// TourAPI(한국관광공사) 어댑터 — 인근 축제 + 두루누비 걷기 코스.
// 브라우저는 키 없이 /api/kto 프록시로 호출(vite.config.js 가 serviceKey 주입).
// 프록시가 없는 환경(빌드/프리뷰)에서는 조용히 빈 결과를 반환해 UI 폴백을 유지한다.
import { addDays } from './dates.js'

const KTO = '/api/kto'

// data.go.kr 응답의 body.items.item 을 항상 배열로 정규화(없으면 []).
function itemsOf(json) {
  const item = json?.response?.body?.items?.item
  if (!item) return []
  return Array.isArray(item) ? item : [item]
}

async function ktoGet(service, op, params) {
  const q = new URLSearchParams({
    MobileOS: 'ETC', MobileApp: 'RunTrip', _type: 'json',
    numOfRows: '100', pageNo: '1', ...params,
  })
  const res = await fetch(`${KTO}/${service}/${op}?${q.toString()}`)
  if (!res.ok) throw new Error(`kto ${op} ${res.status}`)
  const json = await res.json()
  const code = json?.response?.header?.resultCode
  if (code && code !== '0000') throw new Error(`kto ${op} result ${code}`)
  return itemsOf(json)
}

// 하버사인 거리(km).
function distanceKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// 'YYYY-MM-DD' → 'YYYYMMDD'.
const compact = (s) => String(s || '').replace(/-/g, '')
// 'YYYYMMDD' → 'MM.DD'.
const dotMd = (s) => (s && s.length === 8 ? `${s.slice(4, 6)}.${s.slice(6, 8)}` : '')
// 두 기간 겹침 여부(YYYYMMDD 문자열 비교).
const overlaps = (aS, aE, bS, bE) => aS <= bE && bS <= aE

// ── 인근 축제 ── 대회일 전후 windowDays 안에 열리고, 대회장 반경 radiusKm 이내인 축제.
export async function searchFestivalsNear({ lat, lng, date, windowDays = 14, radiusKm = 40, limit = 6 }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !date) return []
  const items = await ktoGet('KorService2', 'searchFestival2', {
    arrange: 'A',
    eventStartDate: compact(addDays(date, -windowDays)),
    eventEndDate: compact(addDays(date, windowDays)),
  })
  const winS = compact(addDays(date, -windowDays))
  const winE = compact(addDays(date, windowDays))
  return items
    .map((f) => {
      const flat = Number(f.mapy), flng = Number(f.mapx)
      const dist = Number.isFinite(flat) && Number.isFinite(flng)
        ? distanceKm({ lat, lng }, { lat: flat, lng: flng }) : Infinity
      return {
        title: f.title,
        start: f.eventstartdate, end: f.eventenddate,
        dateLabel: `${dotMd(f.eventstartdate)} ~ ${dotMd(f.eventenddate)}`,
        addr: f.addr1 || '',
        image: f.firstimage || f.firstimage2 || '',
        contentId: f.contentid,
        distKm: dist,
      }
    })
    .filter((f) => overlaps(f.start, f.end, winS, winE) && f.distKm <= radiusKm)
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, limit)
}

// ── 두루누비 걷기 코스 ── 난이도 코드 → 라벨.
const LEVEL = { 1: '쉬움', 2: '보통', 3: '어려움' }

// 시·도 표기 매칭용 별칭(크롤링 region 은 '경북', 두루누비 sigun 도 '경남 밀양시' 형태 단축형).
const SIDO_ALIAS = {
  서울: ['서울'], 부산: ['부산'], 대구: ['대구'], 인천: ['인천'], 광주: ['광주'],
  대전: ['대전'], 울산: ['울산'], 세종: ['세종'], 경기: ['경기'], 강원: ['강원'],
  충북: ['충북', '충청북'], 충남: ['충남', '충청남'], 전북: ['전북', '전라북'],
  전남: ['전남', '전라남'], 경북: ['경북', '경상북'], 경남: ['경남', '경상남'], 제주: ['제주'],
}

// sigun('경남 밀양시') → 표준 시·도 라벨('경남'). 별칭(경상남→경남)도 흡수.
function sidoOf(sigun) {
  const head = String(sigun || '').trim().split(/\s+/)[0] || ''
  for (const [key, aliases] of Object.entries(SIDO_ALIAS)) {
    if (aliases.some((a) => head.startsWith(a))) return key
  }
  return head
}

// 걷기 코스 조회(두루누비 courseList, DNWW). 전체(261코스) 받아 정규화 후 거리 오름차순.
//  region: 시·도('경북')로 필터 / minKm·maxKm: 거리 범위 / limit: 최대 개수.
export async function fetchWalkingCourses({ region, minKm = 0, maxKm = 100, limit = 300 } = {}) {
  const items = await ktoGet('Durunubi', 'courseList', { brdDiv: 'DNWW', numOfRows: '300' })
  const aliases = region ? (SIDO_ALIAS[region] || [region]) : null
  return items
    .map((c) => ({
      id: c.crsIdx,
      name: c.crsKorNm,
      distKm: Number(c.crsDstnc),
      minutes: Number(c.crsTotlRqrmHour) || null,
      level: LEVEL[Number(c.crsLevel)] || '보통',
      cycle: c.crsCycle || '',
      sigun: (c.sigun || '').trim(),
      sido: sidoOf(c.sigun),
      summary: c.crsSummary || c.crsContents || '',
      gpx: c.gpxpath || '',
    }))
    .filter((c) => c.name && Number.isFinite(c.distKm) && c.distKm >= minKm && c.distKm <= maxKm)
    .filter((c) => (aliases ? aliases.some((a) => c.sigun.includes(a)) : true))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, limit)
}
