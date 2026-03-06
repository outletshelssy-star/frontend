import { describe, it, expect } from 'vitest'
import {
  getResolutionDecimals,
  formatWithEquipmentResolution,
  isOutsideEquipmentRange,
  matchesEquipmentResolution,
  validateWithEquipmentSpec,
} from './equipmentSpecUtils'

describe('getResolutionDecimals', () => {
  it('returns correct decimal count for common resolutions', () => {
    expect(getResolutionDecimals(0.0001)).toBe(4)
    expect(getResolutionDecimals(0.01)).toBe(2)
    expect(getResolutionDecimals(0.1)).toBe(1)
    expect(getResolutionDecimals(1)).toBe(0)
  })

  it('returns 0 for resolution of 0', () => {
    expect(getResolutionDecimals(0)).toBe(0)
  })

  it('returns fallback for undefined/non-numeric', () => {
    // Number(null) === 0 (finite), so null → 0 decimals, not fallback
    expect(getResolutionDecimals(null)).toBe(0)
    // Number(undefined) === NaN (not finite), so fallback applies
    expect(getResolutionDecimals(undefined)).toBe(2)
    expect(getResolutionDecimals('abc')).toBe(2)
    expect(getResolutionDecimals('abc', 3)).toBe(3)
  })

  it('caps at 6 decimals', () => {
    expect(getResolutionDecimals(0.0000001)).toBe(6)
  })
})

describe('formatWithEquipmentResolution', () => {
  it('formats numeric value with resolution', () => {
    expect(formatWithEquipmentResolution(3.14159, 0.01)).toBe('3.14')
    expect(formatWithEquipmentResolution(5, 1)).toBe('5')
    expect(formatWithEquipmentResolution(2.5, 0.1)).toBe('2.5')
  })

  it('returns emptyValue for undefined/non-numeric', () => {
    // Number(null) === 0 (finite), so null formats as '0.0', not emptyValue
    expect(formatWithEquipmentResolution(undefined, 0.1)).toBe('-')
    expect(formatWithEquipmentResolution('abc', 0.1)).toBe('-')
  })

  it('uses custom emptyValue', () => {
    expect(formatWithEquipmentResolution(undefined, 0.1, 'N/A')).toBe('N/A')
    expect(formatWithEquipmentResolution('abc', 0.1, '')).toBe('')
  })
})

describe('isOutsideEquipmentRange', () => {
  const spec = { min_value: 0, max_value: 10 }

  it('returns false when value is within range', () => {
    expect(isOutsideEquipmentRange(5, spec)).toBe(false)
    expect(isOutsideEquipmentRange(0, spec)).toBe(false)
    expect(isOutsideEquipmentRange(10, spec)).toBe(false)
  })

  it('returns true when value is below min', () => {
    expect(isOutsideEquipmentRange(-1, spec)).toBe(true)
  })

  it('returns true when value is above max', () => {
    expect(isOutsideEquipmentRange(11, spec)).toBe(true)
  })

  it('returns false for null value', () => {
    expect(isOutsideEquipmentRange(null, spec)).toBe(false)
  })

  it('returns false for null spec', () => {
    expect(isOutsideEquipmentRange(5, null)).toBe(false)
  })
})

describe('matchesEquipmentResolution', () => {
  it('returns true for exact multiples', () => {
    expect(matchesEquipmentResolution(0.3, 0.1)).toBe(true)
    expect(matchesEquipmentResolution(1.5, 0.5)).toBe(true)
    expect(matchesEquipmentResolution(10, 5)).toBe(true)
  })

  it('returns false for non-multiples', () => {
    expect(matchesEquipmentResolution(0.15, 0.1)).toBe(false)
    expect(matchesEquipmentResolution(0.05, 0.1)).toBe(false)
  })

  it('returns true when resolution is null or 0 (skip check)', () => {
    expect(matchesEquipmentResolution(0.15, null)).toBe(true)
    expect(matchesEquipmentResolution(0.15, 0)).toBe(true)
  })

  it('returns false when value is null', () => {
    expect(matchesEquipmentResolution(null, 0.1)).toBe(false)
  })
})

describe('validateWithEquipmentSpec', () => {
  const spec = { min_value: 0, max_value: 10, resolution: 0.1 }

  it('returns valid for value within range and matching resolution', () => {
    const result = validateWithEquipmentSpec(5, spec)
    expect(result.isValid).toBe(true)
    expect(result.message).toBe('')
  })

  it('returns invalid for non-numeric value', () => {
    const result = validateWithEquipmentSpec('abc', spec)
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('numérica')
  })

  it('returns invalid when below minimum', () => {
    const result = validateWithEquipmentSpec(-1, spec)
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('mínimo')
  })

  it('returns invalid when above maximum', () => {
    const result = validateWithEquipmentSpec(11, spec)
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('máximo')
  })

  it('returns invalid when resolution is not respected', () => {
    const result = validateWithEquipmentSpec(0.15, spec)
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('resolución')
  })

  it('uses custom label in message', () => {
    const result = validateWithEquipmentSpec('abc', spec, 'temperatura')
    expect(result.message).toContain('temperatura')
  })
})
