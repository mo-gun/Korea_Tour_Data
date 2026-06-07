"use client";

import { useEffect, useRef } from "react";
import { CAT_COLOR, CAT_LABEL } from "@/lib/data";
import type { PoiCat } from "@/lib/types";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  cat: PoiCat;
  n?: number;
}

interface Props {
  center: { lat: number; lng: number };
  level?: number; // 카카오맵 줌 레벨(작을수록 확대)
  markers: MapMarker[];
  routePath?: { lat: number; lng: number }[];
  /** 타임라인/리스트 항목 클릭 시 해당 좌표로 이동 (nonce로 매번 트리거) */
  focus?: { lat: number; lng: number; nonce: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (!KEY) return Promise.reject(new Error("NO_KEY"));
  if (typeof window !== "undefined" && window.kakao?.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("SDK_LOAD_FAIL"));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

function pinHtml(color: string, n?: number) {
  return `<div style="position:relative;transform:translate(-50%,-100%)">
    <div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;width:26px;height:26px;
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff">
      <span style="transform:rotate(45deg);font-size:12px;font-weight:700">${n ?? ""}</span>
    </div></div>`;
}

export default function KakaoMap({ center, level = 6, markers, routePath, focus }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);

  // 지도 초기화
  useEffect(() => {
    let cancelled = false;
    loadSdk()
      .then(() => {
        if (cancelled || !ref.current) return;
        const kakao = window.kakao;
        mapRef.current = new kakao.maps.Map(ref.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
        });
      })
      .catch(() => {
        /* 키 없음/로드 실패 → 폴백 UI가 대신 렌더됨 */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마커·경로·중심 갱신
  useEffect(() => {
    const kakao = typeof window !== "undefined" ? window.kakao : null;
    const map = mapRef.current;
    if (!kakao?.maps || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach((m) => {
      const pos = new kakao.maps.LatLng(m.lat, m.lng);
      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: pinHtml(CAT_COLOR[m.cat], m.n),
        yAnchor: 1,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
      bounds.extend(pos);
    });

    if (routePath && routePath.length > 1) {
      const path = routePath.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
      const line = new kakao.maps.Polyline({
        path,
        strokeWeight: 3,
        strokeColor: "#0f7b6c",
        strokeOpacity: 0.6,
        strokeStyle: "dash",
      });
      line.setMap(map);
      overlaysRef.current.push(line);
    }

    if (markers.length > 1) {
      map.setBounds(bounds, 40, 40, 40, 40);
    } else {
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
      map.setLevel(level);
    }
  }, [markers, routePath, center, level]);

  // 항목 클릭 시 포커스 이동
  useEffect(() => {
    const kakao = typeof window !== "undefined" ? window.kakao : null;
    const map = mapRef.current;
    if (!kakao?.maps || !map || !focus) return;
    map.panTo(new kakao.maps.LatLng(focus.lat, focus.lng));
    map.setLevel(4);
  }, [focus]);

  // 키 없을 때 폴백
  if (!KEY) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#eef2f3] p-6">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="font-bold text-ink mb-2">카카오맵 키가 필요해요</h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            <code className="bg-white px-1.5 py-0.5 rounded">.env.local</code> 에{" "}
            <code className="bg-white px-1.5 py-0.5 rounded">NEXT_PUBLIC_KAKAO_MAP_KEY</code> 를 넣으면
            지도가 표시됩니다. (developers.kakao.com → JavaScript 키)
          </p>
          <div className="text-left bg-white rounded-xl p-4 max-h-72 overflow-y-auto">
            <p className="text-xs font-bold text-muted mb-2">현재 표시될 위치 {markers.length}곳</p>
            {markers.map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1 text-sm">
                <span
                  className="inline-block w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                  style={{ background: CAT_COLOR[m.cat] }}
                >
                  {m.n ?? "•"}
                </span>
                <span className="text-xs text-muted">[{CAT_LABEL[m.cat]}]</span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="h-full w-full" />;
}
