import { useEffect, useState } from 'react'
import { fetchEquipmentTypeVerifications, fetchEquipmentVerifications } from '../services/api'
import { parseKfFactorAvgFromNotes, formatKfFactor } from '../utils/sampleUtils'

const useSampleKfFactor = ({ isResultsOpen, accessToken, tokenType, kfEquipmentId, kfEquipmentOptions, setResultsForm }) => {
  const [kfFactorHelper, setKfFactorHelper] = useState('')

  useEffect(() => {
    const selectedId = String(kfEquipmentId || '')
    if (!isResultsOpen || !selectedId || !accessToken) {
      setKfFactorHelper('')
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const selectedEquipment = kfEquipmentOptions.find((item) => String(item.id) === selectedId)
        const equipmentTypeId = selectedEquipment?.equipment_type_id
        if (!equipmentTypeId) {
          setKfFactorHelper('No se encontro el tipo de equipo KF.')
          return
        }
        const [typesData, verificationsData] = await Promise.all([
          fetchEquipmentTypeVerifications({
            tokenType,
            accessToken,
            equipmentTypeId,
          }),
          fetchEquipmentVerifications({
            tokenType,
            accessToken,
            equipmentId: Number(selectedId),
          }),
        ])
        if (cancelled) return
        const types = Array.isArray(typesData?.items) ? typesData.items : []
        const dailyType = types.find((item) => Number(item.frequency_days) === 1)
        if (!dailyType?.id) {
          setKfFactorHelper('No hay tipo de verificacion diaria configurado.')
          return
        }
        const verifications = Array.isArray(verificationsData?.items) ? verificationsData.items : []
        const dailyVerifications = verifications.filter(
          (item) => String(item.verification_type_id) === String(dailyType.id),
        )
        if (dailyVerifications.length === 0) {
          setKfFactorHelper('No hay verificaciones diarias disponibles.')
          return
        }
        const latest = dailyVerifications.reduce((acc, item) => {
          if (!acc) return item
          const accDate = new Date(acc.verified_at).getTime()
          const itemDate = new Date(item.verified_at).getTime()
          return itemDate > accDate ? item : acc
        }, null)
        const factor = latest ? parseKfFactorAvgFromNotes(latest.notes) : null
        if (factor === null) {
          setKfFactorHelper('No se encontro factor promedio en la verificacion diaria.')
          return
        }
        setKfFactorHelper('')
        setResultsForm((prev) => {
          const current = String(prev.water.kf_factor_avg || '').trim()
          if (current) return prev
          return {
            ...prev,
            water: { ...prev.water, kf_factor_avg: formatKfFactor(factor) },
          }
        })
      } catch {
        if (cancelled) return
        setKfFactorHelper('No se pudo cargar el factor promedio KF.')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [accessToken, isResultsOpen, kfEquipmentId, kfEquipmentOptions, tokenType])

  return { kfFactorHelper }
}

export default useSampleKfFactor
