import { useCallback } from 'react'
import { todayColombiaStr, utcToColombiaDateStr } from '../utils/dateUtils'

const mapCalibrationResultsRows = ({ results, defaultUnit }) => {
  if (!Array.isArray(results) || results.length === 0) return []
  return results.map((row) => ({
    point_label: row.point_label || '',
    reference_value: row.reference_value ?? '',
    measured_value: row.measured_value ?? '',
    unit: row.unit || defaultUnit,
    error_value: row.error_value ?? '',
    tolerance_value: row.tolerance_value ?? '',
    volume_value: row.volume_value ?? '',
    systematic_error: row.systematic_error ?? '',
    systematic_emp: row.systematic_emp ?? '',
    random_error: row.random_error ?? '',
    random_emp: row.random_emp ?? '',
    uncertainty_value: row.uncertainty_value ?? '',
    k_value: row.k_value ?? '',
    is_ok: row.is_ok === true ? 'true' : row.is_ok === false ? 'false' : '',
    notes: row.notes || '',
  }))
}

const useEquipmentCalibrationOpenHandlers = ({
  canEditCalibrationDate,
  isHydrometerEquipment,
  isKarlFischerEquipment,
  isWeightEquipmentType,
  isThermoHygrometerEquipment,
  getEmptyCalibrationRow,
  splitThermoHygroRows,
  setCalibrationEquipment,
  setCalibrationEditMode,
  setCalibrationEditingId,
  setCalibrationForm,
  setCalibrationCertificateUrl,
  setCalibrationResults,
  setCalibrationResultsTemp,
  setCalibrationResultsHumidity,
  setCalibrationFile,
  setCalibrationOriginalDate,
  setIsCalibrationHistoryOpen,
  setIsCalibrationOpen,
}) => {
  const openCalibrationHistoryEdit = useCallback(
    (equipment, calibration) => {
      if (!equipment || !calibration) return
      const isHydrometer = isHydrometerEquipment(equipment)
      const isKarlFischer = isKarlFischerEquipment(equipment)
      setCalibrationEquipment(equipment)
      setCalibrationEditMode(true)
      setCalibrationEditingId(calibration.id || null)
      const originalDate =
        canEditCalibrationDate && calibration.calibrated_at
          ? utcToColombiaDateStr(calibration.calibrated_at)
          : ''
      setCalibrationOriginalDate(originalDate)
      setCalibrationForm({
        calibrated_at: originalDate,
        calibration_company_id: calibration.calibration_company_id
          ? String(calibration.calibration_company_id)
          : '',
        certificate_number: calibration.certificate_number || '',
        notes: calibration.notes || '',
      })
      setCalibrationCertificateUrl(calibration.certificate_pdf_url || '')
      const defaultUnit = isHydrometer ? 'api' : isKarlFischer ? 'ml' : ''
      const mappedResults = mapCalibrationResultsRows({
        results: calibration.results,
        defaultUnit,
      })
      const rowsWithFallback =
        mappedResults.length > 0 ? mappedResults : [getEmptyCalibrationRow(defaultUnit)]
      const split = splitThermoHygroRows(equipment, rowsWithFallback)
      if (split) {
        setCalibrationResultsTemp(split.temp)
        setCalibrationResultsHumidity(split.humidity)
        setCalibrationResults([])
      } else {
        setCalibrationResults(rowsWithFallback)
        setCalibrationResultsTemp([])
        setCalibrationResultsHumidity([])
      }
      setCalibrationFile(null)
      setIsCalibrationHistoryOpen(false)
      setIsCalibrationOpen(true)
    },
    [
      isHydrometerEquipment,
      isKarlFischerEquipment,
      setCalibrationEquipment,
      setCalibrationEditMode,
      setCalibrationEditingId,
      setCalibrationForm,
      canEditCalibrationDate,
      setCalibrationCertificateUrl,
      getEmptyCalibrationRow,
      splitThermoHygroRows,
      setCalibrationResultsTemp,
      setCalibrationResultsHumidity,
      setCalibrationResults,
      setCalibrationFile,
      setCalibrationOriginalDate,
      setIsCalibrationHistoryOpen,
      setIsCalibrationOpen,
    ],
  )

  const openCalibration = useCallback(
    (equipment) => {
      if (!equipment) return
      const today = todayColombiaStr()
      const isHydrometer = isHydrometerEquipment(equipment)
      const isWeight = isWeightEquipmentType(equipment?.equipment_type)
      const isKarlFischer = isKarlFischerEquipment(equipment)
      const isThermoHygro = isThermoHygrometerEquipment(equipment)
      const isScale =
        String(equipment?.equipment_type?.name || '')
          .trim()
          .toLowerCase() === 'balanza analitica'
      const calibrations = Array.isArray(equipment?.calibrations) ? equipment.calibrations : []
      const latest = [...calibrations]
        .filter((item) => item?.calibrated_at)
        .sort((a, b) => new Date(b.calibrated_at) - new Date(a.calibrated_at))[0]
      const defaultUnit = isHydrometer ? 'api' : isWeight ? 'g' : isKarlFischer ? 'ml' : ''

      setCalibrationEquipment(equipment)
      if (latest) {
        setCalibrationEditMode(true)
        setCalibrationEditingId(latest.id || null)
        const latestOriginalDate = canEditCalibrationDate
          ? utcToColombiaDateStr(latest.calibrated_at)
          : ''
        setCalibrationOriginalDate(latestOriginalDate)
        setCalibrationForm({
          calibrated_at: latestOriginalDate,
          calibration_company_id: latest.calibration_company_id
            ? String(latest.calibration_company_id)
            : '',
          certificate_number: latest.certificate_number || '',
          notes: latest.notes || '',
        })
        setCalibrationCertificateUrl(latest.certificate_pdf_url || '')
        const mapped = mapCalibrationResultsRows({
          results: latest.results,
          defaultUnit,
        })
        const rowsWithFallback = mapped.length > 0 ? mapped : isScale ? [] : [getEmptyCalibrationRow(defaultUnit)]
        if (isThermoHygro) {
          const split = splitThermoHygroRows(equipment, rowsWithFallback)
          const temp = split?.temp || []
          const humidity = split?.humidity || []
          setCalibrationResultsTemp(temp)
          setCalibrationResultsHumidity(humidity)
          setCalibrationResults([])
        } else {
          setCalibrationResults(rowsWithFallback)
          setCalibrationResultsTemp([])
          setCalibrationResultsHumidity([])
        }
      } else {
        setCalibrationEditMode(false)
        setCalibrationEditingId(null)
        setCalibrationOriginalDate('')
        setCalibrationForm({
          calibrated_at: canEditCalibrationDate ? today : '',
          calibration_company_id: '',
          certificate_number: '',
          notes: '',
        })
        setCalibrationCertificateUrl('')
        const fresh = isScale ? [] : [getEmptyCalibrationRow(defaultUnit)]
        if (isThermoHygro) {
          setCalibrationResultsTemp([getEmptyCalibrationRow('c')])
          setCalibrationResultsHumidity([getEmptyCalibrationRow('%')])
          setCalibrationResults([])
        } else {
          setCalibrationResults(fresh)
          setCalibrationResultsTemp([])
          setCalibrationResultsHumidity([])
        }
      }
      setCalibrationFile(null)
      setIsCalibrationOpen(true)
    },
    [
      isHydrometerEquipment,
      isWeightEquipmentType,
      isKarlFischerEquipment,
      isThermoHygrometerEquipment,
      setCalibrationEquipment,
      setCalibrationEditMode,
      setCalibrationEditingId,
      setCalibrationForm,
      canEditCalibrationDate,
      setCalibrationCertificateUrl,
      getEmptyCalibrationRow,
      splitThermoHygroRows,
      setCalibrationResultsTemp,
      setCalibrationResultsHumidity,
      setCalibrationResults,
      setCalibrationFile,
      setCalibrationOriginalDate,
      setIsCalibrationOpen,
    ],
  )

  return { openCalibrationHistoryEdit, openCalibration }
}

export { useEquipmentCalibrationOpenHandlers, mapCalibrationResultsRows }
