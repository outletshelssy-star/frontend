import { formatWithEquipmentResolution } from './equipmentSpecUtils'

export const parseKfFactorAvgFromNotes = (notes = '') => {
  const text = String(notes || '')
  const match = text.match(/Factor promedio:\s*([-+]?\d*[.,]?\d+)/i)
  if (!match) return null
  const value = Number(String(match[1]).replace(',', '.'))
  return Number.isNaN(value) ? null : value
}

export const formatKfFactor = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return ''
  return numeric.toFixed(4)
}

export const calculateWaterPercent = (volume, volumeUnit, factor, weight, weightUnit) => {
  const vRaw = Number(volume)
  const f = Number(factor)
  const wRaw = Number(weight)
  if ([vRaw, f, wRaw].some((val) => Number.isNaN(val) || val <= 0)) return ''
  const v = String(volumeUnit || '').toLowerCase() === 'l' ? vRaw * 1000 : vRaw
  const w = String(weightUnit || '').toLowerCase() === 'g' ? wRaw * 1000 : wRaw
  const result = ((v * f) / w) * 100
  return Number.isFinite(result) ? result.toFixed(4) : ''
}

export const convertTemperatureToF = (value, unit) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  const normalized = String(unit || 'f').toLowerCase()
  if (normalized === 'f') return numeric
  if (normalized === 'c') return (numeric * 9) / 5 + 32
  if (normalized === 'k') return ((numeric - 273.15) * 9) / 5 + 32
  if (normalized === 'r') return numeric - 459.67
  return null
}

export const convertTemperatureFromF = (value, unit) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  const normalized = String(unit || 'f').toLowerCase()
  if (normalized === 'f') return numeric
  if (normalized === 'c') return ((numeric - 32) * 5) / 9
  if (normalized === 'k') return ((numeric - 32) * 5) / 9 + 273.15
  if (normalized === 'r') return numeric + 459.67
  return null
}

export const convertTemperatureToC = (value, unit) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  const normalized = String(unit || 'f').toLowerCase()
  if (normalized === 'c') return numeric
  if (normalized === 'f') return ((numeric - 32) * 5) / 9
  if (normalized === 'k') return numeric - 273.15
  if (normalized === 'r') return ((numeric - 459.67) * 5) / 9
  return null
}

export const convertWeightToGrams = (value, unit) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  const normalized = String(unit || 'g').toLowerCase()
  if (normalized === 'g') return numeric
  if (normalized === 'mg') return numeric / 1000
  return null
}

export const formatDateInput = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }
  return raw.slice(0, 10)
}

export const getThermoLabel = (item) => {
  if (!item) return ''
  const serial = String(item.serial || '').trim()
  const brand = String(item.brand || '').trim()
  const model = String(item.model || '').trim()
  const parts = [serial, brand, model].filter(Boolean)
  return parts.join(' - ') || String(item.internal_code || item.id || '')
}

export const getThermoSpecs = (equipment) => {
  const specs = Array.isArray(equipment?.measure_specs) ? equipment.measure_specs : []
  return {
    temperature: specs.find((spec) => spec.measure === 'temperature') || null,
    relativeHumidity: specs.find((spec) => spec.measure === 'relative_humidity') || null,
  }
}

export const getMeasureSpec = (equipment, measure) => {
  const specs = Array.isArray(equipment?.measure_specs) ? equipment.measure_specs : []
  return specs.find((spec) => spec.measure === measure) || null
}

export const formatApi60fWithEquipmentResolution = (value, hydrometer) => {
  if (value === null || value === undefined || value === '') return ''
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return ''
  const apiSpec = getMeasureSpec(hydrometer, 'api')
  const resolution = apiSpec?.resolution
  if (resolution === null || resolution === undefined || resolution === '') {
    return String(value)
  }
  return formatWithEquipmentResolution(numeric, resolution, '')
}

export const isOutsideSpecRange = (value, spec) => {
  if (value === null || value === undefined || Number.isNaN(value)) return false
  if (!spec) return false
  if (spec.min_value !== null && spec.min_value !== undefined && value < spec.min_value) {
    return true
  }
  if (spec.max_value !== null && spec.max_value !== undefined && value > spec.max_value) {
    return true
  }
  return false
}

export const getAvgTempDisplay = (tempStart, tempEnd, tempUnit) => {
  const tempFStart = convertTemperatureToF(tempStart, tempUnit)
  const tempFEnd = convertTemperatureToF(tempEnd, tempUnit)
  if (tempFStart === null || tempFEnd === null) return ''
  const avgTempF = (Number(tempFStart) + Number(tempFEnd)) / 2
  const avgInUnit = convertTemperatureFromF(avgTempF, tempUnit)
  return avgInUnit === null ? '' : avgInUnit.toFixed(2)
}

export const formatWaterValue = (value) => {
  if (value === null || value === undefined || value === '') return ''
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return ''
  return numeric.toFixed(3)
}

export const formatWaterPercentByVolume = (weightPercent, relativeDensity) => {
  if (
    weightPercent === null ||
    weightPercent === undefined ||
    weightPercent === '' ||
    relativeDensity === null ||
    relativeDensity === undefined ||
    relativeDensity === ''
  ) {
    return ''
  }
  const numericWeightPercent = Number(weightPercent)
  const numericRelativeDensity = Number(relativeDensity)
  if (
    Number.isNaN(numericWeightPercent) ||
    Number.isNaN(numericRelativeDensity) ||
    numericRelativeDensity <= 0
  ) {
    return ''
  }
  const result = numericWeightPercent * numericRelativeDensity
  return Number.isFinite(result) ? result.toFixed(3) : ''
}

export const formatSpecificGravityFromApi = (apiValue) => {
  if (apiValue === null || apiValue === undefined || apiValue === '') return ''
  const numeric = Number(apiValue)
  if (Number.isNaN(numeric)) return ''
  const denominator = numeric + 131.5
  if (denominator <= 0) return ''
  const specificGravity = 141.5 / denominator
  return Number.isFinite(specificGravity) ? specificGravity.toFixed(4) : ''
}

export const isSampleEmpty = (sample) => {
  if (!sample) return false
  if (sample.lab_humidity !== null || sample.lab_temperature !== null) {
    return false
  }
  const analyses = Array.isArray(sample.analyses) ? sample.analyses : []
  return analyses.every((analysis) => {
    return (
      (analysis?.api_60f === null || analysis?.api_60f === undefined) &&
      (analysis?.water_value === null || analysis?.water_value === undefined)
    )
  })
}

export const hasSamplePassed24Hours = (sample) => {
  const createdAtValue = sample?.created_at
  if (!createdAtValue) return false
  const createdAt = new Date(createdAtValue).getTime()
  if (Number.isNaN(createdAt)) return false
  return Date.now() - createdAt >= 24 * 60 * 60 * 1000
}
