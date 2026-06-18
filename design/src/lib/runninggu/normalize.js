import { stdEvents } from './events.js'

// 원천 데이터(snake_case JSON) → 앱 내부 정규화 Race(camelCase).
// 이미 camelCase면 그대로 통과시키되 eventTypes는 항상 표준화.
export function normalizeRace(raw) {
  if (!raw) return null
  const pick = (a, b) => (raw[a] !== undefined ? raw[a] : raw[b])
  return {
    id: pick('id', 'id'),
    name: pick('name', 'name'),
    region: pick('region', 'region'),
    venue: pick('venue', 'venue'),
    date: pick('date', 'date'),
    startTime: pick('startTime', 'start_time'),
    eventTypes: stdEvents(pick('eventTypes', 'event_types') || []),
    regStatus: pick('regStatus', 'reg_status'),
    regStart: pick('regStart', 'reg_start'),
    regEnd: pick('regEnd', 'reg_end'),
    organizer: pick('organizer', 'organizer'),
    source: pick('source', 'source'),
    checked: pick('checked', 'checked'),
    officialUrl: pick('officialUrl', 'official_url'),
    detailUrl: pick('detailUrl', 'detail_url'),
    imageUrl: pick('imageUrl', 'image_url'),
    lat: Number(pick('lat', 'lat')),
    lng: Number(pick('lng', 'lng')),
    category: pick('category', 'category'),
  }
}

export function normalizeRaces(list) {
  return (list || []).map(normalizeRace).filter(Boolean)
}
