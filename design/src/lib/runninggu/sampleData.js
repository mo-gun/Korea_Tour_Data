// 샘플/사전수집 데이터. 원천은 snake_case 라 normalize 레이어를 거친다.

// ── 마라톤 대회 (snake_case 원천 형태) ──
export const RAW_RACES = [
  {
    id: 'gyeongju-intl-2026-10-19', name: '경주국제마라톤',
    region: '경북', venue: '경주실내체육관',
    date: '2026-10-19', start_time: '07:00', event_types: ['풀', '하프', '10k', '5km'],
    reg_status: '접수중', reg_start: '2026-08-20', reg_end: '2026-10-05',
    organizer: '경주시·경북육상연맹', source: '마라톤온라인', checked: '2026-06-15',
    official_url: 'http://www.gyeongjumarathon.com', lat: 35.8562, lng: 129.2247, category: '로드',
  },
  {
    id: 'pohang-beach-2026-10-12', name: '포항해변마라톤',
    region: '경북', venue: '영일대해수욕장',
    date: '2026-10-12', start_time: '08:00', event_types: ['10km', '5km'],
    reg_status: '접수중', reg_start: '2026-08-01', reg_end: '2026-10-01',
    organizer: '포항시', source: '마라톤GO', checked: '2026-06-14',
    official_url: 'http://www.pohangmarathon.com', lat: 36.0560, lng: 129.3770, category: '로드',
  },
  {
    id: 'andong-mask-2026-10-26', name: '안동탈춤마라톤',
    region: '경북', venue: '탈춤공원',
    date: '2026-10-26', start_time: '09:00', event_types: ['full', 'half'],
    reg_status: '마감', reg_start: '2026-07-10', reg_end: '2026-09-30',
    organizer: '안동시', source: '마라톤온라인', checked: '2026-06-10',
    official_url: 'http://www.andongmarathon.com', lat: 36.5560, lng: 128.7290, category: '로드',
  },
  {
    id: '1st-modurun-2026-06-13', name: '제1회 모두런',
    region: '세종', venue: '세종중앙공원, 국립세종수목원',
    date: '2026-06-13', start_time: '08:00', event_types: ['5km'],
    reg_status: '마감', reg_start: '2026-05-14', reg_end: '2026-05-20',
    organizer: '세종시장애인단체연합회', source: '마라톤GO', checked: '2026-06-14',
    official_url: 'http://www.sfinder.co.kr', lat: 36.49116, lng: 127.27140, category: '로드',
  },
  {
    id: 'chuncheon-2026-10-25', name: '춘천조선일보마라톤',
    region: '강원', venue: '춘천종합운동장',
    date: '2026-10-25', start_time: '08:00', event_types: ['full', 'half'],
    reg_status: '접수중', reg_start: '2026-08-01', reg_end: '2026-10-10',
    organizer: '조선일보·춘천시', source: '마라톤온라인', checked: '2026-06-15',
    official_url: 'http://marathon.chosun.com', lat: 37.8720, lng: 127.7360, category: '로드',
  },
  {
    id: 'seoul-intl-2026-11-02', name: '서울국제마라톤',
    region: '서울', venue: '광화문광장',
    date: '2026-11-02', start_time: '08:00', event_types: ['full', '10km'],
    reg_status: '접수중', reg_start: '2026-09-01', reg_end: '2026-10-20',
    organizer: '서울시·대한육상연맹', source: '마라톤온라인', checked: '2026-06-13',
    official_url: 'http://www.seoul-marathon.com', lat: 37.5720, lng: 126.9769, category: '로드',
  },
  {
    id: 'jeju-tour-2026-11-09', name: '제주국제관광마라톤',
    region: '제주', venue: '제주종합경기장',
    date: '2026-11-09', start_time: '08:30', event_types: ['half', '10km'],
    reg_status: '접수중', reg_start: '2026-09-10', reg_end: '2026-10-30',
    organizer: '제주관광공사', source: '마라톤GO', checked: '2026-06-12',
    official_url: 'http://www.jejumarathon.com', lat: 33.5005, lng: 126.5290, category: '로드',
  },
]

// ── 사전수집 POI (raceId별, 카카오 실시간 검색 실패 시 폴백) ──
// 카테고리 키: food|cafe|tour|wellness|nature|history|lodging
const P = (name, lat, lng, desc, addr) => ({ name, lat, lng, desc, addr, url: '' })

export const PRESAMPLED = {
  'gyeongju-intl-2026-10-19': {
    food: [
      P('황리단길', 35.8330, 129.2100, '경주 대표 먹거리 골목', '경북 경주시 포석로'),
      P('황남빵 본점', 35.8419, 129.2114, '경주 명물 단팥빵', '경북 경주시 태종로'),
      P('함양집', 35.8404, 129.2125, '소머리국밥 노포', '경북 경주시 중앙로'),
      P('교리김밥', 35.8312, 129.2150, '경주식 계란 김밥', '경북 경주시 첨성로'),
      P('숙영식당', 35.8336, 129.2098, '쌈밥 정식', '경북 경주시 첨성로'),
    ],
    cafe: [
      P('어니언 경주', 35.8362, 129.2089, '한옥 베이커리 카페', '경북 경주시 첨성로'),
      P('슬로시티 카페', 35.8345, 129.2123, '월정교 뷰 카페', '경북 경주시 교촌안길'),
      P('커피플레이스 보문', 35.8492, 129.2840, '보문호수 뷰', '경북 경주시 보문로'),
    ],
    tour: [
      P('동궁과 월지', 35.8348, 129.2266, '신라 별궁 야경 명소', '경북 경주시 원화로'),
      P('첨성대', 35.8347, 129.2191, '동양 최고(最古) 천문대', '경북 경주시 인왕동'),
      P('대릉원 돌담길', 35.8389, 129.2107, '천마총 고분군', '경북 경주시 황남동'),
      P('월정교', 35.8312, 129.2168, '복원된 통일신라 교량', '경북 경주시 교동'),
    ],
    wellness: [
      P('보문 온천 스파', 35.8488, 129.2853, '대형 온천·찜질 시설', '경북 경주시 보문로'),
      P('블루원 스파', 35.8525, 129.2901, '리조트 스파', '경북 경주시 보문로'),
    ],
    nature: [
      P('보문호수 둘레길', 35.8497, 129.2830, '3.2km · 쉬움 · 호반 산책', '경북 경주시 보문로'),
      P('황성공원 산책로', 35.8520, 129.2120, '도심 숲 산책', '경북 경주시 알천북로'),
      P('첨성대 일원 산책', 35.8350, 129.2200, '고분·유적 평지 산책', '경북 경주시 인왕동'),
    ],
    history: [
      P('국립경주박물관', 35.8297, 129.2275, '신라 유물 보고', '경북 경주시 일정로'),
      P('불국사', 35.7901, 129.3320, '유네스코 세계유산', '경북 경주시 불국로'),
      P('석굴암', 35.7950, 129.3490, '통일신라 석굴 사원', '경북 경주시 진현동'),
    ],
    lodging: [
      P('힐튼 경주', 35.8470, 129.2820, '보문단지 호텔', '경북 경주시 보문로'),
      P('라한셀렉트 경주', 35.8512, 129.2885, '보문호수 리조트', '경북 경주시 보문로'),
      P('경주 한옥 게스트하우스', 35.8358, 129.2110, '황리단길 도보권', '경북 경주시 포석로'),
    ],
  },
}

// ── 합성 샘플(최종 폴백): center 주변에 카테고리별 가짜 POI 생성 ──
const SYNTH_NAMES = {
  food: ['로컬 맛집', '향토 식당', '제철 밥상', '노포 국밥', '시장 먹거리', '한정식집', '분식 골목', '해물 식당'],
  cafe: ['로스터리 카페', '뷰 카페', '한옥 카페', '베이커리 카페', '디저트 카페', '브런치 카페'],
  tour: ['전망대', '랜드마크 광장', '명소 거리', '관광 정원', '포토 스폿', '야경 명소', '테마 거리', '전통 마을'],
  wellness: ['온천 스파', '찜질방', '사우나', '힐링 스파', '족욕 카페'],
  nature: ['둘레길', '호수 공원', '수목원', '강변 산책로', '숲길', '해안 산책로'],
  history: ['향토 박물관', '유적지', '문화재 거리', '고택', '서원'],
  lodging: ['시내 호텔', '리조트', '게스트하우스', '비즈니스 호텔', '펜션'],
}

export function synthPOIs(catKey, center, count = 8) {
  const names = SYNTH_NAMES[catKey] || SYNTH_NAMES.tour
  const out = []
  for (let i = 0; i < count; i++) {
    // 인덱스 기반 결정적 지터 (±0.018도 ≈ ±2km)
    const a = (i * 2.39996) // 황금각
    const r = 0.004 + (i % 5) * 0.003
    out.push({
      name: `${names[i % names.length]} ${i + 1}`,
      lat: center.lat + Math.cos(a) * r,
      lng: center.lng + Math.sin(a) * r,
      desc: '추천 장소(샘플)',
      addr: '',
      url: '',
    })
  }
  return out
}
