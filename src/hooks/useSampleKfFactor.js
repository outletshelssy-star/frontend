import { useEffect, useState } from 'react'
import { fetchEquipmentTypeVerifications, fetchEquipmentVerifications } from '../services/api'
import { parseKfFactorAvgFromNotes, formatKfFactor } from '../utils/sampleUtils'

const useSampleKfFactor = ({ isResultsOpen, accessToken, tokenType, kfEquipmentId, kfEquipmentOptions, analyzedAt, setResultsForm }) => {
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
        const analysisDate = analyzedAt ? String(analyzedAt).slice(0, 10) : null
        let target = null
        if (analysisDate) {
          target = dailyVerifications.find(
            (item) => new Date(item.verified_at).toISOString().slice(0, 10) === analysisDate,
          )
          if (!target) {
            setKfFactorHelper(`No hay verificacion diaria para la fecha del analisis (${analysisDate}).`)
            return
          }
        } else {
          target = dailyVerifications.reduce((acc, item) => {
            if (!acc) return item
            return new Date(item.verified_at).getTime() > new Date(acc.verified_at).getTime() ? item : acc
          }, null)
        }
        const factor = target ? parseKfFactorAvgFromNotes(target.notes) : null
        if (factor === null) {
          setKfFactorHelper('No se encontro factor promedio en la verificacion diaria.')
          return
        }
        setKfFactorHelper('')
        setResultsForm((prev) => {
          const current = String(prev.water.kf_factor_avg || '').trim()
          const isEffectivelyEmpty = !current || Number(current) === 0
          if (!isEffectivelyEmpty) return prev
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
  }, [accessToken, analyzedAt, isResultsOpen, kfEquipmentId, kfEquipmentOptions, tokenType])

  return { kfFactorHelper }
}

export default useSampleKfFactor
