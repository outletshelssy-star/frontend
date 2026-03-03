const getStoredFilterValue = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch (err) {
    return raw
  }
}

export { getStoredFilterValue }
