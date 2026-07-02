# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Planning + implementation repo for **런닝구(區)** ("RunTrip"), a submission for the **2026 관광데이터 활용 공모전** (Korea Tour Data contest, co-hosted by Kakao). The service is a nationwide marathon calendar plus an event-type/stay/theme-aware travel-itinerary recommender for runners.

**The master spec is `SPEC.md` at the repo root** (2026-07-02) — it defines the target UX, data contracts, and the verified external-API usage. Read it first for any product/data question.

The repo mixes runnable code with a large body of reference documentation. Most files are Korean-language docs; the code lives in three places:

- `design/` — Vite + React mobile-first prototype. **This is the reference UX** the final product follows (multi-screen wizard: home→race→plan→taste→stay→result, plus trips/courses tabs; recommendation engine in `src/lib/runninggu/`).
- `web/` — Next.js 14 (App Router) frontend, the older desktop demo. Kept for reference; superseded by `design/`.
- `backend/` — standalone Python data-pipeline scripts (crawl-CSV → normalized JSON, geocoding).

Everything else is reference/collateral: `docs/` (VisitKorea/KTO OpenAPI catalog + per-API manuals), `Kakao/` (Kakao API catalog, manuals, and feature→API mapping), `assets/` (raw manual ZIPs, contest files), `data/` (sample CSV/JSON), `submissions/` (proposal docs), `tools/` (a PowerShell script that regenerated the API manuals from the ZIPs).

## Commands

Design prototype (`design/`, the reference UX):
```bash
cd design
npm install
npm run dev        # http://localhost:5173 (Vite)
```
`design/.env` holds `VITE_KAKAO_MAP_KEY` (gitignored). Without it the app still fully works via the SVG-map + sample-POI fallback.

Legacy frontend (`web/`):
```bash
cd web
npm install
cp .env.local.example .env.local   # optional; add NEXT_PUBLIC_KAKAO_MAP_KEY for the map
npm run dev        # http://localhost:3000
npm run build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```
There is no test suite. The map works without a key — `KakaoMap` renders a marker-list fallback when `NEXT_PUBLIC_KAKAO_MAP_KEY` is absent.

Backend (`backend/`):
```bash
cd backend
pip install -r requirements.txt   # just `requests`
python build_races_json.py        # CSV → design/public/data/races.json (153 merged races; the design app's data)
python normalize_races.py ../data/races_sample.csv            # legacy web/ contract output
KAKAO_REST_KEY=... python normalize_races.py ../data/races_sample.csv --geocode   # + coordinates
python geocode.py "수원화성"       # ad-hoc geocode test
```
Geocoding needs the Kakao **REST** key (`KAKAO_REST_KEY`), which is different from the frontend's JavaScript key. `geocode.py` caches results in `geocode_cache.json` to respect Kakao's rate limit.

## Architecture — the data contract is the center of gravity

The single source of truth is **root `SPEC.md` §4**: the camelCase `Race` contract implemented by `design/src/lib/runninggu/normalize.js`, plus the shared `Poi` shape (`{name, lat, lng, desc, addr, url}`). The pipeline and frontend converge on `design/public/data/races.json` + `design/public/data/pois/{raceId}.json`. (The older `web/lib/types.ts` / `web/docs/DATA_SPEC.md` contract only applies inside `web/`.)

External-API ground truth (verified by live calls 2026-07-02, see SPEC.md §5): KTO **KorService2** (KorService1 is dead — HTTP 500), Durunubi (no coord search; parse `gpxpath` GPX), Wellness (works — but **only with the data.go.kr pair key**; the legacy hex key gets 403), Kakao Local/Mobility/Maps SDK all work with the keys in the local `.env` files. The KTO pair key has two forms: decoded (`KTO_SERVICE_KEY`, for libraries that URL-encode) and encoded (`KTO_SERVICE_KEY_ENC`, for raw URL concatenation). Festival search: use `lDongRegnCd` (new code system) — the legacy `areaCode` param silently returns 0 rows.

Target data flow (partially built):
```
crawl (marathon.pe.kr, marathongo)  ─→ normalize_races.py ─→ races.normalized.json (pois: [])
                                                                    │
KTO OpenAPI (국문관광·두루누비·웰니스) ─→ per-race radius POI match ──┤
                                                                    ▼
                                          merge → web/public/data/marathons.json → frontend
```
Currently the frontend runs on **dummy data** (`MARATHONS` in `web/lib/data.ts`). The handoff plan (DATA_SPEC §10): drop the generated JSON in `public/data/marathons.json` and swap what `lib/data.ts` exports — the recommendation engine and UI stay untouched.

### Frontend structure (`web/`)
- `app/page.tsx` — single-page shell. Holds all state (filter, selected race, tab, recommend input, itinerary, map focus) and derives map markers + route polyline. `KakaoMap` is `dynamic(..., { ssr: false })` because it touches `window`.
- `lib/recommend.ts` — `buildItinerary(marathon, input)` is the core differentiator: a **pure function** (no DOM/map deps) that turns event × stay × theme into a D-1 / D-day / D+1 timeline. It branches on `RECOVERY[event].noHard` — half/full marathons get recovery-oriented plans (spa, minimal walking), 5K/10K get normal sightseeing. Because it's pure and reads only `Marathon`, it works identically on dummy or real data.
- `lib/data.ts` — dummy `MARATHONS` plus the domain rule tables `RECOVERY` (per-event recovery rules), `CAT_LABEL`, `CAT_COLOR`. Keep these tables when replacing the dummy races.
- `components/` — `MarathonList` (M2 calendar/filters), `MarathonDetail` (M1/M3/M4 tabs), `KakaoMap`, `Chip`.
- `demo/index.html` — the original single-file HTML prototype, kept for reference only.

Feature codes used throughout the docs and components: **M1** itinerary recommender, **M2** marathon calendar, **M3** nearby festivals, **M4** Durunubi walking courses.

### Backend pipeline (`backend/`)
- `normalize_races.py` — CSV → `Marathon[]` JSON. Filters to target events (5K/10K/하프/풀, drops ultra), maps `has_*` flags → `events`, derives `status`, dedups by normalized-name + date, optionally geocodes venues, and emits `races.normalized.json` + `races.unresolved.json` (coords not found). `pois` is left `[]` — POIs are filled in the later KTO step. Temp fields are prefixed `_` and stripped before output.
- `geocode.py` — shared place-name/address → `(lat, lng)` util (Kakao Local API, keyword-search then address-search fallback). **Note the coordinate order gotcha:** Kakao returns `x`=lng, `y`=lat.

## Conventions
- `regionCode` must come from the fixed 17-region list in `DATA_SPEC.md` §3 (서울·인천·경기·… ·제주); it maps 1:1 to filter chips. `region` (display) can be more specific.
- Kakao keys split by surface: **JavaScript key** on the client (map, share, login) via `NEXT_PUBLIC_*`; **REST key** on the server (geocoding, Local, Mobility). See `Kakao/docs/api/runtrip-mapping.md` for the full feature→API→key matrix.
- Personal, non-committed output artifacts belong **outside** the repo in `RunTrip/output/`, not in the working tree.
- When looking up KTO/VisitKorea API params or operation names, search the converted manuals under `docs/api/manuals/` rather than the raw ZIPs in `assets/`.
