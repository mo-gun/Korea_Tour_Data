"""
normalize_races.py — 건모 크롤링 CSV → 런닝구 Marathon[] JSON 변환

하는 일:
  1) 건모 races_sample.csv 읽기
  2) 우리 타깃만 필터 (5K/10K/하프/풀 중 하나라도 있는 대회. 울트라/초장거리 제외)
  3) DATA_SPEC의 Marathon 형식으로 매핑 (pois는 빈 배열 — POI는 KTO 단계에서 채움)
  4) venue → 좌표 지오코딩 (geocode.py 사용, --geocode 옵션)
  5) 대회명+날짜로 중복 제거
  6) races.normalized.json (좌표 OK) + races.unresolved.json (좌표 실패) 출력

사용:
  python normalize_races.py races_sample.csv                 # 좌표 없이 구조만 변환(빠름)
  KAKAO_REST_KEY=... python normalize_races.py races_sample.csv --geocode   # 좌표까지

출력:
  races.normalized.json   ← 프론트 marathons.json의 마라톤 부분 (pois 비어있음)
  races.unresolved.json   ← 좌표 못 찾은 대회 (수동 확인용)
"""

from __future__ import annotations
import csv, json, re, sys
from datetime import date
from pathlib import Path

# ── 시도 전체명 → regionCode(17개 고정목록) ──────────────────────
SIDO_TO_CODE = {
    "서울특별시": "서울", "인천광역시": "인천", "부산광역시": "부산",
    "대구광역시": "대구", "대전광역시": "대전", "광주광역시": "광주",
    "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
    "강원특별자치도": "강원", "강원도": "강원",
    "충청북도": "충북", "충청남도": "충남",
    "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
    "경상북도": "경북", "경상남도": "경남",
    "제주특별자치도": "제주", "제주도": "제주",
}
VALID_CODES = set(SIDO_TO_CODE.values())
TODAY = date.today().isoformat()


def region_code(row: dict) -> str:
    """sido 전체명 우선, 없으면 region 짧은 값으로 코드 결정."""
    code = SIDO_TO_CODE.get(row.get("sido", "").strip())
    if code:
        return code
    short = row.get("region", "").strip()
    return short if short in VALID_CODES else short  # 미매칭은 원문 유지(검증에서 걸림)


def build_events(row: dict) -> list[str]:
    """has_* 불린 플래그 → 표준 종목 배열 (5K → 풀 순서)."""
    out = []
    if row.get("has_5k") == "True":   out.append("5K")
    if row.get("has_10k") == "True":  out.append("10K")
    if row.get("has_half") == "True": out.append("하프")
    if row.get("has_full") == "True": out.append("풀")
    return out


def status_of(row: dict) -> str:
    """reg_status + 대회일 기준 open/soon/closed 판정."""
    ev = row.get("event_date", "").strip()
    if ev and ev < TODAY:           # 이미 지난 대회
        return "closed"
    s = row.get("reg_status", "")
    if "마감" in s:   return "closed"
    if "접수중" in s: return "open"
    if "예정" in s or "미정" in s: return "soon"
    return "soon"


def norm_name(name: str) -> str:
    """중복판정용 정규화: 연도·제N회·공백·괄호 제거."""
    n = re.sub(r"\d{4}", "", name)
    n = re.sub(r"제?\s*\d+\s*회", "", n)
    n = re.sub(r"\(.*?\)", "", n)
    return re.sub(r"\s+", "", n).lower()


def to_marathon(row: dict) -> dict:
    code = region_code(row)
    venue = row.get("venue", "").strip()
    return {
        "id": row.get("race_id", "").strip(),
        "name": row.get("name", "").strip(),
        "region": f"{code} {venue}".strip(),
        "regionCode": code,
        "date": row.get("event_date", "").strip(),
        "month": int(row["event_date"][5:7]) if row.get("event_date") else 0,
        "lat": None, "lng": None,            # 지오코딩 단계에서 채움
        "status": status_of(row),
        "events": build_events(row),
        "bib": "대회 홈페이지 참고",
        "startTime": row.get("start_time", "").strip() or "미정",
        "src": row.get("source", "").strip(),
        "checked": row.get("last_checked", "").strip() or TODAY,
        "pois": [],
        # ── 지오코딩/검수용 임시 필드 (최종 JSON 전 제거) ──
        "_venue": venue,
        "_road": row.get("road_address", "").strip(),
        "_detail_url": row.get("detail_url", "").strip(),
    }


def main():
    args = sys.argv[1:]
    do_geo = "--geocode" in args
    paths = [a for a in args if not a.startswith("--")]
    if not paths:
        print("사용: python normalize_races.py <csv경로> [--geocode]"); sys.exit(1)
    csv_path = Path(paths[0])
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))

    # 1) 타깃 필터
    scoped = [r for r in rows if build_events(r)]

    # 2) 매핑
    marathons = [to_marathon(r) for r in scoped]

    # 3) 중복 제거 (대회명+날짜)
    seen, deduped = {}, []
    for m in marathons:
        key = (norm_name(m["name"]), m["date"])
        if key in seen:
            continue
        seen[key] = True
        deduped.append(m)

    # 4) 지오코딩
    resolved, unresolved = deduped, []
    if do_geo:
        from geocode import geocode
        resolved, unresolved = [], []
        for m in deduped:
            q = f'{m["regionCode"]} {m["_venue"]}'.strip()
            coord = geocode(m["_venue"]) or geocode(q) or (geocode(m["_road"]) if m["_road"] else None)
            if coord:
                m["lat"], m["lng"] = coord
                resolved.append(m)
            else:
                unresolved.append(m)

    # 5) 임시필드 정리 후 저장
    def clean(m):
        return {k: v for k, v in m.items() if not k.startswith("_")}

    out_dir = csv_path.parent
    (out_dir / "races.normalized.json").write_text(
        json.dumps([clean(m) for m in resolved], ensure_ascii=False, indent=2), encoding="utf-8")
    if unresolved:
        (out_dir / "races.unresolved.json").write_text(
            json.dumps(unresolved, ensure_ascii=False, indent=2), encoding="utf-8")

    # 6) 요약
    print(f"전체 {len(rows)}행 → 타깃 {len(scoped)}개 → 중복제거 {len(deduped)}개")
    if do_geo:
        print(f"좌표 성공 {len(resolved)} / 실패 {len(unresolved)}")
    else:
        print("(--geocode 안 줘서 좌표는 비어있음. 구조만 확인용)")
    print(f"→ {out_dir/'races.normalized.json'} 저장")
    print("\n=== 미리보기 (앞 3개) ===")
    for m in resolved[:3]:
        c = clean(m)
        print(f'- {c["name"]} | {c["date"]} | {c["regionCode"]} | {c["events"]} | {c["status"]} | lat={c["lat"]}')


if __name__ == "__main__":
    main()
