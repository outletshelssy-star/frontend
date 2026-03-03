const ROLE_OPTIONS = [
  { value: 'reference', label: 'Patron' },
  { value: 'working', label: 'Trabajo' },
]

const MEASURE_OPTIONS = [
  { value: 'temperature', label: 'Temperatura' },
  { value: 'relative_humidity', label: 'Humedad relativa' },
  { value: 'pressure', label: 'Presion' },
  { value: 'length', label: 'Longitud' },
  { value: 'weight', label: 'Peso' },
  { value: 'api', label: 'API' },
  { value: 'percent_pv', label: '% p/v' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20]

const formatDaysWithUnit = (value) => {
  const numeric = Number(value ?? 0)
  if (numeric <= 0) return 'No aplica'
  return numeric === 1 ? `${numeric} dia` : `${numeric} dias`
}

export {
  MEASURE_OPTIONS,
  ROLE_OPTIONS,
  ROWS_PER_PAGE_OPTIONS,
  STATUS_FILTER_OPTIONS,
  formatDaysWithUnit,
}
