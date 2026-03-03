import { useCallback } from 'react'
import { createEquipmentVerification, updateEquipmentVerification } from '../services/api'

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
  convertTemperatureToFDisplay,
  closeVerification,
  hideVerificationDialog,
  setToast,
  setIsVerificationLoading,
  setIsVerificationWaitOpen,
  setIsVerificationOpen,
  setPendingVerificationPayload,
  setIsVerificationReplaceOpen,
}) =>
  useCallback(async () => {
    if (!verificationEquipment) return
    if (!verificationForm.verification_type_id) {
      setToast({
        open: true,
        message: 'Selecciona un tipo de verificacion.',
        severity: 'error',
      })
      return
    }

    let hydrometerTempFWork = null
    let hydrometerTempFRef = null

    if (isHydrometerMonthlyVerification) {
      const productName = String(verificationForm.product_name || '').trim()
      if (!productName) {
        setToast({
          open: true,
          message: 'Selecciona el producto.',
          severity: 'error',
        })
        return
      }
      if (!verificationForm.thermometer_working_id) {
        setToast({
          open: true,
          message: 'Selecciona el termometro de trabajo.',
          severity: 'error',
        })
        return
      }
      if (!verificationForm.reference_equipment_id) {
        setToast({
          open: true,
          message: 'Selecciona el hidrometro patron.',
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
          message: 'Completa todas las lecturas del hidrometro y termometro.',
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
      const unit = verificationForm.thermometer_unit || 'c'
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
        setToast({
          open: true,
          message: 'Selecciona un equipo patron.',
          severity: 'error',
        })
        return
      }
      if (isMonthlyVerification) {
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
        value_text: item.response_type === 'text' ? String(response.value_text || '').trim() : null,
        value_number: item.response_type === 'number' ? Number(response.value_number) : null,
      })
    }

    setIsVerificationLoading(true)
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
      verified_at: canEditVerificationDate && verificationForm.verified_at ? verificationForm.verified_at : null,
      reference_equipment_id:
        requiresComparisonReadings || isHydrometerMonthlyVerification || requiresKarlFischerVerification
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
        setPendingVerificationPayload(payload)
        setIsVerificationReplaceOpen(true)
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
  }, [
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
    convertTemperatureToFDisplay,
  ])

export { useEquipmentVerificationSubmit }
