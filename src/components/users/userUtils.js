const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20]

const USER_ROLE_OPTIONS = [
  { value: 'visitor', label: 'Visitante' },
  { value: 'user', label: 'Usuario' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
]

const USER_ROLE_FILTER_OPTIONS = [{ value: 'all', label: 'Todos' }, ...USER_ROLE_OPTIONS]

const USER_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

const TERMINAL_CHIP_PALETTE = [
  { bg: '#e0f2fe', fg: '#075985' },
  { bg: '#dcfce7', fg: '#166534' },
  { bg: '#fef3c7', fg: '#92400e' },
  { bg: '#fee2e2', fg: '#991b1b' },
  { bg: '#ede9fe', fg: '#5b21b6' },
  { bg: '#e0e7ff', fg: '#3730a3' },
  { bg: '#cffafe', fg: '#0e7490' },
  { bg: '#fce7f3', fg: '#9d174d' },
]

const getTerminalChipStyle = (name = '') => {
  const normalized = String(name).toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 2147483647
  }
  const index = TERMINAL_CHIP_PALETTE.length ? Math.abs(hash) % TERMINAL_CHIP_PALETTE.length : 0
  const colors = TERMINAL_CHIP_PALETTE[index] || TERMINAL_CHIP_PALETTE[0]
  return {
    backgroundColor: colors.bg,
    color: colors.fg,
    fontWeight: 600,
    fontSize: '0.7rem',
    height: 20,
  }
}

export {
  ROWS_PER_PAGE_OPTIONS,
  USER_ROLE_FILTER_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_FILTER_OPTIONS,
  getTerminalChipStyle,
}
