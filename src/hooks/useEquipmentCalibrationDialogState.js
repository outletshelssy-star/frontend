import { useCallback } from 'react'

const EMPTY_CALIBRATION_FORM = {
  calibrated_at: '',
  calibration_company_id: '',
  certificate_number: '',
  notes: '',
}

const useEquipmentCalibrationDialogState = ({
  setIsCalibrationOpen,
  setCalibrationEquipment,
  setCalibrationForm,
  setCalibrationResults,
  setCalibrationResultsTemp,
  setCalibrationResultsHumidity,
  setCalibrationFile,
  setCalibrationCertificateUrl,
  setCalibrationEditMode,
  setCalibrationEditingId,
}) => {
  const closeCalibration = useCallback(() => {
    setIsCalibrationOpen(false)
    setCalibrationEquipment(null)
    setCalibrationForm({ ...EMPTY_CALIBRATION_FORM })
    setCalibrationResults([])
    setCalibrationResultsTemp([])
    setCalibrationResultsHumidity([])
    setCalibrationFile(null)
    setCalibrationCertificateUrl('')
    setCalibrationEditMode(false)
    setCalibrationEditingId(null)
  }, [
    setIsCalibrationOpen,
    setCalibrationEquipment,
    setCalibrationForm,
    setCalibrationResults,
    setCalibrationResultsTemp,
    setCalibrationResultsHumidity,
    setCalibrationFile,
    setCalibrationCertificateUrl,
    setCalibrationEditMode,
    setCalibrationEditingId,
  ])

  const hideCalibrationDialog = useCallback(() => {
    setIsCalibrationOpen(false)
  }, [setIsCalibrationOpen])

  return { closeCalibration, hideCalibrationDialog }
}

export { useEquipmentCalibrationDialogState }
