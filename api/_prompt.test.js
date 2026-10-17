import { describe, it, expect } from 'vitest'
import { buildPrompt, parseScanResult } from './_prompt.js'

const valid = {
  name: 'Paracetamol',
  strength: '500 mg',
  expiry_date: '2027-06',
  purpose: 'For fever and mild pain.',
  how_to_take: 'Take one tablet with water.',
  warnings: ['Do not take more than the label says.'],
  confidence: 'high',
}

describe('buildPrompt', () => {
  it('puts the language into the prompt', () => {
    const prompt = buildPrompt('Hindi')
    expect(prompt).toContain('Write every text field in Hindi')
    expect(prompt).not.toContain('{LANGUAGE}')
    expect(prompt).toContain('do not guess')
  })
})

describe('parseScanResult', () => {
  it('accepts valid JSON', () => {
    expect(parseScanResult(JSON.stringify(valid))).toEqual({ ok: true, data: valid })
  })

  it('strips ```json fences', () => {
    const result = parseScanResult('```json\n' + JSON.stringify(valid) + '\n```')
    expect(result).toEqual({ ok: true, data: valid })
  })

  it('returns an error for malformed text instead of throwing', () => {
    expect(parseScanResult('Sorry, I cannot read this.')).toEqual({ ok: false, error: 'bad_json' })
    expect(parseScanResult('{"name": "Para')).toEqual({ ok: false, error: 'bad_json' })
    expect(parseScanResult('')).toEqual({ ok: false, error: 'bad_json' })
    expect(parseScanResult(null)).toEqual({ ok: false, error: 'bad_json' })
    expect(parseScanResult('[1, 2]')).toEqual({ ok: false, error: 'bad_json' })
  })

  it('rejects a missing name', () => {
    const { name, ...noName } = valid
    expect(parseScanResult(JSON.stringify(noName))).toEqual({ ok: false, error: 'missing_fields' })
    expect(parseScanResult(JSON.stringify({ ...valid, name: '  ' }))).toEqual({
      ok: false,
      error: 'missing_fields',
    })
  })

  it('rejects missing instructions', () => {
    const { how_to_take, ...noHowToTake } = valid
    expect(parseScanResult(JSON.stringify(noHowToTake))).toEqual({ ok: false, error: 'missing_fields' })
  })

  it('rejects missing or unknown confidence', () => {
    const { confidence, ...noConfidence } = valid
    expect(parseScanResult(JSON.stringify(noConfidence)).error).toBe('missing_fields')
    expect(parseScanResult(JSON.stringify({ ...valid, confidence: 'very high' })).error).toBe('missing_fields')
  })

  it('never shows a low-confidence result', () => {
    expect(parseScanResult(JSON.stringify({ ...valid, confidence: 'low' }))).toEqual({
      ok: false,
      error: 'low_confidence',
    })
  })

  it('turns a badly formatted expiry date into null', () => {
    for (const expiry_date of ['06/2027', '2027-13', 'June 2027', '2027-06-30', 42]) {
      const result = parseScanResult(JSON.stringify({ ...valid, expiry_date }))
      expect(result.ok).toBe(true)
      expect(result.data.expiry_date).toBeNull()
    }
  })

  it('keeps at most 3 warnings', () => {
    const warnings = ['One', 'Two', '', 'Three', 'Four', 'Five']
    const result = parseScanResult(JSON.stringify({ ...valid, warnings }))
    expect(result.data.warnings).toEqual(['One', 'Two', 'Three'])
  })

  it('allows empty strength and purpose', () => {
    const result = parseScanResult(JSON.stringify({ ...valid, strength: '', purpose: null }))
    expect(result.ok).toBe(true)
    expect(result.data.strength).toBe('')
    expect(result.data.purpose).toBe('')
  })
})
