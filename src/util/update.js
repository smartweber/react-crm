import {assign} from 'lodash'
const hasOwnProperty = {}.hasOwnProperty
const COMMAND_PUSH = '$push'
const COMMAND_UNSHIFT = '$unshift'
const COMMAND_SPLICE = '$splice'
const COMMAND_SET = '$set'
const COMMAND_MERGE = '$merge'
const COMMAND_APPLY = '$apply'
const ALL_COMMANDS_LIST = [COMMAND_PUSH, COMMAND_UNSHIFT, COMMAND_SPLICE, COMMAND_SET, COMMAND_MERGE, COMMAND_APPLY]
const ALL_COMMANDS_SET = {}
ALL_COMMANDS_LIST.forEach(command => ALL_COMMANDS_SET[command] = true)

/**
 * Returns a updated shallow copy of an object without mutating the original.
 * @see https://facebook.github.io/react/docs/update.html
 * - {$push: array} push() all the items in array on the target
 *
 * - {$unshift: array} unshift() all the items in array on the target
 *
 * - {$splice: array of arrays} for each item in arrays call splice()
 *   on the target with the parameters provided by the item
 *
 * - {$set: any} replace the target entirely
 *
 * - {$merge: object} merge the keys of object with the target
 *
 * - {$apply: function} passes in the current value to the function
 *   and updates it with the new returned value
 *
 * @example
 *   let state = {items: [1,2,3]}
 *   update(state, {items: {$push: [4]}}) => {items: [1,2,3,4]}
 */
export default function update(value, spec) {
  if (hasOwnProperty.call(spec, COMMAND_SET)) {
    return spec[COMMAND_SET]
  }
  let nextValue = shallowCopy(value)
  if (hasOwnProperty.call(spec, COMMAND_MERGE)) {
    assign(nextValue, spec[COMMAND_MERGE])
  }
  if (hasOwnProperty.call(spec, COMMAND_PUSH)) {
    spec[COMMAND_PUSH].forEach(function (item) {
      nextValue.push(item)
    })
  }
  if (hasOwnProperty.call(spec, COMMAND_UNSHIFT)) {
    spec[COMMAND_UNSHIFT].forEach(function (item) {
      nextValue.unshift(item)
    })
  }
  if (hasOwnProperty.call(spec, COMMAND_SPLICE)) {
    spec[COMMAND_SPLICE].forEach(function (args) {
      nextValue.splice.apply(nextValue, args)
    })
  }
  if (hasOwnProperty.call(spec, COMMAND_APPLY)) {
    nextValue = spec[COMMAND_APPLY](nextValue)
  }
  for (let k in spec) {
    if (!(ALL_COMMANDS_SET.hasOwnProperty(k) && ALL_COMMANDS_SET[k])) {
      nextValue[k] = update(value[k], spec[k])
    }
  }
  return nextValue
}

function shallowCopy(x) {
  if (Array.isArray(x)) {
    return x.concat()
  }
  else if (x && typeof x === 'object') {
    return assign(new x.constructor(), x)
  }
  else {
    return x
  }
}
