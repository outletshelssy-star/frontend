const formatUserType = (value) => {
  if (!value) return 'N/A'
  const asText = String(value).replaceAll('_', ' ')
  return asText.charAt(0).toUpperCase() + asText.slice(1)
}

export { formatUserType }
