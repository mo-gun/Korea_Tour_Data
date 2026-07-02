# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Planning + implementation repo for **런닝구(區)** ("RunTrip"), a submission for the **2026 관광데이터 활용 공모전** (Korea Tour Data contest, co-hosted by Kakao). The service is a nationwide marathon calendar plus an event-type/stay/theme-aware travel-itinerary recommender for runners.

The repo mixes runnable code with a large body of reference documentation. Most files are Korean-language docs; the code lives in two places:

- `web/` — Next.js 14 (App Router) frontend, the actual demo app.
- `backend/` — standalone Python data-pipeline scripts (crawl-CSV → normalized JSON, geocoding).

Everything else is reference/collateral: `docs/` (VisitKorea/KTO OpenAPI catalog + per-API manuals), `Kakao/` (Kakao API catalog, manuals, and feature→API mapping), `assets/` (raw manual ZIPs, contest files), `data/` (sample CSV/JSON), `submissions/` (proposal docs), `tools/` (a PowerShell script that regenerated the API manuals from the ZIPs).

## Commands

Frontend (`web/`):
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
python normalize_races.py ../data/races_sample.csv            # structure only, no coords (fast)
KAKAO_REST_KEY=... python normalize_races.py ../data/races_sample.csv --geocode   # + coordinates
python geocode.py "수원화성"       # ad-hoc geocode test
```
Geocoding needs the Kakao **REST** key (`KAKAO_REST_KEY`), which is different from the frontend's JavaScript key. `geocode.py` caches results in `geocode_cache.json` to respect Kakao's rate limit.

## Architecture — the data contract is the center of gravity

The single source of truth for the whole project is the `Marathon` / `Poi` TypeScript types in `web/lib/types.ts`. `web/docs/DATA_SPEC.md` documents them prose-style; **if the two disagree, the types win** — change types first, then update the doc. Both the Python pipeline and the frontend converge on one artifact: `web/public/data/marathons.json` (a `Marathon[]`).

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
