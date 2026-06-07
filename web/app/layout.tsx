import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "런닝구(區) — 러닝 트리거 관광 서비스",
  description: "전국 마라톤 통합 캘린더 + 종목·체류·테마 맞춤 여행 동선 추천",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
