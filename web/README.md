# 런닝구(區)

전국 마라톤 통합 캘린더 + 종목·체류·테마 맞춤 여행 동선 추천 서비스 (2026 관광데이터 활용 공모전).

> Next.js 14 (App Router) · TypeScript · Tailwind CSS · 카카오맵

## 빠른 시작

```bash
npm install
cp .env.local.example .env.local   # 카카오맵 키 입력
npm run dev                        # http://localhost:3000
```

카카오맵 키가 없어도 앱은 실행됩니다 (지도 자리에 마커 목록이 표시됨). 지도를 보려면:

1. https://developers.kakao.com → 내 애플리케이션 → 앱 생성
2. [앱 키]의 **JavaScript 키** 복사
3. [플랫폼] → Web → 사이트 도메인에 `http://localhost:3000` 등록
4. `.env.local` 의 `NEXT_PUBLIC_KAKAO_MAP_KEY` 에 붙여넣기

## 구현된 기능 (제안서 매핑)

- **M2 전국 마라톤 통합 캘린더** — 지역/월/종목/접수 필터, 출처·최근확인일 표시 (`MarathonList`)
- **M1 종목·상황별 맞춤 동선 추천** — 종목 × 체류 × 테마 → D-1/D-day/D+1 타임라인 + 지도 경로 (`MarathonDetail` + `lib/recommend.ts`)
- **M3 대회 인근 축제·행사** — 지도 마커
- **M4 두루누비 산책 코스** — 거리·난이도별

## 구조

```
app/
  layout.tsx, page.tsx       # 메인 셸(상태·지도 마커 계산)
  globals.css
components/
  KakaoMap.tsx               # 카카오맵 SDK 래퍼(키 없으면 폴백)
  MarathonList.tsx           # M2 캘린더/필터
  MarathonDetail.tsx         # M1/M3/M4 탭
  Chip.tsx
lib/
  types.ts                   # 도메인 타입
  data.ts                    # 더미 데이터(MARATHONS) + 회복 룰(RECOVERY)
  recommend.ts               # 동선 추천 엔진(순수 함수)
demo/index.html              # 초기 단일 HTML 프로토타입(참고용)
```

## 다음 단계 (더미 → 실데이터)

현재 `lib/data.ts` 의 `MARATHONS` 는 **더미 데이터**입니다. 실서비스 연동 순서:

1. **마라톤 일정** — 마라톤온라인/마라톤GO 크롤링 → 정규화 → DB. (`MARATHONS` 대체)
2. **관광/맛집/축제 POI** — 한국관광공사 국문관광정보 OpenAPI (`KTO_SERVICE_KEY`, 서버 라우트에서 호출)
3. **산책 코스(M4)** — 두루누비 정보 서비스
4. **웰니스(회복형)** — 웰니스 관광정보 서비스
5. **지도/이동시간** — 카카오맵 SDK(완료) + 카카오 모빌리티 길찾기 API
6. 추천 엔진(`buildItinerary`)은 데이터 소스와 무관하게 그대로 재사용.
