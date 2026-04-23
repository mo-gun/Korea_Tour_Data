# Korea Tour Data Contest Planning

2026 관광데이터 활용 공모전 준비를 위한 자료 정리 저장소입니다.

## Contents

- [공모전 공고 요약](docs/contest/notice-summary.md)
- [VisitKorea OpenAPI 카탈로그](docs/api/visitkorea-api-catalog.md)
- [VisitKorea API 추출 매뉴얼](docs/api/manuals)
- [초기 서비스/개발 구조 설계](docs/architecture.md)

## Attached Files

- 공고문 PDF: [assets/contest/2026-tour-data-contest-notice.pdf](assets/contest/2026-tour-data-contest-notice.pdf)
- 제안서 양식 HWP: [assets/contest/2026-tour-data-contest-proposal-template.hwp](assets/contest/2026-tour-data-contest-proposal-template.hwp)
- API 매뉴얼 ZIP: [assets/api-manuals](assets/api-manuals)
- API 목록 원본 JSON: [data/api/visitkorea-use-util-exercises.json](data/api/visitkorea-use-util-exercises.json)

## Current Direction

개발 환경은 Java/Spring Boot 기반을 우선 추천합니다. 공공데이터 OpenAPI 연동, 인증키 관리, 스케줄링, 캐싱, DB 저장, 배포 자동화까지 한국 공모전/공공 API 프로젝트에 잘 맞고 팀원 확보도 쉽습니다.

초기에는 문서 중심으로 API 후보와 공모전 조건을 정리했고, 다음 단계에서 실제 Spring Boot 프로젝트를 생성해 API 연동 모듈부터 구현하면 됩니다.
