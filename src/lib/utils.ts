import { format } from 'date-fns'

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Safely format a date string or Date. Returns fallback (default '—') for
 * null / undefined / invalid values instead of throwing RangeError.
 */
export function safeFormat(
  value: string | Date | null | undefined,
  dateFormat: string,
  fallback = '—'
): string {
  if (!value) return fallback
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? fallback : format(d, dateFormat)
}
