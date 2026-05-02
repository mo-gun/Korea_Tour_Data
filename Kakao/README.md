# Kakao API for RunTrip

런트립(RunTrip) 서비스 구축을 위해 카카오에서 제공하는 오픈 API/SDK를 정리한 저장소입니다. 2026 관광데이터 활용 공모전(카카오 공동 주최)에서 카카오 오픈 API 활용은 핵심 평가 요소이므로, 기획안의 "3) 데이터 활용 방안 — 한국관광공사 OpenAPI 활용 필수" 절을 구체화할 때 본 문서를 함께 사용합니다.

## Contents

- [Kakao API 카탈로그](docs/api/kakao-api-catalog.md) — 런트립에서 사용 예정인 카카오 API의 한 줄 요약, 매뉴얼, 신청 링크 일람
- [API별 상세 매뉴얼](docs/api/manuals) — 각 API의 인증·엔드포인트·파라미터·런트립 매핑
- [런트립 ↔ Kakao API 매핑](docs/api/runtrip-mapping.md) — 기획안 기능별로 어떤 카카오 API를 어디에 사용하는지

## 기준 문서

- 카카오 디벨로퍼스 메인 문서: <https://developers.kakao.com/docs/ko>
- 카카오 모빌리티 디벨로퍼스: <https://developers.kakaomobility.com/>
- 카카오페이 디벨로퍼스: <https://developers.kakaopay.com/>
- 수집일: 2026-05-02

## 분류 요약

| 분류 | API | 런트립 사용 시나리오 |
|---|---|---|
| **핵심** | 카카오맵 (JavaScript SDK) | 대회 코스 영역·POI·D-1/D-day/D+1 동선 시각화 |
| **핵심** | 카카오 모빌리티 길찾기 API | 숙소 ↔ 대회장 ↔ 관광지 실제 이동시간 계산 |
| **핵심** | 카카오 로그인 + 카카오싱크 | 원터치 회원가입·로그인 + 약관 동의 통합 |
| **추천** | 로컬 (Local) | 결승선 반경 사우나·짐보관·코인샤워·식당 검색, 주소-좌표 변환 |
| **추천** | 카카오내비 | 자체 SDK 외 카카오내비 앱으로 길안내 트리거 (D-day 대회장 이동) |
| **발전** | 카카오톡 공유 | 대회 카드/추천 일정의 카톡 공유 |
| **발전** | 카카오톡 메시지 | 대회 D-1·D-day 알림, "가볍게 뛸까요?" 추천 푸시 |
| **발전** | 카카오톡 채널 | 지자체·소상공인 마케팅 채널, 재방문 유도 |
| **발전** | 카카오페이 | 향후 경량 제휴·리워드 단계의 결제 |

> 핵심·추천: MVP 범위 / 발전: 발전 방향 단계.

## Current Direction

- 백엔드: Java 17 + Spring Boot 3.x — 카카오 모빌리티/로컬 REST API 호출은 서버에서, 카카오맵 JS SDK는 프론트(Next.js)에서 직접 사용
- 카카오 키 운영: JavaScript Key (지도/공유), REST API Key (로컬·모빌리티·로그인 토큰 교환·메시지)
- 보안: JavaScript Key는 도메인 등록 한정, REST API Key는 서버 IP 등록 / 환경변수 보관
