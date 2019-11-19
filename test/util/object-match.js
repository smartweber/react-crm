/**
 * Loose alternative to assert.deepEquals
 * Useful when comparing shallow trees of immutable React elements
 * @see tapjs/tmatch#v2.0.1
 * @param {object} actual
 * @param {object} expected
 * @example match({foo: 1, bar: 2}, {foo: 1}) === true
 */
export default function match(actual, expected) {
  return match_(actual, expected, [], [])
}

function match_(actual, expected, ca, cb) {
  if (actual == expected) { // eslint-disable-line eqeqeq
    // if one is object, and the other isn't, then this is bogus
    if (actual === null || expected === null) return true
    else if (typeof actual === 'object' && typeof expected === 'object') return true
    else if (typeof actual === 'object' && typeof expected !== 'object') return false
    else if (typeof actual !== 'object' && typeof expected === 'object') return false
    else return true
  }
  else if (actual === null || expected === null) {
    return false
  }
  else if (typeof actual === 'string' && expected instanceof RegExp) {
    return expected.test(actual)
  }
  else if (typeof actual === 'string' && typeof expected === 'string' && expected) {
    return actual.indexOf(expected) !== -1
  }
  else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime()
  }
  else if (actual instanceof Date && typeof expected === 'string') {
    return actual.getTime() === new Date(expected).getTime()
  }
  else if (isArguments(actual) || isArguments(expected)) {
    var slice = Array.prototype.slice
    return match_(slice.call(actual), slice.call(expected), ca, cb)
  }
  else if (expected === Buffer) {
    return Buffer.isBuffer(actual)
  }
  else if (expected === Function) {
    return typeof actual === 'function'
  }
  else if (expected === Number) {
    return typeof actual === 'number' && actual === actual && isFinite(actual)
  }
  else if (expected !== expected) {
    return actual !== actual
  }
  else if (expected === String) {
    return typeof actual === 'string'
  }
  else if (expected === Boolean) {
    return typeof actual === 'boolean'
  }
  else if (expected === Array) {
    return Array.isArray(actual)
  }
  else if (typeof expected === 'function' && typeof actual === 'object') {
    return actual instanceof expected
  }
  else if (typeof actual !== 'object' || typeof expected !== 'object') {
    return false
  }
  else if (actual instanceof RegExp && expected instanceof RegExp) {
    return actual.source === expected.source
    && actual.global === expected.global
    && actual.multiline === expected.multiline
    && actual.lastIndex === expected.lastIndex
    && actual.ignoreCase === expected.ignoreCase
  }
  else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.equals) {
      return actual.equals(expected)
    }
    else {
      if (actual.length !== expected.length) return false
      for (var j = 0; j < actual.length; j++) {
        if (actual[j] != expected[j]) return false // eslint-disable-line eqeqeq
      }
      return true
    }
  }
  else {
    // both are objects.  interesting case!
    var kobj = Object.keys(actual)
    var kpat = Object.keys(expected)

    // don't bother with stack acrobatics if there's nothing there
    if (kobj.length === 0 && kpat.length === 0) return true

    // if we've seen this exact pattern and object already, then
    // it means that "expected" and "actual" have matching cyclicalness
    // however, non-cyclical patterns can match cyclical objects
    var cal = ca.length
    while (cal--) if (ca[cal] === actual && cb[cal] === expected) return true
    ca.push(actual); cb.push(expected)

    var key
    for (var l = kpat.length - 1; l >= 0; l--) {
      key = kpat[l]
      if (!match_(actual[key], expected[key], ca, cb)) return false
    }

    ca.pop()
    cb.pop()
    return true
  }
}

function isArguments(obj) {
  return Object.prototype.toString.call(obj) === '[object Arguments]'
}
