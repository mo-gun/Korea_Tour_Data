import { RECOVERY } from "./data";
import type {
  Marathon, Poi, PoiCat, ThemeType,
  ItineraryDay, ItineraryBlock, RecommendInput,
} from "./types";

/** 테마 우선 → 카테고리 폴백으로 POI 1개 선택 (이미 쓴 것은 제외) */
function pickPOI(m: Marathon, cat: PoiCat, theme: ThemeType, used: string[]): Poi | undefined {
  const pool = m.pois.filter((p) => p.cat === cat && !used.includes(p.name));
  const themed = pool.filter((p) => (p.themes ?? []).includes(theme));
  const chosen = themed[0] ?? pool[0];
  if (chosen) used.push(chosen.name);
  return chosen;
}

function block(
  time: string, title: string, detail: string,
  cat: PoiCat | null, poi?: Poi | Marathon,
): ItineraryBlock {
  return { time, title, detail, cat, lat: poi?.lat ?? null, lng: poi?.lng ?? null };
}

/**
 * 종목 × 체류 × 테마 → D-1 / D-day / D+1 타임라인 생성.
 * 제안서의 종목별 회복 룰을 반영한 순수 함수 (DOM/지도 의존 없음).
 */
export function buildItinerary(m: Marathon, input: RecommendInput): ItineraryDay[] {
  const { event, stay, theme } = input;
  const r = RECOVERY[event];
  const used: string[] = [];
  const days: ItineraryDay[] = [];

  // ── D-1 (대회 전날) — 당일치기 제외
  if (stay !== "당일치기") {
    const food = pickPOI(m, "food", theme, used);
    const walkCap = event === "풀" ? 3 : event === "하프" ? 5 : 8;
    const easyCourse =
      m.pois
        .filter((p) => p.cat === "course" && (p.dist ?? 99) <= walkCap)
        .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))[0] ??
      m.pois.find((p) => p.cat === "course");

    days.push({
      label: "D-1 · 대회 전날", cls: "d1",
      note: `도착 + 카보로딩 + 가벼운 산책 (권장 보행 ${r.walk})`,
      blocks: [
        block("15:00", "비브 픽업 / 도착", `대회장 인근 체크인 — ${m.bib}`, "race", m),
        block("17:30", "카보로딩 식사", food ? `${food.name} — ${food.desc}` : "지역 고탄수 로컬식", "food", food),
        block("19:00", "가벼운 산책",
          easyCourse ? `${easyCourse.name} ${easyCourse.dist}km(${easyCourse.level}) — 컨디션 조절` : "대회장 주변 평지",
          "course", easyCourse),
        block("21:30", "취침 권장 알림", "수면 7시간 이상 확보", null),
      ],
    });
    if (easyCourse) used.push(easyCourse.name);
  }

  // ── D-day (대회 당일)
  const ddayBlocks: ItineraryBlock[] = [
    block(m.startTime, `${event} 출발`, `${m.name} — ${event} 스타트`, "race", m),
    block("정오", "완주 · 짐찾기 · 샤워", "피니시라인 인근 코인샤워·짐보관 이용", null),
  ];
  if (event === "풀") {
    const w = pickPOI(m, "wellness", theme, used);
    ddayBlocks.push(block("14:00", "회복 집중 (도보 최소)", w ? `${w.name} — 냉온교차욕으로 젖산 제거` : "스파·온천 회복", "wellness", w));
    ddayBlocks.push(block("16:00", "휴식 · 귀가 준비", r.ddayPM, null));
  } else if (event === "하프") {
    const w = pickPOI(m, "wellness", theme, used);
    ddayBlocks.push(block("14:00", "온천·휴식", w ? `${w.name} — ${r.ddayPM}` : "온천·휴식", "wellness", w));
    const t = pickPOI(m, theme === "맛집" ? "food" : "tour", theme, used);
    if (t) ddayBlocks.push(block("16:00", theme === "맛집" ? "로컬 맛집" : "가벼운 관광", `${t.name} — ${t.desc}`, theme === "맛집" ? "food" : "tour", t));
  } else {
    // 5K · 10K
    const cat: PoiCat = theme === "맛집" ? "food" : theme === "웰니스" ? "wellness" : "tour";
    const t = pickPOI(m, cat, theme, used);
    ddayBlocks.push(block("14:00", r.ddayPM.includes("자유") ? "오후 자유 관광" : "오후 관광", t ? `${t.name} — ${t.desc}` : "지역 관광", cat, t));
    const fest = m.pois.find((p) => p.cat === "festival");
    if (fest) { ddayBlocks.push(block("17:00", "동시개최 축제 둘러보기", `${fest.name} — ${fest.desc}`, "festival", fest)); used.push(fest.name); }
    const food = pickPOI(m, "food", theme, used);
    if (food) ddayBlocks.push(block("19:00", "지역 맛집 저녁", `${food.name} — ${food.desc}`, "food", food));
  }
  days.push({ label: "D-day · 대회 당일", cls: "dday", note: r.ddayPM, blocks: ddayBlocks });

  // ── D+1 (회복 관광) — 2박3일만
  if (stay === "2박3일") {
    const dp: ItineraryBlock[] = [];
    if (r.noHard) {
      // 풀 · 하프 → 회복형
      const w = pickPOI(m, "wellness", theme, used) ?? m.pois.find((p) => p.cat === "wellness");
      dp.push(block("10:00", event === "풀" ? "스파 회복 (냉온교차)" : "온천·족욕", w ? `${w.name} — ${r.dplus}` : r.dplus, "wellness", w));
      if (event === "하프") {
        const c = m.pois
          .filter((p) => p.cat === "course" && p.level !== "어려움" && !used.includes(p.name))
          .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))[0];
        if (c) { dp.push(block("12:00", "짧은 산책 (고강도 제외)", `${c.name} ${c.dist}km(${c.level})`, "course", c)); used.push(c.name); }
      }
      const t = pickPOI(m, theme === "맛집" ? "food" : "tour", theme, used);
      if (t) dp.push(block("14:00", "정적 관광", `${t.name} — ${t.desc}`, theme === "맛집" ? "food" : "tour", t));
    } else {
      // 5K · 10K → 일반 관광
      const cat1: PoiCat = theme === "맛집" ? "food" : theme === "웰니스" ? "wellness" : "tour";
      const t1 = pickPOI(m, cat1, theme, used);
      if (t1) dp.push(block("10:00", "오전 관광", `${t1.name} — ${t1.desc}`, cat1, t1));
      const food = pickPOI(m, "food", theme, used);
      if (food) dp.push(block("12:30", "로컬 점심", `${food.name} — ${food.desc}`, "food", food));
      const t2 = pickPOI(m, "tour", theme, used);
      if (t2) dp.push(block("14:00", "오후 관광", `${t2.name} — ${t2.desc}`, "tour", t2));
    }
    dp.push(block("16:00", "체크아웃 · 귀가", r.dplus, null));
    days.push({ label: "D+1 · 회복 관광", cls: "dplus", note: r.dplus, blocks: dp });
  }

  return days;
}
