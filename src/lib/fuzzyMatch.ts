export interface FuzzyMatchCandidate {
  id: string
  name: string
}

export interface FuzzyMatchResult {
  id: string
  name: string
  score: number // 0~1, 1이 완전 일치
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const d: number[][] = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)])
  for (let j = 0; j < cols; j++) d[0][j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    }
  }
  return d[rows - 1][cols - 1]
}

/** 이름 후보 목록에서 query와 비슷한 순으로 정렬해 반환한다 (점수 0.3 이하는 제외). */
export function fuzzyMatchName(query: string, candidates: FuzzyMatchCandidate[]): FuzzyMatchResult[] {
  const q = normalize(query)
  if (!q) return []
  const results = candidates.map(c => {
    const n = normalize(c.name)
    let score: number
    if (!n) score = 0
    else if (n === q) score = 1
    else if (n.includes(q) || q.includes(n)) score = 0.85
    else {
      const dist = levenshtein(q, n)
      const maxLen = Math.max(q.length, n.length) || 1
      score = Math.max(0, 1 - dist / maxLen)
    }
    return { id: c.id, name: c.name, score }
  })
  return results.filter(r => r.score > 0.3).sort((a, b) => b.score - a.score)
}
