import { useMemo } from 'react'

const useSampleEquipmentOptions = (equipments, equipmentTerminalId) => {
  const hydrometerOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const roleType = String(item?.equipment_type?.role || '').toLowerCase()
      if (roleType !== 'working') return false
      const name = String(item?.equipment_type?.name || '').toLowerCase()
      return name === 'hidrometro'
    })
  }, [equipments, equipmentTerminalId])

  const thermometerOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const roleType = String(item?.equipment_type?.role || '').toLowerCase()
      if (roleType !== 'working') return false
      const name = String(item?.equipment_type?.name || '').toLowerCase()
      return name.includes('termometro')
    })
  }, [equipments, equipmentTerminalId])

  const kfEquipmentOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const typeName = String(item?.equipment_type?.name || '').toLowerCase()
      return typeName === 'titulador karl fischer'
    })
  }, [equipments, equipmentTerminalId])

  const balanceOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const typeName = String(item?.equipment_type?.name || '').toLowerCase()
      return typeName === 'balanza analitica'
    })
  }, [equipments, equipmentTerminalId])

  const thermohygrometerOptions = useMemo(() => {
    if (!Array.isArray(equipments)) return []
    return equipments.filter((item) => {
      if (!item?.id) return false
      if (String(item.terminal_id) !== String(equipmentTerminalId)) return false
      if (item.status !== 'in_use') return false
      const typeName = String(item?.equipment_type?.name || '').toLowerCase()
      return typeName === 'termohigrometro'
    })
  }, [equipments, equipmentTerminalId])

  return { hydrometerOptions, thermometerOptions, kfEquipmentOptions, balanceOptions, thermohygrometerOptions }
}

export default useSampleEquipmentOptions
