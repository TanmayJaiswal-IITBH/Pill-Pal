import { describe, it, expect } from 'vitest'
import { buildSpeech, describeExpiry } from './explain.js'

const today = new Date(2026, 9, 17) // 17 Oct 2026

const data = {
  name: 'Paracetamol',
  strength: '500 mg',
  expiry_date: '2027-06',
  purpose: 'For fever and mild pain',
  how_to_take: 'Take one tablet with water.',
  warnings: ['Do not take more than the label says', 'Keep away from children.'],
  confidence: 'high',
}

describe('describeExpiry', () => {
  it('uses the computed status, not the AI', () => {
    expect(describeExpiry('2027-06', 'en', today)).toMatchObject({ status: 'ok', label: 'OK to use until the end of June 2027' })
    expect(describeExpiry('2026-10', 'en', today).status).toBe('soon')
    expect(describeExpiry('2013-03', 'en', today)).toMatchObject({ status: 'expired', label: 'EXPIRED, do not take' })
    expect(describeExpiry(null, 'en', today)).toMatchObject({ status: 'unknown', label: 'Check the date on the pack' })
  })
})

describe('buildSpeech', () => {
  it('reads every part in order and ends with the disclaimer', () => {
    expect(buildSpeech(data, 'en', today)).toBe(
      'Paracetamol. Strength: 500 mg. What it is for: For fever and mild pain. ' +
        'How to take it: Take one tablet with water. ' +
        'Warnings: Do not take more than the label says. Keep away from children. ' +
        'It is in date until the end of June 2027. ' +
        'This is general information. Always follow your prescription and check with your doctor or pharmacist.',
    )
  })

  it('skips empty fields and warns loudly about expired medicine', () => {
    const speech = buildSpeech({ ...data, strength: '', purpose: '', warnings: [], expiry_date: '2025-01' }, 'en', today)
    expect(speech).not.toContain('Strength')
    expect(speech).not.toContain('Warnings')
    expect(speech).toContain('Do not take it.')
  })
})
