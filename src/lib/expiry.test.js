import { describe, it, expect } from 'vitest'
import { getExpiryStatus } from './expiry.js'

// Fixed "today" so tests don't depend on the real date
const today = new Date(2026, 9, 12) // 12 Oct 2026

describe('getExpiryStatus', () => {
  it('marks a past month as expired', () => {
    expect(getExpiryStatus('2026-09', today).status).toBe('expired')
    expect(getExpiryStatus('2024-01', today).status).toBe('expired')
  })

  it('treats the expiry month as valid until its last day', () => {
    // EXP 10/2026 is still usable on 12 Oct 2026, but only 19 days remain
    const result = getExpiryStatus('2026-10', today)
    expect(result.status).toBe('soon')
    expect(result.daysLeft).toBe(19)
  })

  it('marks the day after the last day of the month as expired', () => {
    expect(getExpiryStatus('2026-10', new Date(2026, 10, 1)).status).toBe('expired')
  })

  it('marks dates within 30 days as expiring soon', () => {
    // EXP 11/2026 ends 30 Nov: 31 days from 30 Oct is too far, 30 days from 31 Oct is soon
    expect(getExpiryStatus('2026-11', new Date(2026, 9, 30)).status).toBe('ok')
    expect(getExpiryStatus('2026-11', new Date(2026, 9, 31)).status).toBe('soon')
  })

  it('marks dates further out as ok', () => {
    const result = getExpiryStatus('2027-06', today)
    expect(result.status).toBe('ok')
    expect(result.daysLeft).toBeGreaterThan(30)
  })

  it('returns unknown for a missing date', () => {
    expect(getExpiryStatus(null, today).status).toBe('unknown')
    expect(getExpiryStatus(undefined, today).status).toBe('unknown')
    expect(getExpiryStatus('', today).status).toBe('unknown')
  })

  it('returns unknown for malformed dates instead of guessing', () => {
    expect(getExpiryStatus('10/2026', today).status).toBe('unknown')
    expect(getExpiryStatus('2026-13', today).status).toBe('unknown')
    expect(getExpiryStatus('soon', today).status).toBe('unknown')
  })
})
