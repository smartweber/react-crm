/* eslint no-console: 0 */
import {omit} from 'lodash'
const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
}
const CONSOLE_LEVEL = LEVELS[process.env.LOG_LEVEL]
const RESERVED_PROPS = ['msg', 'err']
const toConsole = (typeof console === 'undefined') ? Function.prototype
  : function (rec) {
    const method = rec.level === 30 ? 'info'
      : rec.level === 40 ? 'warn'
      : rec.level > 40 ? 'error'
      : 'log'
    console[method](rec.msg, rec.props || '', rec.err ? '\n' + rec.err : '')
  }
const stringifyError = process.env.NODE_ENV === 'production'
  ? err => err.toString() // perf: stack from a minified bundle is less than useless
  : err => err.stack
const logger = {}
Object.keys(LEVELS).forEach(name => logger[name] = createMethod(LEVELS[name]))

/**
 * Create a log method for the given level
 * @param {number} level
 */
function createMethod(level) {
  if (level < CONSOLE_LEVEL) return Function.prototype
  return function createRecord(props, msg) {
    let err = null
    if (typeof props === 'string') {
      msg = props
      props = null
    }
    if (typeof msg !== 'string') msg = ''
    if (props instanceof Error) {
      err = stringifyError(props)
      props = null
    }
    else if (props && typeof props === 'object') {
      if (!msg && typeof props.msg === 'string') msg = props.msg
      if (props.err instanceof Error) err = stringifyError(props.err)
      props = omit(props, RESERVED_PROPS)
      if (!Object.keys(props).length) props = null
    }
    let rec = {level, msg, props, err}

    toConsole(rec)
    // if (rec.level >= LEVELS.warn) toLoggly(rec)
  }
}

/**
 * Lightweight, general purpose logging module
 * @example logger.info('Hello, World!')
 * @example logger.warn(new Error('bad news'), 'something failed')
 * @example logger.error({err: new Error('bad news'), msg: 'something failed'})
 * @example logger.debug({foo: true}, 'stuff')
 * @func logger[level](props, msg)
 * @param {object|Error?} props
 * @param {string} msg
 */
export default logger
