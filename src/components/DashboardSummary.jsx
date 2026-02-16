const DashboardSummary = ({
  username,
  usersCount,
  isUsersLoading,
  equipments,
  isEquipmentsLoading,
  onLogout,
}) => {
  const items = Array.isArray(equipments)
    ? equipments.filter((item) => item?.is_active)
    : []
  const today = new Date()
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime()
  const soonThresholdDays = 30

  const parseDate = (value) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const getLastCalibrationDate = (equipment) => {
    const calibrations = Array.isArray(equipment?.calibrations)
      ? equipment.calibrations
      : []
    if (calibrations.length === 0) return null
    return calibrations
      .map((cal) => parseDate(cal?.calibrated_at))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0]
  }

  const formatDate = (date) =>
    date ? date.toLocaleDateString() : '-'

  const buildCalibrationStatus = (equipment) => {
    const calibrationDays = Number(equipment?.equipment_type?.calibration_days || 0)
    if (!calibrationDays || calibrationDays <= 0) return null
    const lastDate = getLastCalibrationDate(equipment)
    if (!lastDate) {
      return { status: 'missing', dueDate: null, lastDate: null }
    }
    const dueDate = new Date(lastDate.getTime())
    dueDate.setDate(dueDate.getDate() + calibrationDays)
    const dueTime = dueDate.getTime()
    if (dueTime < startOfToday) {
      return { status: 'overdue', dueDate, lastDate }
    }
    const diffDays = Math.ceil((dueTime - startOfToday) / (1000 * 60 * 60 * 24))
    if (diffDays <= soonThresholdDays) {
      return { status: 'due_soon', dueDate, lastDate }
    }
    return { status: 'ok', dueDate, lastDate }
  }

  const calibrationSummary = items
    .map((equipment) => ({
      equipment,
      status: buildCalibrationStatus(equipment),
    }))
    .filter((row) => row.status !== null)

  const missingCalibration = calibrationSummary.filter(
    (row) => row.status.status === 'missing'
  )
  const overdueCalibration = calibrationSummary.filter(
    (row) => row.status.status === 'overdue'
  )
  const dueSoonCalibration = calibrationSummary.filter(
    (row) => row.status.status === 'due_soon'
  )

  const renderEquipmentItem = (row) => {
    const equipment = row.equipment
    const status = row.status
    const serial = equipment?.serial || '-'
    const typeName = equipment?.equipment_type?.name || '-'
    const terminalName = equipment?.terminal?.name || '-'
    const dueLabel =
      status.status === 'missing'
        ? 'Sin calibracion'
        : `Vence: ${formatDate(status.dueDate)}`
    return `${serial} · ${typeName} · ${terminalName} · ${dueLabel}`
  }

  return (
    <section className="card dashboard-card">
      <h1>Dashboard</h1>
      <p className="subtitle">
        Hola, {username.trim() || 'usuario'}. Ya iniciaste sesion.
      </p>
      <div className="dashboard">
        <article>
          <h2>Usuarios</h2>
          <p>Resumen del sistema de usuarios.</p>
          <div className="meta">
            {isUsersLoading ? 'Cargando usuarios...' : `Total: ${usersCount}`}
          </div>
        </article>
        <article>
          <h2>Equipos</h2>
          <p>Estado de calibracion.</p>
          <div className="meta">
            {isEquipmentsLoading
              ? 'Cargando equipos...'
              : `Sin calibracion: ${missingCalibration.length} · Vencidas: ${overdueCalibration.length} · Proximas: ${dueSoonCalibration.length}`}
          </div>
          {!isEquipmentsLoading ? (
            <>
              {missingCalibration.length > 0 ? (
                <div className="meta">
                  <strong>Sin calibracion</strong>
                  <ul>
                    {missingCalibration.map((row) => (
                      <li key={`missing-${row.equipment?.id}`}>
                        {renderEquipmentItem(row)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {overdueCalibration.length > 0 ? (
                <div className="meta">
                  <strong>Calibracion vencida</strong>
                  <ul>
                    {overdueCalibration.map((row) => (
                      <li key={`overdue-${row.equipment?.id}`}>
                        {renderEquipmentItem(row)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {dueSoonCalibration.length > 0 ? (
                <div className="meta">
                  <strong>Proximas a vencer</strong>
                  <ul>
                    {dueSoonCalibration.map((row) => (
                      <li key={`due-${row.equipment?.id}`}>
                        {renderEquipmentItem(row)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </article>
      </div>
      <button type="button" className="secondary" onClick={onLogout}>
        Salir
      </button>
    </section>
  )
}

export default DashboardSummary
