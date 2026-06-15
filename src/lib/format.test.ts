import { describe, it, expect } from 'vitest'
import { fmtPhone, fmtNumber } from './format'

describe('fmtPhone', () => {
  it('010 번호에 하이픈을 붙인다', () => {
    expect(fmtPhone('01012345678')).toBe('010-1234-5678')
  })
  it('이미 하이픈이 있는 값도 정규화한다', () => {
    expect(fmtPhone('010-1234-5678')).toBe('010-1234-5678')
  })
  it('02 번호를 올바르게 포맷한다', () => {
    expect(fmtPhone('0212345678')).toBe('02-1234-5678')
  })
  it('null/undefined → 빈 문자열', () => {
    expect(fmtPhone(null)).toBe('')
    expect(fmtPhone(undefined)).toBe('')
    expect(fmtPhone('')).toBe('')
  })
})

describe('fmtNumber', () => {
  it('숫자에 천단위 콤마를 붙인다', () => {
    expect(fmtNumber(1234567)).toBe('1,234,567')
  })
  it('문자열 숫자도 처리한다', () => {
    expect(fmtNumber('9876')).toBe('9,876')
  })
  it('0은 "0"을 반환한다', () => {
    expect(fmtNumber(0)).toBe('0')
  })
  it('null/undefined → 빈 문자열', () => {
    expect(fmtNumber(null)).toBe('')
    expect(fmtNumber(undefined)).toBe('')
    expect(fmtNumber('')).toBe('')
  })
  it('숫자가 아닌 문자열은 그대로 반환한다', () => {
    expect(fmtNumber('abc')).toBe('abc')
  })
})
