const formatUserType = (value) => {
  if (!value) return 'N/A'
  const normalized = String(value).toLowerCase()
  const labels = {
    superadmin: 'Superadmin',
    admin: 'Admin',
    user: 'Usuario',
    visitor: 'Visitante',
  }
  return labels[normalized] || normalized.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase())
}

export { formatUserType }
