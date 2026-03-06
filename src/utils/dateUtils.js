/**
 * Utilidades de fecha/hora para el timezone de Colombia (America/Bogota, UTC-5).
 *
 * La base de datos almacena todo en UTC. Estas funciones centralizan la
 * conversión entre UTC y la hora local colombiana para mostrar y enviar fechas.
 *
 * Uso general:
 *  - Mostrar fechas al usuario              → formatDateCO / formatDateTimeCO
 *  - Obtener "hoy" para inputs/max          → todayColombiaStr()
 *  - Mes/año actual para filtros            → colombiaMonth() / colombiaYear()
 *  - Inicio del día actual en Colombia      → colombiaMidnightUTC()
 *  - Convertir cualquier Date a fecha CO    → toColombiaDateStr(date)
 *  - Pre-llenar input desde UTC del backend → utcToColombiaDateStr()
 *  - Enviar fecha al backend como UTC       → localDateToUTCIso()
 */

const TZ = 'America/Bogota'

/**
 * Retorna la fecha de hoy como 'YYYY-MM-DD' en timezone de Colombia.
 * Reemplaza: new Date().toISOString().slice(0, 10)  ← eso es UTC, no Colombia.
 *
 * @returns {string} e.g. '2026-03-05'
 */
export const todayColombiaStr = () => {
  // 'en-CA' locale produce formato YYYY-MM-DD nativo
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Retorna el año actual en timezone de Colombia.
 * Reemplaza: new Date().getFullYear()
 *
 * @returns {number} e.g. 2026
 */
export const colombiaYear = () => {
  return Number(todayColombiaStr().slice(0, 4))
}

/**
 * Retorna el mes actual (1-12) en timezone de Colombia.
 * Reemplaza: new Date().getMonth() + 1
 *
 * @returns {number} e.g. 3
 */
export const colombiaMonth = () => {
  return Number(todayColombiaStr().slice(5, 7))
}

/**
 * Formatea una fecha UTC del backend para mostrar solo la fecha en Colombia.
 * Reemplaza: new Date(value).toLocaleDateString()
 *
 * @param {string|null} value  ISO string UTC, e.g. '2026-03-06T05:30:00Z'
 * @returns {string}           e.g. '6/03/2026' o '-' si no hay valor
 */
export const formatDateCO = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('es-CO', { timeZone: TZ })
}

/**
 * Formatea una fecha UTC del backend para mostrar fecha y hora en Colombia.
 * Formato 24h con segundos: '06/03/2026, 00:30:00'
 * Reemplaza: new Date(value).toLocaleString(...)
 *
 * @param {string|null} value  ISO string UTC, e.g. '2026-03-06T05:30:00Z'
 * @returns {string}           e.g. '06/03/2026, 00:30:00' o '-' si no hay valor
 */
export const formatDateTimeCO = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('es-CO', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export const formatDateTimeShortCO = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date
    .toLocaleString('es-CO', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')
}

/**
 * Retorna el inicio del día actual (medianoche) en Colombia como objeto Date UTC.
 * Reemplaza: new Date(today.getFullYear(), today.getMonth(), today.getDate())
 * que usa el timezone del navegador (puede no ser Colombia).
 *
 * @returns {Date} Medianoche Colombia como Date UTC, e.g. 2026-03-06T05:00:00.000Z
 */
export const colombiaMidnightUTC = () => {
  return new Date(`${todayColombiaStr()}T00:00:00-05:00`)
}

/**
 * Convierte cualquier objeto Date (o timestamp) a 'YYYY-MM-DD' en Colombia.
 * Útil para extraer mes/año en timezone Colombia al filtrar registros.
 * Reemplaza: date.getMonth() / date.getFullYear() que usan timezone local.
 *
 * @param {Date|number} date  Objeto Date o timestamp ms
 * @returns {string}          e.g. '2026-03-06'
 */
export const toColombiaDateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Convierte una cadena ISO UTC del backend a 'YYYY-MM-DD' en Colombia.
 * Útil para pre-llenar campos <input type="date"> desde datos del servidor.
 * Reemplaza: new Date(value).toISOString().slice(0, 10)  ← eso recorta en UTC.
 *
 * @param {string|null} value  ISO string UTC, e.g. '2026-03-06T05:00:00Z'
 * @returns {string}           e.g. '2026-03-06'
 */
export const utcToColombiaDateStr = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Extrae la hora y minuto de un valor ISO UTC convirtiéndolo a Colombia.
 * El minuto se redondea hacia abajo al múltiplo de 15 más cercano (00/15/30/45).
 *
 * @param {string|null} value  ISO string UTC, e.g. '2026-03-06T19:30:00Z'
 * @returns {{ hour: string, minute: string }}  e.g. { hour: '14', minute: '30' }
 */
export const utcToColombiaHourMinute = (value) => {
  if (!value) return { hour: '00', minute: '00' }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return { hour: '00', minute: '00' }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(d)
    .split(':')
  const hour = (parts[0] || '00').padStart(2, '0')
  const rawMin = Number(parts[1] || 0)
  const minute = String(Math.floor(rawMin / 15) * 15).padStart(2, '0')
  return { hour, minute }
}

/**
 * Convierte una fecha 'YYYY-MM-DD' (medianoche Colombia) a ISO UTC
 * para enviar al backend.
 * Colombia es UTC-5, por lo que medianoche Colombia = 05:00 UTC del mismo día.
 *
 * @param {string|null} dateStr  e.g. '2026-03-06'
 * @returns {string|null}        e.g. '2026-03-06T05:00:00.000Z'
 */
export const localDateToUTCIso = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(`${dateStr}T00:00:00-05:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
