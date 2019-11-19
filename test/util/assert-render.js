import {isValidElement, Children} from 'react'
import tmatch from './object-match'
import inspectElement from './inspect-element'
import {AssertionError} from 'assert'

/**
 * Compare two React elements; use this to assert the correct output of shallow rendering
 * The trees are compared loosely:
 * - any props in the EXPECTED tree which are not found in the ACTUAL tree will throw an error
 * - extra props in the ACTUAL tree are ignored
 * - EXPECTED tree may be found nested within the ACTUAL tree, e.g. <div> wrapper tags won't err
 * - <ul> <li> {[<li>, ...]}</ul> != <ul><li><li><li></ul> even though the HTML would be the same
 * @param {React.Element} actual
 * @param {React.Element} expected
 * @param {string?} message
 */
export function containsElement(actual, expected, message) {
  let found = findElements(actual, function (el) {
    return (!expected.type || el.type === expected.type)
    && tmatch(el.props, expected.props)
  })
  if (!found.length) throw new AssertionError({
    message: message || 'React tree mismatch',
    actual: inspectElement(actual),
    expected: inspectElement(expected),
    stackStartFunction: containsElement
  })
}


/**
 * Traverses the tree and returns all elements that satisfy the test function
 * @param {React.Element} tree
 * @param {function} test(el) the test for each component
 * @return {array} list of Elements
 */
export function findElements(tree, test) {
  let found = tree && test(tree) ? [tree] : []
  if (isValidElement(tree)) Children.forEach(tree.props.children, function (child) {
    found = found.concat(findElements(child, test))
  })
  return found
}

export function findElementsByType(tree, name) {
  return findElements(tree, el => el.type === name)
}
