import {pick} from 'lodash'
import request from './request'
import Promise from '../util/promise'
import honeybee from 'honeybee'

/**
 * Generate an API request method
 * @param {function} url(props) => string
 * @param {string[]|object|function?} query Allowed query-string params
 * @param {string[]|object|function?} body Allowed POST/PATCH body params
 * @param {string[]?} required
 * @param {function?} transformResponse(res, props) => bodyObject
 * @param {function?} transformRequest(props) => props
 *
 * If `query` or `body` is a function then it should take the form: `(props) => object`
 * If `query` or `body` is an object then it will be used to transform property names.
 * e.g. `{prop1: 'x', prop2: 'y'}` will transform `({prop1: true, prop2: 11}) => {x: true, y: 11}`
 */
export default (config) => {
  if (typeof config == 'function') return config
  let pickQuery = getPicker(config.query)
  let pickBody = getPicker(config.body)
  /**
   * Configured API request
   * @param {object} props
   * @return {Promise} => parsedResponseBody
   */
  return function (props) {
    if (config.required) for (let index = 0; index < config.required.length; index++) {
      let propName = config.required[index]
      if (!props[propName]) {
        return Promise.reject(new honeybee.Error(400, `.${propName} is null or undefined`))
      }
    }
    if (config.transformRequest) {
      props = config.transformRequest(props)
    }
    let pending
    if (typeof config.example == 'function') {
      pending = new Promise(resolve => setTimeout(() => resolve(config.example.call(this, props)), 1000))
    }
    else pending = request({
      auth: this.auth,
      url: typeof config.url == 'function' ? config.url(props, this.auth) : config.url,
      query: pickQuery(props, config.query),
      body: pickBody(props, config.body),
      method: config.method,
      headers: config.headers,
      parseResponse: config.parseResponse,
      low: config.low,
      high: config.high,
      timeout: config.timeout,
      serialize: config.serialize,
    })
    if (config.transformResponse) {
      return pending.then(res => config.transformResponse(res, props))
    }
    else {
      return pending.then(res => res.body)
    }
  }
}

function getPicker(val) {
  if (typeof val == 'function') return val
  if (Array.isArray(val)) return pick
  if (val) return transform
  return Function.prototype
}

function transform(src, keys) {
  let acc = {}
  for (let lk in keys) if (keys.hasOwnProperty(lk)) {
    acc[keys[lk]] = src[lk]
  }
  return acc
}
