// 런닝구 도메인 타입
// ※ 실서비스에서 마라톤 일정은 마라톤온라인/마라톤GO 크롤링,
//   관광/산책/웰니스 POI는 한국관광공사 OpenAPI(국문관광·두루누비·웰니스)로 채워진다.

export type EventType = "5K" | "10K" | "하프" | "풀";
export type StayType = "당일치기" | "1박2일" | "2박3일";
export type ThemeType = "관광지" | "맛집" | "웰니스" | "자연" | "역사유적";
export type PoiCat = "food" | "tour" | "wellness" | "course" | "festival" | "race";
export type MarathonStatus = "open" | "soon" | "closed";

export interface Poi {
  cat: PoiCat;
  name: string;
  lat: number;
  lng: number;
  desc: string;
  themes?: ThemeType[];
  /** course 전용 */
  dist?: number;
  level?: "쉬움" | "보통" | "어려움";
}

export interface Marathon {
  id: string;
  name: string;
  region: string;
  regionCode: string;
  date: string; // YYYY-MM-DD
  month: number;
  lat: number;
  lng: number;
  status: MarathonStatus;
  events: EventType[];
  bib: string;
  startTime: string;
  src: string; // 데이터 출처
  checked: string; // 최근 확인일
  pois: Poi[];
}

export interface RecoveryRule {
  walk: string;
  intensity: string;
  noHard: boolean;
  ddayPM: string;
  dplus: string;
}

export interface ItineraryBlock {
  time: string;
  title: string;
  detail: string;
  cat: PoiCat | null;
  lat: number | null;
  lng: number | null;
}

export interface ItineraryDay {
  label: string;
  cls: "d1" | "dday" | "dplus";
  note: string;
  blocks: ItineraryBlock[];
}

export interface RecommendInput {
  event: EventType;
  stay: StayType;
  theme: ThemeType;
}
