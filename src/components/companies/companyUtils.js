const COMPANY_TYPE_OPTIONS = [
  { value: 'master', label: 'Matriz' },
  { value: 'client', label: 'Cliente' },
  { value: 'partner', label: 'Aliado' },
]

const COMPANY_FILTER_TYPE_OPTIONS = [{ value: 'all', label: 'Todos' }, ...COMPANY_TYPE_OPTIONS]

const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20]

const getCompanyTypeLabel = (type) => {
  const key = String(type || '').toLowerCase()
  if (key === 'master') return 'Matriz'
  if (key === 'client') return 'Cliente'
  if (key === 'partner') return 'Aliado'
  return type || '-'
}

const getCompanyTypeColors = (type) => {
  if (type === 'master') return { fg: '#5b21b6', bg: '#ede9fe' }
  if (type === 'partner') return { fg: '#1d4ed8', bg: '#dbeafe' }
  return { fg: '#0f766e', bg: '#ccfbf1' }
}

const getCompanyStatusColors = (isActive) => {
  return isActive ? { fg: '#16a34a', bg: '#dcfce7' } : { fg: '#b91c1c', bg: '#fee2e2' }
}

export {
  COMPANY_FILTER_TYPE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  ROWS_PER_PAGE_OPTIONS,
  getCompanyStatusColors,
  getCompanyTypeColors,
  getCompanyTypeLabel,
}
