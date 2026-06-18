import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 모바일 우선 단일 서피스 웹앱. lib/runninggu 는 UI 비종속 순수 모듈.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5180 },
})
