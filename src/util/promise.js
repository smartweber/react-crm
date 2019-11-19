import Promise from 'bluebird'
export default Promise

// As of bluebird@3.0.5 Promise.prototype.cancel() is disabled by default
// Anything that needs to create cancel-able Promises should use this module
// to ensure proper configuration.
Promise.config({
  longStackTraces: process.env.NODE_ENV !== 'production',
  warnings: process.env.NODE_ENV !== 'production',
  cancellation: true
})

/**
 * Wrap a promise-returning function with some memory
 * to make sure that only the most recent in-progress value is resolved.
 * Use this to avoid out-of-order results with something like search-suggestions.
 */
Promise.last = function resolveLatest(fn) {
  var lastAdded, pending, resolve, reject
  const done = (promise, err, val) => {
    if (promise === lastAdded) {
      pending = null
      if (err) reject(err)
      else resolve(val)
    }
  }
  return (...args) => {
    if (lastAdded) lastAdded.cancel()
    lastAdded = fn(...args)
    if (!pending) pending = new Promise((_res, _rej) => {
      resolve = _res
      reject = _rej
    })
    lastAdded.asCallback(done.bind(null, lastAdded))
    return pending
  }
}
