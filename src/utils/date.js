export function parseToDate(value) {
  if (!value) return null
  // Accept ISO, space-separated, or datetime-local formats
  let v = value
  // If value looks like 'YYYY-MM-DD HH:MM:SS' convert space to T
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v)) v = v.replace(' ', 'T')
  // If value has no timezone, Date will treat as local
  const d = new Date(v)
  if (isNaN(d)) return null
  return d
}

export function formatDateTime(value, opts = {}) {
  const d = typeof value === 'string' ? parseToDate(value) : value
  if (!d) return value || ''
  const locale = opts.locale || navigator?.language || 'en-US'
  const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' }
  const timeOpts = { hour: '2-digit', minute: '2-digit' }
  return `${new Intl.DateTimeFormat(locale, dateOpts).format(d)} ${new Intl.DateTimeFormat(locale, timeOpts).format(d)}`
}

export function isBefore(a, b) {
  const da = parseToDate(a)
  const db = parseToDate(b)
  if (!da || !db) return false
  return da.getTime() < db.getTime()
}
