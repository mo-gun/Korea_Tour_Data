import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 모바일 우선 단일 서피스 웹앱. lib/runninggu 는 UI 비종속 순수 모듈.
export default defineConfig({
  plugins: [react()],
  // 5173 = 카카오 콘솔 Web 플랫폼에 등록된 도메인. strictPort로 포트 밀림(지도 도메인 불일치) 방지.
  server: { host: true, port: 5173, strictPort: true },
})
