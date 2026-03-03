const BLOCK_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const BLOCK_ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20]

const getBlockStatusColors = (isActive) => {
  return isActive ? { fg: '#166534', bg: '#dcfce7' } : { fg: '#991b1b', bg: '#fee2e2' }
}

export { BLOCK_ROWS_PER_PAGE_OPTIONS, BLOCK_STATUS_OPTIONS, getBlockStatusColors }
