/**
 * Collection of Date/time helpers
 */

export const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTHS_SHORT = MONTHS.map(name => name.substring(0, 3))

export function clone(value) {
  return new Date(value.getTime())
}

export function addHours(date, amt) {
  let next = clone(date)
  amt = (date.getHours() + amt) % 24
  if (amt < 0) amt += 24
  next.setHours(amt)
  return next
}

export function addMinutes(date, amt) {
  let next = clone(date)
  amt = (date.getMinutes() + amt) % 60
  if (amt < 0) amt += 60
  next.setMinutes(amt)
  return next
}

export function getHour(date) {
  // 0 == 12
  return (date.getHours() % 12) || 12
}

export function getMinute(date) {
  let minute = date.getMinutes()
  if (minute < 10) return '0' + minute
  return '' + minute
}

// 0-11 AM, 12-23 PM
export function getPeriod(date) {
  return date.getHours() > 11 ? 'PM' : 'AM'
}

export function getDecade(value) {
  return 10 * Math.floor(value.getFullYear() / 10)
}

/**
 * Convert '1987-07-10' as-is into local time
 */
export function parseDateString(src) {
  let parts = src.split('-')
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/**
 * e.g. 1987-07-10
 * in the local timezone, as opposed to UTC
 */
export function toDateString(date) {
  let yyyy = date.getFullYear()
  let mm = date.getMonth() + 1
  if (mm < 10) mm = '0' + mm
  let dd = date.getDate()
  if (dd < 10) dd = '0' + dd
  return `${yyyy}-${mm}-${dd}`
}

export function parseTimeString(src) {
  let parts = src.split(':')
  return new Date(0, 0, 1, parts[0], parts[1], parts[2])
}

export function toTimeString(date) {
  return date.toTimeString().substring(0, 8)
}

export function toDateTimeString(date) {
  return toDateString(date) + ' ' + toTimeString(date)
}

/**
 * @param {number} month 0-11
 * @param {number} year 1970...
 */
export function getDaysPerMonth(month, year) {
  if (month === -1) {
    month = 11
    year = year - 1
  }
  if (month === 1) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
      ? 29 : 28 // leap years
  }
  return DAYS_PER_MONTH[month]
}
