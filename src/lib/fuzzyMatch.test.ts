import { describe, it, expect } from 'vitest'
import { fuzzyMatchName } from './fuzzyMatch'

describe('fuzzyMatchName', () => {
  const candidates = [
    { id: '1', name: '홍길동' },
    { id: '2', name: '김철수' },
    { id: '3', name: '홍길순' },
  ]

  it('exact match scores 1 and ranks first', () => {
    const results = fuzzyMatchName('홍길동', candidates)
    expect(results[0]).toMatchObject({ id: '1', score: 1 })
  })

  it('similar names both surface, ranked by closeness', () => {
    const results = fuzzyMatchName('홍길동', candidates)
    const ids = results.map(r => r.id)
    expect(ids).toContain('1')
    expect(ids).toContain('3')
    expect(results.findIndex(r => r.id === '1')).toBeLessThan(results.findIndex(r => r.id === '3'))
  })

  it('unrelated name is excluded', () => {
    const results = fuzzyMatchName('홍길동', candidates)
    expect(results.some(r => r.id === '2')).toBe(false)
  })

  it('empty query returns no results', () => {
    expect(fuzzyMatchName('  ', candidates)).toEqual([])
  })
})
