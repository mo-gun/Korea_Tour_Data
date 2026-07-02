// TourAPI(한국관광공사) 어댑터 — 인근 축제 + 두루누비 걷기 코스.
// 브라우저는 키 없이 /api/kto 프록시로 호출(vite.config.js 가 serviceKey 주입).
// 프록시가 없는 환경(빌드/프리뷰)에서는 조용히 빈 결과를 반환해 UI 폴백을 유지한다.
import { addDays } from './dates.js'

const KTO = '/api/kto'
const KAKAO = '/api/kakao'

// 장소/주소 검색 → 좌표. 카카오 로컬 키워드 검색(프록시가 REST 키 주입). 실패 시 [].
export async function geocodePlace(query, count = 5) {
  if (!query || !query.trim()) return []
  try {
    const res = await fetch(`${KAKAO}/v2/local/search/keyword.json?query=${encodeURIComponent(query.trim())}&size=${count}`)
    if (!res.ok) return []
    const json = await res.json()
    return (json.documents || []).map((d) => ({
      name: d.place_name,
      addr: d.road_address_name || d.address_name || '',
      lat: Number(d.y),
      lng: Number(d.x),
    }))
  } catch {
    return []
  }
}

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

// 두루누비 걷기 코스는 GPX 좌표까지 필요해 사전 파싱본(courses.js)을 사용한다.
//  (라이브 courseList 어댑터는 courses.js/durunubi_courses.json 로 대체됨)
