"use client";

import Chip from "./Chip";
import { RECOVERY, CAT_LABEL } from "@/lib/data";
import type {
  Marathon, EventType, StayType, ThemeType,
  RecommendInput, ItineraryDay, PoiCat,
} from "@/lib/types";

interface Props {
  marathon: Marathon;
  tab: "m1" | "m3" | "m4";
  onTab: (t: "m1" | "m3" | "m4") => void;
  input: RecommendInput;
  onInput: <K extends keyof RecommendInput>(k: K, v: RecommendInput[K]) => void;
  itinerary: ItineraryDay[] | null;
  onGenerate: () => void;
  onBack: () => void;
  onFocusPoi: (lat: number | null, lng: number | null) => void;
}

const CAT_BADGE: Record<PoiCat, string> = {
  food: "bg-[#fff0e8] text-[#d9622b]",
  tour: "bg-[#e8f0ff] text-[#2b62d9]",
  wellness: "bg-[#f0e8ff] text-[#7c3aed]",
  course: "bg-[#e8fff4] text-[#0f9d63]",
  festival: "bg-[#ffe8f3] text-[#d92b7a]",
  race: "bg-[#ffe9e9] text-[#d92b2b]",
};
const DAY_BG = { d1: "bg-day-d1", dday: "bg-day-dday", dplus: "bg-day-dplus" } as const;
const LEVEL_COLOR: Record<string, string> = { 쉬움: "#1a8a3f", 보통: "#c2790b", 어려움: "#d92b2b" };

export default function MarathonDetail({
  marathon: m, tab, onTab, input, onInput, itinerary, onGenerate, onBack, onFocusPoi,
}: Props) {
  const stays: StayType[] = ["당일치기", "1박2일", "2박3일"];
  const themes: ThemeType[] = ["관광지", "맛집", "웰니스", "자연", "역사유적"];
  const festivals = m.pois.filter((p) => p.cat === "festival");
  const courses = m.pois.filter((p) => p.cat === "course").sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));

  return (
    <div>
      {/* 헤더 */}
      <div className="px-[18px] py-4 border-b border-line sticky top-0 bg-white z-10">
        <button onClick={onBack} className="text-[12.5px] text-muted hover:text-brand mb-2 flex items-center gap-1">
          ← 캘린더로
        </button>
        <h3 className="text-[15.5px] font-bold m-0">{m.name}</h3>
        <div className="text-[12.5px] text-muted mt-1">📍 {m.region} · {m.date} · 출발 {m.startTime}</div>
        <div className="text-[10.5px] text-[#aab2b8] mt-1.5">🎽 비브픽업: {m.bib}</div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-line bg-white sticky top-0 z-[9]">
        {([["m1", "동선 추천"], ["m3", "인근 축제"], ["m4", "산책 코스"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => onTab(k)}
            className={`flex-1 text-center py-3 px-1 text-[12.5px] font-semibold border-b-2 ${
              tab === k ? "text-brand border-brand" : "text-muted border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-[18px] py-4">
        {/* M1 동선 추천 */}
        {tab === "m1" && (
          <>
            <div className="mb-[13px]">
              <div className="text-xs font-bold mb-1.5">종목</div>
              <div className="flex flex-wrap gap-1.5">
                {m.events.map((e: EventType) => (
                  <Chip key={e} label={e} active={input.event === e} onClick={() => onInput("event", e)} />
                ))}
              </div>
            </div>
            <div className="mb-[13px]">
              <div className="text-xs font-bold mb-1.5">체류 형태</div>
              <div className="flex flex-wrap gap-1.5">
                {stays.map((s) => (
                  <Chip key={s} label={s} active={input.stay === s} onClick={() => onInput("stay", s)} />
                ))}
              </div>
            </div>
            <div className="mb-[13px]">
              <div className="text-xs font-bold mb-1.5">선호 테마</div>
              <div className="flex flex-wrap gap-1.5">
                {themes.map((t) => (
                  <Chip key={t} label={t} active={input.theme === t} onClick={() => onInput("theme", t)} />
                ))}
              </div>
            </div>
            <button
              onClick={onGenerate}
              className="w-full py-3 rounded-[11px] bg-brand hover:bg-brand-light text-white text-sm font-bold mt-1"
            >
              🗺️ 맞춤 동선 추천받기
            </button>

            {itinerary ? (
              <div className="mt-[18px]">
                <div className="text-xs text-muted bg-[#f5f7f8] rounded-[10px] px-[13px] py-[11px] leading-relaxed mb-[14px]">
                  <b>{input.event} 컨디션 룰</b> · 회복강도: {RECOVERY[input.event].intensity}
                  <br />D-1 권장 보행 {RECOVERY[input.event].walk} · {RECOVERY[input.event].dplus}
                </div>
                {itinerary.map((d, di) => (
                  <div key={di} className="mb-[18px]">
                    <span className={`inline-block text-[11.5px] font-bold text-white px-[11px] py-[3px] rounded-full mb-1 ${DAY_BG[d.cls]}`}>
                      {d.label}
                    </span>
                    <div className="text-[11.5px] text-muted mt-0.5 mb-[10px]">{d.note}</div>
                    <div className="tl">
                      {d.blocks.map((b, bi) => (
                        <div
                          key={bi}
                          onClick={() => onFocusPoi(b.lat, b.lng)}
                          className="relative mb-3 cursor-pointer group"
                        >
                          <div className="text-[11.5px] text-brand font-bold">{b.time}</div>
                          <div className="text-[13.5px] font-semibold my-px group-hover:text-brand">
                            {b.title}
                            {b.cat && (
                              <span className={`text-[10px] px-1.5 py-px rounded ml-1.5 align-middle ${CAT_BADGE[b.cat]}`}>
                                {CAT_LABEL[b.cat]}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted leading-snug">{b.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted bg-[#f5f7f8] rounded-[10px] px-[13px] py-[11px] leading-relaxed mt-4">
                종목·체류·테마를 고르고 버튼을 누르면 D-1 → D-day → D+1 타임라인이 지도 위에 그려집니다.
              </div>
            )}
          </>
        )}

        {/* M3 인근 축제 */}
        {tab === "m3" && (
          <>
            <div className="text-xs text-muted bg-[#f5f7f8] rounded-[10px] px-[13px] py-[11px] leading-relaxed mb-3">
              대회 일정·반경 기준 동시 개최되는 축제·행사예요. 마커를 눌러 위치를 확인하세요.
            </div>
            {festivals.map((f, i) => (
              <div key={i} onClick={() => onFocusPoi(f.lat, f.lng)} className="border border-line rounded-[11px] p-3 mb-[9px] cursor-pointer hover:border-brand-light hover:bg-[#fafdfc]">
                <h4 className="text-sm font-bold m-0">🎉 {f.name}</h4>
                <p className="text-xs text-muted mt-1">{f.desc}</p>
                <div className="text-[11px] text-brand font-semibold mt-1.5">대회 주말 동시 개최</div>
              </div>
            ))}
            {festivals.length === 0 && <div className="text-xs text-muted">등록된 인근 축제가 없어요.</div>}
          </>
        )}

        {/* M4 산책 코스 */}
        {tab === "m4" && (
          <>
            <div className="text-xs text-muted bg-[#f5f7f8] rounded-[10px] px-[13px] py-[11px] leading-relaxed mb-3">
              두루누비 데이터 기반 걷기·회복런 코스 (거리·난이도별). 대회 전 컨디션 조절이나 비(非)대회 여행 중에도 활용하세요.
            </div>
            {courses.map((c, i) => (
              <div key={i} onClick={() => onFocusPoi(c.lat, c.lng)} className="border border-line rounded-[11px] p-3 mb-[9px] cursor-pointer hover:border-brand-light hover:bg-[#fafdfc]">
                <h4 className="text-sm font-bold m-0">🥾 {c.name}</h4>
                <p className="text-xs text-muted mt-1">{c.desc}</p>
                <div className="text-[11px] text-brand font-semibold mt-1.5">
                  {c.dist}km · <span style={{ color: LEVEL_COLOR[c.level ?? ""] }}>{c.level}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
