import { describe, it, expect } from 'vitest'
import {
  parseKfFactorAvgFromNotes,
  formatKfFactor,
  calculateWaterPercent,
  convertTemperatureToF,
  convertTemperatureToC,
  convertWeightToGrams,
  formatDateInput,
  formatApi60fWithEquipmentResolution,
  isOutsideSpecRange,
  getAvgTempDisplay,
  formatWaterPercentByVolume,
  formatSpecificGravityFromApi,
  isSampleEmpty,
  hasSamplePassed24Hours,
} from './sampleUtils'

describe('parseKfFactorAvgFromNotes', () => {
  it('parses value with decimal point', () => {
    expect(parseKfFactorAvgFromNotes('Factor promedio: 1.5')).toBe(1.5)
  })

  it('parses value with decimal comma', () => {
    expect(parseKfFactorAvgFromNotes('Factor promedio: 1,5')).toBe(1.5)
  })

  it('returns null when no match', () => {
    expect(parseKfFactorAvgFromNotes('sin datos')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseKfFactorAvgFromNotes('')).toBeNull()
  })
})

describe('formatKfFactor', () => {
  it('formats a number to 4 decimals', () => {
    expect(formatKfFactor(1.23456)).toBe('1.2346')
    expect(formatKfFactor(2)).toBe('2.0000')
  })

  it('returns empty string for null', () => {
    expect(formatKfFactor(null)).toBe('')
  })

  it('returns empty string for NaN', () => {
    expect(formatKfFactor(NaN)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatKfFactor('')).toBe('')
  })
})

describe('calculateWaterPercent', () => {
  it('calculates with ml volume unit', () => {
    expect(calculateWaterPercent(10, 'ml', 2, 100, 'kg')).toBe('20.0000')
  })

  it('converts liters to ml before calculation', () => {
    expect(calculateWaterPercent(0.01, 'l', 2, 100, 'kg')).toBe('20.0000')
  })

  it('returns empty string for invalid inputs', () => {
    expect(calculateWaterPercent('bad', 'ml', 2, 100, 'kg')).toBe('')
    expect(calculateWaterPercent(null, 'ml', 2, 100, 'kg')).toBe('')
  })

  it('returns empty string when volume is zero', () => {
    expect(calculateWaterPercent(0, 'ml', 2, 100, 'kg')).toBe('')
  })
})

describe('convertTemperatureToF', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(convertTemperatureToF(0, 'c')).toBe(32)
    expect(convertTemperatureToF(100, 'c')).toBe(212)
  })

  it('returns Fahrenheit as-is', () => {
    expect(convertTemperatureToF(32, 'f')).toBe(32)
  })

  it('converts Kelvin to Fahrenheit', () => {
    expect(convertTemperatureToF(273.15, 'k')).toBeCloseTo(32, 5)
  })

  it('converts Rankine to Fahrenheit', () => {
    expect(convertTemperatureToF(491.67, 'r')).toBeCloseTo(32, 2)
  })

  it('returns null for NaN', () => {
    expect(convertTemperatureToF('bad', 'c')).toBeNull()
  })
})

describe('convertTemperatureToC', () => {
  it('converts Fahrenheit to Celsius', () => {
    expect(convertTemperatureToC(212, 'f')).toBeCloseTo(100, 5)
    expect(convertTemperatureToC(32, 'f')).toBeCloseTo(0, 5)
  })

  it('returns Celsius as-is', () => {
    expect(convertTemperatureToC(100, 'c')).toBe(100)
  })

  it('converts Kelvin to Celsius', () => {
    expect(convertTemperatureToC(373.15, 'k')).toBeCloseTo(100, 5)
  })

  it('returns null for NaN', () => {
    expect(convertTemperatureToC('bad', 'f')).toBeNull()
  })
})

describe('convertWeightToGrams', () => {
  it('returns grams as-is', () => {
    expect(convertWeightToGrams(5, 'g')).toBe(5)
  })

  it('converts milligrams to grams', () => {
    expect(convertWeightToGrams(5000, 'mg')).toBe(5)
  })

  it('returns null for unknown unit', () => {
    expect(convertWeightToGrams(5, 'lb')).toBeNull()
  })
})

describe('formatDateInput', () => {
  it('returns ISO date string unchanged', () => {
    expect(formatDateInput('2024-01-15')).toBe('2024-01-15')
  })

  it('extracts date from full ISO datetime', () => {
    expect(formatDateInput('2024-01-15T10:30:00.000Z')).toBe('2024-01-15')
  })

  it('returns empty string for empty input', () => {
    expect(formatDateInput('')).toBe('')
    expect(formatDateInput(null)).toBe('')
  })
})

describe('isOutsideSpecRange', () => {
  const spec = { min_value: 0, max_value: 10 }

  it('returns false when value is within range', () => {
    expect(isOutsideSpecRange(5, spec)).toBe(false)
  })

  it('returns true when value is below min', () => {
    expect(isOutsideSpecRange(-1, spec)).toBe(true)
  })

  it('returns true when value is above max', () => {
    expect(isOutsideSpecRange(11, spec)).toBe(true)
  })

  it('returns false for null value', () => {
    expect(isOutsideSpecRange(null, spec)).toBe(false)
  })
})

describe('getAvgTempDisplay', () => {
  it('returns average temperature formatted to 2 decimals', () => {
    expect(getAvgTempDisplay(20, 30, 'c')).toBe('25.00')
  })

  it('returns empty string for invalid inputs', () => {
    expect(getAvgTempDisplay('bad', 30, 'c')).toBe('')
    expect(getAvgTempDisplay(20, null, 'c')).toBe('')
  })
})

describe('formatSpecificGravityFromApi', () => {
  it('calculates specific gravity from API result', () => {
    expect(formatSpecificGravityFromApi(30)).toBe('0.8762')
  })

  it('accepts numeric strings', () => {
    expect(formatSpecificGravityFromApi('10')).toBe('0.9999')
  })

  it('returns empty string for invalid values', () => {
    expect(formatSpecificGravityFromApi('')).toBe('')
    expect(formatSpecificGravityFromApi('bad')).toBe('')
    expect(formatSpecificGravityFromApi(-131.5)).toBe('')
  })
})

describe('formatApi60fWithEquipmentResolution', () => {
  it('formats api 60f with the hydrometer api resolution', () => {
    const hydrometer = {
      measure_specs: [{ measure: 'api', resolution: 0.1 }],
    }
    expect(formatApi60fWithEquipmentResolution(31.276, hydrometer)).toBe('31.3')
  })

  it('returns the raw value when there is no api resolution', () => {
    expect(formatApi60fWithEquipmentResolution('31.276', null)).toBe('31.276')
  })

  it('returns empty string for invalid values', () => {
    expect(formatApi60fWithEquipmentResolution('', null)).toBe('')
    expect(formatApi60fWithEquipmentResolution('bad', null)).toBe('')
  })
})

describe('formatWaterPercentByVolume', () => {
  it('calculates volume percent from weight percent and relative density', () => {
    expect(formatWaterPercentByVolume(0.5, 0.8762)).toBe('0.438')
  })

  it('accepts numeric strings', () => {
    expect(formatWaterPercentByVolume('1.25', '0.85')).toBe('1.063')
  })

  it('returns empty string for invalid inputs', () => {
    expect(formatWaterPercentByVolume('', 0.8762)).toBe('')
    expect(formatWaterPercentByVolume('bad', 0.8762)).toBe('')
    expect(formatWaterPercentByVolume(0.5, '')).toBe('')
    expect(formatWaterPercentByVolume(0.5, 0)).toBe('')
  })
})

describe('isSampleEmpty', () => {
  it('returns true when no lab data and no analysis values', () => {
    const sample = {
      lab_humidity: null,
      lab_temperature: null,
      analyses: [{ api_60f: null, water_value: null }],
    }
    expect(isSampleEmpty(sample)).toBe(true)
  })

  it('returns false when lab_humidity is set', () => {
    const sample = { lab_humidity: 50, lab_temperature: null, analyses: [] }
    expect(isSampleEmpty(sample)).toBe(false)
  })

  it('returns false when an analysis has data', () => {
    const sample = {
      lab_humidity: null,
      lab_temperature: null,
      analyses: [{ api_60f: 30, water_value: null }],
    }
    expect(isSampleEmpty(sample)).toBe(false)
  })

  it('returns true for sample with no analyses', () => {
    const sample = { lab_humidity: null, lab_temperature: null, analyses: [] }
    expect(isSampleEmpty(sample)).toBe(true)
  })
})

describe('hasSamplePassed24Hours', () => {
  it('returns true when created more than 24 hours ago', () => {
    const sample = { created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }
    expect(hasSamplePassed24Hours(sample)).toBe(true)
  })

  it('returns false when created less than 24 hours ago', () => {
    const sample = { created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() }
    expect(hasSamplePassed24Hours(sample)).toBe(false)
  })

  it('returns false when no created_at', () => {
    expect(hasSamplePassed24Hours({})).toBe(false)
    expect(hasSamplePassed24Hours(null)).toBe(false)
  })
})
