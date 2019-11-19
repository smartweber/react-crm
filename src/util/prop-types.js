import PropTypes from 'prop-types'
import {assign} from 'lodash'

function date(props, propName, componentName) {
  let value = props[propName]
  if (value == null || typeof value.getHours !== 'function') {
    return new Error(`${componentName}: ${propName} must be a Date object, instead of ${JSON.stringify(props[propName])}`)
  }
}

function dateString(props, propName, componentName) {
  if (!/^\d\d\d\d-\d\d-\d\d$/.test(props[propName])) {
    return new Error(`${componentName}: ${propName} must be a a string of the form "yyyy-mm-dd", instead of ${JSON.stringify(props[propName])}`)
  }
}

function timeString(props, propName, componentName) {
  if (!/^\d\d:\d\d:\d\d$/.test(props[propName])) {
    return new Error(`${componentName}: ${propName} must be a a string of the form "HH-MM-SS", instead got ${JSON.stringify(props[propName])}`)
  }
}

export default assign({}, PropTypes, {
  date,
  dateString,
  timeString,
})
