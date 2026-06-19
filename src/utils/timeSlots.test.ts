import { describe, it, expect } from 'vitest'
import { remapTimeSub } from './timeSlots'

describe('remapTimeSub', () => {
  it("remaps full-coverage time_sub to the destination slot's own hours", () => {
    expect(remapTimeSub('10-12', '10~11', '14-16')).toBe('14~15')
  })

  it("remaps first-half time_sub to the destination slot's first half", () => {
    expect(remapTimeSub('10-12', '10', '14-16')).toBe('14')
  })

  it("remaps second-half time_sub to the destination slot's second half", () => {
    expect(remapTimeSub('10-12', '11', '14-16')).toBe('15')
  })

  it('defaults to full coverage of the destination when the source had no time_sub (e.g. copied from a 1-hour slot)', () => {
    expect(remapTimeSub('13-14', null, '10-12')).toBe('10~11')
    expect(remapTimeSub('13-14', undefined, '10-12')).toBe('10~11')
  })

  it('returns undefined when the destination slot is not a 2-hour slot', () => {
    expect(remapTimeSub('10-12', '10~11', '12-13')).toBeUndefined()
    expect(remapTimeSub('10-12', null, '12-13')).toBeUndefined()
  })
})
