import { useCallback } from 'react'
import {
  createEquipmentCalibration,
  updateEquipmentCalibration,
  uploadEquipmentCalibrationCertificate,
} from '../services/api'

const useEquipmentCalibrationSubmit = ({
  tokenType,
  accessToken,
  queryClient,
  calibrationEquipment,
  calibrationForm,
  calibrationResults,
  calibrationResultsTemp,
  calibrationResultsHumidity,
  calibrationEditingId,
  calibrationOriginalDate,
  calibrationFile,
  canEditCalibrationDate,
  isHydrometerEquipment,
  isThermoHygrometerEquipment,
  hideCalibrationDialog,
  closeCalibration,
  setToast,
  setCalibrationFieldErrors,
  setCalibrationFocusField,
  setIsCalibrationWaitOpen,
  setIsCalibrationLoading,
  setIsCalibrationOpen,
}) =>
  useCallback(async () => {
    if (!calibrationEquipment) return
    const companyId = String(calibrationForm.calibration_company_id || '').trim()
    const certificateNumber = String(calibrationForm.certificate_number || '').trim()
    if (!companyId) {
      setCalibrationFieldErrors((prev) => ({
        ...(prev || {}),
        calibration_company_id: 'Selecciona una empresa.',
      }))
      setCalibrationFocusField('calibration_company_id')
      setToast({
        open: true,
        message: 'Selecciona una empresa.',
        severity: 'error',
      })
      return
    }
    setCalibrationFieldErrors((prev) => {
      if (!prev?.calibration_company_id) return prev
      const next = { ...prev }
      delete next.calibration_company_id
      return next
    })
    setCalibrationFocusField('')
    if (!certificateNumber) {
      setCalibrationFieldErrors((prev) => ({
        ...(prev || {}),
        certificate_number: 'El numero de certificado es obligatorio.',
      }))
      setCalibrationFocusField('certificate_number')
      setToast({
        open: true,
        message: 'El numero de certificado es obligatorio.',
        severity: 'error',
      })
      return
    }
    setCalibrationFieldErrors((prev) => {
      if (!prev?.certificate_number) return prev
      const next = { ...prev }
      delete next.certificate_number
      return next
    })
    setCalibrationFocusField('')

    const isHydrometer = isHydrometerEquipment(calibrationEquipment)
    const isThermoHygro = isThermoHygrometerEquipment(calibrationEquipment)
    const equipmentTypeName = String(calibrationEquipment?.equipment_type?.name || '')
      .trim()
      .toLowerCase()
    const isBalance = equipmentTypeName === 'balanza analitica'
    const isKarlFischer = equipmentTypeName === 'titulador karl fischer'

    const toNumeric = (value) => {
      const normalized = String(value ?? '')
        .trim()
        .replace(',', '.')
      if (!normalized) return null
      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : null
    }

    const getKarlFischerSystematicError = (row) => {
      const pointValue = toNumeric(row.point_label)
      const volumeValue = toNumeric(row.volume_value)
      if (pointValue === null || volumeValue === null) return null
      return volumeValue - pointValue
    }

    const getHydrometerCorrection = (row) => {
      const referenceValue = toNumeric(row.reference_value)
      const measuredValue = toNumeric(row.measured_value)
      if (referenceValue === null || measuredValue === null) return null
      return referenceValue - measuredValue
    }

    const isRowFilled = (row) => {
      const hasValue =
        String(row.point_label || '').trim() ||
        String(row.reference_value || '').trim() ||
        String(row.measured_value || '').trim() ||
        String(row.error_value || '').trim() ||
        String(row.tolerance_value || '').trim() ||
        String(row.volume_value || '').trim() ||
        String(row.systematic_error || '').trim() ||
        String(row.systematic_emp || '').trim() ||
        String(row.random_error || '').trim() ||
        String(row.random_emp || '').trim() ||
        String(row.uncertainty_value || '').trim() ||
        String(row.k_value || '').trim() ||
        String(row.notes || '').trim() ||
        row.is_ok === 'true' ||
        row.is_ok === 'false'
      return Boolean(hasValue)
    }

    const mapRow = (row, overrides = {}) => {
      const systematicError = isKarlFischer
        ? getKarlFischerSystematicError(row)
        : isHydrometer
          ? getHydrometerCorrection(row)
          : String(row.systematic_error ?? '').trim() === ''
            ? null
            : Number(row.systematic_error)

      return {
        point_label: row.point_label?.trim() || null,
        reference_value:
          String(row.reference_value).trim() === '' ? null : Number(row.reference_value),
        measured_value:
          String(row.measured_value).trim() === '' ? null : Number(row.measured_value),
        unit: isHydrometer ? 'api' : row.unit?.trim() || null,
        error_value: String(row.error_value).trim() === '' ? null : Number(row.error_value),
        tolerance_value:
          String(row.tolerance_value).trim() === '' ? null : Number(row.tolerance_value),
        volume_value: String(row.volume_value).trim() === '' ? null : Number(row.volume_value),
        systematic_error: systematicError,
        systematic_emp:
          String(row.systematic_emp).trim() === '' ? null : Number(row.systematic_emp),
        random_error: String(row.random_error).trim() === '' ? null : Number(row.random_error),
        random_emp: String(row.random_emp).trim() === '' ? null : Number(row.random_emp),
        uncertainty_value:
          String(row.uncertainty_value).trim() === '' ? null : Number(row.uncertainty_value),
        k_value: String(row.k_value).trim() === '' ? null : Number(row.k_value),
        is_ok: row.is_ok === 'true' ? true : row.is_ok === 'false' ? false : null,
        notes: row.notes?.trim() || null,
        ...overrides,
      }
    }

    const hasEmptyRows = (rows = []) =>
      Array.isArray(rows) && rows.length > 0 && rows.some((row) => !isRowFilled(row))

    let results = []
    if (isThermoHygro) {
      if (hasEmptyRows(calibrationResultsTemp) || hasEmptyRows(calibrationResultsHumidity)) {
        setCalibrationFieldErrors((prev) => ({
          ...(prev || {}),
          calibration_results: 'Completa o elimina las filas vacias en resultados de medicion.',
        }))
        setCalibrationFocusField('calibration_results')
        setToast({
          open: true,
          message: 'Completa o elimina las filas vacias en resultados de medicion.',
          severity: 'error',
        })
        return
      }
      const tempRows = calibrationResultsTemp.filter(isRowFilled)
      const humidityRows = calibrationResultsHumidity.filter(isRowFilled)
      if (tempRows.length === 0 || humidityRows.length === 0) {
        setToast({
          open: true,
          message: 'El Termohigrometro requiere resultados en Temperatura y Humedad.',
          severity: 'error',
        })
        return
      }
      results = [
        ...tempRows.map((row) => mapRow(row, { unit: row.unit?.trim() || 'c' })),
        ...humidityRows.map((row) => mapRow(row, { unit: row.unit?.trim() || '%' })),
      ]
    } else {
      if (!isBalance && hasEmptyRows(calibrationResults)) {
        setCalibrationFieldErrors((prev) => ({
          ...(prev || {}),
          calibration_results: 'Completa o elimina las filas vacias en resultados de medicion.',
        }))
        setCalibrationFocusField('calibration_results')
        setToast({
          open: true,
          message: 'Completa o elimina las filas vacias en resultados de medicion.',
          severity: 'error',
        })
        return
      }
      results = calibrationResults.filter(isRowFilled).map((row) => mapRow(row))
    }
    setCalibrationFieldErrors((prev) => {
      if (!prev?.calibration_results) return prev
      const next = { ...prev }
      delete next.calibration_results
      return next
    })
    setCalibrationFocusField('')

    const payload = {
      calibrated_at:
        canEditCalibrationDate && calibrationForm.calibrated_at
          ? calibrationForm.calibrated_at
          : null,
      calibration_company_id: Number(companyId),
      certificate_number: certificateNumber,
      notes: calibrationForm.notes?.trim() || null,
      results,
    }

    const dateChanged =
      calibrationEditingId &&
      canEditCalibrationDate &&
      calibrationForm.calibrated_at &&
      calibrationOriginalDate &&
      calibrationForm.calibrated_at !== calibrationOriginalDate

    hideCalibrationDialog()
    setIsCalibrationWaitOpen(true)
    setIsCalibrationLoading(true)
    try {
      let calibrationId = calibrationEditingId
      if (calibrationEditingId && !dateChanged) {
        await updateEquipmentCalibration({
          tokenType,
          accessToken,
          calibrationId: calibrationEditingId,
          payload,
        })
      } else {
        const created = await createEquipmentCalibration({
          tokenType,
          accessToken,
          equipmentId: calibrationEquipment.id,
          payload,
        })
        calibrationId = created?.id || null
      }

      if (calibrationFile && calibrationId) {
        await uploadEquipmentCalibrationCertificate({
          tokenType,
          accessToken,
          calibrationId,
          file: calibrationFile,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setToast({
        open: true,
        message:
          calibrationEditingId && !dateChanged
            ? 'Calibracion actualizada correctamente.'
            : 'Calibracion registrada correctamente.',
        severity: 'success',
      })
      closeCalibration()
    } catch (err) {
      setToast({
        open: true,
        message:
          err?.detail ||
          (calibrationEditingId
            ? 'No se pudo actualizar la calibracion.'
            : 'No se pudo registrar la calibracion.'),
        severity: 'error',
      })
      setIsCalibrationOpen(true)
    } finally {
      setIsCalibrationLoading(false)
      setIsCalibrationWaitOpen(false)
    }
  }, [
    calibrationEquipment,
    calibrationForm,
    isHydrometerEquipment,
    isThermoHygrometerEquipment,
    calibrationResultsTemp,
    calibrationResultsHumidity,
    setToast,
    setCalibrationFieldErrors,
    setCalibrationFocusField,
    calibrationResults,
    canEditCalibrationDate,
    hideCalibrationDialog,
    setIsCalibrationWaitOpen,
    setIsCalibrationLoading,
    calibrationEditingId,
    calibrationOriginalDate,
    tokenType,
    accessToken,
    calibrationFile,
    queryClient,
    closeCalibration,
    setIsCalibrationOpen,
  ])

export { useEquipmentCalibrationSubmit }
