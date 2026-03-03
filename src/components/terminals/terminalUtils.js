const TERMINAL_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const TERMINAL_ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20]

const getTerminalStatusColors = (isActive) => {
  return isActive ? { fg: '#166534', bg: '#dcfce7' } : { fg: '#991b1b', bg: '#fee2e2' }
}

const formatTerminalDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

export {
  TERMINAL_ROWS_PER_PAGE_OPTIONS,
  TERMINAL_STATUS_FILTER_OPTIONS,
  formatTerminalDate,
  getTerminalStatusColors,
}
