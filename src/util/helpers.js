import querystring from 'querystring'
import Promise from './promise'

export const REGX_EMAIL = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
export const REGX_STUDENT_ID = /^[0-9]{1,10}$/
export const REGX_COURSE_ID = /^[0-9a-zA-Z_-]{1,255}$/
export const REGX_LETTERS = /^(?:([ABCDE])(?!.*\1))*$/i
export const REGX_COURSE_TAG = /^[a-z]{2,16}$/i

const add = (x, y) => x + y
export const mean = (values) => values.reduce(add, 0) / values.length || 0

export function parseQueryString(str) {
  return querystring.parse(str.charAt(0) === '?' ? str.substring(1) : str)
}

export function findBy(objects, predicate) {
  if (!objects) return null
  for (let index = 0; index < objects.length; index++) {
    if (predicate(objects[index])) return objects[index]
  }
  return null
}

export function findById(objects, id) {
  if (!objects) return null
  for (let index = 0; index < objects.length; index++) {
    if (objects[index].id === id) return objects[index]
  }
  return null
}

/** Faster alternative to _.cloneDeep for strict JSON objects */
export const cloneJSON = (src) => JSON.parse(JSON.stringify(src))

export const hasOwn = (src, key) => Object.prototype.hasOwnProperty.call(src, key)

/**
 * Template literals tag; eliminates leading indentation
 * @example outdent`\n    foo\n    bar\n` => "foo\nbar"
 */
export function outdent(parts, ...args) {
  let indentationLevel = parts[0].match(/(\n)([ \t]*)(?:\S|$)/)[2].length
  let indentPattern = new RegExp(`(\\n)[ \t]{0,${indentationLevel}}`, 'g')
  parts = parts.map(chunk => chunk.replace(indentPattern, '$1'))
  return joinTemplateString(parts, args)
}

/**
 * May be used by tagged template literals
 * note: true for all template literals: parts.length === args.length + 1
 * @param {array} parts List of strings
 * @param {array} args List of template params
 * @return {string}
 */
export function joinTemplateString(parts, args) {
  let combined = new Array(parts.length + args.length)
  let index = 0
  for (; index < parts.length - 1; ++index) {
    combined[index * 2] = parts[index]
    combined[index*2 + 1] = args[index]
  }
  combined[index * 2] = parts[index]
  return combined.join('').trim()
}

/**
 * Auto bind owned methods for an es2015-style react Class
 * @example autobind(this, ['showPage', 'click', 'enter'])
 * @param {React.Component} instance
 * @param {string[]} methods
 */
export function autobind(instance, methods) {
  for (let index = 0; index < methods.length; index++) {
    instance[methods[index]] = instance[methods[index]].bind(instance)
  }
}

/**
 * Fast object comparison. Uses strict equality on 1st level props
 */
export function shallowEqual(xx, yy) {
  if (!xx && !yy) return true
  if (!xx && yy || xx && !yy) return false
  var xkeys = 0, ykeys = 0, key // eslint-disable-line
  for (key in yy) {
    ykeys += 1
    if (!hasOwn(xx, key) || xx[key] !== yy[key]) return false
  }
  for (key in xx) xkeys += 1
  return xkeys === ykeys
}

/**
 * Find all focusable descendants of a container element
 * @param {DOMElement} container
 * @return {DOMElement[]}
 */
export function findFocusable(container) {
  return [].slice.call(container.querySelectorAll('*'), 0).filter(DOMisTabStop)
}

export function isTabbingOut(evt, container) {
  let possible = findFocusable(container)
  if (possible.length === 0) return true
  let finalElement = possible[evt.shiftKey ? 0 : possible.length - 1]
  return finalElement === evt.target
    || (evt.shiftKey && container === evt.target)
}

function DOMisTabStop(element) {
  let tabIndex = element.getAttribute('tabindex')
  if (tabIndex === null) tabIndex = undefined
  let isTabIndexNaN = isNaN(tabIndex)
  return (isTabIndexNaN || tabIndex >= 0) && DOMcanFocus(element, !isTabIndexNaN)
}
function DOMcanFocus(element, isTabIndexNotNaN) {
  var nodeName = element.nodeName.toLowerCase()
  return (
    /input|select|textarea|button|object/.test(nodeName)
    ? !element.disabled
    : 'a' === nodeName
      ? element.href || isTabIndexNotNaN
      : isTabIndexNotNaN
  ) && DOMisVisible(element)
}
function DOMisVisible(element) {
  while (element) {
    if (element === document.body) break
    if (DOMisHidden(element)) return false
    element = element.parentNode
  }
  return true
}
function DOMisHidden(el) {
  return (el.offsetWidth <= 0 && el.offsetHeight <= 0) || el.style.display === 'none'
}

/**
 * Tell the brower to save something as file
 * @param {string} content
 * @param {string} type e.g. text/csv;charset=utf-8
 * @param {string} name Suggested filename
 */
export function saveAs(content, type, name) {
  let file = new window.Blob([content], {type})
  if (typeof window.navigator.msSaveBlob == 'function') {
    window.navigator.msSaveBlob(file, name)
  }
  else {
    let href = window.URL.createObjectURL(file)
    let anchor = document.createElement('a')
    anchor.href = href
    anchor.download = name
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(href)
  }
}

/**
 * Dynamically load some javascript file
 * @param {string} url
 * @return {Promise}
 */
export function loadJS(url) {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script')
    script.onerror = () => reject(new Error('dynamic script loading failed'))
    script.onload = () => resolve()
    script.async = true
    script.src = url
    document.head.appendChild(script)
  })
}

/**
 * A.K.A sigma-squared (σ²), standard deviation squared
 * @param {number[]} values
 * @return {number}
 */
export function variance(values) {
  let avg = mean(values)
  let squares = new Array(values.length)
  for (let index = 0; index < squares.length; index++) {
    let diff = values[index] - avg
    squares[index] = diff * diff
  }
  return mean(squares) || 0
}

export function getPermissions(org, user, course) {
  let isAdmin = (org && org.role === 'admin')
    || (course &&
      (course.instructors && course.instructors.length > 0 && course.instructors.indexOf(user.email) !== -1 ))
    || (course && course.aides && course.aides.indexOf(user.email) !== -1)
  let isUnlicensedStudent = org.license === 'deferred' && !isAdmin && (
    user.license == null
    || (user.license === 'trial' && user.currentPeriodEnd < new Date().toISOString())
  )
  let isTrialOrg = org.license == null
  let isTeacherOrg = org.license === 'teacher'
  if (process.env.ENABLE_BILLING !== 'true') {
    isUnlicensedStudent = false
    isTrialOrg = false
    isTeacherOrg = false
  }
  let isMultiUser = org.license === 'deferred'
    || org.license === 'custom'
  if (process.env.ENABLE_BILLING !== 'true') isMultiUser = true
  return {
    isAdmin,
    isUnlicensedStudent,
    isTrialOrg,
    isTeacherOrg,
    isMultiUser,
  }
}
