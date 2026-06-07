"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MarathonList, { type ListFilter } from "@/components/MarathonList";
import MarathonDetail from "@/components/MarathonDetail";
import { MARATHONS } from "@/lib/data";
import { buildItinerary } from "@/lib/recommend";
import type { Marathon, RecommendInput, ItineraryDay } from "@/lib/types";
import type { MapMarker } from "@/components/KakaoMap";

// window(카카오 SDK) 의존 → SSR 비활성화
const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

export default function Home() {
  const [filter, setFilter] = useState<ListFilter>({
    region: "전체", month: "전체", event: "전체", openOnly: false,
  });
  const [selected, setSelected] = useState<Marathon | null>(null);
  const [tab, setTab] = useState<"m1" | "m3" | "m4">("m1");
  const [input, setInput] = useState<RecommendInput>({ event: "10K", stay: "1박2일", theme: "관광지" });
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; nonce: number } | undefined>();

  function handleSelect(m: Marathon) {
    setSelected(m);
    setTab("m1");
    setInput({ event: m.events[0], stay: "1박2일", theme: "관광지" });
    setItinerary(null);
  }
  function handleInput<K extends keyof RecommendInput>(k: K, v: RecommendInput[K]) {
    setInput((p) => ({ ...p, [k]: v }));
    setItinerary(null);
  }
  function handleGenerate() {
    if (selected) setItinerary(buildItinerary(selected, input));
  }
  function handleFocus(lat: number | null, lng: number | null) {
    if (lat != null && lng != null) setFocus({ lat, lng, nonce: Date.now() });
  }

  // ── 필터된 대회 (지도 마커 계산용 — MarathonList 내부 필터와 동일)
  const filtered = MARATHONS.filter(
    (m) =>
      (filter.region === "전체" || m.regionCode === filter.region) &&
      (filter.month === "전체" || m.month === filter.month) &&
      (filter.event === "전체" || m.events.includes(filter.event)) &&
      (!filter.openOnly || m.status !== "closed"),
  );

  // ── 지도 마커 / 경로 계산
  let markers: MapMarker[] = [];
  let routePath: { lat: number; lng: number }[] | undefined;
  let center = { lat: 36.5, lng: 127.8 };
  let level = 13;

  if (!selected) {
    markers = filtered.map((m) => ({ lat: m.lat, lng: m.lng, label: m.name, cat: "race" }));
  } else {
    center = { lat: selected.lat, lng: selected.lng };
    level = 6;
    markers = [{ lat: selected.lat, lng: selected.lng, label: `${selected.name} (대회장)`, cat: "race" }];

    if (tab === "m1" && itinerary) {
      let n = 0;
      const stops: { lat: number; lng: number }[] = [];
      itinerary.forEach((d) =>
        d.blocks.forEach((b) => {
          if (b.lat != null && b.lng != null && !(b.lat === selected.lat && b.lng === selected.lng)) {
            n += 1;
            markers.push({ lat: b.lat, lng: b.lng, label: b.title, cat: b.cat ?? "tour", n });
            stops.push({ lat: b.lat, lng: b.lng });
          }
        }),
      );
      if (stops.length) routePath = [{ lat: selected.lat, lng: selected.lng }, ...stops];
    } else if (tab === "m3") {
      selected.pois
        .filter((p) => p.cat === "festival")
        .forEach((f, i) => markers.push({ lat: f.lat, lng: f.lng, label: f.name, cat: "festival", n: i + 1 }));
    } else if (tab === "m4") {
      selected.pois
        .filter((p) => p.cat === "course")
        .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0))
        .forEach((c, i) => markers.push({ lat: c.lat, lng: c.lng, label: c.name, cat: "course", n: i + 1 }));
    }
  }

  return (
    <main className="h-screen flex flex-col">
      {/* 헤더 */}
      <header className="h-[58px] flex items-center gap-3 px-[18px] bg-white border-b border-line shrink-0 z-[1000]">
        <div className="text-xl font-extrabold text-brand tracking-tight">
          런닝<span className="text-accent">區</span>
        </div>
        <div className="text-[12.5px] text-muted">내가 뛸 동네를 가장 잘 아는 친구</div>
        <div className="ml-auto text-[11px] bg-[#fff3ec] text-accent border border-[#ffd9c7] px-[9px] py-1 rounded-full font-semibold">
          DEMO · 더미 데이터
        </div>
      </header>

      {/* 본문 */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-[420px] min-w-[420px] h-full overflow-y-auto bg-white border-r border-line sidebar-scroll">
          {selected ? (
            <MarathonDetail
              marathon={selected}
              tab={tab}
              onTab={setTab}
              input={input}
              onInput={handleInput}
              itinerary={itinerary}
              onGenerate={handleGenerate}
              onBack={() => setSelected(null)}
              onFocusPoi={handleFocus}
            />
          ) : (
            <MarathonList filter={filter} onFilterChange={setFilter} onSelect={handleSelect} />
          )}
        </aside>
        <div className="flex-1 h-full">
          <KakaoMap center={center} level={level} markers={markers} routePath={routePath} focus={focus} />
        </div>
      </div>
    </main>
  );
}
