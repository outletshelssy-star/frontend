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
  calibrationFile,
  canEditCalibrationDate,
  isHydrometerEquipment,
  isThermoHygrometerEquipment,
  hideCalibrationDialog,
  closeCalibration,
  setToast,
  setIsCalibrationWaitOpen,
  setIsCalibrationLoading,
  setIsCalibrationOpen,
}) =>
  useCallback(async () => {
    if (!calibrationEquipment) return
    const companyId = String(calibrationForm.calibration_company_id || '').trim()
    const certificateNumber = String(calibrationForm.certificate_number || '').trim()
    if (!companyId) {
      setToast({
        open: true,
        message: 'Selecciona una empresa.',
        severity: 'error',
      })
      return
    }
    if (!certificateNumber) {
      setToast({
        open: true,
        message: 'El numero de certificado es obligatorio.',
        severity: 'error',
      })
      return
    }

    const isHydrometer = isHydrometerEquipment(calibrationEquipment)
    const isThermoHygro = isThermoHygrometerEquipment(calibrationEquipment)

    const isRowFilled = (row) => {
      const hasValue =
        String(row.point_label || '').trim() ||
        String(row.reference_value || '').trim() ||
        String(row.measured_value || '').trim() ||
        String(row.unit || '').trim() ||
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

    const mapRow = (row, overrides = {}) => ({
      point_label: row.point_label?.trim() || null,
      reference_value: String(row.reference_value).trim() === '' ? null : Number(row.reference_value),
      measured_value: String(row.measured_value).trim() === '' ? null : Number(row.measured_value),
      unit: isHydrometer ? 'api' : row.unit?.trim() || null,
      error_value: String(row.error_value).trim() === '' ? null : Number(row.error_value),
      tolerance_value: String(row.tolerance_value).trim() === '' ? null : Number(row.tolerance_value),
      volume_value: String(row.volume_value).trim() === '' ? null : Number(row.volume_value),
      systematic_error: String(row.systematic_error).trim() === '' ? null : Number(row.systematic_error),
      systematic_emp: String(row.systematic_emp).trim() === '' ? null : Number(row.systematic_emp),
      random_error: String(row.random_error).trim() === '' ? null : Number(row.random_error),
      random_emp: String(row.random_emp).trim() === '' ? null : Number(row.random_emp),
      uncertainty_value:
        String(row.uncertainty_value).trim() === '' ? null : Number(row.uncertainty_value),
      k_value: String(row.k_value).trim() === '' ? null : Number(row.k_value),
      is_ok: row.is_ok === 'true' ? true : row.is_ok === 'false' ? false : null,
      notes: row.notes?.trim() || null,
      ...overrides,
    })

    let results = []
    if (isThermoHygro) {
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
      results = calibrationResults.filter(isRowFilled).map((row) => mapRow(row))
    }

    const payload = {
      calibrated_at:
        canEditCalibrationDate && calibrationForm.calibrated_at ? calibrationForm.calibrated_at : null,
      calibration_company_id: Number(companyId),
      certificate_number: certificateNumber,
      notes: calibrationForm.notes?.trim() || null,
      results,
    }

    hideCalibrationDialog()
    setIsCalibrationWaitOpen(true)
    setIsCalibrationLoading(true)
    try {
      let calibrationId = calibrationEditingId
      if (calibrationEditingId) {
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
        message: calibrationEditingId
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
    calibrationResults,
    canEditCalibrationDate,
    hideCalibrationDialog,
    setIsCalibrationWaitOpen,
    setIsCalibrationLoading,
    calibrationEditingId,
    tokenType,
    accessToken,
    calibrationFile,
    queryClient,
    closeCalibration,
    setIsCalibrationOpen,
  ])

export { useEquipmentCalibrationSubmit }
