// 종목 표준화 — 원천의 다양한 표기를 ['5K','10K','하프','풀'] 4종으로 정규화.
//  풀/full/42 → '풀', 하프/half/21 → '하프', 10k → '10K', 그 외 → '5K'.
export function stdEvent(raw) {
  const s = String(raw || '').toLowerCase().replace(/\s/g, '')
  if (s.includes('풀') || s.includes('full') || s.includes('42')) return '풀'
  if (s.includes('하프') || s.includes('half') || s.includes('21')) return '하프'
  if (s.includes('10k') || s.includes('10km') || /(^|[^0-9])10([^0-9]|$)/.test(s)) return '10K'
  return '5K'
}

// 배열 → 표준 종목 배열(중복 제거, 풀>하프>10K>5K 순서 유지).
export function stdEvents(list) {
  const order = ['풀', '하프', '10K', '5K']
  const set = new Set((list || []).map(stdEvent))
  return order.filter((e) => set.has(e))
}
