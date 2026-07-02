# 런닝구(區) — 최종 서비스 명세서

> **기준일 2026-07-02** · 이 문서가 프로젝트의 **단일 기준 명세(SSOT)** 다.
> 기준 3요소: ① `design/` 프로토타입(확정 UX·도메인 로직) ② `data/races_sample.csv`(실수집 대회 데이터) ③ **외부 API 실호출 검증 결과**(§5, 2026-07-02 수행).
> 구(舊) `web/docs/SPEC.md`(Next.js 데모 기준)를 **대체**한다. 데이터 계약도 본 문서 §4가 기준이며, `web/lib/types.ts`와 어긋나면 본 문서가 우선한다.

**검증 표기 규칙** — 본 문서 전체에서 사용:

| 표기 | 의미 |
|---|---|
| ✅실측 | 2026-07-02 실제 API 호출로 확인 (부록 A) |
| 📄문서 | `docs/api/manuals/`·`Kakao/docs/api/manuals/` 매뉴얼 근거, 실호출 미수행 |
| ❌ | 실측 결과 사용 불가 (원인 명시) |
| 🔧정책 | 본 명세서에서 정한 기본값 — 구현 중 조정 가능 |

---

## 0. 문서 지위와 근거 자료

| 자료 | 역할 |
|---|---|
| `SPEC.md` (이 문서) | 최종 명세 SSOT |
| `design/` (Vite+React) | 확정 UX·화면 흐름·추천 엔진의 **참조 구현**. §2·§3은 이 코드를 명세화한 것 |
| `data/races_sample.csv` | 대회 데이터 원천 (271개 대회, §4.1) |
| `submissions/…제안서_런닝구….pdf` | 기능 약속(M1~M4·차별성 4항)의 원천. 공모전 필수요건 "한국관광공사 OpenAPI 활용" 포함 |
| `docs/api/manuals/` | 관광공사 API 파라미터 사전 (KorService2·두루누비·웰니스·반려동물) |
| `Kakao/docs/api/manuals/` + `Kakao/docs/api/runtrip-mapping.md` | 카카오 API 파라미터 사전·키 운영 매트릭스 |
| `web/` (Next.js) | 구 데모. 추천 룰(RECOVERY)의 원형이나 UX 기준 아님 |
| `backend/` | 크롤 CSV→정규화 파이프라인 (§6.2에서 재사용) |

---

## 1. 서비스 정의

### 1.1 개요 (제안서 확정 내용)

| 항목 | 내용 |
|---|---|
| 서비스명 | **런닝구(區)** — "내가 뛸 동네(區)를 가장 잘 아는 친구" |
| 한 줄 정의 | 전국 마라톤 일정 통합 + 종목·체류 조건 맞춤 대회 전후 여행 동선을 카카오맵 위에 자동 추천하는 러닝 관광 서비스 |
| 타깃 | 2030 러너 (5K·10K·하프 중심). 페르소나 "김러너"(28세 직장인, 10km 55분) |
| 부문 | 2026 관광데이터 활용 공모전 — 웹/앱 개발 (예비심사 통과) |
| 필수요건 | **한국관광공사 OpenAPI 활용 필수** (국문관광정보·두루누비·웰니스 3종이 핵심) |

**문제 정의.** ① 마라톤 일정이 블로그·인스타·개별 대회 홈페이지에 분산되어 신뢰할 수 있는 통합 서비스가 없다. ② 종목별 회복 강도와 동선을 반영한 대회 전후 여행 정보가 없다.

**차별성 (제안서 4항 — 모두 기능 요건).**

| # | 차별성 | 구현 위치 | 상태 |
|---|---|---|---|
| D1 | 대회→여행 원스톱 연결 (대회 선택 즉시 식당·관광지·축제를 지도 한 흐름으로) | 위저드 전체 + ResultScreen | 프로토타입 구현 |
| D2 | 자유 커스터마이징 동선 (추가·삭제·교체·순서변경) | `edits.js` + ResultScreen 편집 모드 | **프로토타입 구현 완료** |
| D3 | 러너 컨디션 기반 추천 룰 (하프 D+1 고강도 트레킹 제외, 5K/10K는 D-day 오후 관광 배치) | `engine.js` + `RECOVERY` | **프로토타입 구현 완료** |
| D4 | 비(非)대회 시즌 커버 (회복런·산책 코스 단독 탐색) | CoursesScreen | 스텁 → 두루누비 연동 필요 (G-05) |

### 1.2 기능 총괄 및 추적표

제안서가 약속한 기능 전부와 프로토타입 상태, 데이터 소스, 백로그 ID(§9)의 대응:

| 코드 | 기능 | 화면 | 데이터 소스 (§6) | 상태 |
|---|---|---|---|---|
| M1 | 종목·상황별 맞춤 동선 추천 | plan→taste→stay→result 위저드 | KTO 위치기반 + 웰니스 + 카카오 로컬 하이브리드 | 엔진 완성, 실데이터 연결 필요 |
| M2 | 전국 마라톤 통합 캘린더 | home | `races_sample.csv` 파이프라인 | UI 완성, 실데이터 연결 필요 (G-01) |
| M3 | 대회 인근 축제·행사 | race(인근 축제 캐러셀) + result | `searchFestival2` + 클라 거리계산 | 하드코딩 → 실데이터 (G-03) |
| M4 | 러닝·산책 코스 추천 | courses + 동선 내 walk 블록 | 두루누비 `courseList` + GPX | 스텁 → 연동 (G-05) |
| A1 | 동선 편집 (D2) | result 편집 모드 + CandidateSheet | — | **완료** |
| A2 | 내 여행 저장·복원 | trips | 로컬 상태 (`savedTrips`) | **완료** (영속화는 P2) |
| A3 | 출처·최근확인일 표시 | home 카드 (`source`·`checked`) | CSV `source`/`last_checked` | **완료** |
| A4 | 카톡 공유 (대회 카드·완성 동선) | race·result 공유 버튼 | Kakao Share SDK 📄문서 | 버튼만 존재 (G-09) |
| A5 | 이동시간 표시 | result 타임라인 | 카카오모빌리티 ✅실측 | 미구현 (G-10) |
| A6 | 카카오내비 연발 ("내비로 출발") | result | Kakao Navi SDK 📄문서 | P2 |
| A7 | 반려동물 동반 필터 | taste 옵션 (확장) | `KorPetTourService2` 📄문서 | P2 |
| A8 | 다국어 (인바운드) | 전체 | 웰니스 `langDivCd` 등 | 로드맵 4단계 |

---

## 2. 확정 UX 명세 — `design/` 프로토타입 기준

스택: React 18 + Vite 5. 라우터·상태관리 라이브러리 없음 — `useReducer` Context 단일 스토어(`store/appState.jsx`). **모바일 우선 단일 서피스**(max-width 420px 폰 프레임, 데스크톱에서는 중앙 목업 프레임).

### 2.1 정보구조와 화면 흐름

```
[홈 탭 흐름 — 위저드]
home ──SELECT_RACE──▶ race ──"이 대회로 동선 만들기"──▶ plan ──▶ taste ──▶ stay
                                                                        │ runEngine()
                        result ◀──────────────BUILD_DONE────────────────┘

[하단 탭바 4탭 — RESET_TO(스택 초기화)로 전환]
calendar → home        route → result(결과 있음) | plan(대회만 선택) | home(없음)
courses  → courses     trips → trips
```

- 탭바는 `TOP_LEVEL = {home, result, trips, courses}` 화면에서만 노출. 위저드 화면(race/plan/taste/stay)에서는 숨김.
- 내비게이션은 `stack` push/pop (GO/BACK), 탭 전환은 스택 초기화(RESET_TO).

### 2.2 화면별 명세

| 화면 (키) | 목적 | 핵심 UI | 상태 계약 | 전이 조건 |
|---|---|---|---|---|
| **S1 홈** (`home`) | 대회 탐색·검색·필터 | 검색 인풋, 필터 칩(지역·월·접수가능만), 대회 카드(날짜열·이름·지역·종목 태그·접수상태 칩·**출처/확인일**), 리스트/캘린더 토글. 목록은 **다가오는 대회 우선, 지난 대회 후순위** 🔧정책 | 읽기 `races` / 쓰기 `SELECT_RACE` | 카드 클릭 → `race` |
| **S2 대회 상세** (`race`) | 대회 정보 + 여정 시작점 | D-day 히어로, 종목·접수기간·주최·출처 행, 공식페이지 링크, **인근 축제 캐러셀(M3)**, 공유·저장 버튼 | 읽기 `race` | CTA → `plan` |
| **S3 일정** (`plan`) | 여행 패턴·기간 선택 | 패턴 4종(전날부터/대회+다음날/전후로/당일치기), 미니캘린더(대회일 마커+기간 하이라이트) | 쓰기 `pattern/start/end` | CTA → `taste` |
| **S4 취향** (`taste`) | 종목(회복강도) + 테마 선택 | 종목 세그먼트(5K/10K/하프/풀 + 강도 라벨), 테마 칩 6종 복수선택, `noHard` 시 회복 안내 박스 | 쓰기 `event/themes` | 테마 ≥1 → `stay` |
| **S5 숙소** (`stay`) | 숙소 선택 + **엔진 트리거** | 검색, "대회장 주변 추천"(AD5) + 소스 배지, 후보 리스트, 숙소 없이도 진행 가능 | 쓰기 `stay` + `runEngine()` | `BUILD_DONE` → `result` |
| **S6 결과** (`result`) | 동선 확인·편집·저장 | 상단 지도(핀+폴리라인) ↔ 타임라인 **IntersectionObserver 스크롤 동기화**, 일차 탭(회복일 오렌지), 회복 배지, 편집 모드(드래그 순서변경·교체·삭제·추가 + CandidateSheet), 산책 코스 요약, 저장 CTA | 읽기 `days/activeDay/recovery` / 쓰기 `SET_DAYS/SAVE_TRIP` 등 | 저장 → 토스트, 이후 탭 이동 |
| **내 여행** (`trips`) | 저장 동선 목록·복원 | 저장 카드(지역·박일·대회명·종목·회복 배지) | 읽기 `savedTrips` | 카드 → 상태 복원 후 `result` |
| **코스** (`courses`) | 비대회 시즌 코스 탐색 (M4·D4) | 거리·난이도 필터 칩, 코스 카드 | (스텁) | — |

### 2.3 상태 계약 (reducer 액션)

`GO`(push) · `BACK`(pop) · `RESET_TO`(스택 초기화) · `TAB` · `SET`(부분 병합) · `SELECT_RACE`(대회 저장 + 기본 종목: 하프 보유 시 '하프', 아니면 첫 종목) · `BUILD_DONE`(days/sources/recovery 저장) · `ACTIVE_DAY` · `TOGGLE_EDIT` · `OPEN_SHEET`/`CLOSE_SHEET`(add/replace 모드) · `SET_DAYS`(편집 반영) · `SAVE_TRIP`(id 중복 제거 후 prepend).

### 2.4 지도 모듈 (`map/MapView.jsx`)

- SDK 로드: `index.html`에서 `VITE_KAKAO_MAP_KEY` 유효 시 `//dapi.kakao.com/v2/maps/sdk.js?appkey=…&libraries=services&autoload=false` 동적 삽입.
- **폴백 계약**: 키 부재·로드 실패(4초 타임아웃) 시 **SVG 목업 지도**(위경도→XY 투영, 폴리라인+번호 핀)로 완전 동작. 데모 안정성 장치로 유지한다.
- 카카오맵 렌더: `Polyline`(#2B5CFF) + `CustomOverlay` 번호 핀, 핀 변경 시 `setBounds`, 활성 항목 변경 시 `panTo`. 회복일은 오렌지 액센트.

---

## 3. 도메인 규칙 — 추천 엔진 (`lib/runninggu/engine.js`)

엔트리: `buildItinerary({ race, stay, event, themes, start, end })` → `{ days, sources, recovery, plan }`. **UI·지도 비의존 순수 모듈** — 데이터 소스를 더미→실데이터로 바꿔도 무수정 재사용.

### 3.1 종목별 회복 룰 `RECOVERY` (constants.js — verbatim)

| 종목 | walk(km 상한) | noHard | intensity | dday | dplus |
|---|---|---|---|---|---|
| 5K | 8 | false | 거의 정상 | 완주 후 오후부터 자유 관광 | 일반 관광 자유 |
| 10K | 8 | false | 낮은 피로 | 완주 후 가벼운 관광·축제 | 일반 관광 |
| 하프 | 5 | **true** | 중등도 피로 | 완주 후 온천·휴식 권장 | 온천+짧은 산책(고강도 제외) |
| 풀 | 3 | **true** | 고강도 회복 필요 | 완주 후 회복 집중, 도보 최소 | 스파·온천 중심, 도보 최소 |

### 3.2 POI 풀 구성

- 기본 풀: `{food, tour} ∪ themes`. **`noHard`면 `wellness` 추가, 아니면 `cafe` 추가.**
- 검색 중심: 전 카테고리 = **대회장 좌표**, `walk` 풀만 **숙소 좌표**(숙소 없으면 대회장), count 8 (walk 6).
- 취향 카테고리 `CATS`: `tour`(AT4)·`food`(FD6)·`cafe`(CE7)·`wellness`(kw "온천 스파 사우나 찜질방")·`nature`(kw "둘레길 공원 산책로 수목원")·`history`(kw "박물관 유적지 문화재"). 숙소 전용 `LODGING_CAT`(AD5).

### 3.3 타임라인 생성 규칙

| 일차 | 시간·블록 (catKey) | 분기 |
|---|---|---|
| **D-1** (off<0) | 15:00 숙소 체크인(lodging) → 18:30 카보로딩 저녁(food) → 20:00 가벼운 저녁 산책(walk, 종목별 walk 상한) | note "내일 완주 · 가볍게 먹고 푹 쉬기" |
| **D-day** (off=0) | `startTime` 🏁 스타트(race) → **noHard**: 11:00 온천·회복(wellness) → [하프만] 14:30 가벼운 관광(tour) → 18:00 회복 저녁(food) / **일반**: 13:00 오후 자유 관광(테마 우선) → 15:30 카페(cafe) → 18:30 맛집 저녁(food) → 공통 20:30 숙소 주변 산책(walk) | note = `rule.dday` |
| **D+1** (off>0) | 08:00 아침 산책(walk) → **noHard**: 10:00 온천·족욕(wellness) / **일반**: 10:00 오전 관광(tour) → 12:30 로컬 점심(food) → 14:30 오후 관광(테마 우선) → [마지막날] 17:00 체크아웃·귀가(lodging) | note = `rule.dplus` |

- **중복 방지**: `used`(name Set)로 한 동선에 같은 장소 재등장 금지.
- **테마 우선 선택**: `[...themes, 'tour', 'nature', 'cafe', 'history']` 순서로 미사용 POI가 있는 첫 카테고리.
- **회복 배지**: `noHard`가 아니면 null. D+1 존재 시 `"D+n 회복 모드"`, 없으면 `"D-day 회복 모드"` + `rule` 문구.
- 알려진 개선점: `walkDesc`의 `Math.min(walkKm,3) + (walkKm<=3?0:0)` 둘째 항은 무효 코드 — 사실상 `min(walk,3)km 표시`. 종목별 상한 그대로 노출하도록 수정 예정 (G-13).

---

## 4. 데이터 명세

### 4.1 대회 원천: `data/races_sample.csv` (실측 통계 — 2026-07-02)

| 항목 | 값 |
|---|---|
| 대회 수 | **271행** (CSV 행수 898은 멀티라인 description 때문 — 파서는 반드시 RFC 4180 호환 사용) |
| 병합 후 고유 대회 | **153개** — 두 소스 중복 117쌍 병합 + 필수값 누락 1건 스킵 (G-01 파이프라인 실측) |
| 출처 | 마라톤온라인 138 + 마라톤GO 133 |
| 좌표 보유 | **271/271 (100%)** — 카카오 키워드검색 지오코딩 결과와 일치함을 실측 교차 확인 |
| 접수상태 | 접수중 124 · 마감 112 · 접수전 30 · 미정 5 |
| 대회일 범위 | 2026-06-06 ~ 2026-11-15 |
| image_url | 133건 (마라톤GO 계열) |
| category | 로드 207 · 트레일 43 · 걷기 14 · 야간 7 |
| 품질 이슈 | ① `sido`에 비표준 값 `'충청'` 존재 → 정제 규칙 필요 ② 종목 플래그 4개 모두 False인 행 45건(트레일·걷기 등) → M2 노출 정책 §6.2 |

**33컬럼 스키마**: `source, race_id, detail_url, crawled_at, last_checked, name, date_raw, event_date, time_raw, start_time, region, sido, venue, road_address, events_raw, distances, event_types, has_full, has_half, has_10k, has_5k, category, organizer, reg_start, reg_end, reg_status, official_url, description, image_url, contact_email, contact_phone, latitude, longitude`

### 4.2 표준 Race 계약 (SSOT — `design/src/lib/runninggu/normalize.js`)

파이프라인 산출물과 프론트가 공유하는 계약. `normalizeRace()`는 snake_case·camelCase 입력을 모두 허용하며 아래 camelCase로 출력:

```
Race {
  id, name, region, venue, date,          // date = 'YYYY-MM-DD' (event_date)
  startTime,                              // ← start_time ('HH:MM')
  eventTypes,                             // ← event_types → stdEvents()로 ['풀','하프','10K','5K'] 표준화
  regStatus, regStart, regEnd,            // ← reg_status/reg_start/reg_end
  organizer, source, checked,             // ← last_checked (출처·확인일 배지용)
  officialUrl, detailUrl, imageUrl,       // ← official_url/detail_url/image_url
  lat, lng,                               // Number() 강제 (← latitude/longitude)
  category                                // 로드|트레일|걷기|야간
}
```

- 종목 표준화 `stdEvent()`: `풀|full|42→'풀'`, `하프|half|21→'하프'`, `10k|10km→'10K'`, 그 외 `'5K'`. 중복 제거, 순서 `['풀','하프','10K','5K']`.
- `region`(표시용)과 별개로 필터용 **regionCode 17종**(서울·부산·대구·인천·광주·대전·울산·세종·경기·강원·충북·충남·전북·전남·경북·경남·제주)을 `sido`에서 파생한다. `'충청'` 등 비표준 값은 `road_address`/`venue`로 보정 🔧정책.

### 4.3 POI 계약 (모든 소스 공통)

```
Poi { name, lat, lng, desc, addr, url }
```

카카오 변환: `place_name→name, Number(y)→lat, Number(x)→lng, category_name 말단→desc, road_address_name||address_name→addr, place_url→url`.
KTO 변환 🔧정책: `title→name, Number(mapy)→lat, Number(mapx)→lng, cat/lclsSystm 라벨→desc, addr1→addr, (detailCommon2 homepage)→url` + 확장 필드 `image(firstimage)`, `contentId`(상세 enrich 키), `dist`.

POI 조회 결과는 `{ source: 'live'|'sample'|'synth', places: Poi[] }` — **폴백 체인 ① live(카카오 실시간) → ② sample(사전수집 `PRESAMPLED[raceId][catKey]`) → ③ synth(합성 샘플)**. 소스는 UI 배지로 노출한다(G-07).

### 4.4 일정·저장 계약

```
day   { date, off, label, dateLabel, note, blocks }     // off: 대회일 기준 상대일, label: 'D-1'|'D-day'|'D+1'
block { id, time, title, catKey, place: Poi|null, desc } // id = 'blk_N'
trip  { id: '{raceId}-{start}-{end}', race, raceName, region, event, themes, start, end, days, recovery }
```

### 4.5 좌표·날짜 규칙 (버그 1순위 — 전 계층 준수)

| 컨텍스트 | 규칙 |
|---|---|
| 좌표계 | 전부 **WGS84** (KTO도 WGS84 — 📄문서 + ✅실측 일치) |
| 카카오 REST·KTO 요청/응답 | **x = 경도(lng), y = 위도(lat)** / KTO는 `mapX`(경도)·`mapY`(위도) |
| 카카오맵 JS SDK | `kakao.maps.LatLng(위도, 경도)` — **REST와 인자 순서 반대** |
| KTO 응답 필드명 | KorService2는 소문자 `mapx/mapy`, 웰니스는 **대문자 `mapX/mapY`** 📄문서 |
| 내부 표준 | `lat`/`lng` 숫자 필드로 즉시 변환 — 경계에서만 변환하고 내부에서는 lat/lng만 사용 |
| 날짜 | `'YYYY-MM-DD'` 로컬 자정 기준 (dates.js). KTO 날짜 파라미터는 `YYYYMMDD` |

---

## 5. 외부 API 검증 결과 (2026-07-02 실호출)

### 5.1 판정 요약

| API | 용도 | 판정 | 근거 |
|---|---|---|---|
| KTO **KorService2** `locationBasedList2` | 대회장 반경 POI (관광지12·음식점39·숙박32·축제15) | **✅실측 사용 가능** | 세종 좌표 반경 검색 정상, `dist` 거리순 정렬 확인 |
| KTO KorService2 `searchFestival2` | 날짜 기반 축제 (M3) | **✅실측 사용 가능 (함정 있음)** | `eventStartDate` 필수. **구 `areaCode`는 에러 없이 0건 반환** — 지역필터는 `lDongRegnCd`(서울=11 실측)만 동작 |
| KTO KorService2 `detailCommon2` | POI 상세 enrich | ✅실측 | homepage 등 반환 확인 (overview 📄문서) |
| KTO ~~KorService1~~ | — | **❌ 폐기** | HTTP 500 — 구버전 예제 코드 사용 금지 |
| KTO **Durunubi** `courseList` | 걷기 코스 (M4) | **✅실측 사용 가능 (제약 있음)** | 전체 필드 실측. **좌표·반경 파라미터 없음** → §6.4 우회 설계 |
| KTO **WellnessTursmService** | 회복형 POI (M1 노하드) | **✅실측 사용 가능** (07-02 활용신청 후 재검증 완료) | 반경+테마 동시 필터 실측 확인 (EX050100 → 온천·스파만 필터링). **data.go.kr 페어 키로만 동작** — 구 hex 키는 403 (§7.3 키 단일화) |
| 카카오 **로컬** keyword/category/address | 지오코딩·상권 POI | **✅실측 사용 가능** | 3종 모두 정상. CSV 좌표가 keyword 결과와 일치 — 수집 파이프라인과 정합 |
| 카카오 **모빌리티** `/v1/directions` | 이동시간 (A5) | **✅실측 사용 가능** | **문서에는 "kakaomobility.com 별도 키" 기재였으나, 보유한 kakao.com REST 키로 정상 동작** (5.6km/700초/택시요금 응답). 실측 우선 |
| 카카오 **지도 JS SDK** | 프론트 지도 | **✅키 유효** | SDK 스크립트 정상 서빙. 브라우저 동작은 **도메인 등록 필수** (localhost:5173/3000) |
| 카카오 공유·로그인·내비 | A4·A6·(P2) | 📄문서 (미실측) | JS 키·도메인 등록만으로 사용 가능, 심사 불필요. "친구에게 메시지"만 별도 검수 필요 |
| KTO KorPetTourService2 | A7 (선택) | 📄문서 (미실측) | 사용 시 별도 활용신청 필요할 수 있음 (웰니스와 동일 패턴 예상) |

### 5.2 관광공사 TourAPI 상세

**공통.** 인증 `serviceKey`(쿼리 파라미터) · `MobileOS=ETC`·`MobileApp=runtrip` 필수 · `_type=json`(기본 XML) · 쿼터 **개발계정 오퍼레이션당 일 1,000건** 📄문서 (운영계정 전환 시 공사 승인 1~3일) · **radius 최대 20,000m** · 데이터 갱신 일 1회 📄문서.

**키.** **data.go.kr 인코딩/디코딩 페어 키로 단일화** — 3개 서비스 전부 이 키로 동작 ✅실측 (2026-07-02). 구 hex 키(TourAPI 포털 발급)는 KorService2·두루누비만 되고 웰니스는 403. 인코딩/디코딩 형태 사용처 구분은 §5.4-14.

**에러 형태 (✅실측 + 📄문서).**

| 상황 | 형태 |
|---|---|
| 키 오류 | HTTP 401 `Unauthorized` |
| 해당 API 활용신청 안 됨 | HTTP 403 `Forbidden` |
| 없는 서비스 경로 / 구버전(KorService1) | HTTP 500 |
| 쿼터 초과 등 포털 오류 | **`_type=json`이어도 XML** `<OpenAPI_ServiceResponse>` (returnReasonCode 22 등) 📄문서 — JSON 파서와 별도 처리 필수 |
| 정상 | `response.header.resultCode == "0000"` |

#### ① 국문관광정보 KorService2 — `https://apis.data.go.kr/B551011/KorService2`

- 오퍼레이션명에 `2` 접미사. **구 areaCode/sigunguCode/cat1~3 체계가 lDongRegnCd/lDongSignguCd(법정동) + lclsSystm1~3(신분류)로 대체됨** — 요청 필터로는 신체계만 신뢰(응답에는 구필드가 남아있으나 축제 응답에서는 빈 값 ✅실측). 코드 사전은 `ldongCode2`·`lclsSystmCode2`로 조회.
- `locationBasedList2` — 파라미터: `mapX`(경도)·`mapY`(위도)·`radius`(m, ≤20000)·`contentTypeId`·`arrange=E`(거리순)·`numOfRows`/`pageNo`. contentTypeId: **12 관광지 · 14 문화시설 · 15 행사/축제 · 25 여행코스 · 28 레포츠 · 32 숙박 · 38 쇼핑 · 39 음식점**.
- 응답 필드 (✅실측 verbatim): `title, addr1, addr2, zipcode, contentid, contenttypeid, mapx, mapy, dist, firstimage, firstimage2, tel, cpyrhtDivCd, mlevel, createdtime, modifiedtime, lDongRegnCd, lDongSignguCd, lclsSystm1~3 (+구필드 areacode, sigungucode, cat1~3)`.
- `searchFestival2` — 파라미터: `eventStartDate`(YYYYMMDD, 필수)·`eventEndDate`·`lDongRegnCd`/`lDongSignguCd`. **mapX/mapY/radius 없음** — 반경 필터 불가. 응답 추가 필드 (✅실측): `eventstartdate, eventenddate, progresstype, festivaltype`.
- **✅실측 확인: `locationBasedList2`+`contentTypeId=15`는 반경 검색은 되지만 응답에 날짜 필드가 없음** → 축제는 §6.3 조합 설계로 해결.
- `searchStay2`(숙박)·`searchKeyword2`(키워드)·`detailCommon2/Intro2/Info2/Image2`(상세) 사용 가능. `detailIntro2`는 `contentTypeId` 필수.
- 샘플: `…/locationBasedList2?serviceKey=$KTO_SERVICE_KEY&MobileOS=ETC&MobileApp=runtrip&_type=json&mapX=127.2714&mapY=36.4912&radius=5000&contentTypeId=12&arrange=E&numOfRows=20&pageNo=1`

#### ② 두루누비 Durunubi — `https://apis.data.go.kr/B551011/Durunubi`

- 오퍼레이션 접미사 없음: `courseList`(코스)·`routeList`(길). 파라미터: `brdDiv`(**DNWW 걷기길**/DNBW 자전거길)·`crsLevel`(1하/2중/3상)·`crsKorNm`(코스명)·`routeIdx`. **좌표·반경·지역코드 파라미터 없음.**
- 응답 필드 (✅실측 verbatim): `routeIdx, crsIdx, crsKorNm, crsDstnc(km), crsTotlRqrmHour(분), crsLevel, crsCycle, crsContents, crsSummary, crsTourInfo, travelerinfo, sigun("부산 중구" 형식), brdDiv, gpxpath(GPX URL), createdtime, modifiedtime`.
- **좌표는 `gpxpath`의 GPX 파일을 내려받아 트랙포인트에서 추출**해야 함 → 사전수집·색인 필수 (§6.4).

#### ③ 웰니스관광정보 WellnessTursmService — `https://apis.data.go.kr/B551011/WellnessTursmService`

- **✅실측 사용 가능 (2026-07-02 활용신청 완료 후 재검증).** 단, **data.go.kr 페어 키로만 동작** — 구 hex 키는 403 유지 (§7.3).
- 오퍼레이션 접미사 없음: `locationBasedList`·`areaBasedList`·`searchKeyword`·`detailCommon` 등. **`langDivCd=KOR` 필수**(ENG·JPN 등 9종 — A8 다국어 대비).
- **반경+테마 동시 필터 ✅실측**: `mapX/mapY/radius`(≤20000) + `wellnessThemaCd`. 서울 20km EX050100 → 온천·스파 3건(우리유황온천·시그니엘 스파 등)만 정확히 필터 (무필터 대조 9건). 코드: **EX050100 온천/사우나/스파 · EX050200 찜질방 · EX050300 한방 · EX050400 힐링·명상 · EX050500 뷰티스파 · EX050600 기타 · EX050700 자연치유**.
- 응답 필드 (✅실측 verbatim): `title, baseAddr, detailAddr, zipCd, contentId, contentTypeId, dist, firstimage, firstimage2, cpyrhtDivCd, mapX, mapY(대문자), mlevel, regDt, mdfcnDt, tel, lDongRegnCd, lDongSignguCd, wellnessThemaCd, langDivCd`. **매뉴얼에는 이미지 필드가 `orgImage/thumbImage`로 기재돼 있으나 실제 응답은 `firstimage/firstimage2` — 문서 오류, 실측 우선.** KorService2와 필드명·대소문자가 다르므로 정규화기 분리 (§6.1).
- 데이터 밀도 실측: 세종 반경 20km 4건 · 서울 반경 20km 9건 — 희소 카테고리이므로 기본 반경 20km 🔧정책. 부족 시 카카오 키워드("온천 스파 사우나 찜질방")로 보강.

### 5.3 카카오 API 상세

**키 운영 (✅실측 반영).**

| 표면 | 키 | 위치 | 용도 |
|---|---|---|---|
| 클라이언트 | **JavaScript 키** | `design/.env`(`VITE_KAKAO_MAP_KEY`) · `web/.env.local`(`NEXT_PUBLIC_KAKAO_MAP_KEY`) | 지도 SDK(+services 라이브러리 검색), 공유, 내비, 로그인 인가 |
| 서버·파이프라인 | **REST 키** | 루트 `.env`(`KAKAO_REST_KEY`) | 로컬 검색·지오코딩·**모빌리티(실측 동작)** |

- 헤더: `Authorization: KakaoAK {REST_KEY}`. JS SDK는 **콘솔 Web 플랫폼 도메인 등록 필수** — `http://localhost:5173`(design), `http://localhost:3000`(web), 배포 도메인.
- 쿼터: 문서에 수치 미기재 — 초과 시 **429**. 콘솔 쿼터 페이지에서 확인 📄문서.

#### 로컬 API (✅실측)

| 엔드포인트 | 용도 | 핵심 파라미터 |
|---|---|---|
| `GET /v2/local/search/keyword.json` | 장소명→좌표(지오코딩 1차)·키워드 POI | `query`, `x,y,radius`(≤20000), `sort=distance`, `size`(≤15), `page`(≤45) |
| `GET /v2/local/search/category.json` | 반경 상권 POI | `category_group_code`(1개 필수), `x,y,radius`, `sort=distance` |
| `GET /v2/local/search/address.json` | 주소→좌표(지오코딩 2차 폴백) | `query`, `analyze_type` |

- 응답 (✅실측 verbatim): `documents[] { place_name, address_name, road_address_name, x(경도), y(위도), distance(m), category_name, category_group_code, phone, place_url, id }` + `meta { total_count, pageable_count, is_end, same_name }`. 주소검색은 `documents[].address{…}`, `road_address`, `address_type`.
- 카테고리 코드 (사용분): **AT4 관광명소 · AD5 숙박 · FD6 음식점 · CE7 카페 · CT1 문화시설 · HP8 병원 · PM9 약국** (전체 18종 📄문서).
- 커버리지 실측: 세종중앙공원 반경 2km 음식점 856곳 — KTO 대비 상권 커버리지 압도적 (§6.1 근거).

#### 모빌리티 길찾기 (✅실측)

- `GET https://apis-navi.kakaomobility.com/v1/directions?origin={lng},{lat}&destination={lng},{lat}[&waypoints=…]` — 보유 REST 키로 동작 확인.
- 응답 (✅실측 verbatim): `trans_id, routes[] { result_code(0=성공), result_msg, summary { origin, destination, waypoints, priority, bound, fare{taxi,toll}, distance(m), duration(초) }, sections[] { distance, duration, roads[]{ name, distance, duration, traffic_speed, traffic_state, vertexes[](경도,위도 반복) } } }`.
- **자동차 전용 — 도보 모드 없음** (문서·저장소 전체에서 부재 확인). 도보 구간은 🔧정책: 직선거리×보행속도(4km/h) 추정 라벨 또는 표시 생략. 다중 경유 `GET`은 waypoints ≤5 📄문서.
- 쿼터·과금: "트래픽 한도는 별도 협의" 📄문서 — 데모 트래픽은 문제없으나 상용 전 확인.

#### 공유·내비·로그인 (📄문서 — 구현 시 참조)

- 공유: `Kakao.init(JS_KEY)` → `Kakao.Share.sendDefault()` — 대회 카드=`feed`, 완성 동선=`list`, 집결 위치=`location` 템플릿. 심사 불필요.
- 내비: `Kakao.Navi.start({name,x,y,coordType:'wgs84'})` 또는 URL 스킴 `https://map.kakao.com/link/to/이름,위도,경도`.
- 로그인: 인가 `kauth.kakao.com/oauth/authorize`(JS) → 토큰 교환은 서버(REST 키+client_secret). **JS 토큰 2h** — P2(서버 생기면).

### 5.4 함정·제약 종합 (구현 체크리스트)

1. **KorService1 금지** — 구버전 예제·블로그 코드 복붙 시 HTTP 500 ✅실측.
2. **areaCode 함정** — searchFestival2에 구 `areaCode` 주면 **에러 없이 0건** ✅실측. 지역필터는 `lDongRegnCd`만.
3. KTO 포털 오류는 `_type=json`이어도 **XML로 옴** — resultCode 파싱 전 Content 검사 📄문서.
4. 쿼터 **오퍼레이션당 일 1,000건(개발)** — §7.4 예산 설계 준수. 초과 코드 22.
5. radius ≤ **20km** — 그 이상은 다중 호출·페이지네이션.
6. searchFestival2 **반경 불가**, locationBased(15) **날짜 없음** ✅실측 — M3는 반드시 §6.3 조합.
7. 두루누비 **좌표 없음** — gpxpath GPX 파싱 사전수집 필수 ✅실측.
8. 웰니스는 **data.go.kr 페어 키로만 동작** (구 hex 키 403) — KTO 키는 페어 키로 단일화(§7.3). 필드명도 KorService2와 다름(대소문자·이미지 필드 `firstimage` 포함).
9. 좌표 순서 — REST `x=lng,y=lat` vs SDK `LatLng(lat,lng)` (§4.5). 경계 변환 계층 필수.
10. 카카오 JS SDK **도메인 미등록 시 동작 안 함** — 배포 도메인 추가 잊지 말 것.
11. 모빌리티 도보 없음 — 자동차 시간만 표시하거나 도보 추정 🔧정책.
12. 카카오 로컬 `size≤15`·`page≤45` = 최대 675건/쿼리 — 대량 수집은 rect 분할 📄문서.
13. CSV 파싱은 멀티라인 필드 대응 파서 필수 (행수≠대회수) ✅실측.
14. **serviceKey 인코딩 함정** — data.go.kr 페어 키는 `+ / =` 포함: URL 문자열에 직접 이어붙일 땐 **인코딩 키**(`KTO_SERVICE_KEY_ENC`), HTTP 라이브러리가 인코딩해줄 땐(예: requests `params=`) **디코딩 키**(`KTO_SERVICE_KEY`). 혼용 시 인증 실패.

---

## 6. 기능별 데이터 조달 설계

### 6.1 POI 하이브리드 전략 (M1)

실측 근거: 세종 기준 KTO 숙박 반경 10km **4곳** vs 카카오 음식점 반경 2km **856곳**. 반대로 KTO는 관광지 품질 데이터(공식 이미지 `firstimage`, 상세 overview, 관광 분류)가 강함. 따라서:

| catKey | 1순위 | 2순위(보강/폴백) | 비고 |
|---|---|---|---|
| tour | **KTO** locationBasedList2 `contentTypeId=12` | 카카오 AT4 | 이미지·공식 설명 확보. 공모전 필수요건 충족 축 |
| history | **KTO** 12 + `lclsSystm` 역사 분류 필터 | 카카오 kw "박물관 유적지 문화재" | 분류코드는 `lclsSystmCode2`로 확정 |
| food | **카카오** FD6 | KTO 39 | 커버리지·현행성 우선 |
| cafe | **카카오** CE7 | — | KTO에 대응 타입 없음 |
| lodging | **카카오** AD5 | KTO 32·searchStay2 | KTO 숙박 희소(실측) |
| wellness | **KTO 웰니스** locationBasedList + `wellnessThemaCd=EX050100·EX050200·EX050500·EX050700` ✅실측 | 카카오 kw "온천 스파 사우나 찜질방" (희소 지역 보강) | noHard 동선의 핵심. 기본 반경 20km(희소 실측) |
| nature | 카카오 kw "둘레길 공원 산책로 수목원" + **두루누비**(§6.4) | KTO 12 자연 분류 | walk 블록과 공유 |

- 반경 🔧정책: 기본 8km(프로토타입 현행) → wellness·nature 등 희소 카테고리는 결과 <3건이면 20km로 확장 재검색. 정렬은 거리순(`arrange=E` / `sort=distance`).
- 사전수집(PRESAMPLED 대체): 대회당 카테고리별 **20건** 저장, 프론트는 8건 노출 🔧정책. 산출물: `design/public/data/pois/{raceId}.json`.
- KTO POI는 `contentid` 보존 → 상세 화면·이미지는 `detailCommon2` 지연 enrich.

### 6.2 M2 대회 데이터 파이프라인

```
크롤 CSV (마라톤온라인+마라톤GO, 271행)
  → backend/build_races_json.py  ✅구현 (2026-07-02)
     · RFC4180 파서 · 종목 표준화(has_* 플래그 우선, 불명 토큰 5K 강제 안 함)
     · region 17종 보정('충청'→세종, 텍스트 힌트) · 좌표는 CSV값(100%), 누락 시 geocode.py
     · 중복 병합(정규화명+date, 117쌍): 최근 확인일 우선 + 빈 필드 상호 보충 + 출처 병기("마라톤GO·마라톤온라인")
  → design/public/data/races.json (Race[] 153건, ~100KB)
  → 프론트: appState가 races.json fetch → normalizeRaces() (실패 시 내장 샘플 폴백 = NFR-1) ✅구현
```

- 종목 플래그 all-False 45건 🔧정책: `category ∈ {트레일, 걷기}`는 M2 캘린더에 노출하되 M1 위저드 종목 선택은 5K 폴백 + "종목 정보 없음" 표시. 완전 정보 부재 대회는 상세 링크만.
- 접수상태 신뢰성: `last_checked`(확인일)를 카드에 항상 노출(A3, 구현 완료). 재크롤 주기 🔧정책 주 1회.

### 6.3 M3 축제 조달 (조합 설계 — 실측 제약 반영)

단일 API로 "날짜+반경" 동시 필터가 불가하므로(§5.4-6):

1. **수집**: `searchFestival2?eventStartDate={수집일 기준 과거 60일}` 전량 페이지네이션 → 축제 전체 (응답에 좌표·기간 포함 ✅실측).
2. **매칭(로컬 계산)**: 대회별로 `기간 겹침: eventstartdate ≤ 대회일+1 AND eventenddate ≥ 대회일-1` AND `Haversine(대회장, 축제) ≤ 20km` 🔧정책.
3. **산출**: `races.json`의 각 대회에 `festivals[]`(Poi 확장: `eventStart, eventEnd, image`) 주입 → RaceScreen 캐러셀(현재 하드코딩)·ResultScreen D-day 축제 블록에 사용 (G-03).

호출량: 대회별이 아니라 **전량 1회 수집 후 로컬 매칭** — 쿼터 효율 최적.

### 6.4 M4 두루누비 코스 조달

1. **수집**: `courseList?brdDiv=DNWW` 전량 페이지네이션(일 1,000건 내 분할).
2. **색인**: 각 코스 `gpxpath` GPX 다운로드 → 시작점·중간점 좌표 추출 → `{crsIdx, name, distKm, level, hours, sigun, startLat, startLng, summary}` 색인 저장.
3. **매칭**: 대회장 반경 🔧정책 20km + 제안서 요건 **거리 3~10km** 필터 → 대회별 `courses[]` / CoursesScreen에는 전국 색인 + 거리·난이도 필터(현 스텁 UI 그대로 데이터만 연결, G-05).
4. walk 블록: 숙소/대회장 근처 코스 중 `min(코스거리, RECOVERY.walk)` 조건 우선.

### 6.5 이동시간 (A5 — 선택)

일차별 blocks 좌표 순서로 모빌리티 `directions`(waypoints ≤5) 1콜 → 블록 사이 `duration` 라벨. 실패·미호출 시 표시 생략(비차단) 🔧정책. 데모에서는 결과 화면 진입 시 1회만.

### 6.6 지오코딩

CSV 좌표 100% ✅ — 신규 수집분만 `backend/geocode.py`(키워드→주소 폴백, 캐시) 재사용. 지명 모호성은 `sido` 문자열을 쿼리에 결합.

---

## 7. 시스템 아키텍처

### 7.1 공모전 데모 아키텍처 (확정)

**서버 없는 정적 파이프라인 + 클라이언트 라이브 폴백** — 쿼터 절약·데모 안정성·심사 재현성 최적.

```
[배치 파이프라인 (로컬 실행, .env 키 사용)]
crawl CSV ─→ normalize ─→ races.json ─┐
KTO KorService2/웰니스/두루누비 ─→ POI·축제·코스 매칭 ─→ pois/{raceId}.json ─┤
                                                        (전부 사전수집·정적) ▼
[design/ 프론트]  races.json + pois/*.json 로드
   └ 라이브 보강: 카카오맵 SDK + 로컬 검색(JS services) — 실패 시 sample→synth 폴백 (§4.3)
   └ (선택) 모빌리티 이동시간
```

### 7.2 제안서 3계층과의 대응 (확장 로드맵)

| 제안서 백엔드 API 5종 | 데모 구현 | 확장(2단계~) |
|---|---|---|
| 마라톤 대회 조회 API | 정적 `races.json` | DB + REST 서버 |
| 관광/축제 POI 조회 API | 정적 `pois/{raceId}.json` + 클라 카카오 라이브 | 서버 캐시(제안서 Redis) + 쿼터 관리 모듈 |
| 추천 동선 생성 API | 클라 `engine.js` (순수 모듈 — 서버 이식 가능) | 서버화 + 사용자 이력 반영 |
| 지도 라우팅 데이터 API | 클라 모빌리티 직호출 | 서버 프록시(키 은닉) |
| 출처·최근 확인일 조회 API | `races.json` 내 필드 | 갱신 이력 테이블 |

### 7.3 키·시크릿 운영

- 루트 `.env`(gitignore 등록됨): `KTO_SERVICE_KEY`(디코딩)·`KTO_SERVICE_KEY_ENC`(인코딩), `KAKAO_REST_KEY`, `KAKAO_JS_KEY` — 파이프라인용. 실행: `set -a; source .env; set +a`.
- **KTO 키는 data.go.kr 페어 키로 단일화** (✅실측 2026-07-02: KorService2·두루누비·웰니스 3종 모두 커버). 구 hex 키는 웰니스 미지원(403) — `.env`에 백업 주석으로만 유지.
- `design/.env`: `VITE_KAKAO_MAP_KEY`(JS 키) / `web/.env.local`: `NEXT_PUBLIC_KAKAO_MAP_KEY`, `KTO_SERVICE_KEY`. 셋 다 **커밋 금지 확인됨**(.gitignore ✅).
- 규칙: REST 키·KTO 키는 클라이언트 번들에 절대 포함 금지. JS 키만 클라이언트 노출(도메인 제한으로 보호).

### 7.4 KTO 쿼터 예산 (개발계정 1,000건/일/오퍼레이션)

| 작업 | 오퍼레이션 | 호출량 추정 | 판정 |
|---|---|---|---|
| 축제 전량 수집 | searchFestival2 | 수 페이지 (~10콜) | 여유 |
| 두루누비 전량 수집 | courseList | 코스수/100 (~20콜) + GPX는 쿼터 외 | 여유 |
| 대회별 POI (tour·history) | locationBasedList2 | 271대회 × 2 = 542콜 | **1일 내 가능** |
| 대회별 POI (food·lodging KTO 보강) | locationBasedList2 | +542콜 → 합 1,084 | **초과** → 이틀 분할 또는 접수중·접수전 154개 우선 🔧정책 |
| 웰니스 대회별 | Wellness locationBasedList | 271콜 | 여유 (신청 후) |
| 상세 enrich | detailCommon2 | 노출 POI만 지연 호출 | 여유 |

재수집은 `modifiedtime` 증분 필터로 최소화. 운영계정 전환(공사 승인 1~3일)은 제출 직전 신청.

---

## 8. 비기능 요구사항

| ID | 요구사항 |
|---|---|
| NFR-1 | **키 없는 완전 동작**: 카카오 키·네트워크 부재 시에도 SVG 지도 + sample/synth 폴백으로 전 플로우 시연 가능해야 한다 (프로토타입 현행 유지) |
| NFR-2 | **폴백 투명성**: POI 소스 배지(live/sample/synth)를 결과 화면에 노출한다 (G-07) |
| NFR-3 | **에러 격리**: 외부 API 실패는 해당 블록 place=null(제목만 표시)로 강등, 동선 생성 자체는 실패하지 않는다 |
| NFR-4 | **KTO 응답 방어**: resultCode≠0000, XML 오류 응답, HTTP 401/403/500 각각 구분 로깅 (§5.2 에러 표) |
| NFR-5 | **429 대응**: 카카오 호출 실패 시 1회 재시도 후 폴백. 파이프라인은 호출 간 지연 + 캐시(geocode_cache 방식) |
| NFR-6 | **신뢰성 표기**: 모든 대회 카드에 출처(source)·최근확인일(checked) 상시 노출 (공모전 차별성) |
| NFR-7 | **저작권**: KTO 이미지 `cpyrhtDivCd`(Type1/3) 표기 준수, 출처 "한국관광공사" 크레딧 |
| NFR-8 | **좌표 규율**: §4.5 위반 금지 — 경계 변환 함수 단일화 |

---

## 9. 구현 백로그 (프로토타입 → 최종)

| ID | 항목 | 근거 | 우선순위 |
|---|---|---|---|
| G-00 | ~~웰니스 API 활용신청~~ → **완료 (2026-07-02)** — 페어 키 검증 및 키 단일화 반영 | §5.2③ ✅실측 | ✅ 완료 |
| G-01 | ~~`RAW_RACES` → 파이프라인 `races.json` 연결~~ → **완료 (2026-07-02)** — 153개 고유 대회, fetch+폴백 구조, 엔진 스모크 테스트 통과 | §6.2 ✅ | ✅ 완료 |
| G-02 | ~~`TODAY` 하드코딩 제거~~ → **완료 (2026-07-02)** — RaceScreen·HomeScreen 실제 오늘 날짜 + 지난 대회 목록 후순위 정렬 | §2.2 S1 ✅ | ✅ 완료 |
| G-03 | RaceScreen 인근 축제 하드코딩 → §6.3 산출물 연결 | §6.3 | P0 |
| G-04 | PRESAMPLED(경주 1개) → 전 대회 POI 사전수집 자동화 (§6.1, KTO+카카오) | §6.1 | P0 |
| G-05 | CoursesScreen 두루누비 실데이터 연결 (거리·난이도 필터 동작) | §6.4 · D4 | P0 |
| G-06 | 카카오 콘솔 도메인 등록 (localhost:5173/3000 + 배포 도메인) | §5.4-10 | P0 (사용자, 1분) |
| G-07 | 소스 배지(live/sample/synth) ResultScreen 렌더 (`state.sources` 이미 저장 중) | NFR-2 | P1 |
| G-08 | 홈 캘린더 뷰 실구현 (현재 토글만 있고 항상 리스트) | design 분석 | P1 |
| G-09 | 공유 버튼 구현 — 대회 feed·동선 list 템플릿 (`Kakao.Share`) | A4 | P1 |
| G-10 | 모빌리티 이동시간 라벨 (§6.5) | A5 ✅실측 | P1 |
| G-11 | `imageUrl` 활용 (RaceScreen 히어로, 카드 썸네일 — 133건 보유) | §4.1 | P1 |
| G-12 | KTO POI 상세 enrich (detailCommon2 overview·이미지) | §5.2① | P1 |
| G-13 | walkDesc 무효 코드 수정 — 종목별 walk 상한 정확 표기 | §3.3 | P1 |
| G-14 | savedTrips localStorage 영속화 | A2 | P1 |
| G-15 | 카카오내비 연발·로그인·반려동물 필터·다국어 | A6~A8 | P2 |

## 10. 로드맵 (제안서 4단계 요약)

| 단계 | 기간 | 내용 | KPI |
|---|---|---|---|
| ① MVP (공모전 제출) | ~4M | 수도권·광역시 100+ 대회, 종목별 추천 룰, 카카오맵 동선 — **본 명세 P0 완료가 곧 MVP** | 베타 MAU 3,000 · 일정 저장률 20% · 동선 채택률 15% |
| ② 전국 확장·검증 | 4~12M | 300+ 대회, 편집 이력 수집→룰 개선 | 재방문 25% · 편집 이력 1,000건 · 만족도 4.0 |
| ③ 지자체·상권 연계 | 12~24M | 관광 전환 리포트, 숙박·웰니스 제휴, 축제 결합 코스 | 제휴 지역 5 · 업체 100 · 전환율 10% |
| ④ 인바운드·확장 | 24M~ | 다국어(웰니스 langDivCd 활용), 외국인 러너, 트레일러닝 | 외국인 10% · 글로벌 MAU 30,000 |

---

## 부록 A. 실호출 검증 로그 (2026-07-02)

| # | 호출 | 결과 |
|---|---|---|
| 1 | KorService2 `locationBasedList2` mapX=127.2714 mapY=36.4912 radius=5000 contentTypeId=12 arrange=E | 0000 OK — 세종호수공원 dist 872m, firstimage 포함 |
| 2 | 〃 contentTypeId=39 radius=3000 | 0000 OK — 음식점 dist 정렬 |
| 3 | 〃 contentTypeId=15 radius=20000 | 0000 OK totalCount=12 — **날짜 필드 없음** |
| 4 | 〃 contentTypeId=32 radius=10000 | 0000 OK totalCount=**4** (숙박 희소) |
| 5 | `searchFestival2` eventStartDate=20260701 | 0000 OK — eventstartdate/enddate 포함 |
| 6 | 〃 + `areaCode=1` (구 파라미터) | 0000 **totalCount=0 (조용한 실패)** |
| 7 | 〃 + `lDongRegnCd=11` | 0000 OK — 서울 축제 정상 필터 |
| 8 | `detailCommon2` contentId=1946955 | 0000 OK — homepage 등 |
| 9 | KorService1 locationBasedList1 | **HTTP 500** (폐기) |
| 10 | Durunubi `courseList` brdDiv=DNWW | 0000 OK — 전 필드 확보 (gpxpath 포함) |
| 11 | WellnessTursmService locationBasedList/areaBasedList | **HTTP 403 Forbidden** |
| 12 | (대조) 가짜 서비스명 / 가짜 키 | 500 / **401** → 403=미신청 확정 |
| 13 | 카카오 keyword "세종중앙공원" | 200 — CSV 좌표와 일치 |
| 14 | 카카오 category FD6 radius=2000 | 200 — total_count=856 |
| 15 | 카카오 address "세종특별자치시 연기면" | 200 |
| 16 | 모빌리티 directions 세종 구간 | 200 result_code=0 — 5,598m/700초/택시 8,300원 |
| 17 | 지도 SDK sdk.js?appkey=JS키 | 200 — 정상 JS 서빙 |
| 18 | (동일 07-02 추가) 웰니스 locationBasedList × **data.go.kr 페어 키** (활용신청 후) | 0000 OK — 세종 20km totalCount=4, 응답 필드 verbatim 확보 (`firstimage` 확인) |
| 19 | 〃 `wellnessThemaCd=EX050100` 서울 20km | 0000 OK — 3건 전부 EX050100 (무필터 대조 9건) → 테마필터 동작 |
| 20 | 웰니스 × 구 hex 키 (재확인) / KorService2·Durunubi × 페어 키 | 403 유지 / 둘 다 0000 OK → **페어 키로 단일화 결정** |

## 부록 B. 코드표 요약

- **KTO contentTypeId**: 12 관광지 · 14 문화시설 · 15 행사/축제 · 25 여행코스 · 28 레포츠 · 32 숙박 · 38 쇼핑 · 39 음식점
- **wellnessThemaCd**: EX050100 온천/사우나/스파 · EX050200 찜질방 · EX050300 한방 · EX050400 힐링명상 · EX050500 뷰티스파 · EX050600 기타 · EX050700 자연치유
- **카카오 category_group_code**(사용분): AT4 관광명소 · AD5 숙박 · FD6 음식점 · CE7 카페 · CT1 문화시설 · HP8 병원 · PM9 약국
- **arrange**(KTO): A 제목순 · C 수정일순 · D 생성일순 · **E 거리순**(위치기반) · O/Q/R 이미지 필수 정렬
- **두루누비**: brdDiv DNWW 걷기길/DNBW 자전거길 · crsLevel 1하/2중/3상
- **lDongRegnCd**: 법정동 시도 2자리 (서울=11 ✅실측). 전체 목록은 구현 시 `ldongCode2` 오퍼레이션으로 확정할 것 (강원·전북은 특별자치도 전환으로 코드 변경 이력 있음 — 하드코딩 금지)
