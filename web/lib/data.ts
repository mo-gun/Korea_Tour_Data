import type { Marathon, RecoveryRule, EventType, PoiCat } from "./types";

/** 종목별 회복 룰 (제안서 도메인 룰 반영) */
export const RECOVERY: Record<EventType, RecoveryRule> = {
  "5K": {
    walk: "8km 이내", intensity: "거의 정상", noHard: false,
    ddayPM: "완주 후 오후부터 자유 관광 가능", dplus: "일반 관광 동선 (자유)",
  },
  "10K": {
    walk: "8km 이내", intensity: "낮은 피로", noHard: false,
    ddayPM: "완주 후 오후 가벼운 관광·축제", dplus: "일반 관광 동선",
  },
  "하프": {
    walk: "5km 이내", intensity: "중등도 피로", noHard: true,
    ddayPM: "완주 후 온천·휴식 권장", dplus: "온천 + 짧은 산책 (고강도 트레킹 제외)",
  },
  "풀": {
    walk: "3km 이내", intensity: "고강도 회복 필요", noHard: true,
    ddayPM: "완주 후 회복 집중, 도보 최소화", dplus: "스파·온천 중심, 도보 최소",
  },
};

export const CAT_LABEL: Record<PoiCat, string> = {
  food: "맛집", tour: "관광지", wellness: "웰니스",
  course: "산책", festival: "축제", race: "대회",
};

export const CAT_COLOR: Record<PoiCat, string> = {
  food: "#d9622b", tour: "#2b62d9", wellness: "#7c3aed",
  course: "#0f9d63", festival: "#d92b7a", race: "#d92b2b",
};

/** ⚠️ 데모용 더미 데이터. 실서비스에서 크롤링 + KTO OpenAPI 응답으로 교체 */
export const MARATHONS: Marathon[] = [
  {
    id: "seoul", name: "서울 가을 마라톤", region: "서울 송파", regionCode: "서울",
    date: "2026-10-18", month: 10, lat: 37.5159, lng: 127.0731, status: "open",
    events: ["5K", "10K", "하프", "풀"], bib: "잠실종합운동장 픽업", startTime: "08:00",
    src: "마라톤온라인", checked: "2026-06-02",
    pois: [
      { cat: "tour", name: "롯데월드타워 서울스카이", lat: 37.5126, lng: 127.1025, desc: "전망대·도심 관광", themes: ["관광지"] },
      { cat: "tour", name: "석촌호수 둘레길 명소", lat: 37.5097, lng: 127.1006, desc: "호수 산책·벚꽃길", themes: ["자연", "관광지"] },
      { cat: "food", name: "잠실 새마을식당(고탄수)", lat: 37.5135, lng: 127.082, desc: "대회 전 탄수보충식", themes: ["맛집"] },
      { cat: "food", name: "송리단길 로컬 식당가", lat: 37.505, lng: 127.106, desc: "러너 추천 골목상권", themes: ["맛집"] },
      { cat: "wellness", name: "시그니엘 사우나·스파", lat: 37.5125, lng: 127.1024, desc: "완주 후 회복", themes: ["웰니스"] },
      { cat: "festival", name: "한강 잠실 달빛야시장", lat: 37.518, lng: 127.085, desc: "대회 주말 동시개최", themes: [] },
      { cat: "course", name: "석촌호수 둘레길", lat: 37.5097, lng: 127.1006, desc: "평지 호수 코스", dist: 2.5, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "올림픽공원 순환", lat: 37.5202, lng: 127.1216, desc: "공원 트랙", dist: 5, level: "보통", themes: ["자연"] },
    ],
  },
  {
    id: "incheon", name: "인천 송도 마라톤", region: "인천 연수", regionCode: "인천",
    date: "2026-09-27", month: 9, lat: 37.3894, lng: 126.6398, status: "open",
    events: ["5K", "10K", "하프"], bib: "송도컨벤시아 픽업", startTime: "08:30",
    src: "마라톤GO", checked: "2026-06-04",
    pois: [
      { cat: "tour", name: "송도 센트럴파크", lat: 37.3925, lng: 126.639, desc: "수변 도심공원", themes: ["자연", "관광지"] },
      { cat: "tour", name: "인천대교 전망대", lat: 37.376, lng: 126.623, desc: "바다 조망", themes: ["관광지"] },
      { cat: "food", name: "송도 바지락칼국수", lat: 37.388, lng: 126.65, desc: "탄수·나트륨 보충식", themes: ["맛집"] },
      { cat: "food", name: "차이나타운 짜장 골목", lat: 37.475, lng: 126.6175, desc: "인천 대표 먹거리", themes: ["맛집", "역사유적"] },
      { cat: "wellness", name: "송도 스파·찜질방", lat: 37.3905, lng: 126.644, desc: "완주 후 온욕", themes: ["웰니스"] },
      { cat: "festival", name: "송도 맥주축제", lat: 37.393, lng: 126.636, desc: "대회 주말 개최", themes: [] },
      { cat: "course", name: "센트럴파크 수변길", lat: 37.3925, lng: 126.639, desc: "평지 수변", dist: 3, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "송도 해돋이공원", lat: 37.385, lng: 126.66, desc: "해안 산책", dist: 5, level: "보통", themes: ["자연"] },
    ],
  },
  {
    id: "suwon", name: "수원 화성 마라톤", region: "경기 수원", regionCode: "경기",
    date: "2026-10-11", month: 10, lat: 37.281, lng: 127.0153, status: "soon",
    events: ["5K", "10K", "하프"], bib: "수원화성행궁 광장 픽업", startTime: "08:00",
    src: "마라톤온라인", checked: "2026-06-01",
    pois: [
      { cat: "tour", name: "수원화성(세계문화유산)", lat: 37.288, lng: 127.014, desc: "성곽 역사유적", themes: ["역사유적", "관광지"] },
      { cat: "tour", name: "행궁동 벽화마을", lat: 37.282, lng: 127.012, desc: "골목 감성 관광", themes: ["관광지"] },
      { cat: "food", name: "수원 왕갈비탕", lat: 37.279, lng: 127.019, desc: "단백질 회복식", themes: ["맛집"] },
      { cat: "food", name: "통닭거리", lat: 37.284, lng: 127.0175, desc: "수원 명물 거리", themes: ["맛집"] },
      { cat: "wellness", name: "수원 온천 스파", lat: 37.275, lng: 127.025, desc: "완주 후 온천", themes: ["웰니스"] },
      { cat: "festival", name: "수원화성문화제", lat: 37.288, lng: 127.014, desc: "가을 대표 축제", themes: ["역사유적"] },
      { cat: "course", name: "화성 성곽길", lat: 37.288, lng: 127.014, desc: "성곽 따라 걷기", dist: 5.7, level: "보통", themes: ["역사유적"] },
      { cat: "course", name: "수원천 산책로", lat: 37.279, lng: 127.021, desc: "하천 평지", dist: 3, level: "쉬움", themes: ["자연"] },
    ],
  },
  {
    id: "goyang", name: "고양 호수 마라톤", region: "경기 고양", regionCode: "경기",
    date: "2026-09-20", month: 9, lat: 37.6584, lng: 126.7715, status: "open",
    events: ["5K", "10K"], bib: "일산호수공원 주제광장 픽업", startTime: "09:00",
    src: "마라톤GO", checked: "2026-06-03",
    pois: [
      { cat: "tour", name: "일산호수공원", lat: 37.6584, lng: 126.7715, desc: "국내 최대 인공호수", themes: ["자연", "관광지"] },
      { cat: "tour", name: "원마운트 복합단지", lat: 37.666, lng: 126.746, desc: "쇼핑·워터파크", themes: ["관광지"] },
      { cat: "food", name: "정발산 칼국수", lat: 37.662, lng: 126.774, desc: "탄수 보충식", themes: ["맛집"] },
      { cat: "food", name: "라페스타 먹자골목", lat: 37.6585, lng: 126.77, desc: "다양한 맛집", themes: ["맛집"] },
      { cat: "wellness", name: "원마운트 스파", lat: 37.666, lng: 126.746, desc: "회복 온욕", themes: ["웰니스"] },
      { cat: "festival", name: "고양 가을 호수축제", lat: 37.6584, lng: 126.7715, desc: "주말 개최", themes: [] },
      { cat: "course", name: "호수공원 둘레길", lat: 37.6584, lng: 126.7715, desc: "평지 순환", dist: 4.7, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "정발산 자락길", lat: 37.665, lng: 126.778, desc: "완만한 숲길", dist: 3, level: "보통", themes: ["자연"] },
    ],
  },
  {
    id: "busan", name: "부산 바다 마라톤", region: "부산 해운대", regionCode: "부산",
    date: "2026-11-08", month: 11, lat: 35.1587, lng: 129.1604, status: "soon",
    events: ["10K", "하프", "풀"], bib: "BEXCO 2홀 픽업(마감 17:00)", startTime: "08:00",
    src: "주최측 검증", checked: "2026-06-05",
    pois: [
      { cat: "tour", name: "해운대 해수욕장", lat: 35.1587, lng: 129.1604, desc: "대표 해변 관광", themes: ["자연", "관광지"] },
      { cat: "tour", name: "동백섬 누리마루", lat: 35.153, lng: 129.151, desc: "해안 산책·전망", themes: ["자연", "관광지"] },
      { cat: "food", name: "해운대 돼지국밥", lat: 35.163, lng: 129.162, desc: "부산 카보로딩 명물", themes: ["맛집"] },
      { cat: "food", name: "밀면 골목", lat: 35.16, lng: 129.159, desc: "러너 추천 로컬식", themes: ["맛집"] },
      { cat: "wellness", name: "스파랜드 센텀", lat: 35.169, lng: 129.13, desc: "냉온교차욕 회복", themes: ["웰니스"] },
      { cat: "festival", name: "부산불꽃축제", lat: 35.153, lng: 129.118, desc: "가을 대표 축제", themes: [] },
      { cat: "course", name: "동백섬 둘레길", lat: 35.153, lng: 129.151, desc: "평지 해안", dist: 3, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "달맞이길", lat: 35.156, lng: 129.181, desc: "언덕 해안 코스", dist: 8, level: "보통", themes: ["자연"] },
      { cat: "course", name: "이기대 해안산책로", lat: 35.133, lng: 129.123, desc: "기암 해안 트레일", dist: 10, level: "어려움", themes: ["자연"] },
    ],
  },
  {
    id: "daegu", name: "대구 컬러풀 마라톤", region: "대구 수성", regionCode: "대구",
    date: "2026-10-04", month: 10, lat: 35.8268, lng: 128.6189, status: "closed",
    events: ["5K", "10K", "하프"], bib: "수성못 일원 픽업", startTime: "08:30",
    src: "마라톤온라인", checked: "2026-05-28",
    pois: [
      { cat: "tour", name: "수성못", lat: 35.8268, lng: 128.6189, desc: "야경 명소 호수", themes: ["자연", "관광지"] },
      { cat: "tour", name: "김광석 다시그리기길", lat: 35.865, lng: 128.599, desc: "골목 문화 관광", themes: ["관광지", "역사유적"] },
      { cat: "food", name: "대구 막창골목", lat: 35.859, lng: 128.595, desc: "단백질 회복식", themes: ["맛집"] },
      { cat: "food", name: "따로국밥 노포", lat: 35.87, lng: 128.594, desc: "대구 향토음식", themes: ["맛집"] },
      { cat: "wellness", name: "수성 스파밸리", lat: 35.82, lng: 128.65, desc: "온천 회복", themes: ["웰니스"] },
      { cat: "festival", name: "수성못 페스티벌", lat: 35.8268, lng: 128.6189, desc: "주말 개최", themes: [] },
      { cat: "course", name: "수성못 둘레길", lat: 35.8268, lng: 128.6189, desc: "평지 호수", dist: 2, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "신천 둔치길", lat: 35.855, lng: 128.601, desc: "하천 평지", dist: 6, level: "보통", themes: ["자연"] },
    ],
  },
  {
    id: "daejeon", name: "대전 한밭 마라톤", region: "대전 서구", regionCode: "대전",
    date: "2026-09-13", month: 9, lat: 36.369, lng: 127.3884, status: "open",
    events: ["10K", "하프", "풀"], bib: "한밭수목원 광장 픽업", startTime: "08:00",
    src: "마라톤GO", checked: "2026-06-04",
    pois: [
      { cat: "tour", name: "한밭수목원", lat: 36.369, lng: 127.3884, desc: "도심 속 수목원", themes: ["자연", "관광지"] },
      { cat: "tour", name: "엑스포과학공원", lat: 36.374, lng: 127.388, desc: "과학 관광지", themes: ["관광지"] },
      { cat: "food", name: "대전 칼국수", lat: 36.35, lng: 127.385, desc: "탄수 보충식", themes: ["맛집"] },
      { cat: "food", name: "성심당 본점", lat: 36.328, lng: 127.427, desc: "대전 명물 베이커리", themes: ["맛집"] },
      { cat: "wellness", name: "유성온천 스파", lat: 36.354, lng: 127.341, desc: "완주 후 온천", themes: ["웰니스"] },
      { cat: "festival", name: "대전 사이언스 페스티벌", lat: 36.374, lng: 127.388, desc: "가을 개최", themes: [] },
      { cat: "course", name: "갑천 누리길", lat: 36.36, lng: 127.378, desc: "하천 평지", dist: 5, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "한밭수목원 둘레", lat: 36.369, lng: 127.3884, desc: "수목원 산책", dist: 3, level: "쉬움", themes: ["자연"] },
    ],
  },
  {
    id: "gwangju", name: "광주 빛고을 마라톤", region: "광주 북구", regionCode: "광주",
    date: "2026-10-25", month: 10, lat: 35.1798, lng: 126.91, status: "soon",
    events: ["5K", "10K", "하프"], bib: "광주월드컵경기장 픽업", startTime: "08:30",
    src: "마라톤온라인", checked: "2026-06-02",
    pois: [
      { cat: "tour", name: "국립아시아문화전당", lat: 35.1468, lng: 126.92, desc: "복합 문화공간", themes: ["관광지", "역사유적"] },
      { cat: "tour", name: "양림동 근대역사마을", lat: 35.138, lng: 126.913, desc: "근대 골목 관광", themes: ["역사유적", "관광지"] },
      { cat: "food", name: "광주 육전", lat: 35.15, lng: 126.918, desc: "단백질 회복식", themes: ["맛집"] },
      { cat: "food", name: "상추튀김 골목", lat: 35.149, lng: 126.916, desc: "광주 별미", themes: ["맛집"] },
      { cat: "wellness", name: "광주 스파·찜질방", lat: 35.17, lng: 126.905, desc: "완주 후 온욕", themes: ["웰니스"] },
      { cat: "festival", name: "추억의 충장축제", lat: 35.149, lng: 126.915, desc: "가을 대표 축제", themes: ["역사유적"] },
      { cat: "course", name: "광주천 산책로", lat: 35.155, lng: 126.91, desc: "하천 평지", dist: 5, level: "쉬움", themes: ["자연"] },
      { cat: "course", name: "무등산 자락길", lat: 35.134, lng: 126.988, desc: "완만한 숲길", dist: 8, level: "보통", themes: ["자연"] },
    ],
  },
];
