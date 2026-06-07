"use client";

import { useMemo } from "react";
import Chip from "./Chip";
import { MARATHONS } from "@/lib/data";
import type { Marathon, EventType } from "@/lib/types";

export interface ListFilter {
  region: string;
  month: number | "전체";
  event: EventType | "전체";
  openOnly: boolean;
}

interface Props {
  filter: ListFilter;
  onFilterChange: (f: ListFilter) => void;
  onSelect: (m: Marathon) => void;
}

const STATUS_MAP: Record<Marathon["status"], { cls: string; label: string }> = {
  open: { cls: "bg-[#e7f6ec] text-[#1a8a3f]", label: "접수중" },
  soon: { cls: "bg-[#fff4e5] text-[#c2790b]", label: "접수예정" },
  closed: { cls: "bg-[#f1f1f1] text-[#999]", label: "마감" },
};

export default function MarathonList({ filter, onFilterChange, onSelect }: Props) {
  const regions = useMemo(
    () => ["전체", ...Array.from(new Set(MARATHONS.map((m) => m.regionCode)))],
    [],
  );
  const months: (number | "전체")[] = ["전체", 9, 10, 11];
  const events: (EventType | "전체")[] = ["전체", "5K", "10K", "하프", "풀"];

  const list = MARATHONS.filter(
    (m) =>
      (filter.region === "전체" || m.regionCode === filter.region) &&
      (filter.month === "전체" || m.month === filter.month) &&
      (filter.event === "전체" || m.events.includes(filter.event)) &&
      (!filter.openOnly || m.status !== "closed"),
  );

  return (
    <div className="px-[18px] py-4">
      <p className="text-[13px] font-bold text-muted mb-[10px] uppercase tracking-wide">
        M2 · 전국 마라톤 통합 캘린더
      </p>

      <div className="text-[11px] text-muted mb-1">지역</div>
      <div className="flex flex-wrap gap-1.5 mb-[10px]">
        {regions.map((r) => (
          <Chip key={r} label={r} active={filter.region === r} onClick={() => onFilterChange({ ...filter, region: r })} />
        ))}
      </div>

      <div className="text-[11px] text-muted mb-1">월</div>
      <div className="flex flex-wrap gap-1.5 mb-[10px]">
        {months.map((mo) => (
          <Chip key={mo} label={mo === "전체" ? "전체" : `${mo}월`} active={filter.month === mo} onClick={() => onFilterChange({ ...filter, month: mo })} />
        ))}
      </div>

      <div className="text-[11px] text-muted mb-1">종목</div>
      <div className="flex flex-wrap gap-1.5 mb-[10px]">
        {events.map((e) => (
          <Chip key={e} label={e} active={filter.event === e} onClick={() => onFilterChange({ ...filter, event: e })} />
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-1.5">
        <Chip label="접수 가능만" active={filter.openOnly} onClick={() => onFilterChange({ ...filter, openOnly: !filter.openOnly })} />
      </div>

      <p className="text-[13px] font-bold text-muted my-2 uppercase tracking-wide">{list.length}개 대회</p>

      {list.length === 0 && (
        <div className="text-xs text-muted bg-[#f5f7f8] rounded-[10px] px-[13px] py-[11px] leading-relaxed">
          조건에 맞는 대회가 없어요. 필터를 바꿔보세요.
        </div>
      )}

      {list.map((m) => {
        const st = STATUS_MAP[m.status];
        return (
          <div
            key={m.id}
            onClick={() => onSelect(m)}
            className="border border-line rounded-[14px] p-[14px] mb-[10px] cursor-pointer bg-white transition hover:border-brand-light hover:shadow-[0_4px_14px_rgba(15,123,108,.08)] hover:-translate-y-px"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-[15.5px] font-bold m-0">{m.name}</h3>
              <span className="text-[12.5px] text-brand font-semibold whitespace-nowrap">{m.date.slice(5).replace("-", "/")}</span>
            </div>
            <div className="text-[12.5px] text-muted mt-1 mb-2">📍 {m.region}</div>
            <div className="flex justify-between items-center">
              <div className="flex gap-1.5 flex-wrap">
                {m.events.map((e) => (
                  <span key={e} className="text-[11px] bg-[#eef6f4] text-brand px-2 py-0.5 rounded-md font-semibold">{e}</span>
                ))}
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${st.cls}`}>{st.label}</span>
            </div>
            <div className="text-[10.5px] text-[#aab2b8] mt-[9px]">🔗 출처: {m.src} · 최근확인 {m.checked}</div>
          </div>
        );
      })}
    </div>
  );
}
