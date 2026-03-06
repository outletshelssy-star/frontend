import { useCallback } from 'react'
import { createEquipmentVerification, updateEquipmentVerification } from '../services/api'
import { validateWithEquipmentSpec } from '../utils/equipmentSpecUtils'

const parseHydrometerFieldError = (detail) => {
  const message = String(detail || '').trim()
  if (!message) return null
  const normalized = message.toLowerCase()
  if (
    normalized.includes('lectura del hidrómetro de trabajo') ||
    normalized.includes('lectura del hidrometro de trabajo') ||
    normalized.includes('reading_under_test_value')
  ) {
    return {
      field: 'hydrometer_working_value',
      message,
    }
  }
  if (
    normalized.includes('lectura del hidrómetro patrón') ||
    normalized.includes('lectura del hidrómetro patron') ||
    normalized.includes('lectura del hidrometro patron') ||
    normalized.includes('reference_reading_value')
  ) {
    return {
      field: 'hydrometer_reference_value',
      message,
    }
  }
  return null
}

const parseInspectionRequirementError = (detail) => {
  const normalized = String(detail || '')
    .trim()
    .toLowerCase()
  if (
    normalized.includes('approved daily inspection') ||
    normalized.includes('inspección diaria aprobada') ||
    normalized.includes('inspeccion diaria aprobada')
  ) {
    return {
      field: 'inspection_requirement',
      focusField: 'reference_equipment_id',
      message:
        'El equipo y el patrón deben tener una inspección diaria aprobada para la fecha de verificación.',
    }
  }
  return null
}

const convertTemperatureToCValue = (value, unit) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  const normalized = String(unit || 'c').toLowerCase()
  if (normalized === 'c') return numeric
  if (normalized === 'f') return ((numeric - 32) * 5) / 9
  if (normalized === 'k') return numeric - 273.15
  if (normalized === 'r') return ((numeric - 459.67) * 5) / 9
  return null
}

const getTemperatureSpec = (equipment) => {
  const specs = Array.isArray(equipment?.measure_specs) ? equipment.measure_specs : []
  return specs.find((spec) => String(spec?.measure || '').toLowerCase() === 'temperature') || null
}

const useEquipmentVerificationSubmit = ({
  tokenType,
  accessToken,
  queryClient,
  verificationEquipment,
  verificationForm,
  verificationItems,
  verificationEditMode,
  verificationEditingId,
  selectedReferenceEquipment,
  requiresTemperatureComparison,
  isMonthlyVerification,
  isHydrometerMonthlyVerification,
  requiresComparisonReadings,
  requiresKarlFischerVerification,
  requiresBalanceComparison,
  requiresTapeComparison,
  canEditVerificationDate,
  hydrometerThermometerOptions,
  convertTemperatureToFDisplay,
  convertLengthToMmDisplay,
  normalizeWeightToGrams,
  getWeightEmp,
  hydrometerWorkApi60f,
  hydrometerRefApi60f,
  closeVerification,
  hideVerificationDialog,
  setToast,
  setIsVerificationLoading,
  setIsVerificationWaitOpen,
  setIsVerificationOpen,
  setPendingVerificationPayload,
  setIsVerificationReplaceOpen,
  setIsVerificationNoAptaConfirmOpen,
  setVerificationNoAptaConfirmMessage,
  setVerificationFieldErrors,
  setVerificationFocusField,
}) =>
  useCallback(
    async (options = {}) => {
      const forceNoAptaSave = Boolean(options?.forceNoAptaSave)
      if (!verificationEquipment) return
      const nextFieldErrors = {}
      let firstFieldWithError = ''
      const setInlineError = (field, message) => {
        const key = String(field || '').trim()
        if (!key || !message) return
        if (!nextFieldErrors[key]) {
          nextFieldErrors[key] = message
        }
        if (!firstFieldWithError) {
          firstFieldWithError = key
        }
      }
      const commitInlineErrors = () => {
        if (Object.keys(nextFieldErrors).length === 0) return false
        setVerificationFieldErrors(nextFieldErrors)
        setVerificationFocusField(firstFieldWithError)
        return true
      }
      const isBlankValue = (value) => String(value ?? '').trim() === ''
      const isInvalidNumericValue = (value) => isBlankValue(value) || Number.isNaN(Number(value))
      if (!verificationForm.verification_type_id) {
        setInlineError('verification_type_id', 'Selecciona un tipo de verificación.')
        commitInlineErrors()
        return
      }

      let hydrometerTempFWork = null
      let hydrometerTempFRef = null

      if (isHydrometerMonthlyVerification) {
        const productName = String(verificationForm.product_name || '').trim()
        if (!productName) {
          setInlineError('product_name', 'Selecciona el producto.')
        }
        if (!verificationForm.thermometer_working_id) {
          setInlineError('thermometer_working_id', 'Selecciona el termómetro de trabajo.')
        }
        if (!verificationForm.reference_equipment_id) {
          setInlineError('reference_equipment_id', 'Selecciona el hidrómetro patrón.')
        }
        ;[
          ['hydrometer_working_value', verificationForm.hydrometer_working_value],
          ['hydrometer_reference_value', verificationForm.hydrometer_reference_value],
          ['thermometer_working_value', verificationForm.thermometer_working_value],
          ['thermometer_reference_value', verificationForm.thermometer_reference_value],
        ].forEach(([field, value]) => {
          if (isBlankValue(value)) {
            setInlineError(field, 'Este campo es obligatorio.')
          } else if (Number.isNaN(Number(value))) {
            setInlineError(field, 'Ingresa un valor numérico válido.')
          }
        })
        if (commitInlineErrors()) {
          return
        }
        if (!productName) {
          setInlineError('product_name', 'Selecciona el producto.')
        }
        if (!verificationForm.thermometer_working_id) {
          setToast({
            open: true,
            message: 'Selecciona el termómetro de trabajo.',
            severity: 'error',
          })
          return
        }
        if (!verificationForm.reference_equipment_id) {
          setToast({
            open: true,
            message: 'Selecciona el hidrómetro patrón.',
            severity: 'error',
          })
          return
        }
        const requiredFields = [
          verificationForm.hydrometer_working_value,
          verificationForm.hydrometer_reference_value,
          verificationForm.thermometer_working_value,
          verificationForm.thermometer_reference_value,
        ]
        if (requiredFields.some((value) => value === '')) {
          setToast({
            open: true,
            message: 'Completa todas las lecturas del hidrómetro y termómetro.',
            severity: 'error',
          })
          return
        }
        if (requiredFields.some((value) => Number.isNaN(Number(value)))) {
          setToast({
            open: true,
            message: 'Las lecturas deben ser valores numéricos válidos.',
            severity: 'error',
          })
          return
        }
        const unit = verificationForm.thermometer_unit || 'c'
        const selectedThermometer = (hydrometerThermometerOptions || []).find(
          (candidate) =>
            String(candidate?.id || '') === String(verificationForm.thermometer_working_id || ''),
        )
        const temperatureSpec = getTemperatureSpec(selectedThermometer)
        if (temperatureSpec) {
          const thermometerWorkValueC = convertTemperatureToCValue(
            Number(verificationForm.thermometer_working_value),
            unit,
          )
          if (thermometerWorkValueC === null) {
            setVerificationFieldErrors({
              thermometer_working_value:
                'No se pudo convertir la lectura del termómetro de trabajo.',
            })
            setVerificationFocusField('thermometer_working_value')
            setToast({
              open: true,
              message: 'No se pudo convertir la lectura del termómetro de trabajo.',
              severity: 'error',
            })
            return
          }
          const thermometerValidation = validateWithEquipmentSpec(
            thermometerWorkValueC,
            temperatureSpec,
            'lectura del termómetro de trabajo',
          )
          if (!thermometerValidation.isValid) {
            setVerificationFieldErrors({
              thermometer_working_value: thermometerValidation.message,
            })
            setVerificationFocusField('thermometer_working_value')
            setToast({
              open: true,
              message: thermometerValidation.message,
              severity: 'error',
            })
            return
          }
        }
        hydrometerTempFWork = convertTemperatureToFDisplay(
          Number(verificationForm.thermometer_working_value),
          unit,
        )
        hydrometerTempFRef = convertTemperatureToFDisplay(
          Number(verificationForm.thermometer_reference_value),
          unit,
        )
        if (hydrometerTempFWork === null || hydrometerTempFRef === null) {
          setToast({
            open: true,
            message: 'No se pudo convertir la temperatura a Fahrenheit.',
            severity: 'error',
          })
          return
        }
      } else if (requiresTemperatureComparison) {
        if (!verificationForm.reference_equipment_id) {
          setInlineError('reference_equipment_id', 'Selecciona un equipo patrón.')
        }
        if (!verificationForm.reference_equipment_id) {
          setToast({
            open: true,
            message: 'Selecciona un equipo patron.',
            severity: 'error',
          })
          return
        }
        if (isMonthlyVerification) {
          ;[
            ['reading_under_test_high_value', verificationForm.reading_under_test_high_value],
            ['reading_under_test_mid_value', verificationForm.reading_under_test_mid_value],
            ['reading_under_test_low_value', verificationForm.reading_under_test_low_value],
            ['reference_reading_high_value', verificationForm.reference_reading_high_value],
            ['reference_reading_mid_value', verificationForm.reference_reading_mid_value],
            ['reference_reading_low_value', verificationForm.reference_reading_low_value],
          ].forEach(([field, value]) => {
            if (isBlankValue(value)) {
              setInlineError(field, 'Este campo es obligatorio.')
            } else if (Number.isNaN(Number(value))) {
              setInlineError(field, 'Ingresa un valor numérico válido.')
            }
          })
          if (commitInlineErrors()) {
            return
          }
          const requiredFields = [
            verificationForm.reading_under_test_high_value,
            verificationForm.reading_under_test_mid_value,
            verificationForm.reading_under_test_low_value,
            verificationForm.reference_reading_high_value,
            verificationForm.reference_reading_mid_value,
            verificationForm.reference_reading_low_value,
          ]
          if (requiredFields.some((value) => value === '')) {
            setToast({
              open: true,
              message: 'Ingresa lecturas alta, media y baja en ambos equipos.',
              severity: 'error',
            })
            return
          }
          if (requiredFields.some((value) => Number.isNaN(Number(value)))) {
            setToast({
              open: true,
              message: 'Las lecturas deben ser valores numericos validos.',
              severity: 'error',
            })
            return
          }
        } else {
          if (isBlankValue(verificationForm.reading_under_test_f)) {
            setInlineError('reading_under_test_f', 'Este campo es obligatorio.')
          } else if (Number.isNaN(Number(verificationForm.reading_under_test_f))) {
            setInlineError('reading_under_test_f', 'Ingresa un valor numérico válido.')
          }
          if (isBlankValue(verificationForm.reference_reading_f)) {
            setInlineError('reference_reading_f', 'Este campo es obligatorio.')
          } else if (Number.isNaN(Number(verificationForm.reference_reading_f))) {
            setInlineError('reference_reading_f', 'Ingresa un valor numérico válido.')
          }
          if (commitInlineErrors()) {
            return
          }
          if (
            verificationForm.reading_under_test_f === '' ||
            verificationForm.reference_reading_f === ''
          ) {
            setToast({
              open: true,
              message: 'Ingresa la lectura del equipo y la lectura del patron.',
              severity: 'error',
            })
            return
          }
          if (
            Number.isNaN(Number(verificationForm.reading_under_test_f)) ||
            Number.isNaN(Number(verificationForm.reference_reading_f))
          ) {
            setToast({
              open: true,
              message: 'Las lecturas deben ser valores numericos validos.',
              severity: 'error',
            })
            return
          }
        }
      } else if (requiresBalanceComparison) {
        if (!verificationForm.reference_equipment_id) {
          setInlineError('reference_equipment_id', 'Selecciona la pesa patrón.')
        }
        if (isBlankValue(verificationForm.balance_reading_value)) {
          setInlineError('balance_reading_value', 'Este campo es obligatorio.')
        } else if (Number.isNaN(Number(verificationForm.balance_reading_value))) {
          setInlineError('balance_reading_value', 'Ingresa un valor numérico válido.')
        }
        if (
          verificationForm.reference_equipment_id &&
          (!selectedReferenceEquipment ||
            selectedReferenceEquipment.nominal_mass_value === null ||
            selectedReferenceEquipment.nominal_mass_value === undefined)
        ) {
          setInlineError('reference_equipment_id', 'La pesa patrón no tiene peso nominal definido.')
        }
        if (commitInlineErrors()) {
          return
        }
        if (!verificationForm.reference_equipment_id) {
          setToast({
            open: true,
            message: 'Selecciona la pesa patron.',
            severity: 'error',
          })
          return
        }
        if (verificationForm.balance_reading_value === '') {
          setToast({
            open: true,
            message: 'Ingresa la lectura de la balanza.',
            severity: 'error',
          })
          return
        }
        if (Number.isNaN(Number(verificationForm.balance_reading_value))) {
          setToast({
            open: true,
            message: 'La lectura de la balanza debe ser numerica.',
            severity: 'error',
          })
          return
        }
        if (
          !selectedReferenceEquipment ||
          selectedReferenceEquipment.nominal_mass_value === null ||
          selectedReferenceEquipment.nominal_mass_value === undefined
        ) {
          setToast({
            open: true,
            message: 'La pesa patron no tiene peso nominal definido.',
            severity: 'error',
          })
          return
        }
      } else if (requiresKarlFischerVerification) {
        if (!verificationForm.reference_equipment_id) {
          setInlineError('reference_equipment_id', 'Selecciona la balanza analítica.')
        }
        ;[
          ['kf_weight_1', verificationForm.kf_weight_1],
          ['kf_volume_1', verificationForm.kf_volume_1],
          ['kf_weight_2', verificationForm.kf_weight_2],
          ['kf_volume_2', verificationForm.kf_volume_2],
        ].forEach(([field, value]) => {
          if (isBlankValue(value)) {
            setInlineError(field, 'Este campo es obligatorio.')
          } else if (Number.isNaN(Number(value))) {
            setInlineError(field, 'Ingresa un valor numérico válido.')
          }
        })
        ;[
          ['kf_volume_1', verificationForm.kf_volume_1],
          ['kf_volume_2', verificationForm.kf_volume_2],
        ].forEach(([field, value]) => {
          if (!isInvalidNumericValue(value) && Number(value) <= 0) {
            setInlineError(field, 'El volumen debe ser mayor que cero.')
          }
        })
        if (commitInlineErrors()) {
          return
        }
        if (!verificationForm.reference_equipment_id) {
          setToast({
            open: true,
            message: 'Selecciona la balanza analitica.',
            severity: 'error',
          })
          return
        }
        const requiredFields = [
          verificationForm.kf_weight_1,
          verificationForm.kf_volume_1,
          verificationForm.kf_weight_2,
          verificationForm.kf_volume_2,
        ]
        if (requiredFields.some((value) => String(value).trim() === '')) {
          setToast({
            open: true,
            message: 'Completa peso y volumen para ambos ensayos.',
            severity: 'error',
          })
          return
        }
        if (requiredFields.some((value) => Number.isNaN(Number(value)))) {
          setToast({
            open: true,
            message: 'Los valores deben ser numericos validos.',
            severity: 'error',
          })
          return
        }
        if (
          Number(verificationForm.kf_volume_1) <= 0 ||
          Number(verificationForm.kf_volume_2) <= 0
        ) {
          setToast({
            open: true,
            message: 'El volumen debe ser mayor que cero.',
            severity: 'error',
          })
          return
        }
      } else if (requiresTapeComparison) {
        if (!verificationForm.reference_equipment_id) {
          setInlineError('reference_equipment_id', 'Selecciona un equipo patrón.')
        }
        ;[
          ['reading_under_test_high_value', verificationForm.reading_under_test_high_value],
          ['reading_under_test_mid_value', verificationForm.reading_under_test_mid_value],
          ['reference_reading_high_value', verificationForm.reference_reading_high_value],
          ['reference_reading_mid_value', verificationForm.reference_reading_mid_value],
        ].forEach(([field, value]) => {
          if (isBlankValue(value)) {
            setInlineError(field, 'Este campo es obligatorio.')
          }
        })
        ;[
          ['reading_under_test_high_value', verificationForm.reading_under_test_high_value],
          ['reading_under_test_mid_value', verificationForm.reading_under_test_mid_value],
          ['reading_under_test_low_value', verificationForm.reading_under_test_low_value],
          ['reference_reading_high_value', verificationForm.reference_reading_high_value],
          ['reference_reading_mid_value', verificationForm.reference_reading_mid_value],
          ['reference_reading_low_value', verificationForm.reference_reading_low_value],
        ].forEach(([field, value]) => {
          if (!isBlankValue(value) && Number.isNaN(Number(value))) {
            setInlineError(field, 'Ingresa un valor numérico válido.')
          }
        })
        const hasThirdWorkInline = !isBlankValue(verificationForm.reading_under_test_low_value)
        const hasThirdRefInline = !isBlankValue(verificationForm.reference_reading_low_value)
        if (
          !hasThirdWorkInline &&
          !isInvalidNumericValue(verificationForm.reading_under_test_high_value) &&
          !isInvalidNumericValue(verificationForm.reading_under_test_mid_value) &&
          Number(verificationForm.reading_under_test_high_value) !==
            Number(verificationForm.reading_under_test_mid_value)
        ) {
          setInlineError(
            'reading_under_test_mid_value',
            'Si hay solo dos lecturas del equipo, deben ser iguales.',
          )
        }
        if (
          !hasThirdRefInline &&
          !isInvalidNumericValue(verificationForm.reference_reading_high_value) &&
          !isInvalidNumericValue(verificationForm.reference_reading_mid_value) &&
          Number(verificationForm.reference_reading_high_value) !==
            Number(verificationForm.reference_reading_mid_value)
        ) {
          setInlineError(
            'reference_reading_mid_value',
            'Si hay solo dos lecturas del patrón, deben ser iguales.',
          )
        }
        if (commitInlineErrors()) {
          return
        }
        if (!verificationForm.reference_equipment_id) {
          setToast({
            open: true,
            message: 'Selecciona un equipo patron.',
            severity: 'error',
          })
          return
        }
        const work1 = verificationForm.reading_under_test_high_value
        const work2 = verificationForm.reading_under_test_mid_value
        const work3 = verificationForm.reading_under_test_low_value
        const ref1 = verificationForm.reference_reading_high_value
        const ref2 = verificationForm.reference_reading_mid_value
        const ref3 = verificationForm.reference_reading_low_value
        if (work1 === '' || work2 === '' || ref1 === '' || ref2 === '') {
          setToast({
            open: true,
            message: 'Ingresa al menos dos lecturas para equipo y patron.',
            severity: 'error',
          })
          return
        }
        const numericChecks = [work1, work2, work3, ref1, ref2, ref3]
          .filter((value) => String(value).trim() !== '')
          .some((value) => Number.isNaN(Number(value)))
        if (numericChecks) {
          setToast({
            open: true,
            message: 'Las lecturas deben ser valores numericos validos.',
            severity: 'error',
          })
          return
        }
        const hasThirdWork = String(work3).trim() !== ''
        const hasThirdRef = String(ref3).trim() !== ''
        if (!hasThirdWork && Number(work1) !== Number(work2)) {
          setToast({
            open: true,
            message: 'Si el equipo de trabajo tiene solo dos lecturas, deben ser iguales.',
            severity: 'error',
          })
          return
        }
        if (!hasThirdRef && Number(ref1) !== Number(ref2)) {
          setToast({
            open: true,
            message: 'Si el equipo patron tiene solo dos lecturas, deben ser iguales.',
            severity: 'error',
          })
          return
        }
      }

      const responses = []
      verificationItems.forEach((item) => {
        const response = verificationForm.responses[item.id] || {}
        const fieldKey = `response_${item.id}`
        if (!item.is_required) return
        if (item.response_type === 'boolean' && response.value_bool === null) {
          setInlineError(fieldKey, 'Selecciona una respuesta.')
        }
        if (item.response_type === 'text' && !String(response.value_text || '').trim()) {
          setInlineError(fieldKey, 'Este campo es obligatorio.')
        }
        if (
          item.response_type === 'number' &&
          (String(response.value_number ?? '').trim() === '' ||
            Number.isNaN(Number(response.value_number)))
        ) {
          setInlineError(fieldKey, 'Ingresa un valor numérico válido.')
        }
      })
      if (commitInlineErrors()) {
        return
      }
      for (const item of verificationItems) {
        const response = verificationForm.responses[item.id] || {}
        if (item.is_required) {
          if (item.response_type === 'boolean' && response.value_bool === null) {
            setToast({
              open: true,
              message: 'Completa los items requeridos.',
              severity: 'error',
            })
            return
          }
          if (item.response_type === 'text' && !String(response.value_text || '').trim()) {
            setToast({
              open: true,
              message: 'Completa los items requeridos.',
              severity: 'error',
            })
            return
          }
          if (item.response_type === 'number' && response.value_number === undefined) {
            setToast({
              open: true,
              message: 'Completa los items requeridos.',
              severity: 'error',
            })
            return
          }
        }
        responses.push({
          verification_item_id: item.id,
          response_type: item.response_type,
          value_bool: item.response_type === 'boolean' ? response.value_bool : null,
          value_text:
            item.response_type === 'text' ? String(response.value_text || '').trim() : null,
          value_number:
            item.response_type === 'number'
              ? String(response.value_number ?? '').trim() === ''
                ? null
                : Number(response.value_number)
              : null,
        })
      }

      const noAptaReasons = []
      const hasBooleanFailure = responses.some(
        (response) => response.response_type === 'boolean' && response.value_bool === false,
      )
      if (hasBooleanFailure) {
        noAptaReasons.push('Hay ítems de verificación marcados como "No".')
      }
      if (isHydrometerMonthlyVerification) {
        const workApi = Number(hydrometerWorkApi60f)
        const refApi = Number(hydrometerRefApi60f)
        if (!Number.isNaN(workApi) && !Number.isNaN(refApi)) {
          const diffApi = Math.abs(workApi - refApi)
          if (diffApi > 0.5) {
            noAptaReasons.push('La diferencia API a 60F está fuera del límite permitido (0.5 API).')
          }
        }
      } else if (requiresTemperatureComparison) {
        if (isMonthlyVerification) {
          const rows = [
            ['reading_under_test_high_value', 'reference_reading_high_value'],
            ['reading_under_test_mid_value', 'reference_reading_mid_value'],
            ['reading_under_test_low_value', 'reference_reading_low_value'],
          ]
          const hasTemperatureOutOfRange = rows.some(([underKey, refKey]) => {
            const rawUnder = Number(verificationForm[underKey])
            const rawRef = Number(verificationForm[refKey])
            if (Number.isNaN(rawUnder) || Number.isNaN(rawRef)) return false
            const underF = convertTemperatureToFDisplay(
              rawUnder,
              verificationForm.reading_unit_under_test || 'c',
            )
            const refF = convertTemperatureToFDisplay(
              rawRef,
              verificationForm.reading_unit_reference || 'c',
            )
            if (underF === null || refF === null) return false
            return Math.abs(underF - refF) > 0.5
          })
          if (hasTemperatureOutOfRange) {
            noAptaReasons.push('Hay diferencias de temperatura mayores a 0.5 F.')
          }
        } else {
          const underF = convertTemperatureToFDisplay(
            Number(verificationForm.reading_under_test_f),
            verificationForm.reading_unit_under_test || 'c',
          )
          const refF = convertTemperatureToFDisplay(
            Number(verificationForm.reference_reading_f),
            verificationForm.reading_unit_reference || 'c',
          )
          if (underF !== null && refF !== null && Math.abs(underF - refF) > 0.5) {
            noAptaReasons.push('La diferencia de temperatura es mayor a 0.5 F.')
          }
        }
      } else if (requiresTapeComparison) {
        const workValues = [
          verificationForm.reading_under_test_high_value,
          verificationForm.reading_under_test_mid_value,
          verificationForm.reading_under_test_low_value,
        ].filter((value) => String(value).trim() !== '')
        const refValues = [
          verificationForm.reference_reading_high_value,
          verificationForm.reference_reading_mid_value,
          verificationForm.reference_reading_low_value,
        ].filter((value) => String(value).trim() !== '')
        if (workValues.length >= 2 && refValues.length >= 2) {
          const workMm = workValues
            .map((value) =>
              convertLengthToMmDisplay(value, verificationForm.reading_unit_under_test),
            )
            .filter((value) => value !== null)
          const refMm = refValues
            .map((value) =>
              convertLengthToMmDisplay(value, verificationForm.reading_unit_reference),
            )
            .filter((value) => value !== null)
          if (workMm.length === workValues.length && refMm.length === refValues.length) {
            const avgWork = workMm.reduce((acc, current) => acc + current, 0) / workMm.length
            const avgRef = refMm.reduce((acc, current) => acc + current, 0) / refMm.length
            if (Math.abs(avgRef - avgWork) >= 2) {
              noAptaReasons.push(
                'La diferencia absoluta en cinta está fuera del criterio (< 2 mm).',
              )
            }
          }
        }
      } else if (requiresBalanceComparison) {
        const underG = normalizeWeightToGrams(
          verificationForm.balance_reading_value,
          verificationForm.balance_unit || 'g',
        )
        const referenceG = normalizeWeightToGrams(
          selectedReferenceEquipment?.nominal_mass_value,
          selectedReferenceEquipment?.nominal_mass_unit || 'g',
        )
        let maxErrorG = Number(selectedReferenceEquipment?.emp_value)
        if (!(maxErrorG > 0)) {
          maxErrorG = getWeightEmp(
            selectedReferenceEquipment?.nominal_mass_value,
            selectedReferenceEquipment?.weight_class,
          )
        }
        if (
          underG !== null &&
          referenceG !== null &&
          Number.isFinite(maxErrorG) &&
          Math.abs(referenceG - underG) > maxErrorG
        ) {
          noAptaReasons.push('La diferencia en balanza supera el error máximo permitido (EMP).')
        }
      } else if (requiresKarlFischerVerification) {
        const weight1 = Number(verificationForm.kf_weight_1)
        const volume1 = Number(verificationForm.kf_volume_1)
        const weight2 = Number(verificationForm.kf_weight_2)
        const volume2 = Number(verificationForm.kf_volume_2)
        if (
          ![weight1, volume1, weight2, volume2].some((value) => Number.isNaN(value) || value <= 0)
        ) {
          const factor1 = weight1 / volume1
          const factor2 = weight2 / volume2
          const average = (factor1 + factor2) / 2
          const relativeError = average ? (Math.abs(factor1 - factor2) / average) * 100 : 0
          const factorsOk = factor1 >= 4.5 && factor1 <= 5.5 && factor2 >= 4.5 && factor2 <= 5.5
          const relativeOk = relativeError < 2
          if (!factorsOk || !relativeOk) {
            noAptaReasons.push(
              'El factor de Karl Fischer no cumple criterios (4.5-5.5 y error < 2%).',
            )
          }
        }
      }
      if (!forceNoAptaSave && noAptaReasons.length > 0) {
        setVerificationNoAptaConfirmMessage(noAptaReasons[0])
        setIsVerificationNoAptaConfirmOpen(true)
        return
      }
      setIsVerificationNoAptaConfirmOpen(false)
      setVerificationNoAptaConfirmMessage('')

      setIsVerificationLoading(true)
      setVerificationFieldErrors({})
      setVerificationFocusField('')
      let notes = verificationForm.notes?.trim() || null
      if (isHydrometerMonthlyVerification) {
        const unit = verificationForm.thermometer_unit || 'c'
        const productLabel = verificationForm.product_name || 'Crudo'
        const thermoId = verificationForm.thermometer_working_id
          ? `Termometro trabajo ID: ${verificationForm.thermometer_working_id}`
          : 'Termometro trabajo ID: -'
        const hydroNote =
          `[[HIDROMETRO_DATA]] Hidrometro mensual | Producto: ${productLabel} | ${thermoId} | ` +
          `Temp trabajo: ${verificationForm.thermometer_working_value} ${unit} | ` +
          `Hidrometro trabajo: ${verificationForm.hydrometer_working_value} API | ` +
          `Patron ID: ${verificationForm.reference_equipment_id} | ` +
          `Hidrometro patron: ${verificationForm.hydrometer_reference_value} API | ` +
          `Temp patron: ${verificationForm.thermometer_reference_value} ${unit}`
        notes = notes ? `${notes}\n${hydroNote}` : hydroNote
      }

      const payload = {
        verification_type_id: Number(verificationForm.verification_type_id),
        notes,
        verified_at:
          canEditVerificationDate && verificationForm.verified_at
            ? verificationForm.verified_at
            : null,
        reference_equipment_id:
          requiresComparisonReadings ||
          isHydrometerMonthlyVerification ||
          requiresKarlFischerVerification
            ? Number(verificationForm.reference_equipment_id)
            : null,
        kf_weight_1: requiresKarlFischerVerification ? Number(verificationForm.kf_weight_1) : null,
        kf_volume_1: requiresKarlFischerVerification ? Number(verificationForm.kf_volume_1) : null,
        kf_weight_2: requiresKarlFischerVerification ? Number(verificationForm.kf_weight_2) : null,
        kf_volume_2: requiresKarlFischerVerification ? Number(verificationForm.kf_volume_2) : null,
        reading_under_test_value: requiresBalanceComparison
          ? Number(verificationForm.balance_reading_value)
          : requiresTemperatureComparison && !isMonthlyVerification
            ? Number(verificationForm.reading_under_test_f)
            : isHydrometerMonthlyVerification
              ? Number(verificationForm.hydrometer_working_value)
              : null,
        reading_under_test_unit: requiresBalanceComparison
          ? verificationForm.balance_unit
          : requiresComparisonReadings
            ? verificationForm.reading_unit_under_test
            : isHydrometerMonthlyVerification
              ? 'api'
              : null,
        reference_reading_value: requiresBalanceComparison
          ? Number(selectedReferenceEquipment?.nominal_mass_value)
          : requiresTemperatureComparison && !isMonthlyVerification
            ? Number(verificationForm.reference_reading_f)
            : isHydrometerMonthlyVerification
              ? Number(verificationForm.hydrometer_reference_value)
              : null,
        reference_reading_unit: requiresBalanceComparison
          ? selectedReferenceEquipment?.nominal_mass_unit || 'g'
          : requiresComparisonReadings
            ? verificationForm.reading_unit_reference
            : isHydrometerMonthlyVerification
              ? 'api'
              : null,
        reading_under_test_high_value:
          (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
            ? Number(verificationForm.reading_under_test_high_value)
            : null,
        reading_under_test_mid_value:
          (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
            ? Number(verificationForm.reading_under_test_mid_value)
            : null,
        reading_under_test_low_value:
          (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
            ? String(verificationForm.reading_under_test_low_value).trim() === ''
              ? null
              : Number(verificationForm.reading_under_test_low_value)
            : null,
        reference_reading_high_value:
          (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
            ? Number(verificationForm.reference_reading_high_value)
            : null,
        reference_reading_mid_value:
          (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
            ? Number(verificationForm.reference_reading_mid_value)
            : null,
        reference_reading_low_value:
          (requiresTemperatureComparison && isMonthlyVerification) || requiresTapeComparison
            ? String(verificationForm.reference_reading_low_value).trim() === ''
              ? null
              : Number(verificationForm.reference_reading_low_value)
            : null,
        reading_under_test_f: isHydrometerMonthlyVerification ? Number(hydrometerTempFWork) : null,
        reference_reading_f: isHydrometerMonthlyVerification ? Number(hydrometerTempFRef) : null,
        responses,
      }

      hideVerificationDialog()
      setIsVerificationWaitOpen(true)
      try {
        if (verificationEditingId) {
          await updateEquipmentVerification({
            tokenType,
            accessToken,
            verificationId: verificationEditingId,
            payload,
          })
        } else {
          if (verificationEditMode) {
            setPendingVerificationPayload(payload)
            setIsVerificationReplaceOpen(true)
            return
          }
          await createEquipmentVerification({
            tokenType,
            accessToken,
            equipmentId: verificationEquipment.id,
            payload,
            replaceExisting: verificationEditMode,
          })
        }
        await queryClient.invalidateQueries({ queryKey: ['equipments'] })
        setToast({
          open: true,
          message:
            verificationEditingId || verificationEditMode
              ? 'Verificacion actualizada correctamente.'
              : 'Verificacion registrada correctamente.',
          severity: 'success',
        })
        closeVerification()
      } catch (err) {
        const mappedHydrometerFieldError = isHydrometerMonthlyVerification
          ? parseHydrometerFieldError(err?.detail)
          : null
        const mappedInspectionRequirementError = parseInspectionRequirementError(err?.detail)
        const mappedInlineFieldError =
          mappedHydrometerFieldError || mappedInspectionRequirementError
        if (mappedInlineFieldError) {
          setVerificationFieldErrors({
            [mappedInlineFieldError.field]: mappedInlineFieldError.message,
          })
          setVerificationFocusField(
            mappedInlineFieldError.focusField || mappedInlineFieldError.field,
          )
        } else {
          setVerificationFieldErrors({})
          setVerificationFocusField('')
        }
        if (mappedInlineFieldError) {
          setIsVerificationOpen(true)
          return
        }
        if (verificationEditingId) {
          setToast({
            open: true,
            message: err?.detail || 'No se pudo actualizar la verificacion.',
            severity: 'error',
          })
          setIsVerificationLoading(false)
          setIsVerificationWaitOpen(false)
          setIsVerificationOpen(true)
          return
        }
        const conflict409 =
          err?.status === 409 ||
          err?.status_code === 409 ||
          String(err?.detail || '')
            .toLowerCase()
            .includes('reemplazar')
        if (conflict409) {
          if (verificationEditMode) {
            setPendingVerificationPayload(payload)
            setIsVerificationReplaceOpen(true)
            return
          }
          setVerificationFieldErrors({})
          setVerificationFocusField('')
          setToast({
            open: true,
            message:
              'Ya existe una verificación para esa fecha. Usa el modo edición para modificarla.',
            severity: 'error',
          })
          setIsVerificationOpen(true)
          return
        }
        setToast({
          open: true,
          message:
            err?.detail ||
            (verificationEditMode
              ? 'No se pudo actualizar la verificacion.'
              : 'No se pudo registrar la verificacion.'),
          severity: 'error',
        })
        setIsVerificationOpen(true)
      } finally {
        setIsVerificationLoading(false)
        setIsVerificationWaitOpen(false)
      }
    },
    [
      verificationEquipment,
      verificationForm,
      isHydrometerMonthlyVerification,
      requiresTemperatureComparison,
      isMonthlyVerification,
      requiresBalanceComparison,
      selectedReferenceEquipment,
      requiresKarlFischerVerification,
      requiresTapeComparison,
      verificationItems,
      canEditVerificationDate,
      hydrometerThermometerOptions,
      requiresComparisonReadings,
      hideVerificationDialog,
      setIsVerificationWaitOpen,
      verificationEditingId,
      tokenType,
      accessToken,
      verificationEditMode,
      setPendingVerificationPayload,
      setIsVerificationReplaceOpen,
      queryClient,
      setToast,
      closeVerification,
      setIsVerificationLoading,
      setIsVerificationOpen,
      setVerificationFieldErrors,
      setVerificationFocusField,
      convertTemperatureToFDisplay,
      convertLengthToMmDisplay,
      normalizeWeightToGrams,
      getWeightEmp,
      hydrometerWorkApi60f,
      hydrometerRefApi60f,
      setIsVerificationNoAptaConfirmOpen,
      setVerificationNoAptaConfirmMessage,
    ],
  )

export { useEquipmentVerificationSubmit }
